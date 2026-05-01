import React from 'react';
import { motion } from "framer-motion";
import { useApp } from "../../../../hooks/useApp";

interface ExploreServiceProps {
  transitData: any;
  setTransitData: (data: any) => void;
  onBack: () => void;
}

export const ExploreLightFlashView: React.FC<ExploreServiceProps> = ({ transitData, setTransitData, onBack }) => {
  const { navigateSubView } = useApp();

  const handleContinue = () => {
    setTransitData({ ...transitData, type: "utilitario", subService: "express", priority: "light", scheduled: false });
    navigateSubView("shipping_details");
  };

  return (
    <div className="fixed inset-0 z-[160] bg-white flex flex-col">
      <header className="p-6 flex items-center justify-between relative z-10">
        <button onClick={onBack} className="size-12 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 active:scale-90 transition-all">
          <span className="material-symbols-rounded text-zinc-900 font-black">arrow_back</span>
        </button>
        <span className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em]">Serviço Express</span>
        <div className="size-12" />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
        <section className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="size-48 bg-yellow-400 rounded-[60px] flex items-center justify-center shadow-2xl shadow-yellow-400/20 relative z-10"
            >
              <span className="material-symbols-rounded text-white text-8xl font-black">electric_bolt</span>
            </motion.div>
            <div className="absolute inset-0 bg-yellow-400/20 blur-[60px] rounded-full -z-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none">Izi Light Flash</h1>
            <p className="text-zinc-400 font-black text-sm uppercase tracking-widest">Agilidade e economia garantida</p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-zinc-50 rounded-[40px] p-8 border border-zinc-100 space-y-6">
            <div className="flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-zinc-100 shrink-0">
                <span className="material-symbols-rounded text-yellow-500 font-black text-2xl">speed</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Entrega em até 30 min</h3>
                <p className="text-xs font-black text-zinc-400 leading-relaxed">O equilíbrio perfeito entre velocidade e custo-benefício.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-zinc-100 shrink-0">
                <span className="material-symbols-rounded text-yellow-500 font-black text-2xl">location_on</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Rastreio em Tempo Real</h3>
                <p className="text-xs font-black text-zinc-400 leading-relaxed">Saiba exatamente onde seu objeto está a qualquer momento.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-zinc-100 shrink-0">
                <span className="material-symbols-rounded text-yellow-500 font-black text-2xl">thumb_up</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Qualidade Izi</h3>
                <p className="text-xs font-black text-zinc-400 leading-relaxed">Mesmo padrão de excelência de toda nossa rede.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-2">
           <div className="flex items-center justify-between p-6 bg-yellow-50 rounded-3xl border border-yellow-100">
              <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Taxa de Prioridade</span>
              <span className="text-lg font-black text-yellow-600 tracking-tighter">+ R$ 8,00</span>
           </div>
        </section>
      </div>

      <footer className="p-8 bg-white border-t border-zinc-50">
        <button 
          onClick={handleContinue}
          className="w-full h-20 bg-zinc-900 text-white rounded-[24px] font-black text-[12px] uppercase tracking-[0.25em] shadow-2xl shadow-zinc-900/20 active:scale-95 transition-all"
        >
          Continuar para o Envio
        </button>
      </footer>
    </div>
  );
};
