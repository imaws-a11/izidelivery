import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function ExclusiveOfferView() {
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

  const displayDeals = flashOffers.length > 0 ? flashOffers.map(f => ({
    id: f.id,
    name: f.product_name,
    store: f.admin_users?.store_name || 'Loja Parceira',
    img: f.product_image || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
    oldPrice: Number(f.original_price),
    price: Number(f.discounted_price),
    off: `${f.discount_percent}% OFF`,
    desc: f.description || 'Oferta exclusiva e por tempo limitado para membros Izi Black.'
  })) : [
    {
      id: 'vip-burger-1',
      name: 'The Ultimate Izi Black Burger',
      store: 'Burger Gourmet Lab',
      img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600',
      oldPrice: 59.90,
      price: 29.95,
      off: '50% OFF',
      desc: 'Blend de carne Angus 180g, queijo brie maçaricado, cebola caramelizada no Jack Daniels e pão brioche artesanal.'
    },
    {
      id: 'vip-pizza-1',
      name: 'Pizza Trufada Individual',
      store: 'Forneria d\'Oro',
      img: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600',
      oldPrice: 72.00,
      price: 36.00,
      off: '50% OFF',
      desc: 'Massa de fermentação natural, mozzarella fior di latte, azeite de trufas brancas e manjericão fresco.'
    }
  ];

  return (
    <div className="absolute inset-0 z-[100] bg-zinc-950 text-white flex flex-col hide-scrollbar overflow-y-auto pb-40">
      {/* Luxury Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 size-[600px] bg-yellow-400/[0.02] blur-[120px] rounded-full -translate-y-1/2" />
      </div>

      <header className="relative z-10 p-8 flex flex-col items-center gap-8 pt-12">
        <div className="w-full flex items-center justify-between">
          <button 
            onClick={() => setSubView("none")} 
            className="size-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center active:scale-90 transition-all group"
          >
            <span className="material-symbols-outlined font-black text-zinc-400 group-hover:text-white transition-colors">arrow_back</span>
          </button>
          
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-yellow-400 text-sm fill-1">bolt</span>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">Ofertas Flash</span>
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">Exclusivo Membros Izi Black</p>
          </div>

          <div className="size-12 rounded-full bg-yellow-400/5 border border-yellow-400/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-yellow-400 font-black animate-pulse">stars</span>
          </div>
        </div>

        {/* Luxury Timer Panel */}
        <div className="relative w-full max-w-[340px] rounded-[40px] bg-white/[0.02] border border-white/[0.05] p-8 flex flex-col items-center justify-center gap-2 overflow-hidden shadow-none">
           <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent" />
           <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">As ofertas terminam em:</p>
           <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{timeLeft.h}</span>
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Horas</span>
              </div>
              <span className="text-4xl font-black text-yellow-400 -mt-2">:</span>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{timeLeft.m}</span>
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Minutos</span>
              </div>
              <span className="text-4xl font-black text-yellow-400 -mt-2">:</span>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black text-white tabular-nums tracking-tighter">{timeLeft.s}</span>
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest opacity-60">Segundos</span>
              </div>
           </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-4 flex flex-col items-center gap-10">
        {displayDeals.map((deal, i) => (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            key={deal.id}
            onClick={() => { handleAddToCart(deal); }}
            className="w-full max-w-[340px] bg-zinc-900/50 rounded-[50px] overflow-hidden border border-white/[0.05] flex flex-col items-center group cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-900"
          >
            <div className="w-full h-80 relative">
              <img src={deal.img} className="size-full object-cover group-hover:scale-105 transition-transform duration-[3000ms]" />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
              <div className="absolute top-6 left-6 bg-yellow-400 px-6 py-2 rounded-full shadow-lg shadow-yellow-400/20">
                <span className="text-[10px] text-black font-black uppercase tracking-widest">{deal.off}</span>
              </div>
            </div>
            
            <div className="p-10 flex flex-col items-center text-center -mt-16 relative z-10 w-full">
              <h3 className="text-2xl font-black text-white tracking-tighter leading-tight mb-2 drop-shadow-xl">{deal.name}</h3>
              <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-4 opacity-80">{deal.store}</p>
              <p className="text-[11px] text-zinc-500 font-medium mb-8 max-w-[260px] line-clamp-2">{deal.desc}</p>
              
              <div className="w-full flex flex-col items-center gap-6">
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-black text-zinc-700 line-through tracking-widest mb-1">R$ {deal.oldPrice.toFixed(2).replace('.', ',')}</span>
                  <span className="text-4xl font-black text-white tracking-tighter flex items-center gap-2">
                    <span className="text-yellow-400 text-lg uppercase font-black">R$</span>
                    {deal.price.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                
                <div className="w-full bg-white/[0.03] border border-white/5 py-4 rounded-full group-hover:bg-yellow-400 group-hover:border-yellow-400 transition-all flex items-center justify-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 group-hover:text-black transition-colors">Adicionar ao Carrinho</span>
                  <span className="material-symbols-outlined text-base text-yellow-400 group-hover:text-black transition-colors">add_circle</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );

}
