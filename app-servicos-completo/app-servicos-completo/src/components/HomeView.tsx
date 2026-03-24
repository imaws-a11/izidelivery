import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function HomeView() {
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

  // ── Serviços Principais (Entregas) ──
  // icon3d: Google Noto Emoji 3D (512px webp) — mesmo estilo da referência visual
  const N = (code: string) => `https://fonts.gstatic.com/s/e/notoemoji/latest/${code}/512.webp`;
  const deliveryServices = [
    { icon3d: N("1f37d-fe0f"), label: "Food",         type: "restaurant", bg: "#FFF0E6",
      action: undefined },
    { icon3d: N("1f37a"),      label: "Bebidas",       type: "beverages",  bg: "#FFF8E1",
      action: undefined },
    { icon3d: N("1f4e6"),      label: "Envios",        type: undefined,    bg: "#F0EAFF",
      action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("transit_selection"); } },
    { icon3d: N("1f6d2"),      label: "Mercado",       type: "market",     bg: "#E6FAF3",
      action: undefined },
    { icon3d: N("1f48a"),      label: "Farmácia",      type: "pharmacy",   bg: "#E6F0FF",
      action: undefined },
    { icon3d: N("1f43e"),      label: "Petshop",       type: "generic",    bg: "#FFE6F3",
      action: () => { setExploreCategoryState({ id: 'pets', title: 'Pet Shop Premium', tagline: 'Mimo para seu melhor amigo', primaryColor: 'rose-500', icon: 'pets', banner: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200' }); navigateSubView('explore_category'); } },
    { icon3d: N("1f382"),      label: "Doces",         type: "generic",    bg: "#FDE8FF",
      action: () => { setExploreCategoryState({ id: 'sweets', title: 'Doces & Bolos', tagline: 'Momentos mais doces', primaryColor: 'fuchsia-500', icon: 'cake', banner: 'https://images.unsplash.com/photo-1578985542846-399fe5c5f47d?q=80&w=1200' }); navigateSubView('explore_category'); } },
    { icon3d: N("1f490"),      label: "Flores",        type: "generic",    bg: "#FFE8EC",
      action: () => { setExploreCategoryState({ id: 'flowers', title: 'Floricultura', tagline: 'Flores que encantam', primaryColor: 'rose-400', icon: 'local_florist', banner: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?q=80&w=1200' }); navigateSubView('explore_category'); } },
  ];

  // ── Serviços de Mobilidade ──
  const mobilityServices = [
    { icon3d: N("1f3cd-fe0f"), label: "Mototáxi",    bg: "#FFF8E1",
      action: () => { setTransitData({ ...transitData, type: "mototaxi",   scheduled: false }); navigateSubView("transit_selection"); } },
    { icon3d: N("1f697"),      label: "Motorista",   bg: "#F0F4FF",
      action: () => { setTransitData({ ...transitData, type: "carro",      scheduled: false }); navigateSubView("transit_selection"); } },
    { icon3d: N("1f690"),      label: "Van",         bg: "#EEF0FF",
      action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("transit_selection"); } },
    { icon3d: N("1f69a"),      label: "Frete",       bg: "#E6FAFF",
      action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("transit_selection"); } },
  ];

  // Compatibilidade com handleServiceSelection


  // Compatibilidade com handleServiceSelection

  const handleServiceSelection = (cat: any) => {
    if (cat.action) return cat.action();
    if (!cat.type) return;
    setActiveService(cat);
    if (cat.type === "restaurant") navigateSubView("restaurant_list");
    else if (cat.type === "market")    navigateSubView("market_list");
    else if (cat.type === "pharmacy")  navigateSubView("pharmacy_list");
    else if (cat.type === "beverages") navigateSubView("beverages_list");
    else navigateSubView("generic_list");
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-700 bg-background-light dark:bg-background-dark pb-32 overflow-y-auto no-scrollbar h-full">
      {/* HEADER: LUXURY STYLE */}
      <header className="sticky top-0 z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-b border-slate-100/50 dark:border-slate-800/50 pb-4">
        <div className="flex items-center p-5 pb-2 justify-between">
          <div
            className="flex items-center gap-4 flex-1 cursor-pointer group"
            onClick={() => setSubView(subView === "addresses" ? "none" : "addresses")}
          >
            <div className="size-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-700 group-active:scale-95 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-pulse" />
              <span className="material-symbols-outlined text-primary text-2xl fill-1 relative z-10">location_on</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black tracking-[0.25em] text-slate-400 mb-0.5">Entregar em</span>
              <div className="flex items-center gap-1.5 group-hover:text-primary transition-colors">
                <h2 className="text-sm font-black leading-tight dark:text-white max-w-[150px] truncate tracking-tight">
                  {userLocation.loading ? "Buscando satélite..." : userLocation.address}
                </h2>
                <span className={`material-symbols-outlined text-base font-black text-primary transition-all duration-300 ${userLocation.loading ? "animate-spin" : subView === "addresses" ? "rotate-180" : "group-hover:translate-y-0.5"}`}>
                  {userLocation.loading ? "sync" : "expand_more"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => cart.length > 0 && navigateSubView("cart")}
              className="relative size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-lg shadow-slate-200/50 dark:shadow-black/20 border border-slate-50 dark:border-slate-700 active:scale-90 transition-all flex items-center justify-center group"
            >
              <span className="material-symbols-outlined text-2xl text-slate-600 dark:text-slate-300 group-hover:text-primary transition-colors">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-900 animate-bounce-slow shadow-lg">
                  {cart.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setSubView("quest_center")}
              className="size-12 rounded-2xl bg-slate-900 text-primary shadow-lg shadow-primary/10 border border-slate-700 active:scale-90 transition-all flex items-center justify-center group"
            >
              <motion.span 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="material-symbols-outlined text-2xl fill-1"
              >
                military_tech
              </motion.span>
            </button>

            <div
              onClick={() => setTab("profile")}
              className="size-12 rounded-2xl overflow-hidden shadow-lg shadow-slate-200/50 dark:shadow-black/20 border-2 border-white dark:border-slate-800 active:scale-90 transition-all cursor-pointer group relative"
            >
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'default'}`} alt="User" className="size-full bg-slate-100 group-hover:scale-110 transition-transform" />
              {userLevel >= 10 && (
                <div className="absolute top-0 right-0 size-4 bg-primary border-2 border-white dark:border-slate-800 rounded-full flex items-center justify-center -translate-y-1 translate-x-1 shadow-lg shadow-primary/40">
                  <span className="material-symbols-rounded text-[8px] font-black text-slate-900 fill-1">diamond</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-5 mt-2">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 rounded-2xl px-5 h-14 border border-transparent focus-within:border-primary/40 transition-all shadow-inner relative overflow-hidden group">
            <div className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent scale-x-0 group-focus-within:scale-x-100 transition-transform duration-500" />
            <span className="material-symbols-outlined text-slate-400 mr-3 text-2xl">search</span>
            <input
              className="bg-transparent border-none focus:ring-0 w-full text-[15px] placeholder:text-slate-400 font-bold dark:text-white outline-none"
              placeholder="O que você deseja pedir hoje?"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center animate-in fade-in zoom-in">
                <span className="material-symbols-outlined text-sm font-black text-slate-500">close</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* IZI BLACK LUXURY ENTRY POINTS */}
      <div className="px-5 mt-10">
        {isIziBlackMembership ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setShowIziBlackCard(true)}
            className="relative overflow-hidden rounded-[45px] bg-zinc-950 p-10 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.98] transition-all shadow-[0_45px_100px_-20px_rgba(0,0,0,0.8)] border border-yellow-400/10 group"
          >
            {/* Dynamic Aura */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 bg-yellow-400/[0.05] blur-[80px] rounded-full animate-pulse" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full" />
                <div className="size-20 rounded-full bg-zinc-900 border border-yellow-400/30 flex items-center justify-center relative z-10 shadow-inner group-hover:bg-yellow-400 transition-colors">
                  <span className="material-symbols-outlined text-yellow-500 text-4xl font-black fill-1 group-hover:text-black transition-colors">stars</span>
                </div>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <h3 className="text-[14px] font-black text-white uppercase tracking-[0.5em] leading-none mb-1">Membro Elite Black</h3>
                <div className="flex items-center gap-3 py-2 px-5 bg-white/[0.03] rounded-full border border-white/5">
                  <span className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(255,184,0,0.8)]" />
                  <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">Acesso Prioritário Conectado</p>
                </div>
              </div>

              <div className="mt-2 w-full max-w-[140px] h-10 rounded-full bg-yellow-400 flex items-center justify-center shadow-2xl active:scale-95 transition-all">
                 <span className="text-[10px] font-black text-black uppercase tracking-[0.2em]">Painel VIP</span>
              </div>
            </div>

            {/* Stealth Texture Overlays */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { setIziBlackOrigin('home'); setIziBlackStep('info'); setSubView('izi_black_purchase'); }}
            className="relative overflow-hidden rounded-[50px] bg-zinc-950 p-1 border border-white/5 group shadow-2xl"
          >
            <div className="relative rounded-[46px] overflow-hidden bg-gradient-to-br from-zinc-900 to-black p-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/[0.08] blur-[100px] -mr-20 -mt-20 group-hover:bg-yellow-400/20 transition-all duration-700" />
              
              <div className="flex flex-col gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="size-16 rounded-3xl bg-zinc-800/80 backdrop-blur-xl border border-white/5 flex items-center justify-center shadow-2xl">
                    <span className="material-symbols-outlined text-yellow-500 text-4xl font-black fill-1 group-hover:scale-125 transition-transform">bolt</span>
                  </div>
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-yellow-400 uppercase tracking-[0.5em] mb-1">Privilégio</span>
                     <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">IZI BLACK</h3>
                  </div>
                </div>

                <p className="text-zinc-500 text-sm font-bold leading-relaxed max-w-[240px] uppercase tracking-wide">
                  O passe de elite para quem exige <span className="text-white">entrega zero</span> e <span className="text-white">vips flash</span>.
                </p>

                <div className="flex items-center justify-between mt-4">
                  <div className="px-6 py-4 bg-white text-black rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl group-hover:bg-yellow-400 transition-colors">
                    Ativar Convite
                  </div>
                  <div className="flex -space-x-3 pr-2">
                     {[1,2,3].map(i => <div key={i} className="size-9 rounded-full border-4 border-zinc-900 bg-zinc-800 overflow-hidden shadow-2xl">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+10}`} className="size-full" />
                     </div>)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* IZI FLASH — Grid Vitrine Extra Exclusive Check */}
      {isIziBlackMembership && flashOffers.length > 0 && (
        <div className="mt-8 px-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="size-2 bg-rose-500 rounded-full animate-ping" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Izi Flash</h3>
              <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-full uppercase tracking-widest border border-rose-500/20">Ao Vivo</span>
            </div>
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{flashOffers.length} ofertas</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {flashOffers.map((offer: any) => {
              const expiresAt = new Date(offer.expires_at);
              const diffMs = expiresAt.getTime() - Date.now();
              const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
              const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              const timeLabel = diffHrs > 0 ? `${diffHrs}h ${diffMins}m` : `${diffMins}min`;
              const isUrgent = diffHrs < 2;
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileTap={{ scale: 0.97 }}
                  className="bg-white dark:bg-slate-800 rounded-[28px] overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-xl cursor-pointer group"
                  onClick={() => {
                    const shop = ESTABLISHMENTS.find((e: any) => e.id === offer.merchant_id);
                    if (shop) handleShopClick(shop);
                    else showToast("Loja não disponível no momento.");
                  }}
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <img
                      src={offer.product_image || offer.admin_users?.store_logo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      alt={offer.product_name}
                    />
                    <div className="absolute top-2.5 left-2.5 bg-rose-500 text-white text-[10px] font-black px-2.5 py-1 rounded-xl shadow-lg">
                      -{offer.discount_percent}%
                    </div>
                    <div className={`absolute top-2.5 right-2.5 backdrop-blur-md px-2 py-1 rounded-xl border text-[9px] font-black flex items-center gap-1 ${isUrgent ? "bg-rose-500/90 border-rose-400/30 text-white" : "bg-black/60 border-white/10 text-white"}`}>
                      <span className="material-symbols-outlined text-[10px]">timer</span>
                      {timeLabel}
                    </div>
                  </div>
                  <div className="p-3.5">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate mb-0.5">{offer.admin_users?.store_name || "Loja Parceira"}</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white leading-tight truncate">{offer.product_name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-slate-400 line-through">R$ {Number(offer.original_price).toFixed(2).replace(".", ",")}</span>
                      <span className="text-sm font-black text-rose-500">R$ {Number(offer.discounted_price).toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
      <main className="flex flex-col gap-12 pt-6">
        {/* Active Order Widget: Premium Design */}
        {(() => {
          const activeOrder = myOrders.find(o => !["concluido", "cancelado", "agendado"].includes(o.status));
          if (!activeOrder) return null;

          const isCarService = ['carro', 'van', 'utilitario'].includes(activeOrder.service_type);
          const activeOrderIcon = isCarService ? "directions_car" : "moped";

          return (
            <div className="px-4">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => {
                  setSelectedItem(activeOrder);
                  setSubView("active_order");
                }}
                className={`p-6 rounded-[35px] flex items-center gap-5 shadow-2xl cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group ${activeOrder.service_type === 'subscription' ? 'bg-zinc-950 border border-white/5 shadow-black/40' : 'bg-primary text-slate-900 shadow-primary/30'}`}
              >
                <div className={`absolute top-0 right-0 size-32 rounded-full blur-3xl -mr-16 -mt-16 animate-pulse ${activeOrder.service_type === 'subscription' ? 'bg-yellow-400/5' : 'bg-white/20'}`} />
                
                <div className={`size-16 rounded-[22px] flex items-center justify-center backdrop-blur-md relative overflow-hidden shrink-0 border shadow-xl ${activeOrder.service_type === 'subscription' ? 'bg-white/5 border-white/10' : 'bg-white/20 border-white/20'}`}>
                  <div className={`absolute inset-x-0 bottom-0 h-1 animate-progress-fast ${activeOrder.service_type === 'subscription' ? 'bg-yellow-400/40' : 'bg-white/40'}`} />
                  <span className={`material-symbols-outlined text-3xl animate-bounce-slow ${activeOrder.service_type === 'subscription' ? 'text-yellow-400 fill-1' : ''}`}>
                    {activeOrder.service_type === 'subscription' ? "verified_user" : activeOrderIcon}
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest leading-none ${activeOrder.service_type === 'subscription' ? 'text-white/40' : 'text-slate-900/60'}`}>
                      {activeOrder.service_type === 'subscription' ? "Ativação VIP" : (isCarService ? "Acompanhar Viagem" : "Acompanhar Entrega")}
                    </span>
                    <div className={`size-2 rounded-full animate-ping ${activeOrder.service_type === 'subscription' ? 'bg-yellow-400 shadow-[0_0_10px_rgba(255,184,0,0.8)]' : 'bg-red-500'}`} />
                  </div>
                  <h4 className={`font-black text-lg leading-tight tracking-tight ${activeOrder.service_type === 'subscription' ? 'text-white italic' : ''}`}>
                    {activeOrder.service_type === 'subscription' ? (activeOrder.status === 'pendente_pagamento' ? 'Verificando pagamento...' : 'Sincronizando privilégios...') : (isCarService ? "Motorista a caminho" : "Pedido em andamento")}
                  </h4>
                  <p className={`text-[11px] font-bold mt-0.5 ${activeOrder.service_type === 'subscription' ? 'text-zinc-500' : 'text-slate-900/70'}`}>
                    {activeOrder.service_type === 'subscription' ? 'Clique para ver o status da ativação' : 'Clique para ver o mapa em tempo real'}
                  </p>
                </div>

                <div className={`size-10 rounded-full flex items-center justify-center group-hover:translate-x-1 transition-transform ${activeOrder.service_type === 'subscription' ? 'bg-white/5 text-yellow-400' : 'bg-slate-900/10'}`}>
                  <span className="material-symbols-outlined font-black">{activeOrder.service_type === 'subscription' ? 'bolt' : 'map'}</span>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* ═══ SEÇÃO: OFERTAS VIP (Izi Black) ═══ */}
        {isIziBlackMembership && availableCoupons.filter(p => p.is_vip).length > 0 && (
          <section className="px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="material-symbols-outlined text-amber-500 text-lg fill-1">workspace_premium</span>
                </div>
                <div>
                  <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Ofertas VIP</h3>
                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-500">Exclusivo Izi Black</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/20">
                {availableCoupons.filter(p => p.is_vip).length} {availableCoupons.filter(p => p.is_vip).length === 1 ? 'oferta' : 'ofertas'}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3">
              {availableCoupons.filter(p => p.is_vip).map((cpn, i) => (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={cpn.id || i}
                  className="min-w-[310px] h-[175px] rounded-[45px] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group shrink-0 bg-zinc-950 shadow-none"
                >
                  {/* Efeitos de Iluminação Interna (Luxury Glow) */}
                  <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-40 bg-yellow-400/[0.03] blur-[60px] rounded-full" />
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-1.5">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="material-symbols-outlined text-yellow-400 text-[12px] opacity-60">stars</span>
                      <span className="text-yellow-400 font-black text-[8px] uppercase tracking-[0.4em]">
                        {cpn.title || "Membro Izi Black"}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-2">
                      <h4 className="text-5xl font-black text-white tracking-tighter leading-none">
                        {cpn.discount_type === 'percent' ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`}
                      </h4>
                      <span className="text-yellow-400 text-sm font-black italic uppercase tracking-[0.2em]">OFF</span>
                    </div>
                    
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mb-4">
                      {cpn.description || "Benefício Exclusivo"}
                    </p>

                    {cpn.coupon_code ? (
                      <div
                        onClick={() => {
                          navigator.clipboard.writeText(cpn.coupon_code);
                          setCopiedCoupon(cpn.id || cpn.coupon_code);
                          setTimeout(() => setCopiedCoupon(null), 2000);
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer group/copy active:scale-95 transition-all"
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[7px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-1">Código de Resgate</span>
                          <div className="flex items-center gap-2 border border-white/5 bg-white/[0.03] px-5 py-2 rounded-full group-hover/copy:border-yellow-400/30 group-hover/copy:bg-yellow-400/5 transition-all">
                            <span className="text-sm font-black text-yellow-400 tracking-[0.2em] uppercase">{cpn.coupon_code}</span>
                            <span className="material-symbols-outlined text-base text-zinc-600 group-hover/copy:text-yellow-400 transition-colors">
                              {!!copiedCoupon && copiedCoupon === (cpn.id || cpn.coupon_code) ? 'done_all' : 'content_copy'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-yellow-400/5 px-4 py-2 rounded-full border border-yellow-400/10">
                        <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
                        <span className="text-yellow-400 text-[8px] font-black uppercase tracking-[0.2em]">
                          Aplicado Automática
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Feedback Flutuante de Cópia */}
                  <AnimatePresence>
                    {!!copiedCoupon && copiedCoupon === (cpn.id || cpn.coupon_code) && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm"
                      >
                        <div className="flex flex-col items-center gap-2">
                           <div className="size-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                             <span className="material-symbols-outlined text-emerald-400">check_circle</span>
                           </div>
                           <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Código Copiado</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* Mensagem para não-membros */}
            {!isIziBlackMembership && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => { setIziBlackOrigin('home'); setIziBlackStep('info'); setSubView('izi_black_purchase'); }}
                className="mt-2 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all"
              >
                <span className="material-symbols-outlined text-amber-500 fill-1">lock</span>
                <div className="flex-1">
                  <p className="text-[11px] font-black text-slate-900 dark:text-white">Assine o Izi Black para usar cupons VIP</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Toque aqui para conhecer os benefícios</p>
                </div>
                <span className="material-symbols-outlined text-amber-500">arrow_forward</span>
              </motion.div>
            )}
          </section>
        )}

        {/* ═══ SEÇÃO: CUPONS DISPONÍVEIS ═══ */}
        {availableCoupons.length > 0 && (
          <section className="px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">confirmation_number</span>
                <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Cupons Disponíveis</h3>
              </div>
              <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                {availableCoupons.filter(c => !c.is_vip).length} {availableCoupons.filter(c => !c.is_vip).length === 1 ? 'cupom' : 'cupons'}
              </span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
              {availableCoupons.filter(c => !c.is_vip).map((coupon, i) => {
                const isCopied = !!copiedCoupon && copiedCoupon === (coupon.id || coupon.coupon_code);
                const isExpiringSoon = coupon.expires_at && (() => {
                  const diff = new Date(coupon.expires_at).getTime() - Date.now();
                  return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // < 3 days
                })();
                return (
                  <motion.div
                    key={coupon.id || i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="relative min-w-[200px] max-w-[220px] shrink-0"
                  >
                    {/* Coupon card */}
                    <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[24px] overflow-hidden shadow-md">
                      {/* Top color strip */}
                      <div className="h-1.5 w-full bg-gradient-to-r from-primary via-yellow-400 to-primary" />
                      <div className="p-4">
                        {/* Badges */}
                        <div className="flex items-center gap-1.5 mb-3">
                          <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-primary/20">
                            {coupon.discount_type === 'percent' ? `${coupon.discount_value}% OFF` : `R$ ${coupon.discount_value} OFF`}
                          </span>
                          {isExpiringSoon && (
                            <span className="text-[9px] font-black text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg uppercase tracking-widest border border-rose-200 dark:border-rose-500/20">
                              Expira logo
                            </span>
                          )}
                          {coupon.min_order_value > 0 && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                              Mín. R$ {coupon.min_order_value?.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-tight mb-3">
                          {coupon.title}
                        </p>

                        {/* Coupon code + copy button */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.coupon_code).catch(() => {});
                            setCopiedCoupon(coupon.id || coupon.coupon_code);
                            setTimeout(() => setCopiedCoupon(null), 2000);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-2xl border-2 border-dashed transition-all active:scale-95 ${
                            isCopied
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                              : 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                          }`}
                        >
                          <span className={`font-mono font-black text-[12px] tracking-widest ${isCopied ? 'text-emerald-600' : 'text-primary'}`}>
                            {coupon.coupon_code}
                          </span>
                          <span className={`material-symbols-outlined text-sm ${isCopied ? 'text-emerald-500' : 'text-primary'}`}>
                            {isCopied ? 'check_circle' : 'content_copy'}
                          </span>
                        </button>

                        {/* Expiry */}
                        {coupon.expires_at && (
                          <p className="text-[9px] font-bold text-slate-400 mt-2 text-center">
                            Válido até {new Date(coupon.expires_at).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Notch cutouts for coupon effect */}
                    <div className="absolute top-[47px] -left-2 size-4 bg-background-light dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700" />
                    <div className="absolute top-[47px] -right-2 size-4 bg-background-light dark:bg-slate-900 rounded-full border border-slate-100 dark:border-slate-700" />
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* ═══ SEÇÃO: PEÇA & RECEBA ═══ */}
        <section className="px-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Peça & Receba</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Entregas na sua porta em minutos</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {deliveryServices.filter(cat =>
              cat.label.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((cat, i) => (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.04, type: "spring", stiffness: 300 }}
                key={`delivery-${i}`}
                onClick={() => handleServiceSelection(cat)}
                className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-all duration-200 group"
              >
                {/* Ícone 3D com fundo colorido arredondado */}
                <div
                  className="w-full aspect-square rounded-[22px] flex items-center justify-center overflow-hidden shadow-sm group-active:scale-95 transition-transform"
                  style={{ backgroundColor: cat.bg }}
                >
                  <img
                    src={cat.icon3d}
                    alt={cat.label}
                    className="w-[72%] h-[72%] object-contain drop-shadow-md"
                    loading="lazy"
                  />
                </div>
                {/* Label */}
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 text-center leading-tight tracking-tight">
                  {cat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        <section>
          <div className="px-4 flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[15px] font-black tracking-tight text-slate-900 dark:text-white">Mobilidade & Transporte</h3>
              <p className="text-[11px] text-slate-400 font-semibold">Vá para qualquer lugar</p>
            </div>
            <button 
              onClick={() => setIsMobilityExpanded(!isMobilityExpanded)}
              className="text-[10px] font-black uppercase text-primary tracking-widest bg-primary/10 px-3 py-1.5 rounded-full active:scale-95 transition-all"
            >
              {isMobilityExpanded ? "Ver menos" : "Ver todos"}
            </button>
          </div>
          
          <div className={isMobilityExpanded ? "grid grid-cols-4 gap-3 px-4" : "flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-3"}>
            {mobilityServices.filter(svc =>
              svc.label.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((svc, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={`mobility-${i}`}
                onClick={() => svc.action()}
                className={`${isMobilityExpanded
                  ? "flex flex-col items-center gap-2"
                  : "flex flex-col items-center gap-2 min-w-[76px]"
                } cursor-pointer active:scale-90 transition-all duration-200 group`}
              >
                {/* Ícone 3D com fundo colorido arredondado */}
                <div
                  className="w-full aspect-square rounded-[22px] flex items-center justify-center overflow-hidden shadow-sm group-active:scale-95 transition-transform"
                  style={{ backgroundColor: svc.bg }}
                >
                  <img
                    src={svc.icon3d}
                    alt={svc.label}
                    className="w-[72%] h-[72%] object-contain drop-shadow-md"
                    loading="lazy"
                  />
                </div>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-100 text-center leading-tight tracking-tight">
                  {svc.label}
                </span>
              </motion.div>
            ))}
          </div>

          {isMobilityExpanded && transitHistory.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 px-4 space-y-3"
            >
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Para onde você costuma ir?</p>
              <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">
                {transitHistory.map((addr, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      setTransitData({...transitData, destination: addr, type: 'mototaxi'});
                      navigateSubView('transit_selection');
                    }}
                    className="whitespace-nowrap bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-5 py-3 rounded-2xl flex items-center gap-2.5 shadow-sm active:scale-95 transition-all text-[11px] font-bold dark:text-white"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">history</span>
                    {addr}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>

        {/* ═══ ESPAÇO PUBLICITÁRIO PREMIUM ═══ */}
        {(() => {
          const ads = [
            { id: 1, brand: "iFood Business", title: "Anuncie aqui e alcance", highlight: "+50 mil usuários", cta: "Saiba mais", tag: "Tecnologia", img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800", accentColor: "#6366f1", badgeColor: "from-indigo-600 to-purple-600" },
            { id: 2, brand: "Outback Steakhouse", title: "Promoção exclusiva no app", highlight: "Bloomin' Onion GRÁTIS", cta: "Ver oferta", tag: "Gastronomia", img: "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800", accentColor: "#f97316", badgeColor: "from-orange-500 to-red-600" },
            { id: 3, brand: "Nike Store", title: "Novos lançamentos 2026", highlight: "Até 40% OFF", cta: "Comprar agora", tag: "Moda & Lifestyle", img: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800", accentColor: "#10b981", badgeColor: "from-emerald-500 to-teal-600" },
            { id: 4, brand: "Samsung Brasil", title: "Galaxy AI chegou", highlight: "S25 Ultra é aqui", cta: "Explorar", tag: "Tecnologia", img: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?q=80&w=800", accentColor: "#3b82f6", badgeColor: "from-blue-600 to-cyan-500" },
          ];
          const ad = ads[adIndex % ads.length];
          return (
            <div className="px-4">
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 bg-slate-300 dark:bg-slate-600 rounded-full" />
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Publicidade</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {ads.map((_, i) => (
                    <button key={i} onClick={() => setAdIndex(i)} className={`rounded-full transition-all duration-500 ${i === adIndex % ads.length ? "w-5 h-2 bg-primary" : "size-2 bg-slate-200 dark:bg-slate-700"}`} />
                  ))}
                </div>
              </div>
              <motion.div
                key={ad.id}
                initial={{ opacity: 0, scale: 0.97, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative h-[200px] rounded-[40px] overflow-hidden shadow-2xl group cursor-pointer active:scale-[0.98] transition-all border border-white/5"
              >
                <img src={ad.img} alt={ad.brand} className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-[2500ms]" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute top-5 right-5 bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xl">
                  <div className="size-1.5 bg-primary rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">Patrocinado</span>
                </div>
                <div className={`absolute top-5 left-5 bg-gradient-to-r ${ad.badgeColor} px-4 py-1.5 rounded-xl shadow-2xl`}>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white">{ad.tag}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-7 flex items-end justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">{ad.brand}</p>
                    <h3 className="text-white text-base font-black tracking-tight leading-tight mb-0.5">{ad.title}</h3>
                    <p className="font-black text-2xl tracking-tighter leading-none" style={{ color: ad.accentColor }}>{ad.highlight}</p>
                  </div>
                  <div className="ml-4 shrink-0 px-5 py-3 rounded-[18px] font-black text-[11px] uppercase tracking-[0.15em] text-slate-900 shadow-2xl group-hover:scale-105 transition-transform" style={{ backgroundColor: ad.accentColor }}>
                    {ad.cta}
                  </div>
                </div>
              </motion.div>
              <button className="w-full mt-3 py-3 px-5 flex items-center justify-center gap-2.5 rounded-[18px] border border-dashed border-slate-200 dark:border-slate-700 group hover:border-primary/40 transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors text-[18px]">campaign</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300 dark:text-slate-600 group-hover:text-primary transition-colors">Anuncie seu negócio aqui · a partir de R$ 49/dia</span>
              </button>
            </div>
          );
        })()}

        {/* Banner Promo: Stealth Luxury Style - Only for Izi Black Members */}
        {isIziBlackMembership && (
          <div className="px-4">
          <div 
            onClick={() => navigateSubView('exclusive_offer')}
            className="relative h-64 rounded-[50px] overflow-hidden bg-zinc-950 flex flex-col items-center justify-center text-center p-10 group cursor-pointer shadow-none border-none"
          >
            {/* Luxury Ambient Glow */}
            <div className="absolute inset-0 z-0">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-48 bg-yellow-400/[0.04] blur-[80px] rounded-full" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]" />
            </div>

            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2.5">
                <span className="h-px w-8 bg-yellow-400/20" />
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">Oferta Exclusiva</span>
                <span className="h-px w-8 bg-yellow-400/20" />
              </div>

              <div className="flex flex-col items-center">
                <h3 className="text-white text-3xl font-black leading-tight tracking-tighter mb-1">
                  {globalSettings?.flash_offer_title || 'Burgers Gourmet'}
                </h3>
                <div className="flex items-baseline gap-3">
                  <span className="text-yellow-400 text-6xl font-black tracking-tighter tabular-nums text-shadow-glow">
                    {globalSettings?.flash_offer_discount || '50'}%
                  </span>
                  <span className="text-white text-2xl font-black italic uppercase tracking-widest">OFF</span>
                </div>
              </div>

              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] max-w-[240px] leading-relaxed">
                Válido apenas para membros <span className="text-white">Izi Black</span> hoje!
              </p>

              <div className="mt-2 bg-yellow-400 text-black px-8 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.2em] shadow-lg shadow-yellow-400/10 group-hover:scale-105 transition-transform duration-500">
                Resgatar Agora
              </div>
            </div>

            {/* Lightning Icon Accent */}
            <div className="absolute top-8 right-10 opacity-20 group-hover:opacity-100 group-hover:rotate-12 transition-all duration-700">
              <span className="material-symbols-outlined text-yellow-400 text-3xl">bolt</span>
            </div>
            
            {/* Top/Bottom Light Lines */}
            <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/10 to-transparent" />
            <div className="absolute inset-x-12 bottom-0 h-px bg-gradient-to-r from-transparent via-yellow-400/5 to-transparent" />
          </div>
        </div>
      )}

        {/* Establishments Scroller: Premium Cards */}
        <section className="space-y-8 pb-10">
          <div className="px-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">Favoritos da Região</h3>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1 opacity-80">Os melhores de São Paulo</p>
            </div>
            <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-800 shadow-xl flex items-center justify-center group active:scale-90 transition-all">
              <span className="material-symbols-outlined text-2xl text-primary font-black group-hover:rotate-[20deg] transition-transform">explore</span>
            </button>
          </div>
          <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-4 px-4 pb-10">
            {ESTABLISHMENTS.filter((shop: any) => 
              shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              shop.tag.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((shop) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                key={shop.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleShopClick(shop)}
                className="min-w-[300px] bg-white dark:bg-slate-800 p-5 rounded-[50px] shadow-2xl shadow-slate-200/40 dark:shadow-black/40 border border-slate-50 dark:border-slate-800 group cursor-pointer hover:-translate-y-3 transition-all duration-700"
              >
                <div className="relative h-52 rounded-[40px] overflow-hidden mb-6 shadow-2xl">
                  <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]" />
                  <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-5 right-5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-4 py-2 rounded-2xl flex items-center gap-2 shadow-2xl border border-white/10">
                    <span className="material-symbols-outlined text-sm text-primary fill-1">star</span>
                    <span className="text-xs font-black">{shop.rating}</span>
                  </div>
                  <div className="absolute bottom-5 left-5 flex gap-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-white/10 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-lg">{shop.tag}</span>
                  </div>
                </div>
                <div className="px-3 pb-2">
                  <h4 className="font-black text-slate-900 dark:text-white text-lg mb-4 leading-tight tracking-tighter group-hover:text-primary transition-colors">{shop.name}</h4>
                  <div className="flex items-center justify-between border-t border-slate-50 dark:border-slate-700/50 pt-5">
                    <div className="flex items-center gap-5 text-[12px] font-black uppercase tracking-tighter text-slate-400">
                      <span className="flex items-center gap-1.5"><span className="material-symbols-outlined text-base font-black opacity-60">schedule</span>{shop.time}</span>
                      <span className={shop.freeDelivery ? 'text-emerald-500 flex items-center gap-1.5' : 'flex items-center gap-1.5'}>
                        <span className="material-symbols-outlined text-base font-black opacity-60">{shop.freeDelivery ? 'delivery_dining' : 'payments'}</span>
                        {shop.freeDelivery ? 'Grátis' : shop.fee}
                      </span>
                    </div>
                    <div className="size-11 rounded-[18px] bg-slate-50 dark:bg-slate-900 group-hover:bg-primary flex items-center justify-center text-slate-300 group-hover:text-slate-900 transition-all duration-700 shadow-inner group-hover:shadow-lg group-hover:shadow-primary/20">
                      <span className="material-symbols-outlined text-lg font-black group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {searchQuery && ESTABLISHMENTS.filter((s: any) => s.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
              <div className="min-w-[300px] flex flex-col items-center justify-center p-10 bg-slate-100 dark:bg-slate-800/50 rounded-[50px] border border-dashed border-slate-300 dark:border-slate-700">
                <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                <p className="text-[10px] font-black uppercase text-slate-400">Nenhum favorito encontrado</p>
              </div>
            )}
          </div>
        </section>
      </main >
    </div >
  );

}
