import React from 'react';
import { motion } from "framer-motion";

interface EnviosExploreViewProps {
  onBack: () => void;
  navigateSubView: (view: string) => void;
}

export const EnviosExploreView: React.FC<EnviosExploreViewProps> = ({
  onBack,
  navigateSubView
}) => {
  const enviosServices = [
    { 
      id: 'express', 
      label: 'Izi Express', 
      desc: 'Entrega imediata em minutos', 
      icon: 'electric_bolt', 
      color: 'bg-yellow-400', 
      iconColor: 'text-black',
      tag: 'Mais rápido'
    },
    { 
      id: 'agendado', 
      label: 'Izi Agendado', 
      desc: 'Escolha o melhor horário', 
      icon: 'calendar_month', 
      color: 'bg-zinc-100', 
      iconColor: 'text-zinc-600' 
    },
    { 
      id: 'flash', 
      label: 'Izi Express Flash', 
      desc: 'Documentos e itens leves', 
      icon: 'speed', 
      color: 'bg-zinc-900', 
      iconColor: 'text-white',
      tag: 'Novo'
    },
    { 
      id: 'economico', 
      label: 'Izi Econômico', 
      desc: 'O menor preço da região', 
      icon: 'savings', 
      color: 'bg-emerald-100', 
      iconColor: 'text-emerald-600' 
    }
  ];

  return (
    <div className="fixed inset-0 bg-white z-[300] flex flex-col">
      {/* Header */}
      <div className="p-6 flex items-center gap-4">
        <button onClick={onBack} className="size-12 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 active:scale-90 transition-all">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <div className="flex flex-col">
           <h1 className="text-xl font-black text-zinc-900">Izi Envios</h1>
           <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">O que você precisa enviar?</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6">
         {/* Banner Principal */}
         <div className="bg-yellow-400 rounded-[40px] p-8 relative overflow-hidden shadow-2xl shadow-yellow-100 border-4 border-white">
            <div className="relative z-10">
               <h2 className="text-3xl font-black text-black leading-tight mb-2">Entregas que <br /> voam.</h2>
               <p className="text-sm font-bold text-black/60 max-w-[180px]">Envie qualquer item pela cidade com segurança total.</p>
            </div>
            <span className="absolute -bottom-8 -right-8 material-symbols-rounded text-[180px] text-black/10 rotate-12">package_2</span>
         </div>

         {/* Grid de Serviços */}
         <div className="grid grid-cols-1 gap-4">
            {enviosServices.map((s, i) => (
               <motion.div 
                 key={s.id}
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 whileTap={{ scale: 0.98 }}
                 className="bg-white rounded-[32px] p-6 border border-zinc-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all cursor-pointer relative group"
               >
                  <div className={`size-16 rounded-3xl ${s.color} flex items-center justify-center shadow-sm group-hover:rotate-3 transition-transform`}>
                     <span className={`material-symbols-rounded ${s.iconColor} text-3xl`}>{s.icon}</span>
                  </div>
                  
                  <div className="flex flex-col flex-1">
                     <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-zinc-900">{s.label}</h3>
                        {s.tag && (
                           <span className="bg-zinc-900 text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase">
                              {s.tag}
                           </span>
                        )}
                     </div>
                     <p className="text-xs font-bold text-zinc-400">{s.desc}</p>
                  </div>

                  <div className="size-10 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 text-zinc-300">
                     <span className="material-symbols-rounded">chevron_right</span>
                  </div>
               </motion.div>
            ))}
         </div>

         {/* Promo Section */}
         <div className="bg-zinc-900 rounded-[32px] p-6 flex items-center justify-between">
            <div className="flex flex-col gap-1">
               <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest">Oferta exclusiva</span>
               <h4 className="text-white font-bold text-sm">Ganhe 50% de cashback</h4>
               <p className="text-zinc-500 text-[10px]">No seu primeiro Izi Express</p>
            </div>
            <button className="bg-yellow-400 text-black font-black text-[10px] px-6 py-2.5 rounded-xl uppercase shadow-lg shadow-yellow-400/20">
               Ativar
            </button>
         </div>
      </div>
    </div>
  );
};
