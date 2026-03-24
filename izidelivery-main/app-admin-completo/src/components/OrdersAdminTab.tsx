import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Pedidos Admin
export default function OrdersAdminTab() {
  const {
    allOrders, ordersPage, setOrdersPage, ordersTotalCount, isCompletingOrder, handleCompleteOrder, handleDeleteOrder, fetchAllOrders
  } = useAdmin();

  return (
  {isLoadingList && (
    <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
    </div>
  )}
  <div className="overflow-x-auto">
    <table className="w-full text-left">
      <thead className="bg-slate-50 dark:bg-slate-800/50">
        <tr>
          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">ID Pedido</th>
          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Destino da Entrega</th>
          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Valor Total</th>
          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Data e Hora</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
        {allOrders.map((o) => (
          <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
            <td className="px-8 py-6 font-bold text-slate-400 text-sm">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
            <td className="px-8 py-6 font-black text-slate-900 dark:text-white truncate max-w-[300px]">{o.delivery_address}</td>
            <td className="px-8 py-6 font-black text-primary">R$ {o.total_price.toFixed(2).replace('.', ',')}</td>
            <td className="px-8 py-6">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${o.status === 'concluido' ? 'bg-green-100 text-green-600 border border-green-200' :
                o.status === 'cancelado' ? 'bg-red-100 text-red-600 border border-red-200' :
                  'bg-primary/20 text-slate-800 dark:text-primary border border-primary/30'
                }`}>
                {o.status === 'pending' ? 'Buscando Motoboy' : o.status === 'picked_up' ? 'Em Entrega' : o.status}
              </span>
            </td>
            <td className="px-8 py-6 font-bold text-slate-500 text-xs">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
          </tr>
        ))}
      </tbody>
    </table>

    {/* Paginação real */}
    <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        Exibindo {((ordersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(ordersPage * ORDERS_PER_PAGE, ordersTotalCount)} de {ordersTotalCount} pedidos
      </p>
      <div className="flex items-center gap-2">
        <button
          disabled={ordersPage <= 1 || isLoadingList}
          onClick={() => fetchAllOrders(ordersPage - 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        {Array.from({ length: Math.min(5, Math.ceil(ordersTotalCount / ORDERS_PER_PAGE)) }, (_, i) => {
          const totalPages = Math.ceil(ordersTotalCount / ORDERS_PER_PAGE);
          let pageNum: number;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (ordersPage <= 3) {
            pageNum = i + 1;
          } else if (ordersPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = ordersPage - 2 + i;
          }
          return (
            <button
              key={pageNum}
              onClick={() => fetchAllOrders(pageNum)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs transition-all ${ordersPage === pageNum ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary hover:border-primary/30'}`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          disabled={ordersPage >= Math.ceil(ordersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
          onClick={() => fetchAllOrders(ordersPage + 1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
</div>
            )}


  );
}
