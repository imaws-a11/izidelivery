import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ProfileView() {
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
  <div className="flex flex-col h-full bg-[#f8f9fc] dark:bg-slate-900 overflow-y-auto pb-32 animate-in fade-in duration-500">
    <header className="px-6 py-8 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
          Meu Perfil
        </h1>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configurações e Conta</p>
      </div>
      <button className="size-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
        <span className="material-symbols-outlined font-black">settings</span>
      </button>
    </header>

    <div className="px-6 py-8">
      {/* User Card: Premium Design */}
      <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[48px] shadow-2xl text-white relative overflow-hidden group mb-10">
        <div className="absolute -right-16 -top-16 size-48 bg-primary/20 rounded-full blur-[60px]" />
        <div className="absolute -left-16 -bottom-16 size-48 bg-blue-500/10 rounded-full blur-[60px]" />

        <div className="relative z-10 flex items-center gap-6">
          <div className="size-20 rounded-[30px] border-4 border-white/10 p-1 bg-white/5 backdrop-blur-md">
            <img
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || 'default'}`}
              alt="Profile"
              className="size-full rounded-[22px] bg-slate-100 object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">Estevan</h2>
              <span className="material-symbols-outlined text-primary text-xl fill-1">verified</span>
            </div>
            <p className="text-xs font-bold text-white/50 tracking-wide mt-1 uppercase tracking-widest">{email}</p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-primary/20 border border-primary/20 rounded-full">
              <div className="size-1.5 bg-primary rounded-full animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary">Nível Diamante</span>
            </div>
          </div>
        </div>
      </div>



      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Explorar Conta</h3>

        <div className="grid grid-cols-1 gap-4">
          {[
            { icon: "account_balance_wallet", label: "Minha Carteira", desc: "Saldo e Extrato", action: () => setSubView("wallet"), color: "primary" },
            { icon: "location_on", label: "Endereços", desc: "Suas localizações salvas", action: () => setSubView("addresses"), color: "blue" },
            { icon: "credit_card", label: "Pagamentos", desc: "Cartões e Métodos", action: () => { setPaymentsOrigin("profile"); setSubView("payments"); }, color: "purple" },
            { icon: "notifications", label: "Notificações", desc: "Alertas e Novidades", action: () => showToast("Configurações de alerta"), color: "amber" },
            { icon: "help", label: "Ajuda & Suporte", desc: "Falar com o atendimento", action: () => showToast("Suporte 24h em breve"), color: "emerald" },
          ].map((item, i) => (
            <motion.div
              whileTap={{ scale: 0.98 }}
              key={i}
              onClick={item.action}
              className="flex items-center gap-5 bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-xl shadow-slate-200/30 dark:shadow-black/20 border border-slate-50 dark:border-slate-700/50 cursor-pointer group hover:border-primary/30 transition-all"
            >
              <div className={`size-14 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-colors`}>
                <span className="material-symbols-outlined text-2xl group-hover:fill-1">{item.icon}</span>
              </div>
              <div className="flex-1">
                <span className="font-black text-slate-900 dark:text-white block">{item.label}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.desc}</span>
              </div>
              <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={async () => {
            await supabase.auth.signOut();
            setView("login");
          }}
          className="w-full mt-10 py-5 bg-red-50 dark:bg-red-900/10 text-red-500 border border-red-100 dark:border-red-900/20 font-black rounded-[28px] shadow-lg shadow-red-500/5 active:scale-95 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Encerrar Sessão
        </motion.button>
      </div>
    </div>
  </div>

  );
}
