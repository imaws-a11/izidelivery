import React from "react";
import { motion } from "framer-motion";

export const HelpCenterView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] pb-20">
      <header className="bg-yellow-400 px-6 pt-20 pb-12 rounded-b-[40px] shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between mb-6">
           <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-black/10 active:bg-black/20 transition-colors">
             <span className="material-symbols-rounded text-black">arrow_back</span>
           </button>
           <h1 className="text-xl font-black text-black">Central de Ajuda</h1>
           <div className="size-10" />
        </div>
        <div className="bg-white p-2 rounded-2xl flex items-center gap-2 shadow-sm">
           <span className="material-symbols-rounded text-zinc-400 ml-2">search</span>
           <input type="text" placeholder="Como podemos ajudar?" className="flex-1 h-10 outline-none font-bold text-zinc-900" />
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
              <span className="material-symbols-rounded text-3xl text-zinc-800 mb-2">local_mall</span>
              <p className="font-bold text-zinc-900 text-sm">Problemas com pedido</p>
           </div>
           <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100">
              <span className="material-symbols-rounded text-3xl text-zinc-800 mb-2">account_balance_wallet</span>
              <p className="font-bold text-zinc-900 text-sm">Pagamentos e estornos</p>
           </div>
        </div>

        <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
           <h3 className="font-black text-lg mb-4">Dúvidas Frequentes</h3>
           <div className="space-y-4">
              <div className="border-b border-zinc-100 pb-4">
                 <p className="font-bold text-zinc-900">Como funciona o Clube Izi?</p>
              </div>
              <div className="border-b border-zinc-100 pb-4">
                 <p className="font-bold text-zinc-900">Meu pedido atrasou, o que fazer?</p>
              </div>
              <div>
                 <p className="font-bold text-zinc-900">Como alterar meu endereço?</p>
              </div>
           </div>
        </section>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="w-full bg-zinc-900 text-white h-16 rounded-3xl font-black flex items-center justify-center gap-2 shadow-xl"
        >
          <span className="material-symbols-rounded">support_agent</span>
          Falar com um atendente
        </motion.button>
      </main>
    </div>
  );
};
