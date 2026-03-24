import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function LoginView() {
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

return (
  <div className="h-[100dvh] w-full flex flex-col p-8 bg-background-dark relative overflow-hidden">
    {/* Background Decor */}
    <div className="absolute top-0 right-0 w-full h-96 bg-gradient-to-b from-primary/10 to-transparent -z-10"></div>
    <div className="absolute top-[-5%] left-[-10%] w-64 h-64 bg-primary/5 rounded-full blur-[80px]"></div>



    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
    >
      <h2 className="text-4xl font-black text-white tracking-tighter mb-2 italic">
        {authMode === 'login' ? (
          <>BEM-<span className="text-primary not-italic">VINDO.</span></>
        ) : (
          <>CRIAR <span className="text-primary not-italic">CONTA.</span></>
        )}
      </h2>
      <p className="text-slate-400 font-bold mb-8 text-xs uppercase tracking-[0.2em] opacity-60">
        {authMode === 'login' ? 'Acesse sua conta premium' : 'Registre-se em segundos'}
      </p>
    </motion.div>

    <div className="space-y-5 flex-1 overflow-y-auto">
      {authMode === 'register' && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
              Seu Nome Completo
            </label>
            <div className="relative group">
              <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                badge
              </span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
                placeholder="Ex: Maria Silva"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
              Telefone / WhatsApp
            </label>
            <div className="relative group">
              <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
                call
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
                placeholder="(11) 90000-0000"
              />
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
          E-mail
        </label>
        <div className="relative group">
          <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
            alternate_email
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
            placeholder="seu@email.com"
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-6">
          Senha {authMode === 'register' && '(mín. 6 caracteres)'}
        </label>
        <div className="relative group">
          <span className="material-symbols-rounded absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary transition-colors">
            lock_open
          </span>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-14 pr-12 py-5 bg-white/5 border border-white/10 rounded-[32px] focus:bg-white/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 outline-none font-bold text-white placeholder:text-slate-600 transition-all"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
          >
            <span className="material-symbols-rounded">
              {showPassword ? "visibility_off" : "visibility"}
            </span>
          </button>
        </div>
      </div>

      <div className="flex items-center ml-6 mt-1 mb-2">
        <button
          onClick={() => setRememberMe(!rememberMe)}
          className="flex items-center gap-2 group"
        >
          <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${rememberMe ? 'bg-primary border-primary' : 'border-white/20 bg-white/5'}`}>
            {rememberMe && <span className="material-symbols-rounded text-slate-900 text-[14px] font-black">check</span>}
          </div>
          <span className="text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors uppercase tracking-widest">
            Lembrar meus dados
          </span>
        </button>
      </div>

      {errorMsg && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-red-400 text-[11px] font-black uppercase tracking-widest text-center bg-red-500/10 border border-red-500/20 p-4 rounded-3xl"
        >
          {errorMsg}
        </motion.div>
      )}
    </div>

    <div className="pb-4 pt-6 space-y-4">
      <button
        onClick={handleAuth}
        disabled={isLoading}
        className="w-full bg-primary text-slate-900 font-black text-xl py-5 rounded-[32px] shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-70 flex justify-center items-center gap-3"
      >
        {isLoading ? (
          <span className="material-symbols-rounded animate-spin">sync</span>
        ) : authMode === 'login' ? (
          <>
            CONECTAR
            <span className="material-symbols-rounded font-black">arrow_forward</span>
          </>
        ) : (
          <>
            CRIAR CONTA
            <span className="material-symbols-rounded font-black">person_add</span>
          </>
        )}
      </button>

      <button
        onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setErrorMsg(''); }}
        className="w-full py-4 text-slate-400 text-xs font-black uppercase tracking-[0.15em] hover:text-white transition-colors"
      >
        {authMode === 'login' ? 'Não tem conta? Cadastre-se grátis' : 'Já tem conta? Faça login'}
      </button>
    </div>
  </div>
  );

  const handleShopClick = async (shop: any) => {
  // Navigate to a temporary loading view or just the menu immediately and show loading
  const serviceType = activeService?.type || "restaurant";
  
  // Choose view based on service type
  if (serviceType === "restaurant" || shop.type === 'restaurant') {
    setSubView("restaurant_menu");
  } else {
    setSubView("store_catalog");
  }

  // Fetch products for this shop (merchant)
  const { data: productsData, error } = await supabase
    .from('products_delivery')
    .select('*')
    .eq('merchant_id', shop.id)
    .eq('is_available', true);

  if (error) {
  }

  const productsList = productsData || [];
  
  // Group products by category
  const categoriesMap: Record<string, any[]> = {};
  productsList.forEach((p: any) => {
    const cat = p.category || "Destaques";
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push({
      id: p.id,
      name: p.name,
      desc: p.description,
      price: Number(p.price),
      img: p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=300",
      original: p 
    });
  });

  const categoriesArray = Object.keys(categoriesMap).map(catName => ({
    name: catName,
    items: categoriesMap[catName]
  }));

  if (categoriesArray.length === 0) {
    categoriesArray.push({
      name: "Sem produtos",
      items: []
    });
  }

  let categorizedShop = { ...shop, categories: categoriesArray };

  setSelectedShop(categorizedShop);
  setActiveMenuCategory(categoriesArray[0]?.name || "Destaques");
  };

  );
}
