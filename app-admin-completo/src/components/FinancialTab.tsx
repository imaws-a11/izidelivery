import React from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';
import type { DashboardData } from '../lib/types';

// Relatórios Financeiros
export default function FinancialTab() {
  const {
    allOrders, dashboardOrders, appSettings, dashboardData: globalDashboardData, 
    userRole, merchantProfile, selectedMerchantPreview, merchantsList,
    handleSaveAppSettings, isSaving
  } = useAdmin();

  const isMerchantPreview = userRole === 'admin' && selectedMerchantPreview;
  const activeMerchant = isMerchantPreview ? selectedMerchantPreview : (userRole === 'merchant' ? merchantProfile : null);

  // Se for preview, recalculamos os dados para este lojista específico
  const effectiveDashboardData = React.useMemo(() => {
    if (!activeMerchant) return globalDashboardData;

    const orders = dashboardOrders.filter(o => o.merchant_id === activeMerchant.id);
    const completed = orders.filter(o => o.status === 'concluido' || o.status === 'delivered');
    const totalRevenue = completed.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
    const totalOrders = orders.length;
    const completedOrdersCount = completed.length;
    const avgTicket = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;
    const deliverySuccessRate = totalOrders > 0 ? (completedOrdersCount / totalOrders) * 100 : 0;

    let totalCommission = 0;
    const dailyRev = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();

    completed.forEach(order => {
      const isStandalone = order.service_type === 'entrega_avulsa';
      const orderPrice = Number(order.total_price) || 0;

      if (isStandalone) {
        // Se for avulsa, a plataforma ganha 100% (taxa de entrega)
        totalCommission += orderPrice;
      } else {
        // Se for marketplace, a plataforma ganha a comissão pactuada
        const commRate = selectedMerchantPreview?.commission_percent ?? appSettings.appCommission ?? 12;
        totalCommission += orderPrice * (commRate / 100);
      }

      const orderDate = new Date(order.created_at);
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const dayIdx = orderDate.getDay();
        dailyRev[dayIdx] += orderPrice;
      }
    });

    // Se for um lojista vendo seu próprio painel, o totalRevenue deve ignorar as entregas avulsas (que são custos)
    const effectiveRevenue = activeMerchant 
      ? completed.filter(o => o.service_type !== 'entrega_avulsa').reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0)
      : totalRevenue;

    return {
      ...globalDashboardData,
      totalRevenue: effectiveRevenue,
      completedOrdersCount,
      avgTicket: completedOrdersCount > 0 ? effectiveRevenue / completedOrdersCount : 0,
      deliverySuccessRate,
      totalCommission,
      netProfit: effectiveRevenue - totalCommission,
      dailyRevenue: dailyRev
    };
  }, [isMerchantPreview, selectedMerchantPreview, dashboardOrders, globalDashboardData, appSettings.appCommission]);

  // Filtrar ordens da tabela
  const displayOrders = React.useMemo(() => {
    if (activeMerchant) {
      return allOrders.filter(o => o.merchant_id === activeMerchant.id);
    }
    return allOrders;
  }, [allOrders, activeMerchant]);

  return (
    <div className="space-y-8 pb-20">
      {/* Finance Header & Filters */}
      <div className="flex flex-wrap justify-between items-end gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            {(userRole === 'merchant' || isMerchantPreview) ? 'Financeiro da Loja' : 'Relatórios de Faturamento'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base">
            {(userRole === 'merchant' || isMerchantPreview)
              ? `Acompanhe ganhos e repasses do estabelecimento ${activeMerchant?.store_name}.` 
              : 'Acompanhe a saúde financeira e o desempenho de vendas da plataforma.'}
          </p>
        </div>
        <div className="flex gap-3">
          {userRole === 'admin' && !isMerchantPreview && (
            <button 
              onClick={async () => {
                try {
                  await handleSaveAppSettings();
                  toastSuccess('Configurações salvas com sucesso!');
                } catch (e) {
                  toastError('Erro ao salvar configurações.');
                }
              }}
              disabled={isSaving}
              className="flex items-center justify-center rounded-2xl h-12 px-6 bg-emerald-500 text-white hover:brightness-110 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isSaving ? (
                <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
              ) : (
                <span className="material-symbols-outlined text-lg mr-2">save</span>
              )}
              Salvar Alterações
            </button>
          )}
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
            val: `R$ ${(effectiveDashboardData.totalRevenue || 0).toFixed(2).replace('.', ',')}`, 
            trend: 'Total histórico', 
            icon: 'payments', 
            color: 'bg-primary/10 text-primary', 
            trendCol: 'text-slate-500' 
          },
          { 
            label: 'Pedidos Concluídos', 
            val: effectiveDashboardData.completedOrdersCount || 0, 
            trend: `${(effectiveDashboardData.deliverySuccessRate || 0).toFixed(1)}% de sucesso`, 
            icon: 'check_circle', 
            color: 'bg-emerald-50 text-emerald-500', 
            trendCol: 'text-emerald-500' 
          },
          { 
            label: userRole === 'merchant' || isMerchantPreview ? 'Taxas IZI' : 'Comissões Totais', 
            val: `R$ ${(effectiveDashboardData.totalCommission || 0).toFixed(2).replace('.', ',')}`, 
            trend: userRole === 'merchant' || isMerchantPreview ? 'Comissão da plataforma' : 'Receita da IZI', 
            icon: 'percent', 
            color: 'bg-red-50 text-red-500', 
            trendCol: 'text-red-500' 
          },
          { 
            label: userRole === 'merchant' || isMerchantPreview ? 'Líquido a Receber' : 'Lucro Líquido', 
            val: `R$ ${(effectiveDashboardData.netProfit || 0).toFixed(2).replace('.', ',')}`, 
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

      {/* Monitor de Split do Ecossistema - Visão Admin Master */}
      {userRole === 'admin' && !isMerchantPreview && effectiveDashboardData.ecosystem && (
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-8 mb-8"
        >
          <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
             <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight italic uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">hub</span>
                  Monitor de Split do Ecossistema
                </h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Detalhamento de Repasses e Receita IZI</p>
             </div>
             <div className="flex gap-2">
                <div className="px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 text-[9px] font-black uppercase tracking-widest">Faturamento: R$ {effectiveDashboardData.totalRevenue.toLocaleString('pt-BR')}</div>
             </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {[
               { label: 'O QUE VAI PARA LOJISTAS', val: effectiveDashboardData.ecosystem.merchantPayout, sub: 'Líquido de Vendas Marketplace', icon: 'storefront', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
               { label: 'O QUE VAI PARA ENTREGADORES', val: effectiveDashboardData.ecosystem.driverPayout, sub: 'Taxas de Entrega e Gorjetas', icon: 'delivery_dining', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
               { label: 'O QUE VAI PARA PARCEIROS', val: effectiveDashboardData.ecosystem.partnerPayout, sub: 'Taxas de Retirada (Click & Retire)', icon: 'handshake', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
               { label: 'RECEITA BRUTA IZI DELIVERY', val: effectiveDashboardData.ecosystem.platformRevenue, sub: 'Comissões + Taxas de Serviço', icon: 'logo_dev', color: 'text-primary', bg: 'bg-primary/5' },
             ].map((item, i) => (
               <div key={i} className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-all group">
                  <div className={`size-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                     <span className="material-symbols-outlined font-black">{item.icon}</span>
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter italic">R$ {item.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1 opacity-60">{item.sub}</p>
               </div>
             ))}
          </div>

          <div className="px-8 pb-8 pt-4">
             <div className="bg-slate-900 dark:bg-black rounded-[24px] p-6 flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                <div className="flex-1 space-y-2">
                   <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-[0.2em] italic">Composição da Liquidez</p>
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Lucro Estimado: R$ {effectiveDashboardData.ecosystem.netPlatformProfit.toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="h-3 bg-white/5 rounded-full flex overflow-hidden border border-white/5">
                      <div className="h-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" style={{ width: `${(effectiveDashboardData.ecosystem.merchantPayout / (effectiveDashboardData.totalRevenue || 1)) * 100}%` }} />
                      <div className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]" style={{ width: `${(effectiveDashboardData.ecosystem.driverPayout / (effectiveDashboardData.totalRevenue || 1)) * 100}%` }} />
                      <div className="h-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" style={{ width: `${(effectiveDashboardData.ecosystem.partnerPayout / (effectiveDashboardData.totalRevenue || 1)) * 100}%` }} />
                      <div className="h-full bg-primary shadow-[0_0_15px_rgba(255,217,0,0.4)]" style={{ width: `${(effectiveDashboardData.ecosystem.platformRevenue / (effectiveDashboardData.totalRevenue || 1)) * 100}%` }} />
                   </div>
                </div>
                <div className="shrink-0 flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                   <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <span className="material-symbols-outlined font-black">verified_user</span>
                   </div>
                   <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Saldo Bloqueado</p>
                      <p className="text-sm font-black text-white italic">R$ {(effectiveDashboardData.totalRevenue * 0.05).toLocaleString('pt-BR')} <span className="text-[10px] text-slate-500 font-bold ml-1">(Reserva Cautelar)</span></p>
                   </div>
                </div>
             </div>
          </div>
        </motion.section>
      )}

      {/* Monitor de Entregas Avulsas - Estratégico Admin */}
      {userRole === 'admin' && !isMerchantPreview && <StandaloneDeliveriesMonitor />}

      {/* Conciliação & Repasses em Lote - Visão Admin Master */}
      {userRole === 'admin' && !isMerchantPreview && <BatchPayoutManager />}

      <div className="grid grid-cols-1 gap-8">
        {/* Economy Management Card - Replacing Divisão de Taxas */}
        {(!isMerchantPreview && userRole === 'admin') ? (
          <MasterFinancialControl />
        ) : (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5">
              <span className="material-symbols-outlined text-8xl">account_balance</span>
            </div>
            <div className="space-y-6 relative z-10">
               <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Perfil do Estabelecimento</p>
                 <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activeMerchant?.store_name || 'Loja Parceira'}</h4>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-5 rounded-[24px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 group-hover:border-primary/20 transition-all">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Taxa de Comissão</p>
                    <div className="flex items-end gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{(activeMerchant?.commission_percent ?? appSettings.appCommission ?? 12)}%</span>
                      <span className="text-[10px] font-bold text-slate-400 mb-1.5 whitespace-nowrap">por pedido concluído</span>
                    </div>
                  </div>
                  
                  <div className="p-5 rounded-[24px] bg-emerald-500/5 border border-emerald-500/10 transition-all">
                    <p className="text-[10px] font-black text-emerald-500/60 uppercase tracking-widest mb-2">Status do Repasse</p>
                     <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">Fluxo Ativo</span>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Requests Logic */}
      <WithdrawalRequestsSection />

      {/* Loans Management Section - Mostrar apenas no modo GLOBAL Admin */}
      {userRole === 'admin' && !isMerchantPreview && <ManageLoansSection />}

      {/* Pre-Approved Limits Section - Mostrar apenas no modo GLOBAL Admin */}
      {userRole === 'admin' && !isMerchantPreview && <PreApprovedLimitsSection />}

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-primary">history_edu</span>
            Histórico de Pedidos
          </h4>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            {displayOrders.length} pedidos encontrados
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
              {displayOrders.slice(0, 50).map((tr) => {
                const isPlatformOrder = !tr.merchant_id || tr.service_type === 'coin_purchase' || tr.service_type === 'subscription';
                const commRate = isPlatformOrder ? 0 : (activeMerchant?.commission_percent ?? appSettings.appCommission ?? 12);
                const commiss = (tr.total_price || 0) * (commRate / 100);
                const net = (tr.total_price || 0) - commiss;
                
                const clientName = tr.user_name || (tr.user ? tr.user.name : 'Consumidor');
                return (
                  <tr key={tr.id} className="hover:bg-primary/5 transition-colors group">
                    <td className="px-8 py-6 text-xs font-bold text-slate-500 dark:text-slate-400">
                      {new Date(tr.created_at).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase text-center">
                      #{tr.id.slice(0, 5)}
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">
                      <p className="line-clamp-1">{clientName || 'Cliente IZI'}</p>
                      <span className="text-[9px] font-black text-slate-400 block uppercase tracking-tighter">
                        {tr.service_type === 'coin_purchase' ? '🛒 App' : tr.service_type === 'entrega_avulsa' ? '📦 Entrega Avulsa' : tr.service_type || 'Pedido'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white">R$ {tr.total_price?.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-sm font-bold text-red-500/80">
                      {commiss > 0 ? `- R$ ${commiss.toFixed(2).replace('.', ',')}` : <span className="opacity-30">N/A</span>}
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-emerald-500">R$ {net.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-right">
                      <span className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        tr.status === 'concluido' || tr.status === 'delivered' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        tr.status === 'cancelado' || tr.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                      }`}>
                        {tr.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {displayOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center text-slate-400 text-sm font-bold">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StandaloneDeliveriesMonitor() {
  const { dashboardData, setActiveTab } = useAdmin();
  const metrics = dashboardData.standaloneMetrics;

  if (!metrics || metrics.count === 0) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mt-8 mb-8"
    >
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-blue-500/5">
         <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
               <span className="material-symbols-outlined text-blue-500 font-fill">local_shipping</span>
               Monitor de Entregas Avulsas
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Análise Estratégica de Volume e Eficiência por KM</p>
         </div>
         <div className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest">
            {metrics.count} Entregas Realizadas
         </div>
      </div>
      <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
            { label: 'Volume Total (Pedidos)', val: metrics.count, sub: 'Chamadas Avulsas', icon: 'numbers', color: 'text-slate-900 dark:text-white' },
            { label: 'Receita Total Avulsa', val: `R$ ${metrics.revenue.toLocaleString('pt-BR')}`, sub: 'Faturamento Bruto', icon: 'payments', color: 'text-emerald-500' },
            { label: 'Kilometragem Total', val: `${metrics.totalDistance.toFixed(1)} KM`, sub: 'Distância Percorrida', icon: 'distance', color: 'text-blue-500' },
            { label: 'Eficiência (Receita / KM)', val: `R$ ${metrics.avgRevenuePerKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, sub: 'Ticket Médio por KM', icon: 'query_stats', color: 'text-primary' },
         ].map((item, i) => (
            <div key={i} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-all">
               <div className="size-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 text-slate-400">
                  <span className="material-symbols-outlined font-black text-lg">{item.icon}</span>
               </div>
               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
               <h4 className={`text-xl font-black ${item.color} tracking-tight`}>{item.val}</h4>
               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1 opacity-60">{item.sub}</p>
            </div>
         ))}
      </div>
      <div className="px-8 pb-8 pt-4">
         <div className="p-6 rounded-[24px] bg-blue-500/5 border border-blue-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="size-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <span className="material-symbols-outlined font-black">insights</span>
               </div>
               <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Insight Estratégico</p>
                  <p className="text-xs text-slate-500">Seu ticket por KM está em <span className="font-bold text-blue-500">R$ {metrics.avgRevenuePerKm.toFixed(2)}</span>. Considere ajustar a Taxa por KM nas configurações caso queira otimizar a lucratividade.</p>
               </div>
            </div>
            <button 
              onClick={() => setActiveTab('settings')}
              className="h-10 px-6 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shrink-0"
            >
               Ajustar Taxas
            </button>
         </div>
      </div>
    </motion.section>
  );
}

function BatchPayoutManager() {
  const { allOrders, merchantsList, partnersList, handleSettlePayout, appSettings, userRole } = useAdmin();
  
  const pendingByMerchant = React.useMemo(() => {
    const map: Record<string, { amount: number, orderIds: string[], merchant: Merchant }> = {};
    
    allOrders.filter(o => (o.status === 'concluido' || o.status === 'delivered') && o.payout_status !== 'completed' && o.merchant_id).forEach(order => {
      const m = merchantsList.find(ml => ml.id === order.merchant_id);
      if (!m) return;
      
      if (!map[m.id]) map[m.id] = { amount: 0, orderIds: [], merchant: m };
      
      const productsPrice = (Number(order.total_price) || 0) - (Number(order.delivery_fee) || 0) - (Number(order.service_fee) || 0);
      const commRate = m.commission_percent ?? appSettings.appCommission ?? 12;
      const commission = productsPrice * (commRate / 100);
      let payout = productsPrice - commission;

      if (order.partner_id) {
        payout -= Number(appSettings.plan_fee_click_retire || 2.5);
      }

      map[m.id].amount += payout;
      map[m.id].orderIds.push(order.id);
    });
    
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [allOrders, merchantsList, appSettings]);

  const pendingByPartner = React.useMemo(() => {
    const map: Record<string, { amount: number, orderIds: string[], partner: PartnerStore }> = {};
    
    allOrders.filter(o => (o.status === 'concluido' || o.status === 'delivered') && o.payout_status !== 'completed' && o.partner_id).forEach(order => {
      const p = partnersList.find(pl => pl.id === order.partner_id);
      if (!p) return;
      
      if (!map[p.id]) map[p.id] = { amount: 0, orderIds: [], partner: p };
      
      map[p.id].amount += Number(appSettings.plan_fee_click_retire || 2.5);
      map[p.id].orderIds.push(order.id);
    });
    
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [allOrders, partnersList, appSettings]);

  const handleExportCSV = () => {
    const rows = [
      ['Nome', 'Tipo', 'Valor', 'Chave PIX', 'Banco', 'Agencia', 'Conta']
    ];

    pendingByMerchant.forEach(item => {
      const bank = (item.merchant as any).bank_info || {};
      rows.push([
        item.merchant.store_name || '',
        'Lojista',
        item.amount.toFixed(2).replace('.', ','),
        bank.pix_key || '',
        bank.bank || '',
        bank.agency || '',
        bank.account || ''
      ]);
    });

    pendingByPartner.forEach(item => {
      const bank = (item.partner as any).bank_info || {};
      rows.push([
        item.partner.name || '',
        'Parceiro',
        item.amount.toFixed(2).replace('.', ','),
        bank.pix_key || '',
        bank.bank || '',
        bank.agency || '',
        bank.account || ''
      ]);
    });

    const csvString = rows.map(r => r.join(';')).join('\n');
    const blob = new Blob(["\ufeff" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lote_pagamento_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toastSuccess('Arquivo de lote gerado com sucesso!');
  };

  if (pendingByMerchant.length === 0 && pendingByPartner.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden mt-8 mb-12"
    >
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-emerald-500/5">
         <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
               <span className="material-symbols-outlined text-emerald-500 font-fill">account_balance_wallet</span>
               Conciliação & Liquidação em Lote
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Gerencie repasses pendentes de forma consolidada</p>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Geral Pendente</span>
               <span className="text-xl font-black text-emerald-500">
                  R$ {(pendingByMerchant.reduce((a, b) => a + b.amount, 0) + pendingByPartner.reduce((a, b) => a + b.amount, 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
               </span>
            </div>
            <button 
              onClick={handleExportCSV}
              className="flex items-center gap-2 h-12 px-6 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
            >
               <span className="material-symbols-outlined text-sm">download</span>
               Gerar Arquivo de Lote
            </button>
         </div>
      </div>
      <div className="p-8 space-y-12">
         {pendingByMerchant.length > 0 && (
           <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span className="size-1.5 rounded-full bg-purple-500"></span>
                 Repasses para Lojistas (Marketplace)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pendingByMerchant.map(item => (
                   <div key={item.merchant.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-primary/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <span className="material-symbols-outlined text-4xl">storefront</span>
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate pr-8">{item.merchant.store_name}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-1">{item.orderIds.length} pedidos pendentes</p>
                      </div>
                      <div className="mt-8 flex items-end justify-between">
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Líquido</p>
                            <h5 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h5>
                         </div>
                         <button 
                           onClick={() => handleSettlePayout(item.merchant.id, 'merchant', item.amount, item.orderIds)}
                           className="h-11 px-6 rounded-2xl bg-primary text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                         >
                            Liquidar
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
         )}

         {pendingByPartner.length > 0 && (
           <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <span className="size-1.5 rounded-full bg-orange-500"></span>
                 Repasses para Parceiros (Pontos de Retirada)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {pendingByPartner.map(item => (
                   <div key={item.partner.id} className="p-6 rounded-[32px] bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col justify-between group hover:border-primary/30 transition-all relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <span className="material-symbols-outlined text-4xl">handshake</span>
                      </div>
                      <div>
                         <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate pr-8">{item.partner.name}</p>
                         <p className="text-[10px] font-bold text-slate-400 mt-1">{item.orderIds.length} retiradas pendentes</p>
                      </div>
                      <div className="mt-8 flex items-end justify-between">
                         <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxas de Retirada</p>
                            <h5 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">R$ {item.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h5>
                         </div>
                         <button 
                           onClick={() => handleSettlePayout(item.partner.id, 'partner', item.amount, item.orderIds)}
                           className="h-11 px-6 rounded-2xl bg-primary text-slate-900 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                         >
                            Liquidar
                         </button>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
         )}
      </div>
    </motion.div>
  );
}

function ManageLoansSection() {
  const [loans, setLoans] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedLoan, setSelectedLoan] = React.useState<any | null>(null);

  const fetchLoans = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('loans_delivery')
        .select(`
          *,
          user:users_delivery ( name, phone )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLoans(data || []);
    } catch (e) {
      console.error("Error fetching loans:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchLoans();
  }, [fetchLoans]);

  const totalEmprestado = loans.filter(l => l.status === 'active' || l.status === 'paid').reduce((a, l) => a + parseFloat(l.amount || 0), 0);
  const totalAReceber = loans.filter(l => l.status === 'active').reduce((a, l) => {
    const amt = parseFloat(l.amount || 0); const rate = parseFloat(l.interest_rate || 10) / 100; const inst = l.installments || 1;
    return a + (rate > 0 ? amt * (rate * Math.pow(1+rate,inst)) / (Math.pow(1+rate,inst)-1) * inst : amt);
  }, 0);
  const inadimplentes = loans.filter(l => l.status === 'active' && new Date(l.due_date) < new Date()).length;
  const pendentes = loans.filter(l => l.status === 'pending').length;

  if (loading && loans.length === 0) return null;

  return (
    <div className="space-y-6 mb-10">
      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Emprestado', val: `Z ${totalEmprestado.toLocaleString('pt-BR')}`, icon: 'account_balance', color: 'text-emerald-500 bg-emerald-50' },
          { label: 'Montante a Receber', val: `Z ${totalAReceber.toLocaleString('pt-BR', {maximumFractionDigits:0})}`, icon: 'savings', color: 'text-primary bg-primary/10' },
          { label: 'Inadimplentes', val: inadimplentes, icon: 'warning', color: inadimplentes > 0 ? 'text-red-500 bg-red-50' : 'text-slate-400 bg-slate-50' },
          { label: 'Aguardando Análise', val: pendentes, icon: 'hourglass_top', color: pendentes > 0 ? 'text-indigo-500 bg-indigo-50 animate-pulse' : 'text-slate-400 bg-slate-50' },
        ].map((k, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className={`size-10 rounded-xl ${k.color} flex items-center justify-center mb-3`}>
              <span className="material-symbols-outlined text-lg">{k.icon}</span>
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-1">{k.val}</p>
          </div>
        ))}
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-emerald-50/10 dark:bg-emerald-900/10 flex justify-between items-center">
          <div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-500 font-fill">account_balance</span>
              Estúdio de Empréstimos
            </h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {loans.length} registros • Juros compostos (Price) • Mora: 1% a.m. • Multa: 2%
            </p>
          </div>
          <button onClick={fetchLoans} className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
          </button>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Concedido</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">A Pagar</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parcelas</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimento</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {loans.map((l) => (
              <tr 
                key={l.id} 
                onClick={() => setSelectedLoan(l)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
              >
                <td className="px-8 py-6 text-xs text-slate-500 font-bold whitespace-nowrap">
                  {new Date(l.created_at).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{l.user?.name || 'Cliente Izi'}</p>
                  <p className="text-[9px] font-bold text-slate-400">{l.user?.phone || ''}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-emerald-500">Z {parseFloat(l.amount).toLocaleString('pt-BR')}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-slate-900 dark:text-white">Z {(parseFloat(l.amount) * (1 + (parseFloat(l.interest_rate) || 10) / 100)).toLocaleString('pt-BR')}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{l.installments || 1}x</p>
                </td>
                <td className="px-8 py-6">
                  <p className={`text-xs font-bold ${l.status === 'active' && new Date(l.due_date) < new Date() ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {l.status === 'pending' ? 'Sob Análise' : new Date(l.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </td>
                <td className="px-8 py-6 text-right">
                   <span className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        l.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        l.status === 'pending' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse' :
                        l.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                      }`}>
                     {l.status === 'paid' ? 'Liquidado' : l.status === 'pending' ? 'Pendente' : l.status === 'rejected' ? 'Recusado' : 'Ativo / Em Dia'}
                   </span>
                </td>
              </tr>
            ))}
            {loans.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <span className="material-symbols-outlined text-4xl">account_balance</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum empréstimo ativo</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedLoan && (
        <LoanDetailModal 
          loan={selectedLoan} 
          onClose={() => setSelectedLoan(null)} 
          onUpdate={fetchLoans}
        />
      )}
      </div>
    </div>
  );
}

function LoanDetailModal({ loan, onClose, onUpdate }: { loan: any, onClose: () => void, onUpdate: () => void }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [approvedAmount, setApprovedAmount] = React.useState(loan.amount || 0);
  const [approvedInstallments, setApprovedInstallments] = React.useState(loan.installments || 1);
  const [interestRate, setInterestRate] = React.useState(10);
  const [approvedDueDate, setApprovedDueDate] = React.useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });

  const handleApprove = async () => {
    const finalAmount = Number(approvedAmount);
    if (!finalAmount || finalAmount <= 0) return toastError("Defina um valor válido para liberação.");

    if (!window.confirm(`Deseja aprovar este crédito? Z ${finalAmount.toLocaleString('pt-BR')} serão enviados ao cliente imediatamente.`)) return;
    
    setIsProcessing(true);
    try {
      // Juros compostos - Tabela Price
      const mRate = interestRate / 100;
      const pmtVal = mRate > 0 
        ? finalAmount * (mRate * Math.pow(1+mRate, approvedInstallments)) / (Math.pow(1+mRate, approvedInstallments) - 1)
        : finalAmount / approvedInstallments;

      // 1. Atualizar o status e valores do empréstimo
      const { error: loanError } = await supabase
        .from('loans_delivery')
        .update({
          status: 'active',
          amount: finalAmount,
          interest_rate: interestRate,
          installments: approvedInstallments,
          installment_value: parseFloat(pmtVal.toFixed(2)),
          due_date: new Date(approvedDueDate).toISOString(),
          approved_at: new Date().toISOString()
        })
        .eq('id', loan.id);

      if (loanError) throw loanError;

      // 2. Buscar saldo atual do usuário e creditar as Izi Coins
      const { data: userData } = await supabase
        .from('users_delivery')
        .select('izi_coins')
        .eq('id', loan.user_id)
        .maybeSingle();
        
      const newBalance = (userData?.izi_coins || 0) + finalAmount;

      const { error: userError } = await supabase
        .from('users_delivery')
        .update({ izi_coins: newBalance })
        .eq('id', loan.user_id);

      if (userError) throw userError;

      // 3. Registrar a transação na carteira
      await supabase.from('wallet_transactions_delivery').insert({
        user_id: loan.user_id,
        type: 'loan_deposit',
        amount: finalAmount,
        status: 'completed',
        description: `Crédito Izi Liberado (Ref: #${loan.id.slice(0, 5)})`,
        balance_after: newBalance
      });

      toastSuccess("Empréstimo configurado e creditado!");
      onUpdate();
      onClose();
    } catch (e: any) {
      console.error("Erro na aprovação:", e);
      toastError("Erro ao aprovar: " + (e.message || "Erro desconhecido"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm("Deseja recusar este pedido de empréstimo?")) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('loans_delivery')
        .update({ status: 'rejected' })
        .eq('id', loan.id);
      
      if (error) throw error;
      toastSuccess("Pedido recusado.");
      onUpdate();
      onClose();
    } catch (e: any) {
      toastError("Erro ao recusar: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLiquidate = async () => {
    if (!window.confirm("Deseja liquidar este empréstimo manualmente? Isso marcará como Pago no sistema.")) return;
    
    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('loans_delivery')
        .update({ status: 'paid' })
        .eq('id', loan.id);
      
      if (error) throw error;
      toastSuccess("Empréstimo liquidado com sucesso!");
      onUpdate();
      onClose();
    } catch (e: any) {
      toastError("Erro ao liquidar: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined">account_balance</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Estúdio do Crédito</h2>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">#{loan.id.slice(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Info do cliente + status */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</p>
              <p className="text-sm font-black text-slate-900 dark:text-white">{loan.user?.name}</p>
              <p className="text-xs font-bold text-slate-500">{loan.user?.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status Atual</p>
              <span className={`inline-flex px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                loan.status === 'pending' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                loan.status === 'rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              }`}>
                {loan.status === 'paid' ? 'Liquidado' : loan.status === 'pending' ? 'Pendente' : loan.status === 'rejected' ? 'Recusado' : 'Ativo'}
              </span>
            </div>
          </div>

          {loan.status === 'pending' ? (
            <section className="space-y-6">
               <div className="p-6 rounded-[32px] bg-slate-900 border border-white/5 space-y-6">
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Configuração da Liberação (Aprovação)</p>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor a Liberar (Z)</label>
                       <input 
                         type="number"
                         value={approvedAmount}
                         onChange={(e) => setApprovedAmount(e.target.value)}
                         className="w-full bg-slate-800 border border-white/5 rounded-2xl px-5 py-4 text-white font-black text-lg outline-none focus:border-primary/50 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Taxa de Juros (%)</label>
                       <input 
                         type="number"
                         value={interestRate}
                         onChange={(e) => setInterestRate(Number(e.target.value))}
                         className="w-full bg-slate-800 border border-white/5 rounded-2xl px-5 py-4 text-white font-black text-lg outline-none focus:border-primary/50 transition-all"
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Parcelas</label>
                       <select 
                         value={approvedInstallments}
                         onChange={(e) => setApprovedInstallments(Number(e.target.value))}
                         className="w-full bg-slate-800 border border-white/5 rounded-2xl px-5 py-4 text-white font-black text-lg outline-none focus:border-primary/50 transition-all appearance-none"
                       >
                         {[1, 3, 6, 12, 18, 24].map(v => <option key={v} value={v}>{v}x</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Vencimento Inicial</label>
                       <input 
                         type="date"
                         value={approvedDueDate}
                         onChange={(e) => setApprovedDueDate(e.target.value)}
                         className="w-full bg-slate-800 border border-white/5 rounded-2xl px-5 py-4 text-white font-bold text-sm outline-none focus:border-primary/50 transition-all"
                       />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-2 px-2">
                     <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Parcela (Price):</p>
                       <p className="text-lg font-black text-white">
                         {approvedInstallments}x Z {(interestRate > 0 ? Number(approvedAmount) * ((interestRate/100) * Math.pow(1+interestRate/100, approvedInstallments)) / (Math.pow(1+interestRate/100, approvedInstallments) - 1) : Number(approvedAmount) / approvedInstallments).toFixed(2)}
                       </p>
                     </div>
                     <div className="flex justify-between items-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase">Montante Total:</p>
                       <p className="text-xl font-black text-emerald-400 italic">
                         Z {(interestRate > 0 ? Number(approvedAmount) * ((interestRate/100) * Math.pow(1+interestRate/100, approvedInstallments)) / (Math.pow(1+interestRate/100, approvedInstallments) - 1) * approvedInstallments : Number(approvedAmount)).toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                       </p>
                     </div>
                  </div>
               </div>
            </section>
          ) : (
            <>
              {(() => {
                const amt = parseFloat(loan.amount || 0);
                const rate = (parseFloat(loan.interest_rate) || 10) / 100;
                const inst = loan.installments || 1;
                const pmt = rate > 0 ? amt * (rate * Math.pow(1+rate, inst)) / (Math.pow(1+rate, inst) - 1) : amt / inst;
                const totalDue = pmt * inst;
                const isOverdue = loan.status === 'active' && new Date(loan.due_date) < new Date();
                const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(loan.due_date).getTime()) / 86400000) : 0;
                const multaAtraso = isOverdue ? pmt * 0.02 : 0; // 2% sobre parcela
                const moraTotal = isOverdue ? pmt * (0.01 / 30) * daysOverdue : 0; // 1% a.m. pro-rata
                return (
                  <div className="space-y-4">
                    {/* Valores principais */}
                    <div className="p-6 rounded-[24px] bg-slate-900 text-white grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Concedido</p>
                        <p className="text-2xl font-black">Z {amt.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Parcela (Price)</p>
                        <p className="text-2xl font-black text-emerald-400">{inst}x {pmt.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Montante</p>
                        <p className="text-2xl font-black text-emerald-400">Z {totalDue.toFixed(0)}</p>
                      </div>
                    </div>

                    {/* Grid de datas */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                        <span className="material-symbols-outlined text-slate-400 text-lg">calendar_today</span>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Contratação</p>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(loan.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-3 p-4 rounded-2xl ${isOverdue ? 'bg-red-50' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                        <span className={`material-symbols-outlined text-lg ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>event_busy</span>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Vencimento 1ª</p>
                          <p className={`text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{new Date(loan.due_date).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Amortização resumida */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amortização (Tabela Price)</p>
                      <div className="grid grid-cols-5 gap-2 text-[9px] font-black text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-2">
                        <span>Nº</span><span>Juros</span><span>Amort.</span><span>Parcela</span><span className="text-right">Saldo</span>
                      </div>
                      {(() => {
                        let saldo = amt;
                        const rows: React.ReactNode[] = [];
                        for (let i = 1; i <= Math.min(inst, 3); i++) {
                          const j = saldo * rate;
                          const a = pmt - j;
                          saldo = Math.max(saldo - a, 0);
                          rows.push(
                            <div key={i} className="grid grid-cols-5 gap-2 text-[10px] py-1.5 border-b border-slate-100 dark:border-slate-800 last:border-0">
                              <span className="font-black text-slate-700 dark:text-slate-300">{i}ª</span>
                              <span className="text-red-400 font-bold">{j.toFixed(2)}</span>
                              <span className="text-emerald-500 font-bold">{a.toFixed(2)}</span>
                              <span className="font-bold text-slate-600">{pmt.toFixed(2)}</span>
                              <span className="font-black text-slate-700 dark:text-slate-300 text-right">{saldo.toFixed(2)}</span>
                            </div>
                          );
                        }
                        return rows;
                      })()}
                      {inst > 3 && <p className="text-[9px] text-slate-300 text-center font-bold">+ {inst - 3} parcelas restantes</p>}
                    </div>

                    {/* Multa e Mora */}
                    {isOverdue && (
                      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-red-500 text-lg">gpp_maybe</span>
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atraso Detectado ({daysOverdue} dias)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-[9px] font-bold text-red-400 uppercase">Multa (2%)</p>
                            <p className="font-black text-red-600">R$ {multaAtraso.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-red-400 uppercase">Mora (1% a.m. pro-rata)</p>
                            <p className="font-black text-red-600">R$ {moraTotal.toFixed(2)}</p>
                          </div>
                        </div>
                        <p className="text-[9px] font-bold text-red-400 mt-2">Total com encargos: <span className="text-red-700 font-black">R$ {(pmt + multaAtraso + moraTotal).toFixed(2)}</span></p>
                      </div>
                    )}

                    {/* Regras legais */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/20 space-y-0.5">
                      <p className="text-[8px] font-bold text-slate-400">• Juros compostos (Tabela Price) • CET: {((Math.pow(1+rate,12)-1)*100).toFixed(1)}% a.a.</p>
                      <p className="text-[8px] font-bold text-slate-400">• Multa: 2% sobre parcela vencida (CDC Art. 52) • Mora: 1% a.m. pro-rata (CC Art. 406)</p>
                    </div>
                  </div>
                );
              })()}
            </>
          )}

          <div className="flex gap-4">
             {loan.status === 'pending' ? (
                <>
                  <button 
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="flex-1 h-14 rounded-2xl bg-red-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? '...' : 'Recusar'}
                  </button>
                   <button 
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-[2] h-14 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isProcessing ? 'Aprovando...' : 'Aprovar Crédito'}
                  </button>
                </>
             ) : (
                <>
                  <button 
                    onClick={onClose}
                    className="flex-1 h-14 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Fechar
                  </button>
                  {loan.status === 'active' && (
                    <button 
                      onClick={handleLiquidate}
                      disabled={isProcessing}
                      className="flex-[2] h-14 rounded-2xl bg-emerald-500 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isProcessing ? 'Liquidando...' : 'Liquidar Manualmente'}
                    </button>
                  )}
                </>
             )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
function PreApprovedLimitsSection() {
  const [search, setSearch] = React.useState('');
  const [foundUsers, setFoundUsers] = React.useState<any[]>([]);
  const [globalLimit, setGlobalLimit] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [savingId, setSavingId] = React.useState<string | null>(null);

  const fetchGlobalLimit = async () => {
    const { data } = await supabase
      .from('app_settings_delivery')
      .select('global_pre_approved_limit')
      .maybeSingle();
    if (data) setGlobalLimit(data.global_pre_approved_limit || 0);
  };

  const handleUpdateGlobal = async (val: number) => {
    setGlobalLimit(val);
    const { error } = await supabase
      .from('app_settings_delivery')
      .update({ global_pre_approved_limit: val })
      .eq('id', 'c568f69e-1e96-48c3-8e7c-8e8e8e8e8e8e');
    if (!error) toastSuccess('Limite global atualizado!');
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setFoundUsers([]);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('users_delivery')
      .select('id, name, email, phone, pre_approved_limit, avatar_url')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(3);
    setFoundUsers(data || []);
    setLoading(false);
  };

  const updateIndividualLimit = async (userId: string, newLimit: number) => {
    setSavingId(userId);
    const { error } = await supabase.from('users_delivery').update({ pre_approved_limit: newLimit }).eq('id', userId);
    if (!error) {
      toastSuccess('Limite individual atualizado!');
      setFoundUsers(prev => prev.map(u => u.id === userId ? { ...u, pre_approved_limit: newLimit } : u));
    }
    setSavingId(null);
  };

  React.useEffect(() => { fetchGlobalLimit(); }, []);

  return (
    <div className="space-y-6 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GLOBAL LIMIT CONFIG */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[40px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <span className="material-symbols-outlined font-fill">public</span>
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Limite Base</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Válido para todos os novos usuários</p>
            </div>
            
            <div className="mt-10">
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-sm font-black text-primary">Z</span>
                <input 
                  type="number"
                  value={globalLimit}
                  onChange={(e) => setGlobalLimit(parseFloat(e.target.value) || 0)}
                  onBlur={(e) => handleUpdateGlobal(parseFloat(e.target.value) || 0)}
                  className="bg-transparent text-4xl font-black text-slate-900 dark:text-white outline-none w-full border-b-2 border-slate-100 dark:border-slate-800 focus:border-primary transition-all pb-2 tabular-nums"
                />
              </div>
              <p className="text-[9px] text-slate-500 font-bold italic tracking-tight">Alteração reflete instantaneamente para clientes sem limite customizado</p>
            </div>
          </div>
        </div>

        {/* INDIVIDUAL SEARCH & MANAGE */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-8">
            <header className="flex justify-between items-center">
              <div>
                <h4 className="text-xl font-black text-white uppercase tracking-tight">Gestão Individual</h4>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-1">Busque um cliente para atribuir teto VIP</p>
              </div>
              {loading && <div className="size-5 border-2 border-primary border-t-transparent animate-spin rounded-full" />}
            </header>

            <div className="relative">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-white/20 text-2xl">search</span>
              <input 
                type="text"
                placeholder="Nome, e-mail ou telefone do cliente..."
                value={search}
                onChange={(e) => { 
                  setSearch(e.target.value);
                  searchUsers(e.target.value);
                }}
                className="w-full h-16 pl-16 pr-6 bg-white/5 border border-white/10 rounded-2xl text-white font-black text-lg outline-none focus:bg-white/10 focus:border-primary/50 transition-all placeholder:text-white/10"
              />
            </div>

            <div className="space-y-3">
              {foundUsers.map(user => (
                <div key={user.id} className="bg-white/5 border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-slate-800 flex items-center justify-center overflow-hidden">
                       {user.avatar_url ? <img src={user.avatar_url} className="size-full object-cover" /> : <span className="material-symbols-outlined text-white/20">person</span>}
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-white uppercase">{user.name || 'Sem Nome'}</h5>
                      <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-white/20 uppercase mb-1">Limite Atual</p>
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-black text-lg">Z</span>
                        <input 
                          type="number"
                          defaultValue={user.pre_approved_limit || 0}
                          onBlur={(e) => updateIndividualLimit(user.id, parseFloat(e.target.value) || 0)}
                          className="w-24 bg-slate-800/50 border border-white/5 rounded-xl px-3 py-2 text-white font-black text-center outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                       <button 
                        onClick={() => updateIndividualLimit(user.id, (user.pre_approved_limit || 0) + 500)}
                        className="size-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all scale-90"
                       >
                         <span className="material-symbols-outlined text-sm">add</span>
                       </button>
                       <button 
                        onClick={() => updateIndividualLimit(user.id, Math.max(0, (user.pre_approved_limit || 0) - 500))}
                        className="size-8 rounded-lg bg-white/5 text-white/40 flex items-center justify-center hover:bg-white/10 hover:text-white transition-all scale-90"
                       >
                         <span className="material-symbols-outlined text-sm">remove</span>
                       </button>
                    </div>
                  </div>
                </div>
              ))}
              {search.length >= 2 && foundUsers.length === 0 && !loading && (
                <p className="text-center py-6 text-[10px] font-bold text-white/10 uppercase tracking-[0.3em]">Nenhum usuário encontrado</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MasterFinancialControl() {
  const { appSettings, setAppSettings, handleSaveAppSettings, globalSettings, setGlobalSettings, saveGlobalSettings } = useAdmin();
  const [saving, setSaving] = React.useState(false);

  const handleUpdate = (field: keyof AppSettings, val: any) => {
    setAppSettings(prev => ({ ...prev, [field]: val }));
  };

  const toggleMethod = (method: string) => {
    const current = appSettings.paymentmethodsactive || {};
    const updated = { ...current, [method]: !current[method] };
    handleUpdate('paymentmethodsactive', updated);
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await handleSaveAppSettings();
      if (globalSettings) {
        await saveGlobalSettings(globalSettings);
      }
      toastSuccess('Configurações sincronizadas!');
    } catch (err) {
      toastError('Erro ao sincronizar');
    } finally {
      setSaving(false);
    }
  };

  if (!appSettings) return (
    <div className="animate-pulse space-y-4 pt-10">
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
    </div>
  );

  return (
    <div className="space-y-6">
       {/* 1. GATEWAYS CONTROL CARD */}
       <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-center mb-8">
            <div className="flex flex-col gap-1">
               <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight italic">Gateways Ativos</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Controle de Meios de Pagamento Disponíveis</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={onSave}
                disabled={saving}
                className="h-10 px-6 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {saving ? (
                  <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <span className="material-symbols-outlined text-lg">save</span>
                )}
                Salvar
              </button>
              <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${saving ? 'bg-primary/20 text-primary' : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}>
                {saving ? 'Sincronizando...' : 'Online'}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             {[
               { id: 'pix', label: 'PIX', icon: 'qrcode', color: 'text-emerald-500' },
               { id: 'card', label: 'Cartão', icon: 'credit_card', color: 'text-blue-500' },
               { id: 'lightning', label: 'Bitcoin', icon: 'currency_bitcoin', color: 'text-amber-500' },
               { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet', color: 'text-primary' }
             ].map((m) => (
               <button 
                 key={m.id}
                 onClick={() => toggleMethod(m.id)}
                 className={`flex flex-col items-center justify-center p-6 rounded-[32px] transition-all border ${
                   appSettings.paymentmethodsactive?.[m.id] 
                   ? 'bg-white dark:bg-slate-900 shadow-md border-slate-200/50 dark:border-slate-700' 
                   : 'bg-slate-50 dark:bg-slate-800/20 border-transparent opacity-40 hover:opacity-60 grayscale'
                 }`}
               >
                  <span className={`material-symbols-outlined ${m.color} text-3xl mb-3`}>{m.icon}</span>
                  <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{m.label}</span>
                  <div className={`mt-3 h-1.5 w-8 rounded-full ${appSettings.paymentmethodsactive?.[m.id] ? 'bg-primary shadow-[0_0_10px_rgba(255,217,0,0.5)]' : 'bg-slate-300'}`} />
               </button>
             ))}
          </div>
       </div>

       {/* 2. GLOBAL ECONOMY RATES CARD */}
       <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-100 dark:border-indigo-500/20">
                     <span className="material-symbols-outlined text-xl">percent</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Taxa de Serviço Global</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <input 
                   type="number" step="0.1"
                   value={appSettings.serviceFee}
                   onChange={(e) => handleUpdate('serviceFee', parseFloat(e.target.value))}
                   className="w-12 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
                 <span className="text-[11px] text-slate-400 font-black">%</span>
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
                     <span className="material-symbols-outlined text-xl">monetization_on</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Valor Moeda (1 Z)</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <span className="text-[11px] text-slate-400 font-black">R$</span>
                 <input 
                   type="number" step="0.01"
                   value={globalSettings?.izi_coin_value ?? appSettings.iziCoinRate}
                   onChange={(e) => {
                     const val = parseFloat(e.target.value) || 0;
                     handleUpdate('iziCoinRate', val);
                     if (globalSettings) {
                       setGlobalSettings({ ...globalSettings, izi_coin_value: val });
                     }
                   }}
                   className="w-16 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-100 dark:border-amber-500/20">
                     <span className="material-symbols-outlined text-xl">trending_up</span>
                  </div>
                  <span className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Juros Empréstimo</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <input 
                   type="number" step="0.1"
                   value={appSettings.loan_interest_rate}
                   onChange={(e) => handleUpdate('loan_interest_rate', parseFloat(e.target.value))}
                   className="w-12 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
                 <span className="text-[11px] text-slate-400 font-black">%</span>
               </div>
            </div>
          </div>
       </div>

       {/* 3. PLAN SUBSCRIPTION FEES CARD */}
       <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="space-y-5">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 mb-4 italic">Mensalidades dos Planos</p>
            
            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-100 dark:border-blue-500/20">
                     <span className="material-symbols-outlined text-xl">storefront</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plano Market (R$)</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <input 
                   type="number" step="0.01"
                   value={appSettings.plan_fee_market || 0}
                   onChange={(e) => handleUpdate('plan_fee_market', parseFloat(e.target.value))}
                   className="w-20 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-500 border border-purple-100 dark:border-purple-500/20">
                     <span className="material-symbols-outlined text-xl">workspace_premium</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plano Full (R$)</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <input 
                   type="number" step="0.01"
                   value={appSettings.plan_fee_full || 0}
                   onChange={(e) => handleUpdate('plan_fee_full', parseFloat(e.target.value))}
                   className="w-20 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-100 dark:border-orange-500/20">
                     <span className="material-symbols-outlined text-xl">auto_transmission</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plano Avulso (R$)</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <input 
                   type="number" step="0.01"
                   value={appSettings.plan_fee_avulso || 0}
                   onChange={(e) => handleUpdate('plan_fee_avulso', parseFloat(e.target.value))}
                   className="w-20 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
               </div>
            </div>

            <div className="flex items-center justify-between px-2">
               <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-100 dark:border-emerald-500/20">
                     <span className="material-symbols-outlined text-xl">handshake</span>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Plano Click & Retire (R$)</span>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-inner">
                 <input 
                   type="number" step="0.01"
                   value={appSettings.plan_fee_click_retire || 0}
                   onChange={(e) => handleUpdate('plan_fee_click_retire', parseFloat(e.target.value))}
                   className="w-20 bg-transparent text-sm font-black text-slate-900 dark:text-white outline-none text-right"
                 />
               </div>
            </div>
          </div>
       </div>

       {/* 4. WITHDRAWAL RULES CARD (DARK THEME) */}
       <div className="p-10 rounded-[40px] bg-slate-900 border border-white/10 space-y-7 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-primary">account_balance</span>
          </div>

          <div className="flex items-center justify-between relative z-10">
            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em] flex items-center gap-3">
               <span className="material-symbols-outlined text-xl text-primary font-fill">payments</span>
               Regras de Liquidez
            </p>
            <span className="material-symbols-outlined text-white/20">account_balance</span>
          </div>
          
          <div className="space-y-5 relative z-10">
            <div className="flex justify-between items-center group/item">
               <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Taxa de Saque</span>
               <div className="flex items-center gap-3">
                  <input 
                    type="number" step="0.5"
                    value={appSettings.withdrawalfeepercent ?? 0}
                    onChange={(e) => handleUpdate('withdrawalfeepercent', parseFloat(e.target.value) || 0)}
                    className="w-16 bg-white/5 border border-white/10 rounded-[18px] py-2 px-4 text-white font-black text-right text-sm outline-none focus:border-primary focus:bg-white/10 transition-all"
                  />
                  <span className="text-[10px] text-white/30 font-black">%</span>
               </div>
            </div>

            <div className="flex justify-between items-center group/item">
               <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Valor Mínimo</span>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/30 font-black">R$</span>
                  <input 
                    type="number"
                    value={appSettings.minwithdrawalamount ?? 0}
                    onChange={(e) => handleUpdate('minwithdrawalamount', parseFloat(e.target.value) || 0)}
                    className="w-20 bg-white/5 border border-white/10 rounded-[18px] py-2 px-4 text-white font-black text-right text-sm outline-none focus:border-primary focus:bg-white/10 transition-all"
                  />
               </div>
            </div>

            <div className="flex justify-between items-center group/item">
               <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Prazo (Horas)</span>
               <div className="flex items-center gap-3">
                  <input 
                    type="number"
                    value={appSettings.withdrawal_period_h ?? 24}
                    onChange={(e) => handleUpdate('withdrawal_period_h', parseInt(e.target.value) || 24)}
                    className="w-16 bg-white/5 border border-white/10 rounded-[18px] py-2 px-4 text-white font-black text-right text-sm outline-none focus:border-primary focus:bg-white/10 transition-all"
                  />
                  <span className="text-[10px] text-white/30 font-black uppercase">H</span>
               </div>
            </div>

            <div className="flex justify-between items-center group/item">
               <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">Dia de Pagamento</span>
               <input 
                 type="text"
                 value={appSettings.withdrawal_day || 'Sexta-feira'}
                 onChange={(e) => handleUpdate('withdrawal_day', e.target.value)}
                 className="w-36 bg-white/5 border border-white/10 rounded-[18px] py-2 px-4 text-white font-black text-right text-[10px] outline-none focus:border-primary focus:bg-white/10 uppercase tracking-widest transition-all"
               />
            </div>
          </div>

          <button 
            onClick={onSave}
            disabled={saving}
            className="w-full mt-4 h-14 bg-primary text-slate-900 rounded-[24px] font-black text-[11px] uppercase tracking-[0.25em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-primary/20 relative z-10"
          >
            {saving ? (
              <div className="size-5 border-3 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
            ) : (
              <>
                <span className="material-symbols-outlined text-xl">sync_alt</span>
                Sincronizar Regras
              </>
            )}
          </button>
       </div>
    </div>
  );
}

function WithdrawalRequestsSection() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [receiptFiles, setReceiptFiles] = React.useState<Record<string, File>>({});

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data: txs, error } = await supabase
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('type', 'saque')
        .eq('status', 'pendente')
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (txs && txs.length > 0) {
        const uids = [...new Set(txs.map((t: any) => t.user_id).filter(Boolean))];
        
        // Buscar em Drivers e AdminUsers simultaneamente
        const [ { data: drivers }, { data: admins } ] = await Promise.all([
          supabase.from('drivers_delivery').select('id, name, phone, bank_info').in('id', uids),
          supabase.from('admin_users').select('id, store_name, email, role, bank_info').in('id', uids)
        ]);

        const mapped = txs.map((t: any) => {
          const driver = drivers?.find((d: any) => d.id === t.user_id);
          const admin = admins?.find((a: any) => a.id === t.user_id);
          
          let entityInfo: any = null;
          let typeLabel = 'Desconhecido';
          let typeColor = 'bg-slate-100 text-slate-500';

          if (driver) {
            entityInfo = {
              name: driver.name,
              contact: driver.phone,
              pix_key: driver.bank_info?.pix_key,
              bank: driver.bank_info?.bank
            };
            typeLabel = 'Entregador';
            typeColor = 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
          } else if (admin) {
            entityInfo = {
              name: admin.store_name || admin.email,
              contact: admin.email,
              pix_key: admin.bank_info?.pix_key,
              bank: admin.bank_info?.bank
            };
            typeLabel = admin.role === 'merchant' ? 'Lojista' : 'Parceiro';
            typeColor = 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
          }

          return {
            ...t,
            user: entityInfo,
            typeLabel,
            typeColor
          };
        });
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.error('Error fetching withdrawal requests:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleProcessPayment = async (id: string) => {
    if (!receiptFiles[id]) {
      if (!window.confirm("Você está aprovando este saque sem anexar um comprovante. Deseja continuar?")) return;
    }

    setProcessingId(id);
    try {
      let receiptUrl = '';
      const file = receiptFiles[id];

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `receipt_${id}_${Date.now()}.${fileExt}`;
        const filePath = fileName;

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('receipts')
          .getPublicUrl(filePath);

        receiptUrl = publicUrlData.publicUrl;
      }

      const payload: any = { status: 'concluido' };
      if (receiptUrl) payload.receipt_url = receiptUrl;

      const { error } = await supabase
        .from('wallet_transactions_delivery')
        .update(payload)
        .eq('id', id);

      if (error) throw error;
      toastSuccess('Saque aprovado com sucesso!');
      fetchRequests();
    } catch (e: any) {
      toastError('Erro ao processar saque: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <section className="space-y-6 mb-12">
      <div className="flex items-center justify-between px-2">
        <div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic uppercase">
            <span className="material-symbols-outlined text-primary font-fill">payments</span>
            Fila de Liquidação Financeira
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {requests.length} solicitações pendentes de análise e pagamento
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="size-11 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm active:scale-90"
        >
          <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
        </button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="py-20 flex flex-col items-center gap-4">
          <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando fila...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] py-20 flex flex-col items-center gap-3 opacity-60">
          <span className="material-symbols-outlined text-5xl text-slate-300">verified_user</span>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tudo em dia! Nenhuma solicitação pendente.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {requests.map((r) => (
            <motion.div 
              key={r.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-900 rounded-[36px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden group hover:border-primary/40 transition-all flex flex-col"
            >
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-start justify-between bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex flex-col gap-1.5">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border w-fit ${r.typeColor}`}>
                    {r.typeLabel}
                  </span>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                    {new Date(r.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor do Saque</p>
                  <h5 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter italic">
                    R$ {parseFloat(r.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </h5>
                </div>
              </div>

              <div className="p-6 flex-1 space-y-5">
                <div className="flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 border ${r.typeLabel === 'Entregador' ? 'bg-emerald-50 text-emerald-500 border-emerald-100' : 'bg-indigo-50 text-indigo-500 border-indigo-100'}`}>
                    <span className="material-symbols-outlined font-black">
                      {r.typeLabel === 'Entregador' ? 'moped' : 'storefront'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase truncate">{r.user?.name || 'Titular Indisponível'}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{r.user?.contact || 'Sem contato'}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Informação de Pagamento</span>
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">PIX Ativo</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-500 text-lg">qr_code_2</span>
                    <p className="text-xs font-black text-slate-900 dark:text-white break-all select-all">{r.user?.pix_key || 'CHAVE NÃO INFORMADA'}</p>
                  </div>
                  {r.user?.bank && (
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2 ml-7 italic">{r.user.bank}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary/40 cursor-pointer transition-all group/file relative overflow-hidden">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) setReceiptFiles(prev => ({ ...prev, [r.id]: f }));
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover/file:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm">{receiptFiles[r.id] ? 'check_circle' : 'attach_file'}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[9px] font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        {receiptFiles[r.id] ? receiptFiles[r.id].name : 'Anexar Comprovante'}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase opacity-60">PDF, JPG ou PNG</p>
                    </div>
                  </label>

                  <button
                    disabled={processingId === r.id}
                    onClick={() => handleProcessPayment(r.id)}
                    className="w-full h-12 rounded-[20px] bg-primary text-slate-900 font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processingId === r.id ? (
                      <div className="size-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        Confirmar Pagamento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
