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
  subView: 
    | "none"
    | "restaurant_list"
    | "market_list"
    | "pharmacy_list"
    | "restaurant_menu"
    | "product_detail"
    | "checkout"
    | "active_order"
    | "addresses"
    | "payments"
    | "transit_selection"
    | "taxi_wizard"
    | "van_wizard"
    | "freight_wizard"
    | "generic_list"
    | "wallet"
    | "payment_processing"
    | "payment_error"
    | "payment_success"
    | "cart"
    | "burger_list"
    | "pizza_list"
    | "acai_list"
    | "japonesa_list"
    | "store_catalog"
    | "all_pharmacies"
    | "health_plantao"
    | "explore_restaurants"
    | "brasileira_list"
    | "daily_menus"
    | "exclusive_offer"
    | "shipping_details"
    | "beverages_list"
    | "beverage_offers"
    | "explore_category"
    | "explore_envios"
    | "pix_payment"
    | "order_chat"
    | "quest_center"
    | "order_support"
    | "order_feedback"
    | "mobility_payment"
    | "waiting_merchant"
    | "waiting_driver"
    | "scheduled_order"
    | "lightning_payment"
    | "shipping_priority"
    | "izi_black_purchase"
    | "card_payment";
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
        const nextIndex = (activeBannerIndex + 1) % banners.length;
        setActiveBannerIndex(nextIndex);
        
        // Scrollar fisicamente o carrossel
        const carousel = document.getElementById('home-banner-carousel');
        if (carousel) {
          carousel.scrollTo({
            left: carousel.offsetWidth * nextIndex,
            behavior: 'smooth'
          });
        }
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [banners?.length, activeBannerIndex]);

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
    { icon: "restaurant",     img: "/images/comida.png", tagline: "GASTRONOMIA",      highlight: "gold", label: "Comida e Lanche", type: "restaurant", action: () => { setRestaurantInitialCategory("Todos"); navigateSubView("restaurant_list"); } },
    { icon: "rice_bowl",      img: "/images/almoco.png",   tagline: "ALMOÇO EXPRESS",   highlight: "none", label: "Almoço",       type: "restaurant", action: () => { setRestaurantInitialCategory("Almoço"); navigateSubView("restaurant_list"); } },
    { icon: "local_mall",     img: "/images/mercados.png", tagline: "MERCAIDT",         highlight: "cyan", label: "Mercados",     type: "market",     action: null },
    { icon: "local_bar",      img: "/images/bebidas.png",  tagline: "BEBIDAS FINAIS",   highlight: "none", label: "Bebidas",      type: "beverages",  action: null },
    { icon: "local_pharmacy", img: "/images/saude.png",    tagline: "SAÚDE INTEGRAL",   highlight: "cyan", label: "Saúde",        type: "pharmacy",   action: null },
    { icon: "pedal_bike",     img: "/images/envios.png",   tagline: "",                 highlight: "none", label: "Envios",       type: null,         action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("explore_envios"); } },
    { icon: "pets",           img: "/images/petshop.png",  tagline: "CONFORTO PET",     highlight: "gold", label: "Petshop",      type: "generic",    action: () => { setExploreCategoryState({ id: "pets", title: "Pet Shop Premium", tagline: "Mimo para seu melhor amigo", primaryColor: "rose-500", icon: "pets", banner: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200" }); navigateSubView("explore_category"); } },
    { icon: "propane_tank",   img: "/images/gas-agua.png", tagline: "VITAIS",           highlight: "cyan", label: "Gas e Agua",   type: "generic",    action: () => { setExploreCategoryState({ id: "gas", title: "Gás e Água", tagline: "Essencial na sua porta", primaryColor: "blue-500", icon: "propane_tank", banner: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=1200" }); navigateSubView("explore_category"); } },
    { icon: "kebab_dining",   img: "/images/acougue.png",  tagline: "CARNES PRIME",     highlight: "gold", label: "Açougue",      type: "generic",    action: () => { setExploreCategoryState({ id: "açougue", title: "Corte Prime", tagline: "Os melhores cortes selecionados", primaryColor: "red-600", icon: "kebab_dining", banner: "https://images.unsplash.com/photo-1607623273573-599d0086353f?q=80&w=1200" }); navigateSubView("explore_category"); } },
    { icon: "bakery_dining",  img: "/images/padaria.png",  tagline: "PADARIA ARTESANAL",highlight: "gold", label: "Padaria",      type: "generic",    action: () => { setExploreCategoryState({ id: "padaria", title: "Padaria Izi", tagline: "Pão quentinho o dia todo", primaryColor: "amber-600", icon: "bakery_dining", banner: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=1200" }); navigateSubView("explore_category"); } },
    { icon: "nutrition",      img: "/images/hortifruti.png",tagline:"FRESCOR HORTI",    highlight: "cyan", label: "Hortifruti",   type: "generic",    action: () => { setExploreCategoryState({ id: "hortifruti", title: "Hortifruti Izi", tagline: "Do campo para sua casa", primaryColor: "emerald-600", icon: "nutrition", banner: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?q=80&w=1200" }); navigateSubView("explore_category"); } },
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
    
    // Calcula o preco final
    let finalPrice = Number(offer.discounted_price);
    if (!finalPrice && offer.original_price && offer.discount_percent) {
        finalPrice = Number(offer.original_price) * (1 - (Number(offer.discount_percent) / 100));
    }
    
    const originalPrice = Number(offer.original_price);
    const finalPriceFormatted = finalPrice ? finalPrice.toFixed(2).replace('.', ',') : "Flash";
    const originalPriceFormatted = originalPrice ? originalPrice.toFixed(2).replace('.', ',') : "";

    return {
      id: offer.id,
      merchant: offer.admin_users?.store_name || offer.merchant_name || "Loja",
      name: offer.product_name,
      finalPrice: finalPriceFormatted,
      originalPrice: originalPriceFormatted,
      timeLeft,
      img: offer.product_image || offer.admin_users?.store_logo || "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400",
      isMaster: userLevel >= 10 && offer.is_vip,
      offer,
    };
  });

  const activeOrder = myOrders.find(o => !["concluido", "cancelado"].includes(o.status));

  return (
    <div className="flex flex-col bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar h-full">
      {/* HEADER PREMIUM - ILHA FLUTUANTE (DESIGN OTIMIZADO) */}
      <AnimatePresence>
        {subView === "none" && (
          <motion.header 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-4 inset-x-4 z-[60] flex flex-col bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[28px] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <div className="flex justify-between items-center px-4 py-3">
              <button 
                onClick={() => { setTab("profile"); window.history.pushState({ view: "app", tab: "profile", subView: "none" }, ""); }}
                className="relative active:scale-95 transition-all"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-yellow-400/20 hover:border-yellow-400 transition-colors">
                  <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" />
                </div>
                {isIziBlackMembership && (
                  <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black w-3 h-3 rounded-full flex items-center justify-center shadow-lg border border-black z-10">
                    <span className="material-symbols-outlined text-[8px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                )}
              </button>

              <div className="flex-1 flex flex-col items-center cursor-pointer group px-2" onClick={() => setSubView("addresses")}>
                <p className="text-zinc-500 text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-1">Entregas em</p>
                <div className="flex items-center gap-1 max-w-[180px]">
                  <span className="text-white font-black text-[11px] tracking-tight truncate leading-none">
                    {userLocation.loading ? "Buscando..." : userLocation.address || "Definir endereço"}
                  </span>
                  <span className="material-symbols-outlined text-yellow-400 text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => cart.length > 0 && navigateSubView("cart")} 
                  className="group relative w-9 h-9 flex items-center justify-center rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-zinc-100 text-[18px] group-hover:text-yellow-400 transition-colors">shopping_bag</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-black">
                      {cart.length}
                    </span>
                  )}
                </button>
                <button onClick={() => setSubView("quest_center")} 
                  className="w-9 h-9 flex items-center justify-center rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-zinc-100 text-[18px]">notifications</span>
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex flex-col pt-[110px]">
        {/* BANNER GIGANTE IMERSIVO - CARROSSEL SWIPE */}
        <section className="relative w-full h-[380px] group">
          <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full" id="home-banner-carousel">
            {banners && banners.length > 0 ? (
              banners.map((banner: any, i: number) => (
                <div
                  key={banner.id || i}
                  className="snap-center shrink-0 w-full h-full relative cursor-pointer"
                  onClick={() => handleBannerClickAction(banner)}
                >
                  <img 
                    className="w-full h-full object-cover brightness-[0.8] saturate-[1.2]" 
                    src={banner.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200"} 
                    alt={banner.title || "Promoção Izi"} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 px-6 pb-12 z-20">
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      whileInView={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex flex-col"
                    >
                      <span className="bg-white/10 backdrop-blur-md text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] w-fit mb-4 border border-white/10">
                        Exclusivo Izi
                      </span>
                      <h2 className="text-4xl font-black text-white leading-[0.9] tracking-tighter uppercase italic drop-shadow-2xl">
                        {banner.title || "Experimente o Novo"}
                      </h2>
                      <p className="text-zinc-300 text-xs font-medium mt-4 line-clamp-2 max-w-[280px] leading-relaxed drop-shadow-lg">
                        {banner.description || "Confira as melhores ofertas selecionadas especialmente para você hoje."}
                      </p>
                      <div className="flex gap-4 mt-8">
                         <button className="flex items-center gap-2 px-8 py-3.5 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl shadow-yellow-400/20">
                            Aproveitar Agora
                         </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ))
            ) : (
              <div className="snap-center shrink-0 w-full h-full relative bg-zinc-900 flex items-center justify-center cursor-pointer" onClick={() => navigateSubView('exclusive_offer')}>
                <img className="absolute inset-0 w-full h-full object-cover brightness-[0.4]" src="https://images.unsplash.com/photo-1621939106968-3e28cb404c04?q=80&w=1200" alt="Izi" />
                <div className="relative z-10 text-center">
                  <h2 className="text-2xl font-black text-white uppercase italic">Seja Izi Black</h2>
                  <p className="text-zinc-400 text-[10px] mt-2 uppercase tracking-widest">Taxa zero e benefícios reais</p>
                </div>
              </div>
            )}
          </div>

          {banners && banners.length > 1 && (
            <div className="absolute bottom-6 right-6 flex gap-1.5 z-30">
              {banners.map((_: any, i: number) => (
                <button 
                  key={i} 
                  onClick={(e) => {
                     e.stopPropagation();
                     const carousel = document.getElementById('home-banner-carousel');
                     if (carousel) carousel.scrollTo({ left: carousel.offsetWidth * i, behavior: 'smooth' });
                  }}
                  className={`h-1.5 rounded-full transition-all duration-500 hover:bg-white/40 ${i === activeBannerIndex ? 'w-8 bg-yellow-400' : 'w-2 bg-white/20'}`}
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
                  <div className="size-1.5 rounded-full bg-yellow-400 animate-ping" />
                  <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Izi Flash</h3>
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">AO VIVO</span>
              </div>
              
              <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-2 -mx-5 px-5 h-[252px]">
                {activeStories.map(story => (
                  <motion.div 
                    key={story.id} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (story.isMaster && userLevel < 10) showToast("Esta oferta é exclusiva para membros Tier MASTER.", "info");
                      else if (story.isMaster) setShowMasterPerks(true);
                      else {
                        const fakeItem = {
                          id: story.offer.product_id || story.offer.id,
                          name: story.offer.product_name || "Oferta Izi Flash",
                          desc: (story.offer.description || "Oferta imperdível por tempo limitado!") + `\n\n📌 Vendido por: ${story.merchant}`,
                          price: Number(story.offer.discounted_price),
                          oldPrice: Number(story.offer.original_price),
                          img: story.img,
                          merchant_id: story.offer.merchant_id,
                          merchant_name: story.merchant,
                          is_flash_offer: true,
                          flash_offer_id: story.offer.id
                        };
                        setSelectedItem(fakeItem);
                        setSubView("product_detail");
                      }
                    }}
                    className={`relative flex-shrink-0 w-[56rem] h-[236px] snap-center rounded-[34px] p-[1.5px] ${story.isMaster ? "bg-gradient-to-tr from-yellow-400 via-zinc-800 to-amber-600 shadow-[0_4px_20px_rgba(255,215,9,0.3)]" : "bg-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"} cursor-pointer transition-all group`}
                  >
                    <div className={`size-full rounded-[32.5px] overflow-hidden bg-zinc-900 relative ${story.isMaster ? "border-[2px] border-zinc-950" : "border border-white/10"}`}>
                      <img src={story.img} className="size-full object-cover brightness-75 group-hover:scale-110 transition-transform duration-1000" />
                      <div className="absolute top-3 left-3 right-3 z-20 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 bg-black/58 backdrop-blur-xl px-3.5 py-3 rounded-[20px] border border-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.28)]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="material-symbols-outlined text-[14px] text-white/75 shrink-0">storefront</span>
                            <div className="min-w-0">
                              <span className="text-[13px] font-black text-white tracking-tight leading-tight whitespace-normal break-words block">
                                {story.merchant}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-zinc-950/86 backdrop-blur-xl px-3 py-2 rounded-[20px] border border-white/10 shadow-[0_10px_24px_rgba(0,0,0,0.35)] shrink-0">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px] text-yellow-400 shrink-0">timer</span>
                            <div className="flex flex-col items-end">
                              <span className="text-[7px] font-black text-white/45 uppercase tracking-[0.18em] leading-none">Termina em</span>
                              <span className="text-[14px] font-black text-yellow-400 leading-none tracking-tight mt-1">
                                {story.timeLeft}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/75 to-transparent px-4 pt-12 pb-4 flex flex-col justify-end">
                        <h5 className="text-[19px] font-black text-white leading-[1.02] tracking-tight drop-shadow-2xl line-clamp-2">
                          {story.name}
                        </h5>
                        <div className="flex items-end justify-between gap-3 mt-3">
                          <div className="flex flex-col">
                            {story.originalPrice && (
                              <p className="text-[14px] text-white/65 line-through leading-none font-black tracking-tight mb-1">
                                R$ {story.originalPrice}
                              </p>
                            )}
                            <h6 className="text-[22px] font-black text-white leading-none tracking-tight italic drop-shadow-2xl">
                              R$ {story.finalPrice}
                            </h6>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* CUPONS HIGHLIGHTS */}
          {availableCoupons.length > 0 && (
            <section className="space-y-5">
              <div className="flex items-end justify-between px-2">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black tracking-tighter text-white italic uppercase leading-none">Cupons</h3>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">{availableCoupons.length} Cupons Ativos</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-5 px-5">
                {availableCoupons.map((coupon, i) => {
                  const isCopied = copiedCoupon === coupon.coupon_code;
                  // Alta qualidade de imagens para banners de publicidade / cupons
                  const bannerImages = [
                    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800",
                    "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800",
                    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800",
                    "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800"
                  ];
                  const fallbackImg = bannerImages[i % bannerImages.length];

                  return (
                    <motion.div 
                      key={coupon.id || i} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigator.clipboard.writeText(coupon.coupon_code).catch(() => {});
                        setCopiedCoupon(coupon.coupon_code);
                        setTimeout(() => setCopiedCoupon(null), 2000);
                        showToast("Código promocional copiado!", "success");
                      }}
                      className="relative flex-shrink-0 w-[360px] h-[196px] rounded-[36px] overflow-hidden group cursor-pointer transition-all snap-center shadow-[0_14px_40px_rgba(0,0,0,0.7)] border border-white/10 hover:border-yellow-400/30"
                    >
                       <img 
                         src={coupon.image_url || fallbackImg}
                         alt={coupon.title || "Cupom"} 
                         className="absolute inset-0 w-full h-full object-cover brightness-[0.32] saturate-[1.05] group-hover:scale-110 transition-transform duration-1000"
                       />
                       
                       <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/58 to-black/90" />
                       <div className="absolute inset-y-0 right-0 w-32 bg-yellow-400/10 blur-3xl opacity-70" />

                       <div className="relative z-10 h-full p-6 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-3">
                             <div className="bg-white/8 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                               <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest flex items-center gap-1.5">
                                 <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>sell</span>
                                 Cupom Izi
                               </span>
                             </div>

                             <button 
                               onClick={(e) => { 
                                 e.stopPropagation();
                                 navigator.clipboard.writeText(coupon.coupon_code).catch(() => {}); 
                                 setCopiedCoupon(coupon.coupon_code); 
                                 setTimeout(() => setCopiedCoupon(null), 2000); 
                                 showToast("Código promocional copiado!", "success");
                               }}
                               className={`size-11 rounded-2xl flex items-center justify-center transition-all duration-300 backdrop-blur-md shadow-2xl border ${isCopied ? "bg-emerald-500 border-none scale-105" : "bg-black/40 border-white/10 group-hover:bg-yellow-400 group-hover:border-yellow-400"}`}
                             >
                                <span className={`material-symbols-outlined text-lg ${isCopied ? "text-white" : "text-white group-hover:text-black"} transition-colors`}>
                                  {isCopied ? "done_all" : "content_copy"}
                                </span>
                             </button>
                          </div>
                          
                          <div className="flex flex-col mt-auto">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-[10px] font-black text-white/45 uppercase tracking-[0.24em]">Código</p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <span className="text-white text-base font-black tracking-[0.18em] uppercase bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 shadow-md">
                                    {coupon.coupon_code}
                                  </span>
                                  {coupon.min_order_value > 0 && (
                                    <span className="text-zinc-300 text-[10px] font-black uppercase tracking-[0.12em]">
                                      Mín. R${coupon.min_order_value}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="shrink-0 text-right">
                                <p className="text-[10px] font-black text-white/45 uppercase tracking-[0.24em]">Desconto</p>
                                <div className="flex items-end gap-2 mt-1 justify-end">
                                  <h5 className="text-4xl font-black text-white uppercase italic tracking-tighter drop-shadow-2xl leading-none">
                                    {coupon.discount_type === "fixed" ? `R$${coupon.discount_value}` : `${coupon.discount_value}%`}
                                  </h5>
                                  <span className="text-yellow-400 font-black text-xs uppercase tracking-[0.2em] mb-1">OFF</span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4">
                              <h6 className="text-lg font-black text-white tracking-tight leading-tight line-clamp-2">
                                {coupon.title || "Economia liberada para o seu próximo pedido"}
                              </h6>
                              <p className="text-[11px] text-zinc-300/80 font-medium leading-relaxed line-clamp-2 mt-2">
                                {coupon.description || "Toque no banner para copiar e usar no checkout."}
                              </p>
                            </div>
                          </div>
                       </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}

          {/* GRADE DE SERVIÇOS EM CARROSSEL (4X2) */}
          <div className="relative w-full overflow-hidden">
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0">
              {/* PÁGINA 1: Principais (8 itens) */}
              <div className="min-w-full snap-center grid grid-cols-4 grid-rows-2 gap-1.5 px-1 py-1">
                {deliveryServices.slice(0, 8).map((svc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => handleServiceSelection(svc)}
                    className={`relative flex flex-col items-center justify-center cursor-pointer transition-all aspect-square bg-[#1a1b1e] border rounded-[18px] p-2 shadow-lg overflow-hidden group 
                      ${svc.highlight === "gold" ? "border-yellow-500/10 shadow-[0_0_15px_rgba(251,191,36,0.03)]" : ""}
                      ${svc.highlight === "cyan" ? "border-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.03)]" : ""}
                      ${svc.highlight === "none" ? "border-white/5" : ""}
                      active:scale-95`}
                  >
                    <div className="relative z-10 w-9 h-9 flex items-center justify-center mb-1">
                       <span 
                        className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 duration-300
                          ${svc.highlight === "gold" ? "text-yellow-400" : svc.highlight === "cyan" ? "text-cyan-400" : "text-white"}`} 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                       >
                         {svc.icon}
                       </span>
                    </div>

                    <div className="text-center relative z-10 flex flex-col items-center px-1">
                      <h3 className="font-black text-[7px] text-white tracking-tight uppercase truncate w-full leading-none drop-shadow-md">
                        {svc.label.split(' ')[0]}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* PÁGINA 2: Especializados (Restante) */}
              <div className="min-w-full snap-center grid grid-cols-4 grid-rows-2 gap-1.5 px-1 py-1">
                {deliveryServices.slice(8).map((svc, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleServiceSelection(svc)}
                    className={`relative flex flex-col items-center justify-center cursor-pointer transition-all aspect-square bg-[#1a1b1e] border rounded-[18px] p-2 shadow-lg overflow-hidden group 
                       ${svc.highlight === "gold" ? "border-yellow-500/10 shadow-[0_0_15px_rgba(251,191,36,0.03)]" : ""}
                       ${svc.highlight === "cyan" ? "border-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.03)]" : ""}
                       ${svc.highlight === "none" ? "border-white/5" : ""}
                       active:scale-95`}
                  >
                    <div className="relative z-10 w-9 h-9 flex items-center justify-center mb-1">
                       <span 
                        className={`material-symbols-outlined text-[20px] transition-transform group-hover:scale-110 duration-300
                          ${svc.highlight === "gold" ? "text-yellow-400" : svc.highlight === "cyan" ? "text-cyan-400" : "text-white"}`} 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                       >
                         {svc.icon}
                       </span>
                    </div>

                    <div className="text-center relative z-10 flex flex-col items-center px-1">
                      <h3 className="font-black text-[7px] text-white tracking-tight uppercase truncate w-full leading-none drop-shadow-md">
                        {svc.label.split(' ')[0]}
                      </h3>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Pagination Indicators (opcional) */}
            <div className="flex justify-center gap-1.5 mt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 opacity-100" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700 opacity-50" />
            </div>
          </div>

          {/* MOBILIDADE */}
          <section className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-black rounded-[40px] p-8 border border-white/5 relative overflow-hidden group shadow-2xl">
            <div className="absolute top-0 right-0 size-60 bg-yellow-400 opacity-[0.03] blur-[100px] rounded-full -mr-20 -mt-20 pointer-events-none group-hover:opacity-[0.07] transition-opacity duration-1000" />
            <div className="flex flex-col items-center mb-10 text-center relative z-10">
              <span className="bg-yellow-400/10 text-yellow-400 text-[8px] font-black px-3 py-1 rounded-full tracking-[0.4em] uppercase mb-3 border border-yellow-400/20">Izi Connect</span>
              <h2 className="text-3xl font-black tracking-tighter text-white italic uppercase leading-none">Vá de Izi.</h2>
            </div>
            <div className="grid grid-cols-4 gap-2 relative z-10 p-2">
              {[
                { icon: "two_wheeler", label: "Mototáxi", action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false }); navigateSubView("taxi_wizard"); } },
                { icon: "airport_shuttle", label: "Vans Izi", action: () => { setTransitData({ ...transitData, type: "van", scheduled: false }); navigateSubView("van_wizard"); } },
                { icon: "directions_car", label: "Carros", action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false }); navigateSubView("taxi_wizard"); } },
                { icon: "local_shipping", label: "Logística", action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("freight_wizard"); } },
              ].map((svc, i) => (
                <motion.div key={i} whileTap={{ scale: 0.95 }} onClick={svc.action} className="flex flex-col items-center gap-2 group cursor-pointer transition-all">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <span className="material-symbols-outlined text-3xl text-white group-hover:text-yellow-400 transition-all duration-300">
                      {svc.icon}
                    </span>
                  </div>
                  <span className="text-[8px] font-black text-zinc-500 group-hover:text-white tracking-tight uppercase transition-colors text-center leading-none">
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
