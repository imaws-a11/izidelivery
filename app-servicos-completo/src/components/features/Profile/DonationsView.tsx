import React from "react";
import { motion } from "framer-motion";

export const DonationsView = ({ onBack }: { onBack: () => void }) => {
  const causes = [
    { name: "S.O.S RS - Abrigos", org: "Cruz Vermelha", img: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=500&q=80", matched: true },
    { name: "Alimentando Vidas", org: "ONG Prato Fundo", img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500&q=80", matched: false },
    { name: "Animais Resgatados", org: "Patinhas do Bem", img: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=500&q=80", matched: true }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Izi Doações</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-6 space-y-8">
        <div className="bg-zinc-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-xl">
           <div className="absolute -right-10 -bottom-10 opacity-10">
             <span className="material-symbols-rounded text-[180px]">volunteer_activism</span>
           </div>
           <div className="relative z-10">
             <h2 className="text-3xl font-black leading-tight mb-2">O Izi dobra a<br/>sua doação.</h2>
             <p className="text-zinc-400 text-sm font-medium">Em campanhas selecionadas, para cada R$ 1 doado, o Izi doa mais R$ 1.</p>
           </div>
        </div>

        <div className="space-y-4">
           <h3 className="text-lg font-black tracking-tight text-zinc-900">Causas Apoiadas</h3>
           <div className="grid gap-4">
              {causes.map((cause, idx) => (
                <motion.div 
                  key={idx}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white rounded-3xl overflow-hidden shadow-lg border border-zinc-100"
                >
                   <div className="h-32 w-full relative">
                      <img src={cause.img} alt={cause.name} className="w-full h-full object-cover" />
                      {cause.matched && (
                        <div className="absolute top-3 left-3 bg-yellow-400 text-black px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                          Doação em Dobro
                        </div>
                      )}
                   </div>
                   <div className="p-5 flex items-center justify-between">
                      <div>
                         <h4 className="font-black text-zinc-900 text-lg leading-none">{cause.name}</h4>
                         <p className="text-xs text-zinc-500 font-bold mt-1">{cause.org}</p>
                      </div>
                      <button className="bg-zinc-900 text-white px-4 py-2 rounded-xl font-black text-xs hover:bg-zinc-800 transition-colors">
                         Doar
                      </button>
                   </div>
                </motion.div>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
};
