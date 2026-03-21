import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ShippingDetailsView() {
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
    <div className="absolute inset-0 z-[120] bg-slate-50 dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto animate-in fade-in duration-500 pb-40">
      <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xl z-50">
        <button
          onClick={() => setSubView("transit_selection")}
          className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center text-slate-900 dark:text-white active:scale-90 transition-all border border-slate-100 dark:border-slate-700"
        >
          <span className="material-symbols-outlined font-black">arrow_back</span>
        </button>
        <div className="text-right">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
            Detalhes do Objeto
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Informações de Entrega</p>
        </div>
      </header>

      <main className="px-6 space-y-10">
        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="material-symbols-outlined text-primary font-black">location_on</span>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Local da Entrega</h3>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
             <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Endereço Selecionado</p>
             <AddressSearchInput 
               isLoaded={isLoaded}
               initialValue={transitData.destination}
               placeholder="Digite o endereço..."
               className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 dark:text-white"
               onSelect={(place: google.maps.places.PlaceResult) => {
                 const dest = place.formatted_address || "";
                 setTransitData(prev => ({ ...prev, destination: dest }));
                 if (dest && transitData.origin) {
                   setDistancePrices({});
                   setRouteDistance("");
                   calculateDistancePrices(transitData.origin, dest);
                 }
               }}
             />
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="material-symbols-outlined text-primary font-black">person</span>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Quem recebe?</h3>
          </div>
          
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Nome Completo</p>
               <input 
                 type="text" 
                 value={transitData.receiverName}
                 onChange={(e) => setTransitData({...transitData, receiverName: e.target.value})}
                 placeholder="Ex: João Silva"
                 className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 dark:text-white"
               />
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Telefone de Contato</p>
               <input 
                 type="tel" 
                 value={transitData.receiverPhone}
                 onChange={(e) => setTransitData({...transitData, receiverPhone: e.target.value})}
                 placeholder="(11) 99999-9999"
                 className="w-full bg-transparent border-none p-0 text-lg font-bold focus:ring-0 dark:text-white"
               />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4 px-2">
            <span className="material-symbols-outlined text-primary font-black">inventory_2</span>
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">O que está enviando?</h3>
          </div>

          <div className="space-y-4">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-[35px] border border-slate-100 dark:border-white/5 shadow-xl">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-2 ml-1">Descrição do Item</p>
                <textarea 
                  value={transitData.packageDesc}
                  onChange={(e) => setTransitData({...transitData, packageDesc: e.target.value})}
                  placeholder="Ex: 2 Camisetas, 1 Par de Tênis..."
                  rows={3}
                  className="w-full bg-transparent border-none p-0 text-base font-bold focus:ring-0 dark:text-white resize-none"
                />
             </div>

             <div className="grid grid-cols-2 gap-4">
                {['Pequeno (até 5kg)', 'Médio (até 15kg)', 'Grande (até 30kg)', 'Pesado (+30kg)'].map((weight) => (
                  <button
                    key={weight}
                    onClick={() => setTransitData({...transitData, weightClass: weight})}
                    className={`py-4 rounded-[25px] text-[10px] font-black uppercase tracking-widest border-2 transition-all ${transitData.weightClass === weight ? 'bg-primary border-primary text-slate-900 shadow-lg' : 'bg-white dark:bg-slate-800 border-transparent text-slate-400 opacity-60'}`}
                  >
                    {weight}
                  </button>
                ))}
             </div>
          </div>
        </section>

        <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-[35px] border border-amber-100 dark:border-amber-900/30 flex items-start gap-4">
           <span className="material-symbols-outlined text-amber-500">warning</span>
           <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 leading-relaxed uppercase tracking-wider">
              Certifique-se de que o objeto esteja bem embalado. Não transportamos itens proibidos por lei ou inflamáveis.
           </p>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900 z-50">
        <button
          disabled={!transitData.receiverName || !transitData.receiverPhone || isLoading}
          onClick={handleRequestTransit}
          className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 font-black text-xl py-6 rounded-[32px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-30 flex justify-center items-center gap-4 group"
        >
          {isLoading ? (
            <div className="size-7 border-4 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin"></div>
          ) : (
            <>
              <span className="tracking-tighter uppercase tracking-[0.1em]">Agendar Coleta & Enviar</span>
              <span className="material-symbols-outlined font-black group-hover:translate-x-2 transition-transform">bolt</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

}
