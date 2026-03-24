import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function OrdersView() {
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

  const scheduledOrders = myOrders.filter(o => o && o.status === 'agendado');
  const activeOrders = myOrders.filter(o => o && !['concluido', 'cancelado', 'agendado'].includes(o.status));
  const pastOrders = myOrders.filter(o => o && ['concluido', 'cancelado'].includes(o.status));

  return (
    <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-slate-900 pb-32 animate-in fade-in duration-700 overflow-hidden">
      {/* Header Premium */}
      <header className="px-8 pt-12 pb-8 bg-white dark:bg-slate-900 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-3xl bg-opacity-80 dark:bg-opacity-80">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              Atividade
            </h1>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-[0.3em] mt-1.5 opacity-70">Sua jornada de pedidos</p>
          </div>
          <div className="flex gap-3">
            <button className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-2xl">search</span>
            </button>
            <button className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-100 dark:border-slate-700 active:scale-95 transition-all relative">
              <span className="material-symbols-outlined text-2xl">notifications</span>
              <span className="absolute top-3 right-3 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
            </button>
          </div>
        </div>

        {/* Segmented Control: Luxury Style */}
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[22px] flex gap-1 shadow-inner">
          <button
            onClick={() => setFilterTab('ativos')}
            className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${filterTab === 'ativos' ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20" : "text-slate-400"}`}
          >
            Ativos agora
            {activeOrders.length > 0 && (
              <span className="size-5 bg-primary text-slate-900 rounded-full flex items-center justify-center text-[9px] font-black animate-pulse">
                {activeOrders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilterTab('agendados' as any)}
            className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${filterTab === 'agendados' ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20" : "text-slate-400"}`}
          >
            Agendados
            {scheduledOrders.length > 0 && <span className="size-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[9px] font-black">{scheduledOrders.length}</span>}
          </button>
          <button
            onClick={() => setFilterTab('historico')}
            className={`flex-1 py-3.5 rounded-[18px] text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300 flex items-center justify-center gap-2 ${filterTab === 'historico' ? "bg-white dark:bg-slate-700 text-slate-950 dark:text-white shadow-xl shadow-slate-200/50 dark:shadow-black/20" : "text-slate-400"}`}
          >
            Histórico
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        <AnimatePresence mode="wait">
          {filterTab === 'ativos' ? (
            <motion.div
              key="actives"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-6"
            >
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                  <div className="size-32 rounded-[50px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-8 relative">
                    <div className="absolute inset-0 bg-primary/5 rounded-[50px] animate-pulse" />
                    <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700">moped</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Tudo pronto por aqui!</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest opacity-80">Você não tem pedidos ativos no momento.</p>
                  <button
                    onClick={() => setTab("home")}
                    className="mt-10 px-10 py-4 bg-primary text-slate-900 font-black rounded-3xl text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 active:scale-95 transition-all"
                  >
                    Pedir algo agora
                  </button>
                </div>
              ) : (
                activeOrders.map((order, i) => {
                  const shop = ESTABLISHMENTS.find((s: any) => s.id === order.shop_id) || { img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200", name: "Loja Parceira" };
                  return (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      key={order.id}
                      onClick={() => { setSelectedItem(order); setSubView("active_order"); }}
                      className="bg-white dark:bg-slate-800 rounded-[45px] p-7 shadow-2xl shadow-slate-200/40 dark:shadow-black/40 border border-slate-50 dark:border-slate-700/50 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                    >
                       {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-900">
                        <div className="h-full bg-primary animate-shimmer bg-[length:200%_100%]" style={{ width: '65%' }} />
                      </div>

                      <div className="flex justify-between items-start mb-6">
                         <div className="flex items-center gap-5">
                            <div className="size-16 rounded-[22px] bg-slate-50 dark:bg-slate-900 p-1 flex items-center justify-center border border-slate-100 dark:border-slate-700 shadow-xl group-hover:rotate-3 transition-transform">
                              <img src={order.type === 'transit' ? "https://cdn-icons-png.flaticon.com/512/3202/3202926.png" : shop.img} className="size-full object-cover rounded-[18px]" />
                            </div>
                            <div>
                              <h3 className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none mb-1.5">{order.type === 'transit' ? 'Viagem Ativa' : shop.name}</h3>
                              <div className="flex items-center gap-2">
                                <div className="size-2 bg-emerald-500 rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{(order.status || "Pendente").replace("_", " ")}</span>
                              </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Total</span>
                            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">R$ {(order.total_price || 0).toFixed(2).replace(".", ",")}</span>
                         </div>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-[28px] p-5 border border-slate-100 dark:border-slate-800/80 mb-6">
                        <div className="flex items-center gap-4 mb-4">
                          <span className="material-symbols-outlined text-primary text-xl">location_on</span>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate flex-1 uppercase tracking-wider">{order.delivery_address || order.destination_address || "Endereço não informado"}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="material-symbols-outlined text-primary text-xl">schedule</span>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Chega em <span className="text-slate-900 dark:text-white font-black">12-18 min</span></p>
                        </div>
                      </div>

                      <button className="w-full py-4 bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-extrabold text-[11px] uppercase tracking-[0.2em] rounded-[22px] shadow-xl shadow-primary/20 active:scale-95 transition-all">
                        Acompanhar Pedido
                      </button>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          ) : filterTab === 'agendados' ? (
            <motion.div key="scheduled" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-6">
              {scheduledOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center px-10">
                  <div className="size-32 rounded-[50px] bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-8">
                    <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700">event</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-3">Sem agendamentos</h3>
                  <p className="text-xs font-medium text-slate-400 leading-relaxed uppercase tracking-widest">Agende um serviço de mobilidade.</p>
                </div>
              ) : scheduledOrders.map((order: any, i: number) => {
                const icons: Record<string,string> = { mototaxi:'motorcycle', carro:'directions_car', van:'airport_shuttle', utilitario:'bolt' };
                const labels: Record<string,string> = { mototaxi:'MotoTáxi', carro:'Carro Executivo', van:'Van', utilitario:'Entrega Express' };
                const scheduledAt = order.scheduled_date && order.scheduled_time
                  ? new Date(`${order.scheduled_date}T${order.scheduled_time}`).toLocaleString('pt-BR', { weekday:'short', day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })
                  : 'Data não informada';
                return (
                  <motion.div key={order.id} initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} transition={{ delay: i*0.08 }}
                    onClick={() => { setSelectedItem(order); setSubView('scheduled_order'); setSchedObsState(order.order_notes || ''); setSchedMessagesState([]); }}
                    className="bg-white dark:bg-slate-800 rounded-[40px] p-6 shadow-xl border border-slate-50 dark:border-slate-700/50 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-100 dark:bg-blue-900/30 overflow-hidden">
                      <div className={`h-full bg-blue-500 ${order.driver_id ? 'w-full' : 'w-1/3'}`} />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="size-14 rounded-[20px] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                          <span className="material-symbols-outlined text-blue-500 text-2xl">{icons[order.service_type] || 'event'}</span>
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 dark:text-white text-base">{labels[order.service_type] || 'Serviço'}</h3>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={`size-1.5 rounded-full ${order.driver_id ? 'bg-emerald-500 animate-pulse' : 'bg-blue-400'}`} />
                            <span className={`text-[9px] font-black uppercase tracking-widest ${order.driver_id ? 'text-emerald-500' : 'text-blue-400'}`}>
                              {order.driver_id ? 'Motorista Confirmado' : 'Aguardando Motorista'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="text-base font-black text-slate-900 dark:text-white">R$ {(order.total_price||0).toFixed(2).replace('.',',')}</span>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-500/10 rounded-[20px] p-4 space-y-2 mb-4 border border-blue-100 dark:border-blue-500/20">
                      <div className="flex items-center gap-2"><span className="material-symbols-outlined text-blue-500 text-lg">event</span><p className="text-sm font-black text-slate-900 dark:text-white capitalize">{scheduledAt}</p></div>
                      <div className="flex items-center gap-2"><span className="material-symbols-outlined text-slate-400 text-lg">location_on</span><p className="text-xs font-bold text-slate-500 truncate">{order.delivery_address}</p></div>
                    </div>
                    <button className="w-full py-4 bg-blue-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[20px] shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-lg">manage_search</span>Acompanhar Agendamento
                    </button>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {pastOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <span className="material-symbols-outlined text-6xl text-slate-200 dark:text-slate-800 mb-6">history</span>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Nenhum histórico encontrado</p>
                </div>
              ) : (
                pastOrders.sort((a,b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).map((order) => {
                   const shop = ESTABLISHMENTS.find((s: any) => s.id === order.shop_id) || { img: "https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=200", name: "Loja Parceira" };
                   const isCancelled = order.status === 'cancelado';
                   return (
                      <div key={order.id} className="bg-white dark:bg-slate-800 rounded-[40px] p-6 shadow-xl shadow-slate-200/20 dark:shadow-black/20 border border-slate-50 dark:border-slate-700/50 group">
                         <div className="flex gap-5 mb-5">
                            <div className="size-14 rounded-2xl bg-slate-50 dark:bg-slate-900 p-1 shrink-0 opacity-80 border border-slate-100 dark:border-slate-700">
                              <img src={order.type === 'transit' ? "https://cdn-icons-png.flaticon.com/512/3202/3202926.png" : shop.img} className="size-full object-cover rounded-xl grayscale-[0.3]" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex justify-between items-start">
                                  <h4 className="font-black text-slate-800 dark:text-white leading-tight truncate mr-2">{order.type === 'transit' ? 'Viagem' : shop.name}</h4>
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isCancelled ? 'bg-red-50 text-red-400 dark:bg-red-900/10' : 'bg-slate-50 text-slate-400 dark:bg-slate-900'}`}>
                                     {order.status}
                                  </span>
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] mt-1">
                                  {order.created_at ? new Date(order.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : "Data indisponível"}
                               </p>
                            </div>
                         </div>

                         <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-slate-700/50">
                            <div className="flex items-baseline gap-1">
                               <span className="text-[10px] font-black text-slate-400">R$</span>
                               <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">{(order.total_price || 0).toFixed(2).replace(".", ",")}</span>
                            </div>
                            <div className="flex gap-2">
                               <button 
                                 onClick={() => { setSelectedItem(order); setSubView('order_support'); }}
                                 className="px-5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 font-black text-[9px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                               >
                                 Ajuda
                               </button>
                               <button className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest hover:bg-primary hover:text-slate-900 transition-all">Refazer</button>
                            </div>
                         </div>
                      </div>
                   );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );

}
