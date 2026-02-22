import { MOCK_USERS, MOCK_CUSTOMERS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token: string) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),

  async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      // Try actual backend first
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        this.clearToken();
        window.location.reload();
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Request failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      console.warn(`Backend unreachable or failed (${endpoint}). Falling back to Demo Mode.`);
      return this.mockRequest(endpoint, options);
    }
  },

  // Mock Fallback for Demo purposes when backend is offline
  async mockRequest(endpoint: string, options: RequestInit) {
      await delay(600); // Simulate network latency

      // 1. Login
      if (endpoint === '/auth/login' && options.method === 'POST') {
          const body = JSON.parse(options.body as string);
          const user = MOCK_USERS.find(u => u.email === body.email);
          
          if (user && body.password === 'password') {
             return { token: 'mock-demo-token', user };
          }
          throw new Error('Invalid credentials (Demo: use password "password")');
      }

      // 2. Get Current User
      if (endpoint === '/auth/me') {
          // Default to Admin for demo reload if token exists
          return MOCK_USERS[0];
      }

      // 3. Customers
      if (endpoint.includes('/customers')) {
          return { data: MOCK_CUSTOMERS, meta: { total: MOCK_CUSTOMERS.length, page: 1 } };
      }

      // 4. Users/Agents
      if (endpoint === '/users') {
          return MOCK_USERS;
      }

      // 5. Dashboard Stats
      if (endpoint === '/dashboard/stats') {
          return {
              totalCalls: 142,
              totalCustomers: MOCK_CUSTOMERS.length,
              inactiveCustomers: 2,
              topAgent: 'Sarah Connor'
          };
      }

      // 6. SIP Config
      if (endpoint === '/auth/sip-config') {
          return {
              server: 'wss://sip.example.com',
              domain: 'example.com',
              extension: '1001',
              password: 'demo-password'
          };
      }

      // Default empty response for others to prevent crashes
      return {};
  },

  get(endpoint: string) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  put(endpoint: string, body: any) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  delete(endpoint: string) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};