import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function MarketListView() {
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

  const marketCategories = [
    { id: 'hortifruti', name: 'Hortifruti', icon: 'eco', color: 'bg-emerald-500', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
    { id: 'carnes', name: 'Carnes', icon: 'restaurant', color: 'bg-red-500', gradient: 'linear-gradient(135deg, #ef4444, #dc2626)' },
    { id: 'bebidas', name: 'Bebidas', icon: 'local_bar', color: 'bg-indigo-500', gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)' },
    { id: 'higiene', name: 'Higiene', icon: 'clean_hands', color: 'bg-purple-500', gradient: 'linear-gradient(135deg, #a855f7, #9333ea)' },
    { id: 'padaria', name: 'Padaria', icon: 'bakery_dining', color: 'bg-orange-500', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  ];

  const dailyDeals: any[] = [];

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
              <h1 className="text-xl font-black tracking-tight leading-none mb-1 truncate">Supermercados</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">location_on</span>
                <span className="truncate">{userLocation.address.split(',')[0]}</span>
              </p>
            </div>
          </div>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg shrink-0">{cart.length}</span>}
          </button>
        </div>
        <div className="px-5 mt-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group relative">
            <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
              placeholder="Buscar no mercado..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-12 py-8">
        {/* Categories Horizontal */}
        <section>
          <div className="flex gap-6 px-5 overflow-x-auto no-scrollbar">
            {marketCategories.map((cat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                key={cat.id}
                onClick={() => {
                  setActiveService({ ...activeService, subType: cat.id });
                  navigateSubView('generic_list');
                }}
                className="flex flex-col items-center gap-3 shrink-0 group cursor-pointer active:scale-95 transition-all"
              >
                <div className="size-20 rounded-[30px] flex items-center justify-center shadow-xl relative overflow-hidden group-hover:scale-105 transition-transform" style={{ background: cat.gradient }}>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  <span className="material-symbols-outlined text-white text-4xl leading-none drop-shadow-lg">{cat.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Flash Deals */}
        <section className="px-5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Imperdíveis</h2>
              <div className="flex items-center gap-3">
                <p className="text-xl font-black tracking-tighter">Ofertas Relâmpago</p>
                <div className="px-3 py-1 bg-red-500 text-white text-[9px] font-black rounded-full animate-pulse uppercase tracking-widest">Flash Sale</div>
              </div>
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary">Ver Tudo</button>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {dailyDeals.filter(deal => 
              deal.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              deal.cat.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((deal, i) => (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={deal.id}
                onClick={() => {
                  setSelectedItem({ ...deal, desc: "Oferta especial de mercado disponível por tempo limitado." });
                  setTempQuantity(1);
                  navigateSubView('product_detail');
                }}
                className="p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 flex items-center gap-6 relative overflow-hidden group active:scale-[0.98] transition-all cursor-pointer"
              >
                <div className="size-32 rounded-[35px] overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500 bg-slate-100 dark:bg-slate-900 shadow-inner">
                  <img src={deal.img} className="w-full h-full object-cover" alt={deal.name} />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">{deal.cat}</p>
                  <h3 className="font-black text-slate-900 dark:text-white mb-3 text-[15px] leading-tight group-hover:text-primary transition-colors">{deal.name}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-xl font-black text-slate-900 dark:text-white leading-none">R$ {deal.price.toFixed(2).replace('.', ',')}</span>
                      <span className="text-xs text-slate-400 line-through opacity-70">R$ {deal.oldPrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black">-{deal.off}</div>
                  </div>
                </div>
                <div className="size-11 rounded-[18px] bg-primary flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform self-center">
                  <span className="material-symbols-outlined text-slate-900 font-black">add</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Near Markets Scroller */}
        <section>
          <div className="px-5 flex items-center justify-between mb-8">
            <div>
              <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Próximos</h2>
              <p className="text-xl font-black tracking-tighter">Mercados da Região</p>
            </div>
          </div>
          <div className="flex gap-6 px-5 overflow-x-auto no-scrollbar pb-6">
            {ESTABLISHMENTS.filter(shop => shop.type === 'market').map((market, i) => (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={market.id}
                onClick={() => handleShopClick({ ...market, type: 'market' })}
                className="min-w-[280px] p-5 bg-white dark:bg-slate-800 rounded-[45px] border border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-black/20 group active:scale-95 transition-all cursor-pointer"
              >
                <div className="h-40 rounded-[35px] overflow-hidden mb-5 relative shadow-inner">
                  <img src={market.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={market.name} />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl">
                    <span className="material-symbols-outlined text-primary text-[13px] fill-1">star</span>
                    <span className="text-[11px] font-black text-slate-900">{market.rating}</span>
                  </div>
                  {market.freeDelivery && (
                     <div className="absolute bottom-4 left-4 bg-emerald-500/90 backdrop-blur text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">Grátis</div>
                  )}
                </div>
                <h3 className="font-black text-[16px] mb-2 group-hover:text-primary transition-colors">{market.name}</h3>
                <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-widest">
                  <span>{market.time} • {market.dist}</span>
                  <span className={market.freeDelivery ? 'text-emerald-500' : ''}>
                    {market.freeDelivery ? 'Entrega Grátis' : market.fee}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );

}
