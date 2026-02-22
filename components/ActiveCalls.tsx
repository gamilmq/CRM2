import React, { useEffect, useState } from 'react';
import { ActiveCall, CallState } from '../types';
import { sipService } from '../services/sipService';
import { useLanguage } from '../contexts/LanguageContext';
import { PhoneCall, Clock, User, Phone } from 'lucide-react';
import clsx from 'clsx';

const ActiveCalls: React.FC = () => {
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    const unsubscribe = sipService.subscribeActiveCalls((updatedCalls) => {
        setCalls(updatedCalls);
    });
    return unsubscribe;
  }, []);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-slate-900">{t('monitoring')} - {t('activeCalls')}</h2>
       
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {calls.map(call => (
               <div key={call.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden animate-fade-in">
                   <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                   <div className="flex justify-between items-start mb-4">
                       <div className="flex items-center gap-2">
                           <div className="bg-green-100 p-2 rounded-full">
                               <PhoneCall className="w-5 h-5 text-green-600 animate-pulse" />
                           </div>
                           <div>
                               <p className="text-sm font-bold text-slate-900">{call.agentName}</p>
                               <p className="text-xs text-slate-500">{t('agent')}</p>
                           </div>
                       </div>
                       <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold uppercase tracking-wide">
                           {call.state}
                       </span>
                   </div>

                   <div className="space-y-3">
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                           <div className="flex items-center gap-2">
                               <User className="w-4 h-4 text-slate-400" />
                               <span className="text-sm font-medium text-slate-700">{call.customerName}</span>
                           </div>
                       </div>
                       <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                           <div className="flex items-center gap-2">
                               <Phone className="w-4 h-4 text-slate-400" />
                               <span className="text-sm text-slate-600">{call.customerNumber}</span>
                           </div>
                       </div>
                       <div className="flex items-center justify-center pt-2">
                            <Clock className="w-4 h-4 text-slate-400 mr-2" />
                            <span className="text-xl font-mono font-bold text-slate-800">{formatDuration(call.duration)}</span>
                       </div>
                   </div>
               </div>
           ))}

           {calls.length === 0 && (
               <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 border-dashed">
                   {t('noActiveCalls')}
               </div>
           )}
       </div>
    </div>
  );
};

export default ActiveCalls;