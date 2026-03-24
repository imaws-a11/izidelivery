import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function StoreCatalogView() {
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

  const shop = selectedShop || {
    name: "Loja Parceira",
    rating: "5.0",
    tag: "Categoria",
    priceRange: "$",
    time: "30-60 min",
    fee: "Grátis",
    img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1000",
    categories: [],
  };

  return (
    <div className="absolute inset-0 z-50 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto">
      {/* LUXURY HERO HEADER */}
      <div className="relative w-full h-[320px] shrink-0 overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url('${shop.img}')` }} 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] dark:from-[#0F172A] via-black/20 to-black/40" />
        
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-6 pt-8">
          <button 
            onClick={() => setSubView("none")} 
            className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group"
          >
            <span className="material-symbols-outlined text-xl group-hover:-translate-x-1 transition-transform">arrow_back_ios_new</span>
          </button>
          <div className="flex gap-3">
            <button className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group">
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">search</span>
            </button>
            <button className="flex items-center justify-center size-12 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-2xl shadow-2xl border border-white/30 active:scale-95 transition-all text-white group">
              <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform text-red-400">favorite</span>
            </button>
          </div>
        </div>
      </div>

      {/* STORE MASTER CARD */}
      <div className="relative z-10 -mt-24 px-5 pb-8 shrink-0">
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[48px] p-8 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-15px_rgba(0,0,0,0.6)] border border-white dark:border-slate-800 relative overflow-hidden"
        >
          <div className="absolute -right-10 -top-10 size-40 bg-pink-500/10 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="max-w-[70%]">
                <h1 className="text-3xl font-black tracking-tighter leading-none mb-3 text-slate-900 dark:text-white">
                  {shop.name}
                </h1>
                <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2">
                  <span>{shop.tag}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
                  <span className="text-pink-500">{shop.priceRange}</span>
                </p>
              </div>
              <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-100 rounded-[24px] px-4 py-3 flex flex-col items-center shadow-lg shadow-pink-500/5">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-pink-500 text-[18px] fill-1">star</span>
                  <span className="text-lg font-black text-slate-900 dark:text-white leading-none">{shop.rating}</span>
                </div>
                <span className="text-[9px] font-black uppercase text-pink-500 tracking-widest leading-none">Rating</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl group hover:bg-slate-100 transition-colors">
                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-pink-500 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">schedule</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Tempo</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{shop.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-3xl group hover:bg-slate-100 transition-colors">
                <div className="size-10 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-xl">delivery_dining</span>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Entrega</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white">FREE</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* STICKY CATEGORIES BAR */}
      <div className="sticky top-0 z-30 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-800/50 py-5 mb-8 shrink-0">
        <div className="flex gap-3 overflow-x-auto hide-scrollbar px-5">
          {shop.categories?.map((cat: any) => (
            <button
              key={cat.name}
              onClick={() => {
                setActiveMenuCategory(cat.name);
                const el = document.getElementById(`cat-${cat.name.replace(/\s+/g, "-")}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'center' });
              }}
              className={`whitespace-nowrap px-8 py-3 rounded-[24px] font-black text-[11px] uppercase tracking-widest transition-all border-2 ${
                activeMenuCategory === cat.name
                  ? "bg-slate-900 text-white border-slate-900 shadow-xl dark:bg-primary dark:text-slate-900 dark:border-primary"
                  : "bg-white text-slate-400 border-white hover:border-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-800"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* CATALOG CONTENT GRID */}
      <div className="px-5 pb-48 flex-1 space-y-12">
        {shop.categories?.map((category: any) => (
          <div key={category.name} id={`cat-${category.name.replace(/\s+/g, "-")}`} className="scroll-mt-32">
            <div className="flex items-center justify-between mb-8 px-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter decoration-primary decoration-4 underline-offset-8">
                  {category.name}
                </h2>
                <div className="w-12 h-1.5 bg-primary rounded-full mt-1.5" />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{category.items.length} ITENS</span>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {category.items.map((item: any) => (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -8 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => { handleAddToCart(item, e, item.img || shop.img); }}
                  className="group bg-white dark:bg-slate-900 rounded-[45px] overflow-hidden border border-white dark:border-slate-800 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] relative cursor-pointer"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img src={item.img || shop.img} className="size-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="absolute top-4 right-4 z-10">
                       <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(item, e, item.img || shop.img); }}
                          className="size-11 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-2xl flex items-center justify-center text-slate-900 dark:text-white hover:bg-primary hover:text-white transition-all active:scale-90"
                       >
                         <span className="material-symbols-outlined text-2xl font-black">
                           {getItemCount(item.id) > 0 ? 'add_shopping_cart' : 'add'}
                         </span>
                       </button>
                    </div>
                    
                    {getItemCount(item.id) > 0 && (
                      <div className="absolute top-4 left-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md">
                        {getItemCount(item.id)} NO CARRINHO
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-black text-sm text-slate-900 dark:text-white leading-tight mb-2 group-hover:text-primary transition-colors truncate">
                      {item.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4 line-clamp-1">
                      {item.desc || "Produto Premium"}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
                      <span className="text-lg font-black text-slate-900 dark:text-white">
                        R$ {item.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="material-symbols-outlined text-primary text-xl font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* MASTER CART CTA */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-8 z-50">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-[500px] mx-auto"
          >
            <button
              onClick={() => navigateSubView("cart")}
              className="w-full bg-slate-900 dark:bg-primary h-[80px] rounded-[35px] px-2 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_30px_60px_-15px_rgba(255,193,7,0.4)] transition-all active:scale-[0.98] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              
              <div className="flex items-center gap-4 ml-2">
                <div className="bg-white/10 dark:bg-black/10 text-white dark:text-slate-900 size-14 rounded-[24px] flex items-center justify-center font-black text-xl backdrop-blur-md">
                  {cart.length}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-black text-white dark:text-slate-900 text-sm tracking-[0.2em] uppercase leading-none mb-1">CARRINHO</span>
                  <span className="text-[10px] font-bold text-white/50 dark:text-black/50 uppercase tracking-widest">Finalizar Pedido</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-14 px-8 rounded-[24px] flex items-center justify-center mr-2 shadow-2xl">
                <span className="font-black text-lg tracking-tight">
                  R$ {cart.reduce((a, b) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );

}
