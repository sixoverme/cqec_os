
import React, { useState } from 'react';
import { Wave, User, AppState, Domain, ProposalMetadata } from '../types';
import Avatar from './Avatar';
import { formatDate } from '../utils';
import { 
  Inbox, Archive, Trash2, Edit, Search, ChevronRight, ChevronDown, 
  Users, Settings, MessageSquare, Hexagon, FileText, Sprout, Plus, 
  Filter, Battery, BatteryMedium, BatteryLow, BatteryWarning,
  Circle, MessageCircle, X, FolderTree, Eye
} from 'lucide-react';

interface WaveListProps {
  waves: Wave[];
  users: Record<string, User>;
  currentUser: User;
  domains: Domain[];
  selectedWaveId: string | null;
  activeFolder: AppState['activeFolder'];
  activeDomainId: AppState['activeDomainId'];
  searchQuery: string;
  onSelectWave: (id: string) => void;
  onSetFolder: (folder: AppState['activeFolder']) => void;
  onSetDomain: (domainId: string | null) => void;
  onCreateWave: (
      type: Wave['type'], 
      parentId?: string, 
      additionalParticipants?: string[], 
      isDM?: boolean,
      initialData?: { 
        title: string; 
        content: string; 
        domainId: string;
        proposalMetadata?: ProposalMetadata;
      }
  ) => void;
  onDraftProposal: () => void;
  onProposeCircle: (parentId?: string) => void;
  onSearch: (query: string) => void;
  onOpenDirectory: () => void;
  onOpenProfile: () => void;
}

