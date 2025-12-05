
import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Strikethrough, Code, Quote, BarChart2, Check, X } from 'lucide-react';
import { Gadget, User } from '../types';
import { generateId } from '../utils';
import PollGadget from './PollGadget';

interface RichTextEditorProps {
  initialContent?: string;
  currentUser: User;
  placeholder?: string;
  submitLabel?: string;
  onSave: (content: string, newGadgets: Gadget[]) => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  initialContent = '', 
  currentUser,
  placeholder = '', 
  submitLabel = 'Done',
  onSave, 
  onCancel,
  autoFocus = true
}) => {
  const [content, setContent] = useState(initialContent);
  const [pendingGadgets, setPendingGadgets] = useState<Gadget[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to end
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [autoFocus]);

  const insertFormatting = (wrapper: string, block = false) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = content;
    
    if (block) {
      // Robust multi-line block handling
      // 1. Find the start of the line where the selection begins
      let lineStart = text.lastIndexOf('\n', start - 1) + 1;
      // 2. Find the end of the line where the selection ends
      let lineEnd = text.indexOf('\n', end);
      if (lineEnd === -1) lineEnd = text.length;

      // Extract the full lines affected
      const selectedBlock = text.substring(lineStart, lineEnd);
      const lines = selectedBlock.split('\n');

      // Check if we are toggling off (all lines already start with wrapper)
      // Note: We assume the wrapper for blocks is like ">", so we look for "> "
      const prefix = `${wrapper} `;
      const allMatch = lines.every(line => line.startsWith(prefix) || line === wrapper);

      let newBlock = '';
      if (allMatch) {
        // Toggle OFF: Remove prefix from all selected lines
        newBlock = lines.map(line => {
          if (line.startsWith(prefix)) return line.substring(prefix.length);
          if (line === wrapper) return '';
          return line;
        }).join('\n');
      } else {
        // Toggle ON: Add prefix to all selected lines
        newBlock = lines.map(line => `${prefix}${line}`).join('\n');
      }

      const newText = text.substring(0, lineStart) + newBlock + text.substring(lineEnd);
      setContent(newText);

      // Restore selection to cover the modified block
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newEnd = lineStart + newBlock.length;
          textareaRef.current.setSelectionRange(lineStart, newEnd);
        }
      }, 0);

    } else {
      // Inline formatting with toggle support
      const before = text.substring(0, start);
      const selection = text.substring(start, end);
      const after = text.substring(end);
      const wrapLen = wrapper.length;

      // Check if already wrapped to toggle off
      // We check if the text surrounding the selection matches the wrapper
      const isWrapped = before.endsWith(wrapper) && after.startsWith(wrapper);

      let newText = '';
      let newCursorStart = 0;
      let newCursorEnd = 0;

      if (isWrapped) {
        // Unwrap logic
        newText = before.substring(0, before.length - wrapLen) + selection + after.substring(wrapLen);
        newCursorStart = start - wrapLen;
        newCursorEnd = end - wrapLen;
      } else {
        // Wrap logic
        newText = `${before}${wrapper}${selection}${wrapper}${after}`;
        if (start === end) {
          // No selection: place cursor inside wrapper
          newCursorStart = start + wrapLen;
          newCursorEnd = start + wrapLen;
        } else {
          // Selection exists: maintain selection inside wrapper
          newCursorStart = start + wrapLen;
          newCursorEnd = end + wrapLen;
        }
      }
      
      setContent(newText);
      setTimeout(() => {
        if(textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorStart, newCursorEnd);
        }
      }, 0);
    }
  };

  const handleAddPoll = () => {
    const newGadget: Gadget = {
      id: generateId(),
      type: 'poll',
      data: {
        question: 'New Poll',
        options: [
          { id: generateId(), text: 'Option A', voterIds: [] },
          { id: generateId(), text: 'Option B', voterIds: [] }
        ]
      }
    };
    setPendingGadgets([...pendingGadgets, newGadget]);
  };

  const handleSave = () => {
    if (content.trim() || pendingGadgets.length > 0) {
      onSave(content, pendingGadgets);
    }
  };

  return (
    <div className="border border-blue-300 rounded-lg shadow-sm bg-white overflow-hidden ring-2 ring-blue-100">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button onMouseDown={(e) => {e.preventDefault(); insertFormatting('*');}} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700" title="Bold"><Bold size={14}/></button>
        <button onMouseDown={(e) => {e.preventDefault(); insertFormatting('_');}} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700" title="Italic"><Italic size={14}/></button>
        <button onMouseDown={(e) => {e.preventDefault(); insertFormatting('__');}} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700" title="Underline"><Underline size={14}/></button>
        <button onMouseDown={(e) => {e.preventDefault(); insertFormatting('~');}} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700" title="Strikethrough"><Strikethrough size={14}/></button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button onMouseDown={(e) => {e.preventDefault(); insertFormatting('`');}} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700" title="Code"><Code size={14}/></button>
        <button onMouseDown={(e) => {e.preventDefault(); insertFormatting('>', true);}} className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-700" title="Quote"><Quote size={14}/></button>
        <div className="w-px h-4 bg-gray-300 mx-1"></div>
        <button 
          onMouseDown={(e) => {e.preventDefault(); handleAddPoll();}} 
          className="px-2 py-1 hover:bg-white hover:shadow-sm rounded text-gray-700 flex items-center gap-1 text-xs font-medium" 
          title="Add Poll"
        >
          <BarChart2 size={14} className="text-yellow-600"/> Poll
        </button>
      </div>

      {/* Editor Area */}
      <div className="p-2">
        <textarea
          ref={textareaRef}
          className="w-full min-h-[100px] outline-none text-sm text-gray-800 resize-y"
          placeholder={placeholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        
        {/* Pending Gadgets Preview */}
        {pendingGadgets.length > 0 && (
            <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Attached Gadgets</p>
                {pendingGadgets.map((g, idx) => (
                    <div key={g.id} className="relative group">
                         <PollGadget gadget={g} currentUser={currentUser} onVote={() => {}} />
                         <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-xs text-gray-500 bg-white px-1 rounded shadow">Pending...</span>
                         </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-2 p-2 bg-gray-50 border-t border-gray-100">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm flex items-center gap-1 transition-colors"
        >
          <Check size={14} /> {submitLabel}
        </button>
      </div>
    </div>
  );
};

export default RichTextEditor;
