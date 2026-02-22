import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Save, X, Lock, Shield, Phone, Briefcase, Mail } from 'lucide-react';
import clsx from 'clsx';

const Agents: React.FC = () => {
  const { users, addUser, updateUser, deleteUser } = useData();
  const { t } = useLanguage();
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<User>>({});

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({ ...user });
    } else {
      setEditingUser(null);
      setFormData({
        role: UserRole.AGENT,
        status: 'Active',
        availability: 'Always',
        department: '',
        sipExtension: '',
        sipPassword: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser({
        id: `u_${Date.now()}`,
        name: formData.name || '',
        email: formData.email || '',
        role: formData.role || UserRole.AGENT,
        status: formData.status || 'Active',
        availability: formData.availability || 'Always',
        avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=random`,
        department: formData.department,
        sipExtension: formData.sipExtension,
        sipPassword: formData.sipPassword
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUser(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-900">{t('agentsManagement')}</h2>
            <p className="text-slate-500 text-sm mt-1">{t('agentsDesc')}</p>
        </div>
        <button 
            onClick={() => openModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition shadow-sm"
        >
            <Plus className="w-4 h-4" /> {t('addAgent')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map(user => (
          <div key={user.id} className={clsx("bg-white rounded-xl border shadow-sm transition-all hover:shadow-md relative overflow-hidden", user.status === 'Disabled' ? "border-slate-200 opacity-75" : "border-slate-200")}>
             {/* Status Badge */}
             <div className={clsx("absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold uppercase", 
                 user.status === 'Active' ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
             )}>
                 {t(user.status.toLowerCase() as any) || user.status}
             </div>

             <div className="p-6">
                 <div className="flex items-center gap-4 mb-4">
                     <img src={user.avatar} alt={user.name} className="w-14 h-14 rounded-full border-2 border-indigo-50" />
                     <div>
                         <h3 className="text-lg font-bold text-slate-900">{user.name}</h3>
                         <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full w-fit mt-1">
                             {user.role === UserRole.ADMIN ? <Shield className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                             {user.role}
                         </span>
                     </div>
                 </div>

                 <div className="space-y-3 text-sm text-slate-600">
                     <div className="flex items-center gap-2">
                         <Mail className="w-4 h-4 text-slate-400" />
                         <span className="truncate">{user.email}</span>
                     </div>
                     <div className="flex items-center gap-2">
                         <Phone className="w-4 h-4 text-slate-400" />
                         <span>{t('sipExt')}: <strong>{user.sipExtension || 'N/A'}</strong></span>
                     </div>
                     {user.department && (
                         <div className="flex items-center gap-2">
                             <Briefcase className="w-4 h-4 text-slate-400" />
                             <span>{user.department}</span>
                         </div>
                     )}
                 </div>

                 <div className="mt-6 pt-4 border-t border-slate-100 flex gap-2">
                     <button onClick={() => openModal(user)} className="flex-1 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-2">
                         <Edit2 className="w-4 h-4" /> {t('editAgent')}
                     </button>
                 </div>
             </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">{editingUser ? t('editAgent') : t('addAgent')}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
                <form id="agentForm" onSubmit={handleSave} className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('name')}</label>
                            <input 
                                required type="text" 
                                value={formData.name || ''} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('email')}</label>
                            <input 
                                required type="email" 
                                value={formData.email || ''} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('role')}</label>
                            <select 
                                value={formData.role} 
                                onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            >
                                <option value={UserRole.AGENT}>Agent</option>
                                <option value={UserRole.ADMIN}>Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">{t('department')}</label>
                            <input 
                                type="text" 
                                value={formData.department || ''} 
                                onChange={e => setFormData({...formData, department: e.target.value})} 
                                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Status & Availability */}
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">{t('availability')}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('status')}</label>
                                <select 
                                    value={formData.status} 
                                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="Active">{t('active')}</option>
                                    <option value="Disabled">{t('disabled')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('availability')}</label>
                                <select 
                                    value={formData.availability} 
                                    onChange={e => setFormData({...formData, availability: e.target.value as any})}
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                >
                                    <option value="Always">{t('always')}</option>
                                    <option value="Working Hours">{t('workingHours')}</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* SIP Configuration */}
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <h4 className="font-semibold text-indigo-900 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                            <Lock className="w-4 h-4" /> {t('sipConfig')}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('sipExtension')}</label>
                                <input 
                                    type="text" 
                                    value={formData.sipExtension || ''} 
                                    onChange={e => setFormData({...formData, sipExtension: e.target.value})} 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                                    placeholder="1001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('sipPassword')}</label>
                                <input 
                                    type="password" 
                                    value={formData.sipPassword || ''} 
                                    onChange={e => setFormData({...formData, sipPassword: e.target.value})} 
                                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none font-mono"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2 text-slate-600 hover:text-slate-900 font-medium"
                >
                    {t('cancel')}
                </button>
                <button 
                    type="submit" 
                    form="agentForm"
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2"
                >
                    <Save className="w-4 h-4" /> {t('save')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;
