import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function AcaiListView() {
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

  const acaiShops = ESTABLISHMENTS.map((estab: any) => ({
    id: estab.id,
    name: estab.name,
    rating: estab.rating || "5.0",
    time: estab.time || "30-40 min",
    freeDelivery: estab.freeDelivery || true,
    banner: estab.banner,
    logo: estab.img,
    products: [] as any[]
  }));

  return (
    <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center p-6 pb-2 justify-between">
          <div className="flex items-center gap-5">
            <button onClick={() => setSubView('restaurant_list')} className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group">
              <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Açaí & Refrescos</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Energia & Sabor</p>
            </div>
          </div>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all">
            <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">{cart.length}</span>}
          </button>
        </div>
        <div className="px-6 mt-4">
          <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
             <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
             <input className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" placeholder="Buscar açaí ou adicional..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </header>

      <main className="p-6 space-y-12 pt-8">
        {acaiShops.filter(shop => 
          shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          shop.products.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ).map((shop, i) => (
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} key={shop.id} className="bg-white dark:bg-slate-900 rounded-[60px] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.08)] dark:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group">
            <div className="relative h-64">
              <img src={shop.banner} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
              <div className="absolute bottom-8 left-8 flex items-center gap-5">
                <div className="size-20 rounded-[28px] bg-white p-2 shadow-2xl shrink-0 group-hover:rotate-3 transition-transform">
                  <img src={shop.logo} className="size-full rounded-[20px] object-cover" />
                </div>
                <div className="text-white">
                  <h3 className="text-2xl font-black tracking-tighter mb-2 group-hover:text-primary transition-colors">{shop.name}</h3>
                  <div className="flex items-center gap-4 text-[10px] uppercase font-black tracking-widest text-white/80">
                    <span className="text-primary flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                      <span className="material-symbols-outlined text-[16px] fill-1">star</span>{shop.rating}
                    </span>
                    <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                       <span className="material-symbols-outlined text-[16px]">schedule</span>{shop.time}
                    </span>
                    {shop.freeDelivery && <span className="bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-[9px] shadow-lg">FRETE GRÁTIS</span>}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-8 bg-primary rounded-full" />
                  <p className="text-[13px] font-black uppercase text-slate-400 tracking-[0.2em]">O melhor do Açaí</p>
                </div>
                <div className="h-[1px] flex-1 bg-slate-100 dark:bg-slate-800 mx-6 opacity-50" />
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                {shop.products.slice(0, 3).map((p, idx) => (
                  <div key={p.id} onClick={() => { setSelectedItem(p); setTempQuantity(1); navigateSubView('product_detail'); }} className="flex gap-6 p-5 rounded-[45px] bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-slate-800 shadow-none hover:shadow-2xl hover:border-primary/20 active:scale-[0.98] transition-all group cursor-pointer relative overflow-hidden">
                    <div className="relative overflow-hidden size-32 rounded-[35px] shrink-0 shadow-xl group-hover:shadow-primary/10 transition-shadow">
                      <img src={p.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <div className="absolute top-3 left-3 size-8 bg-primary rounded-2xl flex items-center justify-center font-black text-[12px] text-slate-900 border border-white/20 shadow-lg">#{idx + 1}</div>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors">{p.name}</h4>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">{p.desc}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                        <div className="size-12 rounded-[20px] bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-all duration-300">
                          <span className="material-symbols-outlined text-xl font-black">add</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => handleShopClick({ ...shop, type: 'restaurant' })} 
                className="w-full mt-10 py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[35px] text-[12px] font-black uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="relative z-10 group-hover:text-slate-900 transition-colors">Ver opções do Açaí</span>
                <span className="material-symbols-outlined text-xl font-black group-hover:translate-x-2 transition-transform relative z-10 group-hover:text-slate-900 transition-colors">arrow_forward</span>
              </button>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );

}
