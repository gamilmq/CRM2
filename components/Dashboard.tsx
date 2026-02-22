import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PhoneIncoming, Users, TrendingUp, AlertTriangle, Award, Loader2, Briefcase, Activity, Settings, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';
import { Link } from 'react-router-dom';
import { UserRole } from '../types';

const data = [
  { name: 'Mon', inbound: 40, outbound: 24 },
  { name: 'Tue', inbound: 30, outbound: 18 },
  { name: 'Wed', inbound: 20, outbound: 58 },
  { name: 'Thu', inbound: 27, outbound: 39 },
  { name: 'Fri', inbound: 18, outbound: 48 },
  { name: 'Sat', inbound: 23, outbound: 38 },
  { name: 'Sun', inbound: 34, outbound: 43 },
];

const StatCard: React.FC<{ title: string; value: string; trend?: string; icon: React.ElementType; color: string; linkTo?: string }> = ({ title, value, trend, icon: Icon, color, linkTo }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
    {linkTo && <Link to={linkTo} className="absolute inset-0 z-10" />}
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
      </div>
      {trend && (
        <span className="text-sm font-medium text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
            <TrendingUp className="w-3 h-3" /> {trend}
        </span>
      )}
    </div>
    <h3 className="text-slate-500 text-sm font-medium truncate" title={title}>{title}</h3>
    <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
  </div>
);

const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const { dashboardStats, loading, currentUser } = useData();

  if (loading && !dashboardStats) {
      return (
          <div className="flex items-center justify-center h-96">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">{t('dashboard')}</h1>
          <div className="text-sm text-slate-500">{t('lastUpdated')}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title={t('totalCalls')} 
            value={dashboardStats?.totalCalls.toString() || '0'} 
            trend="+12%" 
            icon={PhoneIncoming} 
            color="bg-indigo-600" 
        />
        
        <StatCard 
            title={t('inactiveCustomers')} 
            value={dashboardStats?.inactiveCustomers.toString() || '0'} 
            icon={AlertTriangle} 
            color="bg-orange-500" 
            linkTo="/customers"
        />
        
        <StatCard 
            title={t('topAgent')} 
            value={dashboardStats?.topAgent || '-'} 
            icon={Award} 
            color="bg-yellow-500" 
        />
        
        <StatCard 
            title={t('totalCustomers')} 
            value={dashboardStats?.totalCustomers.toString() || '0'} 
            trend="+5%" 
            icon={Users} 
            color="bg-blue-600" 
            linkTo="/customers" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-80">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">{t('callVolume')}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
              <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
              <Bar dataKey="inbound" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="outbound" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Admin Quick Actions */}
        {currentUser?.role === UserRole.ADMIN && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <h3 className="text-lg font-semibold text-slate-900 mb-6 flex items-center gap-2">
                 <Shield className="w-5 h-5 text-indigo-600" /> {t('quickActions')}
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <Link to="/agents" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition border border-slate-100 group">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                        <Briefcase className="w-5 h-5 text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t('agents')}</span>
                 </Link>
                 <Link to="/active-calls" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition border border-slate-100 group">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                        <Activity className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t('activeCalls')}</span>
                 </Link>
                 <Link to="/settings" className="flex flex-col items-center justify-center p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition border border-slate-100 group">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition">
                        <Settings className="w-5 h-5 text-slate-700" />
                    </div>
                    <span className="text-sm font-medium text-slate-700">{t('settings')}</span>
                 </Link>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;