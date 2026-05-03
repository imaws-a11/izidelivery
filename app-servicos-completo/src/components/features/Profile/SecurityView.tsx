import React from "react";
import { motion } from "framer-motion";

export const SecurityView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Segurança</h1>
        <div className="size-10" />
      </header>

      <main className="mt-4">
        <div className="bg-white border-y border-zinc-100">
           <button className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">password</span>
                 <span className="text-base font-bold text-zinc-800">Alterar Senha</span>
              </div>
              <span className="material-symbols-rounded text-zinc-300 text-sm">chevron_right</span>
           </button>
           <button className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">fingerprint</span>
                 <div className="text-left">
                    <span className="text-base font-bold text-zinc-800 block">Biometria (Face ID/Touch ID)</span>
                    <span className="text-xs text-zinc-400 font-medium">Acesse o app sem senha</span>
                 </div>
              </div>
              <div className="w-12 h-6 bg-yellow-400 rounded-full flex items-center px-1 justify-end transition-all">
                 <div className="size-4 bg-white rounded-full shadow-sm" />
              </div>
           </button>
           <button className="w-full px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">devices</span>
                 <span className="text-base font-bold text-zinc-800">Dispositivos Conectados</span>
              </div>
              <span className="material-symbols-rounded text-zinc-300 text-sm">chevron_right</span>
           </button>
        </div>
      </main>
    </div>
  );
};
