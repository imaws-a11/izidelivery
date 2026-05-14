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

      {/* Operacional & Manutenção */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-rose-50 text-rose-500 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20">
            <span className="material-symbols-outlined">construction</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Manutenção & Alertas</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle global de disponibilidade</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className={`flex items-center justify-between p-6 rounded-[28px] border transition-all ${appSettings.maintenance_mode ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${appSettings.maintenance_mode ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                <span className="material-symbols-outlined text-lg">emergency_home</span>
              </div>
              <div>
                <span className="text-sm font-black text-slate-900 dark:text-white block">Modo Manutenção Global</span>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Se ativado, o app ficará indisponível para pedidos.</p>
              </div>
            </div>
            <button
              onClick={() => setAppSettings({ ...appSettings, maintenance_mode: !appSettings.maintenance_mode })}
              className={`w-14 h-8 rounded-full relative transition-all ${appSettings.maintenance_mode ? 'bg-rose-500' : 'bg-slate-300 dark:bg-slate-600'}`}
            >
              <div className={`absolute top-1.5 size-5 bg-white rounded-full shadow-md transition-all ${appSettings.maintenance_mode ? 'right-1.5' : 'left-1.5'}`}></div>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anúncio Global (Banner Superior)</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-lg">campaign</span>
              <input
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary text-sm font-bold dark:text-white"
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
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
          <span className="material-symbols-outlined text-[150px]">payments</span>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20">
            <span className="material-symbols-outlined">qr_code_2</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Ecossistema Financeiro IZI Pay</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxas de QR Code e Transferências</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">Comissão IZI Pay (Lojistas %)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-amber-600 focus:ring-2 focus:ring-amber-300 shadow-inner"
                type="number" min="0" max="50" step="0.1"
                value={appSettings.izi_pay_merchant_commission}
                onChange={(e) => setAppSettings({ ...appSettings, izi_pay_merchant_commission: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-500 font-black text-sm">%</span>
            </div>
            <p className="text-[9px] font-bold text-amber-700/60 uppercase tracking-widest leading-tight">Retido automaticamente em pagamentos via QR Code/Carteira no balcão.</p>
          </div>

          <div className="bg-blue-50/50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest mb-1">Taxa Transferência P2P (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-500 font-black text-sm">R$</span>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-2xl text-blue-600 focus:ring-2 focus:ring-blue-300 shadow-inner"
                type="number" min="0" step="0.01"
                value={appSettings.p2p_transfer_fee}
                onChange={(e) => setAppSettings({ ...appSettings, p2p_transfer_fee: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <p className="text-[9px] font-bold text-blue-700/60 uppercase tracking-widest leading-tight">Valor fixo cobrado por transferência entre usuários comuns.</p>
          </div>

          <div className="bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/20 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1">Taxa de Serviço Global (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-emerald-600 focus:ring-2 focus:ring-emerald-300 shadow-inner"
                type="number" min="0" max="20" step="0.1"
                value={appSettings.serviceFee}
                onChange={(e) => setAppSettings({ ...appSettings, serviceFee: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-sm">%</span>
            </div>
            <p className="text-[9px] font-bold text-emerald-700/60 uppercase tracking-widest leading-tight">Taxa operacional cobrada do cliente final em cada pedido.</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: 'pix', label: 'PIX', icon: 'account_balance' },
            { key: 'card', label: 'Cartão', icon: 'credit_card' },
            { key: 'wallet', label: 'Carteira IZI', icon: 'wallet' },
            { key: 'lightning', label: 'Lightning', icon: 'bolt' }
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
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-100 text-slate-400 grayscale'}`}
              >
                <span className="material-symbols-outlined text-lg">{method.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-widest">{method.label}</span>
                <div className={`ml-auto size-2 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Regras IZI Black & Gamificação */}
      <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <span className="material-symbols-outlined text-[150px] text-primary">workspace_premium</span>
        </div>
        <div className="flex items-center gap-3 mb-8 relative z-10">
          <div className="p-3 rounded-2xl bg-primary text-slate-900 border border-primary/20">
            <span className="material-symbols-outlined">stars</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-white tracking-tight">Fidelidade IZI Black</h2>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Configurações do clube de benefícios</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Preço Assinatura (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">R$</span>
              <input
                className="w-full bg-slate-800 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-2xl text-white focus:ring-2 focus:ring-primary shadow-inner"
                type="number" step="0.01"
                value={appSettings.iziBlackFee}
                onChange={(e) => setAppSettings({ ...appSettings, iziBlackFee: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cashback Base (%)</label>
            <div className="relative">
              <input
                className="w-full bg-slate-800 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-2xl text-white focus:ring-2 focus:ring-primary shadow-inner"
                type="number" step="0.1"
                value={appSettings.iziBlackCashback}
                onChange={(e) => setAppSettings({ ...appSettings, iziBlackCashback: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">%</span>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mult. Cashback Black</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">x</span>
              <input
                className="w-full bg-slate-800 border-none rounded-2xl pl-8 pr-4 py-3.5 font-black text-2xl text-white focus:ring-2 focus:ring-primary shadow-inner"
                type="number" step="0.1"
                value={appSettings.izi_black_cashback_multiplier}
                onChange={(e) => setAppSettings({ ...appSettings, izi_black_cashback_multiplier: parseFloat(e.target.value) || 1 })}
              />
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[28px] p-6 space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mult. XP Black</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-sm">x</span>
              <input
                className="w-full bg-slate-800 border-none rounded-2xl pl-8 pr-4 py-3.5 font-black text-2xl text-white focus:ring-2 focus:ring-primary shadow-inner"
                type="number" step="0.1"
                value={appSettings.izi_black_xp_multiplier}
                onChange={(e) => setAppSettings({ ...appSettings, izi_black_xp_multiplier: parseFloat(e.target.value) || 1 })}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Regras de Entrega & Logística */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-violet-50 text-violet-500 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20">
            <span className="material-symbols-outlined">local_shipping</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Logística & Raio de Entrega</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parâmetros de cobertura global</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-2">Raio Máximo Global (KM)</label>
                <div className="relative">
                  <input
                    className="w-full px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white pr-14"
                    type="number" min="0.1" max="100" step="0.1"
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

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Janela de Funcionamento do App</label>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-amber-500 text-lg">wb_sunny</span>
                <input
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white"
                  type="time"
                  value={appSettings.openingTime}
                  onChange={(e) => setAppSettings({ ...appSettings, openingTime: e.target.value })}
                />
              </div>
              <span className="text-[10px] font-black text-slate-300 uppercase">até</span>
              <div className="flex-1 relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400 text-lg">bedtime</span>
                <input
                  className="w-full pl-11 pr-4 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-violet-300 text-sm font-bold dark:text-white"
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
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:border-slate-700">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Regras de Saque (Withdrawal)</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Política de recebimento para parceiros</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Valor Mínimo (R$)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-10 pr-4 py-3.5 font-black text-xl focus:ring-2 focus:ring-primary shadow-sm"
                type="number"
                value={appSettings.minwithdrawalamount}
                onChange={(e) => setAppSettings({ ...appSettings, minwithdrawalamount: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Taxa de Saque (%)</label>
            <div className="relative">
              <input
                className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl pl-4 pr-10 py-3.5 font-black text-xl focus:ring-2 focus:ring-primary shadow-sm"
                type="number" step="0.1"
                value={appSettings.withdrawalfeepercent}
                onChange={(e) => setAppSettings({ ...appSettings, withdrawalfeepercent: parseFloat(e.target.value) || 0 })}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">%</span>
            </div>
          </div>

          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Dia Oficial</label>
            <select
              className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-4 font-black text-xs uppercase tracking-widest text-slate-600 focus:ring-2 focus:ring-primary shadow-sm"
              value={appSettings.withdrawal_day}
              onChange={(e) => setAppSettings({ ...appSettings, withdrawal_day: e.target.value })}
            >
              {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'].map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-[28px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Intervalo (Horas)</label>
            <input
              className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-3.5 font-black text-xl focus:ring-2 focus:ring-primary shadow-sm"
              type="number"
              value={appSettings.withdrawal_period_h}
              onChange={(e) => setAppSettings({ ...appSettings, withdrawal_period_h: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </section>

      {/* Mercado Pago */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-yellow-50 text-yellow-600 border border-yellow-100 dark:bg-yellow-500/10 dark:border-yellow-500/20">
            <span className="material-symbols-outlined">api</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Gateway Mercado Pago</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração das chaves de API</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave Pública (Public Key)</label>
          <input
            className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-yellow-400 text-sm font-bold dark:text-white transition-all font-mono"
            type="text"
            placeholder="APP_USR-..."
            value={appSettings.mercadopago_public_key || ''}
            onChange={(e) => setAppSettings({ ...appSettings, mercadopago_public_key: e.target.value })}
          />
        </div>
      </section>

      {/* Canais de Notificação */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-500 border border-purple-100 dark:bg-purple-500/10 dark:border-purple-500/20">
            <span className="material-symbols-outlined">notifications_active</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Canais de Notificação Externos</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ativar/Desativar SMS e E-mail</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'smsNotifications', label: 'SMS Operacional (Pedidos)', icon: 'sms' },
            { key: 'emailNotifications', label: 'E-mail Transacional (Faturas)', icon: 'email' },
          ].map(({ key, label, icon }) => {
            const isOn = (appSettings as any)[key];
            return (
              <div key={key} className={`flex items-center justify-between p-6 rounded-[28px] border transition-all ${isOn ? 'bg-primary/[0.03] border-primary/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700'}`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${isOn ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <span className={`material-symbols-outlined ${isOn ? 'text-primary' : 'text-slate-400'}`}>{icon}</span>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{label}</span>
                </div>
                <button
                  onClick={() => setAppSettings({ ...appSettings, [key]: !isOn })}
                  className={`w-14 h-8 rounded-full relative transition-all ${isOn ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-600'}`}
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
                      {n.active ? 'Ativo' : 'Inativo'}
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
