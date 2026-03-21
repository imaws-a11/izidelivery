import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Relatórios Financeiros
export default function FinancialTab() {
  const {
    allOrders, appSettings, dashboardData
  } = useAdmin();

  return (
  {/* Finance Header & Filters */}
  <div className="flex flex-wrap justify-between items-end gap-6">
    <div className="flex flex-col gap-1">
      <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Relatórios de Faturamento</h1>
      <p className="text-slate-500 dark:text-slate-400 text-base">Acompanhe a saúde financeira e o desempenho de vendas da plataforma.</p>
    </div>
    <div className="flex gap-3">
      <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
        <span className="material-symbols-outlined text-lg mr-2 text-slate-400">picture_as_pdf</span>
        PDF
      </button>
      <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-primary text-slate-900 hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
        <span className="material-symbols-outlined text-lg mr-2">csv</span>
        Exportar CSV
      </button>
    </div>
  </div>

  {/* KPI Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {[
      { label: 'Receita Total', val: `R$ ${(dashboardData.totalRevenue || 0).toFixed(2).replace('.', ',')}`, trend: '+12.5%', icon: 'payments', color: 'bg-primary/10 text-primary', trendCol: 'text-emerald-500' },
      { label: 'Total de Pedidos', val: dashboardData.totalOrders || 0, trend: `+${(((dashboardData.completedOrdersCount || 0) / (dashboardData.totalOrders || 1)) * 100).toFixed(0)}%`, icon: 'shopping_cart', color: 'bg-blue-50 text-blue-500', trendCol: 'text-emerald-500' },
      { label: 'Ticket Médio', val: `R$ ${(dashboardData.avgTicket || 0).toFixed(2).replace('.', ',')}`, trend: 'Estável', icon: 'confirmation_number', color: 'bg-purple-50 text-purple-500', trendCol: 'text-slate-500' },
      { label: 'Lucro Líquido', val: `R$ ${(dashboardData.netProfit || 0).toFixed(2).replace('.', ',')}`, trend: `${appSettings.appCommission}%`, icon: 'account_balance', color: 'bg-emerald-50 text-emerald-500', trendCol: 'text-emerald-500' },
    ].map((kpi, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
          <div className={`p-3 rounded-2xl ${kpi.color}`}>
            <span className="material-symbols-outlined">{kpi.icon}</span>
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${kpi.trendCol} flex items-center gap-1`}>
            <span className="material-symbols-outlined text-xs">{kpi.trend.startsWith('+') ? 'trending_up' : 'trending_down'}</span>
            {kpi.trend}
          </span>
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{kpi.val}</h3>
      </div>
    ))}
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    {/* Revenue Trend Chart */}
    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
          Tendência de Receita
        </h4>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-primary ring-4 ring-primary/10"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receita</span>
          </div>
          <select className="bg-slate-50 dark:bg-slate-800 border-none rounded-xl py-2 px-4 text-[10px] font-black uppercase tracking-widest text-slate-500 focus:ring-primary cursor-pointer">
            <option>Últimos 30 Dias</option>
            <option>Este Ano</option>
          </select>
        </div>
      </div>

      <div className="h-64 flex items-end justify-between gap-1 px-4">
        {(dashboardData.revenue30Days || []).map((val: number, i: number) => {
          const maxVal = Math.max(...(dashboardData.revenue30Days || [1]), 1);
          const h = (val / maxVal) * 100;
          return (
            <div key={i} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg relative group cursor-pointer">
              <motion.div 
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                className={`absolute bottom-0 left-0 right-0 bg-primary/20 group-hover:bg-primary transition-all duration-300 rounded-t-lg`} 
              ></motion.div>
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                R$ {val.toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        <span>Há 30 dias</span>
        <span>15 dias</span>
        <span>Hoje</span>
      </div>
    </div>

    {/* Distribution Chart (Performance por Categoria) */}
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
      <div className="flex items-center justify-between mb-8">
         <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
           <span className="material-symbols-outlined text-primary text-2xl">analytics</span>
           Desempenho por Categoria
         </h4>
         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Receita</span>
      </div>
      <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {dashboardData.categories?.map((svc: any, i: number) => (
          <div key={i} className="group p-4 rounded-3xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
            <div className="flex justify-between items-end mb-3">
              <div>
                 <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight">{svc.label}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{svc.val} pedidos realizados</p>
              </div>
              <div className="text-right">
                 <p className="text-sm font-black text-emerald-500">R$ {svc.revenue.toFixed(2).replace('.', ',')}</p>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{svc.percent.toFixed(1)}% do volume</p>
              </div>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${svc.percent}%` }}
                className={`bg-primary h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,217,0,0.3)]`}
              ></motion.div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Transactions Table */}
  <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
    <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
      <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
        <span className="material-symbols-outlined text-primary">receipt_long</span>
        Transações Recentes
      </h4>
      <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
        <input type="text" placeholder="Buscar por Order ID..." className="bg-transparent border-none text-[10px] font-bold px-4 py-2 w-48 focus:ring-0 placeholder:text-slate-300 dark:text-white" />
        <button className="bg-primary text-slate-900 size-9 rounded-xl inline-flex items-center justify-center hover:scale-95 transition-transform">
          <span className="material-symbols-outlined text-xl">search</span>
        </button>
      </div>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/50">
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
          {allOrders.slice(0, 10).map((tr) => (
            <tr key={tr.id} className="hover:bg-primary/5 transition-colors group">
              <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                {new Date(tr.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </td>
              <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
                #{tr.id.slice(0, 8)}
              </td>
              <td className="px-8 py-6">
                <span className="px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                  {tr.service_type || 'Geral'}
                </span>
              </td>
              <td className="px-8 py-6 text-sm font-bold text-slate-700 dark:text-slate-300">{tr.user_name || 'Usuário'}</td>
              <td className="px-8 py-6 text-sm font-black text-primary">R$ {tr.total_price?.toFixed(2).replace('.', ',')}</td>
              <td className="px-8 py-6 text-right">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                  tr.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                  tr.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-100' :
                  'bg-amber-50 text-amber-600 border-amber-100'
                }`}>
                  <span className={`size-1.5 rounded-full ${tr.status === 'concluido' ? 'bg-emerald-500' : tr.status === 'cancelado' ? 'bg-red-500' : 'bg-amber-500'}`}></span>
                  {tr.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="px-8 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mostrando 1-4 de 2450 transações</p>
      <div className="flex gap-2">
        <button className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>
        <button className="size-10 rounded-xl bg-primary text-slate-900 font-black text-xs">1</button>
        <button className="size-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </div>
    </div>
  </div>
</div>
            )}


  );
}
