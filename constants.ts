import { Customer, User, UserRole, CallLog } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Sarah Connor',
    email: 'admin@cloudconnect.com',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/150/150?random=1',
    status: 'Active',
    availability: 'Always',
    sipExtension: '1001',
    sipPassword: 'password123'
  },
  {
    id: 'u2',
    name: 'John Doe',
    email: 'agent@cloudconnect.com',
    role: UserRole.AGENT,
    avatar: 'https://picsum.photos/150/150?random=2',
    status: 'Active',
    availability: 'Working Hours',
    department: 'Sales',
    sipExtension: '1002',
    sipPassword: 'password123'
  },
  {
    id: 'u3',
    name: 'Emily Blunt',
    email: 'emily@cloudconnect.com',
    role: UserRole.AGENT,
    avatar: 'https://picsum.photos/150/150?random=3',
    status: 'Active',
    availability: 'Always',
    department: 'Support',
    sipExtension: '1003',
    sipPassword: 'password123'
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { 
    id: 'c1', 
    name: 'Acme Corp', 
    phone: '+15550101', 
    email: 'contact@acme.com', 
    source: 'Website', 
    notes: 'Key account, interested in upgrading.', 
    assignedAgentId: 'u2', 
    contactCount: 12, 
    lastCallStatus: 'Answered', 
    lastCallDate: '2023-10-24T10:00:00',
    operator: 'Vodafone',
    contractEndDate: '2024-05-15',
    createdAt: '2023-01-10T09:00:00'
  },
  { 
    id: 'c2', 
    name: 'Globex Inc', 
    phone: '+15550102', 
    email: 'info@globex.com', 
    source: 'Referral', 
    notes: 'Need to follow up regarding Q3.', 
    assignedAgentId: 'u2', 
    contactCount: 5, 
    lastCallStatus: 'No Answer', 
    lastCallDate: '2023-10-22T14:30:00',
    operator: 'Orange',
    contractEndDate: '2023-12-31',
    createdAt: '2023-03-15T11:20:00'
  },
  { 
    id: 'c3', 
    name: 'Soylent Corp', 
    phone: '+15550103', 
    email: 'sales@soylent.com', 
    source: 'LinkedIn', 
    notes: 'New lead.', 
    assignedAgentId: 'u3', 
    contactCount: 0,
    operator: 'Etisalat',
    contractEndDate: '2024-08-20',
    createdAt: '2023-09-01T14:00:00'
  },
  { 
    id: 'c4', 
    name: 'Umbrella Corp', 
    phone: '+15550199', 
    email: 'contact@umbrella.com', 
    source: 'Cold Call', 
    notes: 'Difficult customer.', 
    contactCount: 2, 
    lastCallStatus: 'Answered', 
    lastCallDate: '2023-10-20T09:15:00',
    operator: 'We',
    contractEndDate: '2024-01-10',
    createdAt: '2023-08-05T10:30:00'
  },
  { 
    id: 'c5', 
    name: 'Stark Ind', 
    phone: '+15550200', 
    email: 'tony@stark.com', 
    source: 'Website', 
    notes: 'VIP customer.', 
    assignedAgentId: 'u2', 
    contactCount: 25, 
    lastCallStatus: 'Answered', 
    lastCallDate: '2023-10-25T16:00:00',
    operator: 'Vodafone',
    contractEndDate: '2025-01-01',
    createdAt: '2022-11-20T08:00:00'
  },
];

export const MOCK_CALL_LOGS: CallLog[] = [
  { id: 'cl1', customerId: 'c1', agentId: 'u2', direction: 'Outbound', duration: 120, timestamp: '2023-10-06T10:00:00', status: 'Completed', notes: 'Discussed pricing.' },
  { id: 'cl2', customerId: 'c2', agentId: 'u2', direction: 'Inbound', duration: 45, timestamp: '2023-10-06T11:30:00', status: 'Completed', notes: 'Support query resolved.' },
  { id: 'cl3', customerId: 'c3', agentId: 'u3', direction: 'Outbound', duration: 0, timestamp: '2023-10-05T14:15:00', status: 'Missed' },
];
