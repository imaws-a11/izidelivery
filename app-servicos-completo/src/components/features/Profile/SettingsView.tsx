import React from "react";
import { motion } from "framer-motion";

export const SettingsView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Configurações</h1>
        <div className="size-10" />
      </header>

      <main className="mt-4">
        <div className="bg-white border-y border-zinc-100">
           <button className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">notifications_active</span>
                 <span className="text-base font-bold text-zinc-800">Notificações Push</span>
              </div>
              <div className="w-12 h-6 bg-yellow-400 rounded-full flex items-center px-1 justify-end transition-all">
                 <div className="size-4 bg-white rounded-full shadow-sm" />
              </div>
           </button>
           <button className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">dark_mode</span>
                 <span className="text-base font-bold text-zinc-800">Tema Escuro</span>
              </div>
              <div className="w-12 h-6 bg-zinc-200 rounded-full flex items-center px-1 justify-start transition-all">
                 <div className="size-4 bg-white rounded-full shadow-sm" />
              </div>
           </button>
           <button className="w-full px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">language</span>
                 <span className="text-base font-bold text-zinc-800">Idioma</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                 <span className="text-sm font-bold">Português (BR)</span>
                 <span className="material-symbols-rounded text-sm">chevron_right</span>
              </div>
           </button>
        </div>
      </main>
    </div>
  );
};
