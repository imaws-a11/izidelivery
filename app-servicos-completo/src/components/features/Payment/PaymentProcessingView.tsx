import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";

interface PaymentProcessingViewProps {
  method: string;
  onFinished?: () => void;
  status?: 'processing' | 'success' | 'error';
  errorMessage?: string;
}

export const PaymentProcessingView: React.FC<PaymentProcessingViewProps> = ({ 
  method, 
  onFinished, 
  status = 'processing',
  errorMessage 
}) => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const getMethodDetails = () => {
    switch (method) {
      case 'pix': return { label: 'PIX', icon: 'pix', color: 'text-emerald-500' };
      case 'bitcoin_lightning': return { label: 'Bitcoin Lightning', icon: 'bolt', color: 'text-yellow-500' };
      case 'cartao': return { label: 'Cartão de Crédito', icon: 'credit_card', color: 'text-blue-500' };
      case 'wallet': return { label: 'Saldo Izi Pay', icon: 'account_balance_wallet', color: 'text-emerald-400' };
      default: return { label: 'Pagamento', icon: 'payments', color: 'text-zinc-400' };
    }
  };

  const details = getMethodDetails();

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col items-center justify-center p-8 text-center">
      <AnimatePresence mode="wait">
        {status === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="space-y-12"
          >
            <div className="relative">
              <div className="size-32 rounded-[40px] bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-xl">
                 <motion.div
                   animate={{ 
                     rotate: [0, 360],
                     scale: [1, 1.1, 1]
                   }}
                   transition={{ 
                     rotate: { duration: 4, repeat: Infinity, ease: "linear" },
                     scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
                   }}
                   className="size-20 rounded-3xl bg-zinc-900 flex items-center justify-center text-yellow-400 shadow-2xl"
                 >
                    <Icon name={details.icon} size={32} />
                 </motion.div>
              </div>
              <div className="absolute -bottom-4 -right-4 size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-lg">
                 <div className="size-6 border-4 border-zinc-100 border-t-yellow-400 rounded-full animate-spin" />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">
                Processando {details.label}{dots}
              </h2>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] max-w-[240px] mx-auto leading-relaxed">
                Estamos validando sua transação com a rede. Não feche o aplicativo.
              </p>
            </div>
          </motion.div>
        )}

        {status === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
             <div className="size-32 rounded-[40px] bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xl mx-auto">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 200 }}
                  className="size-20 rounded-3xl bg-emerald-500 flex items-center justify-center text-white shadow-2xl"
                >
                   <Icon name="check_circle" size={40} />
                </motion.div>
             </div>

             <div className="space-y-4">
               <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">
                 Pagamento Confirmado!
               </h2>
               <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                 Seu pedido já foi enviado para a loja.
               </p>
             </div>
          </motion.div>
        )}

        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
             <div className="size-32 rounded-[40px] bg-rose-50 border border-rose-100 flex items-center justify-center shadow-xl mx-auto">
                <div className="size-20 rounded-3xl bg-rose-500 flex items-center justify-center text-white shadow-2xl">
                   <Icon name="error" size={40} />
                </div>
             </div>

             <div className="space-y-4">
               <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">
                 Ops! Algo deu errado
               </h2>
               <p className="text-xs font-bold text-rose-500 uppercase tracking-tight px-6">
                 {errorMessage || "Não foi possível processar seu pagamento. Tente novamente."}
               </p>
             </div>

             <button 
               onClick={onFinished}
               className="h-14 px-12 bg-zinc-900 text-yellow-400 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
             >
               Voltar e tentar outro
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="absolute bottom-12 flex items-center gap-3">
         <div className="h-px w-8 bg-zinc-100" />
         <span className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.5em]">Izi Safe Checkout</span>
         <div className="h-px w-8 bg-zinc-100" />
      </div>
    </div>
  );
};
