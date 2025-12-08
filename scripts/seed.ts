import { createClient } from '@supabase/supabase-js';
import { MOCK_USERS, INITIAL_WAVES, DOMAINS, MOCK_ROLES } from '../mockData';
import { Gadget } from '../types';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    console.log(`Loading env from ${envPath}`);
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        if (!process.env[k]) {
            process.env[k] = envConfig[k];
        }
    }
} else {
    console.warn("No .env.local found. Relying on process.env");
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
        // 0. CLEANUP (But preserve Users)
        console.log("Cleaning up old data (Waves, Blips, Domains, Roles)...");
        // Deleting waves cascades to blips and participants
        const { error: waveDelErr } = await supabaseAdmin.from('waves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (waveDelErr) console.error("Error clearing waves:", waveDelErr.message);

        // Deleting domains cascades to members and roles (usually, assuming FKs are set to cascade)
        // Check Role FK: domain_id references domains(id) on delete cascade?
        // Check Domain Members FK: domain_id references domains(id) on delete cascade?
        // Yes, my migrations set DELETE CASCADE.
        const { error: domainDelErr } = await supabaseAdmin.from('domains').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (domainDelErr) console.error("Error clearing domains:", domainDelErr.message);

        // Just in case roles didn't cascade (if they were created before cascade was set)
        await supabaseAdmin.from('roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

        console.log("Cleanup complete.");

        // 1. USERS
        const userMap: Record<string, string> = {}; 
        
        // Fetch ALL existing users to map them if they exist
        // Pagination might be needed if > 50 users, but likely small for now.
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const existingUsers = listData?.users || [];
        const existingEmails = new Set(existingUsers.map(u => u.email?.toLowerCase()));
        
        // Map existing users by email
        existingUsers.forEach(u => {
            if (u.email) userMap[u.email.toLowerCase()] = u.id;
        });

        // Create MOCK_USERS
        for (const oldId in MOCK_USERS) {
            const u = MOCK_USERS[oldId];
            console.log(`Processing user: ${u.name}`);
            
            const normalizedEmail = u.email.toLowerCase();
            let userId = userMap[normalizedEmail];

            if (!userId) {
                // Create new user
                const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
                    email: u.email,
                    password: 'password123', // Stronger password
                    email_confirm: true,
                    user_metadata: { full_name: u.name, avatar_url: u.avatar }
                });
                
                if (authError) {
                    console.error(`Error creating user ${u.email}:`, authError.message);
                    continue;
                }
                userId = authData.user?.id;
                if (userId) userMap[normalizedEmail] = userId;
            }

            // Upsert Profile (for both new and existing mock users)
            if (userId) {
                // We map 'alice' (mock ID) to real UUID for later usage
                userMap[oldId] = userId;

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
            // Create parents before children
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

            if (error) console.error(`Error creating domain ${d.name}:`, error.message);
        }
        console.log("Domains synced.");

        // 3. DOMAIN MEMBERSHIP (Add ALL users to 'General' and 'Forward Facing')
        // We want the 2 existing test users to see everything.
        // We'll add ALL users in the Auth system to the Root Domains.
        
        const rootDomainIds = DOMAINS.filter(d => !d.parentId).map(d => domainMap[d.id]);
        
        // Refresh list of users to include newly created ones
        const { data: allUsersData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
        const allUsers = allUsersData?.users || [];

        for (const u of allUsers) {
             for (const domId of rootDomainIds) {
                 await supabaseAdmin.from('domain_members').upsert({
                     domain_id: domId,
                     user_id: u.id
                 });
             }
        }
        console.log(`Added ${allUsers.length} users to root domains.`);


        // 4. ROLES
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
        console.log("Roles synced.");

        // 5. WAVES & BLIPS
        for (const w of INITIAL_WAVES) {
            console.log(`Creating wave: ${w.title}`);
            const waveId = crypto.randomUUID();

            const { error: waveError } = await supabaseAdmin.from('waves').insert({
                id: waveId,
                title: w.title,
                type: w.type,
                folder: w.folder,
                is_pinned: w.isPinned || false,
                last_activity: w.lastActivity,
                is_dm: w.isDM || false,
                domain_id: w.domainId ? domainMap[w.domainId] : null,
                proposal_metadata: w.proposalMetadata ? w.proposalMetadata : null,
                tags: w.tags
            });

            if (waveError) {
                console.error(`Error wave ${w.title}:`, waveError.message);
                continue;
            }

            // Participants
            // We include the mock participants
            const participants = w.participantIds.map(pid => ({
                wave_id: waveId,
                user_id: userMap[pid], // These are mock IDs 'alice', 'bob'
                is_read: w.isRead
            })).filter(p => p.user_id);

            // ALSO: Add all non-mock users (the real test users) to every wave so they can see them in their inbox/updates?
            // Or rely on Domain membership? 
            // If we rely on Domain membership, they see it in the Circle view.
            // If we want it in their INBOX, they must be participants.
            // Let's add all REAL users (users not in MOCK_USERS map) to these waves too, so the demo user sees them.
            
            const mockUserIds = new Set(Object.values(userMap));
            const realUsers = allUsers.filter(u => !mockUserIds.has(u.id));

            realUsers.forEach(ru => {
                participants.push({
                    wave_id: waveId,
                    user_id: ru.id,
                    is_read: false // Unread for the real user!
                });
            });

            if (participants.length > 0) {
                await supabaseAdmin.from('wave_participants').upsert(participants);
            }

            // Blips
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
                    gadgets: mappedGadgets ? mappedGadgets : null,
                    is_read_only: blip.isReadOnly || false
                }); // Note: .select() not needed unless debugging

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

        console.log("Seed complete.");

    } catch (e: any) {
        console.error("Fatal error:", e);
    }
};

seed();