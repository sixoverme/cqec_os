
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Wave, Domain, Role, User, Blip, Gadget, ProposalMetadata } from '../types';

export const useSupabaseData = (currentUserProfile: User | null) => {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!currentUserProfile) return;
    setLoading(true);

    try {
      // 1. Fetch Users (Profiles)
      const { data: profilesData } = await supabase.from('profiles').select('*');
      const userMap: Record<string, User> = {};
      if (profilesData) {
        profilesData.forEach((p: any) => {
          userMap[p.id] = {
            id: p.id,
            name: p.name,
            handle: p.handle,
            email: p.email,
            avatar: p.avatar_url,
            bio: p.bio,
            status: p.status,
            capacity: p.capacity,
            accessNeeds: p.access_needs,
            isRobot: p.is_robot,
            color: p.color
          };
        });
        setUsers(userMap);
      }

      // 2. Fetch Domains
      const { data: domainsData } = await supabase.from('domains').select('*');
      if (domainsData) {
        setDomains(domainsData.map((d: any) => ({
          id: d.id,
          name: d.name,
          color: d.color,
          description: d.description,
          parentId: d.parent_id
        })));
      }

      // 3. Fetch Roles
      const { data: rolesData } = await supabase.from('roles').select('*');
      if (rolesData) {
        setRoles(rolesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          domainId: r.domain_id,
          description: r.description,
          holderIds: r.holder_ids || [],
          termEnd: r.term_end
        })));
      }

      // 4. Fetch Waves & Blips (The heavy part)
      const { data: wavesData } = await supabase.from('waves').select('*').order('last_activity', { ascending: false });
      
      if (wavesData) {
        const loadedWaves: Wave[] = [];
        
        // Fetch participants for all waves
        const { data: participantsData } = await supabase.from('wave_participants').select('*');
        
        // Fetch ALL blips (optimized: fetch all then distribute)
        // In a real app, we might only fetch active waves, but here we fetch all
        const { data: blipsData } = await supabase.from('blips').select('*').order('timestamp', { ascending: true });

        for (const w of wavesData) {
          // Participants
          const waveParticipants = participantsData?.filter((p: any) => p.wave_id === w.id) || [];
          const participantIds = waveParticipants.map((p: any) => p.user_id);
          
          // Find 'isRead' for current user
          const myParticipantEntry = waveParticipants.find((p: any) => p.user_id === currentUserProfile.id);
          const isRead = myParticipantEntry ? myParticipantEntry.is_read : false;

          // Build Blip Tree
          const waveBlips = blipsData?.filter((b: any) => b.wave_id === w.id) || [];
          
          // Helper to convert DB blip to App Blip
          const convertBlip = (b: any): Blip => ({
            id: b.id,
            authorId: b.author_id,
            content: b.content,
            timestamp: Number(b.timestamp), // BigInt to Number
            lastEdited: b.last_edited ? Number(b.last_edited) : undefined,
            lastEditorId: b.last_editor_id,
            gadgets: b.gadgets as Gadget[] || undefined,
            isReadOnly: b.is_read_only,
            children: []
          });

          const blipMap: Record<string, Blip> = {};
          let rootBlip: Blip | null = null;

          // First pass: create objects
          waveBlips.forEach((b: any) => {
            blipMap[b.id] = convertBlip(b);
          });

          // Second pass: link children
          waveBlips.forEach((b: any) => {
            if (b.parent_id) {
              if (blipMap[b.parent_id]) {
                blipMap[b.parent_id].children.push(blipMap[b.id]);
              }
            } else {
              // It's a root
              // If multiple roots exist (shouldn't), we might have an issue, but we take the first one found or specific logic
              if (!rootBlip) rootBlip = blipMap[b.id];
            }
          });

          // Fallback if no root found (broken data)
          if (!rootBlip) {
             // Create a dummy root?
             continue; 
          }

          loadedWaves.push({
            id: w.id,
            title: w.title,
            participantIds,
            rootBlip: rootBlip,
            folder: w.folder as Wave['folder'],
            tags: w.tags || [],
            isRead,
            isPinned: w.is_pinned,
            lastActivity: Number(w.last_activity),
            parentId: w.parent_id,
            isDM: w.is_dm,
            type: w.type as Wave['type'],
            domainId: w.domain_id,
            proposalMetadata: w.proposal_metadata as ProposalMetadata
          });
        }
        setWaves(loadedWaves);
      }

      setLoading(false);
    } catch (e) {
      console.error("Error loading data:", e);
      setLoading(false);
    }
  }, [currentUserProfile]);

  useEffect(() => {
    if (currentUserProfile) {
      fetchData();
    }
  }, [currentUserProfile, fetchData]);

  // TODO: Realtime subscriptions
  
  return { waves, domains, roles, users, loading, refresh: fetchData };
};
