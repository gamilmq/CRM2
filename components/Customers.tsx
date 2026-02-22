import React, { useState, useMemo } from 'react';
import { Customer, UserRole } from '../types';
import { 
    Phone, MoreHorizontal, Filter, Plus, EyeOff, UserCheck, Shield, 
    FileText, User, ChevronLeft, ChevronRight, Search, FileEdit, CheckSquare, Square, Trash2, Users 
} from 'lucide-react';
import { sipService } from '../services/sipService';
import clsx from 'clsx';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

interface CustomersProps {
    currentUserRole: UserRole;
    currentUserId: string;
}

const Customers: React.FC<CustomersProps> = ({ currentUserRole, currentUserId }) => {
  const { t, isRTL } = useLanguage();
  const { customers, users, columnConfig, updateCustomer, bulkUpdateCustomers } = useData();
  
  // State for Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOperator, setFilterOperator] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterAgent, setFilterAgent] = useState('All');

  // State for Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // State for Selection & Actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [noteText, setNoteText] = useState('');

  // --- Derived Data (Filtering) ---
  const filteredCustomers = useMemo(() => {
      return customers.filter(c => {
          // 1. Role Check
          const isVisible = !c.isHidden;
          const isAssigned = currentUserRole === UserRole.ADMIN || c.assignedAgentId === currentUserId;
          if (currentUserRole !== UserRole.ADMIN && (!isVisible || !isAssigned)) return false;

          // 2. Search Term
          const term = searchTerm.toLowerCase();
          const matchesSearch = c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.id.toLowerCase().includes(term);
          if (!matchesSearch) return false;

          // 3. Dropdown Filters
          if (filterOperator !== 'All' && c.operator !== filterOperator) return false;
          if (filterStatus !== 'All' && c.lastCallStatus !== filterStatus) {
              if (filterStatus === 'None' && c.lastCallStatus) return false; 
              if (filterStatus !== 'None' && (!c.lastCallStatus && filterStatus !== 'None')) return false;
              if (filterStatus !== 'None' && c.lastCallStatus && c.lastCallStatus !== filterStatus) return false;
          }
          if (filterAgent !== 'All' && c.assignedAgentId !== filterAgent) return false;

          return true;
      });
  }, [customers, searchTerm, filterOperator, filterStatus, filterAgent, currentUserRole, currentUserId]);

  // --- Derived Data (Pagination) ---
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const paginatedCustomers = filteredCustomers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  // --- Handlers ---

  const handleAction = (customer: Customer, action: 'call' | 'hide' | 'transfer_admin' | 'transfer_agent' | 'notes' | 'profile') => {
      switch(action) {
          case 'call':
              sipService.makeCall(customer.phone);
              break;
          case 'hide':
              updateCustomer(customer.id, { isHidden: true });
              break;
          case 'transfer_admin':
              const admin = users.find(u => u.role === UserRole.ADMIN);
              if (admin) updateCustomer(customer.id, { assignedAgentId: admin.id });
              break;
          case 'transfer_agent':
              // Simple round robin find next agent for demo
              const agents = users.filter(u => u.role === UserRole.AGENT && u.id !== customer.assignedAgentId);
              if (agents.length > 0) updateCustomer(customer.id, { assignedAgentId: agents[0].id });
              break;
          case 'notes':
              setSelectedCustomer(customer);
              setNoteText(customer.notes || '');
              setNoteModalOpen(true);
              break;
          case 'profile':
              setSelectedCustomer(customer);
              setProfileModalOpen(true);
              break;
      }
  };

  const handleBulkAction = (action: 'hide' | 'transfer_admin' | 'transfer_agent') => {
      if (selectedIds.length === 0) return;
      
      switch(action) {
          case 'hide':
              bulkUpdateCustomers(selectedIds, { isHidden: true });
              break;
          case 'transfer_admin':
              const admin = users.find(u => u.role === UserRole.ADMIN);
              if (admin) bulkUpdateCustomers(selectedIds, { assignedAgentId: admin.id });
              break;
          case 'transfer_agent':
              // For bulk transfer, maybe just pick first available agent for now
              const agents = users.filter(u => u.role === UserRole.AGENT);
              if (agents.length > 0) bulkUpdateCustomers(selectedIds, { assignedAgentId: agents[0].id });
              break;
      }
      setSelectedIds([]); // clear selection
  };

  const toggleSelection = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === paginatedCustomers.length) {
          setSelectedIds([]);
      } else {
          setSelectedIds(paginatedCustomers.map(c => c.id));
      }
  };

  const saveNote = () => {
      if (selectedCustomer) {
          updateCustomer(selectedCustomer.id, { notes: noteText });
          setNoteModalOpen(false);
      }
  };

  const getAgentName = (id?: string) => {
      if (!id) return '-';
      return users.find(u => u.id === id)?.name || t('unknown');
  };

  // --- Render Helpers ---

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderCell = (customer: Customer, key: string) => {
      switch(key) {
          case 'name': 
              return <div className="font-semibold text-slate-900">{customer.name}</div>;
          case 'id':
              return <div className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded w-fit">{customer.id.substring(0, 8)}</div>;
          case 'phone':
              return <div className="font-mono text-slate-600">{customer.phone}</div>;
          case 'operator':
              return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">{customer.operator || '-'}</span>;
          case 'contractEndDate':
              return <span className="text-slate-600 text-sm">{formatDate(customer.contractEndDate)}</span>;
          case 'createdAt':
              return <span className="text-slate-500 text-sm">{formatDate(customer.createdAt)}</span>;
          case 'assignedAgentId':
              return (
                  <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                          {getAgentName(customer.assignedAgentId).charAt(0)}
                      </div>
                      <span className="text-sm text-slate-700 truncate max-w-[120px]">{getAgentName(customer.assignedAgentId)}</span>
                  </div>
              );
          case 'notes':
              return <div className="text-xs text-slate-500 truncate max-w-[150px]" title={customer.notes}>{customer.notes || '-'}</div>;
          case 'lastCallStatus':
              return (
                  <span className={clsx("inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border", 
                      customer.lastCallStatus === 'Answered' ? 'bg-green-100 text-green-700 border-green-200' : 
                      customer.lastCallStatus === 'No Answer' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                  )}>
                      {customer.lastCallStatus ? t(customer.lastCallStatus === 'Answered' ? 'answered' : 'noAnswer' as any) : '-'}
                  </span>
              );
          case 'lastCallDate':
              return <span className="text-xs text-slate-500">{customer.lastCallDate ? new Date(customer.lastCallDate).toLocaleString() : '-'}</span>;
          case 'contactCount':
               return <div className="font-bold text-center text-slate-700 bg-slate-50 rounded px-2 py-0.5 w-fit mx-auto border border-slate-200">{customer.contactCount}</div>;
          case 'actions':
              return (
                  <div className="flex gap-2 justify-end">
                      {/* Direct Actions: Call & Note */}
                      <button onClick={() => handleAction(customer, 'call')} className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded-lg shadow-sm transition-colors" title={t('call')}>
                          <Phone className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleAction(customer, 'notes')} className="p-1.5 text-slate-700 bg-blue-100 hover:bg-blue-200 rounded-lg shadow-sm transition-colors" title={t('editNotes')}>
                          <FileText className="w-4 h-4" />
                      </button>

                      {/* Dropdown for Secondary Actions */}
                      <div className="relative group">
                          <button className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          <div className={clsx("absolute top-8 w-48 bg-white shadow-xl rounded-lg border border-slate-100 hidden group-hover:block z-20 py-1", isRTL ? "left-0" : "right-0")}>
                                <button onClick={() => handleAction(customer, 'profile')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                  <User className="w-4 h-4 text-slate-400" /> {t('viewProfile')}
                                </button>
                                <div className="border-t border-slate-100 my-1"></div>
                                <button onClick={() => handleAction(customer, 'hide')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <EyeOff className="w-4 h-4 text-slate-400" /> {t('hideCustomer')}
                                </button>
                                <button onClick={() => handleAction(customer, 'transfer_admin')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-slate-400" /> {t('transferToAdmin')}
                                </button>
                                <button onClick={() => handleAction(customer, 'transfer_agent')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                                    <UserCheck className="w-4 h-4 text-slate-400" /> {t('transferToAgent')}
                                </button>
                          </div>
                      </div>
                  </div>
              );
          default: 
             return <span className="text-sm text-slate-500">{customer[key as keyof Customer] as string}</span>;
      }
  };

  const operators = Array.from(new Set(customers.map(c => c.operator).filter(Boolean)));
  const visibleColumns = columnConfig.filter(c => c.visible).sort((a, b) => a.order - b.order);

  // Bulk Action Bar Component
  const BulkActionBar = () => (
      <div className="bg-indigo-600 text-white px-6 py-3 rounded-lg flex items-center justify-between shadow-lg animate-fade-in-up mb-4">
          <div className="flex items-center gap-2">
              <span className="font-bold bg-white text-indigo-600 w-6 h-6 rounded-full flex items-center justify-center text-xs">
                  {selectedIds.length}
              </span>
              <span className="text-sm font-medium">{t('selected')}</span>
          </div>
          <div className="flex gap-2">
              <button onClick={() => handleBulkAction('transfer_agent')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded text-xs font-bold transition">
                  <UserCheck className="w-3 h-3" /> {t('transferSelected')}
              </button>
              <button onClick={() => handleBulkAction('hide')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 rounded text-xs font-bold transition">
                  <EyeOff className="w-3 h-3" /> {t('hideSelected')}
              </button>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
       {/* Top Bar: Title & Filters */}
       <div className="flex flex-col gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{t('customers')}</h2>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition font-medium text-sm">
                    <Plus className="w-4 h-4" /> {t('addCustomer')}
                </button>
           </div>
           
           <div className="flex flex-wrap items-center gap-3">
               {/* Search */}
               <div className="relative flex-1 min-w-[200px]">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <input 
                      type="text" 
                      placeholder={t('searchPlaceholder')} 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className={clsx("w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500", isRTL && "pr-9 pl-4")}
                   />
               </div>

               {/* Filters */}
               <div className="flex gap-2">
                   <select 
                       value={filterOperator} 
                       onChange={e => setFilterOperator(e.target.value)}
                       className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                   >
                       <option value="All">{t('allOperators')}</option>
                       {operators.map(op => <option key={op} value={op}>{op}</option>)}
                   </select>

                   <select 
                       value={filterStatus} 
                       onChange={e => setFilterStatus(e.target.value)}
                       className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                   >
                       <option value="All">{t('allStatuses')}</option>
                       <option value="Answered">{t('answered')}</option>
                       <option value="No Answer">{t('noAnswer')}</option>
                   </select>

                   {currentUserRole === UserRole.ADMIN && (
                       <select 
                           value={filterAgent} 
                           onChange={e => setFilterAgent(e.target.value)}
                           className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                       >
                           <option value="All">{t('allAgents')}</option>
                           {users.filter(u => u.role === UserRole.AGENT).map(u => (
                               <option key={u.id} value={u.id}>{u.name}</option>
                           ))}
                       </select>
                   )}
               </div>
           </div>
       </div>

      {selectedIds.length > 0 && <BulkActionBar />}

      {/* Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-slate-200 relative">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                {currentUserRole === UserRole.ADMIN && (
                    <th className="px-6 py-4 w-10">
                        <button onClick={toggleSelectAll} className="flex items-center text-slate-400 hover:text-indigo-600">
                             {selectedIds.length === paginatedCustomers.length && paginatedCustomers.length > 0 ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                        </button>
                    </th>
                )}
                {visibleColumns.map(col => (
                    <th key={col.key} className={clsx("px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap", col.key === 'actions' && 'text-right')}>
                        {t(col.label as any) || col.label}
                    </th>
                ))}
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
                {paginatedCustomers.map((customer) => (
                <tr key={customer.id} className={clsx("hover:bg-indigo-50/30 transition group", customer.isHidden && "opacity-50 bg-slate-100", selectedIds.includes(customer.id) && "bg-indigo-50")}>
                    {currentUserRole === UserRole.ADMIN && (
                        <td className="px-6 py-3">
                            <button onClick={() => toggleSelection(customer.id)} className="flex items-center text-slate-400 hover:text-indigo-600">
                                {selectedIds.includes(customer.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                            </button>
                        </td>
                    )}
                    {visibleColumns.map(col => (
                        <td key={col.key} className={clsx("px-6 py-3 whitespace-nowrap", col.key === 'actions' && 'text-right')}>
                            {renderCell(customer, col.key)}
                        </td>
                    ))}
                </tr>
                ))}
                {paginatedCustomers.length === 0 && (
                    <tr>
                        <td colSpan={visibleColumns.length + (currentUserRole === UserRole.ADMIN ? 1 : 0)} className="px-6 py-12 text-center text-slate-500">
                            <div className="flex flex-col items-center gap-2">
                                <Filter className="w-8 h-8 text-slate-300" />
                                <p>No customers found matching your criteria.</p>
                            </div>
                        </td>
                    </tr>
                )}
            </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-slate-500">
                {t('showing')} <span className="font-medium">{Math.min(filteredCustomers.length, (currentPage - 1) * itemsPerPage + 1)}</span> {t('to')} <span className="font-medium">{Math.min(filteredCustomers.length, currentPage * itemsPerPage)}</span> {t('of')} <span className="font-medium">{filteredCustomers.length}</span> {t('results')}
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
      </div>

      {/* Edit Note Modal */}
      {noteModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                          <FileEdit className="w-5 h-5 text-indigo-600" /> {t('editNotes')}
                      </h3>
                      <button onClick={() => setNoteModalOpen(false)}><EyeOff className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  <div className="mb-4">
                      <p className="text-sm text-slate-500 mb-2">{t('customer')}: <span className="font-semibold text-slate-700">{selectedCustomer.name}</span></p>
                      <textarea 
                          className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Add notes..."
                      ></textarea>
                  </div>
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setNoteModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm">{t('cancel')}</button>
                      <button onClick={saveNote} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">{t('save')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* Profile Placeholder Modal */}
      {profileModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-0 overflow-hidden">
                  <div className="bg-slate-900 p-6 text-white flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold">{selectedCustomer.name}</h3>
                          <p className="text-slate-300 text-sm mt-1">{selectedCustomer.operator} • {selectedCustomer.id}</p>
                      </div>
                      <button onClick={() => setProfileModalOpen(false)} className="bg-white/10 p-1 rounded hover:bg-white/20"><EyeOff className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <label className="text-xs text-slate-500 uppercase tracking-wide font-bold">{t('contact')}</label>
                              <p className="text-slate-900 font-medium">{selectedCustomer.phone}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <label className="text-xs text-slate-500 uppercase tracking-wide font-bold">{t('email')}</label>
                              <p className="text-slate-900 font-medium">{selectedCustomer.email || '-'}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <label className="text-xs text-slate-500 uppercase tracking-wide font-bold">{t('contractEndDate')}</label>
                              <p className="text-slate-900 font-medium">{formatDate(selectedCustomer.contractEndDate)}</p>
                          </div>
                          <div className="p-3 bg-slate-50 rounded-lg">
                              <label className="text-xs text-slate-500 uppercase tracking-wide font-bold">{t('count')}</label>
                              <p className="text-slate-900 font-medium">{selectedCustomer.contactCount}</p>
                          </div>
                      </div>
                      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                          <label className="text-xs text-indigo-700 uppercase tracking-wide font-bold flex items-center gap-1"><FileText className="w-3 h-3" /> {t('notes')}</label>
                          <p className="text-slate-700 text-sm mt-1">{selectedCustomer.notes || t('noNotes')}</p>
                      </div>
                      <div className="flex justify-end pt-2">
                           <button onClick={() => { setProfileModalOpen(false); handleAction(selectedCustomer, 'call'); }} className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                               <Phone className="w-4 h-4" /> {t('call')}
                           </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Customers;