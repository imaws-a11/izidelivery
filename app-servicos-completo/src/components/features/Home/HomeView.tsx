import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import iziCoinImg from "../../../assets/images/izi-coin-premium.png";

/** Extrai a parte em texto limpo de endereços salvos de forma corrompida ou serializada no DB */
const parseAddressText = (rawStr: any): string => {
  if (!rawStr) return "Endereço não disponível";
  if (typeof rawStr !== "string") {
    return rawStr.formatted_address || rawStr.address || "Localidade";
  }
  
  // Limpa sufixos de OBS que acoplamos no app
  let cleanStr = rawStr.split(" | OBS:")[0].split(" | FRETE:")[0].split(" | ENVIO:")[0].split(" | EXCURSÃO:")[0].split(" | VIAGEM:")[0].trim();
  
  if (cleanStr.includes("[object Object]")) {
    return "Endereço processando..."; // fallback amigável pra ordens muito bugadas do passado
  }

  try {
    const parsed = JSON.parse(cleanStr);
    return parsed.formatted_address || parsed.address || cleanStr;
  } catch {
  }
};

/** Componente de Timer Regressivo em Tempo Real para Izi Flash */
const FlashCountdown = ({ expiresAt }: { expiresAt: string }) => {
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const update = () => {
      const exp = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = exp - now;

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return <span className="font-mono tabular-nums">{timeLeft}</span>;
};


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
    | "explore_restaurants"
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
    | "card_payment"
    | "izi_coin_tracking"
    | "flash_offers_list"
    | "logistics_tracking";
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  setSelectedItem: (item: any) => void;
  onOpenDepositModal?: () => void;
  onReturnToPayment?: (order: any) => void;
  onOpenCoinTracking?: (order: any) => void;
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
  establishmentTypes: any[];
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
  onOpenDepositModal,
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
  onReturnToPayment,
  onOpenCoinTracking,
  establishmentTypes,
}) => {
   const [activeBannerIndex, setActiveBannerIndex] = React.useState(0);
   const [isSearching, setIsSearching] = useState(false);
   const [searchResults, setSearchResults] = useState<{ establishments: any[], products: any[] }>({ establishments: [], products: [] });


  // Busca Inteligente
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.length >= 3) {
        setIsSearching(true);
        try {
          const { data, error } = await supabase.rpc('search_all_izi', { search_query: searchQuery });
          if (!error && data) {
            setSearchResults(data);
          }
        } catch (err) {
          console.error("Erro na busca inteligente:", err);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults({ establishments: [], products: [] });
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

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

  const baseDeliveryServices = [
    { icon: "restaurant",     img: "/images/comida.png", tagline: "GASTRONOMIA",      highlight: "gold", label: "Food",             type: "restaurant", value: "restaurant", action: () => { setRestaurantInitialCategory("Todos"); navigateSubView("explore_restaurants"); } },
    { icon: "rice_bowl",      img: "/images/almoco.png",   tagline: "ALMOÇO EXPRESS",   highlight: "none", label: "Almoço",       type: "restaurant", value: "almoco", action: () => { setRestaurantInitialCategory("Almoço"); navigateSubView("explore_restaurants"); } },
    { icon: "local_mall",     img: "/images/mercados.png", tagline: "MERCAIDT",         highlight: "cyan", label: "Mercados",     type: "market",     value: "market", action: null },
    { icon: "inventory_2",    img: "/images/envios.png",   tagline: "ENTREGAS RÁPIDAS", highlight: "full_yellow", label: "Izi Envios",   type: null,         value: "envios", action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("explore_envios"); } },
    { icon: "local_bar",      img: "/images/bebidas.png",  tagline: "BEBIDAS FINAIS",   highlight: "none", label: "Bebidas",      type: "beverages",  value: "beverages", action: null },
    { icon: "local_pharmacy", img: "/images/saude.png",    tagline: "SAÚDE INTEGRAL",   highlight: "cyan", label: "Saúde",        type: "pharmacy",   value: "pharmacy", action: null },
    { icon: "pets",           img: "/images/petshop.png",  tagline: "CONFORTO PET",     highlight: "gold", label: "Petshop",      type: "generic",    value: "pets", action: () => { setExploreCategoryState({ id: "pets", title: "Pet Shop Premium", tagline: "Mimo para seu melhor amigo", primaryColor: "rose-500", icon: "pets" }); navigateSubView("explore_category"); } },
    { icon: "propane_tank",   img: "/images/gas-agua.png", tagline: "VITAIS",           highlight: "cyan", label: "Gás e Água",   type: "generic",    value: "gas", action: () => { setExploreCategoryState({ id: "gas", title: "Gás e Água", tagline: "Essencial na sua porta", primaryColor: "blue-500", icon: "propane_tank" }); navigateSubView("explore_category"); } },
    { icon: "kebab_dining",   img: "/images/acougue.png",  tagline: "CARNES PRIME",     highlight: "gold", label: "Açougue",      type: "generic",    value: "açougue", action: () => { setExploreCategoryState({ id: "açougue", title: "Corte Prime", tagline: "Os melhores cortes selecionados", primaryColor: "red-600", icon: "kebab_dining" }); navigateSubView("explore_category"); } },
    { icon: "bakery_dining",  img: "/images/padaria.png",  tagline: "PADARIA ARTESANAL",highlight: "gold", label: "Padaria",      type: "generic",    value: "padaria", action: () => { setExploreCategoryState({ id: "padaria", title: "Padaria Izi", tagline: "Pão quentinho o dia todo", primaryColor: "amber-600", icon: "bakery_dining" }); navigateSubView("explore_category"); } },
    { icon: "nutrition",      img: "/images/hortifruti.png",tagline:"FRESCOR HORTI",    highlight: "cyan", label: "Hortifruti",   type: "generic",    value: "hortifruti", action: () => { setExploreCategoryState({ id: "hortifruti", title: "Hortifruti Izi", tagline: "Do campo para sua casa", primaryColor: "emerald-600", icon: "nutrition" }); navigateSubView("explore_category"); } },
    { icon: "cleaning_services", img: "/images/limpeza.png", tagline: "IZI CLEAN",       highlight: "none", label: "Limpeza",      type: "generic",    value: "limpeza", action: () => showToast("Serviço em breve!", "info") },
    { icon: "electrical_services", img: "/images/eletrica.png", tagline: "REPAROS",      highlight: "none", label: "Elétrica",     type: "generic",    value: "eletrica", action: () => showToast("Serviço em breve!", "info") },
    { icon: "plumbing",        img: "/images/hidraulica.png", tagline: "REPAROS",     highlight: "none", label: "Hidráulica",   type: "generic",    value: "hidraulica", action: () => showToast("Serviço em breve!", "info") },
  ];

  // Sincroniza dinamicamente os ícones 3D vindos do banco de dados (establishmentTypes)
  const deliveryServices = baseDeliveryServices.map(svc => {
    const dbMatch = (establishmentTypes || []).find(db => db.value === svc.value || db.value === svc.type || db.value === svc.label.toLowerCase());
    if (dbMatch && dbMatch.icon) {
      return { ...svc, icon: dbMatch.icon, label: dbMatch.name || svc.label };
    }
    return svc;
  });



  const renderServiceCard = (svc: any, i: number, isMenu: boolean = false) => (
    <div
      key={i}
      onClick={() => {
        if (svc.action) svc.action();
        else handleServiceSelection(svc);
        if (isMenu) setShowAllServices(false);
      }}
      className={`relative flex flex-col items-center justify-center cursor-pointer aspect-square rounded-[35px] group transition-all duration-300
        ${svc.icon?.startsWith('http') 
          ? "bg-transparent overflow-visible" 
          : "overflow-hidden " + (svc.highlight === "full_yellow" ? "bg-yellow-400 shadow-[10px_10px_20px_rgba(0,0,0,0.4)] border border-yellow-300" : "bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]")
        }
        active:scale-95
        ${svc.highlight === "special" ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-zinc-950" : ""}
      `}
    >
      {svc.highlight === "special" && (
        <div className="absolute inset-0 bg-yellow-400/10 animate-pulse pointer-events-none" />
      )}
      <div className={`relative z-10 flex items-center justify-center mb-1 transition-all duration-500
        ${svc.icon?.startsWith('http') 
          ? "w-16 h-16 bg-transparent overflow-visible" 
          : "w-12 h-12 rounded-[18px] overflow-hidden " + (
              svc.highlight === "gold" ? "bg-yellow-400 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" : 
              svc.highlight === "cyan" ? "bg-cyan-400 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" : 
              svc.highlight === "special" ? "bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.6),inset_2px_2px_4px_rgba(255,255,255,0.8),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]" :
              svc.highlight === "full_yellow" ? "bg-black shadow-[4px_4px_8px_rgba(0,0,0,0.3)]" :
              "bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4),inset_-2px_-2px_4px_rgba(255,255,255,0.02)]"
          )}
      `}>
         {svc.icon?.startsWith('http') ? (
           <img src={svc.icon} alt={svc.label} className="w-full h-full object-contain scale-[1.3] drop-shadow-2xl" />
         ) : (
           <span className={`material-symbols-outlined text-[26px] ${svc.highlight === "gold" || svc.highlight === "cyan" || svc.highlight === "special" ? "text-black font-black" : svc.highlight === "full_yellow" ? "text-yellow-400 font-black" : "text-white"}`} 
                 style={{ fontVariationSettings: "'FILL' 1" }}>
             {svc.icon}
           </span>
         )}
      </div>

      <h3 className={`font-black text-[9px] tracking-widest uppercase text-center w-full px-1 z-10 mt-1
        ${svc.icon?.startsWith('http') 
          ? "text-zinc-300 drop-shadow-md" 
          : svc.highlight === "gold" || svc.highlight === "special" ? "text-yellow-400" : svc.highlight === "full_yellow" ? "text-black" : "text-zinc-500"}
      `}>
        {svc.label}
      </h3>
    </div>
  );



  const handleServiceSelection = (cat: any) => {
    if (cat.action) return cat.action();
    setActiveService(cat);
    
    if (cat.type === "restaurant") {
       setRestaurantInitialCategory("Todos");
       navigateSubView("explore_restaurants");
    }
    else if (cat.type === "market") navigateSubView("market_list");
    else if (cat.type === "pharmacy") navigateSubView("pharmacy_list");
    else if (cat.type === "beverages") navigateSubView("beverages_list");
    else navigateSubView("generic_list");
  };

  const activeStories = (flashOffers || [])
    .filter((offer: any) => offer.title !== "Oferta Especial")
    .map((offer: any) => {
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
      img: offer.product_image || offer.admin_users?.store_logo || "",
      isMaster: userLevel >= 10 && offer.is_vip,
      isRedeemed: offer.is_redeemed,
      offer,
    };
  });

  const LOGISTICS_TYPES = ["frete", "logistica", "van"];
  const logisticsOrder = myOrders.find(o => !["concluido", "cancelado"].includes(o.status) && LOGISTICS_TYPES.includes(o.service_type));
  const activeOrder = myOrders.find(o => !["concluido", "cancelado"].includes(o.status) && o.service_type !== 'coin_purchase' && !LOGISTICS_TYPES.includes(o.service_type));
  const coinOrder = myOrders.find(o => !["concluido", "cancelado"].includes(o.status) && o.service_type === 'coin_purchase');

  return (
    <div className="flex flex-col bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar h-full">
      {/* HEADER PREMIUM - ILHA FLUTUANTE (DESIGN OTIMIZADO) */}
      <AnimatePresence>
        {subView === "none" && (
          <motion.header 
            key="home-header"
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
                  <div className="absolute -bottom-1.5 -right-1.5 bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 text-black w-5 h-5 rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(250,204,21,0.5)] border-2 border-black z-10 animate-pulse">
                    <span className="material-symbols-outlined text-[12px] font-black" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  </div>
                )}
              </button>

              <div className="flex-1 flex flex-col items-center cursor-pointer group px-2" onClick={() => navigateSubView("addresses")}>
                <p className="text-zinc-500 text-[7px] font-black uppercase tracking-[0.2em] leading-none mb-1">Entregas em</p>
                <div className="flex items-center gap-1 max-w-[180px]">
                  <span className="text-white font-black text-[11px] tracking-tight truncate leading-none">
                    {userLocation.loading ? "Buscando..." : userLocation.address || "Definir endereço"}
                  </span>
                  <span className="material-symbols-outlined text-yellow-400 text-sm group-hover:translate-y-0.5 transition-transform">expand_more</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button onClick={() => navigateSubView("cart")} 
                  className="group relative w-9 h-9 flex items-center justify-center rounded-2xl bg-zinc-900/40 border border-white/5 hover:bg-zinc-800 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-zinc-100 text-[18px] group-hover:text-yellow-400 transition-colors">shopping_bag</span>
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 size-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border border-black">
                      {cart.length}
                    </span>
                  )}
                </button>
                <button onClick={() => navigateSubView("notifications_center")} 
                  className="w-10 h-10 flex items-center justify-center rounded-[18px] bg-zinc-900 border border-white/5 hover:bg-zinc-800 transition-all active:scale-95 shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]">
                  <span className="material-symbols-outlined text-zinc-100 text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>notifications</span>
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      <main className="flex flex-col pt-[110px]">
        {/* BANNER GIGANTE IMERSIVO - CARROSSEL SWIPE */}
        {banners && banners.length > 0 && (
          <section className="relative w-full h-[380px] group">
            <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar w-full h-full" id="home-banner-carousel">
              {banners.map((banner: any, i: number) => (
                <div
                  key={banner.id || `banner-${i}`}
                  className="snap-center shrink-0 w-full h-full relative cursor-pointer"
                  onClick={() => handleBannerClickAction(banner)}
                >
                  <img 
                    className="w-full h-full object-cover brightness-[0.8] saturate-[1.2]" 
                    src={banner.image_url} 
                    alt={banner.title || "Promoção Izi"} 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 px-6 pb-12 z-20">
                    <button className="flex items-center gap-2 px-8 py-3.5 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-2xl shadow-yellow-400/20">
                      Aproveitar Agora
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {banners.length > 1 && (
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
        )}

        <div className="px-5 -mt-6 relative z-30 space-y-12 pb-12">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
              {isSearching ? (
                <div className="size-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
              ) : (
                <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-all duration-500 text-2xl">search</span>
              )}
            </div>
            <input
              className="w-full h-16 bg-zinc-900 shadow-[15px_15px_30px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 rounded-[28px] py-4.5 pl-16 pr-14 text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-sm font-black"
              placeholder="Pesquisar lojas ou produtos..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery.length > 0 && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-6 flex items-center text-zinc-600 hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-xl font-black">close</span>
              </button>
            )}
          </div>

          {/* RESULTADOS DA BUSCA INTELIGENTE */}
          <AnimatePresence>
            {searchQuery.length >= 1 && (
              <motion.div
                key="search-results-dropdown"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute inset-x-0 top-full mt-4 z-[100] bg-zinc-950 border border-white/10 rounded-[32px] shadow-[0_24px_80px_rgba(0,0,0,0.9)] overflow-hidden"
              >
                <div className="max-h-[60vh] overflow-y-auto no-scrollbar p-6 space-y-8">
                  {/* LOJAS ENCONTRADAS */}
                  {searchResults.establishments.length > 0 && (
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 px-2">Lojas</h4>
                      <div className="space-y-2">
                        {searchResults.establishments.map((shop, i) => (
                          <motion.div
                            key={shop.id || `shop-${i}`}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const shopData = ESTABLISHMENTS.find(e => e.id === shop.id) || shop;
                              handleShopClick(shopData);
                              setSearchQuery("");
                            }}
                            className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer group"
                          >
                            <div className="size-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                              <img src={shop.img} className="size-full object-cover" alt={shop.name} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-black text-white group-hover:text-yellow-400 transition-colors uppercase">{shop.name}</h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tighter">{shop.tag || "Restaurante"}</p>
                                 <span className="size-1 rounded-full bg-zinc-800" />
                                 <p className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter shadow-sm">
                                   {shop.freeDelivery ? "Frete Grátis" : `Frete R$ ${Number(shop.service_fee || 5.90).toFixed(2).replace('.', ',')}`}
                                 </p>
                              </div>
                            </div>
                            <span className="material-symbols-outlined text-zinc-700">arrow_forward_ios</span>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* PRODUTOS ENCONTRADOS */}
                  {searchResults.products.length > 0 && (
                    <section>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-4 px-2">Produtos</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {searchResults.products.map((product, i) => (
                          <motion.div
                            key={product.id || `prod-${i}`}
                            whileTap={{ scale: 0.98 }}
                            onClick={async () => {
                              try {
                                // Primeiro seleciona a loja
                                let shop = ESTABLISHMENTS.find(e => e.id === product.merchant_id);
                                
                                if (!shop) {
                                  // Se não estiver no cache (ex: busca global), buscamos no Supabase
                                  const { data, error } = await supabase
                                    .from('admin_users')
                                    .select('*')
                                    .eq('id', product.merchant_id)
                                    .single();
                                    
                                  if (!error && data) {
                                    shop = {
                                      id: data.id,
                                      name: data.store_name || data.name,
                                      img: data.avatar_url || "",
                                      tag: data.segment || data.type || "Restaurante",
                                      rating: "5.0",
                                      time: data.estimated_time || "30-45 min",
                                      freeDelivery: data.free_delivery || false,
                                      service_fee: data.service_fee || 5.0,
                                      type: data.type || "restaurant"
                                    };
                                  }
                                }

                                if (shop) {
                                  handleShopClick(shop);
                                  // Espera um pouco para a vista mudar e então abre o detalhe do produto
                                  setTimeout(() => {
                                    setSelectedItem({
                                      id: product.id,
                                      name: product.name,
                                      price: Number(product.price),
                                      img: product.img,
                                      desc: product.description,
                                      merchant_id: product.merchant_id,
                                      merchant_name: product.merchant_name
                                    });
                                    navigateSubView("product_detail");
                                  }, 300);
                                } else {
                                  showToast("Loja não disponível no momento", "error");
                                }
                              } catch (err) {
                                console.error("Erro ao abrir produto:", err);
                                showToast("Erro ao abrir produto", "error");
                              }
                              setSearchQuery("");
                            }}
                            className="flex gap-4 p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-yellow-400/30 transition-all cursor-pointer group"
                          >
                            <div className="size-16 rounded-xl overflow-hidden bg-zinc-900 shrink-0">
                              <img src={product.img} className="size-full object-cover" alt={product.name} />
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                              <h5 className="text-xs font-black text-white group-hover:text-yellow-400 transition-colors uppercase leading-tight line-clamp-2">{product.name}</h5>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm font-black text-white">R$ {Number(product.price).toFixed(2).replace('.', ',')}</span>
                                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-tighter truncate">em {product.merchant_name}</span>
                              </div>
                            </div>
                            <div className="size-8 rounded-full bg-yellow-400 flex items-center justify-center self-center shrink-0">
                               <span className="material-symbols-outlined text-black font-black text-sm">add</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* NENHUM RESULTADO */}
                  {!isSearching && searchQuery.length >= 3 && searchResults.establishments.length === 0 && searchResults.products.length === 0 && (
                    <div className="py-12 flex flex-col items-center gap-4 text-center">
                      <div className="size-16 rounded-full bg-zinc-900 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
                      </div>
                      <div>
                        <p className="text-white font-black text-sm uppercase">Nenhum resultado para "{searchQuery}"</p>
                        <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">Tente buscar por outro termo ou categoria</p>
                      </div>
                    </div>
                  )}

                  {isSearching && (
                     <div className="py-12 flex flex-col items-center gap-4">
                        <div className="size-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Buscando no Izi...</p>
                     </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACOMPANHAMENTO DE IZICOINS */}
          {coinOrder && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              className="relative overflow-hidden bg-zinc-900 border border-blue-400/30 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(59,130,246,0.15)] group mb-6 flex flex-col gap-4"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-blue-400/20 transition-all duration-700" />
              
              <div className="flex items-center justify-between" onClick={() => { 
                if (onOpenCoinTracking) onOpenCoinTracking(coinOrder);
                else { setSelectedItem(coinOrder); navigateSubView("izi_coin_tracking"); }
              }}>
                <div className="flex items-center gap-3 cursor-pointer">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20 overflow-hidden">
                    <img src={iziCoinImg} className="w-9 h-9 object-contain animate-pulse" alt="Izi Coin" />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-tight">Recarga de IZI Coins</h4>
                    <p className="text-zinc-500 text-[10px] uppercase font-black tracking-[0.2em]">{coinOrder.status === 'pendente_pagamento' ? 'Aguardando Pagamento' : 'Processamento Instantâneo'}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end cursor-pointer">
                   <span className="text-blue-400 text-[10px] font-black uppercase tracking-widest bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20">
                     {coinOrder.status === 'pendente_pagamento' ? "Aguardando" : 
                      coinOrder.payment_status === 'paid' || ['novo', 'aceito', 'confirmado'].includes(coinOrder.status) ? "Processando" :
                      coinOrder.status}
                   </span>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex flex-col gap-2" onClick={() => { 
                    if (onOpenCoinTracking) onOpenCoinTracking(coinOrder);
                    else { setSelectedItem(coinOrder); navigateSubView("izi_coin_tracking"); }
                 }}>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400 cursor-pointer">
                      <span>Valor: R$ {Number(coinOrder.total_price || 0).toFixed(2).replace('.', ',')}</span>
                      <span className="text-white">Confirmando Transação...</span>
                    </div>
                    {/* Progress Bar Dinâmica */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: "10%" }}
                        animate={{ width: coinOrder.payment_status === 'paid' ? "75%" : "30%" }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                        className="h-full bg-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)]"
                      />
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {coinOrder.status === 'pendente_pagamento' ? (
                       <button
                         onClick={(e) => { 
                           e.stopPropagation(); 
                           if(onReturnToPayment) {
                             onReturnToPayment(coinOrder);
                           } else if(onOpenDepositModal) {
                             onOpenDepositModal();
                           } else {
                             setSubView("card_payment");
                           }
                         }}
                         className="flex-1 mr-2 px-4 py-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all text-center"
                       >
                         Voltar ao Pagamento
                       </button>
                    ) : (
                       <p className="text-zinc-500 text-[9px] font-medium flex-1">
                         Suas moedas estarão disponíveis em instantes.
                       </p>
                    )}
                    <button 
                       onClick={(e) => { 
                         e.stopPropagation(); 
                         if (onOpenCoinTracking) onOpenCoinTracking(coinOrder);
                         else { setSelectedItem(coinOrder); navigateSubView("izi_coin_tracking"); }
                       }}
                       className="text-white text-[10px] font-black flex items-center justify-end gap-1 hover:gap-2 transition-all p-2"
                    >
                       VER DETALHES <span className="material-symbols-outlined text-sm text-blue-400">arrow_forward</span>
                    </button>
                 </div>
              </div>
            </motion.div>
          )}

          {/* ACOMPANHAMENTO EM TEMPO REAL DE PEDIDOS NORMIAIS */}
          {activeOrder && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { 
                setSelectedItem(activeOrder); 
                const isMobility = ['mototaxi', 'carro', 'van', 'utilitario', 'frete', 'logistica'].includes(activeOrder.service_type) || !!activeOrder.scheduled_at;
                navigateSubView(isMobility ? "logistics_tracking" : "active_order");
              }}
              className="relative overflow-hidden bg-zinc-900 border border-yellow-400/30 rounded-[32px] p-6 shadow-[0_20px_50px_rgba(255,215,9,0.15)] group cursor-pointer"
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-[60px] -mr-16 -mt-16 group-hover:bg-yellow-400/20 transition-all duration-700" />
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-lg shadow-yellow-400/20">
                    <span className="material-symbols-outlined text-black text-2xl font-black animate-pulse">
                      {["mototaxi", "carro", "van", "utilitario"].includes(activeOrder.service_type) ? (activeOrder.service_type === 'mototaxi' ? "two_wheeler" : "directions_car") : "moped"}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-white font-black text-sm uppercase tracking-tight">Acompanhe seu pedido</h4>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/20">
                     {(() => {
                       const s = activeOrder.status;
                       if (s === 'novo' || s === 'aceito' || s === 'confirmado') return "Aprovado";
                       if (s === 'waiting_driver' || s === 'searching_driver') return "Buscando Entregador";
                       if (s === 'waiting_merchant') return "Aguardando Loja";
                       if (s === 'preparando' || s === 'no_preparo') return "No Preparo";
                       if (s === 'pronto') return "Pronto para Coleta";
                       if (s === 'a_caminho_coleta' || s === 'atribuido' || s === 'saiu_para_coleta') return "Entregador a Caminho";
                       if (s === 'chegou_coleta' || s === 'no_local_coleta') return "Entregador na Loja";
                       if (s === 'picked_up' || s === 'a_caminho' || s === 'em_rota' || s === 'saiu_para_entrega') return "Em Trânsito";
                       if (s === 'no_local') return "No seu Local";
                       if (s === 'concluido' || s === 'entregue') return "Entregue";
                       if (s === 'cancelado') return "Cancelado";
                       return "Processando";
                     })()}
                   </span>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex flex-col gap-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                      <span className="truncate max-w-[150px]">{activeOrder.merchant_name || "Seu pedido"}</span>
                      <span className="text-white">
                        {["saiu_para_entrega", "em_rota", "a_caminho", "picked_up"].includes(activeOrder.status) ? "Em Trânsito" : "Processando"}
                      </span>
                    </div>
                    {/* Progress Bar Dinâmica */}
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden flex gap-1">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: ["novo", "preparando", "confirmado", "aceito", "no_preparo"].includes(activeOrder.status) ? "35%" : ["saiu_para_entrega", "a_caminho", "em_rota", "picked_up"].includes(activeOrder.status) ? "75%" : "100%" }}
                        className="h-full bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                      />
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <p className="text-zinc-500 text-[9px] font-medium max-w-[200px] truncate">
                      Destino: {parseAddressText(activeOrder.delivery_address) || "Seu endereço"}
                    </p>
                    <div className="text-white text-[10px] font-black flex items-center gap-1 group-hover:gap-2 transition-all">
                       VER MAPA <span className="material-symbols-outlined text-sm text-yellow-400">arrow_forward</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {/* CARD EXCLUSIVO - ACOMPANHAMENTO DE LOGÍSTICA */}
          {logisticsOrder && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setSelectedItem(logisticsOrder); navigateSubView("logistics_tracking"); }}
              className="relative overflow-hidden rounded-[36px] cursor-pointer group"
              style={{
                background: "linear-gradient(145deg, #1c1c1f, #141416)",
                boxShadow: "18px 18px 40px rgba(0,0,0,0.6), -6px -6px 20px rgba(255,255,255,0.03), inset 1px 1px 0px rgba(255,255,255,0.06)",
                border: "1.5px solid rgba(250,204,21,0.18)"
              }}
            >
              {/* Glow Blob */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-400/8 rounded-full blur-[60px] pointer-events-none group-hover:bg-yellow-400/14 transition-all duration-700" />
              <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-500/6 rounded-full blur-[50px] pointer-events-none" />

              {/* Topo do card */}
              <div className="relative z-10 px-6 pt-6 pb-0 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {/* Ícone Veículo */}
                  <div
                    className="size-16 rounded-[20px] flex items-center justify-center shrink-0 relative"
                    style={{
                      background: "linear-gradient(145deg, #2a2a2e, #202024)",
                      boxShadow: "8px 8px 20px rgba(0,0,0,0.5), -3px -3px 10px rgba(255,255,255,0.04), inset 1px 1px 0px rgba(255,255,255,0.07)"
                    }}
                  >
                    <span className="material-symbols-rounded text-3xl text-yellow-400 font-black">
                      {logisticsOrder.service_type === "van" ? "airport_shuttle" : "local_shipping"}
                    </span>
                    {/* Pulsing dot */}
                    <span className="absolute -top-1 -right-1 size-3.5 rounded-full bg-yellow-400 border-2 border-[#141416] animate-pulse" />
                  </div>

                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">Serviço Ativo</p>
                    <h4 className="text-base font-black text-white uppercase tracking-tight leading-tight">
                      {logisticsOrder.service_type === "van" ? "Van de Carga" : "Izi Logistics"}
                    </h4>
                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">
                      {logisticsOrder.service_type === "frete" || logisticsOrder.service_type === "logistica" ? "Frete & Mudanças" : "Transporte de Carga"}
                    </p>
                  </div>
                </div>

                {/* Badge Status */}
                <div
                  className="px-3 py-2 rounded-2xl flex items-center gap-2"
                  style={{
                    background: "linear-gradient(145deg, rgba(250,204,21,0.12), rgba(250,204,21,0.06))",
                    boxShadow: "4px 4px 12px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03), inset 1px 1px 0 rgba(250,204,21,0.1)",
                    border: "1px solid rgba(250,204,21,0.2)"
                  }}
                >
                  <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400">
                    {logisticsOrder.status === "waiting_driver" || logisticsOrder.status === "novo" || logisticsOrder.status === "searching_driver"
                      ? "Buscando"
                      : logisticsOrder.status === "aceito" ? "Alocado"
                      : logisticsOrder.status === "a_caminho" ? "A Caminho"
                      : logisticsOrder.status === "chegou" ? "No Local"
                      : logisticsOrder.status === "in_transit" ? "Em Trânsito"
                      : logisticsOrder.status}
                  </span>
                </div>
              </div>

              {/* Trajeto */}
              <div className="relative z-10 px-6 py-5 flex gap-3">
                <div className="flex flex-col items-center pt-1 shrink-0">
                  <div className="size-2 rounded-full bg-white/40" />
                  <div className="w-px flex-1 bg-white/10 my-1.5" />
                  <div className="size-2 rounded-full bg-yellow-400" />
                </div>
                <div className="flex flex-col gap-2 min-w-0 flex-1">
                  <p className="text-[11px] font-black text-zinc-300 uppercase truncate">
                    {parseAddressText(logisticsOrder.pickup_address) || "Origem"}
                  </p>
                  <p className="text-[11px] font-black text-yellow-400 uppercase truncate">
                    {parseAddressText(logisticsOrder.delivery_address) || "Destino"}
                  </p>
                </div>
                <div className="text-right shrink-0 flex flex-col justify-center">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Total</p>
                  <p className="text-lg font-black text-white">R$ {Number(logisticsOrder.total_price || 0).toFixed(2).replace(".",",")}</p>
                </div>
              </div>

              {/* Barra de progresso steps */}
              <div className="relative z-10 px-6 pb-5">
                <div className="flex gap-1.5 mb-2">
                  {["waiting_driver","aceito","a_caminho","chegou","in_transit","concluido"].map((s, i) => {
                    const stepMap: Record<string, number> = { waiting_driver: 0, novo: 0, searching_driver: 0, aceito: 1, a_caminho: 2, chegou: 3, in_transit: 4, concluido: 5 };
                    const cur = stepMap[logisticsOrder.status] ?? 0;
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                          i < cur ? "bg-yellow-400" : i === cur ? "bg-yellow-400/60" : "bg-white/8"
                        }`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                    {logisticsOrder.driver_name ? `Motorista: ${logisticsOrder.driver_name}` : "Aguardando motorista parceiro..."}
                  </p>
                  <div className="flex items-center gap-1 text-yellow-400">
                    <span className="text-[9px] font-black uppercase tracking-widest">Ver Detalhes</span>
                    <span className="material-symbols-rounded text-sm">arrow_forward</span>
                  </div>
                </div>
              </div>

              {/* Linha clay na base */}
              <div
                className="h-1.5 w-full rounded-b-[36px]"
                style={{ background: "linear-gradient(90deg, rgba(250,204,21,0.6), rgba(250,204,21,0.2), rgba(250,204,21,0))" }}
              />
            </motion.div>
          )}

          {/* IZI FLASH HIGHLIGHTS - REDESIGN PREMIUM */}
          {activeStories.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-2xl fill-1 animate-pulse">bolt</span>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Izi Flash</h3>
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2 pl-8">Ofertas que desaparecem</p>
                </div>
                
                <div className="flex items-center gap-3 bg-zinc-900/50 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/5">
                   <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="size-5 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                           <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i*77}`} className="size-full object-cover" alt="user" />
                        </div>
                      ))}
                   </div>
                   <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">+1k vendo</span>
                </div>
              </div>
              
              <div className="flex gap-6 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-6 -mx-5 px-5">
                {activeStories.map((story, index) => (
                  <motion.div 
                    key={story.id || `story-${index}`} 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (story.isRedeemed) showToast("Você já aproveitou esta oferta!", "info");
                      else if (story.isMaster && userLevel < 10) showToast("Esta oferta é exclusiva para membros Tier MASTER.", "info");
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
                          flash_offer_id: story.offer.id,
                          expires_at: story.offer.expires_at,
                          off: story.offer.original_price && story.offer.discounted_price
                            ? `- R$ ${(Number(story.offer.original_price) - Number(story.offer.discounted_price)).toFixed(2).replace('.', ',')} OFF`
                            : `- R$ ${(Number(story.offer.original_price) * (Number(story.offer.discount_percent) / 100)).toFixed(2).replace('.', ',')} OFF`
                        };
                        setSelectedItem(fakeItem);
                        navigateSubView("exclusive_offer");
                      }
                    }}
                    className={`flex-shrink-0 w-[240px] h-[320px] snap-center relative rounded-[32px] overflow-hidden group cursor-pointer shadow-2xl border border-white/5 transition-all duration-500 ${story.isRedeemed ? "grayscale brightness-50 cursor-not-allowed" : story.isMaster ? "border-yellow-400" : ""}`}
                  >
                    {/* Imagem de Fundo */}
                    <img
                      src={story.img}
                      className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.85] saturate-[1.1]"
                      alt={story.name}
                    />
                    {/* Gradiente overlay — mesmo padrão do turismo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                    {/* Badge de Tempo — topo direito (só quando disponível) */}
                    {!story.isRedeemed && (
                      <div className="absolute top-5 right-5 z-20 bg-black/60 backdrop-blur-xl border border-white/20 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-[12px_12px_24px_rgba(0,0,0,0.6),inset_4px_4px_8px_rgba(255,255,255,0.06),inset_-4px_-4px_8px_rgba(0,0,0,0.5)]">
                        <div className="size-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.6)]" />
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">
                          <FlashCountdown expiresAt={story.offer.expires_at} />
                        </span>
                      </div>
                    )}

                    {/* Conteúdo Overlay — mesmo padrão do turismo */}
                    <div className="absolute bottom-5 left-5 right-5 z-10">
                      {/* Badge loja — turismo style */}
                      <span className="bg-yellow-400 text-zinc-950 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 inline-flex items-center gap-1.5">
                        <img
                          src={story.offer.admin_users?.store_logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${story.merchant}`}
                          className="size-3.5 rounded-full object-cover"
                          alt="logo"
                        />
                        {story.merchant}
                      </span>
                      <h5 className="text-white text-xl font-black uppercase tracking-tighter leading-none group-hover:text-yellow-400 transition-colors drop-shadow-2xl line-clamp-1 mt-1">
                        {story.name}
                      </h5>
                      <div className="flex items-baseline gap-2 mt-1.5">
                        <span className="text-2xl font-black text-white tracking-tighter drop-shadow-lg">
                          R$ {story.finalPrice}
                        </span>
                        {story.originalPrice && (
                          <span className="text-[10px] text-white/30 line-through font-bold">
                            R$ {story.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de Escassez */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/50 overflow-hidden">
                       <motion.div
                         initial={{ width: "100%" }}
                         animate={{ width: "15%" }}
                         transition={{ duration: 60, repeat: Infinity, repeatType: "reverse" }}
                         className="h-full bg-yellow-400"
                       />
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
                  <h3 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">Cupons</h3>
                  <div className="flex items-center gap-2">
                    <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                    <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">{availableCoupons.length} Cupons Ativos</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 -mx-5 px-5">
                {availableCoupons.map((coupon, i) => {
                   const isCopied = copiedCoupon === coupon.coupon_code;

                   return (
                     <motion.div 
                       key={coupon.id || i} 
                       whileTap={{ scale: 0.98 }}
                       onClick={() => {
                         if (!coupon.coupon_code) return;
                         navigator.clipboard.writeText(coupon.coupon_code).catch(() => {});
                         setCopiedCoupon(coupon.coupon_code);
                         setTimeout(() => setCopiedCoupon(null), 2000);
                         showToast("Código promocional copiado!", "success");
                       }}
                       className="relative flex-shrink-0 w-[330px] h-[180px] rounded-[32px] overflow-hidden group cursor-pointer transition-all snap-center shadow-2xl border border-white/5 bg-zinc-900"
                     >
                        {/* Background Image - O cupom completo enviado pelo lojista */}
                        <img 
                          src={coupon.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500&auto=format&fit=crop"}
                          alt="Cupom" 
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[4s]"
                        />


                     </motion.div>
                   );
                })}
              </div>
            </section>
          )}

          {/* CARROSSEL DE SERVIÇOS EM GRID (DUAS LINHAS) */}
          <div className="grid grid-rows-2 grid-flow-col gap-4 overflow-x-auto no-scrollbar pb-8 -mx-5 px-5" style={{ gridAutoColumns: '100px' }}>
            {deliveryServices.map((svc, i) => (
              <div key={i} className="w-full h-full">
                {renderServiceCard(svc, i)}
              </div>
            ))}
          </div>

          {/* MOBILIDADE (CLAY DESIGN) */}
          <section className="bg-zinc-800 rounded-[50px] p-8 shadow-[15px_15px_40px_rgba(0,0,0,0.5),inset_10px_10px_20px_rgba(255,255,255,0.02),inset_-10px_-10px_20px_rgba(0,0,0,0.4)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 size-80 bg-yellow-400 opacity-[0.03] blur-[120px] rounded-full -mr-32 -mt-32 pointer-events-none group-hover:opacity-[0.06] transition-opacity duration-1000" />
            <div className="flex flex-col items-center mb-8 text-center relative z-10">
              <span className="bg-zinc-900/50 text-white/30 text-[7px] font-black px-5 py-2 rounded-full tracking-[0.4em] uppercase mb-4 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.4)]">Izi Connect</span>
              <h2 className="text-4xl font-black tracking-tighter text-white uppercase leading-none drop-shadow-2xl">Vá de Izi.</h2>
            </div>
            <div className="grid grid-cols-4 gap-4 relative z-10 px-1">
              {[
                { icon: "two_wheeler", label: "Moto Izi", action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false, destination: { address: "", lat: null, lng: null } }); navigateSubView("taxi_wizard"); } },
                { icon: "airport_shuttle", label: "Excursões", action: () => { setTransitData({ ...transitData, type: "van", scheduled: true, destination: { address: "", lat: null, lng: null } }); navigateSubView("excursion_wizard"); } },
                { icon: "directions_car", label: "Motorista Particular", action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false, destination: { address: "", lat: null, lng: null } }); navigateSubView("taxi_wizard"); } },
                { icon: "local_shipping", label: "Logística", action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false, destination: { address: "", lat: null, lng: null } }); navigateSubView("freight_wizard"); } },
              ].map((svc, i) => (
                <motion.div 
                  key={i} 
                  whileHover={{ y: -6, scale: 1.08 }}
                  whileTap={{ scale: 0.94 }} 
                  onClick={svc.action} 
                  className="flex flex-col items-center justify-center gap-3 py-6 rounded-[28px] bg-zinc-900 shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.02),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] hover:bg-zinc-800 transition-all cursor-pointer group/card"
                >
                  <div className="relative w-12 h-12 flex items-center justify-center rounded-2xl bg-yellow-400 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
                    <span className="material-symbols-outlined text-2xl text-black font-black transition-all duration-300">
                      {svc.icon}
                    </span>
                  </div>
                  <span className="text-[8px] font-black text-zinc-500 group-hover/card:text-white tracking-widest uppercase transition-colors text-center leading-none">
                    {svc.label}
                  </span>
                </motion.div>
              ))}
            </div>
          </section>

          {/* NOVA SEÇÃO DE TURISMO (HTML Convertido) */}
          <div className="pt-8">
            {/* Hero Section Horizontal Carousel */}
            <section className="mb-12 px-6">
              <h2 className="text-zinc-100 font-bold text-4xl mb-6 tracking-tight">Turismo</h2>
              <div className="flex overflow-x-auto gap-4 no-scrollbar snap-x snap-mandatory -mx-6 px-6">
                {/* Rio de Janeiro */}
                <div className="flex-shrink-0 w-[240px] h-[320px] relative rounded-[32px] overflow-hidden group snap-start cursor-pointer shadow-2xl border border-white/5" onClick={() => showToast("Em breve!", "info")}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.85]" alt="Rio de Janeiro" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2p65n-xY5XwLT1HJaG7-grO2_IX3sUiSM5aF99dGFR3iAhPzBUu7-FGDRAxir5UtMpv6yOp0WbdbGYCkeO1Ig9XUeaDYIW1G5C8SXgTVs4OucSesjxtqC_VWJFU8bksXWW8_fl5NaA444rug4tO3QY0M7lXWKbb2ECz2tbKz2PfwEK7gwfs3GgLFpqJPmqL-LTPuT8HdxwK2TbFCZ97_r3bNt-EnxzuizMQEiFmnxTYuaUpEnIao_UhyitpQ7Lytyd9YKxwkJQZE"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <span className="bg-yellow-400 text-zinc-950 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-2 inline-block">Destaque</span>
                    <h3 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">Rio de Janeiro</h3>
                    <p className="text-zinc-300 text-[10px] mt-1.5 font-medium leading-tight">A Cidade Maravilhosa te espera com vistas de tirar o fôlego.</p>
                  </div>
                </div>
                {/* Lençóis */}
                <div className="flex-shrink-0 w-[240px] h-[320px] relative rounded-[32px] overflow-hidden group snap-start cursor-pointer shadow-2xl border border-white/5" onClick={() => showToast("Em breve!", "info")}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.85]" alt="Lençois" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB9pJtQUFvwTMhb5kOHNQVWVa4scypdDjMI-fzC6Yb5AxrJ9ngRDwIBShljsWaxqjyZwzS5r2TmovVp8S3ZjcsfxhXh53ExX1PKLBVC_BAD4PfuaeIZQhlQ3-qeVWGS2gqHSyQrVfX-2d6SSwy9MogLoHWtAXwu_qcOqjmsJ1RPsEBkQItbwCrNJpST3gTzADr509nhW9iuFTZEo3hH-uU5RvXFiLC9rBO9t6IkRzRn7DfwOxLSlh6sbpA8bTCJyOZUoCI8OKp_u4I"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <h3 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">Lençóis</h3>
                    <p className="text-zinc-300 text-[10px] mt-1.5 font-medium leading-tight">Dunas intermináveis e lagoas cristalinas.</p>
                  </div>
                </div>
                {/* Amazônia */}
                <div className="flex-shrink-0 w-[240px] h-[320px] relative rounded-[32px] overflow-hidden group snap-start cursor-pointer shadow-2xl border border-white/5" onClick={() => showToast("Em breve!", "info")}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 brightness-[0.85]" alt="Amazônia" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDBtt5NYpAq16N5wdors_x3KLtpbg1NdGI4t3QSRDAqOLDNqwoKIYBZBlhojbqT2XIWkg55xUeTWMc-06JQM_0k3r9fOxsYKEUoMVrSh3UR0OCBIjW0l7jp7C_li1o54J-aqQ4UuoDoYwypn9sRV4ohcSxEk076knbWw_az9ggN7nVuyKs3fH8SDi1w8qn68-YAUAXPKRsUKoA7kymmS1BrBp0q7SlVXqK4_5M5DEcv06aCfrGWTI5Kb7aWK0W8H6W_xhtjvyFrQko"/>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                  <div className="absolute bottom-5 left-5 right-5">
                    <h3 className="text-white text-2xl font-black uppercase tracking-tighter leading-none">Amazônia</h3>
                    <p className="text-zinc-300 text-[10px] mt-1.5 font-medium leading-tight">A maior biodiversidade do planeta à sua volta.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Categories (Claymorphism Style Standard) */}
            <section className="mb-12 px-2">
              <div className="flex justify-between items-end mb-6 px-4">
                <div>
                  <p className="text-yellow-400 font-black text-[10px] tracking-[0.2em] uppercase">Categorias</p>
                  <h2 className="text-zinc-100 font-bold text-2xl tracking-tighter leading-none">O que você busca?</h2>
                </div>
                <div></div>
              </div>
              <div className="grid grid-cols-4 gap-4 px-3">
                {/* Category Card 1 */}
                <motion.div 
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateSubView("explore_hotels")} 
                  className="flex flex-col items-center justify-center gap-3 py-5 rounded-[28px] bg-yellow-400 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:bg-yellow-300 transition-all cursor-pointer group/card"
                >
                  <div className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-900 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]">
                    <span className="material-symbols-outlined text-xl text-yellow-400 font-black transition-transform group-hover/card:scale-110 duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>bed</span>
                  </div>
                  <span className="text-[8px] font-black text-zinc-900 uppercase tracking-widest text-center leading-none">Hospedagens</span>
                </motion.div>
                {/* Category Card 2 */}
                <motion.div 
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => showToast("Em breve!", "info")} 
                  className="flex flex-col items-center justify-center gap-3 py-5 rounded-[28px] bg-yellow-400 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:bg-yellow-300 transition-all cursor-pointer group/card"
                >
                  <div className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-900 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]">
                    <span className="material-symbols-outlined text-xl text-yellow-400 font-black transition-transform group-hover/card:scale-110 duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>event</span>
                  </div>
                  <span className="text-[8px] font-black text-zinc-900 uppercase tracking-widest text-center leading-none">Cultura</span>
                </motion.div>
                {/* Category Card 3 (Bares) */}
                <motion.div 
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateSubView("explore_bars")} 
                  className="flex flex-col items-center justify-center gap-3 py-5 rounded-[28px] bg-yellow-400 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:bg-yellow-300 transition-all cursor-pointer group/card"
                >
                  <div className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-900 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]">
                    <span className="material-symbols-outlined text-xl text-yellow-400 font-black transition-transform group-hover/card:scale-110 duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
                  </div>
                  <span className="text-[8px] font-black text-zinc-900 uppercase tracking-widest text-center leading-none">Bares</span>
                </motion.div>
                {/* Category Card 4 */}
                <motion.div 
                  whileHover={{ y: -6, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => showToast("Em breve!", "info")} 
                  className="flex flex-col items-center justify-center gap-3 py-5 rounded-[28px] bg-yellow-400 shadow-[8px_8px_16px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] hover:bg-yellow-300 transition-all cursor-pointer group/card"
                >
                  <div className="relative w-11 h-11 flex items-center justify-center rounded-2xl bg-zinc-900 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.4)]">
                    <span className="material-symbols-outlined text-xl text-yellow-400 font-black transition-transform group-hover/card:scale-110 duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>nightlife</span>
                  </div>
                  <span className="text-[8px] font-black text-zinc-900 uppercase tracking-widest text-center leading-none">Noite</span>
                </motion.div>
              </div>
            </section>
          </div>


          {/* FAVORITOS */}
          <section className="space-y-6">
            <div className="flex justify-between items-end px-1">
              <div className="space-y-1">
                <h3 className="text-2xl font-black tracking-tighter text-white uppercase leading-none">Favoritos da região</h3>
                <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Os melhores perto de você</p>
                </div>
              </div>
              <div></div>
            </div>
            
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-5 px-5">
              {ESTABLISHMENTS.map((shop, i) => (
                <motion.div 
                  key={shop.id || i}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleShopClick(shop)}
                  className="relative flex-shrink-0 w-[160px] group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-700 group-hover:border-white/20 shadow-[12px_12px_30px_rgba(0,0,0,0.7),inset_6px_6px_12px_rgba(255,255,255,0.02),inset_-6px_-6px_12px_rgba(0,0,0,0.5)]">
                    <img src={shop.img} className="size-full object-cover brightness-[0.7] group-hover:scale-110 transition-transform duration-1000" alt={shop.name} />
                    <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/60 to-transparent p-5 flex flex-col justify-end gap-3">
                      <div className="flex flex-col items-start gap-2">
                         <div className="flex items-center gap-1 bg-zinc-900 px-2.5 py-1.5 rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] border border-white/5">
                            <span className="material-symbols-outlined text-yellow-400 text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-[11px] font-black text-white">{shop.rating}</span>
                         </div>
                         <div className="bg-zinc-900 px-2.5 py-1.5 rounded-xl shadow-[4px_4px_8px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.3)] border border-white/5">
                            <span className="text-[10px] font-black text-yellow-400 uppercase tracking-tighter">{shop.time}</span>
                         </div>
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-base font-black text-white leading-tight tracking-tight uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{shop.name}</h4>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest drop-shadow-md">{shop.tag}</p>
                      </div>
                    </div>
                    {shop.freeDelivery && (
                      <div className="absolute top-4 right-4 z-20">
                         <div className="bg-yellow-400 text-black px-2.5 py-1.5 rounded-xl shadow-[4px_4px_12px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.4)] flex items-center justify-center border border-black/10">
                            <span className="text-[8px] font-black uppercase tracking-tighter">Frete Grátis</span>
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
