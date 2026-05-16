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

  return (
    <div className="space-y-10 pb-24 font-display px-2">
      {/* Header Glassmorphic */}
      <div className={`${glassCard} p-10 flex flex-col md:flex-row md:items-center justify-between gap-8`}>
        <div className="absolute -top-32 -right-32 size-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 size-64 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none drop-shadow-md">
            {activeMerchant ? activeMerchant.store_name : 'Master Console'} <span className="text-primary italic">IZI</span>
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 font-bold text-sm mt-3 uppercase tracking-[0.2em]">
            {activeMerchant ? 'Visão de Desempenho da Unidade' : 'Visão Global de Ecossistema em Tempo Real'}
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex -space-x-3 drop-shadow-lg">
              {[1,2,3,4].map(i => (
                  <div key={i} className="size-12 rounded-full border-2 border-white dark:border-zinc-900 bg-slate-200 dark:bg-zinc-800 opacity-80" />
              ))}
              <div className="size-12 rounded-full border-2 border-white dark:border-zinc-900 bg-primary flex items-center justify-center text-[11px] font-black text-slate-900 shadow-xl">
                  +{stats.users > 1000 ? (stats.users / 1000).toFixed(1) + 'k' : stats.users}
              </div>
          </div>
          <div className="h-12 w-[2px] bg-slate-300 dark:bg-zinc-800/50 mx-2" />
          <button className="bg-slate-900/90 dark:bg-white/90 backdrop-blur-md hover:bg-slate-900 dark:hover:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
              <Download size={16} />
              Exportar BI
          </button>
        </div>
      </div>

      {/* Primary KPI Grid - Glass Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${glassCard} p-8 group hover:-translate-y-2 transition-all duration-300 border-t-2 border-t-transparent hover:border-t-primary cursor-default`}
          >
            <div className="relative z-10">
              <div className={`size-14 bg-white/50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${item.glow} backdrop-blur-md`}>
                <item.icon size={28} className={item.color} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-2 drop-shadow-sm">{item.label}</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-md">{item.val}</h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mt-4 flex items-center gap-2 uppercase tracking-widest">
                <span className={`size-2 rounded-full ${item.color.replace('text', 'bg')} shadow-lg ${item.glow}`} />
                {item.info}
              </p>
            </div>
            <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] dark:opacity-5 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                 <item.icon size={120} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ecosystem Financial Overview - Glass */}
      {userRole === 'admin' && dashboardData.ecosystem && (
        <section className="animate-in fade-in slide-in-from-bottom-8 duration-700">
           <div className={`${glassCard} overflow-hidden`}>
              <div className="px-10 py-10 border-b border-slate-300/50 dark:border-white/5 bg-white/20 dark:bg-black/20">
                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase drop-shadow-md">Fluxo Financeiro Global</h3>
                       <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em]">Distribuição e Split de Receita em Tempo Real</p>
                    </div>
                    <div className="flex items-center gap-3 px-6 py-4 bg-emerald-500/20 backdrop-blur-md text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                       <Activity size={20} className="animate-pulse" />
                       <span className="text-[10px] font-black uppercase tracking-widest">Saúde Financeira: Excelente</span>
                    </div>
                 </div>
              </div>

              <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                 {[
                   { label: 'Repasse Lojistas', val: dashboardData.ecosystem.merchantPayout, icon: Store, color: 'text-purple-600 dark:text-purple-400' },
                   { label: 'Ganhos Pilotos', val: dashboardData.ecosystem.driverPayout, icon: Truck, color: 'text-blue-600 dark:text-blue-400' },
                   { label: 'Receita Bruta', val: dashboardData.ecosystem.platformRevenue, icon: TrendingUp, color: 'text-primary' },
                   { label: 'Lucro Líquido IZI', val: dashboardData.ecosystem.netPlatformProfit, icon: Activity, color: 'text-emerald-600 dark:text-emerald-400' },
                 ].map((card, i) => (
                   <div key={i} className="flex flex-col group hover:-translate-y-1 transition-transform">
                      <div className="size-14 bg-white/60 dark:bg-white/5 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-white/20 dark:border-white/5 backdrop-blur-md">
                         <card.icon size={24} className={card.color} strokeWidth={2.5} />
                      </div>
                      <p className="text-[10px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-2">{card.label}</p>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm">
                        R$ {card.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </h4>
                   </div>
                 ))}
              </div>

              <div className="px-10 pb-10">
                 <div className="h-4 bg-slate-200/50 dark:bg-zinc-900/50 rounded-full flex overflow-hidden shadow-inner border border-slate-300/50 dark:border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dashboardData.ecosystem.merchantPayout / (dashboardData.totalRevenue || 1)) * 100}%` }}
                      className="h-full bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dashboardData.ecosystem.driverPayout / (dashboardData.totalRevenue || 1)) * 100}%` }}
                      className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    />
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dashboardData.ecosystem.platformRevenue / (dashboardData.totalRevenue || 1)) * 100}%` }}
                      className="h-full bg-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]" 
                    />
                 </div>
                 <div className="mt-6 flex flex-wrap justify-between gap-6 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 dark:text-zinc-400">
                    <div className="flex items-center gap-3"><div className="size-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]" /> Lojistas ({((dashboardData.ecosystem.merchantPayout / (dashboardData.totalRevenue || 1)) * 100).toFixed(1)}%)</div>
                    <div className="flex items-center gap-3"><div className="size-3 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" /> Entregadores ({((dashboardData.ecosystem.driverPayout / (dashboardData.totalRevenue || 1)) * 100).toFixed(1)}%)</div>
                    <div className="flex items-center gap-3"><div className="size-3 bg-primary rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)]" /> Plataforma IZI ({((dashboardData.ecosystem.platformRevenue / (dashboardData.totalRevenue || 1)) * 100).toFixed(1)}%)</div>
                 </div>
              </div>
           </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Impacto de Cancelamento - Glass */}
        <div className={`lg:col-span-2 ${glassCard} p-10`}>
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 via-primary to-emerald-500 opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
             
             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
                 <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase drop-shadow-md">Performance Diária</h3>
                    <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em]">Volume de transações nos últimos 7 dias</p>
                 </div>
                 <div className="bg-white/60 dark:bg-white/5 p-5 rounded-3xl border border-white/20 dark:border-white/5 backdrop-blur-xl shadow-sm">
                      <div className="flex items-center gap-8">
                           <div>
                               <p className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-2">Sucesso</p>
                               <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{dashboardData.deliverySuccessRate.toFixed(1)}%</p>
                           </div>
                           <div className="w-[1px] h-10 bg-slate-300 dark:bg-white/10" />
                           <div>
                               <p className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em] mb-2">Cancelados</p>
                               <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{((stats.canceledOrders / (stats.orders || 1)) * 100).toFixed(1)}%</p>
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
                                      className={`w-full rounded-t-xl transition-all relative overflow-hidden backdrop-blur-sm border-t border-white/30 ${
                                          h < 30 ? 'bg-gradient-to-t from-rose-500/20 to-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 
                                          h > 70 ? 'bg-gradient-to-t from-emerald-500/20 to-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 
                                          'bg-gradient-to-t from-primary/20 to-primary shadow-[0_0_20px_rgba(250,204,21,0.2)]'
                                      }`}
                                  >
                                       {val > 0 && (
                                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-3 py-1.5 rounded-xl shadow-xl pointer-events-none z-20">
                                             R${val}
                                         </div>
                                       )}
                                  </motion.div>
                             </div>
                        </div>
                      );
                  })}
             </div>
             <div className="mt-8 flex justify-between text-[9px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-[0.2em] border-t border-slate-300/50 dark:border-white/5 pt-6">
                  <span>Últimos 7 dias</span>
                  <div className="flex gap-6">
                       <span className="flex items-center gap-2"><div className="size-2 bg-emerald-400 rounded-full shadow-[0_0_5px_rgba(52,211,153,0.8)]" /> Ideal</span>
                       <span className="flex items-center gap-2"><div className="size-2 bg-primary rounded-full shadow-[0_0_5px_rgba(250,204,21,0.8)]" /> Meta</span>
                       <span className="flex items-center gap-2"><div className="size-2 bg-rose-400 rounded-full shadow-[0_0_5px_rgba(251,113,133,0.8)]" /> Risco</span>
                  </div>
             </div>
        </div>

        {/* Wealth of Details Grid - Glass */}
        <div className={`${glassCard} p-10 flex flex-col justify-between`}>
             <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-8 border-b border-slate-300/50 dark:border-white/5 pb-6 text-center drop-shadow-md">Resumo Operacional</h3>
             <div className="grid grid-cols-2 gap-y-10 gap-x-4">
                  {businessStats.map((item, i) => (
                      <div key={i} className="flex flex-col items-center text-center group">
                           <div className={`size-12 rounded-2xl bg-white/50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:-translate-y-2 group-hover:bg-primary transition-all duration-300 border border-white/20 dark:border-white/10 shadow-sm backdrop-blur-md`}>
                                <item.icon size={20} className={`${item.color} group-hover:text-slate-900`} strokeWidth={2.5} />
                           </div>
                           <p className="text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-1">{item.label}</p>
                           <p className="text-xl font-black text-slate-900 dark:text-white drop-shadow-sm">{item.val}</p>
                      </div>
                  ))}
             </div>
             <div className="mt-10 bg-white/50 dark:bg-white/5 p-6 rounded-3xl border border-dashed border-slate-400/30 dark:border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 leading-relaxed text-center uppercase tracking-widest">
                       Tráfego IZI: <span className="text-slate-900 dark:text-white font-black">1.4 req/s</span><br/>Latência: <span className="text-slate-900 dark:text-white font-black">120ms</span>
                  </p>
             </div>
        </div>
      </div>

      {/* Tabela de Pedidos Globais - Glass */}
      <div className={`${glassCard} overflow-visible`}>
          <div className="px-10 py-8 border-b border-slate-300/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/20 dark:bg-black/20">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase drop-shadow-md">
                  {activeMerchant ? 'Histórico da Unidade' : 'Monitor de Pedidos em Tempo Real'}
                </h3>
                <p className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em]">
                  {activeMerchant ? `Visualizando transações de ${activeMerchant.store_name}` : 'Acompanhamento detalhado das transações recentes'}
                </p>
              </div>
              <button 
                onClick={() => setActiveTab('orders')} 
                className="px-8 py-4 bg-primary text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                  Gerenciar Tudo <ArrowRight size={14} />
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-100/50 dark:bg-white/5 backdrop-blur-md border-b border-slate-300/50 dark:border-white/5">
                      <tr>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Cód. Pedido</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Cliente & Lojista</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Status Atual</th>
                          <th className="px-10 py-6 text-right text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Valor Processado</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                      {recentOrders.map((o, i) => (
                          <tr key={i} className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group cursor-pointer">
                              <td className="px-10 py-6">
                                  <span className="text-sm font-black text-slate-900 dark:text-white block group-hover:text-primary transition-colors tracking-widest drop-shadow-sm">
                                    #{o.tracking_code || o.id.slice(0, 8).toUpperCase()}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1 block">
                                    {new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                              </td>
                              <td className="px-10 py-6">
                                  <div className="flex items-center gap-4">
                                      <div className="size-10 rounded-full bg-white/60 dark:bg-zinc-800 flex items-center justify-center border border-white/50 dark:border-white/10 shadow-sm shrink-0">
                                          <Users size={16} className="text-slate-600 dark:text-zinc-400" />
                                      </div>
                                      <div className="min-w-0">
                                          <span className="text-sm font-black text-slate-900 dark:text-white block truncate drop-shadow-sm">
                                            {o.customer_name || o.user?.name || o.user_name || 'Cliente IZI'}
                                          </span>
                                          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase block tracking-[0.2em] mt-1 truncate">
                                            Lojista: {o.merchant_name || 'Não identificado'}
                                          </span>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-10 py-6">
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border shadow-sm backdrop-blur-md ${
                                      ['concluido', 'delivered', 'entregue'].includes(o.status) ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-700 dark:text-emerald-400' :
                                      ['cancelado', 'cancelled'].includes(o.status) ? 'bg-rose-500/20 border-rose-500/30 text-rose-700 dark:text-rose-400' :
                                      ['pendente', 'waiting_driver'].includes(o.status) ? 'bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-400' :
                                      'bg-blue-500/20 border-blue-500/30 text-blue-700 dark:text-blue-400'
                                  } text-[9px] font-black uppercase tracking-[0.2em]`}>
                                      <div className={`size-2 rounded-full ${
                                          ['concluido', 'delivered', 'entregue'].includes(o.status) ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                                          ['cancelado', 'cancelled'].includes(o.status) ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' :
                                          ['pendente', 'waiting_driver'].includes(o.status) ? 'bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]' :
                                          'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]'
                                      }`} />
                                      {o.status.replace('_', ' ')}
                                  </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-sm block">
                                      R$ {(o.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em] mt-1 block">
                                      {o.payment_method?.replace('_', ' ') || 'Pendente'}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="p-8 bg-slate-50/50 dark:bg-black/20 border-t border-slate-300/50 dark:border-white/5 text-center">
               <button 
                 onClick={() => fetchAllOrders(2)}
                 className="text-[10px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
               >
                   <Activity size={14} /> Carregar histórico antigo
               </button>
          </div>
      </div>
    </div>
  );
}
