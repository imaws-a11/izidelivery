import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ProductDetailView() {
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

  // Determine where to go back
  const handleBack = () => {
    if (selectedShop) {
      setSubView("restaurant_menu");
    } else if (activeService) {
      if (activeService.type === "market") setSubView("market_list");
      else if (activeService.type === "pharmacy") setSubView("pharmacy_list");
      else setSubView("generic_list");
    } else {
      setSubView("none");
    }
  };

  const itemImage =
    selectedItem.img ||
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop";

  return (
    <div className="absolute inset-0 z-[70] bg-[#f8f9fc] dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto">
      <div
        className="relative w-full h-[40vh] bg-cover bg-center shrink-0"
        style={{ backgroundImage: `url('${itemImage}')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-[#f8f9fc] dark:from-slate-900 via-transparent to-black/20"></div>

        <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between">
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg active:scale-95 transition-transform text-slate-900 dark:text-white border border-white/20"
          >
            <span className="material-symbols-rounded text-xl">
              arrow_back
            </span>
          </button>
          <button className="w-12 h-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-slate-900 dark:text-white border border-white/20">
            <span className="material-symbols-rounded text-xl">favorite</span>
          </button>
        </header>
      </div>

      <div className="flex-1 bg-[#f8f9fc] dark:bg-slate-900 -mt-10 rounded-t-[40px] px-8 pt-10 pb-40 relative z-20">
        <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8 opacity-50"></div>

        <div className="flex justify-between items-start gap-4">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-tight">
              {selectedItem.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-primary font-black text-2xl tracking-tighter">
                R$ {selectedItem.price.toFixed(2).replace(".", ",")}
              </span>
              {selectedItem.oldPrice && (
                <span className="text-slate-400 text-sm line-through font-bold">
                  R$ {selectedItem.oldPrice.toFixed(2).replace(".", ",")}
                </span>
              )}
            </div>
          </div>
          {selectedShop && (
            <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col items-center min-w-[64px]">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                Loja
              </span>
              <div
                className="size-8 rounded-lg bg-cover bg-center"
                style={{ backgroundImage: `url('${selectedShop.img}')` }}
              ></div>
            </div>
          )}
        </div>

        <div className="mt-8 space-y-6">
          <section>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Descrição
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-relaxed">
              {selectedItem.desc ||
                "Um produto premium selecionado especialmente para você. Qualidade garantida e entrega rápida diretamente na sua porta."}
            </p>
          </section>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">
              Quantidade
            </h3>
            <div className="flex items-center gap-6 bg-slate-50 dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setTempQuantity((q) => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 text-slate-400 flex items-center justify-center active:scale-90 transition-transform shadow-sm"
              >
                <span className="material-symbols-rounded text-2xl">
                  remove
                </span>
              </button>
              <span className="text-xl font-black text-slate-900 dark:text-white min-w-4 text-center">
                {tempQuantity}
              </span>
              <button
                onClick={() => setTempQuantity((q) => q + 1)}
                className="w-10 h-10 rounded-xl bg-primary text-slate-900 flex items-center justify-center active:scale-90 transition-transform shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-rounded text-2xl font-black">
                  add
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-10 left-8 right-8 z-[80]">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            const itemsToAdd = Array(tempQuantity).fill(selectedItem);
            setCart([...cart, ...itemsToAdd]);
            handleBack();
          }}
          className="w-full bg-slate-900 dark:bg-primary text-white dark:text-slate-900 p-5 rounded-[28px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-between transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-white/20 dark:bg-black/10 flex items-center justify-center">
              <span className="material-symbols-rounded font-black text-xl">
                shopping_bag
              </span>
            </div>
            <span className="font-bold text-lg">Adicionar</span>
          </div>
          <span className="font-black text-xl bg-white/20 dark:bg-black/10 px-4 py-1.5 rounded-2xl tracking-tighter">
            R${" "}
            {(selectedItem.price * tempQuantity).toFixed(2).replace(".", ",")}
          </span>
        </motion.button>
      </div>
    </div>
  );

}
