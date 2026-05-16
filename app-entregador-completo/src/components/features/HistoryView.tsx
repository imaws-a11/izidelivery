import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: history.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 320, 
    overscan: 5,
  });

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }} 
      animate={{ opacity: 1, scale: 1 }} 
      className="px-5 pt-4 h-full flex flex-col font-['Plus_Jakarta_Sans']"
    >
      <header className="flex flex-col items-center text-center mb-10 shrink-0">
        <div className="bg-yellow-400/10 px-4 py-1.5 rounded-full border border-yellow-400/20 mb-4">
          <p className="text-[10px] font-black text-yellow-700 uppercase tracking-[0.4em]">Sua Jornada</p>
        </div>
        <h2 className="text-4xl font-black text-zinc-950 tracking-tighter uppercase leading-none">Histórico</h2>
        <p className="text-[11px] text-zinc-400 mt-2 font-bold uppercase tracking-widest leading-relaxed max-w-[280px] text-center">
          O registro de todas as missões que você transformou em sucesso.
        </p>
      </header>

      <div 
        ref={parentRef}
        className="flex-1 overflow-y-auto no-scrollbar w-full pb-40"
      >
        {history.length === 0 ? (
          <div className="py-24 rounded-3xl flex flex-col items-center gap-6 text-center relative overflow-hidden bg-white/20 backdrop-blur-xl border border-white/30">
            <div className="size-24 rounded-[2.5rem] bg-zinc-950 flex items-center justify-center shadow-2xl shadow-zinc-950/20">
              <Icon name="history_toggle_off" size={32} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 uppercase tracking-widest mb-1">Nenhuma Jornada</p>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Você ainda não completou corridas</p>
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
              const order = history[virtualRow.index];
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
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '1.25rem',
                  }}
                >
                  <div 
                    onClick={() => onSelectOrder(order)}
                    className="h-full rounded-[2.5rem] p-6 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all bg-white/40 backdrop-blur-md border border-white/60 shadow-sm"
                  >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/5 blur-3xl -mr-20 -mt-20 rounded-full transition-opacity group-hover:bg-yellow-400/10" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-zinc-900/5 blur-3xl -ml-16 -mb-16 rounded-full" />
                    
                    <div className="flex items-center justify-between relative z-10 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-zinc-950 flex items-center justify-center shadow-lg shadow-zinc-950/10">
                          <Icon 
                            name={order.service_type === 'mototaxi' ? 'motorcycle' : 'package_2'} 
                            size={18} 
                            className="text-yellow-400" 
                          />
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none mb-1">Missão</p>
                          <p className="text-[10px] font-black text-zinc-950 uppercase tracking-tighter">#{order.id.slice(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20 flex items-center gap-2">
                        <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Sucesso</span>
                      </div>
                    </div>

                    <div className="space-y-4 relative z-10 mb-6">
                      <h3 className="text-lg font-black text-zinc-950 tracking-tighter uppercase leading-none truncate">
                        {order.merchant_name || order.store_name || serviceTypeLabel(order.service_type)}
                      </h3>

                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-1 mt-1 shrink-0">
                          <div className="size-1.5 rounded-full bg-yellow-400" />
                          <div className="w-[1px] h-4 bg-zinc-200" />
                          <div className="size-1.5 rounded-full bg-zinc-300" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-zinc-500 font-bold truncate tracking-tight mb-1">
                            {cleanAddressText(order.pickup_address || order.origin || 'Origem não inf.')}
                          </p>
                          <p className="text-[11px] text-zinc-950 font-black truncate tracking-tight">
                            {cleanAddressText(order.delivery_address || order.destination || 'Destino não inf.')}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        <div className="flex items-center gap-1.5 bg-zinc-950/5 px-2 py-1 rounded-lg">
                          <Icon name="event" size={12} className="text-zinc-400" />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            {new Date(completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} • {new Date(completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {order.distance_km && (
                          <div className="flex items-center gap-1.5 bg-yellow-400/10 px-2 py-1 rounded-lg">
                            <Icon name="route" size={12} className="text-yellow-600" />
                            <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">
                              {parseFloat(order.distance_km).toFixed(1)} km
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-5 border-t border-white/40 relative z-10">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Seu Ganho</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xs font-black text-zinc-300">R$</span>
                          <span className={`text-2xl font-black tracking-tighter ${isNegative ? 'text-rose-500' : 'text-zinc-950'}`}>
                            {netEarningsLabel.replace('R$', '').trim()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-lg mb-1.5 ${isCashPaid ? 'bg-rose-500/10 text-rose-600 border border-rose-500/10' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/10'}`}>
                          {isCashPaid ? 'Dinheiro' : 'Carteira Izi'}
                        </span>
                        <span className="text-[10px] font-black text-zinc-400 tracking-tighter">
                          Total: R$ {totalOrderPrice.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
});

HistoryView.displayName = 'HistoryView';

export default HistoryView;
