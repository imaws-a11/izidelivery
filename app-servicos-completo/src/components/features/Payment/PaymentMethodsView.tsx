import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";
import pixLogo from "../../../assets/images/pix-logo.png";
import { supabase } from "../../../lib/supabase";
import { toastSuccess, toastError } from "../../../lib/useToast";
import { MercadoPagoCardForm } from "../../MercadoPagoCardForm";

export const PaymentMethodsView = () => {
  const { 
    setSubView, 
    selectedCard, 
    setSelectedCard, 
    paymentMethod, 
    setPaymentMethod,
    globalSettings,
    savedCards = [], 
    handleDeleteCard,
    walletBalance, 
    iziCoins,
    userId,
    fetchSavedCards,
    selectedItem,
    setSelectedItem,
    processCardPayment,
    user,
    loginEmail
  } = useApp();

    // Log de cartões removido para limpeza de console

  const [isAddingCard, setIsAddingCard] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isPendingOrder = selectedItem && (selectedItem.status === 'pendente_pagamento' || selectedItem.status === 'novo');

  const iziCoinValue = globalSettings?.izi_coin_value || 1.0;

  const paymentOptions = [
    { id: 'wallet', title: 'Izi Pay (Saldo)', sub: `Disponível: R$ ${walletBalance.toFixed(2)}`, icon: 'account_balance_wallet', color: 'text-emerald-400' },
    { id: 'izicoin', title: 'Izi Coins', sub: `Saldo: ${iziCoins.toFixed(2)} (R$ ${(iziCoins * iziCoinValue).toFixed(2)})`, icon: 'monetization_on', color: 'text-yellow-400' },
    { id: 'pix',    title: 'Pix', sub: 'Pagamento instantâneo', icon: 'payments', color: 'text-blue-400', isImage: true },
    { id: 'lightning', title: 'Bitcoin Lightning', sub: 'Sats via Lightning Network', icon: 'bolt', color: 'text-orange-400' },
  ];

  const handleBack = () => {
    if (isAddingCard) {
      setIsAddingCard(false);
    } else {
      setSubView("none");
    }
  };

  const handleConfirmNewCard = (token: string, issuer: string, installments: number, brand: string, last4: string) => {
    setSelectedCard({
      id: 'temp_' + Date.now(),
      token: token,
      brand: brand,
      last4: last4
    });
    setPaymentMethod('credit_card');
    toastSuccess("Cartão temporário gerado com sucesso! Agora confirme o pagamento.");
    setIsAddingCard(false);
  };

  const handlePayOrder = async () => {
    if (!selectedItem || (!selectedCard && paymentMethod === 'credit_card')) return;
    
    setIsProcessing(true);
    
    try {
      const email = user?.email || loginEmail || "cliente@izidelivery.com";
      
      if (paymentMethod === 'credit_card') {
        await processCardPayment({
          orderId: selectedItem.id,
          amount: selectedItem.total_price,
          cardObj: selectedCard,
          email,
          onSuccess: async () => {
            toastSuccess("Pagamento aprovado!");
            const { data: updated } = await supabase.from('orders_delivery').select().eq('id', selectedItem.id).single();
            setSelectedItem(updated || selectedItem);
            setSubView('active_order');
          },
          onError: (msg: any) => {
            toastError(`Erro: ${msg}`);
          }
        });
      } else {
        // Se mudou o método para Pix ou Lightning, redireciona
        setSubView(paymentMethod === 'pix' ? 'pix_payment' : 'lightning_payment');
      }
    } catch (e) {
      console.error("Pay Order Error:", e);
      toastError("Falha ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#F7F7F7] text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-zinc-100">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleBack} 
            className="size-12 rounded-[22px] bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm"
          >
            <span className="material-symbols-outlined text-zinc-900 text-2xl">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="font-black text-2xl text-zinc-900 tracking-tighter uppercase leading-none">Pagamento</h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mt-2">Gerencie seus métodos</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-10 space-y-12">
        <AnimatePresence mode="wait">
          {isAddingCard ? (
            <motion.section 
              key="add-card-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
               <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-2 mb-4">Novo Cartão de Crédito</h3>
               <div className="bg-white rounded-[32px] p-6 shadow-xl border border-zinc-100 space-y-5">
                 <MercadoPagoCardForm onConfirm={handleConfirmNewCard} publicKey={globalSettings?.mercadopago_public_key} />
               </div>
               
               <p className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-4">
                 Nota: O cartão não ficará salvo na sua conta permanentemente para sua segurança.
               </p>
            </motion.section>
          ) : (
            <motion.div
              key="payment-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-12"
            >
        {/* Active Payment Methods */}
        <section className="space-y-6">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-2">Métodos Principais</h3>
           <div className="space-y-4">
              {paymentOptions.map((opt, i) => (
                <motion.div 
                  key={opt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setPaymentMethod(opt.id)}
                  className={`p-6 rounded-[32px] border-2 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98]
                    ${paymentMethod === opt.id 
                      ? 'bg-zinc-950 border-zinc-900 text-white shadow-xl shadow-zinc-200' 
                      : 'bg-white border-zinc-100 text-zinc-900 shadow-sm opacity-90 hover:opacity-100'
                    }`}
                >
                   <div className="flex items-center gap-5">
                      <div className={`size-14 rounded-2xl ${paymentMethod === opt.id ? 'bg-zinc-800' : 'bg-zinc-50'} flex items-center justify-center border border-zinc-100/10 shadow-inner`}>
                         {(opt as any).isImage ? (
                           <img src={pixLogo} alt="Pix" className="size-8 object-contain" />
                         ) : (
                           <span className={`material-symbols-outlined ${opt.color} text-2xl`}>{opt.icon}</span>
                         )}
                      </div>
                      <div>
                         <p className={`font-black text-sm tracking-tight ${paymentMethod === opt.id ? 'text-white' : 'text-zinc-900'}`}>{opt.title}</p>
                         <p className={`text-[10px] font-bold mt-0.5 ${paymentMethod === opt.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{opt.sub}</p>
                      </div>
                   </div>
                   {paymentMethod === opt.id && (
                     <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
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
              <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Cartões Salvos</h3>
              <button 
                onClick={() => setIsAddingCard(true)}
                className="text-[10px] font-black text-yellow-600 uppercase tracking-widest active:scale-95"
              >
                Adicionar Novo
              </button>
           </div>

           <div className="space-y-4">
              {(!savedCards || savedCards.length === 0) ? (
                <div className="bg-zinc-50 rounded-[32px] p-10 border border-dashed border-zinc-200 text-center">
                   <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">Nenhum cartão de crédito<br/>armazenado com segurança.</p>
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
                  className={`p-6 rounded-[32px] border-2 flex items-center justify-between transition-all cursor-pointer active:scale-[0.98]
                    ${(paymentMethod === 'credit_card' && selectedCard?.id === card.id)
                      ? 'bg-zinc-950 border-zinc-900 text-white shadow-xl shadow-zinc-200' 
                      : 'bg-white border-zinc-100 text-zinc-900 shadow-sm opacity-90 hover:opacity-100'
                    }`}
                >
                   <div className="flex items-center gap-5">
                      <div className={`size-14 rounded-2xl ${paymentMethod === 'credit_card' && selectedCard?.id === card.id ? 'bg-zinc-800' : 'bg-zinc-50'} flex items-center justify-center border border-zinc-100/10 shadow-inner`}>
                         <Icon name="credit_card" size={24} className={paymentMethod === 'credit_card' && selectedCard?.id === card.id ? "text-zinc-300" : "text-zinc-500"} />
                      </div>
                      <div>
                         <p className={`font-black text-sm tracking-tight ${paymentMethod === 'credit_card' && selectedCard?.id === card.id ? 'text-white' : 'text-zinc-900'}`}>•••• {card.last_four || card.last4}</p>
                         <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-widest ${paymentMethod === 'credit_card' && selectedCard?.id === card.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{card.brand || 'Cartão'}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                        className="size-10 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-red-500 transition-colors"
                      >
                         <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      {(paymentMethod === 'credit_card' && selectedCard?.id === card.id) && (
                        <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                           <span className="material-symbols-outlined text-black text-[16px] font-black">check</span>
                        </div>
                      )}
                   </div>
                </motion.div>
              ))}
           </div>
        </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {isPendingOrder && !isAddingCard && (
        <div className="fixed bottom-0 inset-x-0 p-6 bg-white/80 backdrop-blur-xl border-t border-zinc-100 z-[100]">
           <motion.button
             whileTap={{ scale: 0.95 }}
             disabled={isProcessing || (paymentMethod === 'credit_card' && !selectedCard)}
             onClick={handlePayOrder}
             className="w-full h-16 bg-yellow-400 rounded-[28px] shadow-xl shadow-yellow-400/20 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
           >
              {isProcessing ? (
                <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-black text-xl">check_circle</span>
                  <span className="text-black font-black text-xs uppercase tracking-[0.2em]">Confirmar Pagamento • R$ {selectedItem.total_price.toFixed(2).replace('.', ',')}</span>
                </>
              )}
           </motion.button>
        </div>
      )}
    </div>
  );
};
