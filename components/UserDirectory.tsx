
import React, { useState } from 'react';
import { User, Role, Domain } from '../types';
import Avatar from './Avatar';
import { Search, MessageCircle, Info, Battery, BatteryMedium, BatteryLow, BatteryWarning, Shield } from 'lucide-react';

interface UserDirectoryProps {
  users: Record<string, User>;
  roles: Role[];
  domains: Domain[];
  onSelectUser: (userId: string) => void;
  onMessageUser: (userId: string) => void;
}

const UserDirectory: React.FC<UserDirectoryProps> = ({ users, roles, domains, onSelectUser, onMessageUser }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = (Object.values(users) as User[]).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCapacityIcon = (capacity: User['capacity']) => {
      switch(capacity) {
          case 'high': return <Battery size={14} className="text-green-500" />;
          case 'medium': return <BatteryMedium size={14} className="text-yellow-500" />;
          case 'low': return <BatteryLow size={14} className="text-orange-500" />;
          case 'no_spoons': return <BatteryWarning size={14} className="text-red-500" />;
          default: return <BatteryMedium size={14} className="text-gray-400" />;
      }
  };

  const getUserRoles = (userId: string) => {
      return roles.filter(r => r.holderIds.includes(userId));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-6 bg-white border-b border-gray-200 shadow-sm">
         <h2 className="text-2xl font-bold text-gray-800 mb-4">User Directory</h2>
         <div className="relative max-w-md">
            <Search size={18} className="absolute left-3 top-3 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search people by name, handle, or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
            />
         </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {filteredUsers.map(user => {
             const userRoles = getUserRoles(user.id);
             return (
                <div key={user.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center group">
                    <div className="mb-3 cursor-pointer" onClick={() => onSelectUser(user.id)}>
                    <Avatar user={user} size="lg" showStatus />
                    </div>
                    
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    
                    <div className="flex items-center gap-1.5 my-2 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                        {getCapacityIcon(user.capacity)}
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wide">{user.capacity.replace('_', ' ')}</span>
                    </div>

                    <p className="text-xs text-blue-600 font-medium mb-1">@{user.handle}</p>
                    <p className="text-xs text-gray-500 mb-4 line-clamp-2 h-8">{user.bio || 'No status set.'}</p>
                    
                    {/* Role Badges */}
                    <div className="flex flex-wrap justify-center gap-1 mb-4 h-12 overflow-hidden">
                        {userRoles.map(role => (
                            <span key={role.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded border border-indigo-100" title={role.description}>
                                <Shield size={10} />
                                {role.name}
                            </span>
                        ))}
                    </div>

                    <div className="flex w-full gap-2 mt-auto">
                    <button 
                        onClick={() => onMessageUser(user.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded hover:bg-blue-100 transition-colors"
                    >
                        <MessageCircle size={14} /> Message
                    </button>
                    <button 
                        onClick={() => onSelectUser(user.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-gray-50 text-gray-700 text-xs font-bold rounded hover:bg-gray-100 transition-colors"
                    >
                        <Info size={14} /> Profile
                    </button>
                    </div>
                </div>
           )})}
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-400 mt-12">
            <p>No users found matching "{searchTerm}"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDirectory;
