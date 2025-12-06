
export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  avatar: string;
  bio?: string;
  status: 'online' | 'idle' | 'offline' | 'busy';
  capacity: 'high' | 'medium' | 'low' | 'no_spoons'; // New: Capacity tracking
  accessNeeds?: string; // New: Accessibility info
  isRobot?: boolean;
  color: string; // Color for cursor and presence
}

export interface Domain {
  id: string;
  name: string;
  color: string;
  description?: string;
  parentId?: string; // NEW: Supports nested circles
}

// NEW: Role System
export interface Role {
  id: string;
  name: string;
  domainId: string;
  description: string;
  holderIds: string[];
  termEnd?: number;
}

export interface PollOption {
  id: string;
  text: string;
  voterIds: string[];
}

export interface ConsentVote {
  userId: string;
  type: 'consent' | 'concern' | 'objection';
  note?: string;
}

export interface Gadget {
  id: string;
  type: 'poll' | 'consent';
  data: {
    // Poll Data
    question?: string;
    options?: PollOption[];
    // Consent Data
    topic?: string;
    votes?: ConsentVote[];
  };
}

export interface BlipVersion {
  id: string;
  blipId: string;
  content: string;
  createdAt: number;
  editorId?: string;
}

export interface Blip {
  id: string;
  authorId: string;
  content: string; // Supports basic markdown (*bold*, _italic_)
  timestamp: number;
  children: Blip[]; 
  lastEdited?: number;
  lastEditorId?: string; // NEW: Tracks who actually made the edit
  gadgets?: Gadget[]; // Embedded gadgets
  isReadOnly?: boolean; // NEW: Allows locking a blip
  deletedAt?: number; // NEW: Soft delete timestamp
  versions?: BlipVersion[]; // NEW: History of edits
}

// NEW: Structured data for executing proposals
export interface ProposalMetadata {
  type: 'operational' | 'role_assignment' | 'circle_creation';
  status: 'active' | 'passed' | 'implemented' | 'blocked';
  payload: {
    circleName?: string;
    parentDomainId?: string;
    roleName?: string;
    nomineeId?: string;
    title?: string;
    description?: string; // NEW: Carries reasoning or purpose to the dashboard
  };
}

export interface Wave {
  id: string;
  title: string;
  participantIds: string[];
  rootBlip: Blip; 
  folder: 'inbox' | 'archive' | 'trash' | 'spam';
  tags: string[];
  isRead: boolean;
  isPinned?: boolean; // NEW: Allows pinning to dashboard
  lastActivity: number;
  parentId?: string; // Supports nesting waves
  isDM?: boolean; // Distinguishes direct messages
  type: 'discussion' | 'proposal' | 'circle_home'; // NEW: Wave Types
  domainId?: string; // NEW: Associated Domain of Care
  proposalMetadata?: ProposalMetadata; // NEW: Stores data for execution
}

export interface RemoteCursor {
  userId: string;
  blipId: string;
  position: number; // Index in content
  isTyping: boolean;
}

export type ViewMode = 'desktop' | 'mobile';

export interface AppState {
  waves: Wave[];
  selectedWaveId: string | null;
  currentUser: User;
  users: Record<string, User>;
  activeFolder: Wave['folder'] | 'dms'; 
  activeDomainId: string | null; // NEW: Filter by domain
  sidebarOpen: boolean;
  searchQuery: string;
  remoteCursors: Record<string, RemoteCursor>; // keyed by userId
  view: 'wave' | 'directory' | 'profile'; 
  profileTargetId: string | null; 
}
