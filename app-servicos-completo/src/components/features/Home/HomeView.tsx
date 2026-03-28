import React from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface HomeViewProps {
  userLevel: number;
  userId: string | null;
  userLocation: { address: string; loading: boolean };
  cart: any[];
  myOrders: any[];
  navigateSubView: (view: string) => void;
  setSubView: (view: string) => void;
  subView: string;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setSelectedItem: (item: any) => void;
  availableCoupons: any[];
  copiedCoupon: string | null;
  setCopiedCoupon: (val: string | null) => void;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  setShowMasterPerks: (val: boolean) => void;
  ESTABLISHMENTS: any[];
  handleShopClick: (shop: any) => void;
  flashOffers: any[];
  banners: any[];
  setActiveService: (svc: any) => void;
  transitData: any;
  setTransitData: (data: any) => void;
  setExploreCategoryState: (state: any) => void;
  setRestaurantInitialCategory: (cat: string) => void;
  isIziBlackMembership: boolean;
  setTab: (tab: "home" | "orders" | "wallet" | "profile") => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userLevel,
  userId,
  userLocation,
  cart,
  myOrders,
  navigateSubView,
  setSubView,
  subView,
  searchQuery,
  setSearchQuery,
  setSelectedItem,
  availableCoupons,
  copiedCoupon,
  setCopiedCoupon,
  showToast,
  setShowMasterPerks,
  ESTABLISHMENTS,
  handleShopClick,
  banners,
  flashOffers,
  setActiveService,
  transitData,
  setTransitData,
  setExploreCategoryState,
  setRestaurantInitialCategory,
  isIziBlackMembership,
  setTab,
}) => {
  const [activeBannerIndex, setActiveBannerIndex] = React.useState(0);

  // Auto-scroll banners
  React.useEffect(() => {
    if (banners && banners.length > 1) {
      const interval = setInterval(() => {
        setActiveBannerIndex(prev => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [banners?.length]);

  const handleBannerClickAction = (banner: any) => {
    if (banner.target_view) {
      navigateSubView(banner.target_view);
    } else if (isIziBlackMembership) {
      navigateSubView("exclusive_offer");
    } else {
      navigateSubView("izi_black_purchase");
    }
  };

  const deliveryServices = [
    { icon: "restaurant",     label: "Food",         type: "restaurant", action: () => { setRestaurantInitialCategory("Todos"); navigateSubView("restaurant_list"); } },
    { icon: "rice_bowl",      label: "Almoço",       type: "restaurant", action: () => { setRestaurantInitialCategory("Almoço"); navigateSubView("restaurant_list"); } },
    { icon: "local_mall",     label: "Mercados",     type: "market",     action: null },
    { icon: "local_bar",      label: "Bebidas",      type: "beverages",  action: null },
    { icon: "local_pharmacy", label: "Saúde",        type: "pharmacy",   action: null },
    { icon: "pedal_bike",     label: "Logística",    type: null,         action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("explore_envios"); } },
    { icon: "pets",           label: "Petshop",      type: "generic",    action: () => { setExploreCategoryState({ id: "pets", title: "Pet Shop Premium", tagline: "Mimo para seu melhor amigo", primaryColor: "rose-500", icon: "pets", banner: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200" }); navigateSubView("explore_category"); } },
  ];

  const handleServiceSelection = (cat: any) => {
    if (cat.action) return cat.action();
    setActiveService(cat);
    
    if (cat.type === "restaurant") {
       setRestaurantInitialCategory("Todos");
       navigateSubView("restaurant_list");
    }
    else if (cat.type === "market") navigateSubView("market_list");
    else if (cat.type === "pharmacy") navigateSubView("pharmacy_list");
    else if (cat.type === "beverages") navigateSubView("beverages_list");
    else navigateSubView("generic_list");
  };

  const activeStories = (flashOffers || []).map((offer: any) => {
    const expiresAt = new Date(offer.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeLeft = diffHrs > 0 ? diffHrs + "h" : diffMins + "min";
    const savings = offer.original_price && offer.discounted_price
      ? Number(offer.original_price) - Number(offer.discounted_price)
      : offer.original_price && offer.discount_percent
        ? Number(offer.original_price) * (Number(offer.discount_percent) / 100)
        : null;
    
    const discount = savings 
      ? `- R$ ${savings.toFixed(2).replace('.', ',')}` 
      : "Oferta Flash";

    return {
      id: offer.id,
      merchant: offer.admin_users?.store_name || offer.merchant_name || "Loja",
      name: offer.product_name,
      discount,
      timeLeft,
      img: offer.product_image || offer.admin_users?.store_logo || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400",
      isMaster: userLevel >= 10 && offer.is_vip,
      offer,
    };
  });

  const activeOrder = myOrders.find(o => !["concluido", "cancelado"].includes(o.status));

  return (
    <div className="flex flex-col bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar h-full">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-[60] flex flex-col w-full bg-black/40 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
        <div className="flex justify-between items-center px-5 py-3">
          <button 
            onClick={() => { setTab("profile"); window.history.pushState({ view: "app", tab: "profile", subView: "none" }, ""); }}
            className="relative active:scale-95 transition-all"
          >
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400/20 hover:border-yellow-400 transition-colors">
              <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" />
            </div>
            {isIziBlackMembership && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(255,215,9,0.5)] border border-black z-10">
                <span className="material-symbols-outlined text-[10px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
              </div>
            )}
          </button>

          <div className="flex-1 flex flex-col items-center cursor-pointer group px-4" onClick={() => setSubView(subView === "addresses" ? "none" : "addresses")}>
            <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.2em] leading-none mb-1">Entregas em</p>
            <div className="flex items-center gap-1 max-w-full">
              <span className="text-white font-black text-xs tracking-tight truncate leading-none">
                {userLocation.loading ? "Buscando..." : userLocation.address || "Definir endereço"}
              </span>
              <span className="material-symbols-outlined text-yellow-400 text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button onClick={() => cart.length > 0 && navigateSubView("cart")} 
              className="group relative w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/40 border border-white/5 hover:bg-zinc-800 transition-all active:scale-95">
              <span className="material-symbols-outlined text-zinc-100 text-xl group-hover:text-yellow-400 transition-colors">shopping_bag</span>
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 size-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black animate-in fade-in zoom-in duration-300">
                  {cart.length}
                </span>
              )}
            </button>
            <button onClick={() => setSubView("quest_center")} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-900/40 border border-white/5 hover:bg-zinc-800 transition-all active:scale-95">
              <span className="material-symbols-outlined text-zinc-100 text-xl">notifications</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex flex-col">
        {/* BANNER GIGANTE IMERSIVO */}
        <section className="relative w-full h-[380px] overflow-hidden group">
          <AnimatePresence mode="wait">
            {banners && banners.length > 0 ? (
              <motion.div
                key={banners[activeBannerIndex]?.id}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.8 }}
                onClick={() => handleBannerClickAction(banners[activeBannerIndex])}
                className="absolute inset-0 cursor-pointer"
              >
                <img 
                  className="w-full h-full object-cover brightness-[0.8] saturate-[1.2]" 
                  src={banners[activeBannerIndex]?.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200"} 
                  alt={banners[activeBannerIndex]?.title || "Promoção Izi"} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />

                <div className="absolute inset-x-0 bottom-0 px-6 pb-12 z-20">
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col"
                  >
                    <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] w-fit mb-4 border border-white/10">
                      Exclusivo Izi
                    </span>
                    <h2 className="text-4xl font-black text-white leading-[0.9] tracking-tighter uppercase italic drop-shadow-2xl">
                      {banners[activeBannerIndex]?.title || "Experimente o Novo"}
                    </h2>
                    <p className="text-zinc-300 text-xs font-medium mt-4 line-clamp-2 max-w-[280px] leading-relaxed drop-shadow-lg">
                      {banners[activeBannerIndex]?.description || "Confira as melhores ofertas selecionadas especialmente para você hoje."}
                    </p>
                    <div className="flex gap-4 mt-8">
                       <button className="flex items-center gap-2 px-8 py-3.5 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl shadow-yellow-400/20">
                          Aproveitar Agora
                       </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-zinc-900 flex items-center justify-center"
              >
                <img className="absolute inset-0 w-full h-full object-cover brightness-[0.4]" src="https://images.unsplash.com/photo-1621939106968-3e28cb404c04?q=80&w=1200" alt="Izi" />
                <div className="relative z-10 text-center">
                  <h2 className="text-2xl font-black text-white uppercase italic">Seja Izi Black</h2>
                  <p className="text-zinc-400 text-[10px] mt-2 uppercase tracking-widest">Taxa zero e benefícios reais</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {banners && banners.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-1.5 z-30">
              {banners.map((_: any, i: number) => (
                <div 
                  key={i} 
                  className={`h-1 rounded-full transition-all duration-500 ${i === activeBannerIndex ? 'w-6 bg-yellow-400' : 'w-2 bg-white/20'}`}
                />
              ))}
            </div>
          )}
        </section>

        <div className="px-5 -mt-6 relative z-30 space-y-12 pb-12">
          {/* SEARCH */}
          <div className="relative group shadow-2xl shadow-black/40">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-colors text-xl">search</span>
            </div>
            <input
              className="w-full bg-zinc-900/90 backdrop-blur-xl border border-white/5 rounded-2xl py-4.5 pl-14 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all text-sm font-semi-bold"
              placeholder="O que você deseja pedir hoje?"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* PEDIDO ATIVO */}
          {activeOrder && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { setSelectedItem(activeOrder); setSubView("active_order"); }}
              className="bg-yellow-400 text-black p-4 rounded-3xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden group border border-white/20"
            >
              <div className="size-10 rounded-2xl bg-black/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">moped</span>
              </div>
              <div className="flex-1">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-black/60 leading-none mb-1">Status do Izi</p>
                <h4 className="font-black text-xs leading-none uppercase tracking-tight">O seu pedido está {activeOrder.status}</h4>
              </div>
              <span className="material-symbols-outlined text-black animate-bounce">arrow_forward</span>
            </motion.div>
          )}

          {/* IZI FLASH HIGHLIGHTS */}
          {activeStories.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-red-500 animate-ping" />
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Izi Flash</h3>
                </div>
                <span className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">AO VIVO</span>
              </div>
              
              <div className="flex gap-5 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5 h-[180px]">
                {activeStories.map(story => (
                  <motion.div 
                    key={story.id} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (story.isMaster && userLevel < 10) showToast("Esta oferta é exclusiva para membros Tier MASTER.", "info");
                      else if (story.isMaster) setShowMasterPerks(true);
                      else showToast(`Izi Flash: Oferta de ${story.discount} ativada para ${story.merchant}! ${story.name || ""}`, "success");
                    }}
                    className={`relative flex-shrink-0 w-32 h-[170px] rounded-[32px] p-[1.5px] bg-gradient-to-tr ${story.isMaster ? "from-yellow-400 via-zinc-800 to-amber-600 shadow-[0_4px_20px_rgba(255,215,9,0.3)]" : "from-red-500 via-rose-500 to-orange-400 shadow-[0_4px_20px_rgba(239,68,68,0.2)]"} cursor-pointer transition-all group`}
                  >
                    <div className="size-full rounded-[30.5px] overflow-hidden bg-zinc-900 border-[2px] border-zinc-950 relative">
                      <img src={story.img} className="size-full object-cover brightness-75 group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 z-20">
                         <span className="text-[7px] font-black text-white whitespace-nowrap">{story.timeLeft}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-[8px] font-bold text-white/60 uppercase tracking-tighter truncate leading-none mb-1">{story.merchant}</p>
                        <h5 className="text-[12px] font-black text-yellow-400 leading-tight tracking-tight uppercase italic">{story.discount}</h5>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* CUPONS HIGHLIGHTS */}
          {availableCoupons.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-sm font-black tracking-[0.2em] text-white uppercase italic">Meus Descontos</h3>
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{availableCoupons.length} ATIVOS</span>
              </div>
              
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
                {availableCoupons.map((coupon, i) => {
                  const isCopied = copiedCoupon === coupon.coupon_code;
                  return (
                    <motion.div 
                      key={coupon.id || i} 
                      initial={{ opacity: 0, x: 20 }} 
                      animate={{ opacity: 1, x: 0 }} 
                      transition={{ delay: i * 0.1 }}
                      className="relative flex-shrink-0 w-[240px] h-[100px] rounded-[24px] overflow-hidden group cursor-pointer border border-white/5 transition-all"
                    >
                       <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/80 to-zinc-900/40 backdrop-blur-xl group-hover:from-yellow-400/10 group-hover:to-zinc-800 transition-colors" />
                       <div className="relative z-10 h-full p-4 flex justify-between items-center gap-3">
                          <div className="flex-1">
                             <div className="flex items-center gap-1.5 mb-2">
                                <span className="material-symbols-outlined text-[12px] text-yellow-400">confirmation_number</span>
                                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">CUPOM ATIVO</span>
                             </div>
                             <h5 className="text-lg font-black text-white font-mono leading-none tracking-[0.1em]">{coupon.coupon_code}</h5>
                             <p className="text-zinc-500 text-[9px] mt-2 font-bold uppercase tracking-tighter">
                                {coupon.discount_type === "fixed" ? `R$${coupon.discount_value} OFF` : `${coupon.discount_value}% OFF`}
                                {coupon.min_order_value > 0 && ` • +R$${coupon.min_order_value}`}
                             </p>
                          </div>
                          
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation();
                              navigator.clipboard.writeText(coupon.coupon_code).catch(() => {}); 
                              setCopiedCoupon(coupon.coupon_code); 
                              setTimeout(() => setCopiedCoupon(null), 2000); 
                              showToast("Código copiado! \uD83C\uDFAB", "success");
                            }}
                            className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isCopied ? "bg-emerald-500" : "bg-white/10 group-hover:bg-yellow-400 group-hover:text-black"}`}
                          >
                             <span className={`material-symbols-outlined ${isCopied ? "text-white" : "text-white group-hover:text-black"} text-xl`}>
                               {isCopied ? "check" : "content_copy"}
                             </span>
                          </button>
                       </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* GRADE DE SERVIÇOS */}
          <section className="grid grid-cols-3 gap-y-12 gap-x-8">
            {deliveryServices.map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleServiceSelection(svc)}
                className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-all"
              >
                <div className="relative w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 bg-yellow-400/5 blur-[25px] rounded-full opacity-60 group-hover:opacity-100 transition-all duration-500" />
                  <div className="relative z-10 w-16 h-16 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-4xl text-white group-hover:text-yellow-400 transition-colors">
                      {svc.icon}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black text-zinc-500 group-hover:text-zinc-100 tracking-[0.2em] uppercase transition-colors text-center">{svc.label}</span>
              </motion.div>
            ))}
          </section>

          {/* MOBILIDADE */}
          <section className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black rounded-[40px] p-8 border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 size-60 bg-yellow-400 opacity-[0.03] blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-1000" />
            <div className="flex flex-col items-center mb-10 text-center relative z-10">
              <span className="bg-yellow-400/10 text-yellow-400 text-[8px] font-black px-3 py-1 rounded-full tracking-[0.4em] uppercase mb-3 border border-yellow-400/20">Izi Connect</span>
              <h2 className="text-3xl font-black tracking-tighter text-white italic uppercase leading-none">Vá de Izi.</h2>
            </div>
            <div className="grid grid-cols-2 gap-y-12 gap-x-8 relative z-10 p-2">
              {[
                { icon: "two_wheeler", label: "Mototáxi", action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false }); navigateSubView("taxi_wizard"); } },
                { icon: "airport_shuttle", label: "Vans Izi", action: () => { setTransitData({ ...transitData, type: "van", scheduled: false }); navigateSubView("van_wizard"); } },
                { icon: "directions_car", label: "Carros", action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false }); navigateSubView("taxi_wizard"); } },
                { icon: "local_shipping", label: "Logística", action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("freight_wizard"); } },
              ].map((svc, i) => (
                <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={svc.action} className="flex flex-col items-center gap-4 group cursor-pointer transition-all">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white group-hover:text-yellow-400 transition-all duration-500">
                      {svc.icon}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-500 group-hover:text-white tracking-[0.2em] uppercase transition-colors text-center leading-tight">
                    {svc.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* FAVORITOS */}
          <section className="space-y-6">
            <div className="flex justify-between items-end px-1">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter text-white italic uppercase leading-none">Top Region</h3>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Os melhores perto de você</p>
                </div>
              </div>
              <button className="text-[10px] font-black text-yellow-400 uppercase tracking-widest px-4 py-2 bg-yellow-400/10 rounded-2xl border border-yellow-400/20 active:scale-95 transition-all">Ver todos</button>
            </div>
            
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-5 px-5">
              {ESTABLISHMENTS.map((shop, i) => (
                <motion.div 
                  key={shop.id || i}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleShopClick(shop)}
                  className="relative flex-shrink-0 w-[200px] group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-[40px] overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-700 group-hover:border-white/20 group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.8)] shadow-2xl">
                    <img src={shop.img} className="size-full object-cover brightness-[0.7] group-hover:scale-110 transition-transform duration-1000" alt={shop.name} />
                    <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/40 to-transparent p-6 flex flex-col justify-end">
                      <div className="flex items-center gap-2 mb-3">
                         <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-xl border border-white/10">
                            <span className="material-symbols-outlined text-yellow-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-[11px] font-black text-white">{shop.rating}</span>
                         </div>
                         <span className="text-[9px] font-black text-white/50 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/10 uppercase tracking-tighter">{shop.time}</span>
                      </div>
                      <h4 className="text-base font-black text-white leading-tight tracking-tight uppercase italic">{shop.name}</h4>
                      <p className="text-[10px] font-bold text-zinc-400/90 truncate mt-1 uppercase tracking-tighter">{shop.tag}</p>
                    </div>
                    {shop.freeDelivery && (
                      <div className="absolute top-4 right-4 z-20">
                         <div className="bg-yellow-400 text-black p-2 rounded-2xl shadow-2xl flex items-center justify-center border border-black/10">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
                         </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
