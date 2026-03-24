import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function QuestCenterView() {
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

  const ranking = [
    { name: "Estevan", level: 12, xp: 1250, avatar: "Aneka", rank: 1 },
    { name: "Mariana", level: 11, xp: 980, avatar: "Zoe", rank: 2 },
    { name: "Ricardo", level: 10, xp: 2200, avatar: "Jasper", rank: 3 },
    { name: "Juliana", level: 9, xp: 1500, avatar: "Sasha", rank: 4 },
    { name: "Lucas", level: 8, xp: 800, avatar: "Felix", rank: 5 },
  ];

  return (
    <div className="absolute inset-0 z-[190] bg-slate-950 flex flex-col hide-scrollbar overflow-y-auto pb-32">
      <header className="p-8 pt-12 flex items-center justify-between sticky top-0 bg-slate-950/90 backdrop-blur-2xl z-30">
         <div className="flex items-center gap-4">
            <button 
              onClick={() => setSubView("none")}
              className="size-11 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 active:scale-90 transition-all border border-white/10"
            >
              <span className="material-symbols-outlined font-black">arrow_back</span>
            </button>
            <div>
               <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none mb-1">Quests & Social</h2>
               <p className="text-[9px] text-primary font-black uppercase tracking-[0.3em]">Status de Batalha</p>
            </div>
         </div>
      </header>

      <main className="px-8 space-y-12 pb-10">
         {/* Level Progress Hero */}
         <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-8 rounded-[45px] border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <span className="material-symbols-outlined text-8xl text-primary animate-pulse">military_tech</span>
            </div>
            <div className="relative z-10">
               <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Temporada 1: Izi Origins</p>
               <h3 className="text-3xl font-black text-white italic tracking-tighter mb-6">BATTLE PASS</h3>
               
               <div className="space-y-3">
                  <div className="flex justify-between items-end">
                     <span className="text-[10px] font-black text-white/40 uppercase">Progresso do Passe</span>
                     <span className="text-xs font-black text-white italic">LVL {userLevel} <span className="text-primary opacity-50">/ 50</span></span>
                  </div>
                  <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(userLevel / 50) * 100}%` }}
                       className="h-full bg-primary shadow-[0_0_15px_rgba(255,217,0,0.4)]"
                     />
                  </div>
               </div>
            </div>
         </div>

         {/* Tabs: Quests / Ranking */}
         <div className="space-y-8">
            <div className="flex items-center justify-between">
               <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic">Quests Diárias</h3>
               <span className="text-[9px] font-black text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">Reseta em 14h</span>
            </div>
            
            <div className="space-y-4">
               {quests.map((q, i) => (
                  <motion.div 
                    key={q.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="p-6 bg-white/5 rounded-[35px] border border-white/5 flex items-center gap-6 group hover:bg-white/[0.08] transition-all"
                  >
                     <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform relative overflow-hidden shadow-xl" style={{ color: q.color }}>
                        <div className="absolute inset-0 opacity-10" style={{ backgroundColor: q.color }} />
                        <span className="material-symbols-outlined text-3xl font-black relative z-10">{q.icon}</span>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-sm font-black text-white uppercase tracking-tight">{q.title}</h4>
                        <p className="text-[10px] font-medium text-white/30 uppercase tracking-widest mt-1 mb-3">{q.desc}</p>
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-1000" 
                                style={{ width: `${(q.progress / q.total) * 100}%`, backgroundColor: q.color }} 
                              />
                           </div>
                           <span className="text-[10px] font-black text-white/40 tabular-nums">{q.progress}/{q.total}</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-[10px] font-black text-primary italic">+{q.xp} XP</p>
                     </div>
                  </motion.div>
               ))}
            </div>
         </div>

         {/* Global Ranking */}
         <div className="space-y-8">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] italic">Lendários da Cidade</h3>
            <div className="bg-white/5 rounded-[45px] border border-white/5 overflow-hidden">
               {ranking.map((item, i) => (
                  <div 
                    key={i}
                    className={`flex items-center gap-5 p-6 border-b border-white/[0.03] last:border-none ${item.name === "Estevan" ? "bg-primary/5" : ""}`}
                  >
                     <div className="w-8 text-center">
                        <span className={`text-xs font-black italic ${i < 3 ? 'text-primary' : 'text-white/20'}`}>#{item.rank}</span>
                     </div>
                     <div className={`size-12 rounded-xl border-2 ${item.name === "Estevan" ? "border-primary" : "border-white/10"} p-1`}>
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.avatar}`} className="size-full object-cover rounded-lg" />
                     </div>
                     <div className="flex-1">
                        <p className={`text-sm font-black ${item.name === "Estevan" ? "text-primary" : "text-white"}`}>{item.name}</p>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Nível {item.level} • {item.xp} XP</p>
                     </div>
                     {i === 0 && <span className="material-symbols-outlined text-primary fill-1">military_tech</span>}
                  </div>
               ))}
            </div>
         </div>
      </main>
    </div>
  );

}
