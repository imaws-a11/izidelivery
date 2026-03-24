import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function GenericListView() {
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

  if (!activeService) return null;

  const searchId = (activeService.subType || activeService.type || "").toLowerCase();
  
  const titles: Record<string, any> = {
    pet: { title: "Pet Shops", tagline: "Cuidado & Carinho" },
    beverages: { title: "Bebidas", tagline: "Geladas no Ponto" },
    medicamentos: { title: "Remédios", tagline: "Sua saúde em primeiro lugar" },
    higiene: { title: "Higiene & Cuidados", tagline: "Frescor para o seu dia" },
    dermocosmeticos: { title: "Beleza & Dermos", tagline: "Cuidado com sua pele" },
    vitaminas: { title: "Saúde & Vitaminas", tagline: "Energia e Imunidade" },
    hortifruti: { title: "Hortifruti", tagline: "Feira fresca todo dia" },
    carnes: { title: "Carnes & Açougue", tagline: "Cortes selecionados" },
    padaria: { title: "Padaria", tagline: "Pão quentinho" },
  };

  const headerInfo = titles[searchId] || { title: activeService.name || "Explorar", tagline: "Tudo o que você precisa" };

  const realShops = ESTABLISHMENTS.filter((estab: any) => {
     const type = (estab.type || "").toLowerCase();
     const tag = (estab.tag || "").toLowerCase();
     return type === searchId || estab.category_id === searchId || tag.includes(searchId);
  }).map((estab: any) => ({
    id: estab.id,
    name: estab.name,
    rating: estab.rating || "5.0",
    time: estab.time || "30-50 min",
    freeDelivery: estab.freeDelivery || true,
    fee: estab.freeDelivery ? undefined : "R$ 4,90",
    tag: estab.tag || "Loja Parceira",
    banner: estab.banner || estab.img,
    img: estab.img || estab.banner,
    logo: estab.img,
    type: estab.type,
  }));

  const serviceData = {
    title: headerInfo.title,
    tagline: headerInfo.tagline,
    shops: realShops,
    products: [],
  };

  return (
    <div className="absolute inset-0 z-40 bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 flex flex-col hide-scrollbar overflow-y-auto pb-32">
      <header className="sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-2xl border-b border-white/5 pb-4">
        <div className="flex items-center p-5 pb-2 justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSubView('none')} 
              className="size-11 rounded-2xl bg-white dark:bg-slate-800 shadow-xl border border-white/5 flex items-center justify-center active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none mb-1">{serviceData.title}</h1>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{serviceData.tagline}</p>
            </div>
          </div>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-white/5 flex items-center justify-center group">
            <span className="material-symbols-outlined text-2xl group-hover:text-primary transition-colors">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 shadow-lg">{cart.length}</span>}
          </button>
        </div>
        <div className="px-5 mt-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner group">
            <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none" 
              placeholder={`Buscar em ${serviceData.title}...`} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
        </div>
      </header>

      <main className="flex flex-col gap-12 py-8">
        {/* Section Establishments */}
        {serviceData.shops.length > 0 && (
          <section>
            <div className="px-5 flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Destaques</h2>
                <p className="text-lg font-black tracking-tighter">Melhores Avaliados</p>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary">Ver Todos</button>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 px-5">
              {serviceData.shops.filter((s: any) => 
                s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.tag?.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((shop: any, i: number) => (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  onClick={() => handleShopClick(shop)}
                  className="min-w-[280px] bg-white dark:bg-slate-800 p-5 rounded-[45px] border border-white/5 active:scale-95 transition-all shadow-2xl shadow-slate-200/50 dark:shadow-black/20 group cursor-pointer"
                >
                  <div className="h-40 rounded-[35px] overflow-hidden mb-5 relative shadow-inner">
                    <img src={shop.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl">
                      <span className="material-symbols-outlined text-primary text-sm fill-1">star</span>
                      <span className="text-[10px] font-black text-slate-900">{shop.rating}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white mb-1 group-hover:text-primary transition-colors">{shop.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{shop.time}</span>
                      <span>•</span>
                      <span className={shop.freeDelivery ? "text-emerald-500" : ""}>{shop.freeDelivery ? "Entrega Grátis" : shop.fee}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* Section Products */}
        {serviceData.products.length > 0 && (
          <section className="px-5">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-[11px] uppercase font-black tracking-[0.2em] text-slate-400 mb-1">Para Você</h2>
                <p className="text-lg font-black tracking-tighter">Ofertas do Dia</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5">
              {serviceData.products.filter((p: any) => 
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.desc.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((p: any, i: number) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={i}
                  onClick={() => { handleAddToCart(p); }}
                  className="bg-white dark:bg-slate-800 p-5 rounded-[40px] border border-white/5 flex items-center gap-6 active:scale-[0.98] transition-all group cursor-pointer shadow-xl shadow-slate-100/50 dark:shadow-black/10"
                >
                  <div className="size-24 rounded-[30px] overflow-hidden shrink-0 shadow-lg">
                    <img src={p.img} className="size-full object-cover group-hover:rotate-3 group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-black text-[15px] text-slate-900 dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors">{p.name}</h4>
                    <p className="text-[11px] text-slate-400 font-medium line-clamp-1 mb-3">{p.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-black text-slate-900 dark:text-white">R$ {p.price.toFixed(2).replace('.', ',')}</span>
                      <div className="size-10 rounded-2xl bg-primary flex items-center justify-center text-slate-900 shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined font-black">add</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );

}
