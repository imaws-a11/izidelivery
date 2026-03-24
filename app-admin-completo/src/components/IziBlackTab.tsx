import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Membros Izi Black
export default function IziBlackTab() {
  const {
    subscriptionOrders, subscriptionOrdersPage, setSubscriptionOrdersPage, subscriptionOrdersTotalCount, handleConfirmSubscriptionPayment, fetchSubscriptionOrders, appSettings
  } = useAdmin();

  return (
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
      { label: 'Receita Est. (Mensal)', val: `R$ ${(usersList.filter(u => u.is_izi_black).length * appSettings.iziBlackFee).toFixed(2).replace('.', ',')}`, icon: 'payments', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
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
            <input type="number" step="0.01" 
              value={appSettings.iziBlackFee}
              onChange={e => setAppSettings({ ...appSettings, iziBlackFee: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Taxa de Cashback (%)</label>
          <div className="relative">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
            <input type="number" 
              value={appSettings.iziBlackCashback}
              onChange={e => setAppSettings({ ...appSettings, iziBlackCashback: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Min. Pedido Frete Grátis</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
            <input type="number" 
              value={appSettings.iziBlackMinOrderFreeShipping}
              onChange={e => setAppSettings({ ...appSettings, iziBlackMinOrderFreeShipping: parseInt(e.target.value) || 0 })}
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl pl-10 pr-5 py-4 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white" />
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10">
           <p className="text-[9px] font-bold text-amber-600 dark:text-amber-500/80 uppercase tracking-widest leading-relaxed">
             As alterações entram em vigor imediatamente para todos os membros ativos.
           </p>
        </div>
      </div>
    </div>

    {/* VIP Exclusive Rewards (Surprises) */}
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-500">card_giftcard</span>
          Recompensas e Surpresas VIP
        </h3>
        <button 
          onClick={() => { setPromoFormType('coupon'); setPromoForm({ title:'', description:'', image_url:'', coupon_code:'', discount_type:'percent', discount_value:10, min_order_value:0, max_usage:100, expires_at:'', is_active:true, is_vip:true }); setShowPromoForm(true); setActiveTab('promotions'); }}
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
              <button onClick={() => { setPromoFormType(p.coupon_code ? 'coupon' : 'banner'); setPromoForm(p); setShowPromoForm(true); setActiveTab('promotions'); }} className="size-9 rounded-xl bg-white dark:bg-slate-700 text-slate-400 hover:text-primary transition-colors flex items-center justify-center shadow-sm">
                <span className="material-symbols-outlined text-lg">edit</span>
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
</div>
            )}

  );
}
