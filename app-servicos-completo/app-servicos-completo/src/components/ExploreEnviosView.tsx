import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ExploreEnviosView() {
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
    { id: 'utilitario', name: 'Entrega Express', icon: 'bolt', priceRange: 'R$ 10-25', eta: '5 min', desc: 'Documentos e pequenos volumes', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    { id: 'utilitario', name: 'Fretes & Mudanças', icon: 'local_shipping', priceRange: 'R$ 45-150', eta: '15 min', desc: 'Transporte de grandes volumes', gradient: 'linear-gradient(135deg, #6366f1, #2563eb)' },
    { id: 'van', name: 'Coleta Agenciada', icon: 'inventory_2', priceRange: 'R$ 30-60', eta: '10 min', desc: 'Logística para empresas', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-3xl border-b border-slate-100/50 dark:border-slate-800/50 pb-6 transition-all">
        <div className="flex items-center p-6 pb-2 justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setSubView('none')} 
              className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Explorar Envios</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Logística Completa ao seu toque</p>
            </div>
          </div>
        </div>

        <div className="px-6 mt-4">
          <div className="bg-white dark:bg-slate-800/80 rounded-[28px] p-6 shadow-2xl border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all relative overflow-hidden group">
             <div className="flex items-center gap-4 relative z-10">
                <span className="material-symbols-outlined text-primary text-2xl group-focus-within:scale-110 transition-transform">location_on</span>
                <div className="flex-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Para onde deseja enviar?</p>
                  <AddressSearchInput 
                    isLoaded={isLoaded}
                    initialValue={transitData.destination}
                    placeholder="Digite o endereço de entrega..."
                    className="bg-transparent border-none p-0 text-base font-bold w-full focus:ring-0 placeholder:text-slate-400 dark:text-white"
                    onSelect={(place: google.maps.places.PlaceResult) => {
                      setTransitData({
                        ...transitData,
                        destination: place.formatted_address || "",
                        type: 'utilitario'
                      });
                      setSubView('transit_selection');
                    }}
                  />
                </div>
             </div>
             <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
          </div>
        </div>
      </header>

      <main className="p-6 space-y-10 pt-8">
        <section className="relative h-56 rounded-[50px] overflow-hidden shadow-2xl group">
           <img src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=800" className="size-full object-cover group-hover:scale-105 transition-transform duration-[4000ms]" />
           <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent flex flex-col justify-center p-10">
              <span className="bg-primary/90 text-slate-900 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest w-fit mb-4">Novo Serviço</span>
              <h2 className="text-3xl font-black text-white tracking-tighter leading-tight mb-2">Entregas que <br/>chegam <span className="text-primary italic">voando.</span></h2>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Atendimento 24h em toda a cidade</p>
           </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Categorias de Envio</h3>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800 mx-6 opacity-40" />
          </div>

          <div className="grid grid-cols-1 gap-6">
             {categories.map((cat, i) => (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 onClick={() => {
                   setTransitData({...transitData, type: cat.id as any});
                   navigateSubView('transit_selection');
                 }}
                 className="bg-white dark:bg-slate-800 p-6 rounded-[45px] border border-slate-100 dark:border-white/5 shadow-xl flex items-center gap-6 group active:scale-[0.98] transition-all relative overflow-hidden"
               >
                  <div className="size-20 rounded-[28px] flex items-center justify-center shadow-xl group-hover:-rotate-3 transition-transform duration-500" style={{ background: cat.gradient }}>
                     <span className="material-symbols-outlined text-white text-4xl font-black italic">{cat.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight mb-1">{cat.name}</h4>
                    <p className="text-[11px] font-bold text-slate-400 leading-tight mb-2 opacity-80">{cat.desc}</p>
                    <div className="flex items-center gap-4">
                       <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full tracking-wider">{cat.eta}</span>
                       <span className="text-[10px] font-black tracking-tighter text-slate-400">{cat.priceRange}</span>
                    </div>
                  </div>
                  <div className="size-12 rounded-[22px] bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary transition-colors">
                     <span className="material-symbols-outlined font-black group-hover:text-slate-900 transition-colors">add_location_alt</span>
                  </div>
               </motion.div>
             ))}
          </div>
        </section>
      </main>
    </div>
  );

}
