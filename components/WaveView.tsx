
import React, { useRef, useState, useEffect } from 'react';
import { Wave, User, Gadget, RemoteCursor, Domain } from '../types';
import Avatar from './Avatar';
import Blip from './Blip';
import { Plus, Users, Archive, Trash2, ArrowLeft, MoreVertical, Play, Pause, RotateCcw, Tag, X, Folder, ChevronRight, CornerDownRight, CheckCircle, Sprout, AlertCircle, Hexagon, Pin } from 'lucide-react';
import { formatDate } from '../utils';

interface WaveViewProps {
  wave: Wave;
  allWaves: Wave[]; // Needed for hierarchy lookup
  users: Record<string, User>;
  currentUser: User;
  remoteCursors: Record<string, RemoteCursor>;
  domains: Domain[];
  onSelectDomain: (domainId: string) => void;
  onCloseMobile: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onReply: (parentId: string, content: string, gadgets: Gadget[]) => void;
  onEditBlip: (blipId: string, content: string, newGadgets: Gadget[]) => void;
  onDeleteBlip: (blipId: string) => void;
  onAddParticipant: (userId: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onVoteGadget: (blipId: string, gadgetId: string, optionId: string) => void;
  onSelectWave: (id: string) => void;
  onCreateSubwave: (parentId: string) => void;
  onViewProfile: (userId: string) => void;
  onExecuteProposal?: (waveId: string) => void; // NEW: Callback to execute proposal
  onTogglePin: () => void; // NEW: Callback to toggle pin state
  onToggleBlipLock: (blipId: string) => void; // NEW: Toggle lock
  onConsentVote: (blipId: string, gadgetId: string, voteType: 'consent' | 'concern' | 'objection') => void; // NEW: Consent vote
  onLeaveWave: (waveId: string) => void; // NEW
}

const WaveView: React.FC<WaveViewProps> = ({ 
  wave, 
  allWaves,
  users, 
  currentUser, 
  remoteCursors,
  domains,
  onSelectDomain,
  onCloseMobile, 
  onArchive,
  onDelete,
  onReply,
  onEditBlip,
  onDeleteBlip,
  onAddParticipant,
  onAddTag,
  onRemoveTag,
  onVoteGadget,
  onSelectWave,
  onCreateSubwave,
  onViewProfile,
  onExecuteProposal,
  onTogglePin,
  onToggleBlipLock,
  onConsentVote,
  onLeaveWave // Destructure here
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [playbackMode, setPlaybackMode] = useState(false);
  const [playbackValue, setPlaybackValue] = useState(100);
  const [newTag, setNewTag] = useState('');
  
  const participants = wave.participantIds.map(id => users[id]).filter(Boolean);
  const activeUserIds = Object.keys(remoteCursors).filter(uid => wave.participantIds.includes(uid));

  // Hierarchy Logic
  const subwaves = allWaves.filter(w => w.parentId === wave.id).sort((a,b) => b.lastActivity - a.lastActivity);
  const ancestors: Wave[] = [];
  let currentParentId = wave.parentId;
  while (currentParentId) {
    const parent = allWaves.find(w => w.id === currentParentId);
    if (parent) {
      ancestors.unshift(parent);
      currentParentId = parent.parentId;
    } else {
      break;
    }
  }

  // Domain Logic
  const currentDomain = domains.find(d => d.id === wave.domainId);

  // Playback Logic
  const startTime = wave.rootBlip.timestamp;
  const endTime = wave.lastActivity;
  const playbackTimestamp = playbackMode 
    ? startTime + (endTime - startTime) * (playbackValue / 100) 
    : null;

  const isNewWave = wave.rootBlip.content === '' && wave.rootBlip.authorId === currentUser.id && wave.rootBlip.children.length === 0;

  const handleAddRandomParticipant = () => {
    const allUserIds = Object.keys(users);
    const available = allUserIds.find(id => !wave.participantIds.includes(id));
    if (available) {
      onAddParticipant(available);
    } else {
      alert("All available users are already in this wave!");
    }
  };

  const handleTagSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative w-full">
      {/* Wave Header */}
      <div className="sticky top-0 z-20 flex flex-col border-b bg-white shadow-sm transition-colors duration-300">
        
        {/* Playback Controls */}
        {playbackMode && (
          <div className="bg-orange-50 px-4 py-2 border-b border-orange-200 flex items-center gap-4">
             <button onClick={() => setPlaybackMode(false)} className="text-orange-800 hover:text-orange-900 font-bold text-xs uppercase">
               Exit Playback
             </button>
             <div className="flex-1 flex items-center gap-3">
               <RotateCcw size={16} className="text-orange-600 cursor-pointer" onClick={() => setPlaybackValue(0)} />
               <input 
                 type="range" 
                 min="0" 
                 max="100" 
                 value={playbackValue} 
                 onChange={(e) => setPlaybackValue(Number(e.target.value))}
                 className="flex-1 h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
               />
               <span className="text-xs font-mono text-orange-800 w-12 text-right">
                 {Math.round(playbackValue)}%
               </span>
             </div>
          </div>
        )}

        {/* Title Bar with Breadcrumbs */}
        <div className={`flex flex-col px-4 py-3 ${playbackMode ? 'bg-orange-50' : 'bg-blue-50'}`}>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-xs text-blue-600 mb-1 flex-wrap">
              {currentDomain ? (
                  <button 
                      onClick={() => onSelectDomain(currentDomain.id)}
                      className="hover:underline opacity-80 hover:opacity-100 flex items-center gap-1 font-bold text-blue-700 bg-blue-100/50 px-1.5 py-0.5 rounded"
                  >
                      <Hexagon size={10} /> {currentDomain.name}
                  </button>
              ) : ancestors.length === 0 ? (
                  null
              ) : (
                  <span className="opacity-60">Inbox</span>
              )}
              
              {/* Only show separator if there is something before the ancestors/current */}
              {(currentDomain || ancestors.length > 0) && ancestors.length > 0 && (
                   <ChevronRight size={10} className="text-blue-400" />
              )}

              {ancestors.map(ancestor => (
                <React.Fragment key={ancestor.id}>
                  <button 
                    onClick={() => onSelectWave(ancestor.id)}
                    className="hover:underline font-medium truncate max-w-[100px]"
                  >
                    {ancestor.title}
                  </button>
                  <ChevronRight size={10} className="text-blue-400" />
                </React.Fragment>
              ))}
              
              {/* Separator before current wave if there are ancestors or domain */}
              {(currentDomain || ancestors.length > 0) && (
                 <>
                   {!ancestors.length && <ChevronRight size={10} className="text-blue-400" />}
                   <span className="text-gray-500 font-medium truncate max-w-[100px]">Current</span>
                 </>
              )}
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 overflow-hidden">
               <button onClick={onCloseMobile} className="md:hidden text-blue-600 p-1 hover:bg-blue-100 rounded mt-1">
                 <ArrowLeft size={20} />
               </button>
              <div className="flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 truncate leading-tight flex items-center gap-2 flex-wrap">
                  {wave.title}
                  {wave.isPinned && (
                      <span className="text-purple-600 bg-purple-50 p-1 rounded-full" title="Pinned to Dashboard">
                          <Pin size={12} fill="currentColor" />
                      </span>
                  )}
                  {wave.tags.map(tag => (
                     <span key={tag} className="text-[10px] bg-white/50 px-2 py-0.5 rounded-full border border-blue-200 text-blue-700 font-medium shadow-sm flex items-center gap-1">
                       #{tag}
                       {!playbackMode && (
                         <button onClick={(e) => { e.stopPropagation(); onRemoveTag(tag); }} className="hover:text-red-500 rounded-full p-0.5 transition-colors">
                          <X size={10} /> 
                         </button>
                       )}
                     </span>
                  ))}
                </h2>
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  Last activity: {formatDate(wave.lastActivity)}
                  {!playbackMode && (
                     <button onClick={() => setPlaybackMode(true)} className="flex items-center gap-1 text-blue-600 hover:underline ml-2">
                       <Play size={10} /> Playback
                     </button>
                  )}
                  {activeUserIds.length > 0 && (
                     <span className="text-green-600 font-medium ml-2 text-[10px] bg-green-50 px-2 py-0.5 rounded-full">
                       {activeUserIds.length} users active
                     </span>
                  )}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={onTogglePin} 
                className={`p-2 hover:bg-purple-100 rounded-full transition-colors ${wave.isPinned ? 'text-purple-600' : 'text-gray-400 hover:text-purple-600'}`} 
                title={wave.isPinned ? "Unpin from Dashboard" : "Pin to Dashboard"}
              >
                <Pin size={20} className={wave.isPinned ? 'fill-current' : ''} />
              </button>
              <button onClick={onArchive} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-100 rounded-full transition-colors" title="Archive">
                <Archive size={20} />
              </button>
              <button 
                  onClick={() => onLeaveWave(wave.id)} 
                  className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-100 rounded-full transition-colors" 
                  title="Leave Wave"
              >
                <Users size={20} />
              </button>
              <button onClick={onDelete} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors" title="Delete Wave">
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Governance / Status Header for Proposals */}
        {wave.proposalMetadata && (
            <div className={`px-4 py-3 border-b flex items-center justify-between ${
                wave.proposalMetadata.status === 'implemented' ? 'bg-green-50 border-green-200' :
                wave.proposalMetadata.status === 'active' ? 'bg-teal-50 border-teal-200' : 'bg-gray-50 border-gray-200'
            }`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                        wave.proposalMetadata.status === 'implemented' ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'
                    }`}>
                        {wave.proposalMetadata.status === 'implemented' ? <CheckCircle size={20} /> : <Sprout size={20} />}
                    </div>
                    <div>
                        <h3 className={`text-sm font-bold ${
                            wave.proposalMetadata.status === 'implemented' ? 'text-green-800' : 'text-teal-800'
                        }`}>
                            Status: {wave.proposalMetadata.status === 'implemented' ? 'Ratified & Implemented' : 'Active Proposal'}
                        </h3>
                        <p className="text-xs opacity-75">
                            {wave.proposalMetadata.status === 'implemented' 
                                ? 'This proposal has passed and actions have been executed.' 
                                : 'This proposal is open for consent.'}
                        </p>
                    </div>
                </div>

                {/* Ratify Button */}
                {wave.proposalMetadata.status === 'active' && onExecuteProposal && (
                    <button 
                        onClick={() => onExecuteProposal(wave.id)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                        <CheckCircle size={14} /> Ratify & Implement
                    </button>
                )}
            </div>
        )}

        {/* Participants & Tags Bar */}
        {!playbackMode && (
          <div className="flex items-center px-4 py-2 bg-white border-b border-gray-100 gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center -space-x-2 mr-2">
              {participants.map((user) => {
                const isActive = remoteCursors[user.id];
                return (
                  <div key={user.id} className={`relative z-0 hover:z-10 transition-all ${isActive ? 'z-20 transform -translate-y-1' : ''}`}>
                    <Avatar 
                      user={user} 
                      size="md" 
                      showStatus 
                      onClick={() => onViewProfile(user.id)}
                    />
                    {isActive && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 border-2 border-white animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button 
              onClick={handleAddRandomParticipant}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600 transition-colors border border-dashed border-gray-300"
              title="Add Participant"
            >
              <Plus size={16} />
            </button>
            
            <div className="h-6 w-px bg-gray-200 mx-2"></div>

            <form 
              onSubmit={handleTagSubmit} 
              className="flex items-center group bg-white border border-gray-300 rounded-full px-3 py-1.5 shadow-sm hover:border-blue-400 hover:shadow transition-all"
            >
              <Tag size={14} className="text-gray-500 group-hover:text-blue-500 transition-colors mr-2"/>
              <input 
                type="text" 
                value={newTag} 
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="text-xs border-none focus:ring-0 bg-transparent placeholder-gray-500 w-24 text-gray-700 p-0"
              />
              <button 
                type="submit" 
                className={`ml-1 rounded-full p-0.5 transition-colors ${newTag ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-300 cursor-default'}`}
                disabled={!newTag}
                title="Add Tag"
              >
                <Plus size={14} />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Main Conversation Area */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50"
      >
        <div className="max-w-4xl mx-auto pb-20">
          
          {/* Subwaves Panel */}
          {!playbackMode && (subwaves.length > 0 || wave.parentId) && (
             <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                     <Folder size={12} />
                     Subwaves
                   </h3>
                   <button 
                     onClick={() => onCreateSubwave(wave.id)}
                     className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded flex items-center gap-1 font-medium"
                   >
                     <Plus size={12} /> New Subwave
                   </button>
                </div>
                
                {subwaves.length === 0 ? (
                  <div className="border border-dashed border-gray-200 rounded-lg p-3 text-center bg-gray-50/50">
                    <p className="text-xs text-gray-400">No subwaves yet. Create one to nest conversations.</p>
                  </div>
                ) : (
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-2">
                    {subwaves.map(sub => (
                      <div 
                        key={sub.id}
                        onClick={() => onSelectWave(sub.id)}
                        className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer transition-all group"
                      >
                         <div className="flex items-center justify-between mb-1">
                            <div className="font-semibold text-sm text-gray-800 group-hover:text-blue-600 truncate">{sub.title}</div>
                            {sub.tags.length > 0 && <div className="w-2 h-2 rounded-full bg-blue-400"></div>}
                         </div>
                         <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                               <CornerDownRight size={12} className="text-gray-300" />
                               <span>{sub.participantIds.length} participants</span>
                            </div>
                            <span>{formatDate(sub.lastActivity)}</span>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          )}

          {/* Root Blip */}
          <Blip
            key={wave.rootBlip.id}
            blip={wave.rootBlip}
            users={users}
            currentUser={currentUser}
            playbackTime={playbackTimestamp}
            initialEditMode={isNewWave}
            remoteCursors={remoteCursors}
            onReply={onReply}
            onEdit={onEditBlip}
            onDelete={onDeleteBlip}
            onVoteGadget={onVoteGadget}
            onViewProfile={onViewProfile}
            onToggleBlipLock={onToggleBlipLock}
            onConsentVote={onConsentVote} // Pass onConsentVote here
            isDM={wave.isDM}
          />
          
          <div className="mt-12 flex justify-center">
            <div className="h-px w-full bg-gray-200 relative">
               <span className="absolute left-1/2 transform -translate-x-1/2 -top-3 bg-gray-50 px-2 text-gray-400 text-xs uppercase tracking-widest">
                 End of Wave
               </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaveView;
