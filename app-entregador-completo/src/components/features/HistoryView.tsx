import React from 'react';
import { motion } from 'framer-motion';
import Icon from '../common/Icon';

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

interface HistoryViewProps {
    history: any[];
    getNetEarnings: (order: any) => number;
    serviceTypeLabel: (type: string) => string;
    onSelectOrder: (order: any) => void;
}

const HistoryView = React.memo<HistoryViewProps>(({ history, getNetEarnings, serviceTypeLabel, onSelectOrder }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-40 pt-4">
            <header className="flex flex-col items-center text-center gap-1">
                <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.4em]">Histórico</p>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tight text-center uppercase">Sua Jornada</h2>
                <p className="text-xs text-zinc-400 mt-1 font-bold uppercase tracking-widest">Registro consolidado de suas corridas e ganhos.</p>
            </header>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="py-24 clay-card rounded-[40px] flex flex-col items-center gap-6 text-center shadow-2xl relative overflow-hidden bg-white">
                        <div className="size-20 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                            <Icon name="history_toggle_off" className="text-4xl text-yellow-600/50" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-1">Nenhuma Jornada</p>
                            <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Você ainda não completou corridas</p>
                        </div>
                    </div>
                ) : (
                    history.map((order: any, i: number) => {
                        let netEarnings = getNetEarnings(order);
                        const completedAt = order.updated_at || order.created_at;
                        
                        const isCashPaid = order.payment_method === 'dinheiro' || order.payment_method === 'cash';
                        const totalOrderPrice = Number(order.total_price || order.price || 0);

                        let netEarningsLabel = `R$ ${netEarnings.toFixed(2).replace('.', ',')}`;
                        let isNegative = false;

                        if (isCashPaid && totalOrderPrice > 0) {
                            netEarnings = netEarnings - totalOrderPrice;
                            isNegative = netEarnings < 0;
                            netEarningsLabel = `${isNegative ? '-' : ''} R$ ${Math.abs(netEarnings).toFixed(2).replace('.', ',')}`;
                        }

                        return (
                        <div 
                            key={order.id} 
                            onClick={() => onSelectOrder(order)}
                            className="clay-card rounded-[32px] p-6 space-y-5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all bg-white"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl -mr-16 -mt-16 rounded-full transition-opacity group-hover:bg-yellow-400/20" />
                            
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] bg-zinc-50 px-3 py-1 rounded-full shadow-inner border border-zinc-100">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-sm">
                                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Finalizado
                                </span>
                            </div>

                            <div className="bg-zinc-50 rounded-3xl p-5 border border-zinc-100 shadow-inner relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <div className="size-2 rounded-full border-2 border-yellow-500 bg-white" />
                                            <div className="w-[1px] h-6 border-l border-dashed border-zinc-200" />
                                            <div className="size-2 rounded-full border-2 border-zinc-300 bg-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">{serviceTypeLabel(order.service_type)}</p>
                                            <p className="text-sm font-black text-zinc-900 leading-tight uppercase tracking-tighter">{cleanAddressText(order.delivery_address || order.destination || 'Endereço Indisponível')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-zinc-100">
                                        <Icon name="event" size={14} className="text-zinc-300" />
                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                            {new Date(completedAt).toLocaleDateString('pt-BR')} <span className="mx-1 opacity-40">•</span> {new Date(completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="bg-zinc-50 p-4 rounded-[20px] border border-zinc-100 shadow-inner flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] line-clamp-1 mt-0.5">Lucro Líquido</p>
                                        <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isCashPaid ? 'text-rose-600 bg-rose-50 border-rose-100' : 'text-emerald-600 bg-emerald-50 border-emerald-100'}`}>
                                            {isCashPaid ? 'Dinheiro' : 'Online'}
                                        </span>
                                    </div>
                                    <span className={`text-xl font-black tracking-tighter ${isNegative ? 'text-rose-600 drop-shadow-sm' : 'text-yellow-600 drop-shadow-sm'}`}>
                                        {netEarningsLabel}
                                    </span>
                                </div>
                                <div className="bg-zinc-100 p-4 rounded-[20px] border border-zinc-200 text-right flex flex-col justify-center shadow-inner">
                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Total Pedido</p>
                                    <div className="flex flex-wrap items-center justify-end gap-2">
                                        {isCashPaid && (
                                            <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100 whitespace-nowrap">
                                                R$ {parseFloat(order.total_price || 0).toFixed(2).replace('.', ',')} em mãos
                                            </span>
                                        )}
                                        <span className="text-sm font-black text-zinc-900 opacity-80">R$ {parseFloat(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )})
                )}
            </div>
        </motion.div>
    );
});

HistoryView.displayName = 'HistoryView';

export default HistoryView;
