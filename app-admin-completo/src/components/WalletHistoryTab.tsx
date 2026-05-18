import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

type FilterType = 'all' | 'deposito' | 'credit' | 'saque' | 'debit' | 'venda';

const TYPE_LABELS: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  deposito:  { label: 'Recarga PIX',    icon: 'add_circle',    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  credit:    { label: 'Crédito Admin',  icon: 'volunteer_activism', color: 'text-blue-400',  bg: 'bg-blue-500/10' },
  venda:     { label: 'Venda',          icon: 'storefront',    color: 'text-amber-400',   bg: 'bg-amber-500/10' },
  saque:     { label: 'Saque',          icon: 'payments',      color: 'text-red-400',     bg: 'bg-red-500/10' },
  debit:     { label: 'Débito',         icon: 'remove_circle', color: 'text-orange-400',  bg: 'bg-orange-500/10' },
};

const STATUS_LABELS: Record<string, { label: string; dot: string }> = {
  concluido: { label: 'Concluído',  dot: 'bg-emerald-400' },
  pendente:  { label: 'Pendente',   dot: 'bg-amber-400' },
  cancelado: { label: 'Cancelado',  dot: 'bg-red-400' },
  estornado: { label: 'Estornado',  dot: 'bg-slate-400' },
};

export default function WalletHistoryTab() {
  const {
    merchantBalance, merchantTransactions, fetchMerchantFinance,
    isWalletLoading, setShowAddCreditModal, handleRequestWithdrawal, merchantProfile,
    allOrders, fetchAllOrders, appSettings
  } = useAdmin();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');

  const isAvulso = merchantProfile?.subscription_plan === 'avulso';

  // Buscar ordens reais ao carregar se não for avulso
  useEffect(() => {
    if (!isAvulso) {
      fetchAllOrders(1);
    }
  }, [fetchAllOrders, isAvulso]);

  // Filtragem de ordens do lojista atual
  const merchantId = merchantProfile?.id;
  const merchantOrders = useMemo(() => {
    return (allOrders || []).filter(o => String(o.merchant_id) === String(merchantId));
  }, [allOrders, merchantId]);

  const completedOrders = useMemo(() => {
    return merchantOrders.filter(o => ['concluido', 'delivered', 'entregue'].includes(o.status));
  }, [merchantOrders]);

  // Cálculos comerciais detalhados para lojistas dos outros planos
  const commercialStats = useMemo(() => {
    const rate = merchantProfile?.commission_percent ?? appSettings?.appCommission ?? 12;
    const gross = completedOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
    const comm = gross * (rate / 100);
    const net = gross - comm;
    return { grossRevenue: gross, totalCommission: comm, netRevenue: net, commissionRate: rate };
  }, [completedOrders, merchantProfile, appSettings]);

  // Estatísticas para o gráfico de fluxo de vendas (últimos 7 dias)
  const dailyRevenue = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayOrders = completedOrders.filter(o => o.created_at.startsWith(dateStr));
      const amount = dayOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);
      return {
        label: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        amount
      };
    });
  }, [completedOrders]);

  // Divisão por método de pagamento (Caixa)
  const paymentStats = useMemo(() => {
    const stats = {
      pix: { label: 'PIX', amount: 0, percentage: 0, color: 'bg-teal-500', text: 'text-teal-500', icon: 'qr_code_2' },
      cartao: { label: 'Cartão', amount: 0, percentage: 0, color: 'bg-blue-500', text: 'text-blue-500', icon: 'credit_card' },
      dinheiro: { label: 'Dinheiro', amount: 0, percentage: 0, color: 'bg-emerald-500', text: 'text-emerald-500', icon: 'payments' },
      bitcoin_lightning: { label: 'Bitcoin Lightning', amount: 0, percentage: 0, color: 'bg-amber-500', text: 'text-amber-500', icon: 'bolt' },
    };

    let total = 0;
    completedOrders.forEach(o => {
      const method = (o.payment_method || '').toLowerCase();
      let key: 'pix' | 'cartao' | 'dinheiro' | 'bitcoin_lightning' = 'cartao';
      if (method.includes('pix')) key = 'pix';
      else if (method.includes('dinheiro') || method.includes('money')) key = 'dinheiro';
      else if (method.includes('bitcoin') || method.includes('lightning')) key = 'bitcoin_lightning';
      
      stats[key].amount += o.total_price || 0;
      total += o.total_price || 0;
    });

    Object.keys(stats).forEach(k => {
      const key = k as 'pix' | 'cartao' | 'dinheiro' | 'bitcoin_lightning';
      stats[key].percentage = total > 0 ? (stats[key].amount / total) * 100 : 0;
    });

    return stats;
  }, [completedOrders]);

  // Filtro de transações do extrato financeiro
  const filteredTransactions = useMemo(() => {
    let txs = merchantTransactions || [];
    if (filter !== 'all') {
      txs = txs.filter(t => t.type === filter);
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      txs = txs.filter(t =>
        (t.description || '').toLowerCase().includes(term) ||
        (t.type || '').toLowerCase().includes(term)
      );
    }
    return txs;
  }, [merchantTransactions, filter, searchTerm]);

  // Estatísticas originais do plano avulso
  const stats = useMemo(() => {
    const txs = merchantTransactions || [];
    const recharges = txs.filter(t => t.type === 'deposito' || t.type === 'credit').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    const debits = txs.filter(t => t.type === 'saque' || t.type === 'debit').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    const sales = txs.filter(t => t.type === 'venda').reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    return { recharges, debits, sales, total: txs.length };
  }, [merchantTransactions]);

  const formatCurrency = (v: number) => `R$ ${Math.abs(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  
  const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  
  const formatTime = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isPositive = (type: string) => ['deposito', 'credit', 'venda'].includes(type);

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    await handleRequestWithdrawal(amount, withdrawPixKey);
    setShowWithdrawModal(false);
    setWithdrawAmount('');
    setWithdrawPixKey('');
  };

  const filters: { key: FilterType; label: string; icon: string }[] = [
    { key: 'all',      label: 'Todos',     icon: 'list' },
    ...(isAvulso ? [{ key: 'deposito' as FilterType, label: 'Recargas',  icon: 'add_circle' }] : []),
    { key: 'credit',   label: 'Créditos',  icon: 'volunteer_activism' },
    { key: 'saque',    label: 'Saques',    icon: 'payments' },
    { key: 'debit',    label: 'Débitos',   icon: 'remove_circle' },
    { key: 'venda',    label: 'Vendas',    icon: 'storefront' },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 font-display max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20">
              <span className="material-symbols-outlined text-3xl text-indigo-500">account_balance_wallet</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
                {isAvulso ? 'Financeiro' : 'Painel Financeiro'}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {isAvulso
                  ? 'Histórico de recargas, saques e movimentações da sua carteira.'
                  : 'Gestão completa de faturamento, vendas e fluxo de caixa da sua loja.'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          {isAvulso && (
            <button
              onClick={() => setShowAddCreditModal(true)}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span className="material-symbols-outlined text-base">add_circle</span>
              Recarregar
            </button>
          )}
          
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Sacar
          </button>
          
          <button
            onClick={() => {
              fetchMerchantFinance();
              if (!isAvulso) fetchAllOrders(1);
            }}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-2xl transition-all hover:scale-105 active:scale-95"
            title="Atualizar"
          >
            <span className={`material-symbols-outlined text-base ${isWalletLoading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      {isAvulso ? (
        // Modo Carteira Pré-Paga (Lojista Avulso)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-[28px] p-6 text-white shadow-xl shadow-indigo-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Saldo Disponível</p>
            <p className="text-3xl font-black">{formatCurrency(merchantBalance)}</p>
            <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-white/50">
              <span className="material-symbols-outlined text-xs">info</span>
              Usado para entregas avulsas
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-emerald-500">trending_up</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Recargas</p>
            </div>
            <p className="text-2xl font-black text-emerald-500">{formatCurrency(stats.recharges)}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-red-500">trending_down</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Saques/Débitos</p>
            </div>
            <p className="text-2xl font-black text-red-500">{formatCurrency(stats.debits)}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-blue-500">receipt_long</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Movimentações</p>
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total}</p>
          </div>
        </div>
      ) : (
        // Modo Faturamento Comercial (Outros Planos: Restaurant, Market, etc.)
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Saldo Disponível para Saque */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-700 rounded-[28px] p-6 text-white shadow-xl shadow-emerald-500/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Saldo a Receber</p>
            <p className="text-3xl font-black">{formatCurrency(merchantBalance)}</p>
            <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-white/50">
              <span className="material-symbols-outlined text-xs">info</span>
              Disponível para saque via PIX
            </div>
          </div>

          {/* Faturamento Bruto */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-indigo-500">trending_up</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Faturamento Bruto</p>
            </div>
            <p className="text-2xl font-black text-indigo-500">{formatCurrency(commercialStats.grossRevenue)}</p>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">shopping_basket</span>
              {completedOrders.length} pedidos concluídos
            </div>
          </div>

          {/* Comissão Retida */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-red-500">percent</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Taxa Intermediação</p>
            </div>
            <p className="text-2xl font-black text-red-500">{formatCurrency(commercialStats.totalCommission)}</p>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">
              Taxa de comissão: {commercialStats.commissionRate}%
            </div>
          </div>

          {/* Faturamento Líquido */}
          <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-xl text-blue-500">storefront</span>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Ganhos Líquidos</p>
            </div>
            <p className="text-2xl font-black text-blue-500">{formatCurrency(commercialStats.netRevenue)}</p>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-2">
              Receita líquida da sua loja
            </div>
          </div>
        </div>
      )}

      {/* Gráficos e Detalhamento de Fluxo de Caixa para Lojistas Comerciais */}
      {!isAvulso && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Gráfico de Evolução de Vendas */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Fluxo de Vendas Diário</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Evolução do faturamento bruto nos últimos 7 dias</p>
              </div>
            </div>

            {/* Barras do Gráfico */}
            <div className="h-60 flex items-end justify-between gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800/80">
              {dailyRevenue.map((day, i) => {
                const maxAmount = Math.max(...dailyRevenue.map(d => d.amount), 1);
                const heightPercentage = (day.amount / maxAmount) * 100;
                
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="w-full relative h-48 flex items-end">
                      {day.amount > 0 && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 dark:bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap pointer-events-none">
                          R$ {day.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                      )}
                      
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(heightPercentage, 4)}%` }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.05 }}
                        className={`w-full rounded-t-xl transition-all relative overflow-hidden cursor-pointer ${
                          day.amount > 0 
                            ? 'bg-gradient-to-t from-indigo-500 via-violet-500 to-indigo-600 shadow-[0_0_15px_rgba(99,102,241,0.2)] group-hover:from-indigo-400 group-hover:to-indigo-500' 
                            : 'bg-slate-100 dark:bg-slate-800/40'
                        }`}
                      />
                    </div>
                    
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{day.label}</span>
                    <span className="text-[9px] text-slate-400 font-bold">{day.date}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fluxo de Caixa (Caixa por Forma de Pagamento) */}
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Caixa / Métodos</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Detalhamento de receita bruta por forma de pagamento</p>

            <div className="space-y-6 flex-1 flex flex-col justify-center">
              {Object.entries(paymentStats).map(([key, stat]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <span className={`material-symbols-outlined ${stat.text} text-lg`}>{stat.icon}</span>
                      <span className="font-black text-[10px] uppercase tracking-wider">{stat.label}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 dark:text-white font-black">{formatCurrency(stat.amount)}</p>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest">{stat.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.percentage}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                      className={`h-full ${stat.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                filter === f.key
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="relative flex-1 min-w-[200px] w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar movimentações..."
            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        {isWalletLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin size-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full" />
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-20 px-8">
            <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-600 mb-4 block">receipt_long</span>
            <p className="text-lg font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {filter === 'all' ? 'Nenhuma movimentação encontrada' : 'Nenhuma transação deste tipo'}
            </p>
            <p className="text-sm text-slate-400 mt-2">
              {filter === 'all' 
                ? (isAvulso ? 'Faça sua primeira recarga para começar a usar o sistema de entregas avulsas.' : 'Nenhuma venda ou movimentação registrada até o momento.')
                : 'Tente alterar os filtros ou a busca.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {/* Header da tabela */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-slate-50 dark:bg-slate-800/30">
              <p className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</p>
              <p className="col-span-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descrição</p>
              <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</p>
              <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Valor</p>
              <p className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Saldo Após</p>
              <p className="col-span-1 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</p>
            </div>

            <AnimatePresence mode="popLayout">
              {filteredTransactions.map((tx, i) => {
                const meta = TYPE_LABELS[tx.type] || { label: tx.type, icon: 'help', color: 'text-slate-400', bg: 'bg-slate-500/10' };
                const statusMeta = STATUS_LABELS[tx.status || 'concluido'] || STATUS_LABELS.concluido;
                const positive = isPositive(tx.type);

                return (
                  <motion.div
                    key={tx.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 md:px-8 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
                  >
                    {/* Tipo */}
                    <div className="col-span-1 flex items-center">
                      <div className={`size-9 rounded-xl ${meta.bg} flex items-center justify-center`}>
                        <span className={`material-symbols-outlined text-lg ${meta.color}`}>{meta.icon}</span>
                      </div>
                    </div>

                    {/* Descrição */}
                    <div className="col-span-4 flex flex-col justify-center min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{tx.description || meta.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{meta.label}</p>
                    </div>

                    {/* Data */}
                    <div className="col-span-2 flex flex-col justify-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{formatDate(tx.created_at)}</p>
                      <p className="text-[10px] font-bold text-slate-400">{formatTime(tx.created_at)}</p>
                    </div>

                    {/* Valor */}
                    <div className="col-span-2 flex items-center justify-end">
                      <p className={`text-base font-black ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
                        {positive ? '+' : '-'} {formatCurrency(Number(tx.amount))}
                      </p>
                    </div>

                    {/* Saldo Após */}
                    <div className="col-span-2 flex items-center justify-end">
                      <p className="text-xs font-bold text-slate-500">
                        {tx.balance_after != null ? formatCurrency(Number(tx.balance_after)) : '—'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="col-span-1 flex items-center justify-center">
                      <div className="flex items-center gap-1.5">
                        <div className={`size-2 rounded-full ${statusMeta.dot}`} />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden xl:block">{statusMeta.label}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modal de Saque */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          >
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-md" onClick={() => setShowWithdrawModal(false)} />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white dark:bg-slate-900 rounded-[32px] p-8 w-full max-w-md shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <button 
                onClick={() => setShowWithdrawModal(false)} 
                className="absolute top-4 right-4 size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="size-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-2xl text-red-500">payments</span>
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Solicitar Saque</h3>
                  <p className="text-xs font-bold text-slate-400">Saldo disponível: <span className="text-emerald-500">{formatCurrency(merchantBalance)}</span></p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Valor do Saque (R$)</label>
                  <input
                    type="text"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    placeholder="Ex: 100,00"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-lg font-black text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Chave PIX</label>
                  <input
                    type="text"
                    value={withdrawPixKey}
                    onChange={e => setWithdrawPixKey(e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
                  />
                </div>
              </div>

              <button
                onClick={handleWithdraw}
                disabled={!withdrawAmount || !withdrawPixKey}
                className="mt-6 w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
              >
                Confirmar Saque
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
