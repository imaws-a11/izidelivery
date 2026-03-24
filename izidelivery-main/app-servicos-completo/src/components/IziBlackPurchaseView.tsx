import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function IziBlackPurchaseView() {
  const {
    subView, setSubView, navigateSubView,
    view, setView, tab, setTab,
    userId, userName, setUserName,
    cart, setCart, myOrders, setMyOrders,
    userLocation, ESTABLISHMENTS, activeService, setActiveService,
    selectedShop, setSelectedShop, activeMenuCategory, setActiveMenuCategory,
    selectedItem, setSelectedItem, tempQuantity, setTempQuantity,
    paymentMethod, setPaymentMethod, walletBalance, setWalletBalance,
    walletTransactions, showDepositModal, setShowDepositModal,
    depositAmount, setDepositAmount, depositPixCode, setDepositPixCode,
    flashOffers, globalSettings, exploreCategoryState, setExploreCategoryState,
    transitData, setTransitData, distancePrices, routeDistance,
    isCalculatingPrice, nearbyDrivers, nearbyDriversCount, transitHistory,
    email, setEmail, password, setPassword, phone, setPhone,
    authMode, setAuthMode, isLoading, setIsLoading, errorMsg, setErrorMsg,
    filterTab, setFilterTab, searchQuery, setSearchQuery,
    isIziBlackMembership, setIsIziBlackMembership,
    iziBlackOrigin, setIziBlackOrigin, iziBlackStep, setIziBlackStep,
    iziBlackPixCode, setIziBlackPixCode, showIziBlackCard, setShowIziBlackCard,
    showIziBlackWelcome, showMasterPerks, setShowMasterPerks,
    toast, setToast, userXP, rating, setRating,
    feedbackText, setFeedbackText, chatMessages, setChatMessages,
    chatInput, setChatInput, timeLeft, setTimeLeft,
    availableCoupons, appliedCoupon, setAppliedCoupon,
    couponInput, setCouponInput, copiedCoupon, setCopiedCoupon, isValidatingCoupon,
    savedCards, isLoadingCards, isAddingCard, setIsAddingCard, newCardData, setNewCardData,
    savedAddresses, editingAddress, setEditingAddress, isAddingAddress, setIsAddingAddress,
    pixData, lightningData, driverPos,
    beverageBanners, beverageOffers, marketConditions,
    schedObsState, setSchedObsState, schedChatInputState, setSchedChatInputState,
    schedMessagesState, setSchedMessagesState, isSavingObsState, setIsSavingObsState,
    fetchMyOrders, fetchWalletBalance, fetchSavedCards, fetchSavedAddresses,
    fetchCoupons, fetchFlashOffers, fetchMarketData,
    handleAuth, handleAddToCart, handleRemoveFromCart, handlePlaceOrder,
    handleCancelOrder, handleShopClick, handleConfirmMobility, handleRequestTransit,
  } = useServices();

  const handleClose = () => {
    setSubView(iziBlackOrigin === 'checkout' ? 'checkout' : 'none');
  };

  const handleSubscribeReal = async () => {
    if (!userId) return;
    setIsLoading(true);
    
    const total = 29.90;
    
    try {
      // 1. Criar um "pedido" de assinatura em orders_delivery
      const { data: orderData, error: orderError } = await supabase
        .from("orders_delivery")
        .insert({
          user_id: userId,
          status: (paymentMethod === "cartao" || paymentMethod === "bitcoin_lightning") ? "pendente_pagamento" : "novo",
          total_price: total,
          pickup_address: "Assinatura Izi Black",
          delivery_address: "Serviço Digital",
          service_type: "subscription",
          payment_method: paymentMethod,
          cpf_invoice: cpf,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Disparar o fluxo de pagamento correto
      if (paymentMethod === "cartao") {
        const activeCard = savedCards.find((c: any) => c.active);
        if (!activeCard?.stripe_payment_method_id) {
          toastWarning("Selecione ou adicione um cartão de crédito.");
          setIsLoading(false);
          return;
        }

        setSubView("payment_processing");
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Sessão expirada.");

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const intentResponse = await fetch(`${supabaseUrl}/functions/v1/create-payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({ amount: total, orderId: orderData.id }),
        });

        if (!intentResponse.ok) throw new Error("Erro ao processar pagamento com cartão.");

        const intentData = await intentResponse.json();
        const stripe = await stripePromise;
        if (!stripe) throw new Error("Stripe não carregado.");

        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(intentData.clientSecret, {
          payment_method: activeCard.stripe_payment_method_id
        });

        if (confirmError) throw confirmError;

        if (paymentIntent.status === "succeeded") {
          await supabase.from('users_delivery').update({ is_izi_black: true }).eq('id', userId);
          setIsIziBlackMembership(true);
          setIziBlackStep('success');
          setSubView("izi_black_purchase");
        } else {
          setSubView("payment_error");
        }
      } else if (paymentMethod === "pix") {
        setSubView("payment_processing");
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const pixResponse = await fetch(`${supabaseUrl}/functions/v1/create-pagbank-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({
            amount: total,
            orderId: orderData.id,
            email: email,
            customer: { name: userName, cpf: cpf }
          }),
        });

        if (!pixResponse.ok) throw new Error("Erro ao gerar PIX.");

        const pixResult = await pixResponse.json();
        setPixData(pixResult);
        setPaymentsOrigin("izi_black");
        setSubView("pix_payment");
      } else if (paymentMethod === "bitcoin_lightning") {
        setSubView("payment_processing");
        const { data: { session } } = await supabase.auth.getSession();
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const lnResponse = await fetch(`${supabaseUrl}/functions/v1/create-lightning-invoice`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY as string,
          },
          body: JSON.stringify({
            amount: total,
            orderId: orderData.id,
            memo: "Recarga Izi Black VIP"
          }),
        });

        if (!lnResponse.ok) throw new Error("Erro ao gerar fatura Bitcoin.");

        const lnResult = await lnResponse.json();
        setLightningData(lnResult);
        setPaymentsOrigin("izi_black");
        setSubView("lightning_payment");
      }
    } catch (err: any) {
      toastError(err.message || "Erro ao processar assinatura.");
    } finally {
      setIsLoading(false);
    }
  };

  if (iziBlackStep === 'success') {
    return (
      <div className="h-full w-full bg-zinc-950 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden antialiased">
         {/* Success Background Effects */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-yellow-400/[0.08] blur-[100px] rounded-full" />
         
         <motion.div 
           initial={{ scale: 0, rotate: -45 }}
           animate={{ scale: 1, rotate: 0 }}
           className="relative z-10 size-48 rounded-[55px] bg-zinc-900 flex items-center justify-center mb-12 shadow-[0_45px_100px_-20px_rgba(255,184,0,0.3)] border border-yellow-400/20"
         >
            <span className="material-symbols-outlined text-yellow-500 text-8xl fill-1">verified</span>
         </motion.div>
         
         <div className="relative z-10 space-y-6">
            <h2 className="text-5xl font-black text-white italic tracking-tighter leading-[0.8] mb-2">BEM-VINDO À<br/>ELITE <span className="text-yellow-400">BLACK</span></h2>
            <p className="text-zinc-500 font-bold text-sm max-w-[300px] mx-auto leading-relaxed">
              Sua conta foi elevada. Agora você faz parte do seleto grupo com benefícios de luxo e privilégios exclusivos.
            </p>
         </div>
         
         <button 
           onClick={handleClose} 
           className="mt-20 w-full bg-yellow-400 text-black h-20 rounded-[35px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(255,184,0,0.4)] active:scale-95 transition-all relative z-10"
         >
            Começar minha Experiência
         </button>
      </div>
    );
  }

  if (iziBlackStep === 'payment') {
    return (
      <div className="h-full w-full bg-zinc-950 flex flex-col antialiased overflow-hidden">
         {/* Minimalist Header */}
         <header className="p-8 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <button onClick={() => setIziBlackStep('info')} className="size-12 rounded-[20px] bg-white/5 flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 hover:border-white/20">
                 <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h2 className="text-white font-black italic uppercase tracking-tighter text-lg leading-none">Checkout VIP</h2>
                <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mt-1 opacity-60">Elite Access Protocol</p>
              </div>
            </div>
            <div className="flex -space-x-3">
               {[1,2,3].map(i => <div key={i} className="size-8 rounded-full border-2 border-zinc-950 bg-zinc-800" />)}
            </div>
         </header>
         
         <main className="flex-1 px-8 space-y-10 flex flex-col pt-4 overflow-y-auto no-scrollbar pb-32">
            <div className="relative group">
              <div className="absolute inset-0 bg-yellow-400/10 blur-[50px] rounded-full opacity-50 transition-opacity group-hover:opacity-100" />
              <div className="bg-zinc-900 border border-white/5 rounded-[45px] p-10 text-center relative overflow-hidden shadow-2xl">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-3">Membership Mensal</p>
                 <div className="flex items-baseline justify-center gap-2">
                   <span className="text-5xl font-black text-white italic tracking-tighter tabular-nums">R$ 29,90</span>
                   <span className="text-yellow-400 text-sm font-black italic uppercase">/mês</span>
                 </div>
              </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Método de Ativação</h3>
                  <button 
                    onClick={() => { setPaymentsOrigin("izi_black"); setSubView("payments"); }}
                    className="text-[9px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-4 py-2 rounded-full border border-yellow-400/20"
                  >
                    Alterar
                  </button>
                </div>

                <div className="bg-zinc-900/50 border border-white/5 rounded-[35px] overflow-hidden backdrop-blur-sm">
                  {paymentMethod === "cartao" && (
                    <div className="flex items-center gap-5 p-7">
                      <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                        <span className="material-symbols-outlined text-yellow-400 text-3xl">contactless</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-sm uppercase tracking-tight italic">Cartão de Elite</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">•••• {savedCards.find(c => c.active)?.last4 || '—'}</p>
                      </div>
                      <span className="material-symbols-outlined text-yellow-400 fill-1">verified_user</span>
                    </div>
                  )}
                  {paymentMethod === "pix" && (
                    <div className="flex items-center gap-5 p-7">
                      <div className="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                        <img src="https://logopng.com.br/logos/pix-128.png" className="size-7 object-contain brightness-0 invert" />
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-sm uppercase tracking-tight italic">PIX Instantâneo</p>
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-0.5">Liberação em 1s</p>
                      </div>
                      <span className="material-symbols-outlined text-emerald-500 fill-1">speed</span>
                    </div>
                  )}
                  {paymentMethod === "bitcoin_lightning" && (
                    <div className="flex items-center gap-5 p-7">
                      <div className="size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                        <span className="material-symbols-outlined text-orange-400 text-3xl fill-1">bolt</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-white font-black text-sm uppercase tracking-tight italic">LN Payments</p>
                        <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mt-0.5">Privacy First Layer</p>
                      </div>
                      <span className="material-symbols-outlined text-orange-500">lock</span>
                    </div>
                  )}
                  {!paymentMethod && (
                    <button onClick={() => { setPaymentsOrigin("izi_black"); setSubView("payments"); }} className="w-full p-10 text-zinc-600 font-black uppercase tracking-[0.3em] text-[10px] flex flex-col items-center gap-4">
                      <div className="size-14 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                         <span className="material-symbols-outlined text-3xl">add_card</span>
                      </div>
                      Escolher Canal de Pagamento
                    </button>
                  )}
                </div>
            </div>

            <div className="bg-zinc-900 border border-white/5 rounded-[40px] p-6 space-y-4">
               {[
                 { label: 'Token de Segurança', status: 'Verificado', icon: 'shield' },
                 { label: 'Certificado SSL 256-bit', status: 'Ativo', icon: 'lock' }
               ].map((s, i) => (
                 <div key={i} className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-zinc-700 text-lg">{s.icon}</span>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{s.label}</span>
                   </div>
                   <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{s.status}</span>
                 </div>
               ))}
            </div>
         </main>
         
         <footer className="p-8 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent fixed bottom-0 inset-x-0">
            <button 
              onClick={handleSubscribeReal}
              disabled={isLoading || !paymentMethod || (paymentMethod === "cartao" && !savedCards.some(c => c.active))}
              className="w-full bg-white text-black h-20 rounded-[35px] font-black uppercase tracking-[0.2em] text-sm shadow-[0_20px_50px_-10px_rgba(255,255,255,0.1)] active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4 group"
            >
               {isLoading ? (
                  <span className="material-symbols-outlined animate-spin font-black text-2xl">sync</span>
               ) : (
                  <>
                     <span className="font-black">Ativar Membership Black</span>
                     <span className="material-symbols-outlined font-black group-hover:translate-x-1 transition-transform">bolt</span>
                  </>
               )}
            </button>
         </footer>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-zinc-950 flex flex-col hide-scrollbar overflow-y-auto antialiased">
       {/* Premium Cinematic Banner */}
       <div className="relative h-[60vh] shrink-0 overflow-hidden">
          <motion.img 
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.7 }}
            transition={{ duration: 2 }}
            src="https://images.unsplash.com/photo-1550745165-9bc0b252728f?q=80&w=1200" 
            className="w-full h-full object-cover grayscale" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/40 to-zinc-950" />
          <div className="absolute inset-0 bg-zinc-950/20 backdrop-brightness-75" />
          
          <header className="absolute top-0 inset-x-0 p-8 flex items-center justify-between z-20">
             <button onClick={handleClose} className="size-14 rounded-3xl bg-black/60 backdrop-blur-2xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all hover:bg-black/80">
                <span className="material-symbols-outlined font-black">close</span>
             </button>
             <div className="size-14 rounded-3xl bg-yellow-400/20 backdrop-blur-2xl flex items-center justify-center border border-yellow-400/30">
                <span className="material-symbols-outlined text-yellow-400 fill-1">stars</span>
             </div>
          </header>

          <div className="absolute bottom-12 inset-x-10 z-20 space-y-4">
             <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 w-fit px-5 py-2 rounded-2xl mb-4"
             >
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em]">Exclusive Invitation</span>
             </motion.div>
             <h1 className="text-7xl font-black text-white italic tracking-tighter leading-[0.8] drop-shadow-2xl">
                IZI <span className="text-yellow-400">BLACK</span>
             </h1>
             <p className="text-zinc-400 text-sm font-bold leading-relaxed max-w-[260px] uppercase tracking-wider opacity-80">
                Entre para o círculo premium e resgate privilégios de alto escalão.
             </p>
          </div>
       </div>

       <main className="px-10 pb-52 space-y-12 relative z-10 -mt-8">
          <div className="grid grid-cols-1 gap-5">
             {[
                { icon: 'flight_takeoff', title: 'LOGÍSTICA ZERO', desc: 'Isenção de taxa de entrega em pedidos acima de R$50 sem limites.', color: 'text-blue-400' },
                { icon: 'account_balance_wallet', title: 'CASHBACK ELITE', desc: '5% de retorno real em todas as transações, direto na sua Izi Wallet.', color: 'text-emerald-400' },
                { icon: 'speed', title: 'IZI FLASH VIP', desc: 'Acesso instantâneo a ofertas de até 70% OFF exclusivas para o círculo.', color: 'text-yellow-400' },
                { icon: 'shield_person', title: 'PERSONAL CONCIERGE', desc: 'Atendimento prioritário humano pronto para resolver qualquer demanda.', color: 'text-purple-400' }
             ].map((item, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="flex gap-6 p-8 bg-zinc-900/60 border border-white/5 rounded-[45px] backdrop-blur-2xl hover:bg-zinc-900 transition-colors"
                >
                   <div className={`size-14 rounded-3xl bg-zinc-800 flex items-center justify-center shrink-0 border border-white/5`}>
                      <span className={`material-symbols-outlined ${item.color} text-2xl`}>{item.icon}</span>
                   </div>
                   <div className="flex flex-col justify-center">
                      <h4 className="text-white font-black text-sm mb-1 italic uppercase tracking-wider">{item.title}</h4>
                      <p className="text-zinc-500 text-[11px] leading-relaxed font-bold uppercase tracking-tight">{item.desc}</p>
                   </div>
                </motion.div>
             ))}
          </div>

          <div className="relative group p-1">
             <div className="absolute inset-0 bg-yellow-400/20 blur-[60px] rounded-full opacity-30" />
             <div className="bg-zinc-900 border border-yellow-400/20 rounded-[50px] p-10 text-center relative overflow-hidden backdrop-blur-3xl">
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.6em] mb-4">Membro Standard</p>
                <div className="flex flex-col items-center gap-1 mb-4">
                   <span className="text-zinc-700 text-lg font-black line-through italic">R$ 49,90</span>
                   <div className="flex items-baseline gap-2">
                      <span className="text-6xl font-black text-white italic tracking-tighter">R$ 29,90</span>
                      <span className="text-yellow-400 text-sm font-black italic uppercase">/mês</span>
                   </div>
                </div>
                <div className="flex items-center justify-center gap-2 py-3 px-6 bg-yellow-400/10 rounded-full border border-yellow-400/20 w-fit mx-auto">
                   <span className="size-1.5 bg-yellow-400 rounded-full animate-pulse" />
                   <p className="text-yellow-400 text-[9px] font-black uppercase tracking-[0.2em]">Oferta de Lançamento por tempo limitado</p>
                </div>
             </div>
          </div>
       </main>

       <footer className="fixed bottom-0 inset-x-0 p-10 pt-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-50">
          <button 
             onClick={() => setIziBlackStep('payment')}
             disabled={isLoading}
             className="w-full bg-yellow-400 text-black h-24 rounded-[45px] font-black uppercase tracking-[0.3em] text-sm shadow-[0_30px_60px_-15px_rgba(255,184,0,0.4)] active:scale-95 transition-all flex items-center justify-center gap-4 hover:shadow-yellow-400/60"
          >
             {isLoading ? (
                <span className="material-symbols-outlined animate-spin text-black text-3xl">sync</span>
             ) : (
                <>
                   <span className="font-black">Ativar Membership Elite</span>
                   <span className="material-symbols-outlined font-black text-2xl">bolt</span>
                </>
             )}
          </button>
       </footer>
    </div>
  );

}
