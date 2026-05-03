import React from "react";
import { motion } from "framer-motion";

export const SuggestRestaurantView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Sugerir Loja</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-8 space-y-6">
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-zinc-100 space-y-6">
          <p className="text-sm font-medium text-zinc-500 mb-4">Sua loja favorita não está no Izi? Conta pra gente!</p>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Nome do Estabelecimento</label>
            <input 
              type="text" 
              placeholder="Ex: Pizzaria do Zé"
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Instagram ou Link (Opcional)</label>
            <input 
              type="text" 
              placeholder="@pizzariadoze"
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Por que devemos chamá-los?</label>
            <textarea 
              rows={3}
              placeholder="A melhor pizza da cidade!"
              className="w-full bg-zinc-50 rounded-2xl p-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200 resize-none"
            />
          </div>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="w-full bg-yellow-400 text-black h-16 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:translate-y-1 transition-all"
        >
          Enviar Sugestão
        </motion.button>
      </main>
    </div>
  );
};
