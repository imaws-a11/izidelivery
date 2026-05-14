import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import Icon from '../common/Icon';

interface ScheduledViewProps {
 scheduledOrders: any[];
 driverId: string | null;
 subTabScheduled: 'confirmed' | 'available';
 setSubTabScheduled: (tab: 'confirmed' | 'available') => void;
 setSelectedScheduledOrder: (order: any) => void;
 getNetEarnings: (order: any) => number;
 serviceTypeLabel: (type: string) => string;
}

const ScheduledView = React.memo<ScheduledViewProps>(({ 
 scheduledOrders, 
 driverId, 
 subTabScheduled, 
 setSubTabScheduled, 
 setSelectedScheduledOrder,
 getNetEarnings,
 serviceTypeLabel
}) => {
 const parentRef = useRef<HTMLDivElement>(null);

 const myAgenda = scheduledOrders.filter((o: any) => o.driver_id && String(o.driver_id).trim() === String(driverId).trim());
 const availableAgenda = scheduledOrders.filter((o: any) => !o.driver_id || String(o.driver_id).trim() === '');
 
 const terminalStatuses = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'];
 const currentList = (subTabScheduled === 'confirmed' ? myAgenda : availableAgenda).filter(o => 
 !terminalStatuses.includes((o.status || '').toLowerCase())
 );

 const rowVirtualizer = useVirtualizer({
 count: currentList.length,
 getScrollElement: () => parentRef.current,
 estimateSize: () => 240,
 });

 return (
 <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 max-w-2xl mx-auto space-y-6 pt-4 h-full flex flex-col pb-32">
 <section className="px-2 shrink-0">
 <div className="flex flex-col gap-4">
 <div className="text-center">
 <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px] mb-1">Planejamento</p>
 <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">Agenda de Entregas</h2>
 </div>
 
 <div className="flex bg-zinc-100 p-1.5 rounded-xl border border-zinc-200">
 <button 
 onClick={() => setSubTabScheduled('confirmed')}
 className={`flex-1 h-12 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border-b-2 ${
 subTabScheduled === 'confirmed' 
 ? 'border-yellow-400 text-zinc-900' 
 : 'border-transparent text-zinc-400'
 }`}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="M9 16l2 2 4-4"></path></svg>
 Minha Agenda
 {myAgenda.length > 0 && (
 <span className="text-[10px] font-bold ml-1 text-yellow-600">
 ({myAgenda.length})
 </span>
 )}
 </button>
 <button 
 onClick={() => setSubTabScheduled('available')}
 className={`flex-1 h-12 text-[10px] font-bold uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 border-b-2 ${
 subTabScheduled === 'available' 
 ? 'border-yellow-400 text-zinc-900' 
 : 'border-transparent text-zinc-400'
 }`}
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>
 Disponíveis
 {availableAgenda.length > 0 && (
 <span className="text-[10px] font-bold ml-1 text-yellow-600">
 ({availableAgenda.length})
 </span>
 )}
 </button>
 </div>
 </div>
 </section>

 <div 
 ref={parentRef}
 className="flex-1 overflow-y-auto no-scrollbar"
 >
 {currentList.length === 0 ? (
 <div className="py-24 bg-white border border-zinc-100 rounded-xl flex flex-col items-center gap-6 text-center px-8">
 <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center">
 <Icon name={subTabScheduled === 'confirmed' ? 'calendar_today' : 'search'} className="text-4xl text-zinc-200" />
 </div>
 <div className="space-y-2">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
 {subTabScheduled === 'confirmed' ? 'Sua agenda está vazia' : 'Nenhum agendamento aberto'}
 </p>
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
 const order = currentList[virtualRow.index];
 const dt = new Date(order.scheduled_at);
 const isConfirmed = !!order.driver_id;
 
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
 className="bg-transparent py-4 relative group cursor-pointer transition-all border-b border-zinc-100 h-full flex flex-col justify-between"
 onClick={() => setSelectedScheduledOrder(order)}
 >
 <div className="relative z-10">
 <div className="flex justify-between items-start mb-4">
 <div className="text-zinc-900 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
 <div className={`size-1.5 rounded-full ${isConfirmed ? 'bg-emerald-500' : 'bg-yellow-500'}`} />
 {serviceTypeLabel(order.service_type)}
 </div>
 <div className="text-right">
 <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-400">Valor Líquido</p>
 <p className="text-lg font-bold text-zinc-900">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
 </div>
 </div>

 <div className="flex items-center gap-3 mb-4 text-zinc-900">
 <div className="text-yellow-600">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
 </div>
 <div>
 <p className="font-bold text-sm leading-none uppercase tracking-tighter">
 {dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '')}
 </p>
 <p className="text-xs font-semibold mt-1 opacity-70">
 {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
 </p>
 </div>
 </div>

 <div className="space-y-3 mb-4 pl-2 border-l-2 border-zinc-100">
 {order.pickup_address && (
 <div className="flex items-start gap-3">
 <div className="text-zinc-400 mt-0.5">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
 </div>
 <div>
 <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Coleta {order.merchant_name && `- ${order.merchant_name}`}</p>
 <p className="text-xs font-semibold text-zinc-700 line-clamp-1">{order.pickup_address.split(',')[0]}</p>
 </div>
 </div>
 )}
 {order.delivery_address && (
 <div className="flex items-start gap-3">
 <div className="text-zinc-400 mt-0.5">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
 </div>
 <div>
 <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Entrega {order.customer_name && `- ${order.customer_name}`}</p>
 <p className="text-xs font-semibold text-zinc-700 line-clamp-1">{order.delivery_address.split(',')[0]}</p>
 </div>
 </div>
 )}
 </div>
 </div>
 
 <div className="relative z-10 flex gap-4 mt-2">
 <button className="flex-1 bg-transparent border border-zinc-200 text-zinc-900 font-bold text-[9px] uppercase tracking-[0.2em] py-2 transition-colors flex items-center justify-center gap-2 hover:bg-zinc-50">
 {isConfirmed ? (
 <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Ver Minha Agenda</>
 ) : (
 <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg> Avaliar Oferta</>
 )}
 </button>
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

ScheduledView.displayName = 'ScheduledView';
export default ScheduledView;
