import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function CartView() {
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

  const subtotal = cart.reduce((a, b) => a + (b.price || 0), 0);
  const isFree = selectedShop?.freeDelivery;
  const taxa = isFree ? 0 : calculateDynamicPrice(5.0);
  const total = subtotal + taxa;

  if (cart.length === 0) {
    return (
      <div className="absolute inset-0 z-[70] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="size-64 bg-slate-50 dark:bg-white/5 rounded-[60px] flex items-center justify-center mb-8 relative"
        >
          <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
          <span className="material-symbols-outlined text-8xl text-slate-300 dark:text-white/10 relative z-10">shopping_bag</span>
        </motion.div>
        <h2 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white mb-2">Seu carrinho está vazio</h2>
        <p className="text-slate-400 font-bold text-sm max-w-[250px] leading-relaxed mb-10">Que tal explorar as delícias próximas a você e encher sua sacola?</p>
        <button 
          onClick={() => setSubView("none")}
          className="bg-primary text-slate-900 px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
        >
          Começar a Comprar
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[70] bg-[#F8FAFC] dark:bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto">
      {/* Header Luxury */}
      <header className="sticky top-0 z-[80] bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-100 dark:border-white/5 p-6 flex items-center justify-between">
        <button
          onClick={() => {
            if (selectedShop?.type === 'restaurant') setSubView("restaurant_menu");
            else if (subView === "cart") setSubView("none"); // Default fallback
            else setSubView("store_catalog");
          }}
          className="size-12 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined font-black">arrow_back</span>
        </button>
        <div className="text-center flex-1">
          <h1 className="text-xl font-black tracking-tighter dark:text-white">Sua Sacola</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">{cart.length} ITENS SELECIONADOS</p>
        </div>
        <button 
          className="size-12 rounded-2xl bg-red-50 dark:bg-red-500/10 text-red-500 border border-red-100 dark:border-red-500/20 flex items-center justify-center active:scale-90 transition-all"
          onClick={async () => { if(await showConfirm({ message: "Esvaziar carrinho?" })) setCart([]); }}
        >
          <span className="material-symbols-outlined font-black">delete_sweep</span>
        </button>
      </header>

      <div className="flex-1 px-6 pt-8 pb-48 space-y-10">
        {/* Shop Context */}
        <section className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[40px] p-6 flex items-center gap-5 shadow-sm">
          <div className="size-16 rounded-[22px] bg-primary flex items-center justify-center text-slate-900 shadow-xl shadow-primary/10">
            <span className="material-symbols-outlined text-3xl font-black">
              {selectedShop?.type === 'restaurant' ? 'restaurant' : 'shopping_basket'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">Pedido em</p>
            <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">
              {selectedShop?.name || "Market Express"}
            </h2>
            <p className="text-xs font-bold text-slate-400 truncate">{selectedShop?.tag || "Especialista em Entregas Fast"}</p>
          </div>
        </section>

        {/* Items List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Itens no Carrinho</h3>
            <button onClick={() => setSubView("none")} className="text-[10px] font-black text-primary uppercase tracking-widest">+ Adicionar Itens</button>
          </div>
          
          <AnimatePresence>
            {Array.from(new Set(cart.map((i) => i.id))).map((id) => {
              const item = cart.find((i) => i.id === id);
              if (!item) return null;
              const count = getItemCount(item.id);
              return (
                <motion.div
                  key={id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 p-5 rounded-[35px] flex items-center gap-5 group shadow-sm hover:shadow-xl transition-all"
                >
                  <div className="size-20 rounded-[24px] overflow-hidden shrink-0 shadow-lg relative bg-slate-100 dark:bg-slate-800">
                    <img src={item.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200"} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                    <div className="absolute inset-0 bg-black/5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight mb-0.5 leading-tight truncate">{item.name}</h4>
                    <p className="text-primary font-black text-sm mb-3">R$ {item.price.toFixed(2).replace(".", ",")}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-slate-50 dark:bg-black/20 p-1.5 rounded-2xl gap-3 border border-slate-100 dark:border-white/5">
                         <button 
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="size-8 rounded-xl bg-white dark:bg-white/5 text-slate-900 dark:text-white shadow-sm flex items-center justify-center active:scale-90 transition-all"
                         >
                           <span className="material-symbols-outlined text-sm font-black">remove</span>
                         </button>
                         <span className="font-black text-slate-900 dark:text-white text-sm w-4 text-center">{count}</span>
                         <button 
                          onClick={() => handleAddToCart(item)}
                          className="size-8 rounded-xl bg-primary text-slate-900 shadow-lg shadow-primary/20 flex items-center justify-center active:scale-90 transition-all font-black text-sm"
                         >
                           <span className="material-symbols-outlined text-sm font-black">add</span>
                         </button>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFromCart(item.id, true)}
                    className="size-10 rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Payment Summary */}
        <section className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[45px] p-8 space-y-4 shadow-sm">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 block text-center">Resumo da Compra</h3>
          <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
             <span>Subtotal</span>
             <span className="text-slate-900 dark:text-white font-black">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-bold text-slate-500 dark:text-slate-400">
             <span>Taxa de Entrega</span>
             {isFree ? (
               <span className="text-green-500 font-black tracking-widest text-[10px] uppercase bg-green-500/10 px-3 py-1 rounded-full">Grátis</span>
             ) : (
               <span className="text-slate-900 dark:text-white font-black">R$ {taxa.toFixed(2).replace(".", ",")}</span>
             )}
          </div>
          <div className="h-px bg-slate-100 dark:bg-white/5 my-4" />
          <div className="flex justify-between items-center pt-2">
             <span className="text-lg font-black tracking-tighter dark:text-white">Total</span>
             <div className="text-right">
                <span className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white leading-none">R$ {total.toFixed(2).replace(".", ",")}</span>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-1">Economia de R$ 10,00</p>
             </div>
          </div>
        </section>
      </div>

      {/* Global Checkout CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-8 pt-4 pb-12 bg-gradient-to-t from-[#F8FAFC] via-[#F8FAFC] to-transparent dark:from-slate-950 dark:via-slate-950 z-[90]">
        <button
          onClick={() => setSubView("checkout")}
          className="group w-full bg-slate-900 dark:bg-primary h-20 rounded-[30px] flex items-center justify-between px-2 shadow-2xl active:scale-[0.98] transition-all overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
          
          <div className="flex items-center gap-4 ml-4">
             <div className="size-12 rounded-2xl bg-white/10 dark:bg-black/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-white dark:text-slate-900 font-black">lock</span>
             </div>
             <span className="font-black text-white dark:text-slate-900 uppercase tracking-[0.2em] text-sm">Fechar Pedido</span>
          </div>

          <div className="h-14 px-8 rounded-2xl bg-white dark:bg-slate-900 flex items-center justify-center mr-2 shadow-xl">
             <span className="font-black text-lg text-slate-900 dark:text-white tracking-tight">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        </button>
      </div>
    </div>
  );

}
