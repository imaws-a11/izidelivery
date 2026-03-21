import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function BeveragesListView() {
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

  const beverageCategories = [
    { id: 'cervejas', name: 'Cervejas', icon: 'sports_bar', color: 'bg-amber-500', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)' },
    { id: 'vinhos', name: 'Vinhos', icon: 'wine_bar', color: 'bg-purple-700', gradient: 'linear-gradient(135deg, #7e22ce, #581c87)' },
    { id: 'destilados', name: 'Destilados', icon: 'liquor', color: 'bg-slate-700', gradient: 'linear-gradient(135deg, #334155, #0f172a)' },
    { id: 'nao_alcoolicos', name: 'Sem Álcool', icon: 'water_drop', color: 'bg-blue-500', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)' },
  ];

  const popularShops = ESTABLISHMENTS.filter(e => e.type === 'beverages');

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
              <h1 className="text-xl font-black tracking-tight leading-none mb-1 truncate">Bebidas</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adegas & Distribuidoras</p>
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
              placeholder="Qual sua sede hoje? Geladas, vinhos..." 
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
            {beverageCategories.map((cat, i) => (
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

        {/* Luxury Promotional Card (Dynamic) */}
        <section className="px-5">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            onClick={() => navigateSubView('beverage_offers')}
            className="bg-gradient-to-br from-slate-900 to-indigo-900 min-h-[220px] rounded-[50px] text-white relative overflow-hidden shadow-2xl group cursor-pointer"
          >
            {beverageBanners.length > 0 ? (
              <>
                <img 
                  src={beverageBanners[0].image_url} 
                  className="absolute inset-0 size-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-[3000ms]" 
                  alt="Promo" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
                <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 bg-primary text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none mb-4 w-fit">
                    Destaque em Bebidas
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none italic text-primary">
                    {beverageBanners[0].title}
                  </h2>
                  {beverageBanners[0].description && (
                    <p className="opacity-70 text-[11px] font-bold mb-4 leading-relaxed max-w-[250px] line-clamp-2">
                      {beverageBanners[0].description}
                    </p>
                  )}
                  <button className="bg-white text-slate-900 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-transform w-fit mt-2">Ver Ofertas</button>
                </div>
              </>
            ) : (
              <div className="p-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-primary text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest leading-none mb-4">Especial Fim de Semana</div>
                <h2 className="text-3xl font-black tracking-tighter mb-2 leading-none italic text-primary">Happy Hour em Casa</h2>
                <p className="opacity-70 text-[11px] font-bold mb-6 leading-relaxed max-w-[200px]">Cervejas artesanais com entrega em até 15 minutos. Geladas garantidas!</p>
                <button className="bg-white text-slate-900 px-8 py-3.5 rounded-[22px] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl group-hover:scale-105 transition-transform">Ver Ofertas</button>
              </div>
            )}
            <span className="absolute -right-4 -bottom-4 material-symbols-outlined text-[150px] opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">celebration</span>
          </motion.div>
        </section>

        {/* Near Adagas */}
        <section>
          <div className="flex items-center justify-between px-5 mb-8">
            <div>
              <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Destaques</h2>
              <p className="text-xl font-black tracking-tighter">Próximo a Você</p>
            </div>
          </div>
          <div className="flex flex-col gap-6 px-5 pb-8">
            {popularShops.map((shop, i) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => handleShopClick({ ...shop, type: 'beverages' })}
                className="p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-6 active:scale-[0.98] transition-all group cursor-pointer"
              >
                <div className="size-20 rounded-[28px] overflow-hidden shrink-0 shadow-inner bg-slate-100 dark:bg-slate-900">
                  <img src={shop.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={shop.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 dark:text-white leading-tight text-base truncate mb-1.5 group-hover:text-primary transition-colors">{shop.name}</h3>
                  <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-primary text-[15px] fill-1">star</span>
                      <span className="text-slate-900 dark:text-white">{shop.rating}</span>
                    </div>
                    <span className="opacity-50">•</span>
                    <span>{shop.time}</span>
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
