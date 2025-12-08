import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Wave, Domain, Role, User, Blip, Gadget, ProposalMetadata, BlipVersion, DomainMember } from '../types';
import { updateBlipInTree, addChildToBlip, deleteBlipFromTree } from '../utils';

// Helper to convert DB blip to App Blip structure
const convertDbBlipToAppBlip = (dbBlip: any, versions: BlipVersion[] = []): Blip => ({
  id: dbBlip.id,
  authorId: dbBlip.author_id,
  content: dbBlip.content,
  timestamp: Number(dbBlip.timestamp),
  lastEdited: dbBlip.last_edited ? Number(dbBlip.last_edited) : undefined,
  lastEditorId: dbBlip.last_editor_id,
  gadgets: dbBlip.gadgets as Gadget[] || undefined,
  isReadOnly: dbBlip.is_read_only,
  deletedAt: dbBlip.deleted_at ? new Date(dbBlip.deleted_at).getTime() : undefined,
  versions: versions.filter(v => v.blipId === dbBlip.id),
  children: [] // Children will be populated during tree building
});

// Helper to build blip tree from flat list
const buildBlipTree = (flatBlips: any[], flatVersions: BlipVersion[], rootBlipId: string | null = null): Blip | null => {
  const blipMap: Record<string, Blip> = {};
  const rootBlips: Blip[] = [];

  flatBlips.forEach(dbBlip => {
    blipMap[dbBlip.id] = convertDbBlipToAppBlip(dbBlip, flatVersions);
  });

  flatBlips.forEach(dbBlip => {
    if (dbBlip.parent_id && blipMap[dbBlip.parent_id]) {
      blipMap[dbBlip.parent_id].children.push(blipMap[dbBlip.id]);
    } else if (!dbBlip.parent_id) {
      rootBlips.push(blipMap[dbBlip.id]);
    }
  });

  if (rootBlipId) {
    return blipMap[rootBlipId] || null;
  }
  // For a single rootBlip wave, just return the first root found.
  // In our case, each wave has one rootBlip with parent_id = null.
  return rootBlips.length > 0 ? rootBlips[0] : null;
};


