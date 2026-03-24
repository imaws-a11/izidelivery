import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ActiveOrderView() {
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

  if (!selectedItem) return null;

  // Componente interno que sincroniza o pedido em tempo real via Supabase
  const OrderSync = ({ orderId, onUpdate }: { orderId: string; onUpdate: (order: any) => void }) => {
    useEffect(() => {
      // Busca estado inicial
      supabase.from("orders_delivery").select("*").eq("id", orderId).single()
        .then(({ data }) => { if (data) onUpdate(data); });

      // Subscreve a mudanças em tempo real
      const channel = supabase
        .channel(`order_sync_${orderId}`)
        .on("postgres_changes", {
          event: "UPDATE",
          schema: "public",
          table: "orders_delivery",
          filter: `id=eq.${orderId}`,
        }, (payload) => {
          if (payload.new) onUpdate(payload.new);
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }, [orderId]);

    return null;
  };

  const statusMap: { [key: string]: number } = {
    novo: 0,
    pendente: 0,
    pendente_pagamento: 0,
    aceito: 1,
    confirmado: 1,
    preparando: 1,
    pronto: 2,
    no_local: 2,
    a_caminho: 3,
    saiu_para_entrega: 3,
    em_rota: 3,
    concluido: 4,
    entregue: 4,
  };

  const currentStep = statusMap[selectedItem.status] ?? 0;
  const isTransit = selectedItem.service_type === 'mototaxi' || selectedItem.service_type === 'carro' || selectedItem.service_type === 'van' || selectedItem.service_type === 'utilitario';

  const getStatusText = () => {
    if (currentStep === 4) return "CONCLUÍDO!";
    if (currentStep === 3) return "A CAMINHO!";
    if (isTransit) {
      if (currentStep === 0) return "SOLICITADO...";
      return "AGUARDANDO...";
    }
    return "PREPARANDO...";
  };

  const deliveryLabels = [
    { label: "Confirmado", time: "Recebido pela loja", icon: "check", step: 0 },
    { label: "Em Preparo", time: "Preparando pedido", icon: "cooking", step: 1 },
    { label: "Pronto", time: "Aguardando coleta", icon: "package_2", step: 2 },
    { label: "Na Rota", time: "A caminho de você", icon: "moped", step: 3 },
  ];

  const mobilityLabels = [
    { label: "Solicitado", time: "Buscando motorista", icon: "hail", step: 0 },
    { label: "Confirmado", time: "Piloto a caminho", icon: "verified_user", step: 1 },
    { label: "No Local", time: "Aguardando embarque", icon: "location_on", step: 2 },
    { label: "Em Viagem", time: "A caminho do destino", icon: (selectedItem.service_type === 'carro' || selectedItem.service_type === 'van' || selectedItem.service_type === 'utilitario') ? "directions_car" : "moped", step: 3 },
  ];

  const labels = isTransit ? mobilityLabels : deliveryLabels;

  // Premium Subscription-only View (Izi Black)
  if (selectedItem.service_type === 'subscription') {
    return (
      <div className="absolute inset-0 z-[100] bg-zinc-950 flex flex-col hide-scrollbar overflow-y-auto antialiased">
        <OrderSync orderId={selectedItem.id} onUpdate={(newOrder) => setSelectedItem(newOrder)} />
        
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/5 via-transparent to-transparent opacity-50" />
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-yellow-400/5 rounded-full blur-[120px] animate-pulse" />
        </div>

        <header className="relative z-50 p-8 flex items-center justify-between">
          <button onClick={() => setSubView("none")} className="size-14 rounded-3xl bg-white/5 backdrop-blur-3xl flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all">
            <span className="material-symbols-outlined font-black text-2xl">close</span>
          </button>
          <div className="bg-white/5 backdrop-blur-3xl px-6 py-3 rounded-full border border-white/10 flex items-center gap-3">
             <div className="size-2 bg-yellow-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(255,184,0,0.5)]" />
             <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Ativação em Progresso</span>
          </div>
        </header>

        <main className="flex-1 relative z-10 px-10 py-12 flex flex-col items-center">
           <div className="relative mb-20">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute inset-[-40px] border border-white/5 rounded-full" />
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="size-48 rounded-[55px] bg-zinc-900 flex items-center justify-center border border-yellow-400/20 shadow-[0_50px_100px_-20px_rgba(255,184,0,0.15)]">
                 <span className="material-symbols-outlined text-7xl text-yellow-400 fill-1">verified_user</span>
              </motion.div>
              <div className="absolute -inset-4 border-2 border-yellow-400/10 rounded-[60px]" />
           </div>

           <div className="text-center space-y-4 mb-20">
              <span className="text-[11px] font-black text-yellow-400 uppercase tracking-[0.5em] opacity-60">Elite Membership Protocol</span>
              <h1 className="text-5xl font-black text-white italic tracking-tighter leading-none">
                {selectedItem.status === 'concluido' ? 'BEM-VINDO AO TOPO' : 'SINCRONIZANDO ACESSO'}
              </h1>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-[280px] mx-auto leading-relaxed">
                 Estamos processando sua credencial VIP na rede Izi Black. Quase tudo pronto.
              </p>
           </div>

           <div className="w-full space-y-8">
              {[
                { label: "Pagamento Recebido", status: "Concluído", icon: "check_circle", active: true },
                { label: "Verificação de Perfil", status: "Em Progresso", icon: "security", active: true },
                { label: "Ativação de Benefícios", status: "Aguardando", icon: "stars", active: false }
              ].map((step, i) => (
                <div key={i} className={`flex items-center gap-6 p-6 bg-zinc-900/40 border border-white/5 rounded-[35px] backdrop-blur-sm ${!step.active ? 'grayscale opacity-40' : ''}`}>
                   <div className={`size-14 rounded-2xl flex items-center justify-center ${step.active ? 'bg-yellow-400/10 text-yellow-400' : 'bg-zinc-800 text-zinc-600'}`}>
                      <span className="material-symbols-outlined font-black">{step.icon}</span>
                   </div>
                   <div className="flex-1">
                      <p className="text-white font-black text-sm italic uppercase tracking-wider">{step.label}</p>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${step.active ? 'text-yellow-400' : 'text-zinc-500'}`}>{step.status}</p>
                   </div>
                </div>
              ))}
           </div>
        </main>

        <footer className="p-10 pb-16">
           <button onClick={() => setSubView("none")} className="w-full h-20 bg-white text-black font-black rounded-[35px] uppercase tracking-[0.3em] text-xs shadow-[0_30px_60px_-15px_rgba(255,255,255,0.1)] active:scale-95 transition-all">
              Explorar Benefícios Elite
           </button>
        </footer>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col hide-scrollbar overflow-hidden antialiased">
      {/* Black Box Telemetria Overlay */}
      <div className="absolute top-24 left-6 z-20 space-y-3">
         <motion.div 
           initial={{ x: -50, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4"
         >
            <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
               <span className="material-symbols-outlined text-primary text-xl">speed</span>
            </div>
            <div>
               <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Velocidade Atual</p>
               <p className="text-sm font-black text-white italic">42 KM/H</p>
            </div>
         </motion.div>
         <motion.div 
           initial={{ x: -50, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ delay: 0.1 }}
           className="bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-4"
         >
            <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
               <span className="material-symbols-outlined text-primary text-xl">timer</span>
            </div>
            <div>
               <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Tempo Estimado</p>
               <p className="text-sm font-black text-white italic">08 MIN</p>
            </div>
         </motion.div>
      </div>

      {/* Floating Chat Bubble */}
      <div className="absolute top-1/2 right-6 translate-y-12 z-20">
         <motion.div 
           initial={{ scale: 0 }}
           animate={{ scale: 1 }}
           whileTap={{ scale: 0.9 }}
           className="size-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-2xl flex items-center justify-center border-4 border-slate-950/20 cursor-pointer"
           onClick={() => setSubView("order_chat")}
         >
            <span className="material-symbols-outlined font-black text-2xl">chat</span>
         </motion.div>
      </div>

      <div className="absolute top-1/2 right-6 -translate-y-6 z-20">
         <motion.div 
           animate={{ y: [0, -10, 0] }}
           transition={{ duration: 3, repeat: Infinity }}
           className="size-14 rounded-2xl bg-primary text-slate-900 shadow-2xl shadow-primary/30 flex items-center justify-center border-4 border-slate-950/20 active:scale-90 transition-all cursor-pointer"
           onClick={() => setIsAIOpen(true)}
         >
            <span className="material-symbols-outlined font-black text-2xl fill-1">smart_toy</span>
         </motion.div>
      </div>

      <OrderSync
        orderId={selectedItem.id}
        onUpdate={(newOrder) => setSelectedItem(newOrder)}
      />

      {/* Real-time Map Background */}
      <div className="absolute inset-0 z-0">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={driverPos}
            zoom={16}
            options={{
              disableDefaultUI: true,
              styles: [
                { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
                { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
                { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
                { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e9e9e9" }] }
              ]
            }}
          >
            {/* Driver/Courier Marker */}
            <Marker
              position={driverPos}
              icon={{
                url: "https://cdn-icons-png.flaticon.com/64/1042/1042261.png",
                scaledSize: new google.maps.Size(50, 50),
                anchor: new google.maps.Point(25, 25)
              }}
            />
            {/* Destination Marker */}
            <Marker
              position={{ lat: driverPos.lat - 0.002, lng: driverPos.lng + 0.002 }}
              icon={{
                url: "https://cdn-icons-png.flaticon.com/64/1673/1673188.png",
                scaledSize: new google.maps.Size(40, 40)
              }}
            />
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
            <span className="material-symbols-outlined text-slate-400 text-5xl">location_searching</span>
          </div>
        )}
        {/* Top Gradient Overlay */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white/80 dark:from-slate-950/80 to-transparent z-10" />
      </div>

      {/* Floating Top Header */}
      <header className="relative z-50 p-6 flex items-center justify-between">
        <button
          onClick={() => setSubView("none")}
          className="size-14 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl flex items-center justify-center text-slate-900 dark:text-white border border-white/20 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined font-black text-2xl">arrow_back</span>
        </button>

        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl px-6 py-3 rounded-full shadow-2xl border border-white/20 flex items-center gap-3">
           <div className="size-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
           <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Acompanhamento Ativo</span>
        </div>

        <button 
          onClick={() => setSubView('order_support')}
          className="size-14 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl shadow-2xl flex items-center justify-center text-slate-900 dark:text-white border border-white/20 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined font-black text-2xl">support_agent</span>
        </button>
      </header>

      {/* Premium Draggable Bottom Sheet */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 500 }}
        dragElastic={0.15}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        className="mt-auto relative z-[60]"
      >
        <div className="bg-white dark:bg-slate-900 rounded-t-[60px] p-8 shadow-[0_-30px_100px_rgba(0,0,0,0.1)] dark:shadow-[0_-30px_100px_rgba(0,0,0,0.4)] border-t border-white/5 pb-24 max-h-[90vh] overflow-y-auto no-scrollbar">
          {/* Drag Handle */}
          <div className="w-20 h-2 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mb-10 opacity-50 shrink-0" />

          {/* Status Section */}
          <div className="flex items-center justify-between mb-10">
            <div className="max-w-[70%]">
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Status do Pedido</span>
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none italic mb-2">
                {getStatusText()}
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.15em] leading-relaxed">
                 Previsão de <span className="text-primary font-black">10-15 Min</span>
              </p>
            </div>
            <div className="size-24 rounded-[35px] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 animate-ping opacity-20" />
              <span className="material-symbols-outlined text-5xl text-slate-900 font-black relative z-10 transform group-hover:scale-110 transition-transform">
                {['carro', 'van', 'utilitario'].includes(selectedItem.service_type) ? "directions_car" : "moped"}
              </span>
            </div>
          </div>

          {/* Entity/Driver Card */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[45px] border border-slate-100 dark:border-slate-800 flex items-center gap-6 mb-10 group shadow-inner">
            <div className="size-20 rounded-[28px] bg-white dark:bg-slate-800 p-1.5 shadow-xl border border-slate-100 dark:border-slate-700 shrink-0">
              <img
                src={isTransit ? `https://api.dicebear.com/7.x/avataaars/svg?seed=driver-${selectedItem.id}` : (selectedShop?.img || "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200")}
                className="w-full h-full object-cover rounded-[20px] bg-slate-100 dark:bg-slate-900"
                alt="Avatar"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-black text-slate-900 dark:text-white text-xl leading-tight mb-2 truncate group-hover:text-primary transition-colors">
                {isTransit ? "Fernando Henrique" : selectedShop?.name || "Premium Store"}
              </h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/5">
                  <span className="material-symbols-outlined text-xs fill-1">star</span>
                  <span className="text-[10px] font-black ml-1">4.9</span>
                </div>
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest truncate">
                  {isTransit ? "Honda CB 500 • ABC-1234" : "Entrega Prioritária"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.href = `https://wa.me/${phone.replace(/\D/g, '')}`}
                className="size-14 rounded-2xl bg-primary text-slate-900 flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined font-black text-2xl">chat</span>
              </button>
              <button
                onClick={() => window.location.href = `tel:${phone.replace(/\D/g, '')}`}
                className="size-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-white shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined font-black text-2xl">call</span>
              </button>
            </div>
          </div>

          {/* Tracking Dynamic Status List */}
          <div className="space-y-6 mb-12 px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-8">Fluxo de Entrega</h3>
            {labels.map((item, i) => (
              <div key={i} className="flex gap-6 relative">
                {i !== labels.length - 1 && (
                  <div className={`absolute left-5 top-10 bottom-[-24px] w-1 rounded-full ${currentStep > item.step ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'} transition-colors duration-700`} />
                )}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className={`size-11 rounded-2xl flex items-center justify-center relative z-10 transition-all duration-700 shadow-2xl ${currentStep >= item.step ? 'bg-primary text-slate-900 border-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-transparent'}`}
                >
                  <span className="material-symbols-outlined text-lg font-black">{currentStep > item.step ? 'check' : item.icon}</span>
                </motion.div>
                <div className="flex-1 pt-1.5">
                  <p className={`text-sm font-black tracking-tight transition-colors duration-700 ${currentStep >= item.step ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                    {item.label}
                  </p>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 opacity-70 ${currentStep === item.step ? 'text-primary' : 'text-slate-400'}`}>
                    {currentStep === item.step ? "Processando..." : item.time}
                  </p>
                </div>
                {currentStep === item.step && (
                   <div className="size-3 bg-primary rounded-full animate-ping mt-4" />
                )}
              </div>
            ))}
          </div>

          {/* Items Summary - Luxury List */}
          {!isTransit && (
            <div className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Resumo do Pedido</h3>
                <button onClick={() => showToast("Recibo Digital em breve")} className="text-primary font-black uppercase text-[9px] border border-primary/20 px-3 py-1 rounded-full hover:bg-primary/10 transition-colors">Ver Recibo</button>
              </div>
              <div className="space-y-3">
                 {/* Fallback to mock items if detailed data isn't in selectedItem */}
                 {(selectedItem.items || [
                   { name: "Premium Artisan Burger", qty: 1, price: 34.90 },
                   { name: "French Fries Special", qty: 1, price: 15.00 },
                   { name: "Natural Orange Juice", qty: 2, price: 18.00 }
                 ]).map((item: any, idx: number) => (
                   <div key={idx} className="flex items-center justify-between p-5 bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700/50 shadow-sm">
                      <div className="flex items-center gap-4">
                         <div className="size-10 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white flex items-center justify-center font-black text-xs">{item.qty}x</div>
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.name}</span>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Complemento Padrão</p>
                         </div>
                      </div>
                      <span className="text-sm font-black text-slate-900 dark:text-white tracking-tighter">R$ {(item?.price || 0).toFixed(2).replace(".", ",")}</span>
                   </div>
                 ))}
              </div>
            </div>
          )}

          {/* Address & Payment Summary - Luxury Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-12">
            <div className="p-7 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Endereço de Entrega</p>
              </div>
              <p className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                {selectedItem.delivery_address || selectedItem.dropoff_address || "Endereço Cadastrado"}
              </p>
            </div>
            <div className="p-7 bg-slate-50 dark:bg-slate-800/30 rounded-[40px] border border-slate-100 dark:border-slate-800 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-xl">payments</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Forma de Pagamento</p>
              </div>
              <div className="flex items-center justify-between">
                 <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {selectedItem.payment_method || "Crédito"}
                </p>
                <span className="text-xs font-black text-primary">R$ {selectedItem.total_price?.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </div>

          {/* Cancel Button - Only for Pending Orders */}
          {['novo', 'pendente', 'pendente_pagamento'].includes(selectedItem.status) && (
            <div className="mt-8 px-2">
              <button
                onClick={() => handleCancelOrder(selectedItem.id)}
                className="w-full py-6 rounded-[35px] border-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 font-black uppercase text-[11px] tracking-[0.25em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
              >
                <span className="material-symbols-outlined text-xl group-hover:rotate-12 transition-transform">cancel</span>
                Cancelar Pedido
              </button>
              <p className="text-[9px] text-slate-400 font-bold uppercase text-center mt-4 tracking-widest opacity-60">
                O cancelamento só é permitido antes da confirmação do estabelecimento.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );

}
