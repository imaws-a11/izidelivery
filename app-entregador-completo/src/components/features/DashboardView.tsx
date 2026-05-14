import React, { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../common/Icon';

const cleanAddressText = (text: string | null | undefined): string => {
 if (!text) return '';
 return text.split('|')[0].trim();
};

const getStatusLabel = (status: string) => {
 const s = status.toLowerCase();
 if (s === 'atribuido' || s === 'assigned' || s.includes('aceito')) return { label: 'A Caminho', color: 'text-indigo-600', bg: 'bg-indigo-600/10', icon: 'electric_bolt' };
 if (s === 'coletado' || s === 'in_transit' || s.includes('transito')) return { label: 'Em Rota', color: 'text-blue-600', bg: 'bg-blue-600/10', icon: 'two_wheeler' };
 if (s === 'pronto') return { label: 'Pronto para Coleta', color: 'text-emerald-600', bg: 'bg-emerald-600/10', icon: 'check_circle' };
 return { label: 'Em Andamento', color: 'text-yellow-600', bg: 'bg-yellow-400/10', icon: 'hourglass_top' };
};

export const DashboardView = React.memo(({ 
 driverName, 
 stats, 
 activeMissions, 
 filteredOrders, 
 dedicatedSlots, 
 myApplications, 
 isProfileLoaded, 
 isApproved, 
 driverId,
 selectedOrder,
 isAccepting,
 onRefresh,
 isRefreshing,
 setActiveTab, 
 setActiveMission, 
 setSelectedOrder, 
 handleAccept, 
 handleDeclineOrder, 
 setSelectedSlot,
 setShowOnboarding,
 setShowOrderModal,
 getServicePresentation,
 getNetEarnings
}: any) => {
 const [isCardExpanded, setIsCardExpanded] = useState(false);
 const [pullY, setPullY] = useState(0);
 const touchStartY = useRef(0);

 const visibleSlots = useMemo(() => {
 const d = new Date();
 const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
 const todayDateNum = d.getDate();
 const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 const currentDayEng = daysEng[d.getDay()];

 const slotsArr = Array.isArray(dedicatedSlots) ? dedicatedSlots : [];
 const appsArr = Array.isArray(myApplications) ? myApplications : [];

 return slotsArr.filter(slot => {
 const application = appsArr.find(app => String(app.slot_id) === String(slot.id));
 const isAccepted = application?.status === 'accepted';
 const meta = slot.metadata || {};

 if (slot.slot_date) {
 let cleanDateStr = String(slot.slot_date).split('T')[0];
 if (cleanDateStr.includes('/')) {
 const parts = cleanDateStr.split('/');
 if (parts.length === 3) {
 if (parts[2].length === 4) cleanDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
 else if (parts[0].length === 4) cleanDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
 }
 }
 const slotDateObj = new Date(cleanDateStr + 'T12:00:00');
 const todayObj = new Date();
 todayObj.setHours(0,0,0,0);
 slotDateObj.setHours(0,0,0,0);
 
 if (isNaN(slotDateObj.getTime()) || slotDateObj.getTime() < todayObj.getTime()) return false;
 }
 
 if (meta.expires_at) {
 let cleanExpStr = String(meta.expires_at).split('T')[0];
 const expDateObj = new Date(cleanExpStr + 'T12:00:00');
 const todayObj = new Date();
 todayObj.setHours(0,0,0,0);
 expDateObj.setHours(0,0,0,0);
 if (!isNaN(expDateObj.getTime()) && expDateObj.getTime() < todayObj.getTime()) return false;
 }
 
 let isToday = false;
 if (slot.slot_date) {
 let cleanDateStr = String(slot.slot_date).split('T')[0];
 if (cleanDateStr.includes('/')) {
 const parts = cleanDateStr.split('/');
 if (parts.length === 3 && parts[2].length === 4) cleanDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
 else if (parts.length === 3 && parts[0].length === 4) cleanDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
 }
 if (cleanDateStr === todayStr) isToday = true;
 } else {
 if (meta.days_of_month && Array.isArray(meta.days_of_month) && meta.days_of_month.includes(todayDateNum)) isToday = true;
 else if (slot.day_of_week === 'Daily') isToday = true;
 else if (slot.day_of_week?.split(',').includes(currentDayEng)) isToday = true;
 }

 if (isToday && slot.working_hours) {
 const match = slot.working_hours.match(/(?:as|às|ate|até|-)\s*(\d{1,2})(?:[:h]\d{2})?/i);
 if (match) {
 let endHour = parseInt(match[1], 10);
 if (endHour <= 4) endHour += 24;
 const currentHour = new Date().getHours();
 if (currentHour >= endHour + 1) return false;
 }
 }

 if (isAccepted) return true;
 if (slot.status !== 'active' && !slot.is_active) return false;
 return isToday;
 })
 .sort((a, b) => {
 const appA = appsArr.find(app => String(app.slot_id) === String(a.id));
 const appB = appsArr.find(app => String(app.slot_id) === String(b.id));
 const isAccA = appA?.status === 'accepted';
 const isAccB = appB?.status === 'accepted';
 
 if (isAccA && !isAccB) return -1;
 if (!isAccA && isAccB) return 1;
 return 0;
 }).slice(0, 8);
 }, [dedicatedSlots, myApplications]);

 return (
 <div className="flex-1 flex flex-col h-full bg-zinc-50 relative overflow-hidden font-['Plus_Jakarta_Sans'] isolate">
 <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-zinc-100 to-transparent pointer-events-none z-[-1]" />

 <motion.div 
 className="absolute top-4 left-0 right-0 flex justify-center items-center z-50 pointer-events-none"
 animate={{ y: pullY > 20 ? pullY * 0.4 : -60, opacity: pullY > 20 ? 1 : 0 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25 }}
 >
 {isRefreshing ? (
 <div className="bg-zinc-900 text-yellow-400 size-12 rounded-full flex items-center justify-center border-4 border-zinc-800">
 <Icon name="refresh" className="animate-spin text-xl" />
 </div>
 ) : (
 <div className="bg-zinc-900 text-white px-5 py-3 rounded-full flex items-center gap-3 font-black text-[10px] uppercase tracking-widest border border-zinc-800">
 <Icon name="arrow_downward" className="text-yellow-400" />
 Puxe para atualizar
 </div>
 )}
 </motion.div>

 <div
 className="flex-1 overflow-y-auto w-full no-scrollbar pt-6 pb-40"
 onTouchStart={(e) => {
 if (e.currentTarget.scrollTop <= 0) {
 touchStartY.current = e.touches[0].clientY;
 } else {
 touchStartY.current = 0;
 }
 }}
 onTouchMove={(e) => {
 if (touchStartY.current === 0 || isRefreshing) return;
 const dy = e.touches[0].clientY - touchStartY.current;
 if (dy > 0 && e.currentTarget.scrollTop <= 0) {
 const resistance = Math.log10(1 + dy) * 28;
 setPullY(Math.min(resistance, 110));
 } else if (dy < 0) {
 setPullY(0);
 }
 }}
 onTouchEnd={() => {
 if (pullY >= 60 && !isRefreshing) {
 onRefresh();
 } else {
 setPullY(0);
 }
 touchStartY.current = 0;
 }}
 >
 <div className="px-6 space-y-10">
 {isProfileLoaded && !isApproved && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
 className="bg-white/10 p-6 rounded-xl flex items-center gap-5 relative overflow-hidden border border-zinc-200/50 "
 >
 <div className="size-14 rounded-2xl bg-zinc-900/5 flex items-center justify-center shrink-0 border border-zinc-200/50">
 <Icon name="warning" className="text-zinc-900" size={32} />
 </div>
 <div className="flex-1 text-left">
 <h3 className="text-zinc-900 font-black text-sm uppercase tracking-tighter leading-tight">Cadastro Pendente</h3>
 <p className="text-zinc-500 text-[10px] font-bold leading-tight mt-1 uppercase tracking-widest">
 Seu perfil está em análise. Complete seu cadastro ou aguarde a aprovação.
 </p>
 </div>
 <button 
 onClick={() => setShowOnboarding(true)}
 className="h-10 px-4 rounded-xl bg-zinc-900 text-white font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all "
 >
 Detalhes
 </button>
 </motion.div>
 )}

 {activeMissions.length > 0 && (
 <section className="mb-8 mt-2">
 <div className="flex items-center gap-3 px-2 mb-4">
 <div className="size-2 rounded-full bg-yellow-400 animate-pulse " />
 <h3 className="text-xs font-black text-zinc-400 tracking-[0.2em] uppercase">Missões em Andamento</h3>
 <div className="bg-zinc-900 px-2 py-0.5 rounded-md">
 <span className="text-[9px] font-black text-yellow-400">{activeMissions.length}</span>
 </div>
 </div>
 
 <div className="flex overflow-x-auto pb-4 gap-4 no-scrollbar -mx-6 px-6">
 {activeMissions.map((m: any) => {
 const st = getStatusLabel(m.status || '');
 return (
 <motion.button
 key={m.realId || m.id}
 whileTap={{ scale: 0.97 }}
 onClick={() => {
 setActiveMission(m);
 setActiveTab('active_mission');
 localStorage.setItem('Izi_active_mission', JSON.stringify(m));
 }}
 className="flex-shrink-0 w-[260px] p-5 rounded-[28px] bg-white border border-zinc-100 text-left flex flex-col gap-3 relative overflow-hidden active:bg-zinc-50 transition-colors"
 >
 <div className="absolute top-0 right-0 p-3 opacity-[0.03] pointer-events-none">
 <Icon name={st.icon} size={48} />
 </div>
 
 <div className="flex items-center gap-2">
 <div className={`size-1.5 rounded-full ${st.bg.replace('/10', '')}`} />
 <span className={`text-[8px] font-black uppercase tracking-widest ${st.color}`}>{st.label}</span>
 </div>
 
 <div className="min-w-0">
 <p className="text-xs font-black text-zinc-950 truncate">{(m as any).merchant_name || (m as any).store_name || 'Loja Parceira'}</p>
 <p className="text-[10px] text-zinc-400 font-bold truncate mt-0.5">{cleanAddressText((m as any).delivery_address || (m as any).destination || '') || 'Destino'}</p>
 </div>

 <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-50">
 <span className="text-[10px] font-black text-yellow-600 tracking-tight">R$ {Number((m as any).price || (m as any).total_price || 0).toFixed(2)}</span>
 <div className="size-7 rounded-lg bg-yellow-400 flex items-center justify-center ">
 <Icon name="arrow_forward" size={16} className="text-zinc-950" />
 </div>
 </div>
 </motion.button>
 );
 })}
 </div>
 </section>
 )}

 <header className={`bg-zinc-900 rounded-xl overflow-hidden relative ${isCardExpanded ? 'p-8' : 'p-6'} flex flex-col items-center text-center transition-all duration-500 border border-white/5`}>
 <button 
 onClick={() => setIsCardExpanded(!isCardExpanded)}
 className="absolute top-5 right-5 size-10 flex items-center justify-center active:scale-90 transition-all z-20 rounded-full bg-white/5"
 >
 <motion.div animate={{ rotate: isCardExpanded ? 180 : 0 }}>
 <Icon name="expand_more" size={24} className="text-white/60" />
 </motion.div>
 </button>

 <div className="flex flex-col items-center gap-1 mb-6">
 <div className="flex items-center justify-center gap-2 mb-1">
 <div className="size-2 rounded-full bg-yellow-400 animate-pulse" />
 <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">
 Entregador Parceiro
 </span>
 </div>
 <h1 className="text-xl font-black text-white tracking-tight leading-none uppercase">
 {driverName || 'Entregador'}
 </h1>
 </div>

 <div className="relative z-10 w-full mb-2">
 <p className={`font-black uppercase text-white/40 tracking-[0.4em] mb-1 transition-all duration-500 ${isCardExpanded ? 'text-[9px]' : 'text-[10px]'}`}>Ganhos de Hoje</p>
 <div className="flex flex-col items-center">
 <div className="flex items-start justify-center leading-none">
 <span className={`font-black text-yellow-400 transition-all duration-500 ${isCardExpanded ? 'text-2xl mt-3' : 'text-3xl mt-4'} mr-1`}>R$</span>
 <span className={`font-black text-white tracking-tighter leading-none transition-all duration-500 ${isCardExpanded ? 'text-6xl' : 'text-[7rem]'}`}>
 {stats.today.toFixed(2).replace('.', ',').split(',')[0]}
 </span>
 <span className={`font-black text-white/60 transition-all duration-500 ${isCardExpanded ? 'text-2xl mt-3' : 'text-3xl mt-4'} ml-1`}>,{stats.today.toFixed(2).split('.')[1]}</span>
 </div>
 </div>
 </div>

 <AnimatePresence>
 {isCardExpanded && (
 <motion.div 
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height: 'auto' }}
 exit={{ opacity: 0, height: 0 }}
 className="relative z-10 w-full mt-6 overflow-hidden"
 >
 <div className="space-y-1">
 {[
 { label: 'Aceitas', value: stats.count || 0, icon: 'check_circle', color: 'text-emerald-400' },
 { label: 'Rejeites', value: Object.keys(JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}')).length, icon: 'cancel', color: 'text-red-400' },
 { label: 'Esta Semana', value: `R$ ${stats.weekly.toFixed(2)}`, icon: 'calendar_today', color: 'text-yellow-400' },
 { label: 'Entregas Totais', value: stats.deliveries || 0, icon: 'local_shipping', color: 'text-blue-400' }
 ].map((item, idx) => (
 <div key={item.label}>
 <div className="flex justify-between items-center py-4 px-2">
 <div className="flex items-center gap-3">
 <div className={`size-8 flex items-center justify-center ${item.color}`}>
 <Icon name={item.icon} size={20} />
 </div>
 <span className="text-[10px] font-black uppercase tracking-widest text-white/50">{item.label}</span>
 </div>
 <span className="text-sm font-black text-white tracking-tight">{item.value}</span>
 </div>
 {idx < 3 && <div className="h-px bg-white/5 w-full" />}
 </div>
 ))}
 </div>

 <div className="mt-8 mb-2 flex flex-col gap-4 px-2">
 <div className="flex justify-between items-end">
 <div className="flex flex-col items-start">
 <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Nível {stats.level}</p>
 <div className="flex items-baseline gap-1">
 <span className="text-3xl font-black text-white leading-none">{stats.xp}</span>
 <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">XP</span>
 </div>
 </div>
 <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Meta Nível {stats.level + 1}</p>
 </div>
 
 <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${Math.min((stats.xp % 100), 98)}%` }}
 transition={{ duration: 1.5, ease: "circOut" }}
 className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 "
 />
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </header>

 <section className="space-y-6">
 <div className="flex flex-col items-center justify-center gap-3 text-center px-4">
 <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase">Novos Pedidos</h3>
 </div>
 <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar -mx-6 px-6">
 {filteredOrders.map((order: any) => {
 if (!order) return null;
 const isAvulsa = String(order.service_type || order.type || '').toLowerCase() === 'entrega_avulsa';
 const presentation = getServicePresentation(order);
 if (!presentation || !presentation.details) return null;
 
 const orderId = order.realId || order.id || '---';
 const isAcceptingThis = isAccepting && (selectedOrder?.realId === orderId || selectedOrder?.id === order.id);
 
 return (
 <motion.div 
 key={order.id} 
 initial={{ opacity: 0, y: 30 }}
 animate={{ opacity: 1, y: 0 }}
 className="flex-shrink-0 w-[90vw] max-w-[420px] relative pt-14 pb-4"
 >
 <div className="bg-white rounded-xl p-8 relative flex flex-col items-center text-center border border-zinc-200/50">
 <div className={`absolute -top-10 w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all ${
 presentation.isMobility 
 ? 'bg-indigo-600' 
 : 'bg-yellow-400'
 }`}>
 <Icon name={presentation.details.icon} className={`text-[40px] ${presentation.isMobility ? 'text-white' : 'text-zinc-900'}`} />
 </div>

 <div className="mt-8 w-full">
 <div className={`inline-block px-4 py-1.5 rounded-full ${isAvulsa ? 'bg-emerald-50 text-emerald-600' : (presentation.details.bg || 'bg-zinc-100') + ' ' + (presentation.details.color || 'text-zinc-500')} text-[10px] font-bold uppercase tracking-widest mb-2`}>
 {isAvulsa ? '📦 ENTREGA AVULSA' : presentation.isMobility ? 'NOVA CORRIDA' : 'NOVA OPORTUNIDADE'}
 </div>

 {(order.preparation_status || order.status) && (
 <div className="flex justify-center mb-4">
 <div className={`px-3 py-1 rounded-lg flex items-center gap-2 border ${
 (order.preparation_status === 'pronto' || order.status === 'pronto')
 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
 : 'bg-orange-50 border-orange-200 text-orange-600'
 }`}>
 <div className={`size-1.5 rounded-full animate-pulse ${
 (order.preparation_status === 'pronto' || order.status === 'pronto') ? 'bg-emerald-400' : 'bg-orange-400'
 }`} />
 <span className="text-[10px] font-black uppercase tracking-widest">
 {(order.preparation_status === 'pronto' || order.status === 'pronto') ? 'Pronto para Coleta' : 'Em Preparo'}
 </span>
 </div>
 </div>
 )}

 <h1 className="text-xl sm:text-2xl font-black text-zinc-900 leading-tight tracking-tight mb-2 uppercase">
 {isAvulsa ? 'Entrega Avulsa Disponível' : presentation.isMobility ? 'Nova Corrida Disponível' : 'Nova Entrega Disponível'}
 </h1>
 <p className="text-zinc-400 text-[10px] sm:text-[11px] mb-6 sm:mb-8 px-2 leading-relaxed font-bold uppercase tracking-widest">
 {isAvulsa ? 'Lojista parceiro precisa de um entregador.' : presentation.isMobility ? 'Um passageiro está aguardando por você.' : 'Uma missão de entrega de alta prioridade disponível.'}
 </p>

 <div className={`rounded-2xl p-4 sm:p-6 border mb-6 sm:mb-8 ${
 presentation.isMobility 
 ? 'bg-indigo-50 border-indigo-100' 
 : 'bg-zinc-50 border-zinc-100'
 }`}>
 <p className="text-zinc-400 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-2">Você ganha</p>
 <div className="flex items-center justify-center gap-2">
 <span className={`${presentation.isMobility ? 'text-indigo-600' : 'text-yellow-600'} text-3xl sm:text-4xl font-black`}>
 R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}
 </span>
 <Icon name={presentation.isMobility ? 'electric_bolt' : 'local_fire_department'} className={`${presentation.isMobility ? 'text-indigo-500' : 'text-yellow-500'} text-2xl sm:text-3xl`} />
 </div>
 <p className="text-zinc-300 text-[8px] sm:text-[9px] mt-2 font-bold uppercase tracking-tighter">
 {isAvulsa ? 'Taxa paga pela loja' : presentation.isMobility ? '+ Adicionais da corrida' : '+ Gorjeta do cliente'}
 </p>
 </div>

 <div className="grid grid-cols-2 gap-3 sm:gap-4 text-left w-full mb-6 sm:mb-8">
 <div className="flex flex-col bg-zinc-50 p-3 rounded-xl border border-zinc-100 col-span-2">
 <span className={`${presentation.isMobility ? 'text-indigo-600/80' : 'text-yellow-600/80'} text-[8px] sm:text-[9px] uppercase font-bold tracking-widest mb-1`}>{presentation.pickupLabel}</span>
 <span className={`${presentation.isMobility ? 'text-indigo-600' : 'text-yellow-600'} text-xs sm:text-sm font-black leading-tight uppercase mb-1 truncate`}>
 {String(order?.store_name || order?.merchant_name || presentation.headline || 'Loja Parceira')}
 </span>
 <span className="text-zinc-800 text-[11px] sm:text-xs font-bold leading-relaxed break-words">
 {cleanAddressText(order?.origin || order?.pickup_address) || presentation.pickupText || 'Endereço não informado'}
 </span>
 </div>

 <div className="flex flex-col bg-zinc-50 p-3 rounded-xl border border-zinc-100 col-span-2 relative pb-8">
 <span className="text-[8px] sm:text-[9px] uppercase font-bold text-zinc-400 tracking-widest mb-1">Destino Final</span>
 <span className="text-zinc-800 text-[11px] sm:text-xs font-bold leading-relaxed break-words pr-12">
 {cleanAddressText(order.destination || order.delivery_address) || presentation.destinationText || 'Destino não informado'}
 </span>
 
 <div className="absolute bottom-2 right-2 bg-yellow-400 text-zinc-900 px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-tight ">
 {order.distance_km ? `${parseFloat(order.distance_km).toFixed(1)} km` : (order.distance ? `${order.distance}` : '')}
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-2 sm:gap-3 w-full">
 <button 
 onClick={() => {
 setSelectedOrder(order);
 handleAccept(order);
 }}
 disabled={isAccepting}
 className={`w-full py-4 sm:py-5 rounded-2xl font-black uppercase text-xs sm:text-[13px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all disabled:opacity-50 ${
 presentation.isMobility
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
 : 'bg-yellow-400 hover:bg-yellow-500 text-zinc-900 shadow-yellow-500/20'
 }`}
 >
 {isAcceptingThis ? (
 <div className={`size-5 border-4 border-t-transparent rounded-full animate-spin ${presentation.isMobility ? 'border-white/30 border-t-white' : 'border-zinc-900/20 border-t-zinc-900'}`} />
 ) : (
 <>
 <Icon name="check" className="text-lg" />
 {presentation.ctaLabel}
 </>
 )}
 </button>
 
 <div className="flex gap-2 w-full mt-1">
 <button 
 onClick={() => {
 setSelectedOrder(order);
 setShowOrderModal(true);
 }}
 className="flex-1 py-3 rounded-xl text-zinc-400 font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all hover:text-zinc-600 hover:bg-zinc-100"
 >
 Detalhes
 </button>
 <button 
 onClick={() => {
 if(window.confirm('Recusar remove esta entrega da sua lista temporariamente. Tem certeza?')) {
 handleDeclineOrder(order.realId || order.id);
 }
 }}
 className="flex-[0.5] py-3 rounded-xl text-red-500/50 font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all hover:text-red-500 hover:bg-red-50"
 >
 Recusar
 </button>
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
 })
 }
 </div>
 </section>

 <section className="space-y-6">
 <div className="flex flex-col items-center justify-center gap-4 text-center">
 <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase text-center">Vagas Dedicadas</h3>
 <button 
 onClick={() => setActiveTab('dedicated')} 
 className="bg-white flex items-center gap-2 px-5 py-2.5 rounded-full border border-zinc-100 group active:scale-95 transition-all"
 >
 <div className="size-2 rounded-full bg-yellow-500 animate-pulse " />
 <p className="text-yellow-600 font-black text-[10px] uppercase tracking-[0.3em]">Ver Todas</p>
 </button>
 </div>
 <div className="grid gap-4">
 {visibleSlots.length === 0 ? (
 <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest text-center py-4">Nenhuma vaga no momento</p>
 ) : (
 visibleSlots.map((slot: any) => {
 const application = (Array.isArray(myApplications) ? myApplications : []).find(app => String(app.slot_id) === String(slot.id));
 const hasApplied = !!application;
 const isAccepted = application?.status === 'accepted';
 const maxDeliveries = (slot.metadata?.base_deliveries || slot.max_deliveries || 0);
 
 return (
 <motion.button 
 key={slot.id}
 onClick={() => { setSelectedSlot(slot); }}
 className={`relative w-full rounded-xl overflow-hidden p-6 sm:p-7 flex flex-col gap-5 text-left active:scale-[0.97] transition-all group ${isAccepted ? 'border-2 border-emerald-500 bg-emerald-50/40' : 'border border-zinc-100 bg-white'}`}
 >
 <div className="relative z-10 flex items-start justify-between gap-3 sm:gap-4">
 <div className="flex gap-4 items-center flex-1 min-w-0 pr-10">
 <div className={`size-14 sm:size-16 rounded-xl bg-white border flex items-center justify-center shrink-0 overflow-hidden relative ${isAccepted ? 'border-emerald-500/20' : 'border-zinc-100'}`}>
 {slot.admin_users?.store_logo ? (
 <img src={slot.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
 ) : (
 <div className={`size-full flex items-center justify-center ${isAccepted ? 'bg-emerald-500/10' : 'bg-yellow-400/10'}`}>
 <Icon name="military_tech" className={isAccepted ? 'text-emerald-500' : 'text-yellow-600'} size={28} />
 </div>
 )}
 </div>
 
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <p className={`text-[9px] font-black uppercase tracking-[0.2em] truncate ${isAccepted ? 'text-emerald-600' : 'text-zinc-400'}`}>
 {slot.admin_users?.store_name || 'Parceiro Izi'}
 </p>
 </div>
 <h4 className={`text-base sm:text-lg font-black tracking-tight leading-tight mb-1.5 ${isAccepted ? 'text-emerald-700' : 'text-zinc-900'}`}>{slot.title}</h4>
 
 <div className="space-y-1">
 <div className="flex items-start gap-1.5 text-[9px] font-bold uppercase tracking-widest text-zinc-900">
 <Icon name="location_on" className="text-zinc-400 mt-0.5" size={10} />
 <span className="leading-tight line-clamp-1 break-words font-black">{slot.admin_users?.store_address || 'Unidade Local'}</span>
 </div>
 <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-yellow-600">
 <Icon name="event" size={10} />
 <span>
 {slot.slot_date 
 ? new Date(slot.slot_date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })
 : (slot.day_of_week === 'Daily' ? 'Diário' : (
 slot.day_of_week?.split(',').map((d: string) => ({
 'Monday': 'Seg', 'Tuesday': 'Ter', 'Wednesday': 'Qua', 
 'Thursday': 'Qui', 'Friday': 'Sex', 'Saturday': 'Sáb', 'Sunday': 'Dom'
 }[d] || d)).join(', ') || 'Recorrente'
 ))}
 </span>
 </div>
 </div>
 </div>
 </div>
 
 <div className="shrink-0 bg-white p-3 sm:p-4 rounded-[28px] border border-zinc-100 flex flex-col items-center justify-center min-w-[95px] sm:min-w-[105px]">
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Valor Diária</p>
 <p className={`text-xl sm:text-2xl font-black leading-none ${isAccepted ? 'text-emerald-600' : 'text-yellow-600'}`}>
 <span className="text-[10px] mr-0.5 font-bold opacity-60">R$</span>
 {parseFloat(slot.fee_per_day || 0).toFixed(0)}
 </p>
 <div className={`mt-2 py-0.5 px-2.5 ${isAccepted ? 'bg-emerald-500/10 text-emerald-600' : 'bg-yellow-400 text-zinc-900'} rounded-lg`}>
 <p className="text-[7px] font-black uppercase tracking-tight">Até {maxDeliveries} Ent.</p>
 </div>
 </div>
 </div>

 {hasApplied && !isAccepted && (
 <div className="relative z-10 mx-1 px-5 py-3.5 rounded-xl flex items-center justify-between bg-yellow-400/10 border border-yellow-500/30">
 <div className="flex items-center gap-3">
 <div className="size-2 rounded-full bg-yellow-500 animate-pulse" />
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-700">
 AGUARDANDO LOJISTA
 </span>
 </div>
 <div className="size-7 rounded-xl bg-yellow-400 text-zinc-900 flex items-center justify-center ">
 <Icon name="hourglass_empty" size={14} className="animate-spin-slow" />
 </div>
 </div>
 )}
 <div className="relative z-10 w-full h-px bg-zinc-100/50" />
 <div className="relative z-10 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Icon name="info" className="text-zinc-300" size={14} />
 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
 {isAccepted ? 'VAGA GARANTIDA' : 'VER DETALHES'}
 </span>
 </div>
 <Icon name="arrow_forward" className={isAccepted ? 'text-emerald-500' : 'text-yellow-500'} size={18} />
 </div>
 </motion.button>
 );
 })
 )}
 </div>
 </section>
 </div>
 </div>
 </div>
 );
});
