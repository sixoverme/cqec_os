
import React, { useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';
import { MOCK_USERS, INITIAL_WAVES, DOMAINS, MOCK_ROLES } from '../mockData';
import { Gadget } from '../types';

export const DevSeeder: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => setLog(prev => [...prev, msg]);

  const seed = async () => {
    if (!supabaseAdmin) {
      addLog("Error: No Service Role Key found.");
      return;
    }
    setLoading(true);
    setLog([]);
    
    try {
      addLog("Starting seed...");
      
      // 1. USERS
      const userMap: Record<string, string> = {}; // oldId -> newUuid
      
      for (const oldId in MOCK_USERS) {
        const u = MOCK_USERS[oldId];
        addLog(`Creating user: ${u.name} (${u.email})`);
        
        // Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: u.email,
          password: 'password', // Default password for all
          email_confirm: true,
          user_metadata: {
            full_name: u.name,
            avatar_url: u.avatar
          }
        });

        if (authError) {
            addLog(`Error creating user ${u.email}: ${authError.message}`);
            // Try to find existing?
            // For now, assume fresh DB or unique emails
            continue;
        }

        if (authData.user) {
            userMap[oldId] = authData.user.id;
            // Update Profile (Trigger might have created it, we update extra fields)
            await supabaseAdmin.from('profiles').update({
                handle: u.handle,
                bio: u.bio,
                status: u.status,
                capacity: u.capacity,
                access_needs: u.accessNeeds,
                color: u.color,
                is_robot: u.isRobot || false
            }).eq('id', authData.user.id);
        }
      }
      addLog(`Created ${Object.keys(userMap).length} users.`);

      // 2. DOMAINS
      const domainMap: Record<string, string> = {}; // oldId -> newUuid
      
      // Sort domains so parents are created first (simple topo sort: general first)
      const sortedDomains = [...DOMAINS].sort((a, b) => {
          if (a.parentId && !b.parentId) return 1;
          if (!a.parentId && b.parentId) return -1;
          return 0;
      });

      for (const d of sortedDomains) {
          const newId = crypto.randomUUID();
          domainMap[d.id] = newId;
          
          const { error } = await supabaseAdmin.from('domains').insert({
              id: newId,
              name: d.name,
              color: d.color,
              description: d.description,
              parent_id: d.parentId ? domainMap[d.parentId] : null
          });
          if (error) addLog(`Error domain ${d.name}: ${error.message}`);
      }
      addLog(`Created ${Object.keys(domainMap).length} domains.`);

      // 3. ROLES
      for (const r of MOCK_ROLES) {
          const newId = crypto.randomUUID();
          const mappedHolders = r.holderIds.map(hid => userMap[hid]).filter(Boolean);
          
          await supabaseAdmin.from('roles').insert({
              id: newId,
              name: r.name,
              domain_id: domainMap[r.domainId],
              description: r.description,
              holder_ids: mappedHolders
          });
      }
      addLog("Created roles.");

      // 4. WAVES & BLIPS
      for (const w of INITIAL_WAVES) {
          const waveId = crypto.randomUUID();
          addLog(`Creating wave: ${w.title}`);

          // Insert Wave
          const { error: waveError } = await supabaseAdmin.from('waves').insert({
              id: waveId,
              title: w.title,
              type: w.type,
              folder: w.folder,
              is_pinned: w.isPinned || false,
              last_activity: w.lastActivity,
              is_dm: w.isDM || false,
              domain_id: w.domainId ? domainMap[w.domainId] : null,
              proposal_metadata: w.proposalMetadata ? JSON.stringify(w.proposalMetadata) : null,
              tags: w.tags
          });

          if (waveError) {
              addLog(`Error wave ${w.title}: ${waveError.message}`);
              continue;
          }

          // Insert Participants
          const participants = w.participantIds.map(pid => ({
              wave_id: waveId,
              user_id: userMap[pid],
              is_read: w.isRead
          })).filter(p => p.user_id); // Ensure valid users

          if (participants.length > 0) {
              await supabaseAdmin.from('wave_participants').insert(participants);
          }

          // Recursive Blip Insert
          const insertBlip = async (blip: any, parentId: string | null) => {
              const blipId = crypto.randomUUID();
              
              // Map gadgets user IDs
              const mappedGadgets = blip.gadgets?.map((g: Gadget) => {
                  if (g.type === 'consent') {
                      return {
                          ...g,
                          data: {
                              ...g.data,
                              votes: g.data.votes?.map(v => ({
                                  ...v,
                                  userId: userMap[v.userId] || v.userId
                              }))
                          }
                      };
                  }
                  return g;
              });

              await supabaseAdmin.from('blips').insert({
                  id: blipId,
                  wave_id: waveId,
                  parent_id: parentId,
                  author_id: userMap[blip.authorId],
                  content: blip.content,
                  timestamp: blip.timestamp,
                  gadgets: mappedGadgets ? JSON.stringify(mappedGadgets) : null,
                  is_read_only: blip.isReadOnly || false
              });

              if (blip.children) {
                  for (const child of blip.children) {
                      await insertBlip(child, blipId);
                  }
              }
          };

          if (w.rootBlip) {
              await insertBlip(w.rootBlip, null);
          }
      }

      addLog("Seed complete!");

    } catch (e: any) {
        addLog(`Fatal error: ${e.message}`);
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 text-white rounded shadow-lg m-4 max-w-md absolute top-0 right-0 z-50 overflow-y-auto max-h-96">
      <h3 className="font-bold mb-2">Dev Seeder</h3>
      <button 
        onClick={seed} 
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded w-full disabled:opacity-50"
      >
        {loading ? 'Seeding...' : 'Seed Database'}
      </button>
      <div className="mt-4 text-xs font-mono space-y-1">
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
};
