import React from 'react';
import { motion } from "framer-motion";
import iziCoinImgAsset from "../../../assets/images/izi-coin-premium.png";

interface IziCoinTrackingViewProps {
  order: any;
  onClose: () => void;
  onGoToWallet: () => void;
  onCancel: (orderId: string) => void;
  onSupport: () => void;
}

export const IziCoinTrackingView: React.FC<IziCoinTrackingViewProps> = ({
  order,
  onClose,
  onGoToWallet,
  onCancel,
  onSupport
}) => {
  if (!order) return null;
  const iziCoinImg = iziCoinImgAsset;
  
  const statusLabels: Record<string, { label: string; color: string; desc: string }> = {
    'pendente_pagamento': { 
      label: 'Aguardando Pagamento', 
      color: 'bg-yellow-400 text-black',
      desc: 'Estamos aguardando a confirmação do seu pagamento para liberar seus IziCoins.'
    },
    'em_processamento': { 
      label: 'Processando Recarga', 
      color: 'bg-emerald-500 text-white',
      desc: 'Pagamento confirmado! Seus IziCoins estão sendo transferidos para sua carteira.'
    },
    'concluido': { 
      label: 'Recarga Concluída', 
      color: 'bg-emerald-500 text-white',
      desc: 'Sua recarga foi finalizada com sucesso. Seus IziCoins já estão disponíveis.'
    }
  };

  const currentStatus = statusLabels[order.status] || { label: 'Em Análise', color: 'bg-zinc-100 text-zinc-600', desc: 'Seu pedido está sendo analisado.' };

  return (
    <div className="fixed inset-0 bg-white z-[500] flex flex-col">
       {/* Header */}
       <header className="p-6 flex items-center justify-between">
          <button onClick={onClose} className="size-12 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 active:scale-90 transition-all">
             <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
          </button>
          <div className="flex flex-col items-center">
             <h1 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Recarga IziCoin</h1>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">ID #{String(order.id).slice(-6)}</p>
          </div>
          <button onClick={onSupport} className="size-12 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
             <span className="material-symbols-rounded text-zinc-400 text-[20px]">help</span>
          </button>
       </header>

       <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
          {/* Visual de Status */}
          <section className="flex flex-col items-center text-center space-y-6 py-4">
             <div className="relative">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"
                />
                <img 
                  src={iziCoinImg} 
                  alt="IziCoin" 
                  className="size-32 object-contain relative z-10 drop-shadow-[0_20px_40px_rgba(234,179,8,0.3)]" 
                />
             </div>
             
             <div className="space-y-2">
                <div className={`px-4 py-1.5 rounded-full ${currentStatus.color} text-[10px] font-black uppercase tracking-widest inline-block`}>
                   {currentStatus.label}
                </div>
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">
                   R$ {Number(order.total_price || 0).toFixed(2).replace(".", ",")}
                </h2>
                <p className="text-sm font-bold text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                   {currentStatus.desc}
                </p>
             </div>
          </section>

          {/* Timeline de Recarga */}
          <section className="bg-zinc-50 rounded-[40px] p-8 space-y-6 border border-zinc-100">
             <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">Acompanhamento</h3>
             <div className="space-y-8">
                <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                      <div className="size-6 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-white shadow-sm relative z-10">
                         <span className="material-symbols-rounded text-white text-[14px]">check</span>
                      </div>
                      <div className="w-0.5 flex-1 bg-emerald-500/20 min-h-[32px]" />
                   </div>
                   <div className="flex flex-col gap-0.5 pb-2">
                      <span className="text-sm font-black text-zinc-900 leading-none">Pedido solicitado</span>
                      <span className="text-[10px] font-bold text-zinc-400">Iniciado em {new Date(order.created_at).toLocaleTimeString()}</span>
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                      <div className={`size-6 rounded-full ${order.status !== 'pendente_pagamento' ? 'bg-emerald-500' : 'bg-white border-2 border-zinc-200'} flex items-center justify-center relative z-10`}>
                         {order.status !== 'pendente_pagamento' ? (
                            <span className="material-symbols-rounded text-white text-[14px]">check</span>
                         ) : (
                            <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
                         )}
                      </div>
                      <div className="w-0.5 flex-1 bg-zinc-100 min-h-[32px]" />
                   </div>
                   <div className="flex flex-col gap-0.5 pb-2">
                      <span className={`text-sm font-black ${order.status !== 'pendente_pagamento' ? 'text-zinc-900' : 'text-zinc-300'} leading-none`}>Confirmação de pagamento</span>
                      <span className="text-[10px] font-bold text-zinc-400">Pelo método {order.payment_method?.toUpperCase()}</span>
                   </div>
                </div>

                <div className="flex gap-4">
                   <div className="flex flex-col items-center">
                      <div className={`size-6 rounded-full ${order.status === 'concluido' ? 'bg-emerald-500' : 'bg-white border-2 border-zinc-200'} flex items-center justify-center relative z-10`}>
                         {order.status === 'concluido' ? (
                            <span className="material-symbols-rounded text-white text-[14px]">check</span>
                         ) : (
                            <span className="material-symbols-rounded text-zinc-200 text-[14px]">lock</span>
                         )}
                      </div>
                   </div>
                   <div className="flex flex-col gap-0.5">
                      <span className={`text-sm font-black ${order.status === 'concluido' ? 'text-zinc-900' : 'text-zinc-300'} leading-none`}>IziCoins na carteira</span>
                      <span className="text-[10px] font-bold text-zinc-400">Transferência instantânea</span>
                   </div>
                </div>
             </div>
          </section>

          {/* Detalhes Adicionais */}
          <section className="px-2 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Método</span>
                <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">{order.payment_method?.replace("_", " ")}</span>
             </div>
          </section>
       </div>

       {/* Footer Actions */}
       <footer className="p-8 space-y-4 bg-white border-t border-zinc-50">
          {order.status === 'pendente_pagamento' ? (
             <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={onClose}
                  className="w-full bg-yellow-400 text-black font-black h-16 rounded-2xl shadow-xl shadow-yellow-400/10 uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all"
                >
                   Entendi
                </button>
                <button 
                  onClick={() => onCancel(order.id)}
                  className="w-full bg-zinc-50 text-zinc-400 font-black h-16 rounded-2xl border border-zinc-200 uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all"
                >
                   Cancelar Recarga
                </button>
             </div>
          ) : (
             <button 
               onClick={onGoToWallet}
               className="w-full bg-zinc-900 text-white font-black h-16 rounded-2xl shadow-xl uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all"
             >
                Ver Carteira
             </button>
          )}
       </footer>
    </div>
  );
};
