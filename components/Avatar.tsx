
import React from 'react';
import { User } from '../types';

interface AvatarProps {
  user: User;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showStatus?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ user, size = 'md', showStatus = false, onClick, className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  };

  const statusColor = {
    online: 'bg-green-500',
    idle: 'bg-amber-500',
    offline: 'bg-gray-400',
    busy: 'bg-red-500',
  };

  return (
    <div 
      className={`relative inline-block ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <img
        src={user.avatar}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-full object-cover shadow-sm bg-white`}
        style={{ border: `2px solid ${user.color}` }}
      />
      {showStatus && (
        <span
          className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white ${statusColor[user.status]}`}
          title={user.status}
        />
      )}
    </div>
  );
};

export default Avatar;
