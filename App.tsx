import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Customers from './components/Customers';
import AdminSettings from './components/AdminSettings';
import Softphone from './components/Softphone';
import ActiveCalls from './components/ActiveCalls';
import Agents from './components/Agents';
import { User, UserRole } from './types';
import { Lock, Phone, Globe, Loader2 } from 'lucide-react';
import { sipService } from './services/sipService';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { DataProvider, useData } from './contexts/DataContext';
import { api } from './services/api';

// Login Component
const Login: React.FC<{ onLogin: (email: string, password: string) => Promise<void>, loading: boolean }> = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { t, toggleLanguage, language } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-slate-900 flex items-center justify-center p-4">
       <button onClick={toggleLanguage} className="absolute top-6 right-6 text-white/70 hover:text-white flex items-center gap-2 z-50">
          <Globe className="w-5 h-5" /> {language === 'en' ? 'Arabic' : 'English'}
       </button>
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl animate-fade-in-up">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3">
            <Phone className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">{t('loginTitle')}</h2>
        <p className="text-center text-slate-500 mb-8">{t('loginSubtitle')}</p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('emailLabel')}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50"
              placeholder="name@company.com"
              dir="ltr"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('passwordLabel')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition bg-slate-50"
              placeholder="••••••••"
              dir="ltr"
              required
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {t('loginButton')}
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
            <p>{t('demoLogin')}</p>
            <p>Admin: admin@cloudconnect.com / password</p>
        </div>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { fetchCustomers, fetchUsers, currentUser, setCurrentUser } = useData();

  // Initialize Auth
  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (token) {
        try {
          const user = await api.get('/auth/me');
          setCurrentUser(user);
          await loadAppResources();
        } catch (error) {
          api.clearToken();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const loadAppResources = async () => {
      try {
          // 1. Fetch SIP Config
          const sipConfig = await api.get('/auth/sip-config');
          if (sipConfig) {
              sipService.register({
                  server: sipConfig.server,
                  port: '443',
                  protocol: 'WSS',
                  domain: sipConfig.domain
              }, sipConfig.extension, sipConfig.password);
          }
      } catch (e) {
          console.error("Failed to load SIP config", e);
      }
  };

  const handleLogin = async (email: string, pass: string) => {
    try {
        setLoading(true);
        const res = await api.post('/auth/login', { email, password: pass });
        api.setToken(res.token);
        setCurrentUser(res.user);
        
        // Refresh context data
        await fetchUsers();
        await fetchCustomers();
        await loadAppResources();
        
    } catch (err: any) {
        alert(err.message || "Login failed");
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    api.clearToken();
    sipService.hangup();
  };

  if (loading) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-slate-50">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
      );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} loading={loading} />;
  }

  return (
    <HashRouter>
      <Layout user={currentUser} onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/customers" element={<Customers currentUserRole={currentUser.role} currentUserId={currentUser.id} />} />
          <Route 
            path="/active-calls" 
            element={currentUser.role === UserRole.ADMIN ? <ActiveCalls /> : <Navigate to="/" />} 
          />
          <Route 
            path="/agents" 
            element={currentUser.role === UserRole.ADMIN ? <Agents /> : <Navigate to="/" />} 
          />
          <Route 
            path="/settings" 
            element={currentUser.role === UserRole.ADMIN ? <AdminSettings /> : <Navigate to="/" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
      <Softphone />
    </HashRouter>
  );
}

const App: React.FC = () => {
  return (
    <DataProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
    </DataProvider>
  );
};

export default App;