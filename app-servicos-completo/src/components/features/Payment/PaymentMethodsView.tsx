import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useWallet } from "../../../hooks/useWallet";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const PaymentMethodsView = () => {
  const { 
    savedCards, 
    handleDeleteCard, 
    walletBalance, 
    iziCoins 
  } = useWallet();

  const { 
    setSubView, 
    selectedCard, 
    setSelectedCard, 
    paymentMethod, 
    setPaymentMethod,
    globalSettings
  } = useApp();

  const [isAddingCard, setIsAddingCard] = useState(false);

  const iziCoinValue = globalSettings?.izi_coin_value || 1.0;

  const paymentOptions = [
    { id: 'wallet', title: 'Izi Pay (Saldo)', sub: `Disponível: R$ ${walletBalance.toFixed(2)}`, icon: 'account_balance_wallet', color: 'text-emerald-400' },
    { id: 'izicoin', title: 'Izi Coins', sub: `Saldo: ${iziCoins.toFixed(2)} (R$ ${(iziCoins * iziCoinValue).toFixed(2)})`, icon: 'monetization_on', color: 'text-yellow-400' },
    { id: 'pix',    title: 'Pix', sub: 'Pagamento instantâneo', icon: 'payments', color: 'text-blue-400' },
    { id: 'lightning', title: 'Bitcoin Lightning', sub: 'Sats via Lightning Network', icon: 'bolt', color: 'text-orange-400' },
  ];

  const handleBack = () => {
    if (isAddingCard) {
      setIsAddingCard(false);
    } else {
      setSubView("none");
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleBack} 
            className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase leading-none">Pagamento</h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Gerencie seus métodos</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-10 space-y-12">
        {/* Active Payment Methods */}
        <section className="space-y-6">
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] px-2">Métodos Principais</h3>
           <div className="space-y-4">
              {paymentOptions.map((opt, i) => (
                <motion.div 
                  key={opt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`p-6 rounded-[35px] border-2 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98]
                    ${paymentMethod === opt.id 
                      ? 'bg-zinc-900/60 border-yellow-400/30 shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02)]' 
                      : 'bg-zinc-900/20 border-white/5 opacity-60'
                    }`}
                >
                   <div className="flex items-center gap-5">
                      <div className={`size-14 rounded-[22px] bg-black/40 flex items-center justify-center border border-white/5 shadow-inner`}>
                         <span className={`material-symbols-outlined ${opt.color} text-2xl`}>{opt.icon}</span>
                      </div>
                      <div>
                         <p className="font-black text-sm text-white tracking-tight">{opt.title}</p>
                         <p className="text-[10px] font-bold text-zinc-500 mt-0.5">{opt.sub}</p>
                      </div>
                   </div>
                   {paymentMethod === opt.id && (
                     <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                        <span className="material-symbols-outlined text-black text-[16px] font-black">check</span>
                     </div>
                   )}
                </motion.div>
              ))}
           </div>
        </section>

        {/* Saved Cards */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Cartões Salvos</h3>
              <button 
                onClick={() => setSubView("add_card")}
                className="text-[10px] font-black text-yellow-400 uppercase tracking-widest active:scale-95"
              >
                Adicionar Novo
              </button>
           </div>

           <div className="space-y-4">
              {savedCards.length === 0 ? (
                <div className="bg-zinc-900/20 rounded-[35px] p-10 border border-dashed border-white/10 text-center">
                   <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">Nenhum cartão de crédito<br/>armazenado com segurança.</p>
                </div>
              ) : savedCards.map((card: any, i: number) => (
                <motion.div 
                  key={card.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + (i * 0.05) }}
                  onClick={() => {
                    setPaymentMethod('credit_card');
                    setSelectedCard(card);
                  }}
                  className={`p-6 rounded-[35px] border-2 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98]
                    ${(paymentMethod === 'credit_card' && selectedCard?.id === card.id)
                      ? 'bg-zinc-900/60 border-yellow-400/30 shadow-[15px_15px_30px_rgba(0,0,0,0.4)]' 
                      : 'bg-zinc-900/20 border-white/5 opacity-60'
                    }`}
                >
                   <div className="flex items-center gap-5">
                      <div className="size-14 rounded-[22px] bg-black/40 flex items-center justify-center border border-white/5 shadow-inner">
                         <Icon name="credit_card" size={24} className="text-zinc-400" />
                      </div>
                      <div>
                         <p className="font-black text-sm text-white tracking-tight">•••• {card.last_four}</p>
                         <p className="text-[10px] font-bold text-zinc-500 mt-0.5 uppercase tracking-widest">{card.brand || 'Cartão'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                        className="size-10 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-600 hover:text-red-400 transition-colors"
                      >
                         <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      {(paymentMethod === 'credit_card' && selectedCard?.id === card.id) && (
                        <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                           <span className="material-symbols-outlined text-black text-[16px] font-black">check</span>
                        </div>
                      )}
                   </div>
                </motion.div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );
};
