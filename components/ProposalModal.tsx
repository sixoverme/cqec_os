
import React, { useState, useMemo, useEffect } from 'react';
import { Domain, User, Role } from '../types';
import { X, Sprout, UserPlus, Hexagon } from 'lucide-react';

export interface ProposalData {
  type: 'operational' | 'role_assignment' | 'circle_creation';
  title: string;
  domainId: string;
  aims: string;
  problem: string;
  action: string;
  measurement: string;
  timeline: string;
  // Role specific fields
  roleName?: string;
  nomineeId?: string;
  reasoning?: string;
}

interface ProposalModalProps {
  domains: Domain[];
  users: Record<string, User>;
  roles: Role[];
  initialMode?: 'operational' | 'role_assignment' | 'circle_creation';
  initialParentId?: string;
  onClose: () => void;
  onSubmit: (data: ProposalData) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ 
  domains, 
  users, 
  roles, 
  initialMode = 'operational', 
  initialParentId, 
  onClose, 
  onSubmit 
}) => {
  const [mode, setMode] = useState<'operational' | 'role_assignment' | 'circle_creation'>(initialMode);

  // Helper to flatten domains into hierarchy for the dropdown
  const sortedDomains = useMemo(() => {
    const flatten = (parentId: string | undefined, depth: number): { domain: Domain; depth: number }[] => {
      const children = domains.filter(d => d.parentId === parentId);
      return children.flatMap(child => [
        { domain: child, depth },
        ...flatten(child.id, depth + 1)
      ]);
    };
    return flatten(undefined, 0);
  }, [domains]);

  const [data, setData] = useState<ProposalData>({
    type: initialMode,
    title: '',
    domainId: initialParentId || sortedDomains[0]?.domain.id || '',
    aims: '',
    problem: '',
    action: '',
    measurement: '',
    timeline: '',
    roleName: '',
    nomineeId: '',
    reasoning: ''
  });

  const availableRoles = useMemo(() => {
    return roles.filter(r => r.domainId === data.domainId);
  }, [roles, data.domainId]);

  const handleChange = (field: keyof ProposalData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...data, type: mode });
  };

  const getHeaderIcon = () => {
    switch(mode) {
      case 'role_assignment': return <UserPlus size={24} />;
      case 'circle_creation': return <Hexagon size={24} />;
      default: return <Sprout size={24} />;
    }
  };

  const getHeaderColor = () => {
    switch(mode) {
      case 'role_assignment': return 'bg-indigo-100 text-indigo-700';
      case 'circle_creation': return 'bg-purple-100 text-purple-700';
      default: return 'bg-teal-100 text-teal-700';
    }
  };

  const getSubmitButtonColor = () => {
    switch(mode) {
      case 'role_assignment': return 'bg-indigo-600 hover:bg-indigo-700';
      case 'circle_creation': return 'bg-purple-600 hover:bg-purple-700';
      default: return 'bg-teal-600 hover:bg-teal-700';
    }
  };

  const getSubmitLabel = () => {
    switch(mode) {
      case 'role_assignment': return 'Propose Assignment';
      case 'circle_creation': return 'Propose Structure';
      default: return 'Draft Proposal';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-purple-100 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getHeaderColor()}`}>
              {getHeaderIcon()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Draft New Proposal</h2>
              <p className="text-xs text-slate-500">
                {mode === 'role_assignment' ? 'Nominate or assign a role.' : 
                 mode === 'circle_creation' ? 'Define a new organ of the collective.' :
                 'Plant a seed in the mycelium.'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-6 pb-2">
            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                <button 
                  type="button" 
                  onClick={() => setMode('operational')}
                  className={`flex-1 py-1.5 px-3 text-sm font-bold rounded-md transition-all whitespace-nowrap ${mode === 'operational' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Policy / Action
                </button>
                <button 
                  type="button" 
                  onClick={() => setMode('role_assignment')}
                  className={`flex-1 py-1.5 px-3 text-sm font-bold rounded-md transition-all whitespace-nowrap ${mode === 'role_assignment' ? 'bg-white text-indigo-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Role Assignment
                </button>
                <button 
                  type="button" 
                  onClick={() => setMode('circle_creation')}
                  className={`flex-1 py-1.5 px-3 text-sm font-bold rounded-md transition-all whitespace-nowrap ${mode === 'circle_creation' ? 'bg-white text-purple-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Create Circle
                </button>
            </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">
                 {mode === 'role_assignment' ? 'Role Title' : 
                  mode === 'circle_creation' ? 'New Circle Name' : 
                  'Proposal Title'}
              </label>
              
              {mode === 'role_assignment' ? (
                <div className="relative">
                   <input 
                      required
                      type="text"
                      list="role-suggestions"
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                      placeholder="e.g. Facilitator"
                      value={data.roleName}
                      onChange={e => handleChange('roleName', e.target.value)}
                   />
                   <datalist id="role-suggestions">
                      {availableRoles.map(r => <option key={r.id} value={r.name} />)}
                   </datalist>
                </div>
              ) : (
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all"
                  placeholder={mode === 'circle_creation' ? "e.g., Care & Welfare Circle" : "e.g., Community Garden Expansion"}
                  value={data.title}
                  onChange={e => handleChange('title', e.target.value)}
                />
              )}
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                  {mode === 'circle_creation' ? 'Parent Circle' : 'Domain (Circle)'}
              </label>
              <select 
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none bg-white"
                value={data.domainId}
                onChange={e => handleChange('domainId', e.target.value)}
              >
                {sortedDomains.map(({ domain, depth }) => (
                  <option key={domain.id} value={domain.id}>
                    {'\u00A0'.repeat(depth * 3) + (depth > 0 ? '↳ ' : '') + domain.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {mode === 'role_assignment' && (
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Nominee</label>
                <select 
                   required
                   className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none bg-white"
                   value={data.nomineeId}
                   onChange={e => handleChange('nomineeId', e.target.value)}
                >
                    <option value="">Select a member...</option>
                    {(Object.values(users) as User[]).map((u) => (
                        <option key={u.id} value={u.id}>{u.name} (@{u.handle})</option>
                    ))}
                </select>
             </div>
          )}

          {mode === 'role_assignment' ? (
              <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Reasoning & Qualifications</label>
                    <textarea 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none h-32"
                        placeholder="They have demonstrated great capacity for..."
                        value={data.reasoning}
                        onChange={e => handleChange('reasoning', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Term & Capacity</label>
                    <textarea 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none resize-none h-20"
                        placeholder="6 months, 2 hours per week..."
                        value={data.timeline}
                        onChange={e => handleChange('timeline', e.target.value)}
                    />
                  </div>
              </div>
          ) : mode === 'circle_creation' ? (
              <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Purpose / Aims</label>
                    <p className="text-xs text-slate-500 mb-2">What will this circle do? What is its mission?</p>
                    <textarea 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-24"
                    placeholder="To support members in times of need and coordinate mutual aid..."
                    value={data.aims}
                    onChange={e => handleChange('aims', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Domain / Responsibilities</label>
                    <p className="text-xs text-slate-500 mb-2">What area does this circle have authority over?</p>
                    <textarea 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-24"
                    placeholder="The food pantry, sick visits, and emergency fund allocation..."
                    value={data.problem} // Reusing 'problem' field for Domain description
                    onChange={e => handleChange('problem', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Review Date</label>
                    <p className="text-xs text-slate-500 mb-2">When should we review this structure?</p>
                    <textarea 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-16"
                        placeholder="In 6 months..."
                        value={data.timeline}
                        onChange={e => handleChange('timeline', e.target.value)}
                    />
                </div>
              </div>
          ) : (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Aims & Values</label>
                    <textarea 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-24"
                    placeholder="Expanding our food sovereignty initiatives aligns with our value of Abundance..."
                    value={data.aims}
                    onChange={e => handleChange('aims', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Problem / Opportunity</label>
                    <textarea 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-24"
                    placeholder="The lot next door is currently empty..."
                    value={data.problem}
                    onChange={e => handleChange('problem', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Proposed Action</label>
                    <textarea 
                    required
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-24"
                    placeholder="Allocate $500 from the seed fund..."
                    value={data.action}
                    onChange={e => handleChange('action', e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Measurement</label>
                    <textarea 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-20"
                        placeholder="We secure the permit..."
                        value={data.measurement}
                        onChange={e => handleChange('measurement', e.target.value)}
                    />
                    </div>
                    <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Timeline</label>
                    <textarea 
                        required
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none resize-none h-20"
                        placeholder="By end of Q3..."
                        value={data.timeline}
                        onChange={e => handleChange('timeline', e.target.value)}
                    />
                    </div>
                </div>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white pb-0">
             <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">
               Cancel
             </button>
             <button type="submit" className={`px-6 py-2.5 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 ${getSubmitButtonColor()}`}>
               {getHeaderIcon()} 
               {getSubmitLabel()}
             </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProposalModal;
