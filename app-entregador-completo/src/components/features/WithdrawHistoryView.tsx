import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import Icon from '../common/Icon';

interface WithdrawHistoryViewProps {
 withdrawHistory: any[];
 setShowWithdrawHistory: (show: boolean) => void;
 setSelectedWithdraw: (tx: any) => void;
 setShowWithdrawDetail: (show: boolean) => void;
}

const WithdrawHistoryView = React.memo<WithdrawHistoryViewProps>(({ 
 withdrawHistory, 
 setShowWithdrawHistory, 
 setSelectedWithdraw, 
 setShowWithdrawDetail 
}) => {
 const parentRef = useRef<HTMLDivElement>(null);

 const rowVirtualizer = useVirtualizer({
 count: withdrawHistory.length,
 getScrollElement: () => parentRef.current,
 estimateSize: () => 110,
 overscan: 5,
 });

 return (
 <motion.div 
 key="withdraw-history-modal"
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 className="fixed inset-0 z-[250] bg-zinc-50 no-scrollbar overflow-hidden font-['Plus_Jakarta_Sans'] flex flex-col"
 >
 <header className="sticky top-0 z-50 bg-white px-5 pt-8 pb-4 flex items-center justify-between border-b border-zinc-100 shrink-0">
 <button 
 onClick={() => setShowWithdrawHistory(false)}
 className="size-12 rounded-xl bg-zinc-50 flex items-center justify-center active:scale-95 transition-transform border border-zinc-100"
 >
 <Icon name="arrow_back" className="text-zinc-900" />
 </button>
 <div className="flex flex-col items-end">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Financeiro</p>
 <h2 className="text-lg font-black text-zinc-900 tracking-tighter uppercase">Histórico de Saques</h2>
 </div>
 </header>

 <div 
 ref={parentRef}
 className="flex-1 overflow-y-auto no-scrollbar px-5 pt-8 pb-32"
 >
 {withdrawHistory.length === 0 ? (
 <div className="bg-white rounded-xl p-12 flex flex-col items-center justify-center text-center gap-6 border border-zinc-100 mt-10 " >
 <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
 <Icon name="history_edu" size={40} className="text-zinc-200" />
 </div>
 <div className="space-y-2">
 <p className="text-zinc-900 font-black uppercase text-[10px] tracking-widest">Nada por aqui</p>
 <p className="text-zinc-400 text-[9px] font-black">Você ainda não realizou nenhum saque.</p>
 </div>
 </div>
 ) : (
 <div
 style={{
 height: `${rowVirtualizer.getTotalSize()}px`,
 width: '100%',
 position: 'relative',
 }}
 >
 {rowVirtualizer.getVirtualItems().map((virtualRow) => {
 const tx = withdrawHistory[virtualRow.index];
 
 return (
 <div
 key={virtualRow.key}
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 width: '100%',
 height: `${virtualRow.size}px`,
 transform: `translateY(${virtualRow.start}px)`,
 paddingBottom: '1rem',
 }}
 >
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 onClick={() => { setSelectedWithdraw(tx); setShowWithdrawDetail(true); }}
 className="bg-white rounded-[30px] p-6 border border-zinc-100 flex items-center gap-5 relative overflow-hidden transition-all active:scale-95 cursor-pointer hover:border-yellow-400/30 h-full"
 
 >
 <div className={`size-14 rounded-2xl flex items-center justify-center border shrink-0 ${
 tx.status === 'concluido' ? 'bg-emerald-50 border-emerald-100' : 
 tx.status === 'recusado' ? 'bg-rose-50 border-rose-100' :
 'bg-yellow-50 border-yellow-100'
 }`}>
 <Icon 
 name={tx.status === 'concluido' ? 'verified' : tx.status === 'recusado' ? 'close' : 'sync'} 
 size={24} 
 className={tx.status === 'concluido' ? 'text-emerald-500' : tx.status === 'recusado' ? 'text-rose-500' : 'text-yellow-600'} 
 />
 </div>

 <div className="flex-1 space-y-1 min-w-0">
 <div className="flex items-center justify-between">
 <p className="text-zinc-900 font-black text-xl tracking-tighter">R$ {Number(tx.amount).toFixed(2).replace('.', ',')}</p>
 <div className="flex items-center gap-2">
 {tx.receipt_url && (
 <div className="bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
 <Icon name="image" size={10} />
 RECIBO
 </div>
 )}
 <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
 tx.status === 'concluido' ? 'bg-emerald-50 text-emerald-500' : 
 tx.status === 'recusado' ? 'bg-rose-50 text-rose-500' :
 'bg-yellow-50 text-yellow-600'
 }`}>
 {tx.status || 'Pendente'}
 </span>
 </div>
 </div>
 <p className="text-[9px] text-zinc-400 font-black uppercase truncate">
 {new Date(tx.created_at).toLocaleDateString('pt-BR')} às {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </motion.div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </motion.div>
 );
});

WithdrawHistoryView.displayName = 'WithdrawHistoryView';
export default WithdrawHistoryView;
