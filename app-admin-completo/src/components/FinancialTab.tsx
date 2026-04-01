import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import type { DashboardData } from '../lib/types';

// Relatórios Financeiros
export default function FinancialTab() {
  const {
    allOrders, appSettings, dashboardData, userRole, merchantProfile
  } = useAdmin();

  return (
    <div className="space-y-8 pb-20">
      {/* Finance Header & Filters */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {userRole === 'merchant' ? 'Meu Financeiro' : 'Relatórios de Faturamento'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {userRole === 'merchant' 
              ? `Acompanhe seus ganhos e repasses da loja ${merchantProfile?.store_name}.` 
              : 'Acompanhe a saúde financeira e o desempenho de vendas da plataforma.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg mr-2 text-slate-400">picture_as_pdf</span>
            Relatório PDF
          </button>
          <button className="flex items-center justify-center rounded-2xl h-12 px-6 bg-primary text-slate-900 hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg mr-2">download</span>
            Exportar Dados
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Vendas Totais (Bruto)', 
            val: `R$ ${(dashboardData.totalRevenue || 0).toFixed(2).replace('.', ',')}`, 
            trend: 'Total histórico', 
            icon: 'payments', 
            color: 'bg-primary/10 text-primary', 
            trendCol: 'text-slate-500' 
          },
          { 
            label: 'Pedidos Concluídos', 
            val: dashboardData.completedOrdersCount || 0, 
            trend: `${dashboardData.deliverySuccessRate.toFixed(1)}% de sucesso`, 
            icon: 'check_circle', 
            color: 'bg-emerald-50 text-emerald-500', 
            trendCol: 'text-emerald-500' 
          },
          { 
            label: userRole === 'merchant' ? 'Taxas IZI' : 'Comissões Totais', 
            val: `R$ ${(dashboardData.totalCommission || 0).toFixed(2).replace('.', ',')}`, 
            trend: userRole === 'merchant' ? 'Comissão da plataforma' : 'Receita da IZI', 
            icon: 'percent', 
            color: 'bg-red-50 text-red-500', 
            trendCol: 'text-red-500' 
          },
          { 
            label: userRole === 'merchant' ? 'Líquido a Receber' : 'Lucro Líquido', 
            val: `R$ ${(dashboardData.netProfit || 0).toFixed(2).replace('.', ',')}`, 
            trend: 'Saldo disponível', 
            icon: 'account_balance_wallet', 
            color: 'bg-blue-50 text-blue-500', 
            trendCol: 'text-blue-500' 
          },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${kpi.color}`}>
                <span className="material-symbols-outlined">{kpi.icon}</span>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${kpi.trendCol} flex items-center gap-1`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{kpi.val}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tax configuration card */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <span className="material-symbols-outlined text-8xl">settings_input_component</span>
          </div>
          
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 mb-6">
            <span className="material-symbols-outlined text-primary text-2xl">account_tree</span>
            Divisão de Taxas
          </h4>
          
          <div className="space-y-6">
            <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
               <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sua Comissão Atual</span>
                  <span className="text-sm font-black text-primary">
                    {merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12}%
                  </span>
               </div>
               <p className="text-[9px] font-bold text-slate-500 leading-tight">
                 Percentual fixo aplicado sobre o valor bruto de cada pedido realizado através da plataforma IZI.
               </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                   <span className="material-symbols-outlined">receipt</span>
                </div>
                <div>
                   <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Valor da Venda</p>
                   <p className="text-[10px] font-bold text-slate-400">Ex: R$ 100,00</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
                   <span className="material-symbols-outlined">trending_down</span>
                </div>
                <div>
                   <p className="text-xs font-black text-red-500 uppercase tracking-tight">Taxa IZI ({(merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12)}%)</p>
                   <p className="text-[10px] font-bold text-slate-400">- R$ {(100 * ((merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12) / 100)).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800 my-2"></div>

              <div className="flex items-center gap-4">
                <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500">
                   <span className="material-symbols-outlined">payments</span>
                </div>
                <div>
                   <p className="text-xs font-black text-emerald-500 uppercase tracking-tight">Seu Recebimento</p>
                   <p className="text-[10px] font-bold text-slate-400">R$ {(100 - (100 * ((merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12) / 100))).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 rounded-3xl bg-slate-900 text-white shadow-xl">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-2">Nota Importante</p>
               <p className="text-[10px] font-medium leading-relaxed opacity-80">
                 {userRole === 'merchant' 
                   ? 'As taxas são deduzidas automaticamente no momento da conclusão do pedido. O repasse é realizado conforme o ciclo de faturamento acordado.'
                   : 'As taxas exibidas aqui são as configurações globais ou específicas definidas para este lojista no painel de controle admin.'}
               </p>
            </div>
          </div>
        </div>

        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-10">
            <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">insights</span>
              Crescimento de Vendas
            </h4>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary ring-4 ring-primary/10"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Volume (R$)</span>
              </div>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-1 px-4">
            {(dashboardData.dailyRevenue || []).map((val: number, i: number) => {
              const maxVal = Math.max(...(dashboardData.dailyRevenue || [1]), 1);
              const h = (val / maxVal) * 100;
              return (
                <div key={i} className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-t-lg relative group cursor-pointer">
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    className={`absolute bottom-0 left-0 right-0 bg-primary/20 group-hover:bg-primary transition-all duration-300 rounded-t-lg`} 
                  ></motion.div>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-black px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-xl">
                    R$ {val.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <span>6 dias atrás</span>
            <span>Hoje</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history_edu</span>
            Histórico de Pedidos
          </h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {allOrders.length} pedidos encontrados
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data / Hora</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ref</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Bruto</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa IZI</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Líquido</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {allOrders.slice(0, 10).map((tr) => {
                const commRate = merchantProfile?.commission_percent ?? appSettings.appCommission ?? 12;
                const commiss = (tr.total_price || 0) * (commRate / 100);
                const net = (tr.total_price || 0) - commiss;
                
                return (
                  <tr key={tr.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                      {new Date(tr.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase text-center">
                      #{tr.id.slice(0, 5)}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                      {tr.user_name || 'Consumidor'}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white">R$ {tr.total_price?.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-sm font-bold text-red-500/80">- R$ {commiss.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-sm font-black text-emerald-500">R$ {net.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        tr.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        tr.status === 'cancelado' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
