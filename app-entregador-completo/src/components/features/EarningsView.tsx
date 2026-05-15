import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

const EarningsView = React.memo<EarningsViewProps>(({ stats, onShowBankDetails, onShowWithdrawHistory, onWithdrawRequest, onNavigateToMissions }) => {
 const [earningsViewTab, setEarningsViewTab] = useState<'week' | 'month' | 'year'>('week');

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

 return (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 className="flex-1 flex flex-col bg-zinc-50 overflow-hidden font-['Plus_Jakarta_Sans']"
 >
 {/* Header Premium */}
 <div className="px-6 pt-8 pb-4 space-y-6">
 <div className="flex items-center justify-between">
 <div>
 <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">Meus Ganhos</h2>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={onShowBankDetails}
 className="size-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
 >
 <Icon name="account_balance" size={20} />
 </button>
 <button 
 onClick={onShowWithdrawHistory}
 className="size-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400 active:scale-95 transition-all"
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
 ? 'bg-white text-zinc-900' 
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
 <div className="bg-white p-6 rounded-xl border border-zinc-100 space-y-4">
 <div className="size-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-400">
 <Icon name="bolt" size={20} className="text-yellow-500" />
 </div>
 <div>
 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Eficiência</p>
 <p className="text-lg font-black text-zinc-900 leading-none">R$ {(mainValue / (stats.count || 1)).toFixed(2).replace('.', ',')}</p>
 <p className="text-[8px] text-zinc-400 font-bold uppercase mt-1">Média p/ entrega</p>
 </div>
 </div>

 <div className="bg-white p-6 rounded-xl border border-zinc-100 space-y-4">
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
 className="bg-zinc-900 rounded-xl p-8 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
 >
 <div className="absolute right-0 top-0 w-40 h-40 bg-yellow-400/10 blur-[80px] -mr-20 -mt-20" />
 
 <div className="relative z-10 space-y-6">
 <div className="flex items-center gap-3">
 <div className="size-12 rounded-2xl bg-yellow-400 flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
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

 <div className="h-8" />
 </div>
 </motion.div>
 );
});

EarningsView.displayName = 'EarningsView';

export default EarningsView;
