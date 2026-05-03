import React from "react";
import { motion } from "framer-motion";

export const DeliveryCodesView = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white pb-20">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors">
          <span className="material-symbols-rounded text-white">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-white">Código de Entrega</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-10 flex flex-col items-center flex-1">
        <div className="bg-white/10 p-8 rounded-full mb-8">
           <span className="material-symbols-rounded text-6xl text-yellow-400">qr_code_2</span>
        </div>
        
        <h2 className="text-2xl font-black text-center mb-4">Mantenha sua entrega segura</h2>
        <p className="text-zinc-400 text-center text-sm mb-12">
          Informe o código abaixo ao entregador apenas quando ele chegar com o seu pedido. Nunca repasse por chat ou telefone.
        </p>

        <div className="bg-yellow-400 w-full rounded-[40px] p-8 text-center shadow-2xl shadow-yellow-400/20 mt-auto">
           <p className="text-black/60 font-black text-xs uppercase tracking-[0.3em] mb-2">Código Atual</p>
           <h3 className="text-6xl font-black text-black tracking-[0.2em] mb-4">582</h3>
           <p className="text-black text-xs font-bold bg-black/10 inline-block px-4 py-2 rounded-full">
             Válido para pedidos em andamento
           </p>
        </div>
      </main>
    </div>
  );
};
