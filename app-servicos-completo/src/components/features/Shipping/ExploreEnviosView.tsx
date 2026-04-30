import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

export const ExploreEnviosView = () => {
  const { setSubView, transitData, setTransitData, navigateSubView, marketConditions, distanceValueKm } = useApp();

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

  const services = [
    { id: "coleta",  name: "Click e Retire Izi", desc: "Retirada rápida em lojas parceiras", icon: "inventory_2", isPriority: false, action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "coleta" }); navigateSubView("shipping_details"); } },
    { id: "turbo", name: "Izi Turbo Flash", desc: "Entrega ultra-rápida até 15 min", time: "15 min", color: "text-amber-400", isPriority: true, icon: "bolt", priorityId: "turbo", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "express", priority: "turbo", scheduled: false }); navigateSubView("shipping_details"); } },
    { id: "light", name: "Izi Light Flash", desc: "Entrega agilizada até 30 min", time: "30 min", color: "text-yellow-400", isPriority: true, icon: "electric_bolt", priorityId: "light", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "express", priority: "light", scheduled: false }); navigateSubView("shipping_details"); } },
    { id: "normal", name: "Izi Express", desc: "Categoria normal de entrega", time: "1 hr", color: "text-zinc-100", isPriority: true, icon: "moped", priorityId: "normal", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "express", priority: "normal", scheduled: false }); navigateSubView("shipping_details"); } },
    { id: "scheduled", name: "Izi Agendado", desc: "Você escolhe data e horário", time: "Agendar", color: "text-blue-400", isPriority: true, icon: "event", priorityId: "scheduled", action: () => { setTransitData({ ...transitData, type: "utilitario", subService: "express", priority: "scheduled", scheduled: true }); navigateSubView("shipping_details"); } }
  ];

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar">
      <div className="fixed inset-0 pointer-events-none opacity-20">
         <div className="absolute bottom-0 right-0 w-80 h-80 bg-yellow-400/20 rounded-full blur-[120px]" />
         <div className="absolute top-40 left-0 w-60 h-60 bg-yellow-400/10 rounded-full blur-[100px]" />
      </div>

      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-6 border-b border-zinc-900/50">
        <div className="flex items-center gap-5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("none")} className="size-11 rounded-2xl bg-zinc-900/50 border border-white/10 flex items-center justify-center shadow-lg transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white">Izi Envios</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Entregamos qualquer coisa</p>
          </div>
        </div>
      </header>

      <main className="px-6 pt-10 flex flex-col gap-6 relative z-10 pb-32">
        {services.map((svc, i) => (
          <motion.div 
            key={svc.id || `svc-${i}`} 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={svc.action} 
            className="relative group bg-zinc-800 shadow-[15px_15px_30px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 rounded-[40px] p-7 cursor-pointer transition-all"
          >
             <div className="flex items-center gap-6">
                <div className="size-16 rounded-[28px] bg-black/40 flex items-center justify-center border border-white/5 shadow-inner">
                   <span className="material-symbols-outlined text-white/40 group-hover:text-yellow-400 transition-colors text-3xl">{svc.icon}</span>
                </div>
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-black text-white tracking-tight">{svc.name}</h3>
                      {svc.time && <span className={`text-[10px] font-black uppercase tracking-widest ${svc.color}`}>{svc.time}</span>}
                   </div>
                   <p className="text-[11px] text-zinc-500 font-bold leading-tight line-clamp-1">{svc.desc}</p>
                </div>
                <div className="text-right ml-2">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">A partir de</p>
                   <p className="text-lg font-black text-white tracking-tighter">R$ {svc.priorityId ? getPriorityPrice(svc.priorityId).toFixed(2).replace('.', ',') : "5,90"}</p>
                </div>
             </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
};
