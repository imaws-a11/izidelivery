import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';

// Pedidos do Lojista
export default function OrdersMerchantTab() {
  const {
    allOrders, 
    merchantOrdersPage, 
    setMerchantOrdersPage, 
    merchantOrdersTotalCount, 
    fetchAllOrders, 
    userRole,
    merchantProfile,
    isLoadingList
  } = useAdmin();

  const ORDERS_PER_PAGE = 50;

  // Filtrar pedidos que pertencem a este lojista
  const myOrders = allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id);
  
  // Pedidos que precisam de INTERVENÇÃO (Aceitar/Recusar)
  const pendingOrders = myOrders.filter((o: any) => o.status === 'waiting_merchant' || o.status === 'novo');
  
  // Pedidos aguardando pagamento (PIX)
  const waitingPaymentOrders = myOrders.filter((o: any) => o.status === 'pendente_pagamento');
  
  // Pedidos em PRODUÇÃO ou ENTREGA
  const ongoingOrders = myOrders.filter((o: any) => ['preparando', 'pronto', 'pendente', 'waiting_driver', 'accepted', 'picked_up', 'em_rota', 'a_caminho'].includes(o.status));

  const [localProcessingId, setLocalProcessingId] = React.useState<string | null>(null);

  const handleAction = async (id: string, newStatus: string, reason?: string) => {
    setLocalProcessingId(id);
    try {
      const updateData: any = { status: newStatus };
      if (reason) updateData.cancel_reason = reason;
      
      const { error } = await supabase.from('orders_delivery').update(updateData).eq('id', id);
      if (error) throw error;
      
      // Forçar atualização do dashboard
      await fetchAllOrders(merchantOrdersPage);
    } catch (err) {
      console.error('Erro na ação do lojista:', err);
      alert('Erro ao processar pedido. Tente novamente.');
    } finally {
      setLocalProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
              <span className="material-symbols-outlined text-3xl text-primary">shopping_cart</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight text-shadow-sm">Meus Pedidos</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie o fluxo de atendimento da sua loja em tempo real.</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-orange-600 shadow-sm">
            <span className="size-2 rounded-full bg-orange-500 animate-ping"></span>
            {pendingOrders.length} novos pedidos
          </span>
          <button 
            onClick={() => fetchAllOrders(merchantOrdersPage)}
            disabled={isLoadingList}
            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-primary transition-all active:scale-95 shadow-sm"
          >
            <span className={`material-symbols-outlined ${isLoadingList ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {pendingOrders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-black text-orange-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <span className="material-symbols-outlined text-lg">notifications_active</span>
              Aguardando sua ação
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pendingOrders.map((o: any) => (
                <motion.div 
                  layoutId={o.id}
                  key={o.id} 
                  className="group bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-500/5 p-6 rounded-[32px] border-2 border-orange-100 dark:border-orange-500/20 shadow-xl shadow-orange-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4">
                     <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">NOVO</span>
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pedido</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      {new Date(o.created_at).toLocaleString('pt-BR')}
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-lg text-rose-500">pin_drop</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Destino</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-2">{o.delivery_address}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        <span className="material-symbols-outlined text-lg text-blue-500">payments</span>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Pagamento</p>
                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 capitalize">{o.payment_method || 'Não inf.'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-8 px-1">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p>
                      <p className="text-3xl font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button 
                      disabled={localProcessingId === o.id}
                      onClick={() => { 
                        if(!confirm('Deseja realmente recusar este pedido?')) return;
                        handleAction(o.id, 'cancelado', 'Recusado pelo lojista');
                      }} 
                      className="flex-1 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100 disabled:opacity-50"
                    >
                      {localProcessingId === o.id ? '...' : 'Recusar'}
                    </button>
                    <button 
                      disabled={localProcessingId === o.id}
                      onClick={() => handleAction(o.id, 'preparando')} 
                      className="flex-1 py-4 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all disabled:opacity-50"
                    >
                      {localProcessingId === o.id ? '...' : 'Preparar'}
                    </button>
                    <button 
                      disabled={localProcessingId === o.id}
                      onClick={() => handleAction(o.id, 'waiting_driver')} 
                      className="flex-[2] py-4 rounded-3xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.2em] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      {localProcessingId === o.id ? '...' : 'Aceitar e Chamar'}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {waitingPaymentOrders.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <h3 className="text-sm font-black text-amber-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
              <span className="material-symbols-outlined text-lg">hourglass_bottom</span>
              Aguardando Pagamento (PIX)
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
               {waitingPaymentOrders.map((o: any) => (
                 <div key={o.id} className="min-w-[280px] bg-amber-50/50 dark:bg-amber-500/5 p-4 rounded-3xl border border-amber-100 dark:border-amber-500/10">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[10px] font-black text-amber-600">#DT-{o.id.slice(0,8).toUpperCase()}</span>
                       <span className="text-[9px] font-black text-amber-400 uppercase italic">Verificando...</span>
                    </div>
                    <p className="text-sm font-black text-slate-700 dark:text-amber-100 mb-1">R$ {o.total_price?.toFixed(2).replace('.',',')}</p>
                    <p className="text-[10px] font-medium text-slate-400 truncate">{o.delivery_address}</p>
                 </div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-blue-500 uppercase tracking-[0.2em] flex items-center gap-2 ml-1">
          <span className="material-symbols-outlined text-lg">local_shipping</span>
          Em andamento
        </h3>
        
        {ongoingOrders.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[40px] border border-dashed border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">empty_dashboard</span>
            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum pedido em produção</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ongoingOrders.map((o: any) => (
              <div key={o.id} className="bg-white dark:bg-slate-900 p-5 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                  <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                    o.status === 'preparando' ? 'bg-amber-100 text-amber-600' :
                    o.status === 'pending' || o.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {o.status === 'preparando' ? 'Preparando' : 
                     o.status === 'pending' || o.status === 'accepted' ? 'Buscando Entregador' : 
                     o.status === 'a_caminho' ? 'Saiu p/ Entrega' : 
                     o.status === 'em_rota' ? 'Em Rota' : o.status}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 truncate mb-4">{o.delivery_address}</p>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-lg font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</span>
                  {o.status === 'preparando' && (
                    <button 
                      disabled={localProcessingId === o.id}
                      onClick={() => handleAction(o.id, 'waiting_driver')} 
                      className="px-4 py-2 rounded-xl bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                    >
                      {localProcessingId === o.id ? '...' : 'Chamar Motoboy'}
                    </button>
                  )}
                  {o.status === 'waiting_driver' && (
                    <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Buscando Entregador...</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-12">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
          <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history</span>
            Histórico Completo
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Pedido</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destino</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {myOrders.map((o: any) => (
                <tr key={o.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-8 py-6 font-bold text-slate-400 text-sm group-hover:text-primary transition-colors">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-900 dark:text-white text-sm truncate max-w-[300px]">{o.delivery_address}</p>
                  </td>
                  <td className="px-8 py-6 font-black text-primary text-base">R$ {o.total_price?.toFixed(2).replace('.', ',')}</td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      o.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      o.status === 'cancelado' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}>
                      {o.status === 'concluido' ? 'Concluído' : 
                       o.status === 'cancelado' ? 'Cancelado' : 
                       o.status === 'preparando' ? 'Em Preparo' : 
                       o.status === 'pending' || o.status === 'accepted' ? 'Novo' : o.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-slate-400 text-xs">
                    {new Date(o.created_at).toLocaleDateString('pt-BR')} {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {myOrders.length === 0 && (
            <div className="px-8 py-24 text-center">
              <div className="size-20 rounded-full bg-slate-50 dark:bg-slate-800 mx-auto flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-4xl text-slate-200">folder_open</span>
              </div>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum pedido no histórico</p>
            </div>
          )}
        </div>

        {merchantOrdersTotalCount > ORDERS_PER_PAGE && (
          <div className="px-8 py-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between bg-slate-50/30 gap-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Mostrando {((merchantOrdersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(merchantOrdersPage * ORDERS_PER_PAGE, merchantOrdersTotalCount)} de {merchantOrdersTotalCount} pedidos
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={merchantOrdersPage <= 1 || isLoadingList}
                onClick={() => fetchAllOrders(merchantOrdersPage - 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex items-center gap-2 px-2">
                {Array.from({ length: Math.min(3, Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE)) }, (_, i) => {
                  const totalPages = Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE);
                  let pageNum: number;
                  if (totalPages <= 3) pageNum = i + 1;
                  else if (merchantOrdersPage <= 2) pageNum = i + 1;
                  else if (merchantOrdersPage >= totalPages - 1) pageNum = totalPages - 2 + i;
                  else pageNum = merchantOrdersPage - 1 + i;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => fetchAllOrders(pageNum)}
                      className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xs transition-all ${
                        merchantOrdersPage === pageNum 
                          ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20 scale-110' 
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                disabled={merchantOrdersPage >= Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                onClick={() => fetchAllOrders(merchantOrdersPage + 1)}
                className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
