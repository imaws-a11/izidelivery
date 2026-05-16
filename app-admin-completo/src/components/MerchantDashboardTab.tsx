import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { 
  TrendingUp, 
  ShoppingBasket, 
  Wallet, 
  Target, 
  Flame, 
  Activity,
  ArrowRight,
  RefreshCcw,
  BarChart3,
  Users,
  Bike
} from 'lucide-react';

export default function MerchantDashboardTab() {
  const {
    allOrders, merchantProfile, dashboardData, fetchAllOrders,
    merchantBalance, isWalletLoading, setActiveTab, setActivePreviewTab,
    setSelectedOrder, setDraftStandaloneOrder
  } = useAdmin();

  const goToFinancial = () => {
    setActiveTab('my_studio');
    setActivePreviewTab('financial');
  };

  React.useEffect(() => {
    fetchAllOrders(1);
  }, [fetchAllOrders]);

  // Filtrar ordens do lojista de forma robusta
  const merchantId = merchantProfile?.id;
  const merchantOrders = allOrders.filter(o => String(o.merchant_id) === String(merchantId));
  const completedOrders = merchantOrders.filter(o => o.status === 'concluido' || o.status === 'delivered' || o.status === 'entregue');
  
  // Usar dados reais calculados localmente para garantir exatidão
  const { totalRevenue, completedOrdersCount, avgTicket, dailyRevenue, topProducts } = React.useMemo(() => {
    const totalRev = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const count = completedOrders.length;
    const avg = count > 0 ? totalRev / count : 0;
    
    const today = new Date();
    const dailyRev = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      return completedOrders
        .filter(o => o.created_at.startsWith(dateStr))
        .reduce((sum, o) => sum + (o.total_price || 0), 0);
    });

    const productSales: Record<string, number> = {};
    completedOrders.forEach(o => {
      const items = (o as any).items || [];
      items.forEach((it: any) => {
        const name = it.name || it.product_name || 'Produto';
        const qty = it.quantity || 1;
        productSales[name] = (productSales[name] || 0) + qty;
      });
      if (items.length === 0) {
        // Fallback for legacy text string items
        const parts = (o.delivery_address || '').split('| ITENS:');
        const rawItems = parts[1] ? parts[1].split(',').map((i: string) => i.trim()).filter(Boolean) : [];
        rawItems.forEach((item: string) => {
           const cleanName = item.replace(/\(R\$.*?\)/g, '').trim();
           const match = cleanName.match(/^(\d+)x\s+(.*)/);
           const name = match ? match[2] : cleanName;
           const qty = match ? parseInt(match[1]) : 1;
           productSales[name] = (productSales[name] || 0) + qty;
        });
      }
    });

    const topProds = Object.entries(productSales)
      .map(([label, sales]) => ({ label, sales }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      totalRevenue: totalRev,
      completedOrdersCount: count,
      avgTicket: avg,
      dailyRevenue: dailyRev,
      topProducts: topProds
    };
  }, [completedOrders]);
  
  // Metas e Projeções (Dinâmico baseado nas configurações)
  const [showGoalModal, setShowGoalModal] = React.useState(false);
  const [tempGoal, setTempGoal] = React.useState('');
  const { handleUpdateMerchantProfile, isSaving } = useAdmin();

  const monthlyGoal = Number(merchantProfile?.metadata?.monthly_goal || merchantProfile?.monthly_goal || 0);
  const progressPercent = monthlyGoal > 0 ? Math.min((totalRevenue / monthlyGoal) * 100, 100) : 0;

  const openGoalModal = () => {
    setTempGoal(monthlyGoal.toString());
    setShowGoalModal(true);
  };

  const saveGoal = async () => {
    const val = parseFloat(tempGoal.replace(',', '.'));
    if (isNaN(val)) return;
    
    // Salvar usando a coluna existente 'metadata' para garantir que não dê erro de schema
    const updatedMetadata = {
      ...(merchantProfile?.metadata || {}),
      monthly_goal: val
    };

    await handleUpdateMerchantProfile({ metadata: updatedMetadata });
    setShowGoalModal(false);
  };

  const glassCard = "bg-white/40 dark:bg-black/40 backdrop-blur-2xl border border-white/50 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.1)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)] rounded-[32px] overflow-hidden relative";

  return (
    <div className="space-y-10 pb-24 font-display px-2">
      {/* Header Glassmorphic */}
      <div className={`${glassCard} p-10 flex flex-col md:flex-row md:items-center justify-between gap-8`}>
        <div className="absolute -top-32 -left-32 size-64 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 size-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none drop-shadow-md">
            Visão de Negócios
          </h1>
          <p className="text-slate-600 dark:text-zinc-400 font-bold text-sm mt-3 uppercase tracking-[0.2em]">
            {merchantProfile?.store_name || 'Sua Loja'} • Acompanhamento Operacional
          </p>
        </div>
        
        <div className="relative z-10 flex flex-wrap items-center gap-4">
            <button 
              onClick={goToFinancial}
              className="px-8 py-4 bg-emerald-500/90 hover:bg-emerald-500 backdrop-blur-md text-emerald-950 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 font-black text-[10px] uppercase tracking-[0.2em]"
            >
              <Wallet size={16} />
              Sacar Saldo
            </button>
            {monthlyGoal > 0 && (
              <div 
                className="px-6 py-3 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-2xl shadow-sm cursor-pointer hover:border-primary transition-colors" 
                onClick={openGoalModal}
              >
                  <span className="text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em] block">Meta Mensal</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white drop-shadow-sm">R$ {monthlyGoal.toLocaleString('pt-BR')}</span>
              </div>
            )}
        </div>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: 'Saldo Disponível', 
            val: isWalletLoading ? '...' : `R$ ${merchantBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
            icon: Wallet, 
            info: 'Saldo pronto para saque', 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'shadow-emerald-500/20 bg-emerald-500/10',
            action: goToFinancial 
          },
          { label: 'Faturamento Total', val: `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, info: 'Vendas concluídas', color: 'text-primary', bg: 'shadow-primary/20 bg-primary/10' },
          { label: 'Pedidos Realizados', val: completedOrdersCount, icon: ShoppingBasket, info: `${merchantOrders.length} ordens no total`, color: 'text-blue-600 dark:text-blue-400', bg: 'shadow-blue-500/20 bg-blue-500/10' },
          { label: 'Ticket Médio', val: `R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Activity, info: 'Média por pedido', color: 'text-purple-600 dark:text-purple-400', bg: 'shadow-purple-500/20 bg-purple-500/10' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={item.action}
            className={`${glassCard} p-8 group hover:-translate-y-2 transition-all duration-300 border-t-2 border-t-transparent hover:border-t-primary ${item.action ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className={`absolute -right-4 -top-4 size-24 ${item.bg} rounded-full blur-2xl opacity-30 group-hover:scale-150 transition-transform duration-700 pointer-events-none`} />
            <div className="relative z-10">
              <div className={`size-14 bg-white/50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center mb-6 shadow-lg backdrop-blur-md`}>
                <item.icon size={28} className={item.color} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-widest mb-2 drop-shadow-sm">{item.label}</p>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter drop-shadow-md">{item.val}</h2>
              <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-500 mt-4 flex items-center gap-2 uppercase tracking-widest">
                <span className={`size-2 rounded-full shadow-lg ${item.color.replace('text', 'bg').replace('dark:', '')}`} />
                {item.info}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Gráfico de Performance - Glass */}
        <div className={`lg:col-span-2 ${glassCard} p-10`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-primary to-blue-500 opacity-80 shadow-[0_0_20px_rgba(255,255,255,0.5)]" />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase drop-shadow-md">Fluxo de Vendas Diário</h3>
              <p className="text-xs font-bold text-slate-600 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em]">Dados dos últimos 7 dias operacionais</p>
            </div>
            <div className="flex gap-2 bg-white/60 dark:bg-white/5 p-1.5 rounded-2xl border border-white/20 dark:border-white/5 backdrop-blur-xl">
                {['Hoje', 'Ontem', 'Semana'].map(t => (
                    <button key={t} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${t === 'Semana' ? 'bg-slate-900 text-white dark:bg-primary dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:bg-white/40 dark:hover:bg-white/10'}`}>
                        {t}
                    </button>
                ))}
            </div>
          </div>

          <div className="h-72 flex items-end justify-between gap-4 px-4 border-b border-slate-300/50 dark:border-white/5 pb-4">
              {(dailyRevenue || [0,0,0,0,0,0,0]).map((val, i) => {
                  const maxVal = Math.max(...(dailyRevenue || [1]), 1);
                  const h = (val / maxVal) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                        <div className="w-full relative h-64 flex items-end">
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(h, 5)}%` }}
                              transition={{ duration: 1, delay: i * 0.1 }}
                              className="w-full bg-slate-200/50 dark:bg-zinc-800/50 rounded-t-2xl group-hover:bg-primary/90 transition-colors relative overflow-hidden backdrop-blur-sm shadow-sm"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent" />
                                {val > 0 && (
                                  <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-xl z-20 pointer-events-none">
                                    R${val}
                                  </div>
                                )}
                            </motion.div>
                        </div>
                        <span className="text-[10px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">{['D', 'S', 'T', 'Q', 'Q', 'S', 'S'][i]}</span>
                    </div>
                  );
              })}
          </div>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] font-black text-slate-600 dark:text-zinc-500 uppercase tracking-[0.2em]">
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                      <div className="size-3 bg-primary rounded-full shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
                      <span>Vendas Concluídas</span>
                  </div>
                  <div className="flex items-center gap-3">
                      <div className="size-3 bg-slate-300 dark:bg-zinc-700 rounded-full" />
                      <span>Projeção</span>
                  </div>
              </div>
              <p className="bg-white/50 dark:bg-white/5 px-4 py-2 rounded-xl border border-white/20 dark:border-white/5 backdrop-blur-sm">
                Ticket Médio: R$ {avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
          </div>
        </div>

        {/* Card de Projeção / Meta e Top Produtos */}
        <div className="space-y-8">
            <div className={`${monthlyGoal > 0 ? 'bg-primary' : 'bg-slate-900 dark:bg-zinc-900'} p-10 rounded-[48px] ${monthlyGoal > 0 ? 'text-slate-900' : 'text-white'} shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] relative overflow-hidden group`}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.08] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
                    <Target size={120} />
                </div>
                <div className="relative z-10">
                    <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${monthlyGoal > 0 ? 'opacity-70' : 'text-zinc-400'}`}>Status da Meta</p>
                    <h3 className="text-4xl font-black tracking-tighter drop-shadow-sm mb-8 flex items-baseline gap-2">
                        {monthlyGoal > 0 ? `${progressPercent.toFixed(1)}%` : 'S/ Meta'} 
                        <span className={`text-xs font-bold ${monthlyGoal > 0 ? 'opacity-60' : 'text-zinc-500'} uppercase tracking-[0.2em]`}>
                          {monthlyGoal > 0 ? 'Concluído' : 'Mensal'}
                        </span>
                    </h3>
                    
                    <div className={`w-full h-4 ${monthlyGoal > 0 ? 'bg-black/10' : 'bg-white/10'} rounded-full overflow-hidden mb-8 border border-white/10 backdrop-blur-sm`}>
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5 }}
                            className={`h-full ${monthlyGoal > 0 ? 'bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.5)]' : 'bg-white'}`}
                        />
                    </div>

                    <p className={`text-[10px] font-bold leading-relaxed uppercase tracking-widest ${monthlyGoal > 0 ? 'opacity-80' : 'text-zinc-400'} mb-8`}>
                        {monthlyGoal > 0 
                          ? `Faltam R$ ${Math.max(0, monthlyGoal - totalRevenue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} para atingir sua meta.`
                          : "Defina uma meta mensal para acompanhar seu progresso visualmente."}
                    </p>

                    <button 
                      onClick={openGoalModal}
                      className={`w-full py-5 ${monthlyGoal > 0 ? 'bg-slate-900 text-primary hover:bg-slate-800' : 'bg-white text-slate-900 hover:bg-slate-100'} rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:-translate-y-1 active:translate-y-0 transition-all`}
                    >
                        Ajustar Metas
                    </button>
                </div>
            </div>

            {/* Top Produtos - Glass */}
            <div className={`${glassCard} p-8`}>
                <h3 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6 drop-shadow-sm flex items-center gap-2">
                  <Flame size={16} className="text-primary" /> Mais Vendidos
                </h3>
                <div className="space-y-5">
                    {(topProducts && topProducts.length > 0) ? topProducts.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/40 dark:hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`size-10 bg-primary/20 backdrop-blur-sm border border-primary/30 rounded-xl flex items-center justify-center shadow-sm`}>
                                    <Flame size={16} className="text-primary" />
                                </div>
                                <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[120px] drop-shadow-sm">{p.label}</span>
                            </div>
                            <span className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">{p.sales} un</span>
                        </div>
                    )) : (
                      <div className="py-8 text-center bg-white/20 dark:bg-white/5 rounded-2xl border border-dashed border-slate-300/50 dark:border-white/10">
                        <p className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-[0.2em]">Sem dados</p>
                      </div>
                    )}
                </div>
                <button 
                  onClick={() => setActiveTab('orders')}
                  className="w-full mt-6 py-4 text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em] border-t border-slate-300/50 dark:border-white/5 hover:text-primary transition-colors flex items-center justify-center gap-2"
                >
                    Ver Todo Histórico <ArrowRight size={14} />
                </button>
            </div>
        </div>
      </div>

      {/* Tabela de Pedidos Recentes - Glass */}
      <div className={`${glassCard} overflow-visible`}>
          <div className="px-10 py-8 border-b border-slate-300/50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/20 dark:bg-black/20">
              <div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase drop-shadow-md">Monitor de Operações</h3>
                <p className="text-[10px] font-bold text-slate-600 dark:text-zinc-400 mt-2 uppercase tracking-[0.2em]">Últimas movimentações da sua loja</p>
              </div>
              <button 
                onClick={() => setActiveTab('orders')}
                className="px-8 py-4 bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                  Gerenciar Tudo <ArrowRight size={14} />
              </button>
          </div>
          
          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead className="bg-slate-100/50 dark:bg-white/5 backdrop-blur-md border-b border-slate-300/50 dark:border-white/5">
                      <tr>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Pedido</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Cliente</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Logística</th>
                          <th className="px-10 py-6 text-left text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Status</th>
                          <th className="px-10 py-6 text-right text-[9px] font-black text-slate-600 dark:text-zinc-400 uppercase tracking-[0.2em]">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/50 dark:divide-white/5">
                      {merchantOrders.slice(0, 8).map((o, i) => (
                          <tr 
                            key={i} 
                            onClick={() => setSelectedOrder(o)}
                            className="hover:bg-white/40 dark:hover:bg-white/5 transition-colors group cursor-pointer"
                          >
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
                                            {o.customer_name || o.user?.name || o.user_name || 'Cliente'}
                                          </span>
                                          <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 uppercase block tracking-[0.2em] mt-1 truncate">
                                            {o.user_id ? 'App' : 'Avulsa'} • R$ {(o.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                          </span>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-10 py-6">
                                {(o as any).driver_name ? (
                                  <div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 drop-shadow-sm">
                                      <Bike size={14} className="text-blue-500" />
                                      {(o as any).driver_name}
                                    </span>
                                    {(o as any).delivery_payment_method && (
                                      <span className="text-[9px] font-bold text-slate-500 dark:text-zinc-400 block mt-1 uppercase tracking-[0.2em]">
                                        Pgto: {(o as any).delivery_payment_method.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[9px] font-black text-slate-500 dark:text-zinc-500 uppercase tracking-[0.2em]">
                                    {['waiting_driver', 'agendado', 'scheduled'].includes(o.status) ? 'Buscando Piloto...' : 'Sem Entregador'}
                                  </span>
                                )}
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
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setDraftStandaloneOrder(o);
                                      setActiveTab('standalone_delivery');
                                    }}
                                    className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 text-slate-600 dark:text-zinc-400 hover:bg-primary hover:text-slate-900 border border-slate-300/50 dark:border-white/10 backdrop-blur-sm shadow-sm transition-all group/btn"
                                    title="Repetir Entrega (Clonar Pedido)"
                                  >
                                    <RefreshCcw size={18} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                                  </button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* Modal de Ajuste de Metas */}
      {showGoalModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl border border-white/50 dark:border-white/10 rounded-[48px] p-10 shadow-2xl relative overflow-hidden"
            >
                <div className="absolute -right-10 -top-10 size-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 drop-shadow-sm">Ajustar Meta Mensal</h3>
                <p className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 mb-8 uppercase tracking-[0.2em]">Defina seu objetivo de faturamento</p>

                <div className="relative mb-10">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xl font-black text-slate-400">R$</span>
                    <input 
                        type="text" 
                        value={tempGoal}
                        onChange={(e) => setTempGoal(e.target.value)}
                        placeholder="0,00"
                        className="w-full pl-16 pr-8 py-6 bg-slate-100/50 dark:bg-black/20 border border-slate-300/50 dark:border-white/10 rounded-3xl text-2xl font-black text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:border-transparent transition-all backdrop-blur-sm shadow-inner"
                    />
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={() => setShowGoalModal(false)}
                        className="flex-1 py-5 bg-white/50 dark:bg-white/5 border border-slate-300/50 dark:border-white/10 text-slate-600 dark:text-zinc-400 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white dark:hover:bg-white/10 transition-all backdrop-blur-sm shadow-sm"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={saveGoal}
                        disabled={isSaving}
                        className="flex-2 px-10 py-5 bg-primary text-slate-900 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(250,204,21,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Salvando...' : 'Confirmar Meta'}
                    </button>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
}
