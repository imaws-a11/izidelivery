import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function WalletView() {
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
  <div className="absolute inset-0 z-40 bg-[#f8f9fc] dark:bg-slate-900 flex flex-col hide-scrollbar overflow-y-auto">
    <header className="px-6 py-8 sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between gap-4 rounded-b-[40px] shadow-sm">
      <button onClick={() => setSubView("none")} className="flex items-center justify-center size-10 bg-white dark:bg-slate-800 rounded-full shadow-sm active:scale-95 transition-all text-slate-900 dark:text-white border border-slate-100 dark:border-slate-700">
        <span className="material-symbols-rounded text-xl">arrow_back</span>
      </button>
      <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter flex-1 pr-10 text-center">Carteira Digital</h2>
    </header>

    <div className="px-6 pb-40">
      {/* Card Saldo */}
      <div className="mt-8 bg-slate-900 dark:bg-slate-800 p-8 rounded-[48px] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -right-20 -top-20 size-64 bg-primary/20 rounded-full blur-[80px]"></div>
        <div className="absolute -left-20 -bottom-20 size-64 bg-blue-600/10 rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Saldo em Conta</p>
              <h3 className="text-5xl font-black tracking-tighter">R$ {walletBalance.toFixed(2).replace(".", ",")}</h3>
            </div>
            <div className="size-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
              <span className="material-symbols-rounded text-primary text-3xl font-black">token</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowDepositModal(true)}
              className="bg-primary text-slate-900 font-extrabold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
              <span className="material-symbols-rounded font-black">add_circle</span> Adicionar
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => toastWarning("Transferência entre contas estará disponível em breve!")}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/10 font-black py-4 rounded-2xl flex items-center justify-center gap-2 transition-all">
              <span className="material-symbols-rounded">move_up</span> Transferir
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modal Deposito PIX */}
      {showDepositModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center" onClick={() => setShowDepositModal(false)}>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-[40px] p-8 pb-12" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-8" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Adicionar Saldo</h3>
            <p className="text-sm text-slate-500 mb-6">Deposite via PIX. O saldo é creditado em até 5 minutos.</p>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor</label>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-2xl px-5 py-4 border border-slate-100 dark:border-slate-700">
                  <span className="font-black text-slate-400">R$</span>
                  <input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)}
                    placeholder="0,00" min="5" step="0.01"
                    className="flex-1 bg-transparent font-black text-xl text-slate-900 dark:text-white focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {["20", "50", "100", "200"].map(v => (
                  <button key={v} onClick={() => setDepositAmount(v)}
                    className="py-3 rounded-2xl bg-primary/10 text-primary font-black text-sm active:scale-95 transition-all">
                    R${v}
                  </button>
                ))}
              </div>
              <button onClick={async () => {
                const amount = parseFloat(depositAmount);
                if (!amount || amount < 5) { toastError("Valor mínimo de R$ 5,00"); return; }
                if (!userId) return;
                try {
                  const pixKey = "suporte@izidelivery.com.br";
                  const code = `00020126360014br.gov.bcb.pix0114${pixKey}5204000053039865406${amount.toFixed(2)}5802BR5925IziDelivery6009SAO PAULO62070503***6304`;
                  setDepositPixCode(code);
                  await supabase.from("wallet_transactions").insert({ user_id: userId, type: "deposito", amount, description: "Depósito via PIX" });
                  await supabase.from("users_delivery").update({ wallet_balance: walletBalance + amount }).eq("id", userId);
                  setWalletBalance(prev => prev + amount);
                  setWalletTransactions(prev => [{ id: Date.now(), type: "deposito", amount, description: "Depósito via PIX", created_at: new Date().toISOString() }, ...prev]);
                  toastSuccess(`Depósito de R$ ${amount.toFixed(2)} adicionado!`);
                  setShowDepositModal(false);
                  setDepositAmount("");
                } catch { toastError("Erro ao processar depósito."); }
              }}
                className="w-full bg-primary text-slate-900 font-black py-5 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all">
                Confirmar Depósito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Historico de Transacoes */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="material-symbols-rounded text-primary">history</span>
            Movimentações
          </h3>
        </div>

        {walletTransactions.length === 0 ? (
          <div className="text-center py-16">
            <span className="material-symbols-rounded text-5xl text-slate-300 mb-4 block">receipt_long</span>
            <p className="text-sm font-black text-slate-400">Nenhuma movimentação ainda</p>
            <p className="text-xs text-slate-400 mt-1">Adicione saldo para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {walletTransactions.map((t, i) => {
              const isCredit = t.type === "deposito" || t.type === "reembolso";
              const icon = t.type === "deposito" ? "account_balance" : t.type === "reembolso" ? "autorenew" : "shopping_bag";
              return (
                <motion.div key={t.id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-slate-800 p-5 rounded-[32px] shadow-sm border border-slate-50 dark:border-slate-800/50 flex items-center gap-4">
                  <div className={`size-12 rounded-2xl flex items-center justify-center ${isCredit ? "bg-emerald-50 dark:bg-emerald-900/10 text-emerald-500" : "bg-slate-50 dark:bg-slate-900 text-slate-400"}`}>
                    <span className="material-symbols-rounded text-xl">{icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-slate-900 dark:text-white text-sm">{t.description || (t.type === "deposito" ? "Depósito" : t.type === "reembolso" ? "Reembolso" : "Pagamento")}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`font-black text-base ${isCredit ? "text-emerald-500" : "text-slate-900 dark:text-white"}`}>
                    {isCredit ? "+" : "-"}R$ {Math.abs(t.amount).toFixed(2).replace(".", ",")}
                  </span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  </div>

  );
}
