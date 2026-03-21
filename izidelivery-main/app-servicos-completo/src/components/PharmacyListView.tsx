import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function PharmacyListView() {
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

  const pharmacyCategories = [
    { id: 'medicamentos', name: 'Remédios', icon: 'medical_services', color: 'bg-red-500', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { id: 'higiene', name: 'Higiene', icon: 'clean_hands', color: 'bg-blue-500', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
    { id: 'dermocosmeticos', name: 'Beleza', icon: 'face', color: 'bg-pink-500', gradient: 'linear-gradient(135deg, #ec4899, #db2777)' },
    { id: 'vitaminas', name: 'Saúde', icon: 'pill', color: 'bg-amber-500', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
  ];

  const nearbyPharmacies = ESTABLISHMENTS.filter(e => e.type === 'pharmacy');

  return (
    <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
      <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/5 pb-4">
        <div className="flex items-center p-5 pb-2 justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => setSubView('none')} 
              className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all shrink-0"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight leading-none mb-1 truncate">Farmácias</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Saúde & Bem-estar</p>
            </div>
          </div>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center shrink-0 group">
            <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg shrink-0">{cart.length}</span>}
          </button>
        </div>
        <div className="px-5 mt-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group relative">
            <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
              placeholder="Buscar produtos ou remédios..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-10 py-8">
        {/* Categories Grid */}
        <section className="px-5">
          <div className="grid grid-cols-2 gap-5">
            {pharmacyCategories.map((cat, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={cat.id}
                onClick={() => {
                  setActiveService({ ...activeService, subType: cat.id });
                  navigateSubView('generic_list');
                }}
                className="p-5 rounded-[40px] flex flex-col items-center gap-4 cursor-pointer active:scale-95 transition-all shadow-xl shadow-slate-200/50 dark:shadow-black/20 group relative overflow-hidden"
                style={{ background: cat.gradient }}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                <span className="material-symbols-outlined text-white text-5xl leading-none drop-shadow-xl">{cat.icon}</span>
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/90 text-center">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Promotional Banner */}
        <section className="px-5">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            onClick={() => navigateSubView('health_plantao')}
            className="bg-slate-900 dark:bg-white p-8 rounded-[50px] text-white dark:text-slate-900 relative overflow-hidden shadow-2xl group cursor-pointer"
          >
            <div className="relative z-10 pr-20">
              <div className="flex items-center gap-2 mb-3">
                 <span className="bg-primary text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">Flash Sale</span>
              </div>
              <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none">Plantão de Saúde</h2>
              <p className="opacity-70 text-[11px] font-bold mb-6 leading-relaxed">Economize até 50% em medicamentos genéricos e vitaminas premium hoje.</p>
              <button className="bg-primary text-slate-900 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-transform">Explorar agora</button>
            </div>
            <span className="absolute -right-8 -bottom-8 material-symbols-outlined text-[180px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">local_pharmacy</span>
          </motion.div>
        </section>

        {/* Near Pharmacies */}
        <section>
          <div className="flex items-center justify-between px-5 mb-8">
            <div>
              <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Destaques</h2>
              <p className="text-xl font-black tracking-tighter">Farmácias Premium</p>
            </div>
            <button 
              onClick={() => navigateSubView('all_pharmacies')}
              className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-4 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
            >
              Ver Todas
            </button>
          </div>
          <div className="flex flex-col gap-6 px-5 pb-8">
            {nearbyPharmacies.map((pharm, i) => (
              <motion.div
                key={pharm.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleShopClick({ ...pharm, type: 'pharmacy' })}
                className="p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-6 active:scale-[0.98] transition-all group cursor-pointer"
              >
                <div className="size-20 rounded-[28px] overflow-hidden shrink-0 shadow-inner bg-slate-100 dark:bg-slate-900">
                  <img src={pharm.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={pharm.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 dark:text-white leading-tight text-base truncate mb-1.5 group-hover:text-primary transition-colors">{pharm.name}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-[15px] fill-1">star</span>
                      <span className="text-slate-900 dark:text-white">{pharm.rating}</span>
                    </div>
                    <span className="opacity-50">•</span>
                    <span>{pharm.time}</span>
                  </div>
                </div>
                <div className="size-11 rounded-[18px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-slate-900 transition-all shadow-inner">
                  <span className="material-symbols-outlined text-lg font-black">arrow_forward</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );

}
