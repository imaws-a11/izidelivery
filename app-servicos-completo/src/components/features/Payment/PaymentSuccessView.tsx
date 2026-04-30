import React from "react";
import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

export const PaymentSuccessView: React.FC = () => {
  const { setTab, setSubView, subView } = useApp();

  const isMobility = subView === "mobility_payment_success";

  return (
    <div className="fixed inset-0 z-[250] bg-black/98 flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="w-full max-w-sm bg-zinc-900 border border-white/5 rounded-[50px] p-10 text-center relative shadow-2xl"
      >
        <div className={`size-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${isMobility ? 'bg-yellow-400/10 border-yellow-400/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <span className={`material-symbols-outlined text-4xl ${isMobility ? 'text-yellow-400' : 'text-emerald-500'}`}>
            {isMobility ? 'verified' : 'check_circle'}
          </span>
        </div>
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Pagamento Aprovado!</h2>
        <p className="text-zinc-400 mt-2 mb-8 font-bold text-xs uppercase tracking-widest">
          {isMobility ? 'Sua solicitação de serviço foi confirmada. ✨' : 'Sucesso! Seu pedido já está com o estabelecimento. ✨'}
        </p>
        <button 
          onClick={() => {
            if (isMobility) {
              setSubView("waiting_driver");
            } else {
              setTab("orders");
              setSubView("none");
            }
          }} 
          className={`w-full py-5 font-black rounded-2xl uppercase tracking-widest active:scale-95 transition-all ${isMobility ? 'bg-yellow-400 text-black' : 'bg-emerald-500 text-white'}`}
        >
          Acompanhar {isMobility ? 'Solicitação' : 'Pedido'}
        </button>
      </motion.div>
    </div>
  );
};
