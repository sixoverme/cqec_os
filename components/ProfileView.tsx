
import React, { useState, useRef, useMemo } from 'react';
import { User, Role, Domain } from '../types';
import Avatar from './Avatar';
import { Camera, Mail, AtSign, Save, X, MessageCircle, Battery, BatteryMedium, BatteryLow, BatteryWarning, Shield } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  roles: Role[];
  domains: Domain[];
  isCurrentUser: boolean;
  onClose: () => void;
  onUpdateProfile: (updatedUser: User) => void;
  onMessage: (userId: string) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ 
  user, 
  roles,
  domains,
  isCurrentUser, 
  onClose, 
  onUpdateProfile,
  onMessage
}) => {
  const [formData, setFormData] = useState({ ...user });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userRoles = useMemo(() => {
    return roles.filter(r => r.holderIds.includes(user.id));
  }, [roles, user.id]);

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarClick = () => {
    if (isCurrentUser && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewAvatar(result);
        handleChange('avatar', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    onClose();
  };

  const getCapacityIcon = (capacity: string, active: boolean) => {
    const className = active ? "text-white" : "";
    switch(capacity) {
        case 'high': return <Battery size={14} className={active ? "text-green-300" : "text-green-500"} />;
        case 'medium': return <BatteryMedium size={14} className={active ? "text-yellow-300" : "text-yellow-500"} />;
        case 'low': return <BatteryLow size={14} className={active ? "text-orange-300" : "text-orange-500"} />;
        case 'no_spoons': return <BatteryWarning size={14} className={active ? "text-red-300" : "text-red-500"} />;
        default: return <BatteryMedium size={14} className="text-gray-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      {/* Header / Banner */}
      <div className="bg-blue-600 h-32 w-full relative flex-shrink-0">
        <button 
          onClick={onClose}
          className="absolute top-4 left-4 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex flex-col items-center -mt-16 px-4 pb-12">
        {/* Avatar Section */}
        <div className="relative group">
          <div 
            className={`rounded-full p-1 bg-white shadow-lg ${isCurrentUser ? 'cursor-pointer' : ''}`}
            onClick={handleAvatarClick}
          >
            <Avatar 
              user={{...formData, avatar: previewAvatar || formData.avatar}} 
              size="2xl" 
              showStatus 
            />
          </div>
          
          {isCurrentUser && (
            <div 
              className="absolute bottom-2 right-2 bg-gray-800 text-white p-2 rounded-full cursor-pointer hover:bg-gray-700 shadow-md border-2 border-white"
              onClick={handleAvatarClick}
            >
              <Camera size={16} />
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange}
          />
        </div>

        {/* Profile Info Form/Display */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 w-full max-w-lg mt-6 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {isCurrentUser ? 'Edit Profile' : 'User Profile'}
            </h2>
            {!isCurrentUser && (
              <button 
                onClick={() => onMessage(user.id)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
              >
                <MessageCircle size={18} /> Message
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Display Name</label>
              {isCurrentUser ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all"
                />
              ) : (
                <p className="text-lg text-gray-900">{user.name}</p>
              )}
            </div>

            {/* Handle & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Handle</label>
                <div className="flex items-center text-gray-500">
                  <AtSign size={16} className="mr-1" />
                  {isCurrentUser ? (
                    <input
                      type="text"
                      value={formData.handle}
                      onChange={(e) => handleChange('handle', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{user.handle}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <div className="flex items-center text-gray-500">
                  <Mail size={16} className="mr-1" />
                  {isCurrentUser ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none"
                    />
                  ) : (
                    <p className="text-gray-900">{user.email}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Roles Section */}
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Active Roles</label>
                {userRoles.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {userRoles.map(role => {
                            const domain = domains.find(d => d.id === role.domainId);
                            return (
                                <div key={role.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-800 text-sm">
                                    <Shield size={14} className="text-indigo-500" />
                                    <span className="font-bold">{role.name}</span>
                                    {domain && <span className="text-indigo-400 text-xs">@ {domain.name}</span>}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No active governance roles.</p>
                )}
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">About</label>
              {isCurrentUser ? (
                <textarea
                  rows={4}
                  value={formData.bio || ''}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none"
                  placeholder="Tell us a bit about yourself..."
                />
              ) : (
                <p className="text-gray-600 leading-relaxed italic">{user.bio || "No bio yet."}</p>
              )}
            </div>

            {/* Capacity Display / Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Current Capacity</label>
              
              {isCurrentUser ? (
                <div className="flex gap-2 flex-wrap">
                  {(['high', 'medium', 'low', 'no_spoons'] as const).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => handleChange('capacity', c)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all flex items-center gap-2
                        ${formData.capacity === c 
                          ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-200' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      {getCapacityIcon(c, formData.capacity === c)}
                      {c.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2 text-slate-700 font-medium capitalize">
                        {getCapacityIcon(user.capacity, false)}
                        {user.capacity.replace('_', ' ')}
                    </div>
                </div>
              )}
            </div>

            {/* Status Selector (Only for current user) */}
            {isCurrentUser && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Status</label>
                <div className="flex gap-3">
                  {(['online', 'idle', 'busy', 'offline'] as const).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleChange('status', s)}
                      className={`
                        px-3 py-1.5 rounded-full text-xs font-medium capitalize border transition-all flex items-center gap-2
                        ${formData.status === s 
                          ? 'bg-gray-800 text-white border-gray-800 ring-2 ring-gray-200' 
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className={`w-2 h-2 rounded-full ${
                        s === 'online' ? 'bg-green-500' :
                        s === 'idle' ? 'bg-amber-500' :
                        s === 'busy' ? 'bg-red-500' : 'bg-gray-400'
                      }`} />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isCurrentUser && (
              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
                 <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 shadow-md transition-all flex items-center gap-2 font-medium"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
