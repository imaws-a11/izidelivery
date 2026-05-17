import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';

interface Stats {
  balance: number;
  today: number;
  weekly: number;
  monthly: number;
  yearly: number;
  totalEarnings: number;
  count: number;
  level: number;
  xp: number;
  nextXp: number;
  performance: number[];
  weeklyEarnings: number[];
  monthlyPerformance: number[];
  growth: number;
}

interface EarningsViewProps {
  stats: Stats;
  earningsHistory: any[];
  ordersHistory?: any[];
  onShowBankDetails: () => void;
  onShowWithdrawHistory: () => void;
  onWithdrawRequest: () => void;
  onNavigateToMissions: () => void;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Explorador', 2: 'Entusiasta', 3: 'Frequente', 4: 'Dedicado', 
  5: 'Veterano', 6: 'Expert', 7: 'Campeão', 8: 'Lenda', 
  9: 'Ícone', 10: 'Imortal IZI'
};

const EarningsView = React.memo<EarningsViewProps>(({ 
  stats, 
  earningsHistory = [], 
  ordersHistory = [], 
  onShowBankDetails, 
  onShowWithdrawHistory, 
  onWithdrawRequest, 
  onNavigateToMissions 
}) => {
  const [earningsViewTab, setEarningsViewTab] = useState<'week' | 'month' | 'year'>('week');
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  const tabs = [
    { id: 'week', label: 'Semana', icon: 'view_week' },
    { id: 'month', label: 'Mês', icon: 'calendar_month' },
    { id: 'year', label: 'Ano', icon: 'event_repeat' },
  ] as const;

  const mainValue = earningsViewTab === 'week' ? stats.weekly :
    earningsViewTab === 'month' ? stats.monthly :
    stats.yearly;

  const chartData = earningsViewTab === 'week' ? stats.weeklyEarnings : 
    earningsViewTab === 'month' ? stats.monthlyPerformance : 
    [stats.yearly];

  const chartLabels = earningsViewTab === 'week' ? ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'] :
    earningsViewTab === 'month' ? ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] :
    [new Date().getFullYear().toString()];

  const maxVal = Math.max(...chartData, 50);

  // Clean address utility
  const cleanAddressText = (value: string | undefined | null): string => {
    let raw = String(value || '').trim();
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.address) raw = parsed.address;
      } catch (e) {}
    }
    return raw.split('|')[0].trim();
  };

  // Find associated order
  const findAssociatedOrder = (tx: any, orders: any[]) => {
    if (!orders || orders.length === 0) return null;
    
    // 1. Check if metadata has order_id
    if (tx.metadata && tx.metadata.order_id) {
      const found = orders.find(o => o.id === tx.metadata.order_id);
      if (found) return found;
    }
    
    // 2. Extract code from description (e.g. #18C31E7A or TRK-2DTN6J)
    const desc = tx.description || '';
    
    const hashMatch = desc.match(/#([a-fA-F0-9\-]+)/);
    if (hashMatch && hashMatch[1]) {
      const prefix = hashMatch[1].toLowerCase();
      const found = orders.find(o => o.id.toLowerCase().startsWith(prefix));
      if (found) return found;
    }
    
    const trkMatch = desc.match(/TRK-([A-Z0-9]+)/i);
    if (trkMatch && trkMatch[0]) {
      const trkCode = trkMatch[0].toUpperCase();
      const found = orders.find(o => (o.tracking_code || '').toUpperCase() === trkCode);
      if (found) return found;
    }
    
    return null;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="flex-1 flex flex-col bg-zinc-50 overflow-hidden font-['Plus_Jakarta_Sans']"
    >
      {/* Header Premium */}
      <div className="px-6 pt-8 pb-4 space-y-6 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">Meus Ganhos</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onShowBankDetails}
              className="size-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 active:scale-95 transition-all shadow-sm"
            >
              <Icon name="account_balance" size={20} />
            </button>
            <button 
              onClick={onShowWithdrawHistory}
              className="size-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 active:scale-95 transition-all shadow-sm"
            >
              <Icon name="history" size={20} />
            </button>
          </div>
        </div>

        {/* Selector de Período */}
        <div className="flex p-1.5 bg-zinc-100/50 rounded-xl gap-1 border border-zinc-100">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setEarningsViewTab(tab.id)}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${
                earningsViewTab === tab.id 
                  ? 'bg-white text-zinc-900 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              <Icon name={tab.icon} size={16} className={earningsViewTab === tab.id ? 'text-yellow-500' : ''} />
              <span className="text-[10px] font-black uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-40 space-y-8">
        {/* Main Balance Display */}
        <div className="relative pt-6 pb-2">
          <div className="flex flex-col items-center">
            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-2">Total no Período</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-zinc-300">R$</span>
              <span className="text-7xl font-black text-zinc-950 tracking-tighter leading-none">
                {mainValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
            
            <div className="mt-8 w-full bg-zinc-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-2xl">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Saldo Disponível</span>
                </div>
                <Icon name="account_balance_wallet" className="text-yellow-400/80" size={24} />
              </div>
              
              <div className="flex items-end justify-between relative z-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-zinc-500 mb-1">R$</span>
                  <span className="text-4xl font-black text-white tracking-tighter">
                    {stats.balance.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <button 
                  onClick={onWithdrawRequest}
                  className="px-5 py-3 bg-yellow-400 text-zinc-900 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-[0_4px_14px_rgba(250,204,21,0.3)] flex items-center gap-1.5 hover:bg-yellow-300"
                >
                  Sacar
                  <Icon name="arrow_forward" size={14} className="text-zinc-900" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="bg-white rounded-xl p-8 border border-zinc-100 space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="text-zinc-900 font-black text-[10px] uppercase tracking-[0.3em]">Fluxo de Caixa</h3>
              <p className="text-[9px] text-zinc-400 font-bold uppercase">Performance Financeira</p>
            </div>
            <div className="px-3 py-1 bg-yellow-50 border border-yellow-100 rounded-full">
              <span className="text-[8px] font-black text-yellow-600 uppercase tracking-widest">Top 5% Pilotos</span>
            </div>
          </div>

          <div className="h-48 flex items-end justify-between gap-2 pt-6 relative">
            {/* Background Lines */}
            <div className="absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between pointer-events-none opacity-[0.05]">
              <div className="h-px bg-zinc-900 w-full" />
              <div className="h-px bg-zinc-900 w-full" />
              <div className="h-px bg-zinc-900 w-full" />
            </div>

            {chartData.map((val, i) => {
              const height = (val / maxVal) * 100;
              const isCurrent = earningsViewTab === 'week' ? (i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)) : 
                earningsViewTab === 'month' ? (i === new Date().getMonth()) : false;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-4 group h-full justify-end relative">
                  <div className="w-full flex flex-col items-center relative h-full justify-end">
                    {isCurrent && (
                      <div className="absolute bottom-0 w-full h-full bg-yellow-400/10 blur-xl rounded-full" />
                    )}
                    
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(height, 4)}%` }}
                      transition={{ type: 'spring', stiffness: 100, delay: i * 0.05 }}
                      className={`w-full max-w-[12px] rounded-t-full rounded-b-lg transition-all relative z-10 ${
                        isCurrent 
                          ? 'bg-yellow-400 ' 
                          : 'bg-zinc-200 group-hover:bg-zinc-300'
                      }`}
                    />
                    
                    {val > 0 && (
                      <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md pointer-events-none z-20">
                        R${val.toFixed(0)}
                      </div>
                    )}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isCurrent ? 'text-zinc-900' : 'text-zinc-300'}`}>
                    {chartLabels[i]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pro Driver Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-xl border border-zinc-100 space-y-4 shadow-sm">
            <div className="size-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
              <Icon name="bolt" size={20} className="text-yellow-500" />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Eficiência</p>
              <p className="text-lg font-black text-zinc-900 leading-none">R$ {(mainValue / (stats.count || 1)).toFixed(2).replace('.', ',')}</p>
              <p className="text-[8px] text-zinc-400 font-bold uppercase mt-1">Média p/ entrega</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-zinc-100 space-y-4 shadow-sm">
            <div className="size-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
              <Icon name={stats.growth >= 0 ? 'trending_up' : 'trending_down'} size={20} className={stats.growth >= 0 ? 'text-emerald-500' : 'text-red-500'} />
            </div>
            <div>
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Progresso</p>
              <p className={`text-lg font-black leading-none ${stats.growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {stats.growth >= 0 ? '+' : ''}{stats.growth}%
              </p>
              <p className="text-[8px] text-zinc-400 font-bold uppercase mt-1">vs. semana anterior</p>
            </div>
          </div>
        </div>

        {/* Dedicated Section */}
        <div 
          onClick={onNavigateToMissions}
          className="bg-zinc-900 rounded-xl p-8 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer shadow-xl"
        >
          <div className="absolute right-0 top-0 w-40 h-40 bg-yellow-400/10 blur-[80px] -mr-20 -mt-20" />
          
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-yellow-400 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform shadow-md">
                <Icon name="workspace_premium" size={28} className="text-zinc-900" />
              </div>
              <div>
                <h4 className="text-white font-black text-sm uppercase tracking-wider">
                  Status: {LEVEL_TITLES[stats.level] || 'Elite Pro'}
                </h4>
                <p className="text-yellow-400/60 text-[10px] font-bold uppercase tracking-widest">Nível {stats.level} • {stats.xp} XP</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Progresso Level Up</span>
                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{stats.xp}/{stats.nextXp} XP</span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.xp / stats.nextXp) * 100}%` }}
                  className="h-full bg-yellow-400 "
                />
              </div>
            </div>

            <p className="text-[10px] text-white/50 font-medium leading-relaxed italic">
              "Sua dedicação é o que move a Izi. Continue acelerando rumo aos melhores bônus da cidade!"
            </p>
          </div>
        </div>

        {/* Histórico de Ganhos */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-zinc-900 font-black text-[10px] uppercase tracking-[0.3em]">Histórico de Ganhos</h3>
              <p className="text-[9px] text-zinc-400 font-bold uppercase">Seu extrato completo de ganhos</p>
            </div>
            <div className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              {earningsHistory.length} registros
            </div>
          </div>

          <div className="space-y-3">
            {earningsHistory.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-zinc-100 flex flex-col items-center gap-3 shadow-sm">
                <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <Icon name="history_toggle_off" size={24} />
                </div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Nenhum ganho registrado</p>
              </div>
            ) : (
              earningsHistory.slice(0, 15).map((tx) => {
                const date = new Date(tx.created_at);
                const amountVal = Number(tx.amount || 0);
                
                // Dynamic icons & styles based on type/description
                let iconName = 'payments';
                let iconColor = 'text-emerald-500 bg-emerald-50';
                let titleLabel = 'Ganho Recebido';
                const desc = tx.description || '';
                
                if (desc.toLowerCase().includes('missão') || tx.type === 'bonus') {
                  iconName = 'emoji_events';
                  iconColor = 'text-yellow-600 bg-yellow-50';
                  titleLabel = 'Bônus de Missão';
                } else if (desc.toLowerCase().includes('avulsa') || tx.type === 'venda') {
                  iconName = 'motorcycle';
                  iconColor = 'text-indigo-600 bg-indigo-50';
                  titleLabel = 'Corrida Concluída';
                } else if (desc.toLowerCase().includes('crédito') || tx.type === 'credit') {
                  iconName = 'account_balance_wallet';
                  iconColor = 'text-teal-600 bg-teal-50';
                  titleLabel = 'Ajuste de Crédito';
                } else if (tx.type === 'deposito') {
                  iconName = 'add_circle';
                  iconColor = 'text-emerald-600 bg-emerald-50';
                  titleLabel = 'Depósito Concedido';
                }

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="bg-white p-4 rounded-2xl border border-zinc-100 flex items-center justify-between active:scale-[0.98] hover:border-zinc-200 transition-all cursor-pointer shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
                        <Icon name={iconName} size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-zinc-950 truncate leading-none mb-1">{titleLabel}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wide truncate">
                          {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {desc}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-sm font-black text-emerald-600 leading-none">
                        + R$ {amountVal.toFixed(2).replace('.', ',')}
                      </span>
                      {tx.balance_after && (
                        <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                          Saldo: R$ {Number(tx.balance_after).toFixed(2).replace('.', ',')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="h-8" />
      </div>

      {/* Modal de Detalhes do Ganho */}
      <AnimatePresence>
        {selectedTx && (() => {
          const date = new Date(selectedTx.created_at);
          const amountVal = Number(selectedTx.amount || 0);
          const desc = selectedTx.description || '';
          
          // Find associated order
          const matchedOrder = findAssociatedOrder(selectedTx, ordersHistory);
          
          // Compute composition
          let grossAmount = amountVal;
          let iziFee = 0;
          let commissionPct = 7;
          let isVenda = false;
          
          if (selectedTx.type === 'venda' || (selectedTx.type === 'deposito' && !desc.toLowerCase().includes('missão'))) {
            isVenda = true;
            if (matchedOrder) {
              const isMobility = ['mototaxi', 'car_ride', 'frete', 'logistica', 'motorista_particular', 'van', 'utilitario', 'motoboy'].includes(matchedOrder.service_type);
              let base = 0;
              if (isMobility) {
                base = Number(matchedOrder.delivery_fee || matchedOrder.total_price || matchedOrder.price || 0);
              } else {
                const deliveryFee = Number(matchedOrder.delivery_fee || 0);
                base = Math.max(deliveryFee, 7);
              }
              if (base <= 0) base = 7;
              grossAmount = base;
              
              const isPrivate = ['car_ride', 'motorista_particular'].includes(matchedOrder.service_type);
              commissionPct = isPrivate ? 7 : 7; // fallback or settings
              iziFee = grossAmount * (commissionPct / 100);
              
              if (Math.abs((grossAmount - iziFee) - amountVal) > 0.05) {
                grossAmount = amountVal / (1 - (commissionPct / 100));
                iziFee = grossAmount - amountVal;
              }
            } else {
              // Estimar baseado no valor padrao de 7% de comissão
              grossAmount = amountVal / 0.93;
              iziFee = grossAmount - amountVal;
            }
          }

          return (
            <div className="fixed inset-0 z-[1000] flex items-end justify-center">
              {/* Backdrop glassmorphic */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTx(null)}
                className="absolute inset-0 bg-zinc-950/60 backdrop-blur-md"
              />

              {/* Modal Sheet */}
              <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-full max-w-lg bg-zinc-50 rounded-t-[2.5rem] border-t border-white/60 shadow-2xl p-6 pb-12 flex flex-col z-10 max-h-[85vh] overflow-y-auto no-scrollbar"
              >
                {/* Handle */}
                <div className="w-12 h-1.5 bg-zinc-300 rounded-full mx-auto mb-6 shrink-0" />
                
                {/* Header */}
                <div className="text-center space-y-4 mb-8 shrink-0">
                  <span className="bg-yellow-400/10 px-4 py-1.5 rounded-full border border-yellow-400/20 text-[10px] font-black text-yellow-700 uppercase tracking-[0.3em] inline-block">
                    Detalhamento de Ganho
                  </span>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valor Recebido</p>
                    <div className="flex items-baseline justify-center gap-1.5">
                      <span className="text-2xl font-black text-zinc-400">R$</span>
                      <span className="text-5xl font-black text-zinc-950 tracking-tighter">
                        {amountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Composição Financeira Card */}
                  <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 flex items-center gap-2">
                      <Icon name="analytics" size={16} className="text-yellow-500" />
                      Composição do Ganho
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-500 font-bold">Valor Bruto do Serviço</span>
                        <span className="text-zinc-800 font-black">
                          R$ {grossAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      {iziFee > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="text-zinc-500 font-bold">Taxa de Intermediação IZI</span>
                            <span className="bg-yellow-50 text-yellow-600 border border-yellow-100 px-1.5 py-0.5 rounded text-[8px] font-black">{commissionPct.toFixed(0)}%</span>
                          </div>
                          <span className="text-rose-500 font-black">
                            - R$ {iziFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center pt-3 border-t border-zinc-100 text-sm">
                        <span className="text-zinc-950 font-black">Ganhos Líquidos</span>
                        <span className="text-emerald-600 font-black">
                          R$ {amountVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Origem e Destino Card (se houver pedido vinculado) */}
                  {matchedOrder && (
                    <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
                      <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 flex items-center gap-2">
                        <Icon name="navigation" size={16} className="text-yellow-500" />
                        Rota e Entrega
                      </h4>
                      
                      <div className="space-y-4">
                        <div className="flex items-start gap-3 text-xs">
                          <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                            <div className="size-1.5 rounded-full bg-yellow-400" />
                            <div className="w-[1px] h-6 bg-zinc-200" />
                            <div className="size-1.5 rounded-full bg-zinc-300" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Origem (Coleta)</p>
                            <p className="text-zinc-800 font-bold truncate tracking-tight mb-2">
                              {cleanAddressText(matchedOrder.pickup_address || matchedOrder.origin)}
                            </p>
                            <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Destino (Entrega)</p>
                            <p className="text-zinc-950 font-black truncate tracking-tight">
                              {cleanAddressText(matchedOrder.delivery_address || matchedOrder.destination)}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-zinc-50">
                          {matchedOrder.distance_km && (
                            <div className="flex items-center gap-1.5 bg-yellow-400/10 px-2.5 py-1.5 rounded-xl">
                              <Icon name="route" size={12} className="text-yellow-600" />
                              <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">
                                {parseFloat(matchedOrder.distance_km).toFixed(1)} km percorridos
                              </span>
                            </div>
                          )}
                          {matchedOrder.payment_method && (
                            <div className="flex items-center gap-1.5 bg-zinc-950/5 px-2.5 py-1.5 rounded-xl">
                              <Icon name="payment" size={12} className="text-zinc-500" />
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                                Pagar via: {matchedOrder.payment_method === 'dinheiro' || matchedOrder.payment_method === 'cash' ? 'Dinheiro' : 'Carteira Izi'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Metadados e Auditoria Card */}
                  <div className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm space-y-4">
                    <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2 flex items-center gap-2">
                      <Icon name="fingerprint" size={16} className="text-yellow-500" />
                      Auditoria da Transação
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Tipo de Registro</p>
                        <p className="text-zinc-800 font-bold uppercase tracking-tight">{selectedTx.type || 'deposito'}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Código Único</p>
                        <p className="text-zinc-800 font-bold uppercase tracking-tight truncate">#{selectedTx.id.slice(0, 10).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Data e Hora</p>
                        <p className="text-zinc-800 font-bold tracking-tight">
                          {date.toLocaleDateString('pt-BR')} • {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Saldo Resultante</p>
                        <p className="text-zinc-800 font-black tracking-tight">
                          R$ {Number(selectedTx.balance_after || 0).toFixed(2).replace('.', ',')}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[8px] text-zinc-400 font-black uppercase tracking-wider mb-0.5">Descrição Registrada</p>
                        <p className="text-zinc-800 font-bold tracking-tight italic">
                          "{desc}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fechar Button */}
                  <button
                    onClick={() => setSelectedTx(null)}
                    className="w-full py-4 bg-zinc-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl hover:bg-zinc-900"
                  >
                    Fechar Detalhes
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </motion.div>
  );
});

EarningsView.displayName = 'EarningsView';

export default EarningsView;
