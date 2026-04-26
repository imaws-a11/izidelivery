import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

// Configurações do Sistema

export default function SettingsTab() {
  const {
    appSettings, setAppSettings, autoSaveStatus, fetchAppSettings, handleSaveAppSettings, isSaving,
    globalSettings, saveGlobalSettings
  } = useAdmin();

  // --- Gerenciamento de Bairros ---
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [neighborhoodsLoading, setNeighborhoodsLoading] = useState(false);
  const [newNeighborhoodName, setNewNeighborhoodName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [neighborhoodSaving, setNeighborhoodSaving] = useState(false);

  const fetchNeighborhoods = async () => {
    setNeighborhoodsLoading(true);
    const { data } = await supabase
      .from('city_neighborhoods_delivery')
      .select('*')
      .order('name', { ascending: true });
    setNeighborhoods(data || []);
    setNeighborhoodsLoading(false);
  };

  useEffect(() => { fetchNeighborhoods(); }, []);

  const handleAddNeighborhood = async () => {
    const name = newNeighborhoodName.trim();
    if (!name) return;
    setNeighborhoodSaving(true);
    const { error } = await supabase
      .from('city_neighborhoods_delivery')
      .insert({ name, city: 'Brumadinho', state: 'MG' });
    if (!error) {
      setNewNeighborhoodName('');
      await fetchNeighborhoods();
    }
    setNeighborhoodSaving(false);
  };

  const handleSaveEdit = async (id: string) => {
    const name = editingName.trim();
    if (!name) return;
    setNeighborhoodSaving(true);
    const { error } = await supabase
      .from('city_neighborhoods_delivery')
      .update({ name })
      .eq('id', id);
    if (!error) {
      setEditingId(null);
      await fetchNeighborhoods();
    }
    setNeighborhoodSaving(false);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    await supabase
      .from('city_neighborhoods_delivery')
      .update({ active: !current })
      .eq('id', id);
    await fetchNeighborhoods();
  };

  const handleDeleteNeighborhood = async (id: string, name: string) => {
    if (!confirm(`Excluir o bairro "${name}"?\n\nLojistas que o usavam perderão essa configuração.`)) return;
    await supabase.from('city_neighborhoods_delivery').delete().eq('id', id);
    await fetchNeighborhoods();
  };

  const handleUpdateGlobalFinance = async (key: string, value: number) => {
    if (!globalSettings) return;
    const newSettings = { ...globalSettings, [key]: value };
    await saveGlobalSettings(newSettings);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-primary">settings_applications</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Configurações Globais</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 ml-1">Controles operacionais, financeiros e de notificações da plataforma.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto-save status indicator */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
            autoSaveStatus === 'saved' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/30' :
            autoSaveStatus === 'pending' ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 border border-amber-200 dark:border-amber-500/30' :
            autoSaveStatus === 'error' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-200 dark:border-red-500/30' :
            'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'
          }`}>
            <span className={`material-symbols-outlined text-sm ${autoSaveStatus === 'pending' ? 'animate-spin' : ''}`}>
              {autoSaveStatus === 'saved' ? 'check_circle' : autoSaveStatus === 'pending' ? 'sync' : autoSaveStatus === 'error' ? 'error' : 'cloud_done'}
            </span>
            {autoSaveStatus === 'saved' ? 'Salvo' : autoSaveStatus === 'pending' ? 'Salvando...' : autoSaveStatus === 'error' ? 'Erro ao salvar' : 'Auto-save ativo'}
          </div>
          <button
            onClick={() => handleSaveAppSettings()}
            disabled={isSaving}
            className="px-6 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-base">save</span>
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
          <button
            onClick={() => fetchAppSettings()}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">refresh</span>
            Recarregar
          </button>
        </div>
      </div>

      {/* Identidade da plataforma */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <span className="material-symbols-outlined text-[120px]">store</span>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <span className="material-symbols-outlined">storefront</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Identidade da Plataforma</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações públicas do app</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome da Plataforma</label>
            <input
              className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white transition-all"
              type="text"
              value={appSettings.appName}
              onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail de Suporte</label>
            <input
              className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white transition-all"
              type="email"
              value={appSettings.supportEmail}
              onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Mercado Pago */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <span className="material-symbols-outlined text-[120px]">payments</span>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 border border-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/20">
            <span className="material-symbols-outlined">api</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Integração Mercado Pago</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configurações para processamento de cartões</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave Pública (Public Key)</label>
            <input
              className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-yellow-400 text-sm font-bold dark:text-white transition-all font-mono"
              type="text"
              placeholder="APP_USR-..."
              value={appSettings.mercadopago_public_key || ''}
              onChange={(e) => setAppSettings({ ...appSettings, mercadopago_public_key: e.target.value })}
            />
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1 mt-1">
              Necessária para tokenização segura do cartão no frontend.
            </p>
          </div>
        </div>
      </section>

      {/* Operacional: Plataforma Global */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-blue-50 text-blue-500 border border-blue-100 dark:bg-blue-500/10 dark:border-blue-500/20">
            <span className="material-symbols-outlined">schedule</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Horário Global da Plataforma</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controla quando o app inteiro aceita pedidos</p>
          </div>
        </div>

        <div className="mb-8 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl">
          <span className="material-symbols-outlined text-amber-500 text-lg mt-0.5">warning</span>
          <div>
            <p className="text-xs font-black text-amber-700 dark:text-amber-400">Este é o teto global da plataforma</p>
            <p className="text-[11px] font-bold text-amber-600/80 dark:text-amber-400/70 mt-0.5">
              Fora deste horário, <strong>nenhum cliente consegue fazer pedidos</strong>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mb-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Janela de Atendimento da Plataforma</label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-blue-400 text-lg">wb_sunny</span>
              <input
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-300 text-sm font-bold dark:text-white"
                type="time"
                value={appSettings.openingTime}
                onChange={(e) => setAppSettings({ ...appSettings, openingTime: e.target.value })}
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-black text-slate-300 uppercase">até</span>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>
            </div>
            <div className="flex-1 relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg">bedtime</span>
              <input
                className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-blue-300 text-sm font-bold dark:text-white"
                type="time"
                value={appSettings.closingTime}
                onChange={(e) => setAppSettings({ ...appSettings, closingTime: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Raio Global de Entrega */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20">
            <span className="material-symbols-outlined">delivery_dining</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Raio Global de Entrega</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Limite máximo para qualquer entrega na plataforma</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-end gap-6">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Raio Máximo (KM)</label>
              <div className="relative">
                <input
                  className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white pr-14"
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={appSettings.radius}
                  onChange={(e) => setAppSettings({ ...appSettings, radius: parseFloat(e.target.value) || 1 })}
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">km</span>
              </div>
            </div>
            <div className="flex flex-col items-center justify-center bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 rounded-2xl px-8 py-4 min-w-[120px] text-center">
              <span className="text-3xl font-black text-violet-500">{appSettings.radius}</span>
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest">km máx.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Regras Financeiras */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-500 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Regras Financeiras Globais</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxas padrão da plataforma</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="bg-primary/5 border border-primary/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-primary/80 uppercase tracking-widest mb-1">Comissão App (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-primary focus:ring-2 focus:ring-primary/30 shadow-inner"
                type="number" min="0" max="50" step="0.01"
                value={appSettings.appCommission}
                onChange={(e) => setAppSettings({ ...appSettings, appCommission: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">%</span>
            </div>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-100 dark:border-cyan-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-1">Comissão Entregador sobre Frete (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-cyan-600 focus:ring-2 focus:ring-cyan-300 shadow-inner"
                type="number" min="0" max="50" step="0.01"
                value={appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0}
                onChange={(e) => setAppSettings({ ...appSettings, driverFreightCommission: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyan-500 font-black text-sm">%</span>
            </div>
            <p className="text-[9px] font-bold text-cyan-700/70 uppercase tracking-widest">Aplicada sobre o valor do frete do entregador</p>
          </div>

          <div className="bg-fuchsia-50 dark:bg-fuchsia-500/10 border border-fuchsia-100 dark:border-fuchsia-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-fuchsia-600 uppercase tracking-widest mb-1">Comissão Motorista Particular (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-fuchsia-600 focus:ring-2 focus:ring-fuchsia-300 shadow-inner"
                type="number" min="0" max="50" step="0.01"
                value={appSettings.privateDriverCommission ?? appSettings.driverFreightCommission ?? appSettings.appCommission ?? 0}
                onChange={(e) => setAppSettings({ ...appSettings, privateDriverCommission: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-fuchsia-500 font-black text-sm">%</span>
            </div>
            <p className="text-[9px] font-bold text-fuchsia-700/70 uppercase tracking-widest">Aplicada sobre o valor do frete/corrida do motorista</p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Taxa de Serviço (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-blue-600 focus:ring-2 focus:ring-blue-300 shadow-inner"
                type="number" min="0" max="20" step="0.01"
                value={globalSettings?.service_fee_percent || 0}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  handleUpdateGlobalFinance('service_fee_percent', val);
                }}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-sm">%</span>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 rounded-[28px] p-6 space-y-3 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none transition-transform group-hover:scale-110">
              <span className="material-symbols-outlined text-6xl text-amber-500">toll</span>
            </div>
            <label className="block text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 relative z-10">Cotação Izi Coin</label>
            <div className="relative z-10 flex items-center justify-between gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-xs uppercase">IZI</span>
                <input
                  className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-2 py-3.5 font-black text-xl text-amber-600 focus:ring-2 focus:ring-amber-300 shadow-inner text-center"
                  type="number" value={1} disabled
                />
              </div>
              <span className="text-amber-500 font-black text-lg">=</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-xs">R$</span>
                <input
                  className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-9 pr-2 py-3.5 font-black text-xl text-emerald-600 focus:ring-2 focus:ring-amber-300 shadow-inner transition-all hover:bg-amber-50/50 dark:hover:bg-slate-800"
                  type="number" min="0.001" step="0.001"
                  value={globalSettings?.izi_coin_value ?? appSettings.iziCoinRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setAppSettings({ ...appSettings, iziCoinRate: val });
                    handleUpdateGlobalFinance('izi_coin_value', val);
                  }}
                />
              </div>
            </div>
            <p className="text-[9px] text-amber-600/70 font-bold tracking-widest uppercase mt-4 text-center">DEFINE O VALOR DE MERCADO DA MOEDA</p>
          </div>
        </div>
      </section>
      
      {/* Regras de Saque (Withdrawal Rules) */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-500 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Regras de Saque da Plataforma</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controla como lojistas e entregadores recebem</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Valor Mínimo (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-xl text-slate-700 dark:text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="1"
                value={appSettings.minwithdrawalamount ?? 0}
                onChange={(e) => setAppSettings({ ...appSettings, minwithdrawalamount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Taxa de Saque (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-xl text-slate-700 dark:text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.1"
                value={appSettings.withdrawalfeepercent || 0}
                onChange={(e) => setAppSettings({ ...appSettings, withdrawalfeepercent: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dia Oficial de Saque</label>
            <select
              className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-black text-xs uppercase tracking-widest text-slate-600 dark:text-white focus:ring-2 focus:ring-primary shadow-sm appearance-none"
              value={appSettings.withdrawal_day || ''}
              onChange={(e) => setAppSettings({ ...appSettings, withdrawal_day: e.target.value })}
            >
              <option value="">Qualquer dia</option>
              <option value="Segunda-feira">Segunda-feira</option>
              <option value="Terça-feira">Terça-feira</option>
              <option value="Quarta-feira">Quarta-feira</option>
              <option value="Quinta-feira">Quinta-feira</option>
              <option value="Sexta-feira">Sexta-feira</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>
          </div>

          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Intervalo entre Saques (H)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-xl text-slate-700 dark:text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="1"
                value={appSettings.withdrawal_period_h || 0}
                onChange={(e) => setAppSettings({ ...appSettings, withdrawal_period_h: parseInt(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] font-black uppercase">hrs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Configurações de Notificações */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20">
            <span className="material-symbols-outlined">notifications_active</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Canais de Notificação</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativar/Desativar SMS e E-mail</p>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { key: 'smsNotifications', label: 'SMS para Pedidos', icon: 'sms' },
            { key: 'emailNotifications', label: 'E-mail para Faturas', icon: 'email' },
          ].map(({ key, label, icon }) => {
            const isOn = (appSettings as any)[key];
            return (
              <div key={key} className={`flex items-center justify-between p-6 rounded-[28px] border transition-all ${isOn ? 'bg-primary/[0.03] border-primary/20' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOn ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <span className={`material-symbols-outlined ${isOn ? 'text-primary' : 'text-slate-400'}`}>{icon}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{label}</span>
                </div>
                <button
                  onClick={() => setAppSettings({ ...appSettings, [key]: !isOn })}
                  className={`w-14 h-8 rounded-full relative transition-all ${isOn ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1.5 size-5 bg-white rounded-full shadow-md transition-all ${isOn ? 'right-1.5' : 'left-1.5'}`}></div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gerenciamento de Bairros */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20">
            <span className="material-symbols-outlined">location_city</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Bairros da Cidade</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gerencie os bairros disponíveis para cobertura dos lojistas</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
              neighborhoods.filter(n => n.active).length > 0
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}>
              {neighborhoods.filter(n => n.active).length} ativos
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-400">
              {neighborhoods.length} total
            </span>
          </div>
        </div>

        {/* Adicionar Novo Bairro */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">add_location_alt</span>
            <input
              type="text"
              value={newNeighborhoodName}
              onChange={(e) => setNewNeighborhoodName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNeighborhood()}
              placeholder="Nome do novo bairro..."
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-400 text-sm font-bold dark:text-white transition-all"
            />
          </div>
          <button
            onClick={handleAddNeighborhood}
            disabled={neighborhoodSaving || !newNeighborhoodName.trim()}
            className="px-6 py-4 bg-violet-500 hover:bg-violet-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Adicionar
          </button>
        </div>

        {/* Lista de Bairros */}
        {neighborhoodsLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="size-8 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {neighborhoods.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-3 p-4 rounded-[24px] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 transition-all hover:shadow-sm"
              >
                {/* Ícone */}
                <div className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-slate-400 text-lg">location_on</span>
                </div>

                {/* Nome + status */}
                <div className="flex-1 min-w-0">
                  {editingId === n.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(n.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-violet-300 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-400 outline-none"
                    />
                  ) : (
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{n.name}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`inline-block w-1.5 h-1.5 rounded-full ${n.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {n.active ? 'Ativo' : 'Inativo'} · {n.city}
                    </p>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-center gap-1 shrink-0">
                  {editingId === n.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(n.id)}
                        disabled={neighborhoodSaving}
                        className="size-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95"
                        title="Salvar"
                      >
                        <span className="material-symbols-outlined text-sm">check</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="size-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
                        title="Cancelar"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleActive(n.id, n.active)}
                        title={n.active ? 'Desativar' : 'Ativar'}
                        className={`size-8 rounded-xl flex items-center justify-center transition-all active:scale-95 ${
                          n.active
                            ? 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 hover:bg-emerald-100'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">
                          {n.active ? 'toggle_on' : 'toggle_off'}
                        </span>
                      </button>
                      <button
                        onClick={() => { setEditingId(n.id); setEditingName(n.name); }}
                        className="size-8 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-violet-50 hover:text-violet-600 transition-all active:scale-95 border border-slate-100 dark:border-slate-600"
                        title="Renomear"
                      >
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNeighborhood(n.id, n.name)}
                        className="size-8 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 border border-slate-100 dark:border-slate-600"
                        title="Excluir"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}


            {neighborhoods.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 gap-4">
                <span className="material-symbols-outlined text-5xl text-slate-300">location_off</span>
                <p className="text-slate-400 font-bold text-sm">Nenhum bairro cadastrado</p>
                <p className="text-slate-300 text-xs">Use o campo acima para adicionar o primeiro bairro</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
