import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  AlertOctagon, 
  Store, 
  Ticket, 
  Flame, 
  Truck, 
  Download,
  Activity,
  ArrowRight
} from 'lucide-react';

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

  const glassCard = "bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden relative";

  const mainStats = [
    { label: 'Faturamento Global', val: `R$ ${stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, info: 'Vendas concluídas', color: 'text-emerald-500', glow: 'shadow-emerald-500/20' },
    { label: 'Entregadores Online', val: stats.onlineDrivers, icon: Activity, info: `${stats.drivers} no total`, color: 'text-primary', glow: 'shadow-primary/20' },
    { label: 'Total de Pedidos', val: stats.orders, icon: ShoppingCart, info: `${stats.canceledOrders} cancelados`, color: 'text-blue-500', glow: 'shadow-blue-500/20' },
    { label: 'Impacto Cancelamentos', val: `R$ ${stats.cancelationImpact.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: AlertOctagon, info: 'Receita perdida', color: 'text-rose-500', glow: 'shadow-rose-500/20' },
  ];

  const businessStats = [
    { label: 'Lojistas Ativos', val: stats.merchants, icon: Store, color: 'text-purple-500' },
    { label: 'Clientes Base', val: stats.users, icon: Users, color: 'text-indigo-500' },
    { label: 'Cupons Criados', val: stats.totalCoupons, icon: Ticket, color: 'text-amber-500' },
    { label: 'Investimento Cupons', val: `R$ ${stats.couponInvestment.toLocaleString('pt-BR')}`, icon: Ticket, color: 'text-orange-500' },
    { label: 'Ofertas Ativas', val: stats.activeOffers, icon: Flame, color: 'text-rose-500' },
    { label: 'Bases de Entrega', val: stats.drivers, icon: Truck, color: 'text-cyan-500' },
  ];

  return (    <div className="space-y-12 pb-24 font-display px-2 animate-in fade-in duration-500">
      {/* Header Glassmorphic */}
      <div className={`${glassCard} p-12 flex flex-col md:flex-row md:items-center justify-between gap-10`}>
        <div className="absolute -top-32 -right-32 size-80 bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-primary text-2xl font-black">dashboard_customize</span>
             </div>
             <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
               {activeMerchant ? activeMerchant.store_name : 'Master Console'} <span className="text-primary">IZI</span>
             </h1>
          </div>
          <p className="text-slate-900 dark:text-slate-900 font-black text-[10px] uppercase tracking-[0.4em] opacity-60 ml-1">
            {activeMerchant ? 'Unidade Operacional Ativa' : 'Ecossistema Global em Tempo Real'}
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-8">
          <div className="flex -space-x-4 drop-shadow-xl">
              {[1,2,3,4].map(i => (
                  <div key={i} className="size-14 rounded-full border-4 border-white dark:border-slate-800 bg-slate-200 dark:bg-slate-700 shadow-xl" />
              ))}
              <div className="size-14 rounded-full border-4 border-white dark:border-slate-800 bg-slate-900 text-white flex items-center justify-center text-[10px] font-black shadow-2xl">
                  +{stats.users > 1000 ? (stats.users / 1000).toFixed(1) + 'k' : stats.users}
              </div>
          </div>
          <div className="h-14 w-[1px] bg-slate-900/10 dark:bg-white/10 mx-2" />
          <button className="bg-slate-900 text-white px-10 py-5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              <Download size={18} />
              Relatório BI
          </button>
        </div>
      </div>

      {/* Primary KPI Grid - Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {mainStats.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${glassCard} p-10 group hover:-translate-y-2 transition-all duration-500 cursor-default border border-white/80 dark:border-white/5 shadow-2xl`}
          >
            <div className="relative z-10">
              <div className={`size-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-xl ${item.glow} border border-white/50 dark:border-white/5`}>
                <item.icon size={32} className={item.color} strokeWidth={3} />
              </div>
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 opacity-40">{item.label}</p>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{item.val}</h2>
              <div className="mt-8 pt-6 border-t border-slate-900/5 dark:border-white/5 flex items-center gap-3">
                <span className={`size-2.5 rounded-full ${item.color.replace('text', 'bg')} shadow-lg ${item.glow} animate-pulse`} />
                <p className="text-[9px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-widest opacity-60">
                  {item.info}
                </p>
              </div>
            </div>
            <div className="absolute -top-6 -right-6 p-10 opacity-[0.03] dark:opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-700 pointer-events-none">
                 <item.icon size={160} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ecosystem Financial Overview - Glass */}
      {userRole === 'admin' && dashboardData.ecosystem && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className={`${glassCard} border border-white/80 dark:border-white/5`}>
              <div className="px-12 py-12 border-b border-slate-900/5 dark:border-white/5 bg-white/40 dark:bg-black/20">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Fluxo Financeiro Global</h3>
                       <p className="text-[10px] font-black text-slate-900 dark:text-slate-400 mt-2 uppercase tracking-[0.3em] opacity-60">Distribuição e Split de Receita em Tempo Real</p>
                    </div>
                    <div className="flex items-center gap-4 px-8 py-5 bg-emerald-500 text-white rounded-full shadow-2xl shadow-emerald-500/20">
                       <Activity size={22} className="animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-[0.2em]">Saúde da Rede: Excelente</span>
                    </div>
                 </div>
              </div>

              <div className="p-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                 {[
                   { label: 'Repasse Lojistas', val: dashboardData.ecosystem.merchantPayout, icon: Store, color: 'text-purple-600' },
                   { label: 'Ganhos Pilotos', val: dashboardData.ecosystem.driverPayout, icon: Truck, color: 'text-blue-600' },
                   { label: 'Receita Bruta', val: dashboardData.ecosystem.platformRevenue, icon: TrendingUp, color: 'text-amber-500' },
                   { label: 'Lucro Líquido IZI', val: dashboardData.ecosystem.netPlatformProfit, icon: Activity, color: 'text-emerald-600' },
                 ].map((card, i) => (
                   <div key={i} className="flex flex-col group transition-all">
                      <div className="size-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-xl border border-white/50 dark:border-white/5 shadow-inner">
                         <card.icon size={28} className={card.color} strokeWidth={3} />
                      </div>
                      <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-3 opacity-40">{card.label}</p>
                      <h4 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                        R$ {card.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h4>
                   </div>
                 ))}
              </div>

              <div className="px-12 pb-12">
                 <div className="h-6 bg-slate-100 dark:bg-slate-950 rounded-full flex overflow-hidden shadow-inner border border-slate-900/5 dark:border-white/5 p-1">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dashboardData.ecosystem.merchantPayout / (dashboardData.totalRevenue || 1)) * 100}%` }}
                      className="h-full bg-purple-500 rounded-full shadow-lg" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dashboardData.ecosystem.driverPayout / (dashboardData.totalRevenue || 1)) * 100}%` }}
                      className="h-full bg-blue-500 rounded-full shadow-lg -ml-1" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dashboardData.ecosystem.platformRevenue / (dashboardData.totalRevenue || 1)) * 100}%` }}
                      className="h-full bg-primary rounded-full shadow-lg -ml-1" 
                    />
                 </div>
                 <div className="mt-8 flex flex-wrap justify-center gap-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-slate-400">
                    <div className="flex items-center gap-3"><div className="size-4 bg-purple-500 rounded-lg shadow-xl" /> Lojistas ({((dashboardData.ecosystem.merchantPayout / (dashboardData.totalRevenue || 1)) * 100).toFixed(1)}%)</div>
                    <div className="flex items-center gap-3"><div className="size-4 bg-blue-500 rounded-lg shadow-xl" /> Entregadores ({((dashboardData.ecosystem.driverPayout / (dashboardData.totalRevenue || 1)) * 100).toFixed(1)}%)</div>
                    <div className="flex items-center gap-3"><div className="size-4 bg-primary rounded-lg shadow-xl" /> Plataforma ({((dashboardData.ecosystem.platformRevenue / (dashboardData.totalRevenue || 1)) * 100).toFixed(1)}%)</div>
                 </div>
              </div>
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Gráfico de Impacto de Cancelamento - Glass */}
        <div className={`lg:col-span-2 ${glassCard} p-12 border border-white/80 dark:border-white/5`}>
             <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-rose-500 via-primary to-emerald-500 opacity-100" />
             
             <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 mb-16">
                 <div>
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Performance Semanal</h3>
                    <p className="text-[10px] font-black text-slate-900 dark:text-slate-400 mt-3 uppercase tracking-[0.3em] opacity-60">Volume de transações nos últimos 7 dias</p>
                 </div>
                 <div className="bg-white/60 dark:bg-white/5 p-6 rounded-[32px] border border-white/80 dark:border-white/5 shadow-inner backdrop-blur-xl">
                      <div className="flex items-center gap-10">
                           <div className="text-center">
                               <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2 opacity-40">Taxa Sucesso</p>
                               <p className="text-3xl font-black text-emerald-600">{dashboardData.deliverySuccessRate.toFixed(1)}%</p>
                           </div>
                           <div className="w-[1px] h-12 bg-slate-900/10 dark:bg-white/10" />
                           <div className="text-center">
                               <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2 opacity-40">Cancelados</p>
                               <p className="text-3xl font-black text-rose-600">{((stats.canceledOrders / (stats.orders || 1)) * 100).toFixed(1)}%</p>
                           </div>
                      </div>
                 </div>
             </div>

             <div className="h-72 flex items-end gap-5 px-4">
                  {(dashboardData.dailyRevenue || [0,0,0,0,0,0,0]).map((val, i) => {
                      const maxVal = Math.max(...(dashboardData.dailyRevenue || [1]), 1);
                      const h = (val / maxVal) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col gap-3 group h-full">
                             <div className="flex-1 relative flex items-end">
                                  <motion.div 
                                      initial={{ height: 0 }}
                                      animate={{ height: `${Math.max(h, 8)}%` }}
                                      className={`w-full rounded-2xl transition-all relative overflow-hidden backdrop-blur-sm border-t border-white/50 shadow-2xl ${
                                          h < 30 ? 'bg-rose-500' : 
                                          h > 70 ? 'bg-emerald-500' : 
                                          'bg-primary'
                                      }`}
                                  >
                                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                       <div className="absolute -top-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all bg-slate-900 text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl pointer-events-none z-20 whitespace-nowrap">
                                           R$ {val.toLocaleString('pt-BR')}
                                       </div>
                                  </motion.div>
                             </div>
                             <p className="text-[9px] font-black text-slate-900 dark:text-slate-400 text-center opacity-40 uppercase tracking-widest">D-{6-i}</p>
                        </div>
                      );
                  })}
             </div>
             <div className="mt-12 flex justify-between items-center text-[9px] font-black text-slate-900 dark:text-slate-500 uppercase tracking-widest border-t border-slate-900/5 dark:border-white/5 pt-10">
                  <span className="opacity-40 tracking-[0.2em]">Sincronizado com API BI V2</span>
                  <div className="flex gap-8">
                       <span className="flex items-center gap-3"><div className="size-3 bg-emerald-500 rounded shadow-lg" /> Saúde OK</span>
                       <span className="flex items-center gap-3"><div className="size-3 bg-primary rounded shadow-lg" /> Meta IZI</span>
                       <span className="flex items-center gap-3"><div className="size-3 bg-rose-500 rounded shadow-lg" /> Anomalia</span>
                  </div>
             </div>
        </div>

        {/* Wealth of Details Grid - Glass */}
        <div className={`${glassCard} p-12 flex flex-col justify-between border border-white/80 dark:border-white/5 shadow-2xl`}>
             <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.4em] mb-12 border-b border-slate-900/5 dark:border-white/5 pb-8 text-center opacity-60">Status Operacional</h3>
             <div className="grid grid-cols-2 gap-y-12 gap-x-8">
                  {businessStats.map((item, i) => (
                      <div key={i} className="flex flex-col items-center text-center group cursor-default">
                           <div className={`size-16 rounded-[24px] bg-white dark:bg-slate-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-all duration-500 border border-white/80 dark:border-white/10 shadow-lg shadow-black/5`}>
                                <item.icon size={26} className={item.color} strokeWidth={3} />
                           </div>
                           <p className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-2 opacity-40">{item.label}</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{item.val}</p>
                      </div>
                  ))}
             </div>
             <div className="mt-12 bg-slate-900 text-white p-8 rounded-[32px] shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 size-24 bg-primary/20 blur-2xl rounded-full" />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] leading-loose text-center relative z-10">
                       Tráfego Core: <span className="text-primary">High 1.4 req/s</span><br/>Latência API: <span className="text-primary">120ms stable</span>
                  </p>
             </div>
        </div>
      </div>

      {/* Tabela de Pedidos Globais - Glass */}
      <div className={`${glassCard} border border-white/80 dark:border-white/5 shadow-2xl overflow-visible`}>
          <div className="px-12 py-10 border-b border-slate-900/5 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-8 bg-white/40 dark:bg-black/20">
              <div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">
                  {activeMerchant ? 'Logs da Unidade' : 'Monitor em Tempo Real'}
                </h3>
                <p className="text-[10px] font-black text-slate-900 dark:text-slate-400 mt-3 uppercase tracking-[0.3em] opacity-60">
                  {activeMerchant ? `Transações registradas em ${activeMerchant.store_name}` : 'Fluxo contínuo de transações no ecossistema'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('orders')} 
                className="px-10 py-5 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-black active:scale-95 transition-all flex items-center gap-3"
              >
                  Central de Pedidos <ArrowRight size={18} />
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                      <tr className="bg-slate-100/30 dark:bg-white/5 border-b border-slate-900/5 dark:border-white/5">
                          <th className="px-12 py-8 text-left text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-40">Pedido</th>
                          <th className="px-12 py-8 text-left text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-40">Relacionamento</th>
                          <th className="px-12 py-8 text-left text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-40">Status</th>
                          <th className="px-12 py-8 text-right text-[9px] font-black text-slate-900 uppercase tracking-widest opacity-40">Valores</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/5 dark:divide-white/5">
                      {recentOrders.map((o, i) => (
                          <tr key={i} className="hover:bg-white/60 dark:hover:bg-white/5 transition-all group cursor-pointer">
                              <td className="px-12 py-8">
                                  <span className="text-base font-black text-slate-900 dark:text-white block group-hover:text-primary transition-all tracking-tighter uppercase">
                                    #{o.tracking_code || o.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-900/40 dark:text-slate-500 uppercase tracking-widest mt-1.5 block">
                                    {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                              </td>
                              <td className="px-12 py-8">
                                  <div className="flex items-center gap-5">
                                      <div className="size-14 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-900/5 dark:border-white/10 shadow-lg shrink-0">
                                          <Users size={22} className="text-slate-900/30 dark:text-slate-400" />
                                      </div>
                                      <div className="min-w-0">
                                          <span className="text-base font-black text-slate-900 dark:text-white block truncate tracking-tight">
                                            {o.customer_name || o.user?.name || o.user_name || 'Usuário Final'}
                                          </span>
                                          <span className="text-[9px] font-black text-slate-900/40 dark:text-zinc-500 uppercase block tracking-widest mt-1.5 truncate">
                                            Partner: {o.merchant_name || 'Global'}
                                          </span>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-12 py-8">
                                  <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-full border shadow-sm ${
                                      ['concluido', 'delivered', 'entregue'].includes(o.status) ? 'bg-emerald-500 text-white border-emerald-600' :
                                      ['cancelado', 'cancelled'].includes(o.status) ? 'bg-rose-500 text-white border-rose-600' :
                                      ['pendente', 'waiting_driver'].includes(o.status) ? 'bg-amber-500 text-white border-amber-600' :
                                      'bg-blue-500 text-white border-blue-600'
                                  } text-[9px] font-black uppercase tracking-widest`}>
                                      <div className={`size-2 bg-white rounded-full ${
                                          ['pendente', 'waiting_driver'].includes(o.status) ? 'animate-pulse' : ''
                                      }`} />
                                      {o.status.replace('_', ' ')}
                                  </div>
                              </td>
                              <td className="px-12 py-8 text-right">
                                  <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter block leading-none">
                                      R$ {(o.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[9px] font-black text-slate-900/40 dark:text-zinc-500 uppercase tracking-widest mt-2 block">
                                      Met: {o.payment_method?.replace('_', ' ') || 'Processando'}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="p-10 bg-slate-900/5 dark:bg-black/20 border-t border-slate-900/5 dark:border-white/5 text-center">
               <button 
                 onClick={() => fetchAllOrders(2)}
                 className="text-[10px] font-black text-slate-900 dark:text-slate-400 uppercase tracking-[0.4em] hover:text-primary transition-all flex items-center justify-center gap-3 mx-auto"
               >
                   <Activity size={18} /> Sincronizar Histórico Arcaico
               </button>
          </div>
      </div>
    </div>
  );
}
