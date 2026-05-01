import React from 'react';
import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";
import { useApp } from "../../../hooks/useApp";

interface OrderWaitingViewProps {
  type: 'payment' | 'merchant';
}

export const OrderWaitingView: React.FC<OrderWaitingViewProps> = ({ type }) => {
  const { setSubView, setTab, selectedItem } = useApp();

  const config = {
    payment: {
      title: 'Validando Pagamento',
      subtitle: 'Sincronizando com a rede',
      icon: 'sync',
      color: 'text-yellow-500',
      description: 'Estamos aguardando a confirmação da rede. Assim que detectado, seu pedido será liberado automaticamente.',
      accent: 'bg-yellow-400'
    },
    merchant: {
      title: 'Aguardando Lojista',
      subtitle: 'Pedido enviado com sucesso!',
      icon: 'storefront',
      color: 'text-zinc-900',
      description: 'O estabelecimento já recebeu seu pedido e está revisando os itens. Você será avisado em instantes!',
      accent: 'bg-yellow-400'
    }
  }[type];

  return (
    <div className="absolute inset-0 z-[200] bg-white flex flex-col items-center justify-center p-8 text-center overflow-hidden">
      {/* Background Decorative Element */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-yellow-400/5 to-transparent rounded-full blur-[100px] -translate-y-1/2" />
      
      <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15 }}
        className="size-40 rounded-[60px] bg-white border border-zinc-100 flex items-center justify-center mb-12 relative shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
      >
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute -inset-4 border-2 border-dashed border-yellow-400/20 rounded-[70px]"
        />
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="size-24 rounded-[40px] bg-zinc-50 flex items-center justify-center"
        >
          <Icon name={config.icon} className={`text-5xl ${config.color}`} />
        </motion.div>
        
        {/* Particle animations */}
        <motion.div 
          animate={{ y: [-10, 10, -10], x: [-5, 5, -5] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute -top-4 -right-4 size-10 rounded-2xl bg-yellow-400 shadow-lg shadow-yellow-400/20 flex items-center justify-center"
        >
          <Icon name="bolt" className="text-black text-xl" />
        </motion.div>
      </motion.div>

      <div className="space-y-3 mb-10 relative z-10">
        <h2 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-none italic">
          {config.title}
        </h2>
        <div className="flex items-center justify-center gap-3">
           <div className="size-2 bg-yellow-400 rounded-full animate-ping" />
           <p className="text-zinc-400 text-[11px] font-black uppercase tracking-[0.4em]">
             {config.subtitle}
           </p>
        </div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-50/50 backdrop-blur-sm rounded-[44px] p-10 border border-zinc-100 max-w-sm shadow-sm relative z-10"
      >
        <p className="text-zinc-500 text-sm font-bold leading-relaxed">
          {config.description}
        </p>
        
        {selectedItem && (
          <div className="mt-8 pt-8 border-t border-zinc-200/50 flex flex-col gap-1">
             <span className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em]">Identificador do Pedido</span>
             <span className="text-lg font-black text-zinc-900 tracking-tight">#{String(selectedItem.id).slice(0, 12).toUpperCase()}</span>
          </div>
        )}
      </motion.div>

      <div className="mt-16 flex flex-col gap-6 w-full max-w-xs relative z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setTab("orders");
            setSubView("none");
          }}
          className="bg-zinc-950 text-white font-black h-20 rounded-[30px] shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center justify-center gap-4 group"
        >
          <span className="uppercase tracking-[0.3em] text-[10px] font-black">Meus Pedidos</span>
          <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
        </motion.button>
        
        <button 
          onClick={() => {
            setTab("home");
            setSubView("none");
          }}
          className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.5em] py-2 hover:text-zinc-900 transition-colors"
        >
          Voltar para o Início
        </button>
      </div>

      {/* Bottom Footer Info */}
      <div className="absolute bottom-10 left-0 w-full flex flex-col items-center gap-2 opacity-20">
         <div className="h-px w-12 bg-zinc-200" />
         <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Izi Delivery Ecosystem</p>
      </div>
    </div>
  );
};
