import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { Customer, User, CustomerColumnConfig } from '../types';
import { api } from '../services/api';

interface DashboardStats {
  totalCalls: number;
  totalCustomers: number;
  inactiveCustomers: number;
  topAgent: string;
}

interface DataContextType {
  customers: Customer[];
  users: User[];
  dashboardStats: DashboardStats | null;
  loading: boolean;
  columnConfig: CustomerColumnConfig[];
  currentUser: User | null;
  
  setCurrentUser: (user: User | null) => void;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customer: Customer) => Promise<void>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  bulkUpdateCustomers: (ids: string[], updates: Partial<Customer>) => Promise<void>;
  importCustomers: (csvData: string) => Promise<void>;
  distributeCustomers: (agentIds: string[], method: 'random' | 'balanced') => Promise<void>;
  
  fetchUsers: () => Promise<void>;
  addUser: (user: User) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  
  logCallOutcome: (phoneNumber: string, status: 'Answered' | 'No Answer' | 'Missed', duration?: number, direction?: 'Inbound' | 'Outbound', notes?: string) => Promise<void>;
  
  updateColumnConfig: (newConfig: CustomerColumnConfig[]) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_COLUMNS: CustomerColumnConfig[] = [
  { key: 'name', label: 'name', visible: true, order: 1 },
  { key: 'id', label: 'id', visible: true, order: 2 },
  { key: 'phone', label: 'contact', visible: true, order: 3 },
  { key: 'contractEndDate', label: 'contractEndDate', visible: true, order: 4 },
  { key: 'operator', label: 'operator', visible: true, order: 5 },
  { key: 'createdAt', label: 'createdAt', visible: true, order: 6 },
  { key: 'assignedAgentId', label: 'assignedTo', visible: true, order: 7 },
  { key: 'notes', label: 'notes', visible: true, order: 8 },
  { key: 'lastCallDate', label: 'lastCallDate', visible: true, order: 9 },
  { key: 'lastCallStatus', label: 'lastCall', visible: true, order: 10 },
  { key: 'contactCount', label: 'count', visible: true, order: 11 },
  { key: 'actions', label: 'actions', visible: true, order: 12 },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [columnConfig, setColumnConfig] = useState<CustomerColumnConfig[]>(DEFAULT_COLUMNS);
  const [loading, setLoading] = useState(false);

  // --- Fetchers ---

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers?limit=100');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setDashboardStats(res);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (api.getToken()) {
      fetchCustomers();
      fetchUsers();
      fetchStats();
    }
  }, [fetchCustomers, fetchUsers, fetchStats]);

  // --- Actions ---

  const addCustomer = async (customer: Customer) => {
    await api.post('/customers', customer);
    await fetchCustomers();
    await fetchStats();
  };

  const updateCustomer = async (id: string, updates: Partial<Customer>) => {
    await api.put(`/customers/${id}`, updates);
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const bulkUpdateCustomers = async (ids: string[], updates: Partial<Customer>) => {
    // Determine action type based on updates
    let action = '';
    if (updates.isHidden) action = 'hide';
    else if (updates.assignedAgentId) action = 'transfer';
    
    if (action) {
       await api.post('/customers/bulk', {
           ids,
           action,
           targetAgentId: updates.assignedAgentId
       });
       await fetchCustomers();
    }
  };

  const importCustomers = async (csvData: string) => {
    const lines = csvData.trim().split('\n');
    const customersToImport = lines.map(line => {
       const [name, phone, operator, notes] = line.split(',').map(s => s.trim());
       if (name && phone) return { name, phone, operator, notes, email: '' };
       return null;
    }).filter(Boolean);

    if (customersToImport.length > 0) {
        await api.post('/customers/import', { customers: customersToImport });
        await fetchCustomers();
        await fetchStats();
    }
  };

  const distributeCustomers = async (agentIds: string[], method: 'random' | 'balanced') => {
      // For this demo, we assume we are distributing *unassigned* or *all* visible customers
      // Getting IDs of currently visible customers
      const ids = customers.map(c => c.id); 
      await api.post('/customers/bulk', {
          ids,
          action: 'distribute',
          targetAgentId: agentIds, // API expects array for distribute
          distributionMethod: method
      });
      await fetchCustomers();
  };

  const logCallOutcome = async (phoneNumber: string, status: 'Answered' | 'No Answer' | 'Missed', duration = 0, direction = 'Outbound', notes = '') => {
      const customer = customers.find(c => c.phone === phoneNumber);
      if (customer) {
          await api.post('/calls', {
              customerId: customer.id,
              duration,
              status: status === 'Answered' ? 'ANSWERED' : status === 'No Answer' ? 'NO_ANSWER' : 'MISSED',
              direction: direction.toUpperCase(),
              notes
          });
          // Update local state optimistically or re-fetch
          fetchCustomers(); 
          fetchStats();
      }
  };

  const addUser = async (user: User) => {
    await api.post('/users', { ...user, password: 'password123' }); // Default password for new agents
    await fetchUsers();
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    await api.put(`/users/${id}`, updates);
    await fetchUsers();
  };

  const deleteUser = async (id: string) => {
      // Backend doesn't support DELETE yet, implemented as soft delete usually
      // For now we just re-fetch
      await fetchUsers(); 
  };

  const updateColumnConfig = (newConfig: CustomerColumnConfig[]) => {
      setColumnConfig(newConfig);
  };

  return (
    <DataContext.Provider value={{ 
        customers, users, dashboardStats, loading, columnConfig, currentUser,
        setCurrentUser,
        fetchCustomers, addCustomer, updateCustomer, bulkUpdateCustomers, importCustomers, distributeCustomers, 
        fetchUsers, addUser, updateUser, deleteUser,
        logCallOutcome, updateColumnConfig
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};