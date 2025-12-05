
import React from 'react';
import { Gadget, User } from '../types';
import { ThumbsUp, AlertCircle, Ban, HelpCircle } from 'lucide-react';

interface ConsentGadgetProps {
  gadget: Gadget;
  currentUser: User;
  users: Record<string, User>;
  onVote: (gadgetId: string, voteType: 'consent' | 'concern' | 'objection') => void;
}

const ConsentGadget: React.FC<ConsentGadgetProps> = ({ gadget, currentUser, users, onVote }) => {
  if (gadget.type !== 'consent') return null;

  const votes = gadget.data.votes || [];
  
  const counts = {
    consent: votes.filter(v => v.type === 'consent').length,
    concern: votes.filter(v => v.type === 'concern').length,
    objection: votes.filter(v => v.type === 'objection').length,
  };

  const myVote = votes.find(v => v.userId === currentUser.id);

  return (
    <div className="my-4 border rounded-xl bg-white shadow-sm overflow-hidden max-w-lg ring-1 ring-slate-100">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
            <HelpCircle size={18} className="text-purple-600" />
            <span className="font-bold text-slate-700">Governance: {gadget.data.topic || 'Consent Check'}</span>
        </div>
        <div className="flex gap-1">
            {votes.map(v => (
                <div key={v.userId} className="w-2 h-2 rounded-full" 
                     style={{ backgroundColor: v.type === 'consent' ? '#22c55e' : v.type === 'concern' ? '#eab308' : '#ef4444' }} 
                     title={users[v.userId]?.name}
                />
            ))}
        </div>
      </div>
      
      <div className="p-4 bg-white">
        <p className="text-sm text-slate-600 mb-4 italic text-center">
            "Does this proposal live our values? Is it safe to try?"
        </p>

        <div className="flex justify-center gap-3 mb-6">
            <button 
                onClick={() => onVote(gadget.id, 'consent')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg w-24 transition-all ${myVote?.type === 'consent' ? 'bg-green-100 text-green-800 ring-2 ring-green-400' : 'bg-slate-50 text-slate-500 hover:bg-green-50'}`}
            >
                <ThumbsUp size={24} />
                <span className="text-xs font-bold">Consent</span>
            </button>
            <button 
                onClick={() => onVote(gadget.id, 'concern')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg w-24 transition-all ${myVote?.type === 'concern' ? 'bg-yellow-100 text-yellow-800 ring-2 ring-yellow-400' : 'bg-slate-50 text-slate-500 hover:bg-yellow-50'}`}
            >
                <AlertCircle size={24} />
                <span className="text-xs font-bold">Concern</span>
            </button>
            <button 
                onClick={() => onVote(gadget.id, 'objection')}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg w-24 transition-all ${myVote?.type === 'objection' ? 'bg-red-100 text-red-800 ring-2 ring-red-400' : 'bg-slate-50 text-slate-500 hover:bg-red-50'}`}
            >
                <Ban size={24} />
                <span className="text-xs font-bold">Objection</span>
            </button>
        </div>

        {/* Results Bar */}
        <div className="h-4 flex rounded-full overflow-hidden bg-slate-100">
            {counts.consent > 0 && <div style={{width: `${(counts.consent / votes.length) * 100}%`}} className="bg-green-500 h-full" />}
            {counts.concern > 0 && <div style={{width: `${(counts.concern / votes.length) * 100}%`}} className="bg-yellow-400 h-full" />}
            {counts.objection > 0 && <div style={{width: `${(counts.objection / votes.length) * 100}%`}} className="bg-red-500 h-full" />}
        </div>
        <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>{votes.length} votes</span>
            <span>Outcome: {counts.objection > 0 ? 'Blocked' : counts.concern > 0 ? 'Discussion Needed' : 'Safe to Try'}</span>
        </div>
      </div>
    </div>
  );
};

export default ConsentGadget;
