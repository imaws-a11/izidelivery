import { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

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
      .insert({ name });
    if (error) {
      console.error('Erro ao adicionar bairro:', error);
      toastError('Erro ao salvar bairro: ' + error.message);
    } else {
      setNewNeighborhoodName('');
      toastSuccess(`Bairro "${name}" adicionado!`);
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
    if (error) {
      console.error('Erro ao editar bairro:', error);
      toastError('Erro ao editar bairro: ' + error.message);
    } else {
      setEditingId(null);
      toastSuccess('Bairro atualizado!');
      await fetchNeighborhoods();
    }
    setNeighborhoodSaving(false);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('city_neighborhoods_delivery')
      .update({ active: !current })
      .eq('id', id);
    if (error) {
      toastError('Erro ao alterar status: ' + error.message);
    }
    await fetchNeighborhoods();
  };

  const handleDeleteNeighborhood = async (id: string, name: string) => {
    if (!confirm(`Excluir o bairro "${name}"?\n\nLojistas que o usavam perderão essa configuração.`)) return;
    const { error } = await supabase.from('city_neighborhoods_delivery').delete().eq('id', id);
    if (error) {
      toastError('Erro ao excluir bairro: ' + error.message);
    } else {
      toastSuccess(`Bairro "${name}" removido.`);
    }
    await fetchNeighborhoods();
  };

  const handleUpdateGlobalFinance = async (key: string, value: number) => {
    if (!globalSettings) return;
    const newSettings = { ...globalSettings, [key]: value };
    await saveGlobalSettings(newSettings);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 ml-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-primary text-2xl font-black">settings_applications</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter uppercase">Configurações Globais</h1>
          </div>
          <p className="text-[10px] font-black text-slate-900 dark:text-slate-900 uppercase tracking-[0.4em] opacity-60 ml-1">Controles operacionais e financeiros da plataforma</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Auto-save status indicator */}
          <div className={`flex items-center gap-3 px-6 py-3 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shadow-sm ${
            autoSaveStatus === 'saved' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            autoSaveStatus === 'pending' ? 'bg-amber-500 text-white shadow-amber-500/20' :
            autoSaveStatus === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20' :
            'bg-white/60 dark:bg-slate-800 text-slate-900 border border-white/80'
          }`}>
            <span className={`material-symbols-outlined text-sm font-black ${autoSaveStatus === 'pending' ? 'animate-spin' : ''}`}>
              {autoSaveStatus === 'saved' ? 'check_circle' : autoSaveStatus === 'pending' ? 'sync' : autoSaveStatus === 'error' ? 'error' : 'cloud_done'}
            </span>
            {autoSaveStatus === 'saved' ? 'Sincronizado' : autoSaveStatus === 'pending' ? 'Salvando...' : autoSaveStatus === 'error' ? 'Falha' : 'Cloud Ativo'}
          </div>
          <button
            onClick={() => handleSaveAppSettings()}
            disabled={isSaving}
            className="px-8 py-4 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest rounded-full hover:bg-black active:scale-95 transition-all flex items-center gap-3 shadow-2xl disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-lg">save</span>
            {isSaving ? 'Gravando...' : 'Salvar Setup'}
          </button>
        </div>
      </div>

      {/* Identidade da plataforma */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
          <span className="material-symbols-outlined text-[140px]">store</span>
        </div>
        <div className="flex items-center gap-5 mb-10 relative z-10">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">storefront</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Branding & Suporte</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Identidade visual do ecossistema</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Nome da Plataforma</label>
            <input
              className="px-8 py-5 rounded-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 focus:ring-2 focus:ring-primary/20 text-sm font-black text-slate-900 dark:text-white transition-all shadow-inner outline-none"
              type="text"
              value={appSettings.appName}
              onChange={(e) => setAppSettings({ ...appSettings, appName: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">E-mail de Suporte</label>
            <input
              className="px-8 py-5 rounded-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 focus:ring-2 focus:ring-primary/20 text-sm font-black text-slate-900 dark:text-white transition-all shadow-inner outline-none"
              type="email"
              value={appSettings.supportEmail}
              onChange={(e) => setAppSettings({ ...appSettings, supportEmail: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Operacional & Manutenção */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="size-14 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">construction</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Disponibilidade</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Status do núcleo operacional</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className={`flex items-center justify-between p-8 rounded-[40px] border transition-all ${appSettings.maintenance_mode ? 'bg-rose-500 text-white border-rose-600 shadow-xl shadow-rose-500/20' : 'bg-white/60 dark:bg-slate-800 border-white/80 dark:border-slate-700 shadow-inner'}`}>
            <div className="flex items-center gap-6">
              <div className={`size-14 rounded-2xl flex items-center justify-center shadow-md ${appSettings.maintenance_mode ? 'bg-white text-rose-500' : 'bg-slate-100 text-slate-400'}`}>
                <span className="material-symbols-outlined text-2xl font-black">emergency_home</span>
              </div>
              <div>
                <span className={`text-lg font-black uppercase tracking-tight block ${appSettings.maintenance_mode ? 'text-white' : 'text-slate-900 dark:text-white'}`}>Modo de Bloqueio Total</span>
                <p className={`text-[10px] font-black uppercase tracking-widest ${appSettings.maintenance_mode ? 'text-white/80' : 'text-slate-900 opacity-40'}`}>Suspende todos os pedidos na rede imediatamente.</p>
              </div>
            </div>
            <button
              onClick={() => setAppSettings({ ...appSettings, maintenance_mode: !appSettings.maintenance_mode })}
              className={`w-20 h-10 rounded-full relative transition-all shadow-inner ${appSettings.maintenance_mode ? 'bg-white' : 'bg-slate-200 dark:bg-slate-600'}`}
            >
              <div className={`absolute top-1.5 size-7 rounded-full shadow-2xl transition-all ${appSettings.maintenance_mode ? 'right-1.5 bg-rose-500' : 'left-1.5 bg-white'}`}></div>
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6">Anúncio Global (Banner superior no APP)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary text-2xl font-black">campaign</span>
              <input
                className="w-full pl-16 pr-8 py-5 rounded-full bg-white/60 dark:bg-black/20 border border-white/80 dark:border-white/5 focus:ring-2 focus:ring-primary/20 text-sm font-black text-slate-900 dark:text-white shadow-inner outline-none"
                type="text"
                placeholder="Ex: Cupom IZI10 ativo em todo o app!"
                value={appSettings.global_announcement || ''}
                onChange={(e) => setAppSettings({ ...appSettings, global_announcement: e.target.value })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Regras Financeiras IZI Pay */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 right-0 p-10 opacity-[0.05] pointer-events-none">
          <span className="material-symbols-outlined text-[180px]">payments</span>
        </div>
        <div className="flex items-center gap-5 mb-10 relative z-10">
          <div className="size-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">qr_code_2</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">IZI Pay Gateway</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Taxas de processamento e liquidação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
          <div className="bg-white/60 border border-white/80 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 ml-4">Fee IZI Pay (Lojistas %)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl pl-6 pr-12 py-5 font-black text-3xl text-amber-600 focus:ring-2 focus:ring-amber-300 shadow-sm"
                type="number" min="0" max="50" step="0.1"
                value={appSettings.izi_pay_merchant_commission}
                onChange={(e) => setAppSettings({ ...appSettings, izi_pay_merchant_commission: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500 font-black text-lg">%</span>
            </div>
            <p className="text-[9px] font-black text-slate-900/60 uppercase tracking-widest leading-relaxed px-4">Retido em transações via QR Code/Carteira no estabelecimento.</p>
          </div>

          <div className="bg-white/60 border border-white/80 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 ml-4">Taxa P2P (Fixo R$)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500 font-black text-lg">R$</span>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl pl-14 pr-6 py-5 font-black text-3xl text-blue-600 focus:ring-2 focus:ring-blue-300 shadow-sm"
                type="number" min="0" step="0.01"
                value={appSettings.p2p_transfer_fee}
                onChange={(e) => setAppSettings({ ...appSettings, p2p_transfer_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <p className="text-[9px] font-black text-slate-900/60 uppercase tracking-widest leading-relaxed px-4">Valor cobrado por transferência instantânea entre usuários.</p>
          </div>

          <div className="bg-white/60 border border-white/80 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1 ml-4">Taxa Operacional (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl pl-6 pr-12 py-5 font-black text-3xl text-emerald-600 focus:ring-2 focus:ring-emerald-300 shadow-sm"
                type="number" min="0" max="20" step="0.1"
                value={appSettings.serviceFee}
                onChange={(e) => setAppSettings({ ...appSettings, serviceFee: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg">%</span>
            </div>
            <p className="text-[9px] font-black text-slate-900/60 uppercase tracking-widest leading-relaxed px-4">Taxa fixa de conveniência aplicada a cada pedido na rede.</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
          {[
            { key: 'pix', label: 'PIX Instantâneo', icon: 'account_balance' },
            { key: 'card', label: 'Cartão de Crédito', icon: 'credit_card' },
            { key: 'wallet', label: 'Carteira Digital', icon: 'wallet' },
            { key: 'lightning', label: 'Lightning Network', icon: 'bolt' }
          ].map((method) => {
            const isActive = appSettings.paymentmethodsactive?.[method.key as keyof typeof appSettings.paymentmethodsactive];
            return (
              <button
                key={method.key}
                onClick={() => {
                  const current = appSettings.paymentmethodsactive || { pix: true, card: true, lightning: false, wallet: true };
                  setAppSettings({
                    ...appSettings,
                    paymentmethodsactive: { ...current, [method.key]: !isActive }
                  });
                }}
                className={`flex flex-col items-center justify-center gap-4 p-8 rounded-[40px] border transition-all ${isActive ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg' : 'bg-white/40 border-white/80 text-slate-400 grayscale opacity-40 hover:opacity-100 hover:grayscale-0'}`}
              >
                <span className="material-symbols-outlined text-3xl font-black">{method.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-center">{method.label}</span>
                <div className={`w-10 h-1.5 rounded-full ${isActive ? 'bg-white/40' : 'bg-slate-300'}`}></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Regras IZI Black & Gamificação */}
      <section className="bg-slate-900 p-12 rounded-[56px] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[200px] text-primary">workspace_premium</span>
        </div>
        <div className="flex items-center gap-6 mb-12 relative z-10">
          <div className="size-16 rounded-[24px] bg-primary text-slate-900 border border-primary/20 flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="material-symbols-outlined text-3xl font-black">stars</span>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase">Clube IZI Black</h2>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Programas de fidelidade de alto nível</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">Preço Assinatura</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-lg">R$</span>
              <input
                className="w-full bg-slate-800 border-none rounded-3xl pl-16 pr-6 py-5 font-black text-3xl text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.01"
                value={appSettings.iziBlackFee}
                onChange={(e) => setAppSettings({ ...appSettings, iziBlackFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">Cashback Base</label>
            <div className="relative">
              <input
                className="w-full bg-slate-800 border-none rounded-3xl pl-6 pr-14 py-5 font-black text-3xl text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.1"
                value={appSettings.iziBlackCashback}
                onChange={(e) => setAppSettings({ ...appSettings, iziBlackCashback: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black text-lg">%</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">Mult. Cashback</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-lg">x</span>
              <input
                className="w-full bg-slate-800 border-none rounded-3xl pl-12 pr-6 py-5 font-black text-3xl text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.1"
                value={appSettings.izi_black_cashback_multiplier}
                onChange={(e) => setAppSettings({ ...appSettings, izi_black_cashback_multiplier: parseFloat(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 space-y-4 shadow-inner">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-4">Mult. Experiência</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black text-lg">x</span>
              <input
                className="w-full bg-slate-800 border-none rounded-3xl pl-12 pr-6 py-5 font-black text-3xl text-white focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.1"
                value={appSettings.izi_black_xp_multiplier}
                onChange={(e) => setAppSettings({ ...appSettings, izi_black_xp_multiplier: parseFloat(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Regras de Entrega & Logística */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="size-14 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">local_shipping</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Logística & Cobertura</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Parâmetros de entrega global</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-8">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6 block mb-3">Raio Máximo Global</label>
                <div className="relative">
                  <input
                    className="w-full px-8 py-5 rounded-full bg-white/60 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-black dark:text-white pr-20 shadow-inner outline-none"
                    type="number" min="0.1" max="100" step="0.1"
                    value={appSettings.radius}
                    onChange={(e) => setAppSettings({ ...appSettings, radius: parseFloat(e.target.value) || 1 })}
                  />
                  <span className="absolute right-8 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-900 uppercase opacity-40">km</span>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center bg-violet-500 text-white rounded-[32px] px-8 py-5 min-w-[140px] text-center shadow-xl shadow-violet-500/20">
                <span className="text-4xl font-black">{appSettings.radius}</span>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Km Raio</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <label className="text-[10px] font-black text-slate-900 uppercase tracking-widest ml-6 block mb-1">Janela de Funcionamento App</label>
            <div className="flex items-center gap-5">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-amber-500 text-xl font-black">wb_sunny</span>
                <input
                  className="w-full pl-14 pr-6 py-5 rounded-full bg-white/60 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-black dark:text-white shadow-inner outline-none"
                  type="time"
                  value={appSettings.openingTime}
                  onChange={(e) => setAppSettings({ ...appSettings, openingTime: e.target.value })}
                />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{" >> "}</span>
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-indigo-500 text-xl font-black">bedtime</span>
                <input
                  className="w-full pl-14 pr-6 py-5 rounded-full bg-white/60 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-black dark:text-white shadow-inner outline-none"
                  type="time"
                  value={appSettings.closingTime}
                  onChange={(e) => setAppSettings({ ...appSettings, closingTime: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Regras de Saque */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="size-14 rounded-2xl bg-slate-100 text-slate-900 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Cashout & Liquidez</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Regras de retirada para parceiros</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-8 rounded-[40px] bg-white/60 border border-white/80 shadow-inner space-y-4">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-4">Mínimo (R$)</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">R$</span>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl pl-16 pr-6 py-5 font-black text-2xl focus:ring-2 focus:ring-primary shadow-sm"
                type="number"
                value={appSettings.minwithdrawalamount}
                onChange={(e) => setAppSettings({ ...appSettings, minwithdrawalamount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-white/60 border border-white/80 shadow-inner space-y-4">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-4">Taxa (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl pl-6 pr-14 py-5 font-black text-2xl focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.1"
                value={appSettings.withdrawalfeepercent}
                onChange={(e) => setAppSettings({ ...appSettings, withdrawalfeepercent: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">%</span>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-white/60 border border-white/80 shadow-inner space-y-4">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-4">Dia Oficial</label>
            <div className="relative">
              <select
                className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-6 font-black text-[10px] uppercase tracking-widest text-slate-900 focus:ring-2 focus:ring-primary shadow-sm appearance-none"
                value={appSettings.withdrawal_day}
                onChange={(e) => setAppSettings({ ...appSettings, withdrawal_day: e.target.value })}
              >
                {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
              <span className="material-symbols-outlined absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-900">expand_more</span>
            </div>
          </div>

          <div className="p-8 rounded-[40px] bg-white/60 border border-white/80 shadow-inner space-y-4">
            <label className="block text-[10px] font-black text-slate-900 uppercase tracking-widest mb-2 ml-4">Janela (H)</label>
            <input
              className="w-full bg-white dark:bg-slate-900 border-none rounded-3xl px-8 py-5 font-black text-2xl focus:ring-2 focus:ring-primary shadow-sm"
              type="number"
              value={appSettings.withdrawal_period_h}
              onChange={(e) => setAppSettings({ ...appSettings, withdrawal_period_h: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </section>

      {/* Canais de Notificação */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="size-14 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">notifications_active</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Engajamento Push</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Canais de comunicação transacional</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { key: 'smsNotifications', label: 'SMS Transacional (Pedidos)', icon: 'sms' },
            { key: 'emailNotifications', label: 'E-mail Financeiro (Faturas)', icon: 'email' },
          ].map(({ key, label, icon }) => {
            const isOn = (appSettings as any)[key];
            return (
              <div key={key} className={`flex items-center justify-between p-8 rounded-[40px] border transition-all ${isOn ? 'bg-primary/5 border-primary/20 shadow-lg' : 'bg-white/60 dark:bg-slate-800 border-white/80 dark:border-slate-700 shadow-inner'}`}>
                <div className="flex items-center gap-6">
                  <div className={`size-14 rounded-2xl flex items-center justify-center shadow-md ${isOn ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                    <span className="material-symbols-outlined text-2xl font-black">{icon}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{label}</span>
                </div>
                <button
                  onClick={() => setAppSettings({ ...appSettings, [key]: !isOn })}
                  className={`w-16 h-9 rounded-full relative transition-all shadow-inner ${isOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-1.5 size-6 bg-white rounded-full shadow-2xl transition-all ${isOn ? 'right-1.5' : 'left-1.5'}`}></div>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Gerenciamento de Bairros */}
      <section className="bg-white/40 backdrop-blur-2xl p-10 rounded-[48px] border border-white/50 shadow-xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="size-14 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20 flex items-center justify-center shadow-inner">
            <span className="material-symbols-outlined text-2xl font-black">location_city</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Ecossistema Urbano</h2>
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest opacity-40">Mapeamento de bairros e micro-regiões</p>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
              {neighborhoods.filter(n => n.active).length} Ativos
            </span>
            <span className="px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white shadow-lg">
              {neighborhoods.length} Total
            </span>
          </div>
        </div>

        {/* Adicionar Novo Bairro */}
        <div className="flex gap-4 mb-10">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-2xl font-black">add_location_alt</span>
            <input
              type="text"
              value={newNeighborhoodName}
              onChange={(e) => setNewNeighborhoodName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddNeighborhood()}
              placeholder="Nome do novo bairro operacional..."
              className="w-full pl-16 pr-8 py-5 rounded-full bg-white/60 dark:bg-slate-800 border border-white/80 dark:border-white/5 focus:ring-2 focus:ring-violet-400 text-sm font-black dark:text-white transition-all shadow-inner outline-none"
            />
          </div>
          <button
            onClick={handleAddNeighborhood}
            disabled={neighborhoodSaving || !newNeighborhoodName.trim()}
            className="px-10 py-5 bg-violet-500 hover:bg-violet-600 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-2xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-lg font-black">add</span>
            Criar Região
          </button>
        </div>

        {/* Lista de Bairros */}
        {neighborhoodsLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <div className="size-16 border-4 border-violet-200 border-t-violet-500 rounded-full animate-spin shadow-inner" />
            <p className="text-[10px] font-black text-slate-900 uppercase tracking-[0.5em] opacity-40">Sincronizando Malha Urbana...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {neighborhoods.map((n) => (
              <div
                key={n.id}
                className={`flex items-center gap-5 p-6 rounded-[32px] border transition-all hover:scale-[1.02] ${n.active ? 'bg-white/60 border-white/80 shadow-md' : 'bg-slate-50/50 border-slate-100 opacity-60 grayscale shadow-inner'}`}
              >
                {/* Ícone */}
                <div className={`size-14 rounded-[20px] flex items-center justify-center shrink-0 shadow-inner ${n.active ? 'bg-violet-50 text-violet-500' : 'bg-slate-200 text-slate-400'}`}>
                  <span className="material-symbols-outlined text-2xl font-black">location_on</span>
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
                      className="w-full bg-white dark:bg-slate-900 border-2 border-violet-300 rounded-2xl px-4 py-2 text-sm font-black text-slate-900 dark:text-white focus:ring-4 focus:ring-violet-400/20 outline-none shadow-sm"
                    />
                  ) : (
                    <p className="text-base font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">{n.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`size-2 rounded-full ${n.active ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-400'}`} />
                    <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-40">
                      {n.active ? 'Região Ativa' : 'Desabilitado'}
                    </p>
                  </div>
                </div>

                {/* Botões de ação */}
                <div className="flex items-center gap-2 shrink-0">
                  {editingId === n.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(n.id)}
                        disabled={neighborhoodSaving}
                        className="size-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                        title="Salvar"
                      >
                        <span className="material-symbols-outlined text-xl font-black">check</span>
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="size-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 flex items-center justify-center hover:bg-slate-200 transition-all active:scale-95"
                        title="Cancelar"
                      >
                        <span className="material-symbols-outlined text-xl font-black">close</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleToggleActive(n.id, n.active)}
                        className={`size-10 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-sm ${
                          n.active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-500 hover:text-white'
                            : 'bg-slate-100 text-slate-400 hover:bg-emerald-500 hover:text-white'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xl font-black">
                          {n.active ? 'toggle_on' : 'toggle_off'}
                        </span>
                      </button>
                      <button
                        onClick={() => { setEditingId(n.id); setEditingName(n.name); }}
                        className="size-10 rounded-xl bg-white text-slate-400 flex items-center justify-center hover:bg-violet-500 hover:text-white transition-all active:scale-95 border border-slate-100 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xl font-black">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteNeighborhood(n.id, n.name)}
                        className="size-10 rounded-xl bg-white text-rose-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-95 border border-slate-100 shadow-sm"
                      >
                        <span className="material-symbols-outlined text-xl font-black">delete</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}

            {neighborhoods.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 gap-6 opacity-20">
                <span className="material-symbols-outlined text-8xl">location_off</span>
                <p className="text-sm font-black uppercase tracking-[0.5em]">Malha Urbana Vazia</p>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
