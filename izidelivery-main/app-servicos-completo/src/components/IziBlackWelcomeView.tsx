import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function IziBlackWelcomeView() {
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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-12">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-3xl"
      />
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: -20 }}
        transition={{ type: "spring", damping: 25, stiffness: 200, delay: 0.2 }}
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-[56px] p-12 overflow-hidden shadow-[0_0_100px_rgba(234,179,8,0.07)]"
      >
        {/* Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent shadow-[0_0_20px_rgba(234,179,8,0.5)]" />
        <div className="absolute -top-40 -right-40 size-80 bg-yellow-600/10 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -left-40 size-80 bg-yellow-600/10 rounded-full blur-[100px]" />

        <div className="flex flex-col items-center text-center relative z-10">
          <motion.div
            initial={{ rotate: -20, scale: 0 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: "spring", delay: 0.5, bounce: 0.6 }}
            className="size-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[32px] flex items-center justify-center shadow-[0_15px_40px_rgba(234,179,8,0.3)] mb-10"
          >
            <span className="material-symbols-rounded text-5xl text-black font-black">workspace_premium</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
              VOCÊ ESTÁ <span className="text-yellow-500">DENTRO</span>.
            </h1>
            <p className="text-zinc-400 font-medium text-lg leading-relaxed mb-12">
              Seja bem-vindo ao <span className="text-white font-bold">Izi Black</span>. 
              Seus privilégios exclusivos foram ativados com sucesso.
            </p>
          </motion.div>

          {/* Perks Preview */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="grid grid-cols-2 gap-4 w-full mb-12"
          >
            {[
              { icon: 'bolt', label: 'Cashback 5%' },
              { icon: 'local_shipping', label: 'Frete Grátis' },
              { icon: 'star', label: 'VIP Perks' },
              { icon: 'support_agent', label: 'Suporte Elite' }
            ].map((perk, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-yellow-500 text-lg">{perk.icon}</span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">{perk.label}</span>
              </div>
            ))}
          </motion.div>

          <motion.button
            whileHover={{ scale: 1.03, brightness: 1.2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setShowIziBlackWelcome(false);
              // Forçar refresh total do usuário para carregar badges e perks
              if (userId) {
                fetchWalletBalance(userId);
                fetchMyOrders(userId);
              }
            }}
            className="w-full bg-white text-black font-black py-7 rounded-[32px] text-xs uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 transition-all"
          >
            Começar Experiência Elite
          </motion.button>
        </div>
      </motion.div>
    </div>
  );

}
