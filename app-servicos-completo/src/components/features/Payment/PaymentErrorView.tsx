import React from "react";
import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

export const PaymentErrorView: React.FC = () => {
  const { setSubView } = useApp();

  return (
    <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[50px] p-10 text-center relative"
      >
        <div className="size-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Ops! Algo deu errado</h2>
        <p className="text-zinc-500 mt-2 mb-8 font-bold text-xs uppercase tracking-widest">Não conseguimos processar seu pagamento. ⚠️</p>
        <button 
          onClick={() => setSubView("checkout")} 
          className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all"
        >
          Tentar Novamente
        </button>
      </motion.div>
    </div>
  );
};
