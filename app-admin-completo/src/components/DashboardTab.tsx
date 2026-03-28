import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

export default function DashboardTab() {
  const {
    recentOrders, dashboardData, appSettings, setActiveTab
  } = useAdmin();

  const totalRevenue = dashboardData.dailyRevenue.reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Receita Bruta', val: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: 'payments', trend: '+12.5%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Ticket Médio', val: `R$ ${dashboardData.avgTicket.toFixed(2).replace('.', ',')}`, icon: 'confirmation_number', trend: 'Estável', color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Comissão Plataforma', val: `R$ ${dashboardData.totalCommission.toFixed(2).replace('.', ',')}`, icon: 'account_balance_wallet', trend: `${appSettings.appCommission}%`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Sucesso de Entrega', val: `${dashboardData.deliverySuccessRate.toFixed(1)}%`, icon: 'verified', trend: 'Meta 95%', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i}
            className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex flex-col gap-4 shadow-sm hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between">
              <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color} font-bold`}>{stat.icon}</span>
              </div>
              <span className="text-slate-400 text-[9px] font-black px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-full border border-slate-100 dark:border-slate-700">{stat.trend}</span>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">{stat.val}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Trend */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Tendência de Receita Diária</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Desempenho dos últimos 7 dias</p>
            </div>
            <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-[10px] font-black uppercase tracking-widest px-4 focus:ring-primary cursor-pointer">
              <option>Semanal</option>
              <option>Mensal</option>
            </select>
          </div>
          <div className="h-64 flex flex-col justify-end gap-2 relative">
            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 150">
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ffd900', stopOpacity: 0.4 }} />
                  <stop offset="100%" style={{ stopColor: '#ffd900', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                d={`${dashboardData.revenuePath} L400,150 L0,150 Z`} 
                fill="url(#grad1)"
              />
              <motion.path 
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                d={dashboardData.revenuePath} 
                fill="none" 
                stroke="#ffd900" 
                strokeLinecap="round" 
                strokeWidth="4"
              />
            </svg>
            <div className="flex justify-between px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">
              {dashboardData.dayLabels.map((lbl, i) => <span key={i}>{lbl}</span>)}
            </div>
          </div>
        </div>

        {/* Volume by Category */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Volume de Pedidos por Categoria</h3>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Divisão por tipo de entrega</p>
            </div>
            <span className="text-xl font-black text-primary tracking-tighter">
              {dashboardData.totalOrdersToday} 
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 ml-2">total hoje</span>
            </span>
          </div>
          <div className="flex gap-4 items-end h-64">
            {dashboardData.categories.map((cat, i) => (
              <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-[14px] relative flex items-end overflow-hidden h-44 border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700 transition-all">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${cat.percent}%` }}
                    className="w-full bg-primary rounded-t-[10px] transition-all shadow-inner"
                  />
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter text-center leading-none">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* High-Performance Lojistas */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Melhores Lojistas da Semana</h3>
          <span className="material-symbols-outlined text-primary">emoji_events</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {dashboardData.topMerchants.length === 0 ? (
            <div className="p-10 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest italic">Aguardando dados de performance...</div>
          ) : (
            dashboardData.topMerchants.map((m, idx) => (
              <div key={idx} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white font-black text-lg border border-slate-200 dark:border-slate-700">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{m.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{m.orders} pedidos finalizados</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-emerald-500">R$ {m.revenue.toFixed(2).replace('.', ',')}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receita Bruta</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Atividade Recente</h3>
          <button onClick={() => setActiveTab('orders')} className="text-xs font-black text-primary hover:underline uppercase tracking-widest">Ver Todos os Pedidos</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/30">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Pedido</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentOrders.map((o, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                  <td className="px-8 py-5 text-sm font-bold text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white">#{o.id.slice(0, 8).toUpperCase()}</td>
                  <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">#{o.user_id.slice(0, 5)}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 text-[9px] font-black rounded-full uppercase tracking-widest ${
                      o.status === 'completed' ? 'bg-green-100 text-green-700' :
                      o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-slate-900 dark:text-white">R$ {o.total_price.toFixed(2).replace('.', ',')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
