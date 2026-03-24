import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function MobilityPaymentView() {
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

  const bv = marketConditions.settings.baseValues;
  const basePrices: Record<string, number> = { mototaxi: bv.mototaxi_min, carro: bv.carro_min, van: bv.van_min, utilitario: bv.utilitario_min };
  const price = (transitData.estPrice > 0 ? transitData.estPrice : calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min)) ?? 0;

  const serviceLabels: Record<string, { label: string; icon: string }> = {
    mototaxi: { label: "MotoTáxi", icon: "motorcycle" },
    carro: { label: "Carro Executivo", icon: "directions_car" },
    van: { label: "Van de Carga", icon: "airport_shuttle" },
    utilitario: { label: "Entrega Express", icon: "bolt" },
  };
  const service = serviceLabels[transitData.type] || { label: "Serviço", icon: "local_shipping" };
  const activeCard = savedCards.find((c: any) => c.active);

  return (
    <div className="absolute inset-0 z-[115] bg-[#F8FAFC] dark:bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl border-b border-slate-100 dark:border-white/5 px-6 py-5 flex items-center gap-4">
        <button onClick={() => setSubView("transit_selection")} className="size-11 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined font-black">arrow_back</span>
        </button>
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">Confirmar Serviço</h2>
          <p className="text-[10px] font-black text-primary uppercase tracking-widest">Escolha como pagar</p>
        </div>
      </header>

      <div className="flex-1 px-6 py-6 space-y-6 pb-40">
        {/* Resumo do serviço */}
        <div className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[40px] p-6 space-y-5">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resumo da Solicitação</h3>
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-[22px] bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl font-black">{service.icon}</span>
            </div>
            <div className="flex-1">
              <p className="font-black text-slate-900 dark:text-white text-base">{service.label}</p>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {transitData.origin.split(",")[0]} → {transitData.destination.split(",")[0]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                R$ {price.toFixed(2).replace(".", ",")}
              </p>
              {transitData.scheduled && (
                <p className="text-[9px] font-black text-primary uppercase tracking-widest mt-0.5">Agendado</p>
              )}
            </div>
          </div>

          {/* Info de agendamento */}
          {transitData.scheduled && transitData.scheduledDate && (
            <div className="bg-primary/5 border border-primary/20 rounded-[20px] p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-xl">event</span>
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Agendado para</p>
                <p className="text-sm font-black text-slate-900 dark:text-white">
                  {new Date(`${transitData.scheduledDate}T${transitData.scheduledTime}`).toLocaleString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          )}

          {/* Rota detalhada */}
          <div className="bg-slate-50 dark:bg-black/20 rounded-[24px] p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 size-2 rounded-full bg-primary shrink-0" />
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Origem</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{transitData.origin}</p>
              </div>
            </div>
            <div className="ml-[3px] h-4 w-[1px] bg-slate-200 dark:bg-white/10" />
            <div className="flex items-start gap-3">
              <div className="mt-1.5 size-2 rounded-full bg-orange-500 shrink-0" />
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{transitData.destination}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de pagamento */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Forma de Pagamento</h3>

          {/* Cartão salvo */}
          {activeCard && activeCard.stripe_payment_method_id && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => handleConfirmMobility("cartao")}
              disabled={isLoading}
              className="w-full bg-slate-900 dark:bg-white/5 border-2 border-primary/20 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
            >
              <div className="size-12 rounded-[18px] bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-xl">credit_card</span>
              </div>
              <div className="flex-1 text-left">
                <p className="font-black text-white text-sm">{activeCard.brand} ••••{activeCard.last4}</p>
                <p className="text-[10px] text-white/40 uppercase tracking-widest">Débito instantâneo</p>
              </div>
              <span className="material-symbols-outlined text-primary font-black">arrow_forward</span>
            </motion.button>
          )}

          {/* PIX */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConfirmMobility("pix")}
            disabled={isLoading}
            className="w-full bg-white dark:bg-white/5 border border-emerald-200 dark:border-emerald-500/20 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="size-12 rounded-[18px] bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-emerald-500 text-xl">qr_code_2</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-slate-900 dark:text-white text-sm">PIX</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Aprovação imediata</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 font-black">arrow_forward</span>
          </motion.button>

          {/* Saldo */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConfirmMobility("saldo")}
            disabled={isLoading || walletBalance < price}
            className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all disabled:opacity-40"
          >
            <div className="size-12 rounded-[18px] bg-blue-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-blue-500 text-xl">account_balance_wallet</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-slate-900 dark:text-white text-sm">Saldo em Carteira</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">R$ {walletBalance.toFixed(2).replace(".", ",")} disponível</p>
            </div>
            {walletBalance < price ? (
              <span className="text-[9px] font-black text-red-400 uppercase">Insuficiente</span>
            ) : (
              <span className="material-symbols-outlined text-slate-400 font-black">arrow_forward</span>
            )}
          </motion.button>

          {/* Dinheiro */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => handleConfirmMobility("dinheiro")}
            disabled={isLoading}
            className="w-full bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-[28px] p-5 flex items-center gap-4 active:scale-[0.98] transition-all"
          >
            <div className="size-12 rounded-[18px] bg-slate-100 dark:bg-white/5 flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-600 dark:text-slate-400 text-xl">payments</span>
            </div>
            <div className="flex-1 text-left">
              <p className="font-black text-slate-900 dark:text-white text-sm">Dinheiro</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">Pague ao prestador</p>
            </div>
            <span className="material-symbols-outlined text-slate-400 font-black">arrow_forward</span>
          </motion.button>
        </div>

        {/* Badge segurança */}
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 border-dashed p-4 rounded-[24px]">
          <span className="material-symbols-outlined text-primary text-xl">shield_with_heart</span>
          <p className="text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-widest">Pagamento 100% seguro e criptografado</p>
        </div>
      </div>
    </div>
  );
  };

  // ─── Tela de Aguardando Motorista ────────────────────────────────────────

}
