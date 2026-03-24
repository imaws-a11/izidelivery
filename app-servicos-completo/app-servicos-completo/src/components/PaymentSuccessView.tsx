import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function PaymentSuccessView() {
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
  return (
    <div className="absolute inset-0 z-[150] bg-white flex flex-col overflow-y-auto hide-scrollbar text-slate-900">
      <header className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="mb-6">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-emerald-500 text-5xl font-black">
              check
            </span>
          </div>
        </div>
        <h1 className="text-3xl font-black text-slate-900 text-center tracking-tighter">
          Pagamento Aprovado!
        </h1>
        <p className="text-slate-500 mt-2 text-center font-medium">
          Tudo certo com seu pedido.
        </p>
      </header>

      <main className="flex-grow px-6 space-y-8">
        <section className="bg-slate-50 border border-slate-100 rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-200/60">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Pedido
              </span>
              <p className="text-lg font-black text-slate-900">
                #{selectedItem.id.toString().slice(-4)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Total Pago
              </span>
              <p className="text-lg font-black text-slate-900">
                R$ {selectedItem.total_price?.toFixed(2).replace(".", ",")}
              </p>
            </div>
          </div>
          <div className="pt-4 flex items-center gap-4">
            <div className="p-3 bg-primary/20 rounded-xl">
              <span className="material-symbols-outlined text-slate-800">
                schedule
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none block mb-1">
                Entrega Estimada
              </span>
              <p className="text-sm font-black text-slate-900">25 - 35 min</p>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            O que acontece agora?
          </h2>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center font-black text-slate-900 shrink-0">
              1
            </div>
            <div>
              <p className="font-black text-slate-900">Preparação</p>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                O estabelecimento recebeu seu pedido e já está começando a
                preparar tudo com carinho.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 opacity-50">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 shrink-0">
              2
            </div>
            <div>
              <p className="font-black text-slate-400">Entrega</p>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                Assim que estiver pronto, um entregador será acionado para
                levar o pedido até você.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="p-6 pb-12 space-y-3">
        <button
          onClick={() => setSubView("active_order")}
          className="w-full bg-primary text-slate-900 font-extrabold py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all uppercase tracking-widest text-sm"
        >
          Acompanhar Pedido
          <span className="material-symbols-outlined font-black">
            arrow_forward
          </span>
        </button>
        <button
          onClick={() => {
            setSubView("none");
            setTab("home");
            window.history.replaceState({ view: "app", tab: "home", subView: "none" }, "");
          }}
          className="w-full bg-transparent text-slate-500 font-black py-4 rounded-2xl hover:bg-slate-50 transition-colors uppercase tracking-widest text-[10px]"
        >
          Voltar para o Início
        </button>
      </footer>
    </div>
  );
  };

  const BottomNav = () => {
  const navItems = [
    { id: "home", icon: "home", label: "Início" },
    { id: "orders", icon: "receipt_long", label: "Pedidos" },
    { id: "wallet", icon: "account_balance_wallet", label: "Carteira" },
    { id: "profile", icon: "person", label: "Perfil" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="flex items-center justify-around px-2 pt-2 pb-3 max-w-lg mx-auto">
      {navItems.map((item) => {
        const isActive = tab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setTab(item.id as any);
              setSubView("none");
              window.history.replaceState({ view: "app", tab: item.id, subView: "none" }, "");
            }}
            className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 active:scale-95 transition-transform"
          >
            <div className="flex items-center gap-2.5">
              <span className={`material-symbols-outlined text-[22px] transition-all duration-300 ${isActive ? "text-primary scale-110" : "text-slate-400"}`} style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className={`text-[10px] font-bold transition-all duration-300 leading-none ${isActive ? "text-primary" : "text-slate-400"}`}>{item.label}</span>
            </div>
            {isActive && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 dark:bg-black/10 scale-x-50" />
            )}
          </button>
        );
      })}
      <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
      {/* Izi AI Advisor */}
      <button onClick={() => setIsAIOpen(true)} className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 active:scale-95 transition-transform">
        <div className={`relative flex items-center justify-center size-9 rounded-2xl transition-all ${isAIOpen ? "bg-slate-900 dark:bg-primary" : "bg-slate-100 dark:bg-slate-800"}`}>
          <div className="absolute inset-0 rounded-2xl bg-primary/20 animate-pulse" />
          <span className="material-symbols-outlined text-[20px] relative z-10 text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>smart_toy</span>
        </div>
        <span className="text-[10px] font-bold text-slate-400 leading-none">AI</span>
      </button>
      <div className="w-[1px] h-8 bg-slate-200 dark:bg-slate-800 mx-1" />
      {/* Cart Quick Access */}
      <button onClick={() => navigateSubView("cart")} className="relative flex flex-col items-center justify-center gap-0.5 min-w-[52px] px-2 py-1 active:scale-95 transition-transform">
        <div className="relative flex items-center justify-center size-9 rounded-2xl bg-primary shadow-md shadow-primary/30">
          <span className="material-symbols-outlined text-slate-900 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>shopping_cart</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center px-1 ring-2 ring-white dark:ring-slate-900">
              {cart.length > 99 ? "99+" : cart.length}
            </span>
          )}
        </div>
        <span className="text-[10px] font-bold text-primary leading-none">{cart.length > 0 ? `R$${cart.reduce((s,i) => s+(i.price||0),0).toFixed(0)}` : "Cart"}</span>
      </button>
      </div>
    </nav>
  );
  };

  return (
  <div className="w-full h-[100dvh] bg-background font-sans overflow-hidden relative">
    <AnimatePresence mode="wait">
      {view === "loading" && (
        <div className="h-full flex items-center justify-center bg-white dark:bg-slate-950">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400">Carregando...</p>
          </div>
        </div>
      )}
      {view === "login" && (
        <motion.div
          key="log"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="h-full"
        >
          <div className="h-full">{renderLogin()}</div>
        </motion.div>
      )}
      {view === "app" && (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="h-full relative"
        >
          {tab === "home" && renderHome()}
          {tab === "orders" && renderOrders()}
          {tab === "wallet" && renderWallet()}
          {tab === "profile" && renderProfile()}

          {/* Sub Views */}
          {/* Sub Views - Unified Layering */}
          <AnimatePresence>
            {subView === "generic_list" && (
              <motion.div
                key="glist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderGenericList()}
              </motion.div>
            )}
            {subView === "restaurant_list" && (
              <motion.div
                key="rlist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderRestaurantList()}
              </motion.div>
            )}
            {subView === "market_list" && (
              <motion.div
                key="mlist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderMarketList()}
              </motion.div>
            )}
            {subView === "pharmacy_list" && (
              <motion.div
                key="phlist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderPharmacyList()}
              </motion.div>
            )}
            {subView === "all_pharmacies" && (
              <motion.div
                key="allpharm"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-50"
              >
                {renderAllPharmacies()}
              </motion.div>
            )}
            {subView === "burger_list" && (
              <motion.div
                key="blist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderBurgerList()}
              </motion.div>
            )}
            {subView === "pizza_list" && (
              <motion.div
                key="plist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderPizzaList()}
              </motion.div>
            )}
            {subView === "acai_list" && (
              <motion.div
                key="alist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderAcaiList()}
              </motion.div>
            )}
            {subView === "japonesa_list" && (
              <motion.div
                key="jlist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderJaponesaList()}
              </motion.div>
            )}
            {subView === "brasileira_list" && (
              <motion.div
                key="brlist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderBrasileiraList()}
              </motion.div>
            )}
            {subView === "explore_restaurants" && (
              <motion.div
                key="explorerest"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderExploreRestaurants()}
              </motion.div>
            )}
            {subView === "daily_menus" && (
              <motion.div
                key="dailymenus"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderDailyMenus()}
              </motion.div>
            )}
            {subView === "health_plantao" && (
              <motion.div
                key="healthplantao"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderHealthPlantao()}
              </motion.div>
            )}
            {subView === "beverages_list" && (
              <motion.div
                key="bevlist"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderBeveragesList()}
              </motion.div>
            )}
            {subView === "beverage_offers" && (
              <motion.div
                key="bevoffers"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 z-[60]"
              >
                {renderBeverageOffers()}
              </motion.div>
            )}
            {subView === "exclusive_offer" && (
              <motion.div
                key="excl_offer"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderExclusiveOffer()}
              </motion.div>
            )}
            {subView === "store_catalog" && (
              <motion.div
                key="scatalog"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-50"
              >
                {renderStoreCatalog()}
              </motion.div>
            )}
            {subView === "restaurant_menu" && (
              <motion.div
                key="rmenu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-50"
              >
                {renderRestaurantMenu()}
              </motion.div>
            )}
            {subView === "product_detail" && (
              <motion.div
                key="pdetail"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[70]"
              >
                {renderProductDetail()}
              </motion.div>
            )}
            {subView === "addresses" && (
              <motion.div
                key="address"
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderAddresses()}
              </motion.div>
            )}
            {subView === "payments" && (
              <motion.div
                key="pay"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderPayments()}
              </motion.div>
            )}
            {subView === "wallet" && (
              <motion.div
                key="wall"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderWallet()}
              </motion.div>
            )}
            {subView === "cart" && (
              <motion.div
                key="cartv"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[75]"
              >
                {renderCart()}
              </motion.div>
            )}
            {subView === "checkout" && (
              <motion.div
                key="check"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[60]"
              >
                {renderCheckout()}
              </motion.div>
            )}
             {subView === "explore_mobility" && (
              <motion.div
                key="expmob"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderExploreMobility()}
              </motion.div>
            )}
            {subView === "explore_category" && (
              <motion.div
                key="expcat"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderExploreCategory()}
              </motion.div>
            )}
            {subView === "explore_envios" && (
              <motion.div
                key="expenv"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-40"
              >
                {renderExploreEnvios()}
              </motion.div>
            )}
            {subView === "transit_selection" && (
              <motion.div
                key="transit"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[110]"
              >
                {renderTransitSelection()}
              </motion.div>
            )}
            {subView === "mobility_payment" && (
              <motion.div
                key="mob_pay"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[115]"
              >
                {renderMobilityPayment()}
              </motion.div>
            )}
            {subView === "waiting_driver" && (
              <motion.div
                key="wait_drv"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 z-[115]"
              >
                {renderWaitingDriver()}
              </motion.div>
            )}
            {subView === "scheduled_order" && (
              <motion.div
                key="sched_ord"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[120]"
              >
                {renderScheduledOrder()}
              </motion.div>
            )}
            {subView === "shipping_details" && (
              <motion.div
                key="ship_det"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[120]"
              >
                {renderShippingDetails()}
              </motion.div>
            )}
            {subView === "active_order" && (
              <motion.div
                key="aorder"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[100]"
              >
                {renderActiveOrder()}
              </motion.div>
            )}
            {subView === "payment_processing" && (
              <motion.div
                key="pproc"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150]"
              >
                {renderPaymentProcessing()}
              </motion.div>
            )}
            {subView === "payment_error" && (
              <motion.div
                key="perr"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150]"
              >
                {renderPaymentError()}
              </motion.div>
            )}
            {subView === "payment_success" && (
              <motion.div
                key="psuccess"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150]"
              >
                {renderPaymentSuccess()}
              </motion.div>
            )}
            {subView === "izi_black_purchase" && (
              <motion.div
                key="iziblackp"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="absolute inset-0 z-[180]"
              >
                {renderIziBlackPurchase()}
              </motion.div>
            )}
            {subView === "order_support" && (
              <motion.div
                key="osupport"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[110]"
              >
                {renderOrderSupport()}
              </motion.div>
            )}
            {subView === "order_feedback" && (
              <motion.div
                key="ofeedback"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[160]"
              >
                {renderOrderFeedback()}
              </motion.div>
            )}
            {subView === "order_chat" && (
              <motion.div
                key="ochat"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[120]"
              >
                {renderOrderChat()}
              </motion.div>
            )}
            {subView === "quest_center" && (
              <motion.div
                key="quests"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                className="absolute inset-0 z-[190]"
              >
                {renderQuestCenter()}
              </motion.div>
            )}
            {subView === "pix_payment" && (
              <motion.div
                key="pixpay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150]"
              >
                {renderPixPayment()}
              </motion.div>
            )}
            {subView === "lightning_payment" && (
              <motion.div
                key="lnpay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[150]"
              >
                {renderLightningPayment()}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showPixPayment && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-lg flex items-center justify-center p-8"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  className="bg-white w-full max-w-sm rounded-[40px] p-8 text-center relative"
                >
                  <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-rounded text-4xl">
                      qr_code_2
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">
                    Pagamento PIX
                  </h3>
                  <p className="text-slate-500 font-medium mb-8">
                    Copie a chave abaixo para pagar no app do seu banco.
                  </p>

                  <div className="bg-slate-100 p-5 rounded-[24px] mb-8 relative group text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Chave Copia e Cola
                    </p>
                    <p className="font-mono text-[11px] break-all text-slate-600 leading-tight">
                      00020126360014BR.GOV.BCB.PIX011478029382000190520400005303986540510.005802BR5915RouteDelivery6009SAO
                      PAULO62070503***6304E2B1
                    </p>
                    <button
                      onClick={() => showToast("Chave copiada!")}
                      className="mt-4 w-full bg-white text-brand-600 font-black py-3 rounded-xl shadow-sm active:scale-95 transition-all text-sm uppercase"
                    >
                      Copiar Código
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setShowPixPayment(false);
                      setSubView("active_order");
                    }}
                    className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-float active:scale-[0.98] transition-all"
                  >
                    Já realizei o pagamento
                  </button>

                  <p className="mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    O pedido será confirmado em instantes
                  </p>
                </motion.div>
              </motion.div>
            )}
            {isAIOpen && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="fixed inset-0 z-[160]"
              >
                {renderAIConcierge()}
              </motion.div>
            )}
            {showIziBlackWelcome && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[2000]"
              >
                {renderIziBlackWelcome()}
              </motion.div>
            )}
            {showIziBlackCard && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="fixed inset-0 z-[170]"
              >
                {renderIziBlackCard()}
              </motion.div>
            )}
            {showMasterPerks && (
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                className="fixed inset-0 z-[180]"
              >
                {renderMasterPerks()}
              </motion.div>
            )}
          </AnimatePresence>

          <BottomNav />
        </motion.div>
      )}
    </AnimatePresence>

    {/* Floating Cart Animations */}
    <AnimatePresence>
      {cartAnimations.map(anim => (
        <motion.img
          key={anim.id}
          src={anim.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200"}
          initial={{ x: anim.x - 30, y: anim.y - 30, scale: 0.8, opacity: 1 }}
          animate={{ 
            x: window.innerWidth / 2 - 30,
            y: window.innerHeight - 80,
            scale: 0.1,
            opacity: 0,
            rotate: 360
          }}
          transition={{
            duration: 0.8,
            ease: [0.175, 0.885, 0.32, 1.275] // nice curved path feel
          }}
          className="fixed z-[9999] size-16 object-cover rounded-full shadow-2xl border-2 border-primary pointer-events-none"
        />
      ))}
    </AnimatePresence>
    {toast && (
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-[400px]"
      >
        <div className={`p-5 rounded-[32px] shadow-2xl backdrop-blur-3xl border flex items-center gap-4 ${
          toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 
          toast.type === 'warning' ? 'bg-amber-500/90 border-amber-400 text-white' :
          'bg-slate-900/90 border-slate-700 text-white'
        }`}>
          <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${
            toast.type === 'success' ? 'bg-white/20' : 'bg-black/20'
          }`}>
            <span className="material-symbols-outlined font-black">
              {toast.type === 'success' ? 'check_circle' : toast.type === 'warning' ? 'warning' : 'notifications_active'}
            </span>
          </div>
          <p className="text-xs font-black uppercase tracking-tight leading-tight flex-1">{toast.message}</p>
        </div>
      </motion.div>
    )}
  </div>
  );
}

export default App;

}
