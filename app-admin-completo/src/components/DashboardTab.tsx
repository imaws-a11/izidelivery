import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

export default function DashboardTab() {
  const {
    recentOrders, stats, appSettings, setActiveTab, fetchStats, fetchAllOrders, dashboardData,
    userRole, selectedMerchantPreview
  } = useAdmin();

  const isMerchantPreview = userRole === 'admin' && selectedMerchantPreview;
  const activeMerchant = isMerchantPreview ? selectedMerchantPreview : null;

  React.useEffect(() => {
    fetchStats();
    fetchAllOrders(1);
  }, [fetchStats, fetchAllOrders]);

  // Transformar stats em cards amigáveis
  const mainStats = [
    { label: 'Faturamento Global', val: `R$ ${stats.revenue.toLocaleString('pt-BR')}`, icon: 'payments', info: 'Vendas concluídas', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Entregadores Online', val: stats.onlineDrivers, icon: 'wifi_tethering', info: `${stats.drivers} no total`, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Total de Pedidos', val: stats.orders, icon: 'shopping_cart', info: `${stats.canceledOrders} cancelados`, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Impacto Cancelamentos', val: `R$ ${stats.cancelationImpact.toLocaleString('pt-BR')}`, icon: 'error', info: 'Receita perdida', color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ];

  const businessStats = [
    { label: 'Lojistas Ativos', val: stats.merchants, icon: 'storefront', color: 'text-purple-500' },
    { label: 'Clientes Base', val: stats.users, icon: 'group', color: 'text-indigo-500' },
    { label: 'Cupons Criados', val: stats.totalCoupons, icon: 'confirmation_number', color: 'text-amber-500' },
    { label: 'Investimento Cupons', val: `R$ ${stats.couponInvestment.toLocaleString('pt-BR')}`, icon: 'redeem', color: 'text-orange-500' },
    { label: 'Ofertas Ativas', val: stats.activeOffers, icon: 'local_fire_department', color: 'text-rose-500' },
    { label: 'Bases de Entrega', val: stats.drivers, icon: 'local_shipping', color: 'text-cyan-500' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Header Real-time */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            {activeMerchant ? activeMerchant.store_name : 'Master Console'} <span className="text-primary italic font-black">IZI</span>
          </h1>
          <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
            {activeMerchant ? 'Visão de Desempenho da Unidade' : 'Visão Global de Ecossistema em Tempo Real'}
          </p>
        </div>
        <div className="flex items-center gap-4">
             <div className="flex -space-x-3">
                 {[1,2,3,4].map(i => (
                     <div key={i} className="size-10 rounded-full border-2 border-white dark:border-slate-950 bg-slate-200 dark:bg-slate-800" />
                 ))}
                  <div className="size-10 rounded-full border-2 border-white dark:border-slate-950 bg-primary flex items-center justify-center text-[10px] font-black text-slate-900">
                      +{stats.users > 1000 ? (stats.users / 1000).toFixed(1) + 'k' : stats.users}
                  </div>
             </div>
             <div className="h-10 w-[1px] bg-slate-200 dark:bg-slate-800 mx-2" />
             <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm">download</span>
                 Exportar BI
             </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all border-b-4 border-b-transparent hover:border-b-primary"
          >
            <div className="relative z-10">
              <div className={`size-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <span className={`material-symbols-outlined ${item.color} font-black text-2xl`}>{item.icon}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{item.val}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${item.color.replace('text', 'bg')}`} />
                {item.info}
              </p>
            </div>
            <div className={`absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity`}>
                 <span className="material-symbols-outlined text-6xl font-black">{item.icon}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Impacto de Cancelamento */}
        <div className="lg:col-span-2 bg-slate-900 dark:bg-slate-900 p-10 rounded-[48px] border border-slate-800 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-primary to-emerald-500 opacity-50" />
             <div className="flex items-start justify-between mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-white tracking-tight italic uppercase">Fluxo de Performance Global</h3>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">Análise de saúde transacional em tempo real</p>
                 </div>
                  <div className="bg-white/5 p-4 rounded-3xl border border-white/5 backdrop-blur-xl">
                       <div className="flex items-center gap-6">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Taxa de Sucesso</p>
                                <p className="text-xl font-black text-emerald-400 italic">{dashboardData.deliverySuccessRate.toFixed(1)}%</p>
                            </div>
                            <div className="w-[1px] h-8 bg-white/10" />
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cancelamentos</p>
                                <p className="text-xl font-black text-rose-400 italic">{((stats.canceledOrders / (stats.orders || 1)) * 100).toFixed(1)}%</p>
                            </div>
                       </div>
                  </div>
             </div>

             <div className="h-64 flex items-end gap-3 px-2">
                  {(dashboardData.dailyRevenue || [0,0,0,0,0,0,0]).map((val, i) => {
                      const maxVal = Math.max(...(dashboardData.dailyRevenue || [1]), 1);
                      const h = (val / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col gap-2 group">
                             <div className="w-full relative h-48 flex items-end">
                                  <motion.div 
                                      initial={{ height: 0 }}
                                      animate={{ height: `${Math.max(h, 5)}%` }}
                                      className={`w-full rounded-t-xl transition-all relative ${
                                          h < 30 ? 'bg-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.3)]' : 
                                          h > 70 ? 'bg-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 
                                          'bg-primary shadow-[0_0_20px_rgba(255,217,0,0.3)]'
                                      }`}
                                  >
                                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                       {val > 0 && (
                                         <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-slate-900 text-[10px] font-black px-2 py-1 rounded-lg shadow-xl">
                                             R${val}
                                         </div>
                                       )}
                                  </motion.div>
                             </div>
                        </div>
                      );
                  })}
             </div>
             <div className="mt-8 flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-t border-white/5 pt-6">
                  <span>{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date()).toUpperCase()}</span>
                  <div className="flex gap-8">
                       <span className="flex items-center gap-2"><div className="size-2 bg-emerald-500 rounded-full" /> Performance Ideal</span>
                       <span className="flex items-center gap-2"><div className="size-2 bg-primary rounded-full" /> Na Meta</span>
                       <span className="flex items-center gap-2"><div className="size-2 bg-rose-500 rounded-full" /> Alerta de Risco</span>
                  </div>
             </div>
        </div>

        {/* Wealth of Details Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[48px] p-10 shadow-sm flex flex-col justify-between">
             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] italic mb-10 border-b border-slate-50 dark:border-slate-800 pb-6 text-center">Riqueza de Detalhes</h3>
             <div className="grid grid-cols-2 gap-y-10">
                  {businessStats.map((item, i) => (
                      <div key={i} className="flex flex-col items-center text-center group">
                           <div className={`size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary transition-all`}>
                                <span className={`material-symbols-outlined ${item.color} group-hover:text-slate-900 font-black`}>{item.icon}</span>
                           </div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                           <p className="text-xl font-black text-slate-900 dark:text-white italic">{item.val}</p>
                      </div>
                  ))}
             </div>
             <div className="mt-12 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed text-center">
                       O sistema IZI processa atualmente <span className="text-slate-900 dark:text-white font-black">1.4 pedidos/segundo</span> em horário de pico, com latência de apenas 120ms.
                  </p>
             </div>
        </div>
      </div>

      {/* Tabela de Pedidos Globais */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
                  {activeMerchant ? 'Pedidos da Unidade' : 'Monitor Transacional Global'}
                </h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                  {activeMerchant ? `Histórico de vendas de ${activeMerchant.store_name}` : 'Acompanhamento de todos os pedidos da rede'}
                </p>
              </div>
              <button onClick={() => setActiveTab('orders')} className="px-6 py-3 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  Gerenciar Pedidos
              </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                      <tr>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente / Lojista</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {recentOrders.map((o, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group cursor-pointer">
                              <td className="px-10 py-6 font-display">
                                  <span className="text-sm font-black text-slate-900 dark:text-white block group-hover:text-primary transition-colors">#{o.id.slice(0, 8).toUpperCase()}</span>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global IZI</span>
                              </td>
                              <td className="px-10 py-6">
                                  <div className="flex items-center gap-3">
                                      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                          <span className="material-symbols-outlined text-xs text-slate-400 font-black">person</span>
                                      </div>
                                      <div>
                                          <span className="text-sm font-black text-slate-900 dark:text-slate-100 block">#{o.user_id.slice(0, 6)}</span>
                                          <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter italic">Lojista: #{o.merchant_id?.slice(0, 6) || 'N/A'}</span>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-10 py-6">
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                                      o.status === 'concluido' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                      o.status === 'cancelado' ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' :
                                      o.status === 'pendente' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                      'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                  } text-[10px] font-black uppercase tracking-[0.1em]`}>
                                      <div className={`size-1.5 rounded-full animate-pulse ${
                                          o.status === 'concluido' ? 'bg-emerald-500' :
                                          o.status === 'cancelado' ? 'bg-rose-500' :
                                          o.status === 'pendente' ? 'bg-amber-500' :
                                          'bg-slate-500'
                                      }`} />
                                      {o.status}
                                  </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                  <span className="text-xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                                      R$ {o.total_price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="p-8 border-t border-slate-50 dark:border-slate-800 text-center">
               <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-primary transition-colors">
                   Carregar mais transações globais
               </button>
          </div>
      </div>
    </div>
  );
}
