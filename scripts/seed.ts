
import { createClient } from '@supabase/supabase-js';
import { MOCK_USERS, INITIAL_WAVES, DOMAINS, MOCK_ROLES } from '../mockData';
import { Gadget } from '../types';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables (URL or Service Key)');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const seed = async () => {
    console.log("Starting seed script...");

    try {
        // 0. Cleanup (Optional: only if we want a fresh start)
        // await supabaseAdmin.from('waves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        // await supabaseAdmin.auth.admin.listUsers().then(...) // Deleting users is harder

        // 1. USERS
        const userMap: Record<string, string> = {}; 
      
        for (const oldId in MOCK_USERS) {
            const u = MOCK_USERS[oldId];
            console.log(`Creating user: ${u.name}`);
            
            // Check if user exists
            const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
            const existingUser = listData.users.find(user => user.email === u.email);

            let userId = existingUser?.id;

            if (!userId) {
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: u.email,
                    password: 'password',
                    email_confirm: true,
                    user_metadata: { full_name: u.name, avatar_url: u.avatar }
                });
                if (authError) {
                    console.error(`Error creating user ${u.email}:`, authError.message);
                    continue;
                }
                userId = authData.user?.id;
            }

            if (userId) {
                userMap[oldId] = userId;
                // Upsert Profile
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    email: u.email,
                    name: u.name,
                    handle: u.handle,
                    bio: u.bio,
                    status: u.status,
                    capacity: u.capacity,
                    access_needs: u.accessNeeds,
                    color: u.color,
                    is_robot: u.isRobot || false,
                    avatar_url: u.avatar
                });
            }
        }

        // 2. DOMAINS
        const domainMap: Record<string, string> = {}; 
        const sortedDomains = [...DOMAINS].sort((a, b) => {
            if (a.parentId && !b.parentId) return 1;
            if (!a.parentId && b.parentId) return -1;
            return 0;
        });

        for (const d of sortedDomains) {
            // Check existence by name
            const { data: existing } = await supabaseAdmin.from('domains').select('id').eq('name', d.name).single();
            let newId = existing?.id || crypto.randomUUID();
            domainMap[d.id] = newId;
            
            await supabaseAdmin.from('domains').upsert({
                id: newId,
                name: d.name,
                color: d.color,
                description: d.description,
                parent_id: d.parentId ? domainMap[d.parentId] : null
            });
        }
        console.log("Domains synced.");

        // 3. ROLES
        for (const r of MOCK_ROLES) {
            const { data: existing } = await supabaseAdmin.from('roles').select('id').eq('name', r.name).eq('domain_id', domainMap[r.domainId]).maybeSingle();
            const newId = existing?.id || crypto.randomUUID();
            
            const mappedHolders = r.holderIds.map(hid => userMap[hid]).filter(Boolean);
            
            await supabaseAdmin.from('roles').upsert({
                id: newId,
                name: r.name,
                domain_id: domainMap[r.domainId],
                description: r.description,
                holder_ids: mappedHolders
            });
        }
        console.log("Roles synced.");

        // 4. WAVES
        for (const w of INITIAL_WAVES) {
            console.log(`Syncing wave: ${w.title}`);
            
            // For waves, we might duplicate if we don't have a stable ID.
            // MOCK_WAVES have 'w1'. We can try to reuse a UUID if we hash it, OR just check by title?
            // Let's just create new ones for now, or check title.
            
            // Better: Deterministic UUID from the old ID? No, just random.
            // Check if title exists to prevent duplicates on re-run
            const { data: existingWave } = await supabaseAdmin.from('waves').select('id').eq('title', w.title).maybeSingle();
            
            const waveId = existingWave?.id || crypto.randomUUID();

            const { error: waveError } = await supabaseAdmin.from('waves').upsert({
                id: waveId,
                title: w.title,
                type: w.type,
                folder: w.folder,
                is_pinned: w.isPinned || false,
                last_activity: w.lastActivity,
                is_dm: w.isDM || false,
                domain_id: w.domainId ? domainMap[w.domainId] : null,
                proposal_metadata: w.proposalMetadata ? w.proposalMetadata : null, // Pass object directly
                tags: w.tags
            });

            if (waveError) {
                console.error(`Error wave ${w.title}:`, waveError.message);
                continue;
            }

            // Participants
            const participants = w.participantIds.map(pid => ({
                wave_id: waveId,
                user_id: userMap[pid],
                is_read: w.isRead
            })).filter(p => p.user_id);

            if (participants.length > 0) {
                // Upsert logic for many-to-many is tricky with 'upsert', but we have PK (wave_id, user_id)
                await supabaseAdmin.from('wave_participants').upsert(participants);
            }

            // Blips
            // Note: Syncing tree structures idempotently is hard.
            // We will just insert if wave was created (new).
            // If wave existed, we assume blips exist.
            if (!existingWave) {
                 const insertBlip = async (blip: any, parentId: string | null) => {
                    const blipId = crypto.randomUUID();
                    
                    const mappedGadgets = blip.gadgets?.map((g: Gadget) => {
                        if (g.type === 'consent') {
                            return {
                                ...g,
                                data: {
                                    ...g.data,
                                    votes: g.data.votes?.map((v:any) => ({
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
                        gadgets: mappedGadgets ? mappedGadgets : null, // Object
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
        }

        console.log("Seed complete.");

    } catch (e: any) {
        console.error("Fatal error:", e);
    }
};

seed();
