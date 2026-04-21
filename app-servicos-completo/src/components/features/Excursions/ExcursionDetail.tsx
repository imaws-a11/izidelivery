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
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[140] bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-32 font-['Plus_Jakarta_Sans']"
    >
      <style>{`
        .clay-card {
            background: #1a1a1a;
            box-shadow: 
                8px 8px 16px rgba(0,0,0,0.4),
                inset 2px 2px 4px rgba(255,255,255,0.05),
                inset -2px -2px 4px rgba(0,0,0,0.5);
        }
        .clay-card-yellow {
            background: #FFD700;
            box-shadow: 
                inset 4px 4px 8px rgba(255,255,255,0.4),
                inset -4px -4px 8px rgba(0,0,0,0.1),
                0 10px 20px rgba(255,215,0,0.2);
        }
        .clay-icon-container {
            box-shadow: 
                inset 2px 2px 4px rgba(255,255,255,0.1),
                inset -2px -2px 4px rgba(0,0,0,0.3);
        }
        .fill-icon {
            font-variation-settings: 'FILL' 1;
        }
      `}</style>

      {/* Immersive Header */}
      <div className="relative w-full h-[397px] overflow-hidden rounded-b-[2rem] shadow-2xl shrink-0">
        <img 
          className="w-full h-full object-cover" 
          src={excursion.image} 
          alt={excursion.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        
        {/* Quick Nav Overlays */}
        <div className="absolute top-6 left-6 flex gap-4">
          <button 
            onClick={onBack}
            className="clay-card w-12 h-12 rounded-full flex items-center justify-center text-yellow-400 active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="absolute top-6 right-6 flex gap-4">
          <button className="clay-card w-12 h-12 rounded-full flex items-center justify-center text-yellow-400 active:scale-95 transition-all">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button className="clay-card w-12 h-12 rounded-full flex items-center justify-center text-yellow-400 active:scale-95 transition-all">
            <span className="material-symbols-outlined">favorite</span>
          </button>
        </div>

        <div className="absolute bottom-8 left-6 right-6">
          <div className="inline-block px-4 py-1 bg-yellow-400 text-black rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-3">
            PREMIUM EXPERIENCE
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-1 leading-tight">{excursion.title}</h1>
          <div className="flex items-center gap-2 text-yellow-400">
            <span className="material-symbols-outlined text-sm fill-icon">location_on</span>
            <span className="text-sm font-semibold opacity-90">{excursion.origin}</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <main className="px-6 mt-8 relative z-10 space-y-8">
        {/* Package Details Bento */}
        <section className="grid grid-cols-2 gap-4">
          <div className="clay-card p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 clay-icon-container bg-zinc-900 rounded-full flex items-center justify-center text-yellow-400 mb-1">
              <span className="material-symbols-outlined text-3xl">restaurant</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Refeições</span>
            <span className="text-sm font-bold text-white leading-tight">{excursion.includes?.[0] || 'Refeição Inclusa'}</span>
          </div>
          <div className="clay-card p-5 rounded-3xl flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-12 h-12 clay-icon-container bg-zinc-900 rounded-full flex items-center justify-center text-yellow-400 mb-1">
              <span className="material-symbols-outlined text-3xl">directions_bus</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Transporte</span>
            <span className="text-sm font-bold text-white leading-tight">{excursion.transporte}</span>
          </div>
        </section>

        {/* Premium Accommodation Section (only if exists) */}
        {excursion.hospedagem && (
          <section className="space-y-4">
            <div className="flex justify-between items-end">
              <h2 className="text-2xl font-black tracking-tight text-white">Acomodação Elite</h2>
              <span className="text-yellow-400 text-xs font-bold uppercase tracking-widest">Ver Detalhes</span>
            </div>
            <div className="clay-card p-2 rounded-3xl overflow-hidden">
              <div className="relative h-48 rounded-2xl overflow-hidden mb-4">
                <img 
                   className="w-full h-full object-cover" 
                   src="https://lh3.googleusercontent.com/aida-public/AB6AXuAgooE49J24mqBW6rxiZETYjzy21yP7TH6LDGUl3BKVyCHI3t-ZHyedPt_G09OMnBa5jG0Dw6m6GHBIXabJpch8lAzJYTi1mbMAOCjeU_L-OBBNx_jai0FPyyUeaagX9glD_-hTViTNUtkAZVhH9DOUrPqA_ZCTvQxxbhoSgz2j2MDFWM2oPj9JY7k959OR_JuTXoTALoQHbFac5WRAhc62tDvC7JFpHCQ_Vpi5MMe3XPxIUpohlK6Wibmu_hB-7RP85hYHgbLL1X4"
                   alt="Acomodação"
                />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-yellow-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm fill-icon">star</span>
                  <span className="text-xs font-bold">5.0</span>
                </div>
              </div>
              <div className="px-3 pb-4">
                <h3 className="text-lg font-bold text-white">{excursion.hospedagem}</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">Suíte master com vista panorâmica, jacuzzi privativa e serviço de luxo.</p>
              </div>
            </div>
          </section>
        )}

        {/* Itinerary */}
        <section className="space-y-6">
          <h2 className="text-2xl font-black tracking-tight text-white">Roteiro Exclusivo</h2>
          <div className="space-y-4">
            {/* Day 1 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 clay-card-yellow rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-black text-black">01</span>
                </div>
                <div className="w-1 h-full bg-zinc-800 my-2 rounded-full"></div>
              </div>
              <div className="clay-card flex-1 p-5 rounded-3xl mb-2">
                <h4 className="font-extrabold text-white mb-1">Embarque Premium</h4>
                <p className="text-sm text-zinc-400">Recepção no local de partida com {excursion.transporte}.</p>
              </div>
            </div>
            {/* Day 2 */}
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 clay-card rounded-full flex items-center justify-center flex-shrink-0 text-yellow-400">
                  <span className="text-xs font-black">02</span>
                </div>
                {excursion.atividades && <div className="w-1 h-full bg-zinc-800 my-2 rounded-full"></div>}
              </div>
              <div className="clay-card flex-1 p-5 rounded-3xl mb-2">
                <h4 className="font-extrabold text-white mb-1">Exploração e Lazer</h4>
                <p className="text-sm text-zinc-400">Passeio pelos principais pontos turísticos com guia especializado.</p>
              </div>
            </div>
            {/* Day 3 (Se tiver atividades adicionais) */}
            {excursion.atividades && (
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-10 h-10 clay-card rounded-full flex items-center justify-center flex-shrink-0 text-yellow-400">
                    <span className="text-xs font-black">03</span>
                  </div>
                </div>
                <div className="clay-card flex-1 p-5 rounded-3xl mb-2">
                  <h4 className="font-extrabold text-white mb-1">{excursion.atividades}</h4>
                  <p className="text-sm text-zinc-400">Dia focado em atividades especiais e contato com a natureza ou atrações.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Sticky Bottom Section */}
      <div className="fixed bottom-0 left-0 w-full z-50 p-6 bg-gradient-to-t from-black via-black/95 to-transparent">
        <div className="w-full clay-card rounded-3xl flex items-center justify-between shadow-2xl px-6 py-5">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-extrabold text-zinc-400 tracking-[0.1em] mb-1">Total por pessoa</span>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white tracking-tighter text-2xl">R$ {excursion.price.toFixed(2).replace('.', ',')}</span>
            </div>
          </div>
          <button 
             onClick={onConfirmReservation}
             className="clay-card-yellow h-14 px-6 rounded-full flex items-center justify-center active:scale-95 transition-all flex-shrink-0 ml-4"
          >
            <span className="text-[11px] font-black tracking-widest text-black whitespace-nowrap">RESERVAR AGORA</span>
          </button>
        </div>
      </div>

    </motion.div>
  );
};
