import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function CheckoutView() {
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

  const subtotal = cart.reduce((a, b) => a + b.price, 0);

  const handleBack = () => {
    setSubView("cart");
  };

  const activeAddr = savedAddresses.find((a) => a.active) || {
    label: "Minha Casa",
    street: userLocation.address,
  };

  const isFree = selectedShop?.freeDelivery || (isIziBlackMembership && subtotal >= 50);
  const taxaBase = isFree ? 0 : 5.0;
  const taxaTotalCheckout = isFree ? 0 : calculateDynamicPrice(taxaBase);

  // Banner de incentivo Izi Black no checkout - Novo Design High-End
  const renderBlackIncentive = () => {
    if (isIziBlackMembership) return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-6 mt-8 mb-4 p-8 rounded-[45px] bg-zinc-950 border border-yellow-400/10 relative overflow-hidden group shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-yellow-400/5 blur-[80px] -mr-12 -mt-12" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="size-16 rounded-3xl bg-zinc-900 flex items-center justify-center shrink-0 border border-yellow-400/20 shadow-inner">
             <span className="material-symbols-outlined text-yellow-500 text-3xl fill-1">stars</span>
          </div>
          <div>
             <h4 className="text-white font-black text-base italic mb-1 uppercase tracking-tighter">Status: Membro Elite</h4>
             <p className="text-zinc-500 text-[10px] font-bold leading-relaxed uppercase tracking-widest">Você está economizando R$ {taxaTotalCheckout.toFixed(2).replace('.', ',')} e ganhando R$ {cashbackEstimado.toFixed(2).replace('.', ',')} em cashback agora.</p>
          </div>
        </div>
      </motion.div>
    );
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => { setIziBlackOrigin('checkout'); setIziBlackStep('info'); setSubView('izi_black_purchase'); }}
        className="mx-6 mt-8 mb-4 p-8 rounded-[45px] bg-zinc-950 border-2 border-yellow-400/30 relative overflow-hidden group cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 blur-[100px] -mr-20 -mt-20 group-hover:bg-yellow-400/10 transition-colors" />
        <div className="flex items-center gap-6 relative z-10">
          <div className="size-16 rounded-[28px] bg-yellow-400 flex items-center justify-center shrink-0 shadow-[0_15px_30px_-5px_rgba(255,214,0,0.4)] group-hover:scale-110 transition-transform">
             <span className="material-symbols-outlined text-black font-black text-3xl">bolt</span>
          </div>
          <div className="flex-1">
             <h4 className="text-white font-black text-lg italic mb-1 uppercase tracking-tighter">Taxa de entrega GRÁTIS?</h4>
             <p className="text-zinc-500 text-[10px] font-bold leading-relaxed uppercase tracking-widest">Ative o Izi Black agora para zerar o frete e ganhar 5% de cashback neste pedido.</p>
          </div>
          <span className="material-symbols-outlined text-yellow-400 text-3xl group-hover:translate-x-2 transition-transform">chevron_right</span>
        </div>
      </motion.div>
    );
  };

  // Cálculo do cashback que será ganho neste pedido (ex: 5% para Izi Black, 1% normal)
  const cashbackEstimado = isIziBlackMembership ? (subtotal * 0.05) : (subtotal * 0.01);

  const finalTotal = Math.max(0, subtotal + taxaTotalCheckout - (appliedCoupon ? (appliedCoupon.discount_type === 'percent' ? (subtotal * appliedCoupon.discount_value) / 100 : appliedCoupon.discount_value) : 0));

  return (
    <Elements stripe={stripePromise}>
      <div className="absolute inset-0 z-[80] bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto antialiased">
        {/* Header */}
        <header className={`sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-500 ${isIziBlackMembership ? 'bg-zinc-950/90 border-yellow-400/20 py-6' : 'bg-white/80 dark:bg-background-dark/80 border-slate-100 dark:border-slate-800 p-4'}`}>
          <div className="flex items-center px-4 relative">
            <button
              onClick={handleBack}
              className={`size-12 flex items-center justify-center rounded-2xl transition-all active:scale-95 border ${isIziBlackMembership ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-slate-100/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-transparent'}`}
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            
            <div className="flex-1 text-center">
              <h1 className={`font-black uppercase tracking-[0.2em] text-sm italic ${isIziBlackMembership ? 'text-yellow-400' : 'text-slate-900 dark:text-white'}`}>
                {isIziBlackMembership ? 'Checkout VIP Elite' : 'Finalizar Pedido'}
              </h1>
              {isIziBlackMembership && (
                <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mt-1">Conexão Segura Izi Black</p>
              )}
            </div>

            {isIziBlackMembership ? (
              <div className="size-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-500 fill-1">verified_user</span>
              </div>
            ) : (
              <div className="size-12" />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-40">
          {renderBlackIncentive()}
          {/* Delivery Address Section */}
          <section className="p-6 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-500">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              Endereço de Entrega
            </h2>
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary fill-1">
                  location_on
                </span>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900 dark:text-white text-base leading-tight">
                  {activeAddr.label}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {activeAddr.street}
                </p>
              </div>
              <button
                onClick={() => setSubView("addresses")}
                className="text-primary font-black text-xs uppercase tracking-widest"
              >
                Alterar
              </button>
            </div>
            <div className="mt-6 flex items-center gap-3 p-4 bg-slate-50 dark:bg-background-dark rounded-2xl border border-slate-100 dark:border-slate-700">
              <span className="material-symbols-outlined text-primary text-sm">
                schedule
              </span>
              <p className="text-xs font-bold">
                Tempo estimado:{" "}
                <span className="text-slate-900 dark:text-white font-black">
                  {selectedShop?.time || "25-35 min"}
                </span>
              </p>
            </div>
          </section>

          {/* Payment Method Section */}
          <section className="p-6 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              Forma de Pagamento
            </h2>
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-900 dark:text-white">
                  {paymentMethod === "pix"
                    ? "qr_code"
                    : paymentMethod === "bitcoin_lightning"
                      ? "bolt"
                      : paymentMethod === "dinheiro"
                        ? "payments"
                        : paymentMethod === "saldo"
                          ? "account_balance_wallet"
                          : "credit_card"}
                </span>
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-900 dark:text-white text-base uppercase tracking-tight">
                  {paymentMethod === "pix"
                    ? "PIX"
                    : paymentMethod === "bitcoin_lightning"
                      ? "Bitcoin Lightning"
                      : paymentMethod === "dinheiro"
                        ? "Dinheiro"
                        : paymentMethod === "saldo"
                          ? "Saldo App"
                          : (() => {
                              const activeCard = savedCards.find((c: any) => c.active);
                              return activeCard ? `${activeCard.brand} ••••${activeCard.last4}` : "Cartão de Crédito";
                            })()}
                </p>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  {paymentMethod === "saldo"
                    ? `Saldo disponível: R$ ${walletBalance.toFixed(2).replace(".", ",")}`
                    : "Pague pelo App com segurança"}
                </p>
              </div>
              <button
                onClick={() => { setPaymentsOrigin("checkout"); setSubView("payments"); }}
                className="text-primary font-black text-xs uppercase tracking-widest"
              >
                Alterar
              </button>
            </div>
            {/* Campo para CPF se for Pix */}
            {paymentMethod === "pix" && (
              <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">CPF para Nota Fiscal (Opcional)</h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 px-5 font-black text-xs tracking-widest dark:text-white focus:ring-2 focus:ring-primary shadow-inner"
                    value={cpf}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 11) {
                        let masked = val;
                        if (val.length > 3) masked = val.replace(/^(\d{3})(\d)/, "$1.$2");
                        if (val.length > 6) masked = masked.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3");
                        if (val.length > 9) masked = masked.replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
                        setCpf(masked);
                      }
                    }}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">fingerprint</span>
                </div>
              </div>
            )}

            {/* Stripe Payment Form — só aparece se não tiver cartão salvo com stripe_payment_method_id */}
            {paymentMethod === "cartao" && (() => {
              const activeCard = savedCards.find((c: any) => c.active);
              if (activeCard?.stripe_payment_method_id) return null;
              return (
                <div className="mt-8 animate-in slide-in-from-bottom-4 duration-500">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 ml-1">Dados do Cartão</h3>
                  <StripePaymentForm
                    total={finalTotal}
                    userId={userId}
                    onConfirm={(pmId) => handlePlaceOrder(pmId)}
                    onCardSaved={(card) => {
                      const newCard = {
                        ...card,
                        active: true,
                        color: card.brand === 'Visa'
                          ? 'linear-gradient(135deg, #2563eb, #1e40af)'
                          : card.brand === 'Amex'
                            ? 'linear-gradient(135deg, #047857, #065f46)'
                            : 'linear-gradient(135deg, #1e293b, #0f172a)',
                      };
                      setSavedCards((prev: any[]) => [
                        ...prev.map((c: any) => ({ ...c, active: false })),
                        newCard,
                      ]);
                    }}
                  />
                </div>
              );
            })()}
          </section>

          {/* Order Items Section */}
          <section className="p-6 bg-white dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">
              Resumo dos Itens
            </h2>
            <div className="space-y-6">
              {Array.from(new Set(cart.map((i) => i.id))).map((id, idx) => {
                const item = cart.find((i) => i.id === id);
                if (!item) return null;
                const count = getItemCount(item.id);
                return (
                  <div key={idx} className="flex items-center gap-4 group">
                    <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden border border-slate-100 dark:border-slate-700">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          item.img ||
                          "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=300"
                        }
                        alt={item.name}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-slate-900 dark:text-white text-sm">
                        {count}x {item.name}
                      </p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter mt-0.5 line-clamp-1">
                        {item.desc}
                      </p>
                    </div>
                    <p className="font-black text-slate-900 dark:text-white tracking-tighter">
                      R$ {(item.price * count).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Coupon Section */}
          <section className="p-6">
            {!appliedCoupon ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Código do Cupom"
                      className="w-full bg-slate-100 dark:bg-slate-900 border-none rounded-2xl py-4 px-5 font-black uppercase text-xs tracking-widest dark:text-white focus:ring-2 focus:ring-primary shadow-inner"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400">sell</span>
                  </div>
                  <button
                    onClick={() => validateCoupon(couponInput)}
                    disabled={isValidatingCoupon || !couponInput.trim()}
                    className="bg-slate-900 dark:bg-primary text-white dark:text-slate-900 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-30 transition-all active:scale-95"
                  >
                    {isValidatingCoupon ? "..." : "Aplicar"}
                  </button>
                </div>
                
                {/* Sugestões de Cupons Disponíveis */}
                {availableCoupons.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => validateCoupon(c.coupon_code)}
                        className="bg-primary/5 border border-primary/20 px-4 py-2 rounded-xl whitespace-nowrap active:scale-95 transition-all"
                      >
                        <span className="text-[9px] font-black text-primary uppercase tracking-widest">{c.coupon_code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-4 p-5 border-2 border-dashed border-primary/30 rounded-[24px] bg-primary/5 shadow-sm animate-in zoom-in duration-300">
                <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined font-black">sell</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">
                    Cupom Ativo
                  </p>
                  <p className="text-[10px] font-bold text-primary uppercase tracking-tighter mt-1">
                    {appliedCoupon.coupon_code} (-{appliedCoupon.discount_type === 'percent' ? `${appliedCoupon.discount_value}%` : `R$ ${appliedCoupon.discount_value.toFixed(2).replace(".", ",")}`})
                  </p>
                </div>
                <button 
                  onClick={() => setAppliedCoupon(null)}
                  className="size-10 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-transform group"
                >
                  <span className="material-symbols-outlined text-sm font-black text-slate-500 group-hover:text-red-500">close</span>
                </button>
              </div>
            )}
          </section>

          {/* Price Breakdown Section */}
          <section className="p-6 space-y-4">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
              <span>Subtotal</span>
              <span className="font-black text-slate-900 dark:text-white tracking-tighter">
                R$ {subtotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center text-emerald-500 font-bold text-sm">
                <span>Desconto</span>
                <span className="font-black tracking-tighter">
                  -R$ {(appliedCoupon.discount_type === 'percent' ? (subtotal * appliedCoupon.discount_value) / 100 : appliedCoupon.discount_value).toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-bold text-sm">
              <span>Taxa de Entrega</span>
              {isFree ? (
                <span className="text-green-500 font-black tracking-widest text-[10px] uppercase bg-green-500/10 px-3 py-1 rounded-full">Grátis</span>
              ) : (
                <span className="font-black text-slate-900 dark:text-white tracking-tighter">
                  R$ {taxaTotalCheckout.toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
            {appliedCoupon && (
              <div className="flex justify-between items-center text-emerald-500 font-bold text-sm">
                <span>Desconto</span>
                <span className="font-black tracking-tighter">
                  -R$ {(appliedCoupon.discount_type === 'percent' ? (subtotal * appliedCoupon.discount_value) / 100 : appliedCoupon.discount_value).toFixed(2).replace(".", ",")}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-5 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xl font-black uppercase tracking-tighter">Total</span>
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                R$ {finalTotal.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </section>
        </main>

        {(() => {
          const activeCard = savedCards.find((c: any) => c.active);
          const hasSavedStripeCard = paymentMethod === "cartao" && activeCard?.stripe_payment_method_id;
          const showButton = paymentMethod !== "cartao" || hasSavedStripeCard;
          if (!showButton) return null;
          return (
            <footer className="fixed bottom-0 left-0 right-0 p-6 pb-24 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-[90]">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => handlePlaceOrder()}
                disabled={isLoading || cart.length === 0}
                className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-5 rounded-[24px] shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.99] uppercase tracking-widest text-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="size-6 border-4 border-slate-900/10 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    Confirmar e Fazer Pedido
                    {hasSavedStripeCard && activeCard && (
                      <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                        ••••{activeCard.last4}
                      </span>
                    )}
                    <span className="material-symbols-outlined font-black">chevron_right</span>
                  </>
                )}
              </motion.button>
            </footer>
          );
        })()}
      </div>
    </Elements>
  );

}
