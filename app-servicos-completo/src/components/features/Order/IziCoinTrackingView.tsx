import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";

interface IziCoinTrackingViewProps {
  order: any;
  onClose: () => void;
  onGoToWallet: () => void;
  onSupport: () => void;
  onReturnToPayment: () => void;
}

export const IziCoinTrackingView: React.FC<IziCoinTrackingViewProps> = ({
  order,
  onClose,
  onGoToWallet,
  onSupport,
  onReturnToPayment,
}) => {
  const [status, setStatus] = useState(order?.status || "pendente_pagamento");

  useEffect(() => {
    if (order?.status) {
      setStatus(order.status);
    }
  }, [order?.status]);

  const isConfirmed = ["novo", "aceito", "confirmado", "concluido"].includes(status) || order?.payment_status === "paid";
  
  const steps = [
    { id: "pending", label: "Aguardando Pagamento", icon: "potted_plant", active: true },
    { id: "processing", label: "Processando Recarga", icon: "sync", active: isConfirmed },
    { id: "completed", label: "IZI Coins Creditados", icon: "verified", active: status === "concluido" || isConfirmed },
  ];

  const currentIdx = isConfirmed ? (status === "concluido" ? 2 : 1) : 0;

  return (
    <div className="absolute inset-0 z-[200] bg-black flex flex-col items-center justify-center p-6 italic overflow-y-auto no-scrollbar">
      {/* Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 size-96 bg-yellow-400/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-24 -left-24 size-96 bg-yellow-400/5 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-[#1a1a1a] border-[3px] border-white/10 rounded-[60px] p-10 shadow-[20px_20px_60px_rgba(0,0,0,0.6),-10px_-10px_30px_rgba(255,255,255,0.02),inset_6px_6px_15px_rgba(255,255,255,0.03),inset_-6px_-6px_15px_rgba(0,0,0,0.4)] relative flex flex-col items-center text-center gap-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 size-12 rounded-[22px] bg-zinc-800/50 border border-white/5 flex items-center justify-center text-zinc-500 active:scale-90 transition-all shadow-lg"
        >
          <Icon name="close" />
        </button>

        {/* Header Section */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em] shadow-sm">Protocolo Financeiro</p>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter italic drop-shadow-xl">Recarga em Curso</h2>
        </div>

        {/* Status Hero */}
        <div className="relative group">
          <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
          <motion.div
            animate={{ 
              rotate: isConfirmed ? 0 : [0, 10, -10, 0],
              scale: isConfirmed ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              rotate: { repeat: Infinity, duration: 3 },
              scale: { duration: 0.5 }
            }}
            className="size-32 rounded-[45px] bg-yellow-400 flex items-center justify-center shadow-[10px_10px_30px_rgba(250,204,21,0.3),inset_6px_6px_12px_rgba(255,255,255,0.6),inset_-6px_-6px_12px_rgba(0,0,0,0.2)] relative z-10"
          >
            <span className="material-symbols-outlined text-black font-black text-6xl italic transform -rotate-12">
              {isConfirmed ? "check_circle" : "currency_bitcoin"}
            </span>
          </motion.div>
        </div>

        {/* Amount Display */}
        <div className="bg-black/30 p-8 rounded-[40px] border border-white/5 w-full shadow-inner flex flex-col items-center">
          <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">Total de Coins</span>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black text-white tracking-tighter italic">
              {order?.total_price?.toLocaleString('pt-BR')}
            </span>
            <span className="text-xl font-black text-yellow-400 uppercase tracking-widest italic opacity-60">IZI</span>
          </div>
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-6 bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
            Ref: #COIN-{String(order?.id || "000000").slice(0, 6).toUpperCase()}
          </p>
        </div>

        {/* Timeline */}
        <div className="w-full space-y-6 px-4">
          {steps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-6 relative group">
              {idx < steps.length - 1 && (
                <div className={`absolute left-6 top-10 w-0.5 h-6 transition-colors duration-500 ${idx < currentIdx ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "bg-zinc-800"}`} />
              )}
              
              <div 
                className={`size-12 rounded-[18px] flex items-center justify-center transition-all duration-500 z-10 
                  ${idx <= currentIdx 
                    ? "bg-yellow-400 text-black shadow-[6px_6px_15px_rgba(0,0,0,0.3),inset_3px_3px_6px_rgba(255,255,255,0.5)] scale-110" 
                    : "bg-zinc-800 text-zinc-700 shadow-inner"
                  }`}
              >
                <Icon name={step.icon} size={20} />
              </div>
              
              <div className="flex-1 text-left">
                <p className={`text-sm font-black tracking-tight transition-colors duration-500 ${idx <= currentIdx ? "text-white italic" : "text-zinc-700"}`}>
                  {step.label}
                </p>
                {idx === currentIdx && (
                  <p className="text-[9px] font-bold text-yellow-400/50 uppercase tracking-widest animate-pulse">Sincronizando com a Blockchain Izi</p>
                )}
              </div>

              <AnimatePresence>
                {idx < currentIdx && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="text-emerald-500"
                  >
                    <Icon name="check_circle" size={18} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="w-full pt-4 space-y-4">
          {!isConfirmed && (
            <button
               onClick={onReturnToPayment}
               className="w-full py-4 rounded-[28px] bg-zinc-800 text-yellow-400 font-black text-xs uppercase tracking-widest border border-yellow-400/20 active:scale-95 transition-all shadow-lg"
            >
              Voltar ao Pagamento
            </button>
          )}

          <button
            onClick={isConfirmed ? onGoToWallet : onSupport}
            className={`w-full py-6 rounded-[35px] font-black text-sm uppercase tracking-[0.25em] italic transition-all active:scale-95 shadow-[0_15px_35px_rgba(0,0,0,0.3)] flex items-center justify-center gap-4 group h-[88px] 
              ${isConfirmed 
                ? "bg-yellow-400 text-black shadow-[0_15px_35px_rgba(250,204,21,0.2),inset_4px_4px_10px_rgba(255,255,255,0.6)]" 
                : "bg-zinc-800 text-white border border-white/5"
              }`}
          >
            <span className="leading-none pt-1">{isConfirmed ? "Ver Minha Carteira" : "Solicitar Suporte VIP"}</span>
            <Icon 
              name={isConfirmed ? "arrow_forward" : "support_agent"} 
              className={`transition-transform group-hover:translate-x-2 ${isConfirmed ? "text-black" : "text-yellow-400"}`} 
            />
          </button>
          
          <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em] pt-4">Izi Financial Ecosystem &copy; 2026</p>
        </div>
      </motion.div>
    </div>
  );
};
