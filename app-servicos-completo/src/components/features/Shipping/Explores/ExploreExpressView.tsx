import React from 'react';
import { motion } from "framer-motion";
import { useApp } from "../../../../hooks/useApp";

interface ExploreServiceProps {
  transitData: any;
  setTransitData: (data: any) => void;
  onBack: () => void;
}

export const ExploreExpressView: React.FC<ExploreServiceProps> = ({ transitData, setTransitData, onBack }) => {
  const { navigateSubView } = useApp();

  const handleContinue = () => {
    setTransitData({ ...transitData, type: "utilitario", subService: "express", priority: "normal", scheduled: false });
    navigateSubView("shipping_details");
  };

  return (
    <div className="fixed inset-0 z-[160] bg-white flex flex-col">
      <header className="p-6 flex items-center justify-between relative z-10">
        <button onClick={onBack} className="size-12 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 active:scale-90 transition-all">
          <span className="material-symbols-rounded text-zinc-900 font-black">arrow_back</span>
        </button>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Serviço Padrão</span>
        <div className="size-12" />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-10">
        <section className="flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              className="size-48 bg-zinc-100 rounded-[60px] flex items-center justify-center shadow-2xl shadow-zinc-200/50 relative z-10"
            >
              <span className="material-symbols-rounded text-zinc-900 text-8xl font-black">moped</span>
            </motion.div>
            <div className="absolute inset-0 bg-zinc-100/50 blur-[60px] rounded-full -z-10" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none">Izi Express</h1>
            <p className="text-zinc-400 font-black text-sm uppercase tracking-widest">O clássico que nunca falha</p>
          </div>
        </section>

        <section className="space-y-6">
          <div className="bg-zinc-50 rounded-[40px] p-8 border border-zinc-100 space-y-6">
            <div className="flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-zinc-100 shrink-0">
                <span className="material-symbols-rounded text-zinc-900 font-black text-2xl">schedule</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Entrega em até 1h</h3>
                <p className="text-xs font-black text-zinc-400 leading-relaxed">Tempo padrão para suas necessidades cotidianas.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-zinc-100 shrink-0">
                <span className="material-symbols-rounded text-zinc-900 font-black text-2xl">savings</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Melhor Preço</h3>
                <p className="text-xs font-black text-zinc-400 leading-relaxed">A opção mais econômica para quem não tem pressa extrema.</p>
              </div>
            </div>

            <div className="flex items-start gap-5">
              <div className="size-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-zinc-100 shrink-0">
                <span className="material-symbols-rounded text-zinc-900 font-black text-2xl">package_2</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">Cuidado no Transporte</h3>
                <p className="text-xs font-black text-zinc-400 leading-relaxed">Manuseio cuidadoso para que tudo chegue impecável.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-2">
           <div className="flex items-center justify-between p-6 bg-zinc-100 rounded-3xl border border-zinc-200">
              <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Taxa de Prioridade</span>
              <span className="text-lg font-black text-zinc-600 tracking-tighter">Incluso no valor base</span>
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
