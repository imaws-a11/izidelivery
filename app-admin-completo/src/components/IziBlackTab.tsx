import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError, showConfirm } from '../lib/useToast';
import { format } from 'date-fns';


// Membros Izi Black
export default function IziBlackTab() {
  const {
    subscriptionOrders, 
    subscriptionOrdersPage, 
    subscriptionOrdersTotalCount, 
    handleConfirmSubscriptionPayment, 
    fetchSubscriptionOrders, 
    fetchPromotions,
    appSettings,
    setAppSettings,
    handleSaveAppSettings,
    usersList,
    promotionsList,
    isLoadingList,
    handleDeleteOrder,
  } = useAdmin();

  const [showBenefitModal, setShowBenefitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [benefitData, setBenefitData] = useState<any>({
    id: '',
    title: '',
    description: '',
    image_url: '',
    coupon_code: '',
    discount_type: 'percent',
    discount_value: 0,
    discount_percent: 0,
    min_order_value: 0,
    expires_at: '',
    is_active: true,
    is_vip: true,
    target_users: [], // IDs dos usuários selecionados para cashback individual
  });

  const [userSearch, setUserSearch] = useState('');

  const resetBenefitForm = () => {
    setBenefitData({
      id: '',
      title: '',
      description: '',
      image_url: '',
      coupon_code: '',
      discount_type: 'percent',
      discount_value: 0,
      discount_percent: 0,
      min_order_value: 0,
      expires_at: '',
      is_active: true,
      is_vip: true,
      target_users: [],
    });
    setUserSearch('');
  };

  const handleSaveBenefit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const isBanner = !!benefitData.image_url && !benefitData.coupon_code;
      if (isBanner && !benefitData.image_url) throw new Error('Banner exige imagem');
      if (benefitData.title === 'Cupom Black' && !benefitData.coupon_code) throw new Error('CUPOM exige um código');

      const dataToSave = {
        title: benefitData.title,
        description: benefitData.description,
        discount_type: benefitData.discount_type,
        discount_value: benefitData.title === 'Cupom Black' && benefitData.discount_type === 'fixed' ? Number(benefitData.discount_percent || 0) : Number(benefitData.discount_percent || 0),
        min_order_value: Number(benefitData.min_order_value || 0),
        expires_at: benefitData.expires_at || null,
        is_active: benefitData.is_active,
        is_vip: true,
        coupon_code: benefitData.title === 'Cupom Black' ? (benefitData.coupon_code || `VIP_${Date.now()}`).toUpperCase().trim() : null,
        image_url: isBanner ? benefitData.image_url : null,
        target_users: benefitData.title === 'Cashback Individual' ? benefitData.target_users : [],
      };

      const { error } = benefitData.id 
        ? await supabase.from('promotions_delivery').update(dataToSave).eq('id', benefitData.id)
        : await supabase.from('promotions_delivery').insert([dataToSave]);

      if (error) throw error;

      toastSuccess(`Benefício Izi Black ${benefitData.id ? 'atualizado' : 'publicado'}!`);
      setShowBenefitModal(false);
      fetchPromotions();
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    if (!await showConfirm({ message: 'Excluir esta recompensa Izi Black?' })) return;
    try {
      const { error } = await supabase.from('promotions_delivery').delete().eq('id', id);
      if (error) throw error;
      toastSuccess('Recompensa removida');
      fetchPromotions();
    } catch (err) {
      toastError('Erro ao excluir');
    }
  };


  const ORDERS_PER_PAGE = 50;

  React.useEffect(() => {
    fetchSubscriptionOrders(1);
  }, [fetchSubscriptionOrders]);

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <span className="material-symbols-outlined text-amber-500">workspace_premium</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Izi Black VIP</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm ml-1">Gerencie benefícios, membros e configurações globais do programa VIP.</p>
        </div>
      </div>

      {/* VIP Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Membros', val: usersList.filter(u => u.is_izi_black).length, icon: 'group', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
          { label: 'Recompensas Ativas', val: promotionsList.filter(p => p.is_vip && p.is_active).length, icon: 'redeem', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' },
          { label: 'Receita Est. (Mensal)', val: `R$ ${(usersList.filter(u => u.is_izi_black).length * (appSettings.iziBlackFee || 29.90)).toFixed(2).replace('.', ',')}`, icon: 'payments', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
          { label: 'Cashback Distribuído', val: `R$ ${usersList.reduce((acc, u) => acc + (u.cashback_earned || 0), 0).toFixed(0)}`, icon: 'monetization_on', color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
        ].map((s, i) => (
          <motion.div key={i} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ delay: i*0.07 }}
            className={`bg-white dark:bg-slate-900 rounded-[28px] p-6 border ${s.bg} flex items-center gap-4 shadow-sm`}>
            <div className={`p-3 rounded-2xl ${s.bg.split(' ').slice(0,2).join(' ')}`}>
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Global VIP Configuration */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <h3 className="text-base font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500">settings</span>
            Configuração do Programa
          </h3>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço da Assinatura (Mês)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input type="text" inputMode="decimal"
                  value={appSettings.iziBlackFee?.toString().replace('.', ',')}
                  onChange={e => setAppSettings({ ...appSettings, iziBlackFee: e.target.value.replace(',', '.') as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa de Cashback (%)</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                <input type="text" inputMode="decimal"
                  value={appSettings.iziBlackCashback?.toString().replace('.', ',')}
                  onChange={e => setAppSettings({ ...appSettings, iziBlackCashback: e.target.value.replace(',', '.') as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min. Pedido Frete Grátis</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                <input type="text" inputMode="decimal"
                  value={appSettings.iziBlackMinOrderFreeShipping?.toString().replace('.', ',')}
                  onChange={e => setAppSettings({ ...appSettings, iziBlackMinOrderFreeShipping: e.target.value.replace(',', '.') as any })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
              </div>
            </div>

            <div className="pt-4">
              <button 
                onClick={handleSaveAppSettings}
                className="w-full py-4 bg-primary text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">save</span>
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>

        {/* VIP Exclusive Rewards (Surprises) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500">card_giftcard</span>
              Exclusivos Izi Black
            </h3>
            <button 
              onClick={() => { resetBenefitForm(); setShowBenefitModal(true); }}
              className="flex items-center gap-2 px-5 py-3 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:brightness-110 transition-all">
              <span className="material-symbols-outlined text-lg">add</span>
              Nova Recompensa
            </button>
          </div>

          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
            {promotionsList.filter(p => p.is_vip).map((p, i) => (
              <div key={p.id || i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-amber-500/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center ${p.image_url ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                    <span className="material-symbols-outlined text-xl">{p.image_url ? 'view_carousel' : 'confirmation_number'}</span>
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{p.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                        {p.coupon_code || 'Banner Exclusivo'}
                      </span>
                      <span className="size-1 rounded-full bg-slate-300"></span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${p.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                        {p.is_active ? 'Ativo' : 'Pausado'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setBenefitData({ ...p, discount_percent: p.discount_value, expires_at: p.expires_at ? format(new Date(p.expires_at), 'yyyy-MM-dd') : '' }); setShowBenefitModal(true); }} className="size-9 rounded-xl bg-white dark:bg-slate-700 text-slate-400 hover:text-primary transition-colors flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-lg">edit</span>
                  </button>
                  <button onClick={() => p.id && handleDeleteBenefit(p.id)} className="size-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center border border-rose-100 dark:border-rose-500/20">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            ))}
            {promotionsList.filter(p => p.is_vip).length === 0 && (
              <div className="text-center py-20 opacity-40">
                <span className="material-symbols-outlined text-6xl mb-4 block text-slate-300">stars</span>
                <p className="text-sm font-black uppercase tracking-widest">Nenhuma recompensa VIP configurada</p>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">Clique no botão acima para criar banners ou cupons exclusivos para membros.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gestão de Pedidos de Assinatura */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500">history_edu</span>
            Fila de Ativação (Pedidos de Assinatura)
          </h3>
          <button 
            onClick={() => fetchSubscriptionOrders(1)}
            className="size-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">sync</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Cliente</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status Pgto</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscriptionOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs opacity-50">
                     Nenhuma assinatura pendente no momento
                  </td>
                </tr>
              ) : (
                subscriptionOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-8 py-6">
                       <p className="font-black text-slate-900 dark:text-white text-sm">{o.user_name || 'Cliente'}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID: {o.id.slice(0,8).toUpperCase()}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        o.status === 'concluido' ? 'bg-green-100 text-green-600 border border-green-200' :
                        'bg-amber-100 text-amber-600 border border-amber-200'
                      }`}>
                        {o.status === 'concluido' ? 'Pago & Ativo' : 'Aguardando'}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-black text-slate-900 dark:text-white">R$ {(o.total_price || 0).toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 font-bold text-slate-500 text-xs">{new Date(o.created_at).toLocaleDateString('pt-BR')}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {o.status !== 'concluido' && (
                          <button 
                            onClick={() => handleConfirmSubscriptionPayment(o)}
                            className="h-10 px-4 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-emerald-500/20"
                          >
                            Confirmar Pgto
                          </button>
                        )}
                        <button 
                          onClick={() => handleDeleteOrder(o.id)}
                          className="size-10 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all border border-red-100 dark:border-red-500/20"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação Assinaturas */}
        {subscriptionOrdersTotalCount > ORDERS_PER_PAGE && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Página {subscriptionOrdersPage} de {Math.ceil(subscriptionOrdersTotalCount / ORDERS_PER_PAGE)}
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={subscriptionOrdersPage <= 1 || isLoadingList}
                onClick={() => fetchSubscriptionOrders(subscriptionOrdersPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                disabled={subscriptionOrdersPage >= Math.ceil(subscriptionOrdersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                onClick={() => fetchSubscriptionOrders(subscriptionOrdersPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Benefit Editor Modal */}
      <AnimatePresence>
        {showBenefitModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowBenefitModal(false)} />
            <motion.div 
              initial={{ opacity:0, scale:0.95 }} 
              animate={{ opacity:1, scale:1 }}
              exit={{ opacity:0, scale:0.95 }}
              className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] relative z-10 p-10 border border-slate-200 dark:border-white/5 h-[80vh] flex flex-col font-display"
            >
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter dark:text-white">Exclusivos Izi Black</h4>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Configure recompensas exclusivas em tempo real</p>
                </div>
                <button onClick={() => setShowBenefitModal(false)} className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary flex items-center justify-center transition-all">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar space-y-8 pb-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Benefício</label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {[
                      { id: 'free_shipping', label: 'Frete Grátis', icon: 'local_shipping', color: 'bg-emerald-500', desc: 'Isenção total na taxa de entrega' },
                      { id: 'cashback', label: 'Cashback', icon: 'payments', color: 'bg-blue-500', desc: 'Saldo devolvido no saldo' },
                      { id: 'cashback_ind', label: 'Cashback Individual', icon: 'person_add', color: 'bg-blue-600', desc: 'Cashback para pessoas específicas' },
                      { id: 'coupon_black', label: 'Cupom Black', icon: 'confirmation_number', color: 'bg-amber-500', desc: 'Cupom de desconto especial' },
                      { id: 'priority', label: 'Prioridade Izi', icon: 'bolt', color: 'bg-purple-500', desc: 'Entrega e suporte priorizados' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setBenefitData({
                          ...benefitData, 
                          title: type.label, 
                          description: type.desc,
                          discount_type: 'percent',
                          discount_percent: type.label.includes('Cashback') ? 5 : (type.label === 'Cupom Black' ? 10 : 0)
                        })}
                        className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all gap-2 text-center group ${
                          benefitData.title === type.label 
                          ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                          : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-slate-200 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className={`size-10 rounded-xl ${type.color} text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <span className="material-symbols-outlined text-lg">{type.icon}</span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-tight text-slate-900 dark:text-white leading-tight">{type.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {benefitData.title === 'Cupom Black' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Código Único (CUPOM)</label>
                    <input 
                      type="text" 
                      required
                      value={benefitData.coupon_code} 
                      onChange={e => setBenefitData({...benefitData, coupon_code: e.target.value.toUpperCase()})}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl px-6 py-4 font-black text-xl text-amber-500 tracking-[0.2em] focus:ring-2 focus:ring-amber-500 transition-all"
                      placeholder="EX: VIP20OFF"
                    />
                  </div>
                )}

                <div className="space-y-4">
                  <AnimatePresence mode="wait">
                    {benefitData.title === 'Frete Grátis' ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        key="shipping"
                        className="p-8 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 flex flex-col items-center justify-center text-center gap-4"
                      >
                        <div className="size-16 rounded-[24px] bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                          <span className="material-symbols-outlined text-3xl">local_shipping</span>
                        </div>
                        <div>
                          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">Frete Grátis Ativo</p>
                          <p className="text-[10px] font-bold text-emerald-700/60 uppercase tracking-widest mt-1">Isenção total para membros premium</p>
                        </div>
                      </motion.div>
                    ) : benefitData.title === 'Prioridade Izi' ? (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        key="priority"
                        className="p-8 rounded-[32px] bg-purple-500/10 border border-purple-500/20 flex flex-col items-center justify-center text-center gap-4"
                      >
                        <div className="size-16 rounded-[24px] bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-500/20">
                          <span className="material-symbols-outlined text-3xl">bolt</span>
                        </div>
                        <div>
                          <p className="text-xl font-black text-purple-600 dark:text-purple-400">Prioridade Izi Ativa</p>
                          <p className="text-[10px] font-bold text-purple-700/60 uppercase tracking-widest mt-1">Suporte e entregas priorizadas</p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        key="value_config"
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between ml-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Valor do Benefício</label>
                            
                            {benefitData.title.includes('Cashback') ? (
                              <div className="px-4 py-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                 <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Apenas Porcentagem (%)</span>
                              </div>
                            ) : (
                              <div className="flex bg-slate-50 dark:bg-slate-800/50 rounded-xl p-1 border border-slate-100 dark:border-white/5">
                                <button 
                                  type="button" 
                                  onClick={() => setBenefitData({...benefitData, discount_type: 'percent'})}
                                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${benefitData.discount_type === 'percent' ? 'bg-white dark:bg-slate-700 shadow-lg text-primary' : 'text-slate-400 opacity-50'}`}
                                >
                                  %
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => setBenefitData({...benefitData, discount_type: 'fixed'})}
                                  className={`px-4 py-1.5 text-[10px] font-black rounded-lg transition-all ${benefitData.discount_type === 'fixed' ? 'bg-white dark:bg-slate-700 shadow-lg text-primary' : 'text-slate-400 opacity-50'}`}
                                >
                                  R$
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="relative">
                            <input type="text" inputMode="decimal" value={benefitData.discount_percent?.toString().replace('.', ',') || ''} 
                              onChange={e => setBenefitData({...benefitData, discount_percent: e.target.value.replace(',', '.')})}
                              className={`w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 font-black dark:text-white text-xl ${benefitData.title.includes('Cashback') ? 'pr-14' : ''}`} 
                            />
                            {benefitData.title.includes('Cashback') ? (
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">%</span>
                            ) : (
                              <span className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xl">{benefitData.discount_type === 'percent' ? '%' : 'R$'}</span>
                            )}
                          </div>
                        </div>

                        {benefitData.title === 'Cashback Individual' && (
                          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Selecionar Membros VIP ({benefitData.target_users?.length || 0})</label>
                              <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs text-slate-400">search</span>
                                <input 
                                  type="text" 
                                  placeholder="Filtrar por nome..." 
                                  value={userSearch}
                                  onChange={e => setUserSearch(e.target.value)}
                                  className="bg-transparent border-none text-[10px] font-bold uppercase tracking-tight focus:ring-0 p-0 w-32"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                              {usersList
                                .filter(u => u.is_izi_black && (u.name?.toLowerCase().includes(userSearch.toLowerCase()) || !userSearch))
                                .map(user => (
                                  <label key={user.id} className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border ${
                                    benefitData.target_users?.includes(user.id) 
                                      ? 'bg-blue-500/10 border-blue-500/30' 
                                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 hover:border-slate-200'
                                  }`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`size-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                        benefitData.target_users?.includes(user.id) ? 'bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                      }`}>
                                        {user.name?.[0]?.toUpperCase() || 'U'}
                                      </div>
                                      <div>
                                        <p className="text-xs font-black text-slate-700 dark:text-slate-200">{user.name || 'Sem nome'}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{user.phone || 'Sem telefone'}</p>
                                      </div>
                                    </div>
                                    <input 
                                      type="checkbox" 
                                      className="sr-only"
                                      checked={benefitData.target_users?.includes(user.id)}
                                      onChange={() => {
                                        const current = benefitData.target_users || [];
                                        const next = current.includes(user.id) 
                                          ? current.filter((id: string) => id !== user.id)
                                          : [...current, user.id];
                                        setBenefitData({ ...benefitData, target_users: next });
                                      }}
                                    />
                                    <div className={`size-5 rounded-md border-2 flex items-center justify-center transition-all ${
                                      benefitData.target_users?.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-200 dark:border-slate-700'
                                    }`}>
                                      {benefitData.target_users?.includes(user.id) && <span className="material-symbols-outlined text-white text-xs">check</span>}
                                    </div>
                                  </label>
                                ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <div className="pt-8 flex gap-4 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                <button onClick={() => setShowBenefitModal(false)} type="button" className="flex-1 py-5 rounded-[24px] bg-slate-100 dark:bg-slate-800 font-black tracking-widest text-[10px] uppercase dark:text-slate-400">Descartar</button>
                <button onClick={handleSaveBenefit} disabled={isSaving} className="flex-[2] py-5 rounded-[24px] bg-primary text-slate-900 font-black tracking-widest text-[10px] uppercase shadow-xl shadow-primary/20 hover:brightness-110 active:scale-95 transition-all">
                  Ativar agora
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
