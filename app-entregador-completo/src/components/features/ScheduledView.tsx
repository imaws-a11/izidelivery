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
        estimateSize: () => 180,
        overscan: 5,
    });

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-4 max-w-2xl mx-auto space-y-6 pt-4 h-full flex flex-col pb-32">
            <section className="px-2 shrink-0">
                <div className="flex flex-col gap-4">
                    <div className="text-center">
                        <p className="text-zinc-400 font-black uppercase tracking-[0.4em] text-[10px] mb-1">Planejamento</p>
                        <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase">Agenda de Entregas</h2>
                    </div>
                    
                    <div className="flex bg-zinc-100 p-1.5 rounded-[24px] border border-zinc-200">
                        <button 
                            onClick={() => setSubTabScheduled('confirmed')}
                            className={`flex-1 h-12 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                subTabScheduled === 'confirmed' 
                                ? 'bg-yellow-400 text-zinc-900 shadow-lg' 
                                : 'text-zinc-400'
                            }`}
                        >
                            <Icon name="event_available" size={16} />
                            Minha Agenda
                            {myAgenda.length > 0 && (
                                <span className={`size-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    subTabScheduled === 'confirmed' ? 'bg-white' : 'bg-zinc-200'
                                }`}>
                                    {myAgenda.length}
                                </span>
                            )}
                        </button>
                        <button 
                            onClick={() => setSubTabScheduled('available')}
                            className={`flex-1 h-12 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                subTabScheduled === 'available' 
                                ? 'bg-yellow-400 text-zinc-900 shadow-lg' 
                                : 'text-zinc-400'
                            }`}
                        >
                            <Icon name="explore" size={16} />
                            Disponíveis
                            {availableAgenda.length > 0 && (
                                <span className={`size-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                    subTabScheduled === 'available' ? 'bg-white' : 'bg-zinc-200'
                                }`}>
                                    {availableAgenda.length}
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
                    <div className="py-24 bg-white border border-zinc-100 rounded-[40px] flex flex-col items-center gap-6 text-center px-8">
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
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        className="bg-white p-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all border border-zinc-100 rounded-[2.5rem] shadow-lg h-full flex flex-col justify-between"
                                        onClick={() => setSelectedScheduledOrder(order)}
                                    >
                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-yellow-400 text-zinc-900 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <div className={`size-1.5 rounded-full ${isConfirmed ? 'bg-emerald-600 animate-pulse' : 'bg-yellow-600'}`} />
                                                    {serviceTypeLabel(order.service_type)}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Valor Líquido</p>
                                                    <p className="text-xl font-black text-zinc-900">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 mb-4 text-zinc-900">
                                                <div className="bg-yellow-400 size-10 rounded-2xl flex items-center justify-center shadow-lg">
                                                    <Icon name="calendar_month" size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-base leading-none uppercase tracking-tighter">
                                                        {dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '')}
                                                    </p>
                                                    <p className="text-xs font-bold mt-1 opacity-70">
                                                        {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="relative z-10 flex gap-4">
                                            <button className="flex-1 bg-zinc-900 text-yellow-400 font-black text-[9px] uppercase tracking-[0.2em] py-3.5 rounded-[18px] active:scale-95 transition-all flex items-center justify-center gap-3">
                                                {isConfirmed ? (
                                                    <><Icon name="task_alt" size={16} /> Ver Minha Agenda</>
                                                ) : (
                                                    <><Icon name="arrow_forward" size={16} /> Avaliar Oferta</>
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
