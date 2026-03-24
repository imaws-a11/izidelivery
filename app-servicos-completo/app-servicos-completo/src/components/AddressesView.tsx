import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function AddressesView() {
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

  const handleSaveAddress = async () => {
    if (!editingAddress || !userId) return;
    
    const payload = {
      user_id: userId,
      label: editingAddress.label,
      street: editingAddress.street,
      details: editingAddress.details,
      city: editingAddress.city,
      is_active: editingAddress.active,
    };

    if (typeof editingAddress.id === 'string') {
      await supabase.from('saved_addresses').update(payload).eq('id', editingAddress.id);
    } else {
      await supabase.from('saved_addresses').insert(payload);
    }
    
    fetchSavedAddresses(userId);
    setEditingAddress(null);
    setIsAddingAddress(false);
  };

  const handleSelectAddress = async (addrId: string | number) => {
    const addr = savedAddresses.find(a => a.id === addrId);
    if (!addr) return;

    if (userId) {
      await supabase.from('saved_addresses').update({ is_active: false }).eq('user_id', userId);
      await supabase.from('saved_addresses').update({ is_active: true }).eq('id', addrId).eq('user_id', userId);
      fetchSavedAddresses(userId);
    } else {
      setSavedAddresses(prev => prev.map(a => ({ ...a, active: a.id === addrId })));
    }
    
    setUserLocation({ ...userLocation, address: addr.street });
    setSubView("none");
  };

  return (
    <div className="absolute inset-0 z-40 bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl flex flex-col hide-scrollbar overflow-y-auto pb-40">
      <header
        className="px-6 py-6 sticky top-0 z-50 bg-white/10 dark:bg-slate-900/10 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between gap-4"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="size-14 bg-white dark:bg-slate-800 rounded-[22px] flex items-center justify-center shadow-2xl shadow-primary/20 border border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/10 animate-pulse" />
            <span className="material-symbols-outlined text-primary text-3xl fill-1 relative z-10">location_on</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mb-1 opacity-80">Meus Endereços</span>
            <h2 className="text-md font-black leading-tight text-slate-900 dark:text-white tracking-tight">
              Gerenciar Locais
            </h2>
          </div>
        </div>
        <button
          onClick={() => {
            setSubView("none");
            setIsAddingAddress(false);
            setEditingAddress(null);
          }}
          className="size-11 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center active:scale-90 transition-all text-slate-900 dark:text-white shadow-xl border border-white/5"
        >
          <span className="material-symbols-rounded font-black text-2xl">close</span>
        </button>
      </header>

      <main className="p-6">
        <AnimatePresence mode="wait">
          {isAddingAddress ? (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-[45px] shadow-2xl border border-white/10 mb-10 overflow-hidden"
            >
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">Buscar novo endereço</h3>
              <div className="relative">
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(autocomplete) => (addressAutocompleteRef.current = autocomplete)}
                    onPlaceChanged={() => {
                      const place = addressAutocompleteRef.current?.getPlace();
                      if (place && place.formatted_address) {
                        setEditingAddress({
                          id: Date.now(),
                          label: "Casa",
                          street: place.formatted_address.split(",")[0],
                          details: "",
                          city: place.formatted_address.split(",").slice(1).join(",").trim(),
                          active: false,
                        });
                        setIsAddingAddress(false);
                      }
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Nome da rua, número..."
                      className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-5 px-6 text-[15px] font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                      autoFocus
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    placeholder="Carregando mapas..."
                    disabled
                    className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-5 px-6 text-[15px] font-bold opacity-50"
                  />
                )}
                <span className="absolute right-5 top-1/2 -translate-y-1/2 material-symbols-rounded text-primary text-2xl">search</span>
              </div>
              <button
                onClick={() => setIsAddingAddress(false)}
                className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.25em] mt-4 opacity-60 hover:opacity-100 transition-opacity"
              >
                Cancelar
              </button>
            </motion.div>
          ) : editingAddress ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-800 p-8 rounded-[45px] shadow-2xl border border-white/10 mb-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 size-32 bg-primary/5 rounded-full blur-3xl" />
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-8 tracking-tighter">
                {savedAddresses.some(a => a.id === editingAddress.id) ? "Editar Local" : "Finalizar Cadastro"}
              </h3>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Rótulo (ex: Casa, Trabalho)</label>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {['Casa', 'Trabalho', 'Outro'].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setEditingAddress({ ...editingAddress, label: tag })}
                        className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${editingAddress.label === tag ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-900 text-slate-500 hover:bg-slate-200'}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  {editingAddress.label === 'Outro' && (
                    <input
                      type="text"
                      placeholder="Nome personalizado..."
                      className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-4 px-6 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
                      value={editingAddress.label === 'Outro' ? "" : editingAddress.label}
                      onChange={(e) => setEditingAddress({ ...editingAddress, label: e.target.value })}
                      autoFocus
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Endereço</label>
                  <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">{editingAddress.street}</p>
                    <p className="text-[10px] font-medium text-slate-500 mt-1 uppercase">{editingAddress.city}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 opacity-70">Complemento / Referência</label>
                  <input
                    type="text"
                    placeholder="Apto 12, Próximo ao mercado..."
                    className="w-full bg-slate-100 dark:bg-slate-900/50 border-none rounded-2xl py-5 px-6 text-[15px] font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white transition-all"
                    value={editingAddress.details}
                    onChange={(e) => setEditingAddress({ ...editingAddress, details: e.target.value })}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleSaveAddress}
                    className="flex-[2] bg-primary text-slate-900 font-black py-5 rounded-3xl shadow-2xl shadow-primary/30 active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                  >
                    Confirmar Endereço
                  </button>
                  <button
                    onClick={() => setEditingAddress(null)}
                    className="flex-1 bg-slate-100 dark:bg-slate-900 text-slate-500 font-black py-5 rounded-3xl active:scale-95 transition-all text-sm"
                  >
                    <span className="material-symbols-rounded">close</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="add-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAddingAddress(true)}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-6 rounded-[35px] flex items-center justify-center gap-4 mb-12 shadow-2xl transition-all border-none group"
            >
              <div className="size-10 rounded-2xl bg-white/20 dark:bg-slate-900/10 flex items-center justify-center group-hover:rotate-90 transition-transform">
                <span className="material-symbols-rounded font-black text-2xl">add</span>
              </div>
              <span className="uppercase tracking-[0.2em] text-xs">Adicionar Novo Endereço</span>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] ml-2 mb-6">Locais Salvos</h3>
          {savedAddresses.length === 0 ? (
            <div className="text-center py-20 opacity-30">
              <span className="material-symbols-rounded text-6xl block mb-4">location_off</span>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Nenhum endereço salvo</p>
            </div>
          ) : (
            savedAddresses.map((addr, i) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative bg-white dark:bg-slate-800 p-8 rounded-[50px] shadow-2xl transition-all border-2 group active:scale-[0.99] ${addr.active ? "border-primary shadow-primary/20" : "border-transparent"}`}
              >
                {addr.active && (
                  <div className="absolute -top-4 left-10 bg-primary text-slate-900 px-5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Selecionado</div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-5">
                    <div className={`size-16 rounded-[22px] flex items-center justify-center shadow-xl ${addr.active ? "bg-primary text-slate-900" : "bg-slate-100 dark:bg-slate-900 text-slate-400"}`}>
                      <span className="material-symbols-rounded text-3xl fill-1">
                        {addr.label.toLowerCase().includes("casa") ? "home" : addr.label.toLowerCase().includes("trabalho") ? "work" : "location_on"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-xl leading-tight tracking-tight group-hover:text-primary transition-colors">{addr.label}</h4>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1 opacity-70 leading-none">{addr.city}</p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={async (e) => { e.stopPropagation(); setEditingAddress(addr); }}
                      className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-primary/10 transition-all active:scale-90 border border-transparent"
                    >
                      <span className="material-symbols-rounded text-2xl">edit_square</span>
                    </button>
                    <button
                      onClick={async (e) => { 
                        e.stopPropagation(); 
                        if(await showConfirm({ message: "Deseja excluir este endereço?" })) {
                          if (userId) {
                            await supabase.from('saved_addresses').delete().eq('id', addr.id).eq('user_id', userId);
                            fetchSavedAddresses(userId);
                          } else {
                            setSavedAddresses(prev => prev.filter(a => a.id !== addr.id));
                          }
                        }
                      }}
                      className="size-12 rounded-2xl bg-red-50 dark:bg-red-900/10 flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                    >
                      <span className="material-symbols-rounded text-2xl">delete</span>
                    </button>
                  </div>
                </div>

                <div
                  className="cursor-pointer"
                  onClick={() => handleSelectAddress(addr.id)}
                >
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-inner group-hover:border-primary/20 transition-all">
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-base leading-snug">
                      {addr.street}
                    </p>
                    {addr.details && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{addr.details}</p>
                      </div>
                    )}
                  </div>
                </div>

                {!addr.active && (
                  <button
                    onClick={() => handleSelectAddress(addr.id)}
                    className="mt-6 w-full py-4 bg-slate-50 dark:bg-slate-900 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary hover:text-slate-900 transition-all shadow-inner border border-transparent"
                  >
                    Selecionar este Endereço
                  </button>
                )}
              </motion.div>
            ))
          )}
        </div>
      </main>
    </div>
  );

}
