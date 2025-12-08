
import { User, Wave, Domain, Role, Gadget } from './types';

// --- USERS ---
const ACTORS = [
  // core team
  { id: 'alice', name: 'Alice', handle: 'alice', email: 'alice@cqec.org', bio: 'Mutual Aid Lead. Tired.', color: '#14b8a6', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Alice' },
  { id: 'bob', name: 'Bob', handle: 'bob_treasurer', email: 'bob@cqec.org', bio: 'Treasurer. "Have you filled out the form?"', color: '#f59e0b', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Bob' },
  { id: 'charlie', name: 'Charlie', handle: 'charlie_logistics', email: 'charlie@cqec.org', bio: 'Logistics Wizard. Lives in a van.', color: '#ec4899', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Charlie' },
  { id: 'dana', name: 'Dana', handle: 'dana_ops', email: 'dana@cqec.org', bio: 'Operations. Herding cats.', color: '#6366f1', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Dana' },
  
  // mutual aid team
  { id: 'sam', name: 'Sam', handle: 'sam_strategy', email: 'sam@cqec.org', bio: 'Strategy & Vision. Big picture thinker.', color: '#8b5cf6', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Sam' },
  { id: 'val', name: 'Val', handle: 'volunteer_val', email: 'val@cqec.org', bio: 'New Volunteer. Very enthusiastic.', color: '#f43f5e', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Val' },
  { id: 'frank', name: 'Frank', handle: 'farmer_frank', email: 'frank@cqec.org', bio: 'Local supplier liaison.', color: '#84cc16', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Frank' },
  { id: 'grace', name: 'Grace', handle: 'grace_driver', email: 'grace@cqec.org', bio: 'Lead Driver.', color: '#06b6d4', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Grace' },

  // emotional care / culture
  { id: 'helen', name: 'Helen', handle: 'healer_helen', email: 'helen@cqec.org', bio: 'Emotional Care Circle. Holding space.', color: '#d946ef', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Helen' },
  { id: 'ivan', name: 'Ivan', handle: 'ivan_culture', email: 'ivan@cqec.org', bio: 'Culture keeper.', color: '#a855f7', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Ivan' },

  // random members
  { id: 'jen', name: 'Jen', handle: 'jen_members', email: 'jen@cqec.org', bio: 'Just here for the potlucks.', color: '#eab308', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Jen' },
  { id: 'kevin', name: 'Kevin', handle: 'kevin_dev', email: 'kevin@cqec.org', bio: 'Webmaster.', color: '#3b82f6', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Kevin' },
  { id: 'lisa', name: 'Lisa', handle: 'lisa_legal', email: 'lisa@cqec.org', bio: 'Legal observer.', color: '#64748b', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Lisa' },
  { id: 'mike', name: 'Mike', handle: 'mike_money', email: 'mike@cqec.org', bio: 'Fundraising committee.', color: '#22c55e', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Mike' },
  { id: 'nina', name: 'Nina', handle: 'nina_news', email: 'nina@cqec.org', bio: 'Newsletter editor.', color: '#f97316', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Nina' },
  { id: 'oscar', name: 'Oscar', handle: 'oscar_outreach', email: 'oscar@cqec.org', bio: 'Community Outreach.', color: '#10b981', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Oscar' },
  { id: 'pat', name: 'Pat', handle: 'pat_pantries', email: 'pat@cqec.org', bio: 'Pantry coordinator.', color: '#f59e0b', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Pat' },
  { id: 'quinn', name: 'Quinn', handle: 'quinn_questions', email: 'quinn@cqec.org', bio: 'Always asking why.', color: '#6366f1', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Quinn' },
  { id: 'rachel', name: 'Rachel', handle: 'rachel_research', email: 'rachel@cqec.org', bio: 'Grant writer.', color: '#8b5cf6', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Rachel' },
  { id: 'steve', name: 'Steve', handle: 'steve_security', email: 'steve@cqec.org', bio: 'OpSec lead. Use Signal.', color: '#475569', avatar: 'https://api.dicebear.com/9.x/avataaars/svg?seed=Steve' },
  
  // bots
  { id: 'robot1', name: 'Care Bot', handle: 'care-bot', email: 'bot@cqec.org', bio: 'Hydrate.', color: '#78716c', avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=CareBot', isRobot: true },
];

export const MOCK_USERS: Record<string, User> = {};
ACTORS.forEach(a => {
    MOCK_USERS[a.id] = { ...a, status: 'online', capacity: 'medium' } as User;
});

// --- DOMAINS ---

export const DOMAINS: Domain[] = [
  // Root
  { id: 'general', name: 'General Circle', color: 'bg-slate-100 text-slate-800', description: 'The main gathering space for all members.' },
  
  // Forward Facing
  { id: 'forward', name: 'Forward Facing', color: 'bg-emerald-50 text-emerald-800', parentId: 'general', description: 'Public-facing operations.' },
    { id: 'mutual_aid', name: 'Mutual Aid', color: 'bg-emerald-100 text-emerald-900', parentId: 'forward', description: 'Direct support and food distribution.' },
    { id: 'prog_log', name: 'Programming & Logistics', color: 'bg-blue-100 text-blue-900', parentId: 'forward', description: 'Events, fleets, and schedules.' },
    { id: 'empowerment', name: 'Empowerment', color: 'bg-amber-100 text-amber-900', parentId: 'forward', description: 'Education and skill shares.' },
    { id: 'care_culture', name: 'Emotional Care & Culture', color: 'bg-rose-100 text-rose-900', parentId: 'forward', description: 'Conflict resolution and vibes.' },
    { id: 'partnerships', name: 'Partnership & Collab', color: 'bg-cyan-100 text-cyan-900', parentId: 'forward', description: 'Working with other orgs.' },

  // Internal
  { id: 'internal', name: 'Internal Circle', color: 'bg-indigo-50 text-indigo-800', parentId: 'general', description: 'Administrative and sustainability work.' },
    { id: 'marketing', name: 'Marketing/Dev/Strategy', color: 'bg-purple-100 text-purple-900', parentId: 'internal', description: 'Telling our story and planning the future.' },
    { id: 'fundraising', name: 'Fundraising', color: 'bg-green-100 text-green-900', parentId: 'internal', description: 'Securing the bag.' },
    { id: 'finance', name: 'Financial Stewardship', color: 'bg-yellow-100 text-yellow-900', parentId: 'internal', description: 'Budgeting and expenses.' },
    { id: 'opsec', name: 'OpSec', color: 'bg-slate-200 text-slate-900', parentId: 'internal', description: 'Digital and physical security.' },
];

// --- ROLES ---
export const MOCK_ROLES: Role[] = [
    { id: 'r_alice', name: 'Mutual Aid Lead', domainId: 'mutual_aid', description: 'Point person for food dist.', holderIds: ['alice'] },
    { id: 'r_bob', name: 'Treasurer', domainId: 'finance', description: 'Signatory on the bank account.', holderIds: ['bob'] },
    { id: 'r_charlie', name: 'Logistics Coord', domainId: 'prog_log', description: 'Keys to the truck.', holderIds: ['charlie'] },
    { id: 'r_sam', name: 'Strategist', domainId: 'marketing', description: 'Vision holder.', holderIds: ['sam'] },
    { id: 'r_steve', name: 'Security Lead', domainId: 'opsec', description: 'Admin access manager.', holderIds: ['steve'] },
    { id: 'r_helen', name: 'Mediator', domainId: 'care_culture', description: 'Conflict resolution.', holderIds: ['helen'] },
];

// --- WAVES (THE STORY) ---
const now = Date.now();
const m = (min: number) => 1000 * 60 * min;
const h = (hours: number) => 1000 * 60 * 60 * hours;
const d = (days: number) => 1000 * 60 * 60 * 24 * days;

export const INITIAL_WAVES: Wave[] = [

    // 1. THE CRISIS (Mutual Aid)
    {
        id: 'w_crisis',
        title: '🚨 URGENT: Supplier Cancelled - 48h to fix',
        participantIds: ['alice', 'frank', 'val', 'charlie', 'sam', 'bob'],
        folder: 'inbox',
        tags: ['emergency', 'food-dist'],
        isRead: false,
        lastActivity: now - m(10),
        type: 'discussion',
        domainId: 'mutual_aid',
        rootBlip: {
            id: 'b_crisis_root',
            authorId: 'alice',
            content: `# 🚨 EMERGENCY

**Bad news:** GreenLeaf Wholesale just called. They can't make the drop this Saturday. 

**Impact:** We are missing:
* 50lbs Carrots
* 20 bags Rice
* 10 crates Apples

We have 48 hours. I need solutions NOW.`,
            timestamp: now - h(4),
            children: [
                {
                    id: 'b_crisis_1',
                    authorId: 'val',
                    content: 'Omg what?? Why??',
                    timestamp: now - h(3.9),
                    children: []
                },
                {
                    id: 'b_crisis_2',
                    authorId: 'frank',
                    content: `Logistical error on their end. Truck broke down in Sacramento. I tried pushing them but they have no backup drivers.`,
                    timestamp: now - h(3.8),
                    children: [
                        {
                            id: 'b_crisis_3',
                            authorId: 'charlie',
                            content: 'I can drive down there? It\'s 4 hours round trip.',
                            timestamp: now - h(3.5),
                            children: [
                                {
                                    id: 'b_crisis_4',
                                    authorId: 'alice',
                                    content: 'No, we need you here for packing prep. Plus the truck is broken, so the food is stuck inside it.',
                                    timestamp: now - h(3.4),
                                    children: []
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'b_crisis_5',
                    authorId: 'sam',
                    content: 'We need to pivot. Can we buy retail? Costco run?',
                    timestamp: now - h(3),
                    children: [
                        {
                            id: 'b_crisis_6',
                            authorId: 'bob',
                            content: 'Retail prices will blow the monthly budget. We are already at 90% utilization.',
                            timestamp: now - h(2.9),
                            children: [
                                {
                                    id: 'b_crisis_7',
                                    authorId: 'alice',
                                    content: '@bob We don\'t have a choice. People need to eat. I\'m starting a proposal for emergency funds.',
                                    timestamp: now - h(2.8),
                                    children: []
                                }
                            ]
                        }
                    ]
                }
            ]
        }
    },


    // 2. THE MONEY FIGHT (Finance)
    {
        id: 'w_money',
        title: 'Proposal: Emergency Allocation ($2k)',
        participantIds: ['alice', 'bob', 'sam', 'mike', 'steve'],
        folder: 'inbox',
        tags: ['finance', 'vote-required'],
        isRead: false,
        lastActivity: now - m(5),
        type: 'proposal',
        domainId: 'finance',
        proposalMetadata: {
            type: 'financial',
            status: 'active',
            payload: { amount: 2000, currency: 'USD' }
        },
        rootBlip: {
            id: 'b_money_root',
            authorId: 'alice',
            content: `# Emergency Fund Authorization

**Amount:** $2,000
**Purpose:** Costco run to replace GreenLeaf order.

We need this approved by EOD.`,
            timestamp: now - h(2),
            gadgets: [
                {
                    id: 'g_vote_money',
                    type: 'consent',
                    data: {
                        topic: 'Authorize $2k Spend',
                        votes: [
                            { userId: 'bob', type: 'object', note: 'Technically requires 24h notice per bylaws (Section 4.2)' },
                            { userId: 'sam', type: 'consent', note: 'Suspend the bylaws, this is an emergency.' },
                            { userId: 'mike', type: 'consent', note: 'Agreed with Sam.' }
                        ]
                    }
                }
            ],
            children: [
                 {
                    id: 'b_money_1',
                    authorId: 'bob',
                    content: 'Look, I want to help, but if we audit this later, it\'s going to look like a violation. We need a specific \'Emergency Override\' vote first.',
                    timestamp: now - h(1.5),
                    children: [
                         {
                            id: 'b_money_2',
                            authorId: 'alice',
                            content: 'Bob, people are hungry. Just sign the check.',
                            timestamp: now - h(1),
                            children: []
                         }
                    ]
                 }
            ]
        }
    },

    // 3. LOGISTICS CHAOS (Programming & Logistics)
    {
        id: 'w_driver',
        title: 'Driver Callout - Saturday Distro',
        participantIds: ['charlie', 'grace', 'val', 'jen', 'pat'],
        folder: 'inbox',
        tags: ['logistics', 'shifts'],
        isRead: true,
        lastActivity: now - h(5),
        type: 'discussion',
        domainId: 'prog_log',
        rootBlip: {
            id: 'b_driver_root',
            authorId: 'grace',
            content: 'We need 2 more drivers for the North Route this Saturday. 10am - 2pm.',
            timestamp: now - d(1),
            children: [
                 {
                    id: 'b_driver_1',
                    authorId: 'val',
                    content: 'I can do it!',
                    timestamp: now - d(0.9),
                    children: []
                 },
                 {
                     id: 'b_driver_2',
                     authorId: 'val',
                     content: 'Wait, sorry, I forgot I have class. Rescinding offer. 😞',
                     timestamp: now - d(0.8),
                     children: []
                 }
            ]
        }
    },

    // 4. EMOTIONAL SUPPORT (Care & Culture)
    {
        id: 'w_vent',
        title: 'Weekly Vent Space',
        participantIds: ['helen', 'alice', 'charlie', 'ivan'],
        folder: 'inbox',
        tags: ['care', 'async-meeting'],
        isRead: true,
        lastActivity: now - m(30),
        type: 'discussion',
        domainId: 'care_culture',
        rootBlip: {
            id: 'b_vent_root',
            authorId: 'helen',
            content: 'This week is feeling heavy. The news is bad and the supply chain stuff is stressful. How are our bodies feeling?',
            timestamp: now - d(2),
            children: [
                {
                    id: 'b_vent_1',
                    authorId: 'charlie',
                    content: 'My back is killing me. Moving too many boxes.',
                    timestamp: now - d(1.5),
                    children: [
                        {
                            id: 'b_vent_2',
                            authorId: 'ivan',
                            content: 'Take a break, Charlie. Seriously. We need you long term.',
                            timestamp: now - d(1.4),
                            children: []
                        }
                    ]
                }
            ]
        }
    },

    // 5. STRATEGY (Marketing)
    {
        id: 'w_strat',
        title: 'Q1 Vision Document - Draft',
        participantIds: ['sam', 'nina', 'kevin'],
        folder: 'inbox',
        tags: ['strategy', 'long-read'],
        isRead: true,
        lastActivity: now - d(5),
        type: 'discussion',
        domainId: 'marketing',
        rootBlip: {
            id: 'b_strat_root',
            authorId: 'sam',
            content: `# Q1 Vision: "Deep Roots"

I've been thinking about how we scale our impact without scaling our burnout...

(Long document attached)`,
            timestamp: now - d(5),
            children: [
                {
                    id: 'b_strat_1',
                    authorId: 'nina',
                    content: 'Love this. Can we pull some quotes for the newsletter?',
                    timestamp: now - d(4),
                    children: []
                }
            ]
        }
    },
    
    // 6. GENERAL (General)
    {
        id: 'w_lostfound',
        title: 'Found: Green Scarf',
        participantIds: ['jen', 'all'],
        folder: 'inbox',
        tags: ['misc'],
        isRead: true,
        lastActivity: now - d(3),
        type: 'discussion',
        domainId: 'general',
        rootBlip: {
            id: 'b_lost_root',
            authorId: 'jen',
            content: 'Found a green knit scarf in the storage closet. Left it on the hook.',
            timestamp: now - d(3),
            children: []
        }
    }
];
