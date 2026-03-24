import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function WaitingDriverView() {
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

  const serviceLabels: Record<string, { label: string; icon: string; color: string }> = {
    mototaxi: { label: "MotoTáxi", icon: "motorcycle", color: "text-primary" },
    carro: { label: "Carro Executivo", icon: "directions_car", color: "text-slate-600" },
    van: { label: "Van de Carga", icon: "airport_shuttle", color: "text-blue-500" },
    utilitario: { label: "Entrega Express", icon: "bolt", color: "text-purple-500" },
  };
  const service = serviceLabels[selectedItem.service_type] || { label: "Serviço", icon: "local_shipping", color: "text-primary" };

  return (
    <div className="absolute inset-0 z-[115] bg-[#020617] flex flex-col items-center justify-center p-8 text-white overflow-hidden">
      {/* Fundo animado */}
      <div className="absolute inset-0 opacity-5 bg-[linear-gradient(rgba(255,217,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,217,0,0.1)_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Radar */}
      <div className="relative mb-10">
        <motion.div animate={{ scale: [1, 2.5], opacity: [0.4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }} className="absolute inset-0 bg-primary/20 rounded-full" />
        <motion.div animate={{ scale: [1, 2], opacity: [0.3, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }} className="absolute inset-0 bg-primary/20 rounded-full" />
        <div className="relative size-24 bg-primary/10 border border-primary/30 rounded-full flex items-center justify-center">
          <span className={`material-symbols-outlined text-4xl ${service.color}`}>{service.icon}</span>
        </div>
      </div>

      <h2 className="text-2xl font-black text-white tracking-tight text-center mb-2">Buscando Prestador</h2>
      <p className="text-white/40 text-sm text-center mb-8 max-w-xs">Estamos encontrando o melhor prestador disponível para você</p>

      {/* Info do pedido */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[32px] p-6 space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Serviço</span>
          <span className="text-sm font-black text-white">{service.label}</span>
        </div>
        <div className="h-px bg-white/5" />
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
            <p className="text-xs text-white/60 leading-tight">{selectedItem.pickup_address}</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="mt-1.5 size-2 rounded-full bg-orange-500 shrink-0" />
            <p className="text-xs text-white/80 font-bold leading-tight">{selectedItem.delivery_address}</p>
          </div>
        </div>
        <div className="h-px bg-white/5" />
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Valor</span>
          <span className="text-xl font-black text-primary">R$ {Number(selectedItem.total_price).toFixed(2).replace(".", ",")}</span>
        </div>
      </div>

      {/* Cancelar */}
      <button
        onClick={async () => {
          if (!await showConfirm({ message: "Cancelar a solicitação?" })) return;
          await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", selectedItem.id);
          setSubView("none");
          fetchMyOrders(userId!);
          toastSuccess("Solicitação cancelada.");
        }}
        className="text-white/30 font-black text-[10px] uppercase tracking-widest border border-white/10 px-6 py-3 rounded-2xl hover:bg-white/5 transition-all active:scale-95"
      >
        Cancelar Solicitação
      </button>

      {/* Auto-redireciona para active_order quando driver aceita */}
      {selectedItem?.status && ["a_caminho", "aceito", "confirmado", "em_rota", "no_local"].includes(selectedItem.status) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-10 left-6 right-6"
        >
          <button
            onClick={() => setSubView("active_order")}
            className="w-full bg-primary text-slate-900 font-black py-5 rounded-[24px] shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 text-sm uppercase tracking-widest"
          >
            <span className="material-symbols-outlined font-black">navigation</span>
            Motorista Encontrado! Acompanhar
          </button>
        </motion.div>
      )}
    </div>
  );

}
