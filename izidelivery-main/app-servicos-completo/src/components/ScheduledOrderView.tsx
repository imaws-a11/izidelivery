import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ScheduledOrderView() {
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
  const svcIcons: Record<string,string> = { mototaxi:'motorcycle', carro:'directions_car', van:'airport_shuttle', utilitario:'bolt' };
  const svcLabels: Record<string,string> = { mototaxi:'MotoTáxi', carro:'Carro Executivo', van:'Van de Carga', utilitario:'Entrega Express' };
  const icon = svcIcons[selectedItem.service_type] || 'event';
  const label = svcLabels[selectedItem.service_type] || 'Serviço';
  const scheduledAt = selectedItem.scheduled_date && selectedItem.scheduled_time
    ? new Date(`${selectedItem.scheduled_date}T${selectedItem.scheduled_time}`).toLocaleString('pt-BR', { weekday:'long', day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit' })
    : null;
  const hasDriver = !!selectedItem.driver_id;

  const saveObservation = async () => {
    if (!schedObsState.trim()) return;
    setIsSavingObsState(true);
    await supabase.from('orders_delivery').update({ order_notes: schedObsState }).eq('id', selectedItem.id);
    setIsSavingObsState(false);
    toastSuccess('Observação salva!');
  };

  const sendScheduledMessage = () => {
    if (!schedChatInputState.trim()) return;
    const msg = { id: Date.now().toString(), text: schedChatInputState.trim(), from: 'user' as const, time: new Date().toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' }) };
    setSchedMessagesState(prev => [...prev, msg]);
    setSchedChatInputState('');
  };

  return (
    <div className="absolute inset-0 z-[120] bg-[#f8fafc] dark:bg-slate-950 flex flex-col overflow-hidden">
      <header className="px-6 py-5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center gap-4 shrink-0">
        <button onClick={() => { setSubView('none'); setFilterTab('agendados' as any); }} className="size-11 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined font-black text-slate-700 dark:text-white">arrow_back</span>
        </button>
        <div className="flex-1">
          <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Agendamento</h2>
          <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{label}</p>
        </div>
        <button onClick={async () => {
          if (!await showConfirm({ message: 'Cancelar este agendamento?' })) return;
          await supabase.from('orders_delivery').update({ status: 'cancelado' }).eq('id', selectedItem.id);
          setSubView('none'); fetchMyOrders(userId!); toastSuccess('Agendamento cancelado.');
        }} className="px-4 py-2 border border-red-200 dark:border-red-500/20 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
          Cancelar
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-5 space-y-4">
        {/* Status */}
        <div className={`rounded-[28px] p-5 flex items-center gap-4 ${hasDriver ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20'}`}>
          <div className={`size-12 rounded-[18px] flex items-center justify-center ${hasDriver ? 'bg-emerald-500/20' : 'bg-blue-500/20'}`}>
            <span className={`material-symbols-outlined text-2xl ${hasDriver ? 'text-emerald-500' : 'text-blue-500'}`}>{hasDriver ? 'verified' : 'pending'}</span>
          </div>
          <div>
            <p className={`text-[9px] font-black uppercase tracking-widest ${hasDriver ? 'text-emerald-500' : 'text-blue-400'}`}>{hasDriver ? 'Motorista Confirmado' : 'Aguardando Confirmação'}</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white">{hasDriver ? 'Seu motorista está confirmado!' : 'Buscando motorista disponível...'}</h3>
          </div>
        </div>

        {/* Detalhes */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 p-5 space-y-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500 text-xl">{icon}</span>
            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Serviço</p><p className="text-sm font-black text-slate-900 dark:text-white">{label}</p></div>
          </div>
          {scheduledAt && <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-xl">event</span>
            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Agendado para</p><p className="text-sm font-black text-slate-900 dark:text-white capitalize">{scheduledAt}</p></div>
          </div>}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-yellow-500 text-xl mt-0.5">trip_origin</span>
            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Origem</p><p className="text-sm font-bold text-slate-700 dark:text-slate-300">{selectedItem.pickup_address}</p></div>
          </div>
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 text-xl mt-0.5">location_on</span>
            <div><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Destino</p><p className="text-sm font-bold text-slate-900 dark:text-white">{selectedItem.delivery_address}</p></div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Total</span>
            <span className="text-lg font-black text-slate-900 dark:text-white">R$ {(selectedItem.total_price||0).toFixed(2).replace('.',',')}</span>
          </div>
        </div>

        {/* Observações */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 p-5 shadow-sm space-y-3">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observações para o Motorista</p>
          <textarea value={schedObsState} onChange={e => setSchedObsState(e.target.value)}
            placeholder="Ex: Tenho bagagens, endereço tem portão azul, preciso de nota fiscal..."
            rows={3} className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 resize-none"
          />
          <button onClick={saveObservation} disabled={isSavingObsState}
            className="w-full py-3 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-md shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50">
            {isSavingObsState ? 'Salvando...' : 'Salvar Observação'}
          </button>
        </div>

        {/* Chat */}
        <div className="bg-white dark:bg-slate-800 rounded-[28px] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
            <span className="material-symbols-outlined text-blue-500 text-xl">chat</span>
            <p className="text-sm font-black text-slate-900 dark:text-white">Chat com o Motorista</p>
          </div>
          <div className="p-4 min-h-[100px] space-y-3">
            {schedMessagesState.length === 0 && (
              <p className="text-center text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest py-4">
                {hasDriver ? 'Inicie a conversa com seu motorista' : 'Disponível após confirmação do motorista'}
              </p>
            )}
            {schedMessagesState.map((msg: any) => (
              <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-2.5 rounded-[18px] ${msg.from === 'user' ? 'bg-blue-500 text-white rounded-tr-[6px]' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white rounded-tl-[6px]'}`}>
                  <p className="text-sm font-medium">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 flex gap-3">
            <input type="text" value={schedChatInputState} onChange={e => setSchedChatInputState(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendScheduledMessage()}
              placeholder={hasDriver ? 'Escreva uma mensagem...' : 'Aguardando motorista...'}
              disabled={!hasDriver}
              className="flex-1 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:border-blue-400 disabled:opacity-40"
            />
            <button onClick={sendScheduledMessage} disabled={!hasDriver || !schedChatInputState.trim()}
              className="size-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 active:scale-90 transition-all disabled:opacity-30">
              <span className="material-symbols-outlined font-black">send</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };

  const renderPaymentProcessing = () => {
  return (
    <div className="absolute inset-0 z-[150] bg-slate-900 flex flex-col items-center justify-center p-8 text-center text-white overflow-hidden">
      {/* Radar/Scan effect */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,217,0,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,217,0,0.05)_2px,transparent_2px)] bg-[size:30px_30px]"></div>
      
      <div className="relative mb-12">
         <motion.div 
           animate={{ rotate: 360 }}
           transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
           className="w-48 h-48 border-2 border-primary/20 rounded-full border-t-primary shadow-[0_0_30px_rgba(255,217,0,0.1)]"
         />
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-primary/10 rounded-full border border-primary/20 flex items-center justify-center relative overflow-hidden group">
               <motion.div 
                 animate={{ y: [-40, 40, -40] }}
                 transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute inset-x-0 h-[2px] bg-primary shadow-[0_0_15px_#ffd900] z-20"
               />
               <span className="material-symbols-outlined text-5xl text-primary animate-pulse relative z-10 fill-1">fingerprint</span>
            </div>
         </div>
      </div>

      <div className="space-y-4 relative z-10">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-2 animate-pulse">Izi Security Protocol</p>
        <h1 className="text-3xl font-black text-white tracking-tighter italic uppercase">
          Autenticando Transação...
        </h1>
        <p className="text-white/40 text-[11px] leading-relaxed max-w-[250px] mx-auto font-bold uppercase tracking-widest">
          Aguarde um instante. Estamos verificando os dados via API segura Izi.
        </p>
      </div>

      <div className="mt-16 bg-white/5 backdrop-blur-md px-6 py-4 rounded-[25px] border border-white/10 flex items-center gap-4">
         <div className="size-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">verified_user</span>
         </div>
         <div className="text-left">
            <p className="text-[9px] font-black text-white uppercase tracking-widest">Gateway Ativo</p>
            <p className="text-[11px] font-bold text-white/40 uppercase">Criptografia RSA 4096-bit</p>
         </div>
      </div>
    </div>
  );

}
