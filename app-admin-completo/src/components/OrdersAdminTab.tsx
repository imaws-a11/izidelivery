import React from 'react';
import { useAdmin } from '../context/AdminContext';

export default function OrdersAdminTab() {
  const {
    allOrders, 
    ordersPage, 
    setOrdersPage, 
    ordersTotalCount, 
    fetchAllOrders,
    isLoadingList
  } = useAdmin();

  React.useEffect(() => {
    fetchAllOrders(ordersPage);
  }, [fetchAllOrders]);

  const ORDERS_PER_PAGE = 50;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {isLoadingList && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        </div>
      )}
      
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
        <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary">analytics</span>
          Monitoramento Global de Pedidos
        </h3>
        <button 
          onClick={() => fetchAllOrders(ordersPage)}
          className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm"
        >
          <span className="material-symbols-outlined">refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/80 dark:bg-slate-800/80">
            <tr>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">ID Pedido</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tipo</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Destino</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Valor Total</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
              <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Data/Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {allOrders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-5 font-bold text-slate-400 text-xs">#DT-{o.id.slice(0, 8).toUpperCase()}</td>
                <td className="px-8 py-5">
                   <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500">
                     {o.service_type || 'Geral'}
                   </span>
                </td>
                <td className="px-8 py-5 font-bold text-slate-600 dark:text-slate-300 truncate max-w-[250px] text-sm">{o.delivery_address}</td>
                <td className="px-8 py-5 font-black text-primary">R$ {Number(o.total_price || 0).toFixed(2).replace('.', ',')}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    o.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    o.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-100' :
                    o.status === 'pendente_pagamento' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                    'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                  }`}>
                    {o.status === 'waiting_driver' ? 'Aguardando Motorista' : 
                     o.status === 'waiting_merchant' ? 'Esperando Lojista' :
                     o.status === 'pendente_pagamento' ? 'Aguardando PIX' :
                     o.status === 'preparando' ? 'Em Preparo' :
                     o.status === 'a_caminho' ? 'Em Rota' : o.status}
                  </span>
                </td>
                <td className="px-8 py-5 font-medium text-slate-400 text-[11px]">{new Date(o.created_at).toLocaleString('pt-BR')}</td>
              </tr>
            ))}
            {allOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-8 py-16 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-200 mb-2">inventory_2</span>
                  <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum pedido processado</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {ordersTotalCount > ORDERS_PER_PAGE && (
          <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Exibindo {((ordersPage - 1) * ORDERS_PER_PAGE) + 1}–{Math.min(ordersPage * ORDERS_PER_PAGE, ordersTotalCount)} de {ordersTotalCount} pedidos
            </p>
            <div className="flex items-center gap-2">
              <button
                disabled={ordersPage <= 1 || isLoadingList}
                onClick={() => fetchAllOrders(ordersPage - 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 transition-all disabled:opacity-30"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-[11px] font-black text-slate-500">
                Pág. {ordersPage}
              </div>
              <button
                disabled={ordersPage >= Math.ceil(ordersTotalCount / ORDERS_PER_PAGE) || isLoadingList}
                onClick={() => fetchAllOrders(ordersPage + 1)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 transition-all disabled:opacity-30"
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
