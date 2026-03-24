import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function PaymentsView() {
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

  const handleSetPrimary = async (cardId: string) => {
    if (!userId) return;
    // Remove padrão de todos, define o novo
    await supabase.from("payment_methods").update({ is_default: false }).eq("user_id", userId);
    await supabase.from("payment_methods").update({ is_default: true }).eq("id", cardId);
    setSavedCards((prev: any[]) => prev.map((c: any) => ({ ...c, active: c.id === cardId })));
    setPaymentMethod("cartao");
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!userId) return;
    if (await showConfirm({ message: "Remover este cartão?" })) {
      await supabase.from("payment_methods").delete().eq("id", cardId).eq("user_id", userId);
      const updated = savedCards.filter((c: any) => c.id !== cardId);
      setSavedCards(updated);
      // Se era o cartão ativo e ainda tem outros, define o primeiro como padrão
      const wasActive = savedCards.find((c: any) => c.id === cardId)?.active;
      if (wasActive && updated.length > 0) {
        await handleSetPrimary(updated[0].id);
      } else if (updated.length === 0) {
        setPaymentMethod("pix");
      }
    }
  };

  const handleSaveCard = async () => {
    if (!userId) return;
    const rawNumber = newCardData.number.replace(/\s/g, "");
    if (rawNumber.length < 15) return showToast("Insira um número de cartão válido");
    if (!newCardData.expiry || newCardData.expiry.length < 5) return showToast("Insira a validade do cartão");
    if (!newCardData.cvv || newCardData.cvv.length < 3) return showToast("Insira o CVV");

    setIsLoadingCards(true);
    try {
      const brand = rawNumber.startsWith("4") ? "Visa"
        : rawNumber.startsWith("34") || rawNumber.startsWith("37") ? "Amex"
        : "Mastercard";

      const isFirst = savedCards.length === 0;
      const { data: inserted, error } = await supabase
        .from("payment_methods")
        .insert({
          user_id: userId,
          brand,
          last4: rawNumber.slice(-4),
          expiry: newCardData.expiry,
          is_default: isFirst,
          stripe_payment_method_id: null,
        })
        .select()
        .single();

      if (error) throw error;

      const newCard = {
        id: inserted.id,
        brand,
        last4: rawNumber.slice(-4),
        expiry: newCardData.expiry,
        active: isFirst,
        stripe_payment_method_id: null,
        color: brand === "Visa"
          ? "linear-gradient(135deg, #2563eb, #1e40af)"
          : brand === "Amex"
            ? "linear-gradient(135deg, #047857, #065f46)"
            : "linear-gradient(135deg, #1e293b, #0f172a)",
      };

      setSavedCards((prev: any[]) => [...prev, newCard]);
      setPaymentMethod("cartao");
      setIsAddingCard(false);
      setNewCardData({ number: "", expiry: "", cvv: "", brand: "Visa" });
      showToast("Cartão adicionado com sucesso!");
    } catch (err: any) {
      toastError("Erro ao salvar cartão: " + err.message);
    } finally {
      setIsLoadingCards(false);
    }
  };

  // Cartão atualmente selecionado (active)
  const activeCard = savedCards.find((c: any) => c.active);

  const handleConfirmAndReturn = () => {
    // Só define cartão se nenhum outro método foi selecionado explicitamente
    if (activeCard && paymentMethod !== "pix" && paymentMethod !== "dinheiro" && paymentMethod !== "saldo" && paymentMethod !== "bitcoin_lightning") {
      setPaymentMethod("cartao");
    }
    setSubView(paymentsOrigin === "izi_black" ? "izi_black_purchase" : "checkout");
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-background-dark flex flex-col hide-scrollbar overflow-y-auto pb-40">
      {/* HEADER */}
      <header className="px-6 py-8 sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              if (paymentsOrigin === "checkout") setSubView("checkout");
              else if (paymentsOrigin === "izi_black") setSubView("izi_black_purchase");
              else setSubView("none");
            }}
            className="size-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg border border-slate-50 dark:border-slate-700 active:scale-90 transition-all"
          >
            <span className="material-symbols-rounded text-2xl">arrow_back</span>
          </button>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">Pagamentos</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
              {paymentsOrigin === "checkout" ? "Escolha a forma de pagamento" : "Métodos de segurança ativa"}
            </p>
          </div>
        </div>
        <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary font-black">verified_user</span>
        </div>
      </header>

      <main className="p-6 space-y-10">

        {/* QUICK ACTIONS / SMART PAY */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Smart Pay</h3>
          <div className="grid grid-cols-2 gap-4">
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="bg-black text-white p-5 rounded-[28px] flex flex-col items-center gap-2 shadow-xl shadow-black/10"
              onClick={() => showToast("Apple Pay não disponível neste dispositivo")}
            >
              <div className="size-10 flex items-center justify-center">
                <svg className="w-8 h-8 fill-current" viewBox="0 0 17 20" xmlns="http://www.w3.org/2000/svg"><path d="M15.11 15.18c-.8.88-1.57 1.83-2.67 1.84-1.07.01-1.39-.63-2.65-.63-1.25 0-1.63.63-2.63.64-1.08.02-1.85-.97-2.7-1.92-1.69-1.9-2.99-5.36-1.24-8.38 1.45-2.52 4.1-3.26 5.6-3.26 1.42 0 2.38.74 3.01.74.62 0 1.96-.86 3.49-.71 1.05.04 1.9.43 2.51.98-2.31 1.54-1.91 5.38.68 6.47-.56 1.63-1.6 3.32-2.7 4.23zM10.84 2.82c-.67.87-1.74 1.48-2.77 1.41-.14-1.09.43-2.19 1.02-2.88.75-.86 1.94-1.42 2.83-1.35.15 1.1-.38 1.95-1.08 2.82z"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Apple Pay</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.96 }}
              className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-5 rounded-[28px] border border-slate-100 dark:border-slate-700 flex flex-col items-center gap-2 shadow-xl"
              onClick={() => showToast("Google Pay não disponível neste dispositivo")}
            >
              <div className="size-10 flex items-center justify-center">
                <svg className="w-8 h-8" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#f2f2f2"/><path d="M18.125 10.688c0-.46-.03-.92-.116-1.38H12v2.76h3.6c-.144.736-.583 1.344-1.206 1.764v1.543h1.954c1.144-1.042 1.777-2.583 1.777-4.687z" fill="#4285f4"/><path d="M12 16.5c-1.216 0-2.26-.814-2.656-1.94l-1.95.006-.008 1.51c.907 1.76 2.72 2.924 4.614 2.924 1.575 0 2.955-.536 3.968-1.458l-1.954-1.543c-.563.376-1.238.6-2.014.6z" fill="#34a853"/><path d="M9.344 14.56c-.2-.593-.314-1.232-.314-1.942s.114-1.349.314-1.942L7.382 9.09l-.01.013c-.66 1.347-1.04 2.868-1.04 4.515 0 1.64.38 3.141 1.04 4.475l2.008-1.533z" fill="#fbbc05"/><path d="M12 7.74c.9 0 1.63.31 2.277.85l1.644-1.644C14.885 6.012 13.565 5.4 12 5.4c-1.9 0-3.666 1.096-4.613 2.768L9.344 9.4c.396-1.127 1.44-1.66 2.656-1.66z" fill="#ea4335"/></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Google Pay</span>
            </motion.button>
          </div>
        </section>

        {/* WALLET */}
        <section className="px-1">
          <div
            onClick={() => { setPaymentMethod("saldo"); if (paymentsOrigin !== "checkout") setSubView("wallet"); }}
            className={`p-6 rounded-[35px] flex items-center justify-between shadow-2xl transition-all group cursor-pointer active:scale-[0.98] border-2 ${paymentMethod === "saldo" ? "bg-slate-900 border-primary shadow-primary/20" : "bg-slate-900 dark:bg-slate-800 border-transparent shadow-slate-900/20"}`}
          >
            <div className="flex items-center gap-5">
              <div className={`size-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${paymentMethod === "saldo" ? "bg-primary text-slate-900" : "bg-primary/20 text-primary"}`}>
                <span className="material-symbols-rounded text-3xl font-black">account_balance_wallet</span>
              </div>
              <div>
                <h4 className="text-white font-black tracking-tight leading-none mb-1">Saldo em Carteira</h4>
                <p className="text-[10px] text-white/50 font-black uppercase tracking-widest">
                  R$ {walletBalance.toFixed(2).replace(".", ",")} {paymentMethod === "saldo" && "• Selecionado"}
                </p>
              </div>
            </div>
            <span className={`material-symbols-rounded transition-colors ${paymentMethod === "saldo" ? "text-primary" : "text-white/30 group-hover:text-primary"}`}>
              {paymentMethod === "saldo" ? "check_circle" : "chevron_right"}
            </span>
          </div>
        </section>

        {/* SAVED CARDS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Cartões Salvos</h3>
            <button
              onClick={() => setIsAddingCard(true)}
              className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-2 rounded-full active:scale-90 transition-all"
            >
              + Adicionar
            </button>
          </div>

          {isLoadingCards ? (
            <div className="flex justify-center py-10">
              <div className="size-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : savedCards.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-[35px] p-8 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">credit_card_off</span>
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Nenhum cartão salvo</p>
              <p className="text-xs text-slate-400 mt-2">Adicione um cartão para pagar com facilidade</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {savedCards.map((card: any, i: number) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.08 }}
                  className={`relative p-7 rounded-[40px] shadow-2xl text-white overflow-hidden group mb-6 cursor-pointer border-2 transition-all ${card.active ? "border-primary shadow-primary/20" : "border-transparent"}`}
                  style={{ background: card.color || "linear-gradient(135deg, #1e293b, #0f172a)" }}
                  onClick={() => handleSetPrimary(card.id)}
                >
                  <div className="absolute -right-16 -top-16 size-48 bg-white/10 rounded-full blur-[40px] group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute -left-16 -bottom-16 size-48 bg-black/20 rounded-full blur-[40px]" />

                  {/* Top Bar */}
                  <div className="flex justify-between items-start mb-10 relative z-10">
                    <div className="size-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                      <span className="material-symbols-rounded text-3xl opacity-80">credit_card</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 block mb-1">Bandeira</span>
                      <h4 className="font-black italic text-lg tracking-widest">{card.brand}</h4>
                    </div>
                  </div>

                  {/* Card Number */}
                  <div className="mb-10 relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-2">Número do Cartão</p>
                    <p className="text-2xl font-black tracking-[0.25em] flex items-center gap-1">
                      <span className="opacity-30">••••</span>
                      <span className="opacity-30">••••</span>
                      <span className="opacity-30">••••</span>
                      <span className="text-white drop-shadow-md">{card.last4}</span>
                    </p>
                  </div>

                  {/* Bottom */}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Expira</p>
                        <p className="font-bold text-sm">{card.expiry}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!card.active && (
                        <div className="px-4 py-2.5 bg-white/20 backdrop-blur-md border border-white/20 text-[9px] font-black uppercase tracking-widest rounded-xl">
                          Toque para usar
                        </div>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id); }}
                        className="size-10 bg-red-500/20 backdrop-blur-md border border-red-500/20 text-red-100 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                      >
                        <span className="material-symbols-rounded text-xl">delete</span>
                      </button>
                    </div>
                  </div>

                  {card.active && (
                    <div className="absolute top-6 right-20 bg-primary/95 text-slate-900 text-[8px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-xl flex items-center gap-1">
                      <span className="material-symbols-rounded text-[12px]">check</span>
                      Selecionado
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </section>

        {/* PIX / DINHEIRO */}
        <section className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2">Outras Formas</h3>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] shadow-xl border border-slate-100 dark:border-slate-700/50 flex flex-col gap-5">
            <div
              className={`flex items-center gap-5 cursor-pointer p-2 rounded-2xl transition-all ${paymentMethod === "pix" ? "bg-emerald-500/10 border border-emerald-500/20" : ""}`}
              onClick={() => setPaymentMethod("pix")}
            >
              <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === "pix" ? "bg-emerald-500 text-white" : "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500"}`}>
                <span className="material-symbols-rounded text-3xl font-black">qr_code_2</span>
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white leading-tight">PIX Instantâneo</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                  {paymentMethod === "pix" ? "Selecionado" : "Aprovação imediata"}
                </p>
              </div>
              {paymentMethod === "pix"
                ? <span className="material-symbols-rounded text-emerald-500">check_circle</span>
                : <span className="text-[10px] font-black text-primary uppercase tracking-widest">Selecionar</span>
              }
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-700 w-full" />

            <div
              className={`flex items-center gap-5 cursor-pointer p-2 rounded-2xl transition-all ${paymentMethod === "bitcoin_lightning" ? "bg-orange-500/10 border border-orange-500/20" : ""}`}
              onClick={() => setPaymentMethod("bitcoin_lightning")}
            >
              <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === "bitcoin_lightning" ? "bg-orange-500 text-white" : "bg-orange-50 dark:bg-orange-900/10 text-orange-500"}`}>
                <span className="material-symbols-rounded text-3xl font-black">bolt</span>
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white leading-tight">Bitcoin Lightning</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-70">
                  {paymentMethod === "bitcoin_lightning" ? "Selecionado" : "Taxas quase zero"}
                </p>
              </div>
              {paymentMethod === "bitcoin_lightning"
                ? <span className="material-symbols-rounded text-orange-500">check_circle</span>
                : <span className="text-[10px] font-black text-primary uppercase tracking-widest">Selecionar</span>
              }
            </div>

            <div className="h-[1px] bg-slate-100 dark:bg-slate-700 w-full" />

            <div
              className={`flex items-center gap-5 cursor-pointer p-2 rounded-2xl transition-all ${paymentMethod === "dinheiro" ? "bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600" : ""}`}
              onClick={() => setPaymentMethod("dinheiro")}
            >
              <div className={`size-14 rounded-2xl flex items-center justify-center transition-colors ${paymentMethod === "dinheiro" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
                <span className="material-symbols-rounded text-3xl font-black">payments</span>
              </div>
              <div className="flex-1">
                <h4 className="font-black text-slate-900 dark:text-white leading-tight">Pagamento em Dinheiro</h4>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  {paymentMethod === "dinheiro" ? "Selecionado" : "Pague na entrega"}
                </p>
              </div>
              {paymentMethod === "dinheiro" && <span className="material-symbols-rounded text-slate-900 dark:text-white">check_circle</span>}
            </div>
          </div>
        </section>

        {/* SECURITY */}
        <div className="bg-primary/5 border border-primary/20 border-dashed p-6 rounded-[35px] flex flex-col items-center text-center gap-2">
          <span className="material-symbols-rounded text-3xl text-primary animate-pulse">shield_with_heart</span>
          <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest">Dados Criptografados</p>
          <p className="text-[9px] text-slate-400 font-bold leading-relaxed px-4 opacity-70">Sua segurança é nossa prioridade. Nunca armazenamos o CVV.</p>
        </div>
      </main>

      {/* BOTÃO CONFIRMAR — aparece apenas quando vem do checkout */}
      {paymentsOrigin === "checkout" && (
        <div className="fixed bottom-0 left-0 right-0 p-6 pb-24 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-background-dark dark:via-background-dark z-[90]">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirmAndReturn}
            className="w-full bg-primary text-slate-900 font-black py-5 rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 uppercase tracking-widest text-sm"
          >
            <span className="material-symbols-rounded font-black">check_circle</span>
            Confirmar Pagamento
            {paymentMethod === "cartao" && activeCard && (
              <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                ••••{activeCard.last4}
              </span>
            )}
            {paymentMethod === "pix" && (
              <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                PIX
              </span>
            )}
            {paymentMethod === "dinheiro" && (
              <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Dinheiro
              </span>
            )}
            {paymentMethod === "bitcoin_lightning" && (
              <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Bitcoin
              </span>
            )}
            {paymentMethod === "saldo" && (
              <span className="bg-slate-900/20 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Saldo
              </span>
            )}
          </motion.button>
        </div>
      )}

      {/* MODAL: ADD CARD via Stripe */}
      <AnimatePresence>
        {isAddingCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.5 }}
              className="w-full max-w-md bg-white dark:bg-slate-800 rounded-[45px] p-8 shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Novo Cartão</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Tokenizado com segurança via Stripe</p>
                </div>
                <button onClick={() => setIsAddingCard(false)} className="size-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <span className="material-symbols-rounded text-slate-500">close</span>
                </button>
              </div>
              <Elements stripe={stripePromise}>
                <StripePaymentForm
                  total={0}
                  userId={userId}
                  onConfirm={() => {
                    setIsAddingCard(false);
                    showToast("Cartão salvo com sucesso!");
                  }}
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
                    setPaymentMethod("cartao");
                  }}
                />
              </Elements>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

}
