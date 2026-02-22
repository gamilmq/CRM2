import React, { useState } from 'react';
import { SipConfig, UserRole } from '../types';
import { Save, UserPlus, Upload, Shuffle, Layout, CheckSquare, Square, Users } from 'lucide-react';
import { sipService } from '../services/sipService';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

const AdminSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'customers' | 'sip'>('general');
  const { t } = useLanguage();
  const { users, distributeCustomers, importCustomers, columnConfig, updateColumnConfig } = useData();
  const [csvData, setCsvData] = useState('');
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [distributionMethod, setDistributionMethod] = useState<'random' | 'balanced'>('balanced');

  // SIP Config State (local)
  const [sipConfig, setSipConfig] = useState<SipConfig>({
    server: 'sip.cloudconnect.com',
    port: '5060',
    protocol: 'WSS',
    domain: 'cloudconnect.com'
  });

  const handleSipSave = (e: React.FormEvent) => {
      e.preventDefault();
      sipService.register(sipConfig);
      alert(t('saveSuccess'));
  };

  const handleImport = () => {
      importCustomers(csvData);
      setCsvData('');
      alert(t('importSuccess'));
  };

  const handleDistribute = () => {
      if (selectedAgents.length === 0) {
          alert(t('selectAgentAlert'));
          return;
      }
      distributeCustomers(selectedAgents, distributionMethod);
      alert(t('distributeSuccess'));
  };

  const toggleAgentSelection = (id: string) => {
      setSelectedAgents(prev => 
        prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
      );
  };

  const toggleColumn = (key: string) => {
      const newConfig = columnConfig.map(col => 
          col.key === key ? { ...col, visible: !col.visible } : col
      );
      updateColumnConfig(newConfig);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900">{t('adminSettings')}</h2>

      <div className="flex gap-4 border-b border-slate-200">
        <button 
            className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'general' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('general')}
        >
            {t('generalData')}
        </button>
        <button 
            className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'customers' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('customers')}
        >
            {t('customerViewSettings')}
        </button>
        <button 
            className={`pb-3 px-1 font-medium text-sm transition-colors ${activeTab === 'sip' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('sip')}
        >
            {t('sipConfig')}
        </button>
      </div>

      {activeTab === 'general' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              {/* Import Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-indigo-600" /> {t('importCustomers')}
                  </h3>
                  <textarea 
                      className="w-full h-32 p-3 border border-slate-300 rounded-lg text-sm mb-4"
                      placeholder={t('pasteCsvPlaceholder')}
                      value={csvData}
                      onChange={e => setCsvData(e.target.value)}
                  />
                  <button onClick={handleImport} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition">
                      {t('importCustomers')}
                  </button>
              </div>

              {/* Distribution Section */}
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <Shuffle className="w-5 h-5 text-indigo-600" /> {t('distributeCustomers')}
                  </h3>
                  
                  <div className="flex gap-2 mb-4">
                      <button 
                        onClick={() => setDistributionMethod('random')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border ${distributionMethod === 'random' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                          {t('randomlyDistribute')}
                      </button>
                      <button 
                        onClick={() => setDistributionMethod('balanced')}
                        className={`flex-1 py-2 text-sm font-medium rounded-lg border ${distributionMethod === 'balanced' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}
                      >
                          {t('balancedDistribute')}
                      </button>
                  </div>

                  <div className="mb-4 max-h-32 overflow-y-auto space-y-2">
                      <p className="text-sm text-slate-500 mb-2">{t('selectAgents')}:</p>
                      {users.filter(u => u.role === UserRole.AGENT).map(agent => (
                          <div key={agent.id} className="flex items-center gap-2 cursor-pointer" onClick={() => toggleAgentSelection(agent.id)}>
                              {selectedAgents.includes(agent.id) ? 
                                  <CheckSquare className="w-4 h-4 text-indigo-600" /> : 
                                  <Square className="w-4 h-4 text-slate-400" />
                              }
                              <span className="text-sm text-slate-700">{agent.name}</span>
                          </div>
                      ))}
                  </div>
                  <button onClick={handleDistribute} className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition">
                      {t('distribute')}
                  </button>
              </div>
          </div>
      )}

      {activeTab === 'customers' && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Layout className="w-5 h-5 text-indigo-600" /> {t('customerViewSettings')}
              </h3>
              <div className="space-y-3">
                  {columnConfig.map(col => (
                      <div key={col.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                          <span className="text-sm font-medium text-slate-700">{t(col.label as any) || col.label}</span>
                          <button onClick={() => toggleColumn(col.key as string)} className="text-indigo-600 font-medium text-sm">
                              {col.visible ? t('hide') : t('show')}
                          </button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'sip' && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm animate-fade-in">
              <form onSubmit={handleSipSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Reuse existing SIP form fields here for brevity, assuming standard inputs */}
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('sipServerHost')}</label>
                      <input type="text" value={sipConfig.server} onChange={e => setSipConfig({...sipConfig, server: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('port')}</label>
                      <input type="text" value={sipConfig.port} onChange={e => setSipConfig({...sipConfig, port: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-300" />
                  </div>
                  <button type="submit" className="md:col-span-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                      <Save className="w-4 h-4 inline mr-2" /> {t('saveConfig')}
                  </button>
              </form>
          </div>
      )}
    </div>
  );
};

export default AdminSettings;