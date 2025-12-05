
import React, { useState, useEffect } from 'react';
import { Blip as BlipType, User, Gadget, RemoteCursor } from '../types';
import Avatar from './Avatar';
import PollGadget from './PollGadget';
import ConsentGadget from './ConsentGadget';
import RichTextEditor from './RichTextEditor';
import { formatTime, parseContent } from '../utils';
import { Reply, Edit2, Trash2, Info, Lock, Unlock } from 'lucide-react';

interface BlipProps {
  blip: BlipType;
  users: Record<string, User>;
  currentUser: User;
  depth?: number;
  playbackTime?: number | null;
  initialEditMode?: boolean;
  remoteCursors?: Record<string, RemoteCursor>; 
  onReply: (parentId: string, content: string, gadgets: Gadget[]) => void;
  onEdit: (blipId: string, content: string, newGadgets: Gadget[]) => void;
  onDelete: (blipId: string) => void;
  onVoteGadget?: (blipId: string, gadgetId: string, optionId: string) => void;
  onConsentVote?: (blipId: string, gadgetId: string, voteType: 'consent' | 'concern' | 'objection') => void;
  onViewProfile?: (userId: string) => void; 
  onToggleBlipLock?: (blipId: string) => void;
  isDM?: boolean;
}

const Blip: React.FC<BlipProps> = ({ 
  blip, 
  users, 
  currentUser, 
  depth = 0, 
  playbackTime,
  initialEditMode = false,
  remoteCursors = {},
  onReply, 
  onEdit, 
  onDelete,
  onVoteGadget,
  onConsentVote,
  onViewProfile,
  onToggleBlipLock,
  isDM
}) => {
  const [isEditing, setIsEditing] = useState(initialEditMode);
  const [isReplying, setIsReplying] = useState(false);

  // Playback Logic
  if (playbackTime !== undefined && playbackTime !== null && blip.timestamp > playbackTime) {
    return null;
  }

  const author = users[blip.authorId] || { name: 'Unknown', avatar: '', status: 'offline', color: '#ccc' };
  const lastEditor = blip.lastEditorId ? users[blip.lastEditorId] : null;
  
  const isMe = blip.authorId === currentUser.id;
  const isRobot = author.isRobot;

  // Find if there is an active cursor on THIS blip
  const activeCursor = (Object.values(remoteCursors) as RemoteCursor[]).find(c => c.blipId === blip.id && c.isTyping);

  // Locking Logic
  // First blip (depth 0) in non-DMs is always editable (cannot be locked/toggled)
  const canToggleLock = isMe && (isDM || depth > 0);
  const isLocked = blip.isReadOnly || false;

  const handleSaveEdit = (content: string, newGadgets: Gadget[]) => {
    onEdit(blip.id, content, newGadgets);
    setIsEditing(false);
  };

  const handleSendReply = (content: string, gadgets: Gadget[]) => {
    onReply(blip.id, content, gadgets);
    setIsReplying(false);
  };

  // Prepare remote cursor for parsing
  const remoteCursorData = activeCursor ? {
    user: users[activeCursor.userId],
    position: activeCursor.position
  } : undefined;

  return (
    <div className={`flex flex-col ${depth > 0 ? 'mt-3' : 'mt-6'}`}>
      <div 
        className={`
          relative group flex gap-3 p-5 rounded-2xl border transition-all duration-300
          ${isEditing ? 'bg-white border-purple-300 shadow-lg p-0 ring-2 ring-purple-100' : 'bg-white border-slate-100 hover:shadow-md'}
          ${!isEditing && isRobot ? 'bg-stone-50 border-stone-200' : ''}
          ${!isEditing && activeCursor ? 'ring-1' : ''}
          ${depth === 0 ? 'shadow-sm' : ''} 
          ${isLocked && !isEditing ? 'bg-slate-50 border-slate-200' : ''}
        `}
        style={!isEditing && activeCursor ? { ringColor: users[activeCursor.userId]?.color, borderColor: users[activeCursor.userId]?.color } : {}}
      >
        {!isEditing && (
            <div className="flex-shrink-0 pt-1">
            <Avatar 
              user={author} 
              size="md" 
              onClick={() => onViewProfile && onViewProfile(author.id)}
            />
            </div>
        )}

        {/* Content Area */}
        <div className="flex-grow min-w-0">
          {!isEditing && (
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span 
                        className="font-bold text-sm text-slate-800 cursor-pointer hover:text-purple-700 transition-colors"
                        onClick={() => onViewProfile && onViewProfile(author.id)}
                    >
                        {author.name}
                    </span>
                    {isRobot && <span className="text-[10px] uppercase font-bold bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-md">Bot</span>}
                    {isLocked && (
                         <div className="flex items-center gap-1 text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold" title="Read Only">
                            <Lock size={10} /> Read Only
                         </div>
                    )}
                    {activeCursor && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white animate-pulse" style={{ backgroundColor: users[activeCursor.userId]?.color }}>
                            {users[activeCursor.userId]?.name} typing...
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatTime(blip.timestamp)}</span>
                    {blip.lastEdited && (
                        <span className="flex items-center gap-1 bg-slate-50 px-1.5 py-0.5 rounded text-slate-500" title={`Edited on ${formatTime(blip.lastEdited)}`}>
                           <Edit2 size={8} /> 
                           {lastEditor ? `Edited` : 'Edited'}
                        </span>
                    )}
                </div>
            </div>
          )}

          {isEditing ? (
            <div className="w-full">
                <div className="bg-purple-50 px-4 py-2 border-b border-purple-100 flex items-center justify-between rounded-t-lg">
                    <div className="flex items-center gap-2">
                        <Avatar user={currentUser} size="sm" />
                        <span className="text-xs font-semibold text-purple-800">
                            {isMe ? 'Editing your thought' : `Editing ${author.name}'s thought`}
                        </span>
                    </div>
                    {!isMe && (
                         <div className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">
                            <Info size={10} /> Collaboration
                         </div>
                    )}
                </div>
                <RichTextEditor 
                    initialContent={blip.content}
                    currentUser={currentUser}
                    onSave={handleSaveEdit}
                    onCancel={() => setIsEditing(false)}
                    submitLabel="Update"
                    autoFocus
                />
            </div>
          ) : (
            <div className={`text-slate-700 leading-relaxed text-[15px] prose prose-sm max-w-none prose-p:my-1 prose-headings:text-slate-800 prose-a:text-purple-600 ${isLocked ? 'text-slate-600' : ''}`}>
              <div dangerouslySetInnerHTML={parseContent(blip.content, remoteCursorData)} />
              
              {/* Render Gadgets */}
              {blip.gadgets && blip.gadgets.map(g => (
                <div key={g.id}>
                  {g.type === 'poll' && (
                    <PollGadget 
                      gadget={g} 
                      currentUser={currentUser} 
                      onVote={(gid, oid) => onVoteGadget && onVoteGadget(blip.id, gid, oid)}
                    />
                  )}
                  {g.type === 'consent' && (
                    <ConsentGadget 
                      gadget={g} 
                      currentUser={currentUser} 
                      users={users}
                      onVote={(gid, vote) => onConsentVote && onConsentVote(blip.id, gid, vote)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions Bar */}
          {!isEditing && playbackTime === null && (
            <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md hover:text-purple-600 transition-colors"
              >
                <Reply size={14} /> Reply
              </button>
              
              {!isLocked && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md hover:text-teal-600 transition-colors"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}

              {onToggleBlipLock && canToggleLock && (
                  <button
                    onClick={() => onToggleBlipLock(blip.id)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                        isLocked 
                        ? 'text-orange-600 bg-orange-50 hover:bg-orange-100' 
                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                    }`}
                    title={isLocked ? "Unlock this message" : "Lock this message (Read Only)"}
                  >
                    {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                    {isLocked ? 'Unlock' : 'Lock'}
                  </button>
              )}

              {isMe && !isLocked && (
                  <button
                    onClick={() => onDelete(blip.id)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-md hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} /> Compost
                  </button>
              )}
            </div>
          )}

          {/* Reply Editor */}
          {isReplying && (
            <div className="mt-4 pl-4 border-l-2 border-purple-200 animate-fade-in">
              <div className="flex gap-3">
                 <div className="mt-1">
                    <Avatar user={currentUser} size="sm" />
                 </div>
                 <div className="flex-grow">
                    <RichTextEditor
                        currentUser={currentUser}
                        placeholder="Add to the stream..."
                        onSave={handleSendReply}
                        onCancel={() => setIsReplying(false)}
                        submitLabel="Reply"
                    />
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recursive Children */}
      {blip.children.length > 0 && (
        <div className={`pl-6 ${depth < 5 ? 'ml-3 border-l-2 border-slate-100' : ''}`}>
          {blip.children.map(child => (
            <Blip
              key={child.id}
              blip={child}
              users={users}
              currentUser={currentUser}
              depth={depth + 1}
              playbackTime={playbackTime}
              remoteCursors={remoteCursors}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onVoteGadget={onVoteGadget}
              onConsentVote={onConsentVote}
              onViewProfile={onViewProfile}
              onToggleBlipLock={onToggleBlipLock}
              isDM={isDM}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Blip;
