import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ExcursionDetailProps {
  excursion: any;
  onBack: () => void;
  onConfirmReservation: () => void;
}

export const ExcursionDetail: React.FC<ExcursionDetailProps> = ({
  excursion,
  onBack,
  onConfirmReservation,
}) => {
  if (!excursion) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="absolute inset-0 z-[140] bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-40 font-['Plus_Jakarta_Sans']"
    >
      <style>{`
        .clay-premium {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            box-shadow: 
                20px 20px 40px rgba(0,0,0,0.6),
                inset 2px 2px 4px rgba(255,255,255,0.05);
        }
        .text-glow {
            text-shadow: 0 0 20px rgba(250, 204, 21, 0.3);
        }
      `}</style>

      {/* FULLSCREEN HERO IMAGE */}
      <div className="relative w-full h-[550px] shrink-0 border-b border-white/10">
        <img 
          className="w-full h-full object-cover" 
          src={excursion.image} 
          alt={excursion.title}
        />
        
        {/* Dynamic Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 to-transparent" />
        
        {/* UPPER NAVIGATION */}
        <div className="absolute top-10 left-6 right-6 flex justify-between items-center z-20">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="size-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white"
          >
            <span className="material-symbols-outlined font-black">arrow_back</span>
          </motion.button>
          
          <div className="flex gap-4">
             <button className="size-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all">
                <span className="material-symbols-outlined">share</span>
             </button>
             <button className="size-14 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400 active:scale-95 transition-all">
                <span className="material-symbols-outlined fill-1">favorite</span>
             </button>
          </div>
        </div>

        {/* HERO CONTENT */}
        <div className="absolute bottom-12 left-8 right-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col gap-4"
          >
             <div className="inline-flex items-center gap-2 bg-yellow-400 text-black px-4 py-1.5 rounded-full w-fit">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] italic">Luxury Experience</span>
             </div>
             <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic leading-[0.9] drop-shadow-2xl">
                {excursion.title.split(':').map((part: string, i: number) => (
                   <span key={i} className={i === 1 ? "text-yellow-400 block mt-1" : "block"}>{part}</span>
                ))}
             </h1>
             <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-zinc-400">
                   <span className="material-symbols-outlined text-sm fill-1 text-yellow-400">location_on</span>
                   <span className="text-[11px] font-black uppercase tracking-widest">{excursion.origin}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-zinc-700" />
                <div className="flex items-center gap-1.5 text-zinc-400">
                   <span className="material-symbols-outlined text-sm fill-1 text-yellow-400">schedule</span>
                   <span className="text-[11px] font-black uppercase tracking-widest">3 Dias • Elite Plan</span>
                </div>
             </div>
          </motion.div>
        </div>
      </div>

      {/* DETALHES GRID BENTO */}
      <main className="px-8 -mt-10 relative z-20 space-y-12">
        
        {/* Core Specs Bento */}
        <section className="grid grid-cols-2 gap-4">
          <div className="clay-premium p-6 rounded-[32px] flex flex-col gap-4 group">
            <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl font-black">restaurant</span>
            </div>
            <div>
               <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-1">Culinária</p>
               <p className="text-sm font-black text-white italic uppercase tracking-tight leading-none">{excursion.includes?.[0] || 'Refeição Inclusa'}</p>
            </div>
          </div>

          <div className="clay-premium p-6 rounded-[32px] flex flex-col gap-4 group">
            <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-2xl font-black">directions_bus</span>
            </div>
            <div>
               <p className="text-[9px] uppercase font-black text-zinc-500 tracking-widest mb-1">Transporte</p>
               <p className="text-sm font-black text-white italic uppercase tracking-tight leading-none">{excursion.transporte}</p>
            </div>
          </div>
        </section>

        {/* Accomodation Section */}
        {excursion.hospedagem && (
          <section className="space-y-6">
            <div className="flex justify-between items-end px-2">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Elite Stay</h2>
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest italic">Ver Detalhes</span>
            </div>
            <div className="clay-premium p-3 rounded-[40px] overflow-hidden group">
              <div className="relative h-64 rounded-[32px] overflow-hidden mb-6">
                <img 
                   className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[1.5s]" 
                   src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
                   alt="Hospedagem"
                />
                <div className="absolute top-6 right-6 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full text-yellow-400 flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] fill-1">star</span>
                  <span className="text-xs font-black">5.0 EXCELENCE</span>
                </div>
              </div>
              <div className="px-5 pb-6">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-3">{excursion.hospedagem}</h3>
                <p className="text-xs text-zinc-500 font-bold leading-relaxed uppercase tracking-widest">Suítes presidenciais com concierge dedicado, lazer completo e serviços exclusivos da categoria Izi Black.</p>
              </div>
            </div>
          </section>
        )}

        {/* EXCLUSIVE ITINERARY (DESIGN TIMELINE PREMIUM) */}
        <section className="space-y-8">
           <div className="px-2">
              <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic">Master Roteiro</h2>
              <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.4em] mt-1">Timeline do Destino</p>
           </div>
          
           <div className="space-y-6">
              {[
                { day: '01', title: 'Check-in & VIP Lounge', desc: 'Embarque em transporte executivo com recepção personalizada.' },
                { day: '02', title: 'Exploração Exclusive', desc: 'Passeio guiado pelos pontos icônicos com acesso prioritário.' },
                { day: '03', title: 'Relax & Leisure', desc: 'Dia livre para desfrutar da estrutura premium ou atividades opcionais.' }
              ].map((step, i) => (
                <div key={i} className="flex gap-6">
                   <div className="flex flex-col items-center shrink-0">
                      <div className={`size-12 rounded-2xl flex items-center justify-center font-black text-sm italic ${i === 0 ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-zinc-900 text-zinc-600 border border-white/5'}`}>
                         {step.day}
                      </div>
                      {i < 2 && <div className="w-0.5 h-16 bg-gradient-to-b from-zinc-800 to-transparent my-2" />}
                   </div>
                   <div className="clay-premium flex-1 p-6 rounded-[28px] mb-2 border border-white/5">
                      <h4 className="font-black text-white uppercase italic tracking-tight text-lg mb-1">{step.title}</h4>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-relaxed">{step.desc}</p>
                   </div>
                </div>
              ))}
           </div>
        </section>
      </main>

      {/* FOOTER ACTION STICKY */}
      <footer className="fixed bottom-0 left-0 w-full z-[150] p-8 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="clay-premium rounded-[32px] p-6 flex items-center justify-between shadow-[0_40px_80px_rgba(0,0,0,1)]">
          <div className="flex flex-col">
            <span className="text-[8px] uppercase font-black text-zinc-500 tracking-[0.2em] mb-1">Luxury Package • PP</span>
            <div className="flex items-baseline gap-1">
              <span className="font-black text-white text-3xl tracking-tighter italic">R$ {excursion.price.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <button 
             onClick={onConfirmReservation}
             className="h-16 px-10 rounded-[24px] bg-yellow-400 text-black font-black uppercase tracking-[0.2em] text-[11px] hover:bg-yellow-300 transition-colors shadow-[0_15px_30px_rgba(250,204,21,0.25)] flex items-center gap-3 active:scale-95"
          >
            Reservar Experiência
            <span className="material-symbols-outlined font-black">navigate_next</span>
          </button>
        </div>
      </footer>

    </motion.div>
  );
};
