import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";

import iziCoinImg from "../../../assets/images/izi-coin-premium.png";

interface IziCoinTrackingViewProps {
  order: any;
  onClose: () => void;
  onGoToWallet: () => void;
  onSupport: () => void;
  onReturnToPayment: () => void;
  onCancel?: (orderId: string) => void;
}

export const IziCoinTrackingView: React.FC<IziCoinTrackingViewProps> = ({
  order,
  onClose,
  onGoToWallet,
  onSupport,
  onReturnToPayment,
  onCancel,
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
    <div className="h-full w-full flex items-center justify-center p-4 sm:p-8 overflow-hidden relative font-['Plus_Jakarta_Sans']">

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-2xl bg-[#121212] border-2 border-white/10 rounded-[40px] sm:rounded-[50px] p-8 relative flex flex-col gap-8 max-h-[95vh] overflow-y-auto no-scrollbar"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 size-10 rounded-[15px] bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white active:scale-90 transition-all z-20"
        >
          <Icon name="close" size={18} />
        </button>

        <div className="flex flex-col md:flex-row gap-8 items-center md:items-stretch">
          {/* Left Column: Hero & Info */}
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">Protocolo Financeiro</p>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Recarga em Curso</h2>
            </div>

            {/* Status Hero */}
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <motion.div
                animate={{ 
                  scale: isConfirmed ? [1, 1.1, 1] : 1
                }}
                className="size-28 rounded-[35px] bg-yellow-400 flex items-center justify-center shadow-lg relative z-10 overflow-hidden"
              >
                {isConfirmed ? (
                  <span className="material-symbols-outlined text-black font-black text-5xl transform -rotate-12">
                    check_circle
                  </span>
                ) : (
                  <img src={iziCoinImg} className="w-16 h-16 object-contain drop-shadow-lg" alt="Izi Coin" />
                )}
              </motion.div>
            </div>

            {/* Amount Display */}
            <div className="bg-white/[0.03] p-6 rounded-[35px] border border-white/5 w-full flex flex-col items-center">
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Total de Coins</span>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter">
                  {order?.total_price?.toLocaleString('pt-BR')}
                </span>
                <span className="text-lg font-black text-yellow-400 uppercase tracking-widest opacity-60">IZI</span>
              </div>
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-4">
                Ref: #COIN-{String(order?.id || "000000").slice(0, 6).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Vertical Divider (Desktop) */}
          <div className="hidden md:block w-px bg-white/5 self-stretch" />

          {/* Right Column: Timeline & Actions */}
          <div className="flex-1 flex flex-col gap-8 justify-center">
            {/* Timeline */}
            <div className="space-y-5">
              {steps.map((step, idx) => (
                <div key={step.id || idx} className="flex items-center gap-4 relative">
                  {idx < steps.length - 1 && (
                    <div className={`absolute left-5 top-8 w-0.5 h-5 transition-colors duration-500 ${idx < currentIdx ? "bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]" : "bg-zinc-800"}`} />
                  )}
                  
                  <div 
                    className={`size-10 rounded-[14px] flex items-center justify-center transition-all duration-500 z-10 
                      ${idx <= currentIdx 
                        ? "bg-yellow-400 text-black shadow-lg scale-105" 
                        : "bg-zinc-800 text-zinc-700 shadow-inner"
                      }`}
                  >
                    <Icon name={step.icon} size={18} />
                  </div>
                  
                  <div className="flex-1 text-left">
                    <p className={`text-xs font-black tracking-tight transition-colors duration-500 ${idx <= currentIdx ? "text-white" : "text-zinc-700"}`}>
                      {step.label}
                    </p>
                    {idx === currentIdx && (
                      <p className="text-[8px] font-bold text-yellow-400/50 uppercase tracking-widest animate-pulse mt-0.5">Sincronizando...</p>
                    )}
                  </div>

                  <AnimatePresence>
                    {idx < currentIdx && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-emerald-500">
                        <Icon name="check_circle" size={16} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="space-y-3">
              {!isConfirmed && (
                <div className="flex flex-col gap-2">
                  <button
                     onClick={onReturnToPayment}
                     className="w-full py-4 rounded-[20px] bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                  >
                    Alterar Pagamento
                  </button>
                  
                  <button
                     onClick={() => onCancel?.(order?.id)}
                     className="w-full py-4 rounded-[20px] bg-white/5 text-zinc-500 font-black text-[10px] uppercase tracking-widest border border-white/5 active:scale-95 transition-all"
                  >
                    Cancelar Recarga
                  </button>
                </div>
              )}

              {isConfirmed && (
                <button
                  onClick={onGoToWallet}
                  className="w-full py-5 rounded-[25px] bg-yellow-400 text-black font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg"
                >
                  <span>Ver Carteira</span>
                  <Icon name="arrow_forward" size={16} />
                </button>
              )}
              
              <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em] text-center pt-2">Izi Pay &copy; 2026</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
