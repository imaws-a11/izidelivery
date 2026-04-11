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
    userRole, merchantProfile, selectedMerchantPreview, merchantsList
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
      const commRate = selectedMerchantPreview.commission_percent ?? appSettings.appCommission ?? 12;
      totalCommission += (Number(order.total_price) || 0) * (commRate / 100);

      const orderDate = new Date(order.created_at);
      const diffDays = Math.floor((today.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const dayIdx = orderDate.getDay();
        dailyRev[dayIdx] += (Number(order.total_price) || 0);
      }
    });

    return {
      ...globalDashboardData,
      totalRevenue,
      completedOrdersCount,
      avgTicket,
      deliverySuccessRate,
      totalCommission,
      netProfit: totalRevenue - totalCommission,
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Economy Management Card - Replacing Divisão de Taxas */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-8xl">account_balance</span>
          </div>
          {(!isMerchantPreview && userRole === 'admin') ? (
            <MasterFinancialControl />
          ) : (
            <div className="space-y-6 relative z-10">
               <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Perfil do Estabelecimento</p>
                 <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{activeMerchant?.store_name || 'Loja Parceira'}</h4>
               </div>
               
               <div className="grid grid-cols-1 gap-4">
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
          )}
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
            {(effectiveDashboardData.dailyRevenue || []).map((val: number, i: number) => {
              const maxVal = Math.max(...(effectiveDashboardData.dailyRevenue || [1]), 1);
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
                        {tr.service_type === 'coin_purchase' ? '🛒 App' : tr.service_type || 'Pedido'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-slate-900 dark:text-white">R$ {tr.total_price?.toFixed(2).replace('.', ',')}</td>
                    <td className="px-8 py-6 text-sm font-bold text-red-500/80">
                      {commiss > 0 ? `- R$ ${commiss.toFixed(2).replace('.', ',')}` : <span className="opacity-30">N/A</span>}
                    </td>
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

function WithdrawalRequestsSection() {
  const [requests, setRequests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const fetchWithdrawals = React.useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all pending 'saque' transactions
      // REMOVIDO: nested select 'driver:drivers_delivery' pois causa erro se não houver FK no banco
      const { data: txs, error } = await supabase
        .from('wallet_transactions_delivery')
        .select('*')
        .eq('type', 'saque')
        .eq('status', 'pendente')
        .order('created_at', { ascending: false });

      if (error) {
          console.warn("[WITHDRAWAL] Erro na query principal:", error.message);
          throw error;
      }

      // 2. Map driver names
      if (txs && txs.length > 0) {
        const uids = txs.map(t => t.user_id);
        const { data: drivers } = await supabase
          .from('drivers_delivery')
          .select('id, name')
          .in('id', uids);
        
        const mapped = txs.map(t => ({
          ...t,
          driver_name: drivers?.find(d => d.id === t.user_id)?.name || 'Piloto IZI'
        }));
        setRequests(mapped);
      } else {
        setRequests([]);
      }
    } catch (e) {
      console.error("Error fetching withdrawals:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchWithdrawals();
  }, [fetchWithdrawals]);

  const handleProcessPayment = async (id: string) => {
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('wallet_transactions_delivery')
        .update({ status: 'concluido' })
        .eq('id', id);

      if (error) throw error;
      toastSuccess('Pagamento confirmado com sucesso!');
      fetchWithdrawals();
    } catch (e: any) {
      toastError('Erro ao processar pagamento: ' + e.message);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm p-20 flex flex-col items-center justify-center gap-4 mb-10">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Fluxo de Saques...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-amber-50/20 dark:bg-amber-900/10 flex justify-between items-center">
         <div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-amber-500 font-fill">payouts</span>
            Saques Pendentes (Pilotos)
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {requests.length} solicitações aguardando transferência PIX
          </p>
         </div>
         <button onClick={fetchWithdrawals} className="size-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-all shadow-sm">
            <span className={`material-symbols-outlined ${loading ? 'animate-spin' : ''}`}>sync</span>
         </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Solicitado em</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregador</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Chave PIX / Descrição</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-8 py-6 text-xs text-slate-500 font-bold">
                  {new Date(r.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="px-8 py-6">
                  <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{r.driver_name}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-lg font-black text-red-500">R$ {parseFloat(r.amount).toFixed(2)}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {r.description || 'N/A'}
                  </p>
                </td>
                <td className="px-8 py-6 text-right">
                  <button 
                    disabled={processingId === r.id}
                    onClick={() => handleProcessPayment(r.id)}
                    className="h-10 px-6 rounded-2xl bg-primary text-slate-900 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {processingId === r.id ? 'Processando...' : 'Confirmar Pagamento'}
                  </button>
                </td>
              </tr>
            ))}
            {requests.length === 0 && !loading && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 opacity-30">
                    <span className="material-symbols-outlined text-4xl">inventory_2</span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nenhum saque pendente no momento</p>
                  </div>
                </td>
              </tr>
            )}
            {loading && requests.length === 0 && (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscando solicitações...</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
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

  if (loading && loans.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-emerald-50/10 dark:bg-emerald-900/10 flex justify-between items-center">
         <div>
          <h4 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-outlined text-emerald-500 font-fill">account_balance</span>
            Gestão de Empréstimos (Izi Coins)
          </h4>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
            {loans.filter(l => l.status === 'active').length} empréstimos ativos • Taxa Global: 10% am
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
                  <p className="text-sm font-black text-slate-900 dark:text-white">Z {parseFloat(l.total_payable).toLocaleString('pt-BR')}</p>
                </td>
                <td className="px-8 py-6">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{l.installments_count || l.requested_installments || 1}x</p>
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
  );
}

function LoanDetailModal({ loan, onClose, onUpdate }: { loan: any, onClose: () => void, onUpdate: () => void }) {
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [approvedAmount, setApprovedAmount] = React.useState(loan.requested_amount || loan.amount || 0);
  const [approvedInstallments, setApprovedInstallments] = React.useState(loan.requested_installments || loan.installments_count || 1);
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
      const { data: rpcData, error: rpcError } = await supabase.rpc('approve_loan_v4', {
        p_loan_id: loan.id,
        p_admin_id: 'admin',
        p_amount: finalAmount,
        p_total_payable: finalAmount * (1 + (interestRate / 100)),
        p_interest_rate: interestRate,
        p_installments: approvedInstallments,
        p_due_date: new Date(approvedDueDate).toISOString()
      });

      if (rpcError) throw rpcError;
      
      const result = rpcData as { success: boolean, error?: string };
      if (result && !result.success) {
        throw new Error(result.error || 'Erro desconhecido na execução da RPC');
      }

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <span className="material-symbols-outlined font-fill">account_balance</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Detalhamento do Crédito</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: #{loan.id.slice(0,8)}</p>
            </div>
          </div>
          <button onClick={onClose} className="size-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-8">
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
                  {loan.status === 'paid' ? 'Liquidado' : loan.status === 'pending' ? 'Pendente' : loan.status === 'rejected' ? 'Recusado' : 'Ativo / Em curso'}
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

                  <div className="pt-4 border-t border-white/5 flex justify-between items-center px-2">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Projeção de Dívida:</p>
                     <p className="text-xl font-black text-emerald-400 italic">Z {(Number(approvedAmount) * (1 + (interestRate / 100))).toLocaleString('pt-BR')}</p>
                  </div>
               </div>
            </section>
          ) : (
            <>
              <div className="p-8 rounded-[32px] bg-slate-900 text-white relative overflow-hidden">
                <div className="relative z-10 grid grid-cols-2 gap-6">
                   <div>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Valor Concedido</p>
                      <p className="text-3xl font-black italic">Z {parseFloat(loan.amount).toLocaleString('pt-BR')}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Montante Devido ({loan.interest_rate || 10}%)</p>
                      <p className="text-3xl font-black italic text-emerald-400">Z {parseFloat(loan.total_payable).toLocaleString('pt-BR')}</p>
                   </div>
                </div>
                <div className="absolute top-0 right-1/2 w-px h-full bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-6 pb-6 border-b border-slate-50 dark:border-slate-800">
                 <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-lg">calendar_today</span>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contratação</p>
                       <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(loan.created_at).toLocaleString('pt-BR')}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-xl flex items-center justify-center ${new Date(loan.due_date) < new Date() && loan.status === 'active' ? 'bg-red-50 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <span className="material-symbols-outlined text-lg">event_busy</span>
                    </div>
                    <div>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vencimento</p>
                       <p className={`text-xs font-bold ${new Date(loan.due_date) < new Date() && loan.status === 'active' ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>{new Date(loan.due_date).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
              </div>
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
    const { data } = await supabase.from('admin_settings_delivery').select('global_pre_approved_limit').single();
    if (data) setGlobalLimit(data.global_pre_approved_limit || 0);
  };

  const handleUpdateGlobal = async (val: number) => {
    setGlobalLimit(val);
    const { error } = await supabase.from('admin_settings_delivery').update({ global_pre_approved_limit: val }).eq('id', '00000000-0000-0000-0000-000000000000');
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
  const { globalSettings, saveGlobalSettings, fetchGlobalSettings } = useAdmin();
  const [saving, setSaving] = React.useState(false);

  const settings = globalSettings || {
    payment_methods_active: { pix: true, card: true, lightning: false, wallet: true },
    withdrawal_fee_percent: 2.5,
    min_withdrawal_amount: 50.0,
    service_fee_percent: 5.0,
    izi_coin_value: 0.01,
    loan_interest_rate: 12.0
  };

  const handleUpdate = async (field: string, val: any) => {
    setSaving(true);
    try {
      const newSettings = { ...settings, [field]: val };
      await saveGlobalSettings(newSettings);
      toastSuccess('Configuração atualizada!');
    } catch (err) {
      toastError('Erro ao salvar alteração');
    } finally {
      setSaving(false);
    }
  };

  const toggleMethod = (method: string) => {
    const current = settings.payment_methods_active || {};
    const updated = { ...current, [method]: !current[method] };
    handleUpdate('payment_methods_active', updated);
  };

  if (!globalSettings) return (
    <div className="animate-pulse space-y-4 pt-10">
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
      <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-3xl" />
    </div>
  );

  return (
    <div className="space-y-8">
       {/* GATEWAYS CONTROL */}
       <div>
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Gateways Ativos</h4>
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${saving ? 'bg-primary/20 text-primary' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
              {saving ? 'Sincronizando...' : 'Online'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
             {[
               { id: 'pix', label: 'PIX', icon: 'qrcode', color: 'text-emerald-500' },
               { id: 'card', label: 'Cartão', icon: 'credit_card', color: 'text-blue-500' },
               { id: 'lightning', label: 'Bitcoin', icon: 'currency_bitcoin', color: 'text-amber-500' },
               { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet', color: 'text-primary' }
             ].map((m) => (
               <button 
                 key={m.id}
                 onClick={() => toggleMethod(m.id)}
                 className={`flex flex-col items-center justify-center p-4 rounded-[28px] transition-all border ${
                   settings.payment_methods_active?.[m.id] 
                   ? 'bg-white dark:bg-slate-900 shadow-sm border-slate-200/50 dark:border-slate-700' 
                   : 'bg-slate-50 dark:bg-slate-800/20 border-transparent opacity-40 hover:opacity-60 grayscale'
                 }`}
               >
                  <span className={`material-symbols-outlined ${m.color} text-2xl mb-2`}>{m.icon}</span>
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">{m.label}</span>
                  <div className={`mt-2 h-1 w-6 rounded-full ${settings.payment_methods_active?.[m.id] ? 'bg-primary' : 'bg-slate-300'}`} />
               </button>
             ))}
          </div>
       </div>

       {/* ECONOMY RATES */}
       <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                   <span className="material-symbols-outlined text-base">percent</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Serviço Global</span>
             </div>
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
               <input 
                 type="number" step="0.1"
                 value={settings.service_fee_percent}
                 onChange={(e) => handleUpdate('service_fee_percent', parseFloat(e.target.value))}
                 className="w-10 bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none text-right"
               />
               <span className="text-[10px] text-slate-400 font-bold">%</span>
             </div>
          </div>

          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                   <span className="material-symbols-outlined text-base">monetization_on</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor Moeda (1 Z)</span>
             </div>
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
               <span className="text-[10px] text-slate-400 font-bold">R$</span>
               <input 
                 type="number" step="0.01"
                 value={settings.izi_coin_value}
                 onChange={(e) => handleUpdate('izi_coin_value', parseFloat(e.target.value))}
                 className="w-12 bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none text-right"
               />
             </div>
          </div>

          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-3">
                <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                   <span className="material-symbols-outlined text-base">trending_up</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Juros Empréstimo</span>
             </div>
             <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
               <input 
                 type="number" step="0.1"
                 value={settings.loan_interest_rate}
                 onChange={(e) => handleUpdate('loan_interest_rate', parseFloat(e.target.value))}
                 className="w-10 bg-transparent text-xs font-black text-slate-900 dark:text-white outline-none text-right"
               />
               <span className="text-[10px] text-slate-400 font-bold">%</span>
             </div>
          </div>
       </div>

       {/* WITHDRAWAL RULES */}
       <div className="p-6 rounded-[32px] bg-slate-900 border border-white/5 space-y-4">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
             <span className="material-symbols-outlined text-sm">account_balance</span>
             Regras de Liquidez
          </p>
          <div className="flex justify-between items-center">
             <span className="text-[11px] font-bold text-slate-400">Taxa de Saque</span>
             <div className="flex items-center gap-2">
                <input 
                  type="number" step="0.5"
                  value={settings.withdrawal_fee_percent}
                  onChange={(e) => handleUpdate('withdrawal_fee_percent', parseFloat(e.target.value))}
                  className="w-10 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-white font-black text-right text-xs outline-none focus:border-primary"
                />
                <span className="text-[10px] text-white/20">%</span>
             </div>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[11px] font-bold text-slate-400">Valor Mínimo</span>
             <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/20">R$</span>
                <input 
                  type="number"
                  value={settings.min_withdrawal_amount}
                  onChange={(e) => handleUpdate('min_withdrawal_amount', parseFloat(e.target.value))}
                  className="w-14 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-white font-black text-right text-xs outline-none focus:border-primary"
                />
             </div>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[11px] font-bold text-slate-400">Prazo (Horas)</span>
             <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={settings.withdrawal_period_h}
                  onChange={(e) => handleUpdate('withdrawal_period_h', parseInt(e.target.value))}
                  className="w-10 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-white font-black text-right text-xs outline-none focus:border-primary"
                />
                <span className="text-[10px] text-white/20">H</span>
             </div>
          </div>
          <div className="flex justify-between items-center">
             <span className="text-[11px] font-bold text-slate-400">Dia de Pagamento</span>
             <input 
               type="text"
               value={settings.withdrawal_day}
               onChange={(e) => handleUpdate('withdrawal_day', e.target.value)}
               className="w-24 bg-white/5 border border-white/10 rounded-lg py-1 px-2 text-white font-black text-right text-[10px] outline-none focus:border-primary"
             />
          </div>
          <div className="pt-2 border-t border-white/5">
             <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed italic">
               Nota: Estas regras refletem globalmente no ecossistema Izi para todos os parceiros.
             </p>
          </div>
        </div>
    </div>
  );
}
