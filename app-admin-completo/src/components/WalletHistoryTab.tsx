import React, { useState, useMemo } from 'react';
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
    isWalletLoading, setShowAddCreditModal, handleRequestWithdrawal, merchantProfile
  } = useAdmin();

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawPixKey, setWithdrawPixKey] = useState('');

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
    { key: 'deposito', label: 'Recargas',  icon: 'add_circle' },
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
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Financeiro</h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">Histórico de recargas, saques e movimentações da sua carteira.</p>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowAddCreditModal(true)}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Recarregar
          </button>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">payments</span>
            Sacar
          </button>
          <button
            onClick={() => fetchMerchantFinance()}
            className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 rounded-2xl transition-all hover:scale-105 active:scale-95"
            title="Atualizar"
          >
            <span className={`material-symbols-outlined text-base ${isWalletLoading ? 'animate-spin' : ''}`}>refresh</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Saldo Atual */}
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 rounded-[28px] p-6 text-white shadow-xl shadow-indigo-500/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Saldo Disponível</p>
          <p className="text-3xl font-black">{formatCurrency(merchantBalance)}</p>
          <div className="mt-3 flex items-center gap-1 text-[10px] font-bold text-white/50">
            <span className="material-symbols-outlined text-xs">info</span>
            Usado para entregas avulsas
          </div>
        </div>

        {/* Total Recargas */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-emerald-500">trending_up</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Recargas</p>
          </div>
          <p className="text-2xl font-black text-emerald-500">{formatCurrency(stats.recharges)}</p>
        </div>

        {/* Total Débitos */}
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl text-red-500">trending_down</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Saques/Débitos</p>
          </div>
          <p className="text-2xl font-black text-red-500">{formatCurrency(stats.debits)}</p>
        </div>

        {/* Total Transações */}
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

      {/* Filtros e Busca */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
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
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar por descrição..."
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
              {filter === 'all' ? 'Faça sua primeira recarga para começar a usar o sistema de entregas avulsas.' : 'Tente alterar os filtros ou a busca.'}
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
              <button onClick={() => setShowWithdrawModal(false)} className="absolute top-4 right-4 size-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
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
