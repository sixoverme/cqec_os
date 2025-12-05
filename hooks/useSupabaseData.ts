import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Wave, Domain, Role, User, Blip, Gadget, ProposalMetadata } from '../types';
import { updateBlipInTree, addChildToBlip, deleteBlipFromTree } from '../utils';

// Helper to convert DB blip to App Blip structure
const convertDbBlipToAppBlip = (dbBlip: any): Blip => ({
  id: dbBlip.id,
  authorId: dbBlip.author_id,
  content: dbBlip.content,
  timestamp: Number(dbBlip.timestamp),
  lastEdited: dbBlip.last_edited ? Number(dbBlip.last_edited) : undefined,
  lastEditorId: dbBlip.last_editor_id,
  gadgets: dbBlip.gadgets as Gadget[] || undefined,
  isReadOnly: dbBlip.is_read_only,
  children: [] // Children will be populated during tree building
});

// Helper to build blip tree from flat list
const buildBlipTree = (flatBlips: any[], rootBlipId: string | null = null): Blip | null => {
  const blipMap: Record<string, Blip> = {};
  const rootBlips: Blip[] = [];

  flatBlips.forEach(dbBlip => {
    blipMap[dbBlip.id] = convertDbBlipToAppBlip(dbBlip);
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

      // Fetch Roles
      const { data: rolesData } = await supabase.from('roles').select('*');
      setRoles(rolesData?.map((r: any) => ({
          id: r.id, name: r.name, domainId: r.domain_id, description: r.description,
          holderIds: r.holder_ids || [], termEnd: r.term_end
      })) || []);

      // Fetch Waves & all Blips (to reconstruct trees)
      const { data: wavesData } = await supabase.from('waves').select('*').order('last_activity', { ascending: false });
      const { data: participantsData } = await supabase.from('wave_participants').select('*');
      const { data: blipsData } = await supabase.from('blips').select('*').order('timestamp', { ascending: true });

      const loadedWaves: Wave[] = [];
      wavesData?.forEach(w => {
          const waveParticipants = participantsData?.filter((p: any) => p.wave_id === w.id) || [];
          const participantIds = waveParticipants.map((p: any) => p.user_id);
          const myParticipantEntry = waveParticipants.find((p: any) => p.user_id === currentUserProfile.id);
          const isRead = myParticipantEntry ? myParticipantEntry.is_read : false;

          const waveBlips = blipsData?.filter((b: any) => b.wave_id === w.id) || [];
          const rootBlip = buildBlipTree(waveBlips);
          
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
    if (!currentUserProfile) return;

    const subscriptions: any[] = [];

    // Profiles
    const profilesChannel = supabase.channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, payload => {
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
      })
      .subscribe();
    subscriptions.push(profilesChannel);

    // Domains
    const domainsChannel = supabase.channel('public:domains')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'domains' }, payload => {
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
      })
      .subscribe();
    subscriptions.push(domainsChannel);

    // Roles
    const rolesChannel = supabase.channel('public:roles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roles' }, payload => {
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
      })
      .subscribe();
    subscriptions.push(rolesChannel);

    // Waves and Blips (More complex due to tree structure)
    // For simplicity, we'll re-fetch affected wave data when a blip or wave changes
    // A more optimized approach would be to update the tree directly without re-fetching all blips for a wave.
    const wavesBlipsChannel = supabase.channel('public:waves_blips_participants')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waves' }, async payload => {
        // For wave changes, re-fetch all data related to waves
        console.log("Realtime: Wave change detected. Re-fetching waves data.");
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blips' }, async payload => {
        // For blip changes, re-fetch all data related to waves
        console.log("Realtime: Blip change detected. Re-fetching waves data.");
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wave_participants' }, async payload => {
        // For participant changes, re-fetch all data related to waves
        console.log("Realtime: Wave Participant change detected. Re-fetching waves data.");
        fetchData();
      })
      .subscribe();
    subscriptions.push(wavesBlipsChannel);

    return () => {
      subscriptions.forEach(sub => supabase.removeChannel(sub));
    };
  }, [currentUserProfile, fetchData]); // Depend on fetchData and currentUserProfile

  return { waves, domains, roles, users, loading, refresh: fetchData };
};