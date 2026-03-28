import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

export default function MerchantDashboardTab() {
  const {
    allOrders, merchantProfile, dashboardData, fetchAllOrders
  } = useAdmin();

  React.useEffect(() => {
    fetchAllOrders(1);
  }, [fetchAllOrders]);

  // Filtrar pedidos concluídos do lojista
  const merchantOrders = allOrders.filter(o => o.merchant_id === merchantProfile?.merchant_id);
  const completedOrders = merchantOrders.filter(o => o.status === 'concluido');
  const totalRevenue = completedOrders.reduce((acc, curr) => acc + (curr.total_price || 0), 0);
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
  
  // Metas e Projeções (Mock logic for now, could be dynamic)
  const monthlyGoal = 15000;
  const progressPercent = Math.min((totalRevenue / monthlyGoal) * 100, 100);

  return (
    <div className="space-y-8 pb-20">
      {/* Header com Saudação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">
            Dashboard de Resultados
          </h1>
          <p className="text-slate-500 font-bold text-sm mt-1">
            Acompanhe o desempenho da sua loja em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
            <div className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meta Mensal</span>
                <span className="text-lg font-black text-slate-900 dark:text-white italic">R$ {monthlyGoal.toLocaleString('pt-BR')}</span>
            </div>
            <button className="size-14 bg-primary text-slate-900 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                <span className="material-symbols-outlined font-black">download</span>
            </button>
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Faturamento Total', val: `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`, icon: 'payments', info: 'Vendas concluídas', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Pedidos Realizados', val: merchantOrders.length, icon: 'shopping_basket', info: `Taxa de conversão: 12%`, color: 'text-primary', bg: 'bg-primary/10' },
          { label: 'Ticket Médio', val: `R$ ${avgTicket.toFixed(2).replace('.', ',')}`, icon: 'confirmation_number', info: '+5.4% vs mês anterior', color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Novos Clientes', val: '24', icon: 'person_add', info: 'Retenção de 68%', color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl transition-all"
          >
            <div className={`absolute -right-4 -top-4 size-24 ${item.bg} rounded-full blur-2xl opacity-50 group-hover:scale-150 transition-transform duration-700`} />
            <div className="relative z-10">
              <div className={`size-12 ${item.bg} rounded-2xl flex items-center justify-center mb-6`}>
                <span className={`material-symbols-outlined ${item.color} font-black`}>{item.icon}</span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">{item.val}</h2>
              <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-500">trending_up</span>
                {item.info}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Performance (Simplificado com CSS) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Fluxo de Vendas Diário</h3>
              <p className="text-xs font-bold text-slate-400">Dados dos últimos 7 dias operacionais</p>
            </div>
            <div className="flex gap-2">
                {['Hoje', 'Ontem', 'Semana'].map(t => (
                    <button key={t} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${t === 'Semana' ? 'bg-slate-900 text-white dark:bg-primary dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                        {t}
                    </button>
                ))}
            </div>
          </div>

          <div className="h-72 flex items-end justify-between gap-4 px-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              {[65, 40, 85, 55, 95, 70, 75].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                      <div className="w-full relative h-64 flex items-end">
                          <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 1, delay: i * 0.1 }}
                            className="w-full bg-slate-100 dark:bg-slate-800/50 rounded-2xl group-hover:bg-primary transition-colors relative overflow-hidden"
                          >
                              <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                          </motion.div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][i]}</span>
                  </div>
              ))}
          </div>
          <div className="mt-8 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                      <div className="size-3 bg-primary rounded-full" />
                      <span>Vendas Concluídas</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <div className="size-3 bg-slate-200 dark:bg-slate-700 rounded-full" />
                      <span>Projeção</span>
                  </div>
              </div>
              <p>Média: R$ 1.450,00 / dia</p>
          </div>
        </div>

        {/* Card de Projeção / Meta */}
        <div className="space-y-8">
            <div className="bg-slate-900 dark:bg-primary p-10 rounded-[48px] text-white dark:text-slate-900 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-500">
                    <span className="material-symbols-outlined text-8xl font-black">analytics</span>
                </div>
                <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Status da Meta</p>
                    <h3 className="text-4xl font-black tracking-tighter italic mb-8">
                        {progressPercent.toFixed(1)}% <span className="text-xl font-bold opacity-60 italic tracking-normal ml-1">ALCANÇADO</span>
                    </h3>
                    
                    <div className="w-full h-4 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden mb-8 border border-white/5">
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5 }}
                            className="h-full bg-white dark:bg-slate-900"
                        />
                    </div>

                    <p className="text-xs font-bold leading-relaxed opacity-80 mb-8">
                        Faltam <span className="font-black underline underline-offset-4">R$ {(monthlyGoal - totalRevenue).toFixed(2).replace('.', ',')}</span> para atingir sua meta de faturamento mensal.
                    </p>

                    <button className="w-full py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:translate-y-[-2px] active:translate-y-[0px] transition-all">
                        Ajustar Metas
                    </button>
                </div>
            </div>

            {/* Top Produtos */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-sm font-black text-slate-900 dark:text-white italic uppercase tracking-widest mb-6">Mais Vendidos</h3>
                <div className="space-y-6">
                    {[
                        { name: 'X-Burger IZI Special', sales: 145, color: 'bg-amber-500' },
                        { name: 'Pizza Calabresa GG', sales: 98, color: 'bg-rose-500' },
                        { name: 'Sushi Combo 40 Peças', sales: 64, color: 'bg-emerald-500' },
                    ].map((p, i) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 ${p.color}/10 rounded-xl flex items-center justify-center`}>
                                    <span className={`material-symbols-outlined text-sm ${p.color.replace('bg-', 'text-')} font-black`}>local_fire_department</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px]">{p.name}</span>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.sales} un</span>
                        </div>
                    ))}
                </div>
                <button className="w-full mt-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-t border-slate-50 dark:border-slate-800 hover:text-primary transition-colors">
                    Relatório Completo
                </button>
            </div>
        </div>
      </div>

      {/* Tabela de Pedidos Recentes no Dashboard */}
      <div className="bg-white dark:bg-slate-900 rounded-[48px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase">Últimos Pedidos</h3>
                <p className="text-xs font-bold text-slate-400 mt-1">Sincronizado agora mesmo</p>
              </div>
              <button className="px-6 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all">
                  Gerenciar Tudo
              </button>
          </div>
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                      <tr>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedido</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                          <th className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {merchantOrders.slice(0, 5).map((o, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all group">
                              <td className="px-10 py-6 font-display">
                                  <span className="text-slate-400 text-[10px] font-black uppercase block mb-1">ID</span>
                                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">#{o.id.slice(0, 8).toUpperCase()}</span>
                              </td>
                              <td className="px-10 py-6">
                                  <span className="text-sm font-black text-slate-900 dark:text-slate-100 italic">#{o.user_id.slice(0, 6)}</span>
                                  <span className="text-[10px] font-bold text-slate-400 block mt-1 uppercase">Via App IZI</span>
                              </td>
                              <td className="px-10 py-6">
                                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${
                                      o.status === 'concluido' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                      o.status === 'pendente' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                                      'bg-slate-500/10 border-slate-500/20 text-slate-500'
                                  } text-[10px] font-black uppercase tracking-widest`}>
                                      <div className={`size-1.5 rounded-full ${
                                          o.status === 'concluido' ? 'bg-emerald-500' :
                                          o.status === 'pendente' ? 'bg-amber-500' :
                                          'bg-slate-500'
                                      }`} />
                                      {o.status}
                                  </div>
                              </td>
                              <td className="px-10 py-6 text-right">
                                  <span className="text-lg font-black text-slate-900 dark:text-white italic tracking-tighter">
                                      R$ {o.total_price.toFixed(2).replace('.', ',')}
                                  </span>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
}
