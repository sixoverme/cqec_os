import React from 'react';
import { Gadget, User } from '../types';
import { BarChart2 } from 'lucide-react';

interface PollGadgetProps {
  gadget: Gadget;
  currentUser: User;
  onVote: (gadgetId: string, optionId: string) => void;
}

const PollGadget: React.FC<PollGadgetProps> = ({ gadget, currentUser, onVote }) => {
  const totalVotes = gadget.data.options.reduce((acc, opt) => acc + opt.voterIds.length, 0);

  return (
    <div className="my-3 border rounded-lg bg-yellow-50 border-yellow-200 overflow-hidden max-w-sm">
      <div className="bg-yellow-100 px-3 py-2 flex items-center gap-2 border-b border-yellow-200">
        <BarChart2 size={16} className="text-yellow-700" />
        <span className="text-sm font-bold text-yellow-900">Poll: {gadget.data.question}</span>
      </div>
      <div className="p-3 space-y-2">
        {gadget.data.options.map((option) => {
          const voteCount = option.voterIds.length;
          const percentage = totalVotes === 0 ? 0 : Math.round((voteCount / totalVotes) * 100);
          const hasVoted = option.voterIds.includes(currentUser.id);

          return (
            <div 
              key={option.id} 
              className="relative cursor-pointer group"
              onClick={() => onVote(gadget.id, option.id)}
            >
              <div className="flex justify-between text-xs mb-1 relative z-10">
                <span className={`font-medium ${hasVoted ? 'text-blue-700' : 'text-gray-700'}`}>
                  {option.text} {hasVoted && '(You)'}
                </span>
                <span className="text-gray-500">{voteCount} votes ({percentage}%)</span>
              </div>
              <div className="h-6 bg-white border border-gray-300 rounded overflow-hidden relative">
                <div 
                  className={`h-full transition-all duration-500 ${hasVoted ? 'bg-blue-400' : 'bg-green-400'}`} 
                  style={{ width: `${percentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 text-xs text-gray-600 font-medium">
                   {hasVoted ? 'Click to unvote' : 'Click to vote'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-3 py-2 bg-yellow-50 text-xs text-yellow-700 border-t border-yellow-200 flex justify-between">
        <span>{totalVotes} total votes</span>
        <span className="italic">Gadget</span>
      </div>
    </div>
  );
};

export default PollGadget;