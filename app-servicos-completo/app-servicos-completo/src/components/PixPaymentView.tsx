import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function PixPaymentView() {
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

  if (!pixData) return null;
  const isVIP = paymentsOrigin === "izi_black";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(pixData.copyPaste);
    toastSuccess("Código PIX copiado!");
  };

  return (
    <div className={`absolute inset-0 z-[100] ${isVIP ? 'bg-zinc-950' : 'bg-slate-50 dark:bg-slate-950'} flex flex-col animate-in fade-in zoom-in duration-500`}>
      <header className="p-6 flex items-center justify-between">
        <button 
          onClick={() => {
            if (paymentsOrigin === "izi_black") setSubView("izi_black_purchase");
            else setSubView("checkout");
          }}
          className={`size-12 rounded-2xl ${isVIP ? 'bg-white/5 border border-white/10' : 'bg-white dark:bg-slate-900 shadow-sm'} flex items-center justify-center active:scale-90 transition-all`}
        >
          <span className={`material-symbols-outlined ${isVIP ? 'text-white' : ''}`}>close</span>
        </button>
        <div className="text-center">
          <h2 className={`text-sm font-black uppercase tracking-widest ${isVIP ? 'text-yellow-400' : ''}`}>Pagamento PIX</h2>
          <p className={`text-[10px] ${isVIP ? 'text-white/40' : 'text-slate-400'} font-bold uppercase tracking-tighter`}>Aguardando confirmação</p>
        </div>
        <div className="size-12" /> {/* Spacer */}
      </header>

      <main className="flex-1 overflow-y-auto px-8 py-4 flex flex-col items-center">
        <div className={`w-full aspect-square max-w-[280px] bg-white rounded-[40px] p-6 shadow-2xl ${isVIP ? 'shadow-yellow-400/10 border-4 border-yellow-400/20' : 'shadow-primary/10 border-4 border-primary/20'} relative mb-10`}>
          <img 
            src={`data:image/png;base64,${(pixData as any).qrCodeBase64}`} 
            alt="QR Code PIX" 
            className="w-full h-full object-contain"
          />
          <div className={`absolute -top-3 -right-3 size-12 ${isVIP ? 'bg-yellow-400' : 'bg-primary'} rounded-2xl flex items-center justify-center shadow-lg animate-bounce`}>
            <span className={`material-symbols-outlined ${isVIP ? 'text-black' : 'text-slate-900'} font-black`}>qr_code_2</span>
          </div>
        </div>

        <div className="w-full space-y-6">
          <div className={`${isVIP ? 'bg-zinc-900 border-white/5 shadow-2xl' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm'} p-6 rounded-[32px] border text-center`}>
            <p className={`text-[10px] font-black uppercase tracking-widest ${isVIP ? 'text-zinc-500' : 'text-slate-400'} mb-4 text-center`}>Código Copia e Cola</p>
            <div className={`flex items-center gap-3 ${isVIP ? 'bg-black/40 border-white/5' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'} p-4 rounded-2xl border border-dashed`}>
              <p className={`flex-1 text-[11px] font-mono break-all line-clamp-2 ${isVIP ? 'text-zinc-500' : 'text-slate-500'} text-left`}>
                {pixData.copyPaste}
              </p>
              <button 
                onClick={copyToClipboard}
                className={`size-10 ${isVIP ? 'bg-yellow-400 text-black shadow-yellow-400/20' : 'bg-primary text-slate-900 shadow-primary/20'} rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-all shadow-lg`}
              >
                <span className="material-symbols-outlined text-sm font-black">content_copy</span>
              </button>
            </div>
          </div>

          <div className={`${isVIP ? 'bg-yellow-400/5 border-yellow-400/20' : 'bg-emerald-500/5 border-emerald-500/20'} border p-6 rounded-[32px] flex items-center gap-5`}>
            <div className={`size-12 rounded-2xl ${isVIP ? 'bg-yellow-400/20 text-yellow-400' : 'bg-emerald-500/20 text-emerald-500'} flex items-center justify-center`}>
              <span className="material-symbols-outlined animate-pulse">timer</span>
            </div>
            <div className="flex-1">
              <p className={`text-xs font-black ${isVIP ? 'text-yellow-400' : 'text-emerald-600 dark:text-emerald-400'} uppercase tracking-widest`}>Pagamento Instantâneo</p>
              <p className={`text-[10px] font-medium ${isVIP ? 'text-yellow-400/40' : 'text-emerald-600/70 dark:text-emerald-400/50'} uppercase mt-1`}>O pedido será confirmado assim que o PIX for detectado.</p>
            </div>
          </div>
        </div>

        <p className={`mt-12 text-[10px] font-black ${isVIP ? 'text-zinc-600' : 'text-slate-400'} uppercase tracking-[0.3em] text-center max-w-[200px] leading-relaxed`}>
          Abra o app do seu banco e escolha a opção pagar com <span className={isVIP ? 'text-yellow-400' : 'text-primary'}>QR Code</span>
        </p>
      </main>

      <footer className="p-8 pb-12">
        {isVIP ? (
          <button 
              onClick={() => setSubView("none")}
              className="w-full py-6 bg-yellow-400 text-black font-black rounded-[35px] uppercase tracking-widest text-xs shadow-[0_20px_40px_-10px_rgba(255,184,0,0.3)] active:scale-95 transition-all"
            >
              Retornar ao Hub Izi
            </button>
        ) : (
          <button 
            onClick={() => setTab("orders")}
            className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-[24px] uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all"
          >
            Ver Meus Pedidos
          </button>
        )}
      </footer>
    </div>
  );

}
