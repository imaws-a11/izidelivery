import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function RestaurantListView() {
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

  const foodCategories = [
    { id: "all", name: "Restaurantes", icon: "restaurant", gradient: "linear-gradient(135deg, #f59e0b, #eab308)" },
    { id: "daily", name: "Cardápio do Dia", icon: "today", gradient: "linear-gradient(135deg, #ec4899, #db2777)" },
    { id: "burgers", name: "Burgers", icon: "lunch_dining", gradient: "linear-gradient(135deg, #f97316, #ef4444)" },
    { id: "pizza", name: "Pizza", icon: "local_pizza", gradient: "linear-gradient(135deg, #10b981, #0d9488)" },
    { id: "acai", name: "Açaí", icon: "grass", gradient: "linear-gradient(135deg, #8b5cf6, #d946ef)" },
    { id: "japones", name: "Japonesa", icon: "set_meal", gradient: "linear-gradient(135deg, #3b82f6, #06b6d4)" },
    { id: "brasileira", name: "Brasileira", icon: "dinner_dining", gradient: "linear-gradient(135deg, #22c55e, #15803d)" },
  ];



  const mostOrderedItems: any[] = [];

  return (
    <div className="absolute inset-0 z-40 bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-40">
      <header className="sticky top-0 z-50 bg-[#F8FAFC]/80 dark:bg-[#0F172A]/80 backdrop-blur-3xl border-b border-slate-200/50 dark:border-slate-800/50 pb-6 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.05)]">
        <div className="flex items-center p-6 pb-2 justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setSubView("none")} 
              className="size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center active:scale-90 transition-all group"
            >
              <span className="material-symbols-outlined font-black group-hover:-translate-x-1 transition-transform">arrow_back</span>
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 text-slate-900 dark:text-white">Restaurantes</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Descubra novos sabores</p>
            </div>
          </div>
          <button 
            onClick={() => cart.length > 0 && navigateSubView("cart")} 
            className="relative size-12 rounded-[22px] bg-white dark:bg-slate-800 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center group active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-xl animate-bounce-subtle">
                {cart.length}
              </span>
            )}
          </button>
        </div>
        
        <div className="px-6 mt-4">
          <div className="flex items-center bg-white dark:bg-slate-800/80 rounded-[28px] px-6 h-16 border border-slate-100 dark:border-white/5 focus-within:border-primary/40 transition-all shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative group overflow-hidden">
             <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity" />
             <span className="material-symbols-outlined text-slate-400 mr-4 text-2xl relative z-10">search</span>
             <input 
              className="bg-transparent border-none focus:ring-0 w-full text-base placeholder:text-slate-400 font-bold dark:text-white outline-none relative z-10" 
              placeholder="Qual sua vontade hoje?" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
             />
             {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")} 
                className="size-10 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-all relative z-10"
              >
                <span className="material-symbols-outlined text-lg font-black">close</span>
              </button>
             )}
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-12 pt-10 px-6">
        {/* VIP OFFERS SECTION */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
             <div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Ofertas VIP</h3>
              <div className="w-10 h-1.5 bg-primary rounded-full mt-1.5" />
             </div>
             <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Ver todas</button>
          </div>
          
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
            {availableCoupons.filter(p => p.is_vip).length > 0 ? (
              availableCoupons.filter(p => p.is_vip).map((cpn, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: 50 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ delay: i * 0.1 }} 
                  key={cpn.id || i} 
                  className="min-w-[320px] h-[180px] rounded-[48px] p-8 flex flex-col justify-between relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl"
                >
                  {/* Glassmorphism Background with Image */}
                  <div className="absolute inset-0 z-0">
                    <img src={cpn.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800"} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${['#f97316', '#10b981', '#8b5cf6', '#ec4899'][i % 4]}, ${['#f97316', '#10b981', '#8b5cf6', '#ec4899'][i % 4]}CC)` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  </div>

                  <div className="relative z-10">
                    <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4 inline-block">
                      {cpn.title || "Oferta Especial"}
                    </span>
                    <h4 className="text-4xl font-black tracking-tighter text-white leading-none">
                      {cpn.discount_type === 'percent' ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`} <span className="text-xl opacity-80 uppercase tracking-widest">OFF</span>
                    </h4>
                  </div>

                  <div className="relative z-10 flex items-center justify-between">
                    {cpn.coupon_code ? (
                      <div 
                        onClick={() => {
                          navigator.clipboard.writeText(cpn.coupon_code);
                          setCopiedCoupon(cpn.id || cpn.coupon_code);
                          setTimeout(() => setCopiedCoupon(null), 2000);
                        }}
                        className="bg-white text-slate-900 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl cursor-pointer active:scale-95 transition-all"
                      >
                         <span className="text-sm font-black tracking-widest uppercase">{cpn.coupon_code}</span>
                         <span className="material-symbols-outlined text-lg">{!!copiedCoupon && copiedCoupon === (cpn.id || cpn.coupon_code) ? 'check' : 'content_copy'}</span>
                      </div>
                    ) : (
                      <div className="text-white/80 text-[10px] font-bold uppercase tracking-widest bg-black/20 backdrop-blur px-4 py-2 rounded-xl">
                        Desconto Automático
                      </div>
                    )}
                    <div className="size-12 rounded-full border-2 border-white/30 flex items-center justify-center text-white backdrop-blur-md group-hover:bg-white group-hover:text-slate-900 transition-all">
                       <span className="material-symbols-outlined text-xl font-black">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              /* FALLBACK MARKETING AREA */
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full min-h-[180px] rounded-[48px] p-8 flex items-center justify-between relative overflow-hidden group border border-white dark:border-white/5 shadow-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
              >
                <div className="absolute inset-0 opacity-40">
                  <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800" className="size-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/40 to-transparent" />
                </div>
                
                <div className="relative z-10 max-w-[60%]">
                  <span className="text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-3 block">Membro Premium</span>
                  <h4 className="text-3xl font-black text-white tracking-tighter leading-tight mb-4">
                    Torne-se <span className="text-primary">VIP</span> e economize em cada pedido!
                  </h4>
                  <button className="bg-primary text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all">
                    Saber Mais
                  </button>
                </div>
                
                <div className="relative z-10 hidden sm:block">
                  <div className="size-24 rounded-full bg-primary/20 backdrop-blur-3xl flex items-center justify-center border border-primary/30">
                    <span className="material-symbols-outlined text-primary text-5xl font-black animate-pulse">workspace_premium</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </section>

        {/* QUICK CATEGORIES */}
        <section>
          <div className="grid grid-cols-3 gap-6">
            {foodCategories.map((cat, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.05 }} 
                key={cat.id} 
                onClick={() => { 
                  if (cat.id === "all") navigateSubView("explore_restaurants");
                  else if (cat.id === "daily") navigateSubView("daily_menus");
                  else if (cat.id === "burgers") navigateSubView("burger_list"); 
                  else if (cat.id === "pizza") navigateSubView("pizza_list"); 
                  else if (cat.id === "acai") navigateSubView("acai_list"); 
                  else if (cat.id === "japones") navigateSubView("japonesa_list"); 
                  else if (cat.id === "brasileira") navigateSubView("brasileira_list"); 
                }} 
                className="flex flex-col items-center gap-3 cursor-pointer group active:scale-95 transition-all"
              >
                <div 
                  className="w-full aspect-square rounded-[35px] flex items-center justify-center shadow-2xl relative overflow-hidden transition-all group-hover:rotate-3" 
                  style={{ background: cat.gradient }}
                >
                  {/* Glass Decoration */}
                  <div className="absolute -top-1/2 -right-1/2 size-full bg-white/20 rounded-full blur-[40px]" />
                  <span className="material-symbols-outlined text-white text-[42px] font-black drop-shadow-2xl relative z-10 transform group-hover:scale-110 transition-transform">{cat.icon}</span>
                </div>
                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{cat.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* MOST ORDERED SECTION */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Mais Pedidos</h3>
              <div className="w-10 h-1.5 bg-primary rounded-full mt-1.5" />
            </div>
            <div className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-white/5 flex items-center justify-center text-primary animate-pulse-gentle">
              <span className="material-symbols-outlined text-xl font-black">trending_up</span>
            </div>
          </div>

          <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-6 mt-2">
            {mostOrderedItems.map((item, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} 
                whileInView={{ opacity: 1, scale: 1 }} 
                key={item.id} 
                className="min-w-[300px] bg-white dark:bg-slate-900 rounded-[50px] p-6 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.4)] border border-slate-100 dark:border-white/5 group cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary text-[40px] opacity-20">verified</span>
                </div>

                <div className="relative h-44 rounded-[38px] overflow-hidden mb-6 shadow-2xl">
                  <img src={item.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="absolute top-4 left-4 size-10 bg-primary rounded-2xl flex items-center justify-center font-black text-slate-900 shadow-2xl border border-white/20">
                    {i + 1}
                  </div>
                </div>

                <div className="px-2">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2 truncate group-hover:text-primary transition-colors">{item.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-primary/70">{item.store}</span>
                      </div>
                    </div>
                    <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm">
                      <span className="material-symbols-outlined text-[14px] text-primary fill-1">star</span>
                      <span className="text-xs font-black text-primary">{item.rating}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                    <span className="text-xl font-black text-slate-900 dark:text-white">R$ {item.price.toFixed(2).replace('.', ',')}</span>
                    <div className="size-11 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-2xl group-hover:bg-primary group-hover:text-slate-900 transition-all">
                      <span className="material-symbols-outlined font-black">add</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ALL RESTAURANTS SECTION */}
        <section className="space-y-8">
          <div className="flex items-center justify-between mb-4 px-2">
            <div>
              <h3 className="text-2xl font-black tracking-tighter text-slate-900 dark:text-white">Mais Proximos</h3>
              <div className="w-10 h-1.5 bg-primary rounded-full mt-1.5" />
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              Filtrar <span className="material-symbols-outlined text-sm">filter_list</span>
            </button>
          </div>

          <div className="space-y-8 pb-10">
            {ESTABLISHMENTS.filter(shop => 
              shop.type === 'restaurant' &&
              shop.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((shop) => (
              <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                key={shop.id} 
                onClick={() => handleShopClick({ ...shop, type: "restaurant" })} 
                className="bg-white dark:bg-slate-900 p-5 rounded-[50px] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.4)] border border-white dark:border-white/5 group active:scale-[0.98] transition-all flex flex-col gap-6"
              >
                <div className="relative h-60 rounded-[42px] overflow-hidden shadow-2xl">
                  <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute top-5 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/20 scale-100 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[16px] text-primary fill-1">star</span>
                    <span className="text-[13px] font-black">{shop.rating}</span>
                  </div>

                  {shop.freeDelivery && (
                     <div className="absolute bottom-5 left-5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.1em] px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 border border-white/20 translate-y-0 group-hover:-translate-y-2 transition-transform">
                       <span className="material-symbols-outlined text-[16px] animate-pulse">check_circle</span>
                       Entrega Grátis
                     </div>
                  )}
                </div>

                <div className="px-4 pb-4 flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-black text-slate-900 dark:text-white text-xl tracking-tighter mb-2 group-hover:text-primary transition-colors leading-none">
                      {shop.name}
                    </h4>
                    <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                      <span className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl">
                        <span className="material-symbols-outlined text-sm text-primary opacity-60">local_fire_department</span>
                        {shop.tag}
                      </span>
                      <span className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl">
                        <span className="material-symbols-outlined text-sm text-primary opacity-60">schedule</span>
                        {shop.time}
                      </span>
                    </div>
                  </div>
                  <div className="size-14 rounded-[22px] bg-slate-50 dark:bg-slate-800/80 group-hover:bg-primary flex items-center justify-center text-slate-400 group-hover:text-slate-900 transition-all duration-500 shadow-inner group-hover:shadow-[0_10px_20px_-5px_rgba(255,193,7,0.5)]">
                    <span className="material-symbols-outlined text-2xl font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );

}