const WaveList: React.FC<WaveListProps> = ({ 
  waves, 
  users, 
  currentUser,
  domains,
  selectedWaveId, 
  activeFolder,
  activeDomainId,
  searchQuery,
  onSelectWave,
  onSetFolder,
  onSetDomain,
  onCreateWave,
  onDraftProposal,
  onProposeCircle,
  onSearch,
  onOpenDirectory,
  onOpenProfile
}) => {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [isMyceliumOpen, setIsMyceliumOpen] = useState(true);
  
  // Filter logic:
  const filteredWaves = waves
    .filter(w => {
      const matchesSearch = searchQuery === '' || 
        w.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        w.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        w.rootBlip.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (searchQuery) return matchesSearch;

      if (activeDomainId) {
        // Show waves in this domain OR any sub-domain
        const matchesDomain = w.domainId === activeDomainId;
        return matchesDomain && w.folder !== 'trash';
      }

      if (activeFolder === 'inbox') {
        return w.folder === 'inbox' && !w.isDM && !activeDomainId;
      }
      if (activeFolder === 'dms') {
        return w.folder === 'inbox' && w.isDM;
      }
      return w.folder === activeFolder;
    })
    .sort((a, b) => b.lastActivity - a.lastActivity);

  // Only show top-level items in list (unless searching)
  const displayRoots = filteredWaves.filter(w => {
      if (searchQuery) return true;
      if (!w.parentId) return true;
      return !filteredWaves.find(p => p.id === w.parentId);
  });

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getCapacityIcon = (capacity: User['capacity']) => {
      switch(capacity) {
          case 'high': return <Battery size={14} className="text-green-500" />;
          case 'medium': return <BatteryMedium size={14} className="text-yellow-500" />;
          case 'low': return <BatteryLow size={14} className="text-orange-500" />;
          case 'no_spoons': return <BatteryWarning size={14} className="text-red-500" />;
          default: return <BatteryMedium size={14} className="text-gray-400" />;
      }
  };

  // Recursive Domain Renderer
  const renderDomainItem = (domain: Domain, depth = 0) => {
      const children = domains.filter(d => d.parentId === domain.id);
      const isActive = activeDomainId === domain.id;

      return (
          <div key={domain.id} className="relative">
              <div 
                 className={`group w-full flex items-center justify-between px-2 py-1.5 rounded text-sm transition-colors cursor-pointer ${isActive ? 'bg-white shadow-sm ring-1 ring-slate-200' : 'hover:bg-slate-100'}`}
                 style={{ paddingLeft: `${depth * 12 + 8}px` }}
                 onClick={() => onSetDomain(domain.id)}
              >
                  <div className="flex items-center gap-2">
                      <Circle size={8} className={isActive ? 'text-purple-500 fill-purple-500' : 'text-slate-300'} />
                      <span className={`${isActive ? 'font-bold text-slate-800' : 'text-slate-600'} truncate max-w-[140px]`}>{domain.name}</span>
                  </div>
                  
                  {/* Hover Add Sub-circle Proposal */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onProposeCircle(domain.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-slate-200 rounded text-slate-400 transition-opacity"
                    title="Propose Sub-circle"
                  >
                    <Plus size={12} />
                  </button>
              </div>

              {/* Recursive Children */}
              {children.map(child => renderDomainItem(child, depth + 1))}
          </div>
      );
  };

  const renderWaveItem = (wave: Wave) => {
    const rootAuthor = users[wave.rootBlip.authorId] || { name: 'Unknown', avatar: '' };
    const isSelected = selectedWaveId === wave.id;
    
    let displayTitle = wave.title;
    if (wave.isDM) {
        const otherId = wave.participantIds.find(id => id !== currentUser.id);
        if (otherId && users[otherId]) {
            displayTitle = users[otherId].name;
        }
    }
    
    const children = filteredWaves.filter(w => w.parentId === wave.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsed.has(wave.id);
    
    const isProposal = wave.type === 'proposal';
    const isCircleHome = wave.type === 'circle_home';

    return (
      <div key={wave.id} className="flex flex-col">
        <div 
          onClick={() => onSelectWave(wave.id)}
          className={`
            flex gap-3 p-3 cursor-pointer transition-all relative group border-b border-gray-50
            ${isSelected ? 'bg-purple-50' : 'hover:bg-slate-50'}
            ${!wave.isRead ? 'bg-white' : 'bg-[#fdfbf7]/50'}
          `}
        >
          {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500" />}

          <div className="flex-shrink-0 w-5 flex justify-center pt-2 z-10">
            {hasChildren ? (
              <button 
                onClick={(e) => toggleCollapse(e, wave.id)}
                className="w-5 h-5 flex items-center justify-center rounded hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
                <div className="mt-1">
                 {isProposal ? <Sprout size={14} className="text-teal-500" /> : 
                  isCircleHome ? <Hexagon size={14} className="text-purple-500" /> :
                  null}
                </div>
            )}
          </div>

          <div className="flex gap-3 min-w-0 flex-1">
             <div className="pt-1">
               <Avatar user={rootAuthor} size="sm" />
             </div>
             
             <div className="flex-col flex-1 min-w-0">
               <div className="flex justify-between items-baseline mb-0.5">
                 <h3 className={`text-sm truncate pr-2 ${!wave.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                   {displayTitle}
                 </h3>
                 <span className={`text-[10px] flex-shrink-0 ${!wave.isRead ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                   {formatDate(wave.lastActivity)}
                 </span>
               </div>

               <p className={`text-xs truncate mb-1.5 ${!wave.isRead ? 'text-slate-800' : 'text-slate-500'}`}>
                 {wave.rootBlip.content.replace(/[*_~`#]/g, '') || <span className="italic opacity-50">Empty</span>}
               </p>
               
               {wave.tags.length > 0 && (
                 <div className="flex gap-1 overflow-hidden">
                   {wave.tags.slice(0, 3).map(tag => (
                     <span key={tag} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-500 font-medium">
                       #{tag}
                     </span>
                   ))}
                 </div>
               )}
             </div>
          </div>
        </div>

        {/* Nested Children */}
        {!isCollapsed && hasChildren && (
            <div className="pl-6 border-l border-slate-100 ml-4">
                {children.map(child => renderWaveItem(child))}
            </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full md:w-80 bg-[#fdfbf7] border-r border-slate-200 shadow-xl md:shadow-none">
      
      {/* 1. Header: Branding & User Profile */}
      <div className="p-4 bg-white border-b border-slate-100 flex flex-col gap-4">
         <div className="flex items-center justify-between">
             <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                   <Eye size={20} />
                 </div>
                 <h1 className="text-lg font-bold text-slate-800 tracking-tight">CQEC OS</h1>
             </div>
             <button onClick={onOpenDirectory} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <Users size={18} />
             </button>
         </div>

         <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors" onClick={onOpenProfile}>
            <Avatar user={currentUser} size="md" showStatus />
            <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm text-slate-800 truncate">{currentUser.name}</span>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    {getCapacityIcon(currentUser.capacity)}
                    <span className="capitalize">{currentUser.capacity.replace('_', ' ')} Capacity</span>
                </div>
            </div>
         </div>
      </div>

      {/* 2. Primary Navigation */}
      <div className="px-2 py-3 space-y-1">
          <button 
            onClick={() => onSetFolder('inbox')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'inbox' && !activeDomainId ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:bg-slate-100'}`}
          >
             <Inbox size={18} /> My Focus
          </button>
          
          <button 
            onClick={() => onSetFolder('dms')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFolder === 'dms' ? 'bg-purple-100 text-purple-800' : 'text-slate-600 hover:bg-slate-100'}`}
          >
             <MessageCircle size={18} /> Direct Messages
          </button>
      </div>

      {/* 3. The Mycelium (Domains) */}
      <div className="px-4 pt-2 pb-1">
          <div className="flex items-center justify-between mb-2 px-2">
            <button 
                onClick={() => setIsMyceliumOpen(!isMyceliumOpen)}
                className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-slate-600 focus:outline-none transition-colors"
            >
                {isMyceliumOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                The Collective
            </button>
            <button 
                onClick={(e) => { e.stopPropagation(); onProposeCircle(undefined); }} // Propose new Root circle
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-purple-600 transition-colors"
                title="Propose New Root Circle"
            >
                <Plus size={12} />
            </button>
          </div>
          
          {isMyceliumOpen && (
            <div className="space-y-0.5">
                {/* Render Top Level Domains, children render recursively */}
                {domains.filter(d => !d.parentId).map(domain => renderDomainItem(domain))}
            </div>
          )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar border-t border-slate-100 mt-2">
         {/* Search */}
         <div className="sticky top-0 z-10 p-3 bg-[#fdfbf7]/95 backdrop-blur-sm border-b border-slate-100">
             <div className="relative">
                 <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => onSearch(e.target.value)}
                   placeholder="Search the collective..."
                   className="w-full bg-white border border-slate-200 rounded-full pl-9 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-300"
                 />
             </div>
         </div>

         {/* Wave List */}
         <div className="pb-4">
             {displayRoots.length === 0 ? (
                 <div className="p-8 text-center text-slate-400 text-sm">
                     <p>Nothing found here.</p>
                     <p className="text-xs mt-1">Start a new stream?</p>
                 </div>
             ) : (
                 displayRoots.map(renderWaveItem)
             )}
         </div>
      </div>
    </div>
  );
};

export default WaveList;
