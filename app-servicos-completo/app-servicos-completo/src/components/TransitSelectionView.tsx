import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function TransitSelectionView() {
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

  const isShippingView = transitData.type === 'utilitario' || transitData.type === 'van';

  return (
    <div className="absolute inset-0 z-[110] bg-slate-50 dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500">
      <header className="px-6 py-8 flex items-center justify-between gap-4">
        <button
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
        >
          <span className="material-symbols-outlined font-black">arrow_back</span>
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
            {isShippingView ? "Detalhes do Envio" : "Escolha sua Viagem"}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            {isShippingView ? "Logística Digital" : "Transporte Executivo"}
          </p>
        </div>
      </header>

    <div className="px-6 space-y-8 flex-1 pb-40">
      {/* Schedule Option: Segmented Control */}
      <div className="flex bg-white dark:bg-slate-800 p-2 rounded-[28px] border border-slate-100 dark:border-slate-700 shadow-xl">
        <button 
          onClick={() => setTransitData({...transitData, scheduled: false})}
          className={`flex-1 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${!transitData.scheduled ? 'bg-primary text-slate-900 shadow-lg' : 'text-slate-400'}`}
        >
          Agora
        </button>
        <button 
          onClick={() => setTransitData({...transitData, scheduled: true})}
          className={`flex-1 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${transitData.scheduled ? 'bg-primary text-slate-900 shadow-lg' : 'text-slate-400'}`}
        >
          Agendar
        </button>
      </div>

      {transitData.scheduled && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 p-8 rounded-[45px] border border-slate-100 dark:border-slate-700 shadow-2xl space-y-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 size-40 bg-primary/5 rounded-full blur-[60px] -mr-20 -mt-20" />
          
          <div className="flex items-center justify-between mb-2">
             <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.25em]">Detalhes do Agendamento</h4>
             <span className="size-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50" />
          </div>

          <div className="flex items-center gap-6 relative z-10 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[30px] border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-colors">
            <div className="size-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-2xl font-black italic">event</span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Data Desejada</p>
              <input 
                type="date" 
                value={transitData.scheduledDate}
                min={new Date(Date.now() + 30*60*1000).toISOString().split('T')[0]}
                onChange={(e) => setTransitData({...transitData, scheduledDate: e.target.value})}
                className="bg-transparent border-none p-0 text-lg font-black w-full focus:ring-0 dark:text-white tracking-tighter"
              />
            </div>
          </div>

          <div className="flex items-center gap-6 relative z-10 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-[30px] border border-slate-100 dark:border-white/5 group hover:border-primary/30 transition-colors">
            <div className="size-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-primary text-2xl font-black italic">alarm</span>
            </div>
            <div className="flex-1">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1.5 ml-1">Horário Previsto</p>
              <input 
                type="time" 
                value={transitData.scheduledTime}
                onChange={(e) => setTransitData({...transitData, scheduledTime: e.target.value})}
                className="bg-transparent border-none p-0 text-lg font-black w-full focus:ring-0 dark:text-white tracking-tighter"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Destination Input Section: Luxury Card */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-[45px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] space-y-6 border border-slate-50 dark:border-slate-700 relative overflow-hidden group">
        <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

        <div className="flex items-center gap-5 relative">
          <div className="size-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-slate-900 font-black">my_location</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em]">Origem Atual</p>
              <button
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude, longitude } = pos.coords;
                    if (!(window as any).google?.maps) return;
                    const geocoder = new (window as any).google.maps.Geocoder();
                    geocoder.geocode({ location: { lat: latitude, lng: longitude } }, (results: any, status: any) => {
                      if (status === "OK" && results[0]) {
                        const addr = results[0].formatted_address;
                        setTransitData(prev => ({ ...prev, origin: addr }));
                        if (addr && transitData.destination) {
                          setDistancePrices({});
                          setRouteDistance("");
                          calculateDistancePrices(addr, transitData.destination);
                        }
                      }
                    });
                  }, () => toastError("Não foi possível obter sua localização."));
                }}
                className="flex items-center gap-1 text-[9px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1.5 rounded-xl active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">my_location</span>
                Usar minha localização
              </button>
            </div>
            <AddressSearchInput 
              isLoaded={isLoaded}
              initialValue={transitData.origin}
              placeholder="De onde você está saindo?"
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none px-4 py-3.5 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              onSelect={(place: google.maps.places.PlaceResult) => {
                if (place.formatted_address) {
                  const newOrigin = place.formatted_address;
                  setTransitData(prev => ({ ...prev, origin: newOrigin }));
                  if (newOrigin && transitData.destination) {
                    setDistancePrices({});
                    setRouteDistance("");
                    calculateDistancePrices(newOrigin, transitData.destination);
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 py-1">
          <div className="w-[2px] h-8 bg-gradient-to-b from-primary to-orange-500 ml-6 rounded-full opacity-30" />
          <div className="h-px bg-slate-100 dark:bg-slate-700 flex-1 ml-4" />
        </div>

        <div className="flex items-center gap-5 relative">
          <div className="size-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
            <span className="material-symbols-outlined text-white font-black">location_on</span>
          </div>
          <div className="flex-1">
            <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.25em] mb-1.5 ml-1">Destino Final</p>
            <AddressSearchInput 
              initialValue={transitData.destination}
              placeholder="Para onde deseja ir?"
              className="w-full bg-slate-50 dark:bg-slate-900/50 border-none px-4 py-3.5 rounded-2xl text-[14px] font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/20 outline-none transition-all placeholder:text-slate-400"
              onSelect={(place: any) => {
                const addr = place.formatted_address || "";
                if (addr) {
                  setTransitData(prev => ({ ...prev, destination: addr, estPrice: 0 }));
                  setRouteDistance("");
                  setDistancePrices({});
                  calculateDistancePrices(transitData.origin, addr);
                } else {
                  setTransitData(prev => ({ ...prev, destination: "", estPrice: 0 }));
                  setRouteDistance("");
                  setDistancePrices({});
                }
              }}
              onClear={() => {
                setTransitData(prev => ({ ...prev, destination: "", estPrice: 0 }));
                setRouteDistance("");
                setDistancePrices({});
              }}
            />
          </div>
        </div>
      </div>

      {/* Route info badge */}
      {routeDistance && (
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-700">
          <span className="material-symbols-outlined text-emerald-500 text-xl">route</span>
          <div>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Rota calculada</p>
            <p className="text-[13px] font-bold text-emerald-700">{routeDistance}</p>
          </div>
        </div>
      )}
      {isCalculatingPrice && (
        <div className="flex items-center gap-3 px-5 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[12px] font-bold text-slate-400">Calculando preços pela distância...</p>
        </div>
      )}

      {/* Resumo da Corrida Selecionada */}
      {(() => {
        const vehicles: Record<string, { label: string; icon: string; color: string; desc: string }> = {
          mototaxi: { label: "MotoTáxi", icon: "motorcycle", color: "from-yellow-400 to-orange-500", desc: "Rápido e econômico" },
          carro: { label: "Carro Executivo", icon: "directions_car", color: "from-slate-700 to-slate-900", desc: "Conforto e segurança" },
          van: { label: "Van de Carga", icon: "airport_shuttle", color: "from-blue-600 to-indigo-700", desc: "Para volumes maiores" },
          utilitario: { label: "Entrega Express", icon: "bolt", color: "from-violet-500 to-purple-700", desc: "Entrega urgente" },
        };
        const v = vehicles[transitData.type] || vehicles.mototaxi;
        const hasDistance = Object.keys(distancePrices).length > 0;
        const basePrice = parseFloat(String(marketConditions.settings?.baseValues?.[transitData.type + "_min"] ?? 6.0)) || 6.0;
        const rawPrice = hasDistance ? (distancePrices[transitData.type] ?? basePrice) : calculateDynamicPrice(basePrice);
        const displayPrice = isNaN(rawPrice) || !rawPrice ? basePrice : rawPrice;
        const hasSurge = marketConditions.settings?.baseValues?.isDynamicActive && marketConditions.surgeMultiplier > 1.05;
        const etaFromRoute = routeDistance ? routeDistance.split("•")[1]?.trim() : null;
        const etaFallback = transitData.type === "mototaxi" ? "3–5 min" : transitData.type === "carro" ? "6–10 min" : transitData.type === "van" ? "10–15 min" : "5–8 min";
        const eta = etaFromRoute || etaFallback;

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumo da Corrida</h3>
              {hasSurge && (
                <span className="text-[10px] font-bold text-orange-500 flex items-center gap-1 bg-orange-50 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  Alta demanda ×{marketConditions.surgeMultiplier.toFixed(1)}
                </span>
              )}
              {!hasSurge && (
                <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-full">
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Preço normal
                </span>
              )}
            </div>

            {/* Card do veiculo selecionado */}
            <div className="bg-white dark:bg-slate-800 rounded-[35px] border-2 border-primary shadow-2xl shadow-primary/10 p-6 flex items-center gap-5">
              <div className={`size-16 rounded-[22px] flex items-center justify-center shadow-xl bg-gradient-to-br ${v.color}`}>
                <span className="material-symbols-outlined text-white text-3xl font-black">{v.icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-black text-slate-900 dark:text-white text-base tracking-tight">{v.label}</h4>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-primary text-slate-900 px-2 py-0.5 rounded-full">Selecionado</span>
                </div>
                <p className="text-[11px] font-bold text-slate-400">{v.desc}</p>
              </div>
              <button
                onClick={() => navigateSubView("none")}
                className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-3 py-2 rounded-xl active:scale-95 transition-all"
              >
                Trocar
              </button>
            </div>

            {/* Detalhes da corrida — só aparecem após calcular rota */}
            {routeDistance && <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 text-center border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary text-xl block mb-1">schedule</span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Chegada</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{eta}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-[24px] p-4 text-center border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-primary text-xl block mb-1">route</span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Distância</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">{routeDistance ? routeDistance.split("•")[0].trim() : "—"}</p>
              </div>
              <div className={`rounded-[24px] p-4 text-center border ${hasSurge ? "bg-orange-50 border-orange-100" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700"}`}>
                <span className={`material-symbols-outlined text-xl block mb-1 ${hasSurge ? "text-orange-500" : "text-primary"}`}>payments</span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Valor</p>
                {isCalculatingPrice ? (
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                ) : (
                  <p className={`text-sm font-black ${hasSurge ? "text-orange-500" : "text-slate-900 dark:text-white"}`}>
                    R$ {(displayPrice ?? 0).toFixed(2).replace(".", ",")}
                  </p>
                )}
              </div>
            </div>}

            {/* Motoristas proximos reais — só aparecem após calcular rota */}
            {routeDistance && <>
            {nearbyDriversCount > 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {nearbyDrivers.slice(0, 3).map((d, i) => (
                    <div key={i} className="size-9 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-slate-900 text-[10px] font-black border-2 border-white dark:border-slate-800">
                      {d.name?.charAt(0).toUpperCase() || "M"}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">{nearbyDriversCount} motorista{nearbyDriversCount > 1 ? "s" : ""} disponível{nearbyDriversCount > 1 ? "s" : ""}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {nearbyDrivers.filter(d => d.vehicle_type === transitData.type).length > 0
                      ? `${nearbyDrivers.filter(d => d.vehicle_type === transitData.type).length} com ${transitData.type}`
                      : "Todos os tipos disponíveis"}
                  </p>
                </div>
                <div className="ml-auto size-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="size-3 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            ) : isCalculatingPrice ? (
              <div className="bg-white dark:bg-slate-800 rounded-[28px] p-5 border border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400">Buscando motoristas...</p>
              </div>
            ) : null}
            </>}
          </div>
        );
      })()}

              {/* Dynamic History & Favorites */}
      <div className="space-y-6">
        {transitHistory.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Endereços Recentes
              </h3>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
              {transitHistory.slice(0, 5).map((address, i) => (
                <div
                  key={i}
                  className="min-w-[200px] bg-white dark:bg-slate-800 p-5 rounded-[35px] shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all group flex items-center gap-4"
                  onClick={() => setTransitData({ ...transitData, destination: address })}
                >
                  <div className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-slate-900 text-xl">history</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] font-black uppercase text-primary tracking-widest leading-none mb-1">Anterior</p>
                    <p className="text-[10px] font-bold text-slate-900 dark:text-slate-200 truncate w-full">{address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">
            Sugestões Rápidas
          </h3>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-2 px-2">
            {savedAddresses.length > 0 ? savedAddresses.map((addr, i) => {
              const icons: Record<string, string> = { Casa: "home", Trabalho: "work" };
              const icon = icons[addr.label] || "location_on";
              return (
                <div
                  key={i}
                  className="min-w-[160px] bg-white dark:bg-slate-800 p-5 rounded-[30px] shadow-sm border border-slate-100 dark:border-slate-700 cursor-pointer active:scale-95 transition-all group flex flex-col items-center text-center"
                  onClick={() => {
                    const dest = `${addr.street}${addr.details ? ', ' + addr.details : ''}`;
                    setTransitData({ ...transitData, destination: dest });
                    calculateDistancePrices(transitData.origin, dest);
                  }}
                >
                  <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-slate-900 text-xl">{icon}</span>
                  </div>
                  <p className="text-[11px] font-black text-slate-800 dark:text-slate-200 tracking-widest leading-none mb-1 uppercase">{addr.label}</p>
                  <p className="text-[9px] font-bold text-slate-400 truncate w-full">{addr.street}</p>
                </div>
              );
            }) : (
              <div className="bg-white dark:bg-slate-800 p-5 rounded-[30px] border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center text-center min-w-[220px]">
                <span className="material-symbols-outlined text-slate-300 text-3xl mb-2">location_on</span>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Nenhum endereço salvo</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Adicione endereços no perfil</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>

    <div className="fixed bottom-0 left-0 right-0 p-6 pt-4 pb-safe-bottom bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent dark:from-slate-950 dark:via-slate-950/95 z-30">
      {/* Preço do serviço selecionado */}
      {transitData.destination && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-5 py-2.5 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Serviço selecionado</span>
            {isCalculatingPrice ? (
              <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span className="text-[15px] font-black text-slate-900 dark:text-white">
                R$ {(() => {
                  const bv = marketConditions.settings.baseValues;
                  const basePrices: Record<string, number> = { mototaxi: bv.mototaxi_min, carro: bv.carro_min, van: bv.van_min, utilitario: bv.utilitario_min };
                  const rawP = distancePrices[transitData.type] || calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min);
                  const p = isNaN(rawP) || !rawP ? (basePrices[transitData.type] || bv.mototaxi_min || 6) : rawP;
                  return (p ?? 0).toFixed(2).replace('.', ',');
                })()}
              </span>
            )}
          </div>
        </div>
      )}
      <button
        disabled={!transitData.destination || isLoading}
        onClick={isShippingView ? () => setSubView('shipping_details') : handleRequestTransit}
        className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-lg py-6 rounded-[32px] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex justify-center items-center gap-4 group"
      >
        {isLoading ? (
          <div className="size-7 border-4 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
        ) : (
          <>
            <span className="tracking-tighter">
              {transitData.destination
                ? (isShippingView ? `Confirmar Envio` : `Buscar Prestador`)
                : "Defina o Destino"}
            </span>
            <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform">arrow_forward</span>
          </>
        )}
      </button>
    </div>
  </div>
  );
  };

  // ─── Tela de Pagamento da Mobilidade ─────────────────────────────────────

}
