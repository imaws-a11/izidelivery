import React from 'react';
import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

interface ExploreEnviosViewProps {
  transitData: any;
  setTransitData: (data: any) => void;
}

export const ExploreEnviosView: React.FC<ExploreEnviosViewProps> = ({ transitData, setTransitData }) => {
  const { setSubView, navigateSubView, marketConditions, distanceValueKm } = useApp();

  const getPriorityPrice = (priorityId: string) => {
    const settings = marketConditions?.settings;
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
    { 
      id: "turbo", 
      name: "Izi Turbo Flash", 
      desc: "Entrega ultra-rápida em minutos", 
      time: "Até 15 min", 
      badge: "Mais Rápido",
      badgeColor: "bg-amber-100 text-amber-600",
      icon: "bolt", 
      iconColor: "text-amber-500",
      priorityId: "turbo", 
      action: () => setSubView("explore_turbo_flash") 
    },
    { 
      id: "light", 
      name: "Izi Light Flash", 
      desc: "Entrega agilizada e econômica", 
      time: "Até 30 min", 
      icon: "electric_bolt", 
      iconColor: "text-yellow-500",
      priorityId: "light", 
      action: () => setSubView("explore_light_flash") 
    },
    { 
      id: "normal", 
      name: "Izi Express", 
      desc: "Ideal para encomendas do dia a dia", 
      time: "Até 1h", 
      icon: "moped", 
      iconColor: "text-zinc-400",
      priorityId: "normal", 
      action: () => setSubView("explore_express") 
    },
    { 
      id: "scheduled", 
      name: "Izi Agendado", 
      desc: "Você define o melhor horário", 
      time: "Agendar", 
      icon: "event", 
      iconColor: "text-blue-500",
      priorityId: "scheduled", 
      action: () => setSubView("explore_scheduled") 
    },
    { 
      id: "coleta",  
      name: "Click e Retire", 
      desc: "Retirada em pontos parceiros", 
      time: "Econômico", 
      icon: "inventory_2", 
      iconColor: "text-emerald-500",
      isPriority: false, 
      action: () => setSubView("explore_click_collect") 
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] bg-white flex flex-col">
      {/* Background Decorativo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-400/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 -left-24 w-72 h-72 bg-blue-400/5 rounded-full blur-[80px]" />
      </div>

      <header className="relative z-10 p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }} 
            onClick={() => setSubView("none")} 
            className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:bg-zinc-100 transition-all"
          >
            <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-none">Izi Envios</h1>
            <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-1">Sua logística inteligente</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar px-6 pt-2 pb-32">
        <div className="mb-8 p-6 bg-zinc-900 rounded-[32px] relative overflow-hidden shadow-2xl shadow-zinc-900/20">
          <div className="relative z-10">
            <h2 className="text-white text-lg font-black tracking-tight mb-1">O que vamos enviar hoje?</h2>
            <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-[200px]">Selecione a velocidade que melhor atende sua necessidade.</p>
          </div>
          <span className="material-symbols-rounded absolute -right-4 -bottom-4 text-white/5 text-[120px] rotate-12">local_shipping</span>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {services.map((svc, i) => (
            <motion.div 
              key={svc.id} 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={svc.action} 
              className="bg-white border border-zinc-100 rounded-[32px] p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
            >
              <div className={`size-16 rounded-[24px] bg-zinc-50 flex items-center justify-center border border-zinc-100/50 shadow-inner shrink-0`}>
                <span className={`material-symbols-rounded text-3xl ${svc.iconColor}`}>{svc.icon}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-sm font-black text-zinc-900 truncate">{svc.name}</h3>
                  {svc.badge && (
                    <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${svc.badgeColor}`}>
                      {svc.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 font-black line-clamp-1 uppercase tracking-tight">{svc.desc}</p>
                <div className="flex items-center gap-1.5 mt-2">
                   <span className="material-symbols-rounded text-[14px] text-zinc-400">schedule</span>
                   <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{svc.time}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest block mb-0.5">A partir de</span>
                <span className="text-base font-black text-zinc-900 tracking-tighter">
                  R$ {svc.priorityId ? getPriorityPrice(svc.priorityId).toFixed(2).replace('.', ',') : "5,90"}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="mt-10 p-8 rounded-[40px] bg-zinc-50 border border-dashed border-zinc-200 flex flex-col items-center text-center">
           <div className="size-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
              <span className="material-symbols-rounded text-zinc-400 text-[20px]">verified_user</span>
           </div>
           <h4 className="text-sm font-black text-zinc-900 mb-1">Segurança em cada quilômetro</h4>
           <p className="text-[11px] text-zinc-400 font-bold leading-relaxed max-w-[240px]">Todos os envios são monitorados em tempo real e protegidos pelo Seguro Izi.</p>
        </section>
      </main>

      <footer className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-zinc-100 z-20">
         <button 
           onClick={() => setSubView("none")}
           className="w-full h-16 bg-zinc-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/10 active:scale-95 transition-all"
         >
           Voltar ao início
         </button>
      </footer>
    </div>
  );
};
