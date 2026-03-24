import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function OrderChatView() {
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

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || !selectedItem) return;
    const text = chatInput;
    setChatInput("");

    const { error } = await supabase
      .from("order_messages")
      .insert({
        order_id: selectedItem.id,
        sender_id: userId,
        text: text
      });

    if (error) showToast("Erro ao enviar mensagem", "warning");
  };

  return (
    <div className="absolute inset-0 z-[120] bg-white dark:bg-slate-900 flex flex-col hide-scrollbar overflow-hidden">
      <header className="px-8 pt-12 pb-6 bg-white/80 dark:bg-slate-900/80 sticky top-0 z-30 border-b border-slate-100 dark:border-slate-800/50 backdrop-blur-3xl flex items-center justify-between">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setSubView("active_order")}
              className="size-11 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div>
               <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">Chat Izi</h2>
               <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5">
                  <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  Online agora
               </p>
            </div>
         </div>
         <div className="size-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800">
            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=driver-123" className="size-full object-cover" />
         </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8f9fc] dark:bg-slate-950/20">
         {chatMessages.length === 0 && (
           <div className="flex flex-col items-center justify-center h-full opacity-20 text-center px-10">
              <span className="material-symbols-outlined text-6xl mb-4">chat_bubble</span>
              <p className="text-xs font-black uppercase tracking-[0.3em]">Nenhuma mensagem ainda.<br/>Inicie a conversa!</p>
           </div>
         )}
         {chatMessages.map((msg) => {
            const isMine = msg.sender === userId;
            return (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: isMine ? 20 : -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                key={msg.id} 
                className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                 <div className={`max-w-[80%] p-5 rounded-[30px] shadow-sm ${
                   isMine 
                    ? 'bg-slate-900 dark:bg-primary text-white dark:text-slate-900 rounded-tr-lg' 
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-tl-lg'
                 }`}>
                    <p className="text-sm font-bold leading-relaxed">{msg.text}</p>
                    <p className={`text-[8px] font-black uppercase tracking-widest mt-2 opacity-40 ${isMine ? 'text-white dark:text-slate-900' : 'text-slate-400 text-right'}`}>
                      {msg.time}
                    </p>
                 </div>
              </motion.div>
            );
         })}
      </div>

      <footer className="p-6 pb-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-4">
         <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Digite sua mensagem..."
              className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[30px] py-5 px-8 text-sm font-bold focus:ring-2 focus:ring-primary shadow-inner dark:text-white"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            />
            <button className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
              <span className="material-symbols-outlined">mood</span>
            </button>
         </div>
         <button 
           onClick={sendMessage}
           disabled={!chatInput.trim()}
           className="size-14 rounded-2xl bg-primary text-slate-900 flex items-center justify-center shadow-xl shadow-primary/20 active:scale-90 transition-all disabled:opacity-50"
         >
           <span className="material-symbols-outlined font-black">send</span>
         </button>
      </footer>
    </div>
  );

}
