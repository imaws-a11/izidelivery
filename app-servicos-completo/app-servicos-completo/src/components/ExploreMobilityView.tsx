import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ExploreMobilityView() {
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

  const categories = [
    { id: 'mototaxi', name: 'MotoTáxi', icon: 'motorcycle', priceRange: 'R$ 8-15', eta: '3 min', desc: 'Agilidade total', gradient: 'linear-gradient(135deg, #facc15, #f97316)' },
    { id: 'carro', name: 'Premium Car', icon: 'directions_car', priceRange: 'R$ 15-30', eta: '6 min', desc: 'Conforto executivo', gradient: 'linear-gradient(135deg, #334155, #0f172a)' },
    { id: 'van', name: 'Luxury Van', icon: 'airport_shuttle', priceRange: 'R$ 40-80', eta: '12 min', desc: 'Espaço para grupos', gradient: 'linear-gradient(135deg, #6366f1, #2563eb)' },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100/50 dark:border-slate-800/50 pb-6">
        <div className="flex items-center p-6 pb-2 justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setSubView('none')} 
              className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Explorar Mobilidade</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Vá com Segurança e Estilo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-6 space-y-10 pt-8">
        {/* Main Banner / Visual */}
        <section className="relative h-60 rounded-[50px] overflow-hidden group shadow-2xl">
          <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=800" className="size-full object-cover group-hover:scale-105 transition-transform duration-[5000ms]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent flex flex-col justify-end p-10">
            <h2 className="text-3xl font-black text-white tracking-tighter leading-none mb-2">Para onde vamos <br/><span className="text-primary">hoje?</span></h2>
            <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Motoristas de elite ao seu dispor</p>
          </div>
        </section>

        {/* Quick Schedule Option */}
        <section>
          <div 
            onClick={() => {
              setTransitData({...transitData, scheduled: true, scheduledDate: new Date().toISOString().split('T')[0], scheduledTime: '12:00'});
              navigateSubView('transit_selection');
            }}
            className="bg-primary/10 border-2 border-primary/20 p-8 rounded-[45px] flex items-center justify-between group cursor-pointer active:scale-95 transition-all relative overflow-hidden shadow-2xl shadow-primary/5"
          >
            <div className="absolute top-0 right-0 size-40 bg-primary/20 rounded-full blur-[60px] -mr-20 -mt-20 group-hover:bg-primary/30 transition-colors" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="size-18 rounded-[25px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 group-hover:rotate-6 transition-transform">
                <span className="material-symbols-outlined text-slate-900 text-3xl font-black italic">schedule</span>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">Agendar Corrida</h3>
                <p className="text-[10px] uppercase font-black tracking-[0.15em] text-primary opacity-80">Pontualidade & Exclusividade</p>
              </div>
            </div>
            <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center group-hover:translate-x-2 transition-transform shadow-inner">
              <span className="material-symbols-outlined text-primary font-black">arrow_forward</span>
            </div>
          </div>
        </section>

        {/* Categories Horizontal Selector */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Serviços Disponíveis</h3>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-800 mx-6 opacity-40" />
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => {
                  setTransitData({...transitData, type: cat.id as any, scheduled: false});
                  navigateSubView('transit_selection');
                }}
                className="bg-white dark:bg-slate-800 p-6 rounded-[45px] border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden"
              >
                <div className="size-20 rounded-[28px] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-500" style={{ background: cat.gradient }}>
                  <span className="material-symbols-outlined text-white text-4xl font-black">{cat.icon}</span>
                </div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">{cat.name}</h4>
                  <p className="text-[11px] font-bold text-slate-400 leading-tight mb-2 opacity-80">{cat.desc}</p>
                  <div className="flex items-center gap-4">
                     <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">{cat.eta} para chegar</span>
                     <span className="text-[10px] font-black uppercase text-slate-400">A partir de {cat.priceRange}</span>
                  </div>
                </div>
                <div className="size-12 rounded-[22px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary transition-colors">
                  <span className="material-symbols-outlined font-black group-hover:text-slate-900 transition-colors">arrow_forward</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );

}
