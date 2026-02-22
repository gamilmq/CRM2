export enum UserRole {
  ADMIN = 'ADMIN',
  AGENT = 'AGENT',
}

export type AgentStatus = 'Active' | 'Disabled';
export type AgentAvailability = 'Always' | 'Working Hours';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  status: AgentStatus;
  availability: AgentAvailability;
  sipExtension?: string;
  sipPassword?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  notes: string;
  assignedAgentId?: string;
  lastCallStatus?: 'Answered' | 'No Answer' | 'Missed';
  lastCallDate?: string;
  contactCount: number;
  isHidden?: boolean;
  operator?: string;
  contractEndDate?: string;
  createdAt: string;
  customFields?: Record<string, string>;
}

export interface CustomerColumnConfig {
  key: keyof Customer | 'actions';
  label: string;
  visible: boolean;
  order: number;
}

export interface CallLog {
  id: string;
  customerId: string;
  agentId: string;
  direction: 'Inbound' | 'Outbound';
  duration: number; // seconds
  timestamp: string;
  status: 'Missed' | 'Completed' | 'Voicemail';
  notes?: string;
  aiAnalysis?: string;
}

export interface SipConfig {
  server: string;
  port: string;
  protocol: 'WSS' | 'UDP' | 'TCP' | 'TLS';
  domain: string;
}

export enum CallState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  RINGING = 'RINGING',
  CONNECTED = 'CONNECTED',
  ENDING = 'ENDING',
}

export interface ActiveCall {
    id: string;
    agentName: string;
    customerName: string;
    customerNumber: string;
    state: CallState;
    duration: number;
    startTime: number;
}
