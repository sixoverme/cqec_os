
import { Blip, RemoteCursor, User } from './types';

// Recursively find a blip and update it, or add a child to it
export const updateBlipInTree = (root: Blip, targetId: string, updateFn: (b: Blip) => Blip): Blip => {
  if (root.id === targetId) {
    return updateFn(root);
  }
  return {
    ...root,
    children: root.children.map(child => updateBlipInTree(child, targetId, updateFn))
  };
};

export const addChildToBlip = (root: Blip, parentId: string, newBlip: Blip): Blip => {
  if (root.id === parentId) {
    return {
      ...root,
      children: [...root.children, newBlip]
    };
  }
  return {
    ...root,
    children: root.children.map(child => addChildToBlip(child, parentId, newBlip))
  };
};

export const deleteBlipFromTree = (root: Blip, targetId: string): Blip | null => {
  if (root.id === targetId) return null; // Should not happen for root usually unless entire wave deleted
  
  return {
    ...root,
    children: root.children
      .map(child => deleteBlipFromTree(child, targetId))
      .filter((child): child is Blip => child !== null)
  };
};

export const generateId = () => crypto.randomUUID();

export const formatTime = (timestamp: number) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  }).format(new Date(timestamp));
};

export const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  
  if (isToday) return formatTime(timestamp);
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(date);
};

// Rich Text Formatter with Cursor Support
export const parseContent = (text: string, remoteCursor?: { user: User, position: number }) => {
  let content = text;
  // Use a Private Use Area character as a temporary placeholder.
  // This allows the cursor to "exist" during Markdown processing without breaking regex patterns.
  const CURSOR_MARKER = '\uE000';

  // 1. Inject Marker
  if (remoteCursor && remoteCursor.position <= content.length) {
    content = content.slice(0, remoteCursor.position) + CURSOR_MARKER + content.slice(remoteCursor.position);
  }
  
  // 2. Escape HTML
  let html = content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 3. Process Markdown
  // The marker passes through these regexes harmlessly, preserving formatting structure (e.g. *bo|ld*).

  // Bold *text*
  html = html.replace(/\*(.*?)\*/g, '<strong>$1</strong>');
  
  // Italic _text_
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Strikethrough ~text~
  html = html.replace(/~(.*?)~/g, '<del>$1</del>');

  // Underline __text__
  html = html.replace(/__(.*?)__/g, '<u>$1</u>');

  // Code `text`
  html = html.replace(/`(.*?)`/g, '<code class="bg-gray-100 text-red-500 rounded px-1 font-mono text-xs">$1</code>');
  
  // Blockquote > text
  html = html.replace(/^&gt; (.*$)/gm, '<blockquote class="border-l-4 border-gray-300 pl-2 italic text-gray-500 my-1">$1</blockquote>');

  // Newlines
  html = html.replace(/\n/g, '<br/>');

  // 4. Expand Marker to Robust Cursor HTML
  // We apply 'select-none', 'pointer-events-none', and 'aria-hidden' to fix usability issues.
  if (remoteCursor && html.includes(CURSOR_MARKER)) {
    const cursorHtml = `
      <span 
        class="select-none pointer-events-none inline-block relative align-text-bottom animate-pulse" 
        contenteditable="false"
        aria-hidden="true"
        style="width: 0; height: 1.2em; border-left: 2px solid ${remoteCursor.user.color}; margin-left: -1px;"
      >
        <span 
          class="absolute -top-4 -left-0.5 text-[9px] font-bold text-white px-1 py-0.5 rounded shadow-sm whitespace-nowrap z-10"
          style="background-color: ${remoteCursor.user.color};"
        >
          ${remoteCursor.user.name}
        </span>
      </span>
    `.replace(/\s+/g, ' ').trim(); // Minify for cleaner DOM

    html = html.replace(CURSOR_MARKER, cursorHtml);
  }

  return { __html: html };
};