export const useSupabaseData = (currentUserProfile: User | null) => {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [circleMemberships, setCircleMemberships] = useState<DomainMember[]>([]); // NEW
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  // --- Initial Data Fetch ---
  const fetchData = useCallback(async () => {
    if (!currentUserProfile) return;
    setLoading(true);

    try {
      // Fetch Users (Profiles)
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const userMap: Record<string, User> = {};
      profilesData?.forEach((p: any) => {
          userMap[p.id] = {
              id: p.id, name: p.name, handle: p.handle, email: p.email, avatar: p.avatar_url,
              bio: p.bio, status: p.status, capacity: p.capacity, accessNeeds: p.access_needs,
              isRobot: p.is_robot, color: p.color
          };
      });
      setUsers(userMap);

      // Fetch Domains
      const { data: domainsData } = await supabase.from('domains').select('*');
      setDomains(domainsData?.map((d: any) => ({
          id: d.id, name: d.name, color: d.color, description: d.description, parentId: d.parent_id
      })) || []);

      // Fetch Domain Memberships (NEW)
      const { data: membersData } = await supabase.from('domain_members').select('*');
      setCircleMemberships(membersData?.map((m: any) => ({
          domainId: m.domain_id, userId: m.user_id
      })) || []);

      // Fetch Roles
      const { data: rolesData } = await supabase.from('roles').select('*');
      setRoles(rolesData?.map((r: any) => ({
          id: r.id, name: r.name, domainId: r.domain_id, description: r.description,
          holderIds: r.holder_ids || [], termEnd: r.term_end
      })) || []);

      // Fetch Waves & all Blips (including soft deleted ones for playback)
      const { data: wavesData } = await supabase.from('waves').select('*').order('last_activity', { ascending: false });
      const { data: participantsData } = await supabase.from('wave_participants').select('*');
      
      // Note: We intentionally fetch ALL blips, including soft-deleted ones, to support playback
      const { data: blipsData } = await supabase.from('blips').select('*').order('timestamp', { ascending: true });
      
      // Fetch Blip Versions
      const { data: versionsData } = await supabase.from('blip_versions').select('*').order('created_at', { ascending: true });
      const versions: BlipVersion[] = versionsData?.map((v: any) => ({
          id: v.id,
          blipId: v.blip_id,
          content: v.content,
          createdAt: new Date(v.created_at).getTime(),
          editorId: v.editor_id
      })) || [];

      const loadedWaves: Wave[] = [];
      wavesData?.forEach(w => {
          const waveParticipants = participantsData?.filter((p: any) => p.wave_id === w.id) || [];
          const participantIds = waveParticipants.map((p: any) => p.user_id);
          const myParticipantEntry = waveParticipants.find((p: any) => p.user_id === currentUserProfile.id);
          const isRead = myParticipantEntry ? myParticipantEntry.is_read : false;

          const waveBlips = blipsData?.filter((b: any) => b.wave_id === w.id) || [];
          const rootBlip = buildBlipTree(waveBlips, versions);
          
          if (rootBlip) {
              loadedWaves.push({
                  id: w.id, title: w.title, participantIds, rootBlip,
                  folder: w.folder as Wave['folder'], tags: w.tags || [], isRead,
                  isPinned: w.is_pinned, lastActivity: Number(w.last_activity), parentId: w.parent_id,
                  isDM: w.is_dm, type: w.type as Wave['type'], domainId: w.domain_id,
                  proposalMetadata: w.proposal_metadata as ProposalMetadata
              });
          }
      });
      setWaves(loadedWaves);

    } catch (e) {
      console.error("Error loading initial data:", e);
    } finally {
      setLoading(false);
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (currentUserProfile) {
      fetchData(); // Initial fetch
    }
  }, [currentUserProfile, fetchData]);

  // --- Realtime Subscriptions ---
  useEffect(() => {
    if (!currentUserProfile) {
      console.log('Realtime: currentUserProfile not available, skipping subscriptions.');
      return;
    }

    console.log('Realtime: Attempting to subscribe to channels for user:', currentUserProfile.id);
    const subscriptions: any[] = [];

    const subscribeToChannel = (channelName: string, table: string, handler: (payload: any) => void) => {
        const channel = supabase.channel(channelName)
            .on('postgres_changes', { event: '*', schema: 'public', table: table }, payload => {
                console.log(`Realtime: Event on ${table} received. Event Type: ${payload.eventType}, Data:`, payload.new || payload.old);
                handler(payload);
            })
            .on('channel_state', (state) => {
                console.log(`Realtime: Channel '${channelName}' state:`, state);
            })
            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log(`Realtime: Successfully SUBSCRIBED to channel '${channelName}' for table '${table}'.`);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error(`Realtime: Error in channel '${channelName}' for table '${table}':`, err);
                } else if (status === 'CLOSED') {
                    console.log(`Realtime: Channel '${channelName}' for table '${table}' CLOSED.`);
                }
            });
        subscriptions.push(channel);
    };

    // Profiles
    subscribeToChannel('public:profiles', 'profiles', payload => {
        setUsers(prevUsers => {
            const newUsers = { ...prevUsers };
            const p = payload.new || payload.old;
            const user: User = {
                id: p.id, name: p.name, handle: p.handle, email: p.email, avatar: p.avatar_url,
                bio: p.bio, status: p.status, capacity: p.capacity, accessNeeds: p.access_needs,
                isRobot: p.is_robot, color: p.color
            };
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                newUsers[user.id] = user;
            } else if (payload.eventType === 'DELETE') {
                delete newUsers[user.id];
            }
            return newUsers;
        });
    });

    // Domains
    subscribeToChannel('public:domains', 'domains', payload => {
        setDomains(prevDomains => {
            const newDomains = [...prevDomains];
            const d = payload.new || payload.old;
            const domain: Domain = {
                id: d.id, name: d.name, color: d.color, description: d.description, parentId: d.parent_id
            };
            if (payload.eventType === 'INSERT') {
                newDomains.push(domain);
            } else if (payload.eventType === 'UPDATE') {
                const index = newDomains.findIndex(dm => dm.id === domain.id);
                if (index !== -1) newDomains[index] = domain;
            } else if (payload.eventType === 'DELETE') {
                return newDomains.filter(dm => dm.id !== domain.id);
            }
            return newDomains;
        });
    });

    // Domain Members (NEW)
    subscribeToChannel('public:domain_members', 'domain_members', payload => {
        setCircleMemberships(prev => {
            const newMembers = [...prev];
            const m = payload.new || payload.old;
            if (payload.eventType === 'INSERT') {
                newMembers.push({ domainId: m.domain_id, userId: m.user_id });
            } else if (payload.eventType === 'DELETE') {
                return newMembers.filter(mem => !(mem.domainId === m.domain_id && mem.userId === m.user_id));
            }
            return newMembers;
        });
    });

    // Roles
    subscribeToChannel('public:roles', 'roles', payload => {
        setRoles(prevRoles => {
            const newRoles = [...prevRoles];
            const r = payload.new || payload.old;
            const role: Role = {
                id: r.id, name: r.name, domainId: r.domain_id, description: r.description,
                holderIds: r.holder_ids || [], termEnd: r.term_end
            };
            if (payload.eventType === 'INSERT') {
                newRoles.push(role);
            } else if (payload.eventType === 'UPDATE') {
                const index = newRoles.findIndex(rl => rl.id === role.id);
                if (index !== -1) newRoles[index] = role;
            } else if (payload.eventType === 'DELETE') {
                return newRoles.filter(rl => rl.id !== role.id);
            }
            return newRoles;
        });
    });

    // Waves, Blips, Participants, Versions - re-fetch strategy
    subscribeToChannel('public:waves', 'waves', async payload => {
        console.log("Realtime: Wave change detected. Triggering full waves data re-fetch.");
        await fetchData();
    });
    subscribeToChannel('public:blips', 'blips', async payload => {
        console.log("Realtime: Blip change detected. Triggering full waves data re-fetch.");
        await fetchData();
    });
    subscribeToChannel('public:wave_participants', 'wave_participants', async payload => {
        console.log("Realtime: Wave Participant change detected. Triggering full waves data re-fetch.");
        await fetchData();
    });
    subscribeToChannel('public:blip_versions', 'blip_versions', async payload => {
        console.log("Realtime: Blip Version change detected. Triggering full waves data re-fetch.");
        await fetchData();
    });


    return () => {
      console.log('Realtime: Unsubscribing from channels.');
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, [currentUserProfile, fetchData]);

  return { waves, domains, circleMemberships, roles, users, loading, refresh: fetchData };
};