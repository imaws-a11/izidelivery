import React from "react";
import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../ui/Icon";

export const IziExpressPriorityView = () => {
  const { 
    transitData, 
    setTransitData, 
    navigateSubView, 
    marketConditions, 
    distanceValueKm 
  } = useApp();

  const priorities = [
    { id: "turbo", name: "Izi Turbo Flash", desc: "Entrega ultra-rápida até 15 min", time: "15 min", icon: "bolt", color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: "light", name: "Izi Light Flash", desc: "Entrega agilizada até 30 min", time: "30 min", icon: "electric_bolt", color: "text-yellow-400", bg: "bg-yellow-400/10" },
    { id: "normal", name: "Izi Express", desc: "Categoria normal de entrega", time: "1 hr", icon: "moped", color: "text-zinc-400", bg: "bg-zinc-800" },
    { id: "scheduled", name: "Izi Agendado", desc: "Você escolhe data e horário", time: "Agendar", icon: "event", color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  const getPriorityPrice = (priorityId: string) => {
    const settings = marketConditions.settings;
    const config = settings?.shippingPriorities?.[priorityId as keyof typeof settings.shippingPriorities];
    
    if (!config) {
      const fallbacks: any = { turbo: 15, light: 12, normal: 8, scheduled: 15 };
      return fallbacks[priorityId] || 10;
    }

    const minFee = Number(config.min_fee) || 0;
    const kmFee = Number((config as any).km_fee) || 0;
    const multiplier = Number(config.multiplier) || 1.0;
    
    const price = (minFee + (kmFee * distanceValueKm)) * multiplier;
    return parseFloat(price.toFixed(2)) || minFee;
  };

  return (
    <div className="absolute inset-0 z-40 bg-black text-white flex flex-col hide-scrollbar overflow-y-auto pb-4">
      <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50 border-b border-white/5">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigateSubView("explore_envios")} className="size-12 rounded-2xl bg-zinc-900/50 backdrop-blur-xl border border-white/10 shadow-xl flex items-center justify-center text-white active:scale-90 transition-all leading-none">
          <span className="material-symbols-outlined">arrow_back</span>
        </motion.button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">Prioridade</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Escolha a prioridade</p>
        </div>
      </header>

      <main className="px-6 space-y-8 mt-10">
        <div className="text-center mb-10">
          <motion.div 
             animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
             transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
             className="size-24 rounded-[35px] bg-yellow-400 flex items-center justify-center mx-auto mb-5 shadow-[15px_15px_30px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.6),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] border-2 border-yellow-300/30 relative group"
          >
            <div className="absolute inset-0 bg-white/20 rounded-[35px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="material-symbols-outlined text-5xl text-black/80 drop-shadow-sm relative z-10">speed</span>
          </motion.div>
          <h3 className="text-xl font-black text-white tracking-tight">Qual a sua urgência?</h3>
          <p className="text-zinc-500 text-xs font-semibold mt-2 max-w-[240px] mx-auto opacity-80">Diferentes níveis de prioridade para sua necessidade</p>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {priorities.map((p, i) => {
            const isSelected = transitData.priority === p.id;
            return (
              <motion.div
                key={p.id || `priority-${i}`}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, type: "spring", damping: 20 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const finalPrice = getPriorityPrice(p.id);
                  setTransitData({ 
                    ...transitData, 
                    priority: p.id as any,
                    scheduled: p.id === "scheduled",
                    estPrice: finalPrice
                  });
                  navigateSubView("shipping_details");
                }}
                className={`p-7 rounded-[40px] border cursor-pointer transition-all flex items-center gap-6 relative overflow-hidden group ${
                  isSelected 
                    ? "bg-yellow-400 border-yellow-400 shadow-[6px_6px_12px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" 
                    : "bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border-white/5"
                }`}
              >
                <div className={`size-16 rounded-[22px] flex items-center justify-center transition-all duration-500 ${isSelected ? 'bg-black/10' : p.bg + ' group-hover:scale-110 shadow-inner'}`}>
                  <span className={`material-symbols-outlined text-3xl ${isSelected ? 'text-black' : p.color}`}>{p.icon}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-black text-lg tracking-tight ${isSelected ? 'text-black' : 'text-white'}`}>{p.name}</h4>
                    <div className="flex flex-col items-end">
                       <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${isSelected ? 'text-black/60' : p.color}`}>{p.time}</span>
                       <span className={`text-xs font-black mt-0.5 ${isSelected ? 'text-black' : 'text-white'}`}>
                          R$ {getPriorityPrice(p.id).toFixed(2).replace('.', ',')}
                       </span>
                    </div>
                  </div>
                  <p className={`text-[11px] font-medium leading-tight ${isSelected ? 'text-black/50' : 'text-zinc-500 opacity-80'}`}>{p.desc}</p>
                </div>
                {isSelected && (
                  <motion.div layoutId="priority-check" className="absolute right-4 top-4 size-6 bg-black rounded-full flex items-center justify-center">
                     <Icon name="check" className="text-yellow-400 text-[14px]" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 p-7 rounded-[40px] flex items-center gap-5 mt-10">
          <div className="size-12 rounded-2xl bg-yellow-400/20 flex items-center justify-center shrink-0 border border-yellow-400/10">
             <span className="material-symbols-outlined text-yellow-400 text-xl font-bold">info</span>
          </div>
          <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
            Os tempos de entrega são estimativas calculadas pelo nosso algoritmo baseado na frota disponível em tempo real.
          </p>
        </div>
      </main>
    </div>
  );
};
