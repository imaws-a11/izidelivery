import React from 'react';
import { motion } from 'framer-motion';

interface PaymentProcessingViewProps {
  method?: 'card' | 'pix' | 'lightning' | 'wallet';
  message?: string;
}

export const PaymentProcessingView: React.FC<PaymentProcessingViewProps> = ({ 
  method = 'card',
  message = "Processando seu pagamento com segurança..." 
}) => {
  const getIcon = () => {
    switch (method) {
      case 'pix': return 'pix';
      case 'lightning': return 'bolt';
      case 'card': return 'credit_card';
      case 'wallet': return 'account_balance_wallet';
      default: return 'payments';
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center px-10 text-center">
      <div className="relative mb-12">
        {/* Animated Background Circles */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="absolute inset-[-40px] bg-yellow-400 rounded-full blur-3xl"
        />
        
        {/* Main Spinner */}
        <div className="relative size-32">
          <svg className="size-full" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#F3F4F6"
              strokeWidth="8"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#FACC15"
              strokeWidth="8"
              strokeLinecap="round"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ 
                pathLength: [0.1, 0.5, 0.1], 
                rotate: [0, 360, 720] 
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2, 
                ease: "easeInOut" 
              }}
            />
          </svg>
          
          {/* Method Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.span 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="material-symbols-outlined text-4xl text-zinc-900"
            >
              {getIcon()}
            </motion.span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">
          {method === 'pix' ? 'Gerando QR Code' : 
           method === 'lightning' ? 'Criando Invoice' : 
           'Validando Pagamento'}
        </h2>
        <p className="text-zinc-500 font-medium text-sm leading-relaxed max-w-[250px] mx-auto">
          {message}
        </p>
      </motion.div>

      {/* Safety Badges */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-12 flex flex-col items-center gap-4"
      >
        <div className="flex items-center gap-3 bg-zinc-50 px-4 py-2 rounded-full border border-zinc-100">
          <span className="material-symbols-outlined text-green-500 text-sm">verified_user</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Ambiente 100% Seguro</span>
        </div>
        <div className="flex gap-4 opacity-30 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Mercado_Pago_logo.svg/1200px-Mercado_Pago_logo.svg.png" alt="MP" className="h-4" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" alt="Visa" className="h-3" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" alt="Master" className="h-4" />
        </div>
      </motion.div>
    </div>
  );
};
