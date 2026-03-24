import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Pedidos do Lojista
export default function OrdersMerchantTab() {
  const {
    allOrders, merchantOrdersPage, setMerchantOrdersPage, merchantOrdersTotalCount, editingItem, setEditingItem, editType, setEditType, isSaving, isCompletingOrder, handleCompleteOrder, handleDeleteOrder, fetchAllOrders, userRole
  } = useAdmin();

  return (
  <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
    <div>
      <div className="flex items-center gap-3 mb-2">
        <span className="material-symbols-outlined text-3xl text-primary">shopping_cart</span>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Meus Pedidos</h1>
      </div>
      <p className="text-slate-500 dark:text-slate-400">Gerencie pedidos do seu estabelecimento em tempo real.</p>
    </div>
    <span className="inline-flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-orange-600">
      <span className="size-2 rounded-full bg-orange-500 animate-pulse"></span>
      {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'novo' || o.status === 'pending' || o.status === 'aceito')).length} pendentes
    </span>
  </div>

  {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'novo' || o.status === 'pending' || o.status === 'aceito')).length > 0 && (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
        <span className="material-symbols-outlined text-lg">notifications_active</span>
        Aguardando sua ação
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'novo' || o.status === 'pending' || o.status === 'aceito')).map((o: any) => (
          <motion.div key={o.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-500/5 dark:to-amber-500/5 p-6 rounded-[32px] border-2 border-orange-200 dark:border-orange-500/30 shadow-lg shadow-orange-500/5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-[10px] font-bold text-slate-500 mt-1">{new Date(o.created_at).toLocaleString('pt-BR')}</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-orange-500 text-white text-[9px] font-black uppercase tracking-widest animate-pulse">NOVO PEDIDO</span>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-sm text-red-500">pin_drop</span>
                <span className="font-bold truncate">{o.delivery_address}</span>
              </div>
              {o.payment_method && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm text-blue-500">credit_card</span>
                  <span className="font-bold capitalize">{o.payment_method}</span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-2xl font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</span>
            </div>
            <div className="flex gap-3">
              <button onClick={async () => { try { await supabase.from('orders_delivery').update({ status: 'cancelado' }).eq('id', o.id); fetchAllOrders(); } catch(err) { console.error(err); } }} className="flex-1 py-3 rounded-2xl bg-red-100 dark:bg-red-500/10 text-red-600 font-black text-[10px] uppercase tracking-widest hover:bg-red-200 transition-all border border-red-200 dark:border-red-500/20">
                <span className="flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">close</span>Recusar</span>
              </button>
              <button onClick={async () => { try { await supabase.from('orders_delivery').update({ status: 'preparando' }).eq('id', o.id); fetchAllOrders(); } catch(err) { console.error(err); } }} className="flex-[2] py-3 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                <span className="flex items-center justify-center gap-1.5"><span className="material-symbols-outlined text-sm">check</span>Aceitar Pedido</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )}

  {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'preparando' || o.status === 'pendente' || o.status === 'picked_up' || o.status === 'em_rota' || o.status === 'a_caminho')).length > 0 && (
    <div className="space-y-4">
      <h3 className="text-sm font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><span className="material-symbols-outlined text-lg">local_shipping</span>Em andamento</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allOrders.filter((o: any) => o.merchant_id === merchantProfile?.merchant_id && (o.status === 'preparando' || o.status === 'pendente' || o.status === 'picked_up' || o.status === 'em_rota' || o.status === 'a_caminho')).map((o: any) => (
          <div key={o.id} className="bg-white dark:bg-slate-900 p-5 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-black text-slate-900 dark:text-white">#DT-{o.id.slice(0, 8).toUpperCase()}</p>
              <span className="px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase tracking-widest">{o.status === 'preparando' ? 'Preparando' : o.status === 'pendente' ? 'Buscando Motoboy' : o.status === 'a_caminho' ? 'Motoboy a caminho' : o.status === 'em_rota' ? 'Em Entrega' : o.status}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 truncate mb-3">{o.delivery_address}</p>
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</span>
              {o.status === 'preparando' && (
                <button onClick={async () => { try { await supabase.from('orders_delivery').update({ status: 'pendente' }).eq('id', o.id); fetchAllOrders(); } catch(err) { console.error(err); } }} className="px-4 py-1.5 rounded-xl bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Chamar Motoboy</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )}

  <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
      <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3"><span className="material-symbols-outlined text-slate-400">history</span>Histórico Completo</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50">
          <tr>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Pedido</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Destino</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
            <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {allOrders.map((o: any) => (
            <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
              <td className="px-8 py-5 font-bold text-slate-400 text-sm">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
              <td className="px-8 py-5 font-black text-slate-900 dark:text-white truncate max-w-[250px]">{o.delivery_address}</td>
              <td className="px-8 py-5 font-black text-primary">R$ {o.total_price?.toFixed(2).replace('.', ',')}</td>
              <td className="px-8 py-5">
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${o.status === 'concluido' ? 'bg-green-100 text-green-600 border border-green-200' : o.status === 'cancelado' ? 'bg-red-100 text-red-600 border border-red-200' : o.status === 'preparando' ? 'bg-blue-100 text-blue-600 border border-blue-200' : 'bg-primary/20 text-slate-800 dark:text-primary border border-primary/30'}`}>
                  {o.status === 'pending' ? 'Novo' : o.status === 'preparando' ? 'Preparando' : o.status === 'picked_up' ? 'Coletado' : o.status === 'em_rota' ? 'Em Rota' : o.status}
                </span>
              </td>
              <td className="px-8 py-5 font-bold text-slate-500 text-xs">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {allOrders.length === 0 && (
        <div className="px-8 py-16 text-center"><span className="material-symbols-outlined text-5xl text-slate-300 mb-4">inbox</span><p className="text-sm font-black text-slate-400">Nenhum pedido encontrado</p></div>
      )}
    </div>
    {/* Paginação lojista */}
    {merchantOrdersTotalCount > ORDERS_PER_PAGE && (
      <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Exibindo {((merchantOrdersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(merchantOrdersPage * ORDERS_PER_PAGE, merchantOrdersTotalCount)} de {merchantOrdersTotalCount} pedidos
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={merchantOrdersPage <= 1 || isLoadingList}
            onClick={() => fetchAllOrders(merchantOrdersPage - 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          {Array.from({ length: Math.min(5, Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE)) }, (_, i) => {
            const totalPages = Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE);
            let pageNum: number;
            if (totalPages <= 5) pageNum = i + 1;
            else if (merchantOrdersPage <= 3) pageNum = i + 1;
            else if (merchantOrdersPage >= totalPages - 2) pageNum = totalPages - 4 + i;
            else pageNum = merchantOrdersPage - 2 + i;
            return (
              <button
                key={pageNum}
                onClick={() => fetchAllOrders(pageNum)}
                className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${merchantOrdersPage === pageNum ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/30'}`}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            disabled={merchantOrdersPage >= Math.ceil(merchantOrdersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
            onClick={() => fetchAllOrders(merchantOrdersPage + 1)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    )}
  </div>
</div>
            )}

{/* â â â â â â â ADMIN ORDERS â â â â â â â */}
            {activeTab === 'orders' && userRole !== 'merchant' && (

  );
}
