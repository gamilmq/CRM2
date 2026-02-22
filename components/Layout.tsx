import React from 'react';
import { LayoutDashboard, Users, Phone, Settings, LogOut, Menu, Bell, Search, Globe, Activity, Briefcase } from 'lucide-react';
import { User, UserRole } from '../types';
import clsx from 'clsx';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { t, toggleLanguage, isRTL } = useLanguage();

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), path: '/' },
    { icon: Users, label: t('customers'), path: '/customers' },
  ];

  if (user.role === UserRole.ADMIN) {
    navItems.push({ icon: Activity, label: t('activeCalls'), path: '/active-calls' });
    navItems.push({ icon: Briefcase, label: t('agents'), path: '/agents' });
    navItems.push({ icon: Settings, label: t('settings'), path: '/settings' });
  }

  return (
    <div className={clsx("flex h-screen bg-slate-50", isRTL && 'flex-row-reverse')}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={clsx(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out flex flex-col",
        sidebarOpen ? "translate-x-0" : (isRTL ? "translate-x-full lg:translate-x-0" : "-translate-x-full lg:translate-x-0"),
        isRTL && "right-0 left-auto"
      )}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <Phone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">CloudConnect</span>
          </div>
          <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
            <Menu className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-indigo-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-4 px-2">
                <img src={user.avatar} alt="User" className="w-10 h-10 rounded-full border-2 border-slate-700" />
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-400 truncate capitalize">{user.role}</p>
                </div>
            </div>
            <button 
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
                <LogOut className="w-5 h-5" />
                {t('logout')}
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-6 shadow-sm">
          <button className="lg:hidden p-2 -ml-2 text-slate-600" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden md:flex items-center bg-slate-100 rounded-full px-4 py-1.5 w-96">
            <Search className="w-4 h-4 text-slate-400" />
            <input 
                type="text" 
                placeholder={t('searchPlaceholder')} 
                className="bg-transparent border-none outline-none text-sm ml-2 w-full text-slate-700 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-4">
            <button onClick={toggleLanguage} className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
                <Globe className="w-4 h-4" />
                {t('langToggle')}
            </button>
            <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 scroll-smooth">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
