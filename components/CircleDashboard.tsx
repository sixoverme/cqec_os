
import React, { useState } from 'react';
import { Domain, Role, Wave, User } from '../types';
import Avatar from './Avatar';
import { formatDate } from '../utils';
import { 
  Users, Sprout, Activity, ArrowRight, Shield, Hexagon, 
  Plus, FileText, CheckCircle, AlertCircle, ArrowUpLeft,
  ChevronDown, MessageSquare, Pin
} from 'lucide-react';

interface CircleDashboardProps {
  domain: Domain;
  parentDomain?: Domain;
  subDomains: Domain[];
  roles: Role[];
  waves: Wave[];
  users: Record<string, User>;
  onSelectWave: (waveId: string) => void;
  onSelectDomain: (domainId: string) => void;
  onCreateWave: (type?: Wave['type']) => void;
  onDraftProposal: () => void;
}

const CircleDashboard: React.FC<CircleDashboardProps> = ({
  domain,
  parentDomain,
  subDomains,
  roles,
  waves,
  users,
  onSelectWave,
  onSelectDomain,
  onCreateWave,
  onDraftProposal
}) => {
  const [isDiscussMenuOpen, setIsDiscussMenuOpen] = useState(false);

  // Filter for specific content types
  const activeProposals = waves.filter(w => 
    w.type === 'proposal' && 
    w.proposalMetadata?.status === 'active'
  );
  
  // Pinned items (including circle_home by legacy/default)
  const pinnedWaves = waves.filter(w => w.isPinned || w.type === 'circle_home').sort((a,b) => b.lastActivity - a.lastActivity);

  const recentDiscussions = waves
    .filter(w => w.type === 'discussion' || (w.type === 'circle_home' && !w.isPinned)) // Only show unpinned homes in recent? actually homes are usually pinned.
    .filter(w => !pinnedWaves.includes(w)) // Don't show pinned items in recent list to avoid clutter, or show them? Usually distinct.
    .sort((a, b) => b.lastActivity - a.lastActivity)
    .slice(0, 5);

  const hasCircleHome = waves.some(w => w.type === 'circle_home');

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto">
      {/* Hero Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-10 shadow-sm relative">
        <div className="max-w-5xl mx-auto">
          {parentDomain && (
              <button 
                onClick={() => onSelectDomain(parentDomain.id)}
                className="absolute top-4 left-8 text-xs font-bold text-slate-400 hover:text-purple-600 flex items-center gap-1 transition-colors uppercase tracking-wider"
              >
                <ArrowUpLeft size={14} /> Back to {parentDomain.name}
              </button>
          )}

          <div className="flex items-start justify-between mt-4">
            <div>
              <div className="flex items-center gap-2 mb-2 text-purple-600 font-bold text-sm uppercase tracking-wider">
                <Hexagon size={16} />
                <span>Circle Dashboard</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">{domain.name}</h1>
              <p className="text-lg text-slate-500 max-w-2xl">{domain.description || 'A space for collaboration and governance.'}</p>
            </div>
            <div className="flex gap-3 relative">
               
               {/* Discuss Button Logic */}
               {!hasCircleHome ? (
                  <div className="relative">
                      <button 
                          onClick={() => setIsDiscussMenuOpen(!isDiscussMenuOpen)}
                          className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2"
                      >
                          <Plus size={18} /> Discuss <ChevronDown size={16} />
                      </button>
                      
                      {isDiscussMenuOpen && (
                          <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20 animate-fade-in">
                              <button 
                                  onClick={() => { onCreateWave('discussion'); setIsDiscussMenuOpen(false); }} 
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700"
                              >
                                  <MessageSquare size={18} className="text-blue-500" />
                                  <div>
                                      <span className="block font-bold text-sm">New Discussion</span>
                                      <span className="block text-xs text-slate-400">Standard thread</span>
                                  </div>
                              </button>
                              <button 
                                  onClick={() => { onCreateWave('circle_home'); setIsDiscussMenuOpen(false); }} 
                                  className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-slate-700 border-t border-slate-50"
                              >
                                  <Hexagon size={18} className="text-purple-500" />
                                  <div>
                                      <span className="block font-bold text-sm">Create Circle Home</span>
                                      <span className="block text-xs text-slate-400">Pinned dashboard wave</span>
                                  </div>
                              </button>
                          </div>
                      )}
                      {/* Click Outside Overlay */}
                      {isDiscussMenuOpen && <div className="fixed inset-0 z-10" onClick={() => setIsDiscussMenuOpen(false)} />}
                  </div>
               ) : (
                   <button 
                     onClick={() => onCreateWave('discussion')}
                     className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-2"
                   >
                     <Plus size={18} /> Discuss
                   </button>
               )}

               <button 
                 onClick={onDraftProposal}
                 className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 shadow-md flex items-center gap-2"
               >
                 <Sprout size={18} /> Propose
               </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-8 py-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Governance & Structure */}
          <div className="space-y-6">
            
            {/* Roles Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <Shield size={18} className="text-indigo-500" />
                   Roles & Stewards
                 </h3>
              </div>
              <div className="p-2">
                {roles.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-sm italic">
                    No roles defined yet.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {roles.map(role => (
                      <div key={role.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors group">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800">{role.name}</span>
                          <span className="text-xs text-slate-400 line-clamp-1">{role.description}</span>
                        </div>
                        <div className="flex -space-x-2">
                           {role.holderIds.map(uid => (
                             users[uid] ? <Avatar key={uid} user={users[uid]} size="sm" /> : null
                           ))}
                           {role.holderIds.length === 0 && (
                             <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-1 rounded-full border border-slate-200">
                               Vacant
                             </span>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sub-circles Card */}
            {subDomains.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Hexagon size={18} className="text-purple-500" />
                    Sub-circles
                  </h3>
                </div>
                <div className="p-2">
                  <div className="space-y-1">
                    {subDomains.map(sd => (
                      <div 
                        key={sd.id} 
                        onClick={() => onSelectDomain(sd.id)}
                        className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                         <span className="text-sm font-medium text-slate-700">{sd.name}</span>
                         <ArrowRight size={14} className="text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column: Activity */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pinned Cards Section */}
            {pinnedWaves.length > 0 && (
                <div className="space-y-4">
                     {pinnedWaves.map(wave => (
                        <div 
                            key={wave.id}
                            onClick={() => onSelectWave(wave.id)}
                            className="bg-gradient-to-r from-purple-50 to-white border border-purple-200 rounded-xl p-6 shadow-sm cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group relative overflow-hidden"
                        >
                             <div className="absolute -right-6 -top-6 text-purple-100 group-hover:text-purple-200 transition-colors transform rotate-12">
                                <Hexagon size={120} fill="currentColor" />
                             </div>
                             
                             <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                                    <Pin size={14} className="fill-purple-700" />
                                    <span>{wave.type === 'circle_home' ? 'Circle Home' : 'Pinned'}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-purple-700 transition-colors">
                                    {wave.title}
                                </h3>
                                <p className="text-slate-600 text-sm line-clamp-2 max-w-lg mb-4">
                                    {wave.rootBlip.content.replace(/[#*`]/g, '').substring(0, 150)}...
                                </p>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                     <Avatar user={users[wave.rootBlip.authorId]} size="sm" />
                                     <span>Updated {formatDate(wave.lastActivity)}</span>
                                     {wave.type === 'proposal' && (
                                         <span className="flex items-center gap-1 bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-bold">
                                             <Sprout size={10} /> Proposal
                                         </span>
                                     )}
                                </div>
                             </div>
                        </div>
                     ))}
                </div>
            )}
            
            {/* Active Proposals Widget */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-teal-50/50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <Sprout size={18} className="text-teal-600" />
                   Active Proposals
                 </h3>
                 <span className="text-xs font-bold bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">
                   {activeProposals.length}
                 </span>
               </div>
               <div className="divide-y divide-slate-50">
                 {activeProposals.length === 0 ? (
                   <div className="p-8 text-center">
                      <div className="inline-block p-3 rounded-full bg-slate-50 mb-3">
                        <CheckCircle size={24} className="text-slate-300" />
                      </div>
                      <p className="text-slate-500 text-sm">No active proposals pending consent.</p>
                   </div>
                 ) : (
                   activeProposals.map(wave => (
                     <div 
                       key={wave.id} 
                       onClick={() => onSelectWave(wave.id)}
                       className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group"
                     >
                       <div className="flex justify-between items-start mb-1">
                         <h4 className="font-bold text-slate-800 text-sm group-hover:text-teal-700 transition-colors">
                            {wave.title}
                         </h4>
                         <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(wave.lastActivity)}</span>
                       </div>
                       <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                         {wave.rootBlip.content.replace(/[#*`]/g, '')}
                       </p>
                       <div className="flex items-center gap-2">
                          <Avatar user={users[wave.rootBlip.authorId]} size="sm" />
                          <span className="text-xs text-slate-500">Proposed by <span className="font-medium text-slate-700">{users[wave.rootBlip.authorId]?.name}</span></span>
                       </div>
                     </div>
                   ))
                 )}
               </div>
            </div>

            {/* Recent Discussions */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2">
                   <Activity size={18} className="text-slate-500" />
                   Recent Activity
                 </h3>
               </div>
               <div className="divide-y divide-slate-50">
                 {recentDiscussions.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 text-sm italic">
                        It's quiet in here...
                    </div>
                 ) : (
                    recentDiscussions.map(wave => (
                        <div 
                            key={wave.id} 
                            onClick={() => onSelectWave(wave.id)}
                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${wave.type === 'circle_home' ? 'bg-purple-100 text-purple-600' : 'bg-blue-50 text-blue-500'}`}>
                                    {wave.type === 'circle_home' ? <Hexagon size={16} /> : <FileText size={16} />}
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                                        {wave.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                                        <span>{users[wave.rootBlip.authorId]?.name}</span>
                                        <span>•</span>
                                        <span>{wave.participantIds.length} participants</span>
                                    </div>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400">{formatDate(wave.lastActivity)}</span>
                        </div>
                    ))
                 )}
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default CircleDashboard;
