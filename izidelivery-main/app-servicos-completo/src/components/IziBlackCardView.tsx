import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useServices } from '../context/ServicesContext';

export default function IziBlackCardView() {
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

  const iziCoins = Math.floor(userXP * 2.5);
  const nextTierCoins = Math.floor(nextLevelXP * 2.5);
  const progressPercent = Math.min(100, (iziCoins / nextTierCoins) * 100);
  
  const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master'];
  const currentTierName = tierNames[Math.min(userLevel - 1, tierNames.length - 1)] || 'Bronze';
  const nextTierName = tierNames[Math.min(userLevel, tierNames.length - 1)] || 'Master';
  const circumference = 2 * Math.PI * 54;
  const dashOffset = circumference - (progressPercent / 100) * circumference;

  const perks = [
    { id: 'frete', icon: 'local_shipping', label: 'Frete Grátis', active: true },
    { id: 'cashback', icon: 'monetization_on', label: 'Cashback 5%', active: true },
    { id: 'priority', icon: 'support_agent', label: 'Priority', active: true },
    { id: 'seguro', icon: 'shield', label: 'Seguro', active: userLevel >= 2 },
    { id: 'surprise', icon: 'card_giftcard', label: 'Surprise', active: userLevel >= 3 },
    { id: 'fastmatch', icon: 'bolt', label: 'Fast Match', active: userLevel >= 4 },
  ];

  return (
    <div className="absolute inset-0 z-[170] bg-[#050505] flex flex-col hide-scrollbar overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.025]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] -mt-72 pointer-events-none z-0">
        <div className="absolute inset-0 rounded-full bg-primary/[0.06] blur-[150px]" style={{ animation: 'pulse 6s ease-in-out infinite alternate' }} />
      </div>

      <header className="px-7 pt-12 pb-4 flex items-center justify-between sticky top-0 z-20" style={{ background: 'linear-gradient(to bottom, #050505 70%, transparent)' }}>
        <p className="text-[10px] font-black text-primary/50 uppercase tracking-[0.4em]">Izi Black</p>
        <button onClick={() => setShowIziBlackCard(false)} className="size-9 rounded-full bg-white/[0.04] flex items-center justify-center text-white/20 active:scale-90 transition-all">
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </header>

      <main className="relative z-10 pb-40">
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="text-center pt-4 pb-12 px-7">
          <div className="relative inline-block mb-6">
            <svg width="140" height="140" viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
              <motion.circle cx="60" cy="60" r="54" fill="none" stroke="url(#coinGrad2)" strokeWidth="4" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: dashOffset }} transition={{ duration: 2.5, ease: "easeOut", delay: 0.3 }} />
              <defs><linearGradient id="coinGrad2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#FFD900" /><stop offset="50%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#FFD900" /></linearGradient></defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2, type: "spring", bounce: 0.4 }} className="text-5xl font-black text-white leading-none tracking-tighter">{userLevel}</motion.span>
            </div>
          </div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em] mb-2">{currentTierName}</p>
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-1">Membro Fundador</h1>
            <p className="text-[10px] text-white/15 font-bold">{progressPercent.toFixed(0)}% para {nextTierName}</p>
          </motion.div>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center pb-12 px-7">
          <div className="inline-flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-primary/[0.06]">
            <span className="text-sm">🪙</span>
            <span className="text-[9px] font-black text-primary/70 uppercase tracking-[0.3em]">IziCoin</span>
          </div>
          <motion.h2 initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6, type: "spring" }} className="text-6xl font-black text-white tabular-nums tracking-tighter leading-none mb-2">{iziCoins.toLocaleString('pt-BR')}</motion.h2>
          <p className="text-[10px] text-white/15 font-bold">+5 coins a cada R$ 1 gasto</p>
        </motion.section>

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="flex items-center justify-center gap-6 pb-12">
          {[
            { value: myOrders.length, label: 'Pedidos' },
            { value: `R$${iziCashbackEarned.toFixed(0)}`, label: 'Cashback' },
            { value: `R$${(myOrders.length * 5).toFixed(0)}`, label: 'Economia' },
          ].map((stat, i) => (
            <Fragment key={i}>
              {i > 0 && <div className="w-px h-8 bg-white/[0.06]" />}
              <div className="text-center">
                <p className="text-lg font-black text-white tracking-tight leading-none mb-0.5">{stat.value}</p>
                <p className="text-[8px] font-black text-white/15 uppercase tracking-widest">{stat.label}</p>
              </div>
            </Fragment>
          ))}
        </motion.section>

        <div className="mx-7 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="py-10">
          <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em] px-7 mb-5">Benefícios ativos</p>
          <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-7">
            {perks.map((perk, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: perk.active ? 1 : 0.25, y: 0 }} 
                transition={{ delay: 0.9 + i * 0.06 }} 
                whileTap={{ scale: 0.95 }} 
                onClick={() => perk.active && perk.id ? setActivePerkDetail(activePerkDetail === perk.id ? null : perk.id) : null}
                className={`shrink-0 flex items-center gap-2.5 py-3 px-5 rounded-full cursor-pointer transition-all ${
                  activePerkDetail === perk.id 
                    ? 'bg-primary/[0.12] ring-1 ring-primary/30' 
                    : perk.active ? 'bg-white/[0.04]' : 'bg-white/[0.015]'
                }`}
              >
                <span className={`material-symbols-outlined text-base fill-1 ${perk.active ? 'text-primary' : 'text-white/15'}`}>{perk.icon}</span>
                <span className={`text-[11px] font-black tracking-tight whitespace-nowrap ${perk.active ? 'text-white' : 'text-white/20'}`}>{perk.label}</span>
                {!perk.active && <span className="text-[9px]">🔒</span>}
                {perk.active && perk.id && <span className={`material-symbols-outlined text-[10px] ${activePerkDetail === perk.id ? 'text-primary' : 'text-white/15'}`}>{activePerkDetail === perk.id ? 'expand_less' : 'expand_more'}</span>}
              </motion.div>
            ))}
          </div>

          {/* ── Painel expandível do benefício selecionado ── */}
          <AnimatePresence>
            {activePerkDetail === 'frete' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }} className="overflow-hidden px-7"
              >
                <div className="pt-6 pb-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">Cupons de Frete Grátis</p>
                  {availableCoupons.filter(c => c.is_vip && (c.title?.toLowerCase().includes('frete') || c.discount_type === 'shipping')).length > 0 ? (
                    <div className="space-y-2.5">
                      {availableCoupons.filter(c => c.is_vip && (c.title?.toLowerCase().includes('frete') || c.discount_type === 'shipping')).map((cpn, ci) => (
                        <div key={ci} className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.03]">
                          <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-emerald-400 text-base fill-1">local_shipping</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-white tracking-tight leading-none mb-0.5">{cpn.title || 'Frete Grátis'}</p>
                            <p className="text-[9px] text-white/20 font-bold">{cpn.coupon_code ? `Código: ${cpn.coupon_code}` : 'Aplicado automaticamente'}</p>
                          </div>
                          {cpn.coupon_code && (
                            <button onClick={() => { navigator.clipboard.writeText(cpn.coupon_code); setCopiedCoupon(cpn.id || cpn.coupon_code); setTimeout(() => setCopiedCoupon(null), 2000); }} className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                              {!!copiedCoupon && copiedCoupon === (cpn.id || cpn.coupon_code) ? 'Copiado!' : 'Copiar'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-white/10 text-3xl mb-2 block">local_shipping</span>
                      <p className="text-[11px] text-white/20 font-bold">Frete grátis automático em pedidos acima de R$ 50</p>
                      <p className="text-[9px] text-white/10 mt-1">Aplicado automaticamente no checkout</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activePerkDetail === 'cashback' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }} className="overflow-hidden px-7"
              >
                <div className="pt-6 pb-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">Detalhes do Cashback</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.03]">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="material-symbols-outlined text-primary text-base fill-1">trending_up</span></div>
                        <div>
                          <p className="text-[12px] font-black text-white">5% em todos os pedidos</p>
                          <p className="text-[9px] text-white/20 font-bold">Crédito automático na carteira</p>
                        </div>
                      </div>
                      <p className="text-lg font-black text-primary">R${iziCashbackEarned.toFixed(0)}</p>
                    </div>
                    <p className="text-[9px] text-white/10 text-center">O cashback é creditado automaticamente após a confirmação da entrega</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activePerkDetail === 'surprise' && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }} className="overflow-hidden px-7"
              >
                <div className="pt-6 pb-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest mb-4">Surpresas Disponíveis</p>
                  {availableCoupons.filter(c => c.is_vip).length > 0 ? (
                    <div className="space-y-2.5">
                      {availableCoupons.filter(c => c.is_vip).map((cpn, ci) => (
                        <div key={ci} className="flex items-center gap-3.5 p-4 rounded-2xl bg-white/[0.03]">
                          <div className="size-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-violet-400 text-base fill-1">redeem</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-white tracking-tight leading-none mb-0.5">{cpn.title || 'Surpresa VIP'}</p>
                            <p className="text-[9px] text-white/20 font-bold">
                              {cpn.discount_type === 'percent' ? `${cpn.discount_value}% OFF` : `R$ ${cpn.discount_value} OFF`}
                            </p>
                          </div>
                          {cpn.coupon_code && (
                            <button onClick={() => { navigator.clipboard.writeText(cpn.coupon_code); setCopiedCoupon(cpn.id || cpn.coupon_code); setTimeout(() => setCopiedCoupon(null), 2000); }} className="px-3 py-1.5 rounded-xl bg-violet-500/10 text-violet-400 text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all">
                              {!!copiedCoupon && copiedCoupon === (cpn.id || cpn.coupon_code) ? 'Copiado!' : 'Resgatar'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <span className="material-symbols-outlined text-white/10 text-3xl mb-2 block">card_giftcard</span>
                      <p className="text-[11px] text-white/20 font-bold">Nenhuma surpresa disponível agora</p>
                      <p className="text-[9px] text-white/10 mt-1">Novas surpresas são adicionadas todo mês!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <div className="mx-7 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="py-10 px-7 space-y-1">
          {[
            { icon: 'military_tech', title: 'Izi Battle Pass', sub: 'Missões e ranking', action: () => { setShowIziBlackCard(false); setSubView("quest_center"); }, active: true },
            { icon: 'workspace_premium', title: 'Próximas Recompensas', sub: 'Desbloqueie mais benefícios', action: () => setShowMasterPerks(true), active: true },
            { icon: 'share', title: 'Indicar Amigos', sub: 'Ganhe coins por indicação', action: () => {}, active: false },
          ].map((item, i) => (
            <Fragment key={i}>
              <motion.div whileTap={{ scale: 0.98 }} onClick={item.action} className={`flex items-center justify-between py-5 cursor-pointer group ${!item.active ? 'opacity-30' : ''}`}>
                <div className="flex items-center gap-4">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${item.active ? 'bg-primary/[0.08]' : 'bg-white/[0.03]'}`}>
                    <span className={`material-symbols-outlined text-lg fill-1 ${item.active ? 'text-primary' : 'text-white/20'}`}>{item.icon}</span>
                  </div>
                  <div>
                    <h4 className="text-[13px] font-black text-white tracking-tight">{item.title}</h4>
                    <p className="text-[9px] text-white/15 font-bold uppercase tracking-widest">{item.sub}</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-white/10 text-base group-hover:text-primary group-hover:translate-x-1 transition-all">arrow_forward_ios</span>
              </motion.div>
              {i < 2 && <div className="h-px bg-white/[0.03]" />}
            </Fragment>
          ))}
        </motion.section>

        <div className="text-center pt-8 pb-4 px-7">
          <p className="text-[8px] font-black text-white/[0.06] uppercase tracking-[0.5em]">Izi Black · Membro desde 2026</p>
        </div>
      </main>
    </div>
  );

}
