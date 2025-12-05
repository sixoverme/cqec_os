
import { User, Wave, Domain, Role } from './types';

export const DOMAINS: Domain[] = [
  { id: 'general', name: 'General', color: 'bg-slate-100 text-slate-800', description: 'General community discussions' },
  { id: 'steward', name: 'Steward Circle', color: 'bg-purple-100 text-purple-800', parentId: 'general' },
  { id: 'operations', name: 'Operations', color: 'bg-blue-100 text-blue-800', parentId: 'general' },
  // Nested under Operations
  { id: 'finances', name: 'Finances', color: 'bg-green-100 text-green-800', parentId: 'operations' },
  { id: 'opsec', name: 'OpSec', color: 'bg-slate-200 text-slate-800', parentId: 'operations' },
  
  { id: 'working_groups', name: 'Working Groups', color: 'bg-orange-100 text-orange-800', parentId: 'general' },
  // Nested under Working Groups
  { id: 'mutual_aid', name: 'Mutual Aid', color: 'bg-teal-100 text-teal-800', parentId: 'working_groups' },
  { id: 'programming', name: 'Programming', color: 'bg-indigo-100 text-indigo-800', parentId: 'working_groups' },
];

export const MOCK_ROLES: Role[] = [
  { id: 'r1', name: 'Facilitator', domainId: 'steward', description: 'Facilitates meetings and holds space.', holderIds: ['u2'] },
  { id: 'r2', name: 'Scribe', domainId: 'steward', description: 'Records minutes and decisions.', holderIds: ['u1'] },
  { id: 'r3', name: 'Treasurer', domainId: 'finances', description: 'Manages the budget and expenses.', holderIds: ['u3'] },
  { id: 'r4', name: 'Coordinator', domainId: 'mutual_aid', description: 'Organizes shifts and resources.', holderIds: ['u4'] },
  { id: 'r5', name: 'SysAdmin', domainId: 'operations', description: 'Maintains digital infrastructure.', holderIds: ['u5'] },
];

export const CURRENT_USER: User = {
  id: 'u1',
  name: 'You',
  handle: 'you',
  email: 'you@cqec.org',
  avatar: 'https://picsum.photos/seed/u1/200/200',
  bio: 'Just here to help the mycelium grow.',
  status: 'online',
  capacity: 'medium',
  accessNeeds: 'No flashing lights, please.',
  color: '#8b5cf6' // Violet
};

export const MOCK_USERS: Record<string, User> = {
  'u1': CURRENT_USER,
  'u2': { 
    id: 'u2', 
    name: 'Alice', 
    handle: 'alice',
    email: 'alice@cqec.org',
    avatar: 'https://picsum.photos/seed/alice/200/200', 
    bio: 'Facilitating the Steward Circle this season.',
    status: 'idle', 
    capacity: 'high',
    color: '#14b8a6' // Teal
  }, 
  'u3': { 
    id: 'u3', 
    name: 'Bob', 
    handle: 'bobj',
    email: 'bob@cqec.org',
    avatar: 'https://picsum.photos/seed/bob/200/200', 
    bio: 'Spreadsheets are my love language.',
    status: 'online', 
    capacity: 'low',
    accessNeeds: 'Screen reader user.',
    color: '#f59e0b' // Amber
  }, 
  'u4': { 
    id: 'u4', 
    name: 'Charlie', 
    handle: 'charlie',
    email: 'charlie@cqec.org',
    avatar: 'https://picsum.photos/seed/charlie/200/200', 
    bio: 'Coordinating the food pantry.',
    status: 'offline', 
    capacity: 'no_spoons',
    color: '#ec4899' // Pink
  }, 
  'u5': { 
    id: 'u5', 
    name: 'Dana', 
    handle: 'dana',
    email: 'dana@cqec.org',
    avatar: 'https://picsum.photos/seed/dana/200/200', 
    bio: 'Making sure the lights stay on.',
    status: 'online', 
    capacity: 'high',
    color: '#6366f1' // Indigo
  }, 
  'robot1': { 
    id: 'robot1', 
    name: 'Care Bot', 
    handle: 'care-bot',
    email: 'bot@cqec.org',
    avatar: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=CareBot', 
    bio: 'Here to remind you to hydrate and check for consent.',
    status: 'online', 
    capacity: 'high',
    isRobot: true, 
    color: '#78716c' // Stone
  }, 
};

const now = Date.now();

export const INITIAL_WAVES: Wave[] = [
  {
    id: 'w1',
    title: 'Welcome to the Circle',
    participantIds: ['u2', 'u1', 'robot1'],
    folder: 'inbox',
    tags: ['welcome', 'onboarding'],
    isRead: false,
    lastActivity: now - 1000 * 60 * 5,
    type: 'circle_home',
    domainId: 'steward',
    rootBlip: {
      id: 'b1',
      authorId: 'u2',
      content: 'Welcome to the *Steward Circle* home. We use this space to align on our shared values and vision.',
      timestamp: now - 1000 * 60 * 60 * 2,
      isReadOnly: true, // Locked by Alice
      children: [
        {
          id: 'b2',
          authorId: 'robot1',
          content: 'Remember to check your **capacity** in your profile settings! It helps us care for each other.',
          timestamp: now - 1000 * 60 * 55,
          children: []
        }
      ]
    }
  },
  {
    id: 'w_prop1',
    title: 'Proposal: Community Garden Expansion',
    participantIds: ['u4', 'u1', 'u2'],
    folder: 'inbox',
    tags: ['proposal', 'land'],
    isRead: false,
    lastActivity: now - 1000 * 60 * 30,
    type: 'proposal',
    domainId: 'mutual_aid',
    proposalMetadata: {
      type: 'operational',
      status: 'active',
      payload: {
        title: 'Community Garden Expansion'
      }
    },
    rootBlip: {
      id: 'bp1',
      authorId: 'u4',
      content: '# Proposal: Community Garden Expansion\n\n**Domain:** Mutual Aid\n\n### Aims & Values\nExpanding our food sovereignty initiatives aligns with our value of *Abundance*.\n\n### Problem / Opportunity\nThe lot next door is currently empty and the owner is open to a land trust.\n\n### Proposed Action\nAllocate $500 from the seed fund to secure the permit.\n\n### Measurement\nWe secure the permit by next month.\n\n### Timeline\nExecute by end of Q3.\n\n### Safety & Access Check\n- [x] Does this proposal live our values?\n- [ ] Is it safe to try?\n- [ ] Is it accessible?',
      timestamp: now - 1000 * 60 * 120,
      gadgets: [
        {
          id: 'g_consent1',
          type: 'consent',
          data: {
            topic: 'Proposal Consent Check',
            votes: [
               { userId: 'u2', type: 'consent', note: 'Love this!' }
            ]
          }
        }
      ],
      children: []
    }
  },
  {
    id: 'w2',
    title: 'Weekly Capacity Check-in',
    participantIds: ['u1', 'u3', 'u4', 'u5'],
    folder: 'inbox',
    tags: ['care', 'sync'],
    isRead: true,
    lastActivity: now - 1000 * 60 * 60 * 24,
    type: 'discussion',
    domainId: 'steward',
    rootBlip: {
      id: 'b10',
      authorId: 'u5',
      content: 'How are our spoons looking for the upcoming event?',
      timestamp: now - 1000 * 60 * 60 * 24,
      children: [
        {
          id: 'b11',
          authorId: 'u3',
          content: 'Running low on capacity, might need to delegate the budget review.',
          timestamp: now - 1000 * 60 * 60 * 23,
          children: []
        }
      ]
    }
  }
];
