import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ExploreCategoryView() {
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

  if (!exploreCategoryState) return null;

  // Filtra os lojistas reais do banco de dados ao invés de usar dados engessados (hardcoded)
  const shops = ESTABLISHMENTS.filter((estab: any) => {
     const catId = (exploreCategoryState.id || "").toLowerCase();
     const catTitle = (exploreCategoryState.title || "").toLowerCase();
     const type = (estab.type || "").toLowerCase();
     const tag = (estab.tag || "").toLowerCase();
     return type === catId || type === catTitle || estab.category_id === catId || tag.includes(catId) || tag.includes(catTitle);
  }).map((estab: any) => ({
    id: estab.id,
    name: estab.name,
    rating: estab.rating || "5.0",
    time: estab.time || "30-50 min",
    freeDelivery: estab.freeDelivery || true,
    fee: estab.freeDelivery ? undefined : "R$ 4,90",
    tag: estab.tag || "Loja Parceira",
    banner: estab.banner || estab.img,
    logo: estab.img || estab.banner,
    type: estab.type,
  }));

  const accentColor = exploreCategoryState.primaryColor;

  return (
    <div className="absolute inset-0 z-40 bg-white dark:bg-[#0F172A] flex flex-col hide-scrollbar overflow-y-auto pb-40">
      <div className="relative h-72 shrink-0">
        <img src={exploreCategoryState.banner} className="size-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0F172A] via-black/20 to-transparent" />
        
        <div className="absolute top-8 left-6 right-6 flex items-center justify-between">
          <button 
            onClick={() => setSubView('none')} 
            className="size-12 rounded-[22px] bg-white/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all font-black"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button className="size-12 rounded-[22px] bg-white/20 backdrop-blur-3xl border border-white/30 flex items-center justify-center text-white active:scale-90 transition-all font-black">
            <span className="material-symbols-outlined">search</span>
          </button>
        </div>

        <div className="absolute bottom-10 left-8">
           <div className={`px-4 py-1.5 rounded-full bg-${accentColor} text-white text-[10px] font-black uppercase tracking-[0.2em] w-fit mb-3 shadow-lg shadow-${accentColor}/30`}>
              {exploreCategoryState.tagline}
           </div>
           <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
              {exploreCategoryState.title}
           </h1>
        </div>
      </div>

      <main className="px-6 space-y-8 -mt-6 relative z-10">
        <div className="flex gap-4 overflow-x-auto no-scrollbar py-2">
          {['Em Destaque', 'Mais Próximos', 'Novidades', 'Melhor Avaliados'].map((filter, i) => (
            <button 
              key={i} 
              className={`px-6 py-3 rounded-2xl whitespace-nowrap text-[11px] font-black uppercase tracking-widest transition-all ${i === 0 ? `bg-slate-900 dark:bg-primary text-white dark:text-slate-900 shadow-xl shadow-primary/20` : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-6">
          {shops.map((shop, i) => (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              key={shop.id}
              onClick={() => handleShopClick({ ...shop, type: exploreCategoryState.id })}
              className="bg-white dark:bg-slate-900 rounded-[45px] overflow-hidden shadow-2xl border border-slate-100 dark:border-white/5 group relative"
            >
              <div className="h-44 relative overflow-hidden">
                <img src={shop.banner} className="size-full object-cover group-hover:scale-105 transition-transform duration-[2000ms]" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-xl">
                   <span className="material-symbols-outlined text-amber-500 text-[16px] fill-1">star</span>
                   <span className="text-[11px] font-black text-slate-900">{shop.rating}</span>
                </div>
              </div>
              <div className="p-6 flex items-center gap-5">
                <div className="size-14 rounded-[20px] bg-white p-1 shadow-xl shrink-0 border border-slate-50">
                  <img src={shop.logo} className="size-full rounded-[15px] object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white truncate">{shop.name}</h3>
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <span className={`text-${accentColor}`}>{shop.tag}</span>
                    <span>•</span>
                    <span>{shop.time}</span>
                    <span>•</span>
                    <span className={shop.freeDelivery ? "text-emerald-500" : ""}>{shop.freeDelivery ? "Grátis" : shop.fee}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );

}
