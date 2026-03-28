import React from 'react';
import { motion } from "framer-motion";

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
  flashOffers,
  setActiveService,
  transitData,
  setTransitData,
  setExploreCategoryState,
  setRestaurantInitialCategory,
  isIziBlackMembership,
  setTab,
}) => {
  const handleBannerClick = () => {
    if (isIziBlackMembership) {
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

  const activeStories = flashOffers.map((offer: any) => {
    const expiresAt = new Date(offer.expires_at);
    const now = new Date();
    const diffMs = expiresAt.getTime() - now.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const timeLeft = diffHrs > 0 ? diffHrs + "h" : diffMins + "min";
    const discount = offer.discount_percent
      ? offer.discount_percent + "% OFF"
      : offer.discounted_price && offer.original_price
        ? Math.round((1 - offer.discounted_price / offer.original_price) * 100) + "% OFF"
        : "Oferta";

    return {
      id: offer.id,
      merchant: offer.admin_users?.store_name || offer.merchant_name || "Loja",
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
      {/* HEADER PREMIUM - REFORMULADO COM PERFIL ONE-CLICK */}
      <header className="sticky top-0 z-[60] flex flex-col w-full bg-black/40 backdrop-blur-2xl border-b border-white/5 transition-all duration-300">
        <div className="flex justify-between items-center px-5 py-3">
          {/* Avatar / Perfil no Click */}
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

          {/* Endereço Centralizado ou ao lado */}
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


      <main className="px-5 pb-10 flex flex-col gap-8">
        {/* SEARCH */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-colors text-xl">search</span>
          </div>
          <input
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-2xl py-4 pl-14 pr-12 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all text-sm font-medium"
            placeholder="O que você deseja pedir hoje?"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 right-5 flex items-center">
            {searchQuery
              ? <button onClick={() => setSearchQuery("")}><span className="material-symbols-outlined text-zinc-500 text-sm">close</span></button>
              : <span className="material-symbols-outlined text-zinc-500 text-xl">tune</span>
            }
          </div>
        </div>

        {/* PEDIDO ATIVO */}
        {activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => { setSelectedItem(activeOrder); setSubView("active_order"); }}
            className="bg-yellow-400 text-black p-5 rounded-2xl flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden"
          >
            <div className="size-12 rounded-xl bg-black/10 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">moped</span>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-black/60">Pedido em andamento</p>
              <h4 className="font-black text-base leading-tight">Acompanhar entrega em tempo real</h4>
            </div>
            <div className="size-2 bg-red-500 rounded-full animate-ping shrink-0" />
          </motion.div>
        )}

        {/* HERO IMMERSIVE (SEM BORDAS OU FUNDO DE CARD) */}
        <section className="-mx-5 -mt-8 relative h-[300px] overflow-hidden group cursor-pointer" onClick={handleBannerClick}>
            {/* Imagem de Fundo de Alta Fidelidade com Fade para Preto */}
            <div className="absolute inset-0 z-0">
               <img 
                 className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-1000" 
                 src="https://images.unsplash.com/photo-1604871000636-074fa5117945?q=80&w=1600" 
                 alt="Izi Black Elite" 
               />
               <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent" />
            </div>

            {/* Conteúdo Flutuante */}
            <div className="relative z-10 h-full flex flex-col justify-end px-8 pb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-yellow-400 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Izi Black</span>
                  <div className="h-[1px] w-12 bg-white/20" />
                </div>
                <h2 className="text-4xl font-black text-white leading-none tracking-tighter uppercase italic drop-shadow-2xl">
                  Sinta o <br />
                  <span className="text-yellow-400 italic">Poder</span> da Elite.
                </h2>
                <p className="text-zinc-300 text-xs font-medium mt-3 mb-6 max-w-[260px] leading-relaxed">
                  Taxa zero, suporte humano e ofertas sensoriais exclusivas para membros Izi Black.
                </p>
                <button className="w-fit bg-white/5 backdrop-blur-md border border-white/10 text-white font-black text-[10px] uppercase tracking-[0.2em] px-8 py-3.5 rounded-2xl hover:bg-white hover:text-black transition-all active:scale-95 shadow-2xl">
                  Explorar Benefícios
                </button>
            </div>
        </section>

        {/* CARROSSEL NATIVO IMERSIVO (SEM CARD BOXES) */}
        <section className="-mx-5 mt-4">
            {/* Header da Seção */}
            <div className="px-5 mb-4 flex justify-between items-center">
               <h3 className="text-sm font-black uppercase tracking-widest text-zinc-100 italic">Ofertas do Dia</h3>
               <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest cursor-pointer">Ver Tudo</span>
            </div>

            <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-5 gap-3">
               {/* Slide 1: Farmácia */}
               <div className="snap-center min-w-[300px] h-44 relative overflow-hidden rounded-[2.5rem] group flex-shrink-0">
                  <img className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1579165466541-74e2ae162b6a?q=80&w=800" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent p-7 flex flex-col justify-center">
                    <span className="text-yellow-400 text-[9px] font-black uppercase mb-1">Cuidado Diário</span>
                    <h4 className="text-xl font-black text-white leading-tight uppercase">Mês do<br/>Consumidor</h4>
                    <p className="text-yellow-400 text-3xl font-black italic mt-1 leading-none">60% OFF</p>
                  </div>
               </div>

               {/* Slide 2: Burger */}
               <div className="snap-center min-w-[300px] h-44 relative overflow-hidden rounded-[2.5rem] group flex-shrink-0">
                  <img className="absolute inset-0 w-full h-full object-cover brightness-75" src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?q=80&w=800" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-7 flex flex-col justify-end">
                    <h4 className="text-xl font-black text-white leading-tight uppercase italic">Noites de<br/>Burgers</h4>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">Ao vivo</span>
                       <p className="text-white font-black text-sm">Taxa Grátis</p>
                    </div>
                  </div>
               </div>

               {/* Slide 3: Mercado */}
               <div className="snap-center min-w-[300px] h-44 relative overflow-hidden rounded-[2.5rem] group flex-shrink-0">
                  <img className="absolute inset-0 w-full h-full object-cover" src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=800" />
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/60 via-black/80 to-black p-7 flex flex-col justify-center">
                    <span className="text-emerald-400 text-[9px] font-black uppercase mb-1">Fresco & Rápido</span>
                    <h4 className="text-xl font-black text-white leading-tight uppercase">Sua feira<br/>em 15 min</h4>
                    <button className="mt-4 w-fit bg-emerald-500 text-white font-black text-[8px] uppercase px-4 py-2 rounded-xl">Pedir Agora</button>
                  </div>
               </div>

               {/* Slide 4: Sushi / Orient Express */}
               <div className="snap-center min-w-[300px] h-44 relative overflow-hidden rounded-[2.5rem] group flex-shrink-0">
                  <img className="absolute inset-0 w-full h-full object-cover brightness-75" src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800" />
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-600/60 via-black/80 to-transparent p-7 flex flex-col justify-center">
                    <span className="text-orange-400 text-[9px] font-black uppercase mb-1">Culinária Oriental</span>
                    <h4 className="text-xl font-black text-white leading-tight uppercase">Festival<br/>do Sushi</h4>
                    <p className="text-white text-[10px] mt-2 font-medium">Kits exclusivos a partir de R$ 49</p>
                  </div>
               </div>

               {/* Slide 5: Drinks e Happy Hour */}
               <div className="snap-center min-w-[300px] h-44 relative overflow-hidden rounded-[2.5rem] group flex-shrink-0">
                  <img className="absolute inset-0 w-full h-full object-cover brightness-[0.6]" src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=800" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-7 flex flex-col justify-end">
                    <span className="text-purple-400 text-[9px] font-black uppercase mb-1">Adega Izi</span>
                    <h4 className="text-xl font-black text-white leading-tight uppercase italic">Happy Hour<br/>começou</h4>
                    <div className="mt-3 flex items-center gap-2">
                       <span className="size-2 bg-purple-500 rounded-full animate-pulse" />
                       <span className="text-white font-bold text-[10px]">Gelada em 20 min</span>
                    </div>
                  </div>
               </div>

               {/* Slide 6: Pet Shop / Amigo Izi */}
               <div className="snap-center min-w-[300px] h-44 relative overflow-hidden rounded-[2.5rem] group flex-shrink-0">
                  <img className="absolute inset-0 w-full h-full object-cover brightness-90" src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=800" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 via-black/90 to-black p-7 flex flex-col justify-center">
                    <span className="text-blue-400 text-[9px] font-black uppercase mb-1">Tudo pro seu Pet</span>
                    <h4 className="text-xl font-black text-white leading-tight uppercase">Ração e <br/>Mimos Izi</h4>
                    <button className="mt-4 w-fit bg-blue-500 text-white font-black text-[8px] uppercase px-4 py-2 rounded-xl">Explorar</button>
                  </div>
               </div>
            </div>
        </section>

        {/* GRADE DE SERVIÇOS */}
        <section className="grid grid-cols-3 gap-y-10 gap-x-6">
          {deliveryServices.map((svc, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleServiceSelection(svc)}
              className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-all"
            >
              <div className="relative w-24 h-24 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
                <div className="absolute inset-0 bg-yellow-400/10 blur-[30px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="material-symbols-outlined text-6xl text-white group-hover:text-yellow-400 transition-colors" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,9,0.25))" }}>
                  {svc.icon}
                </span>
              </div>
              <span className="text-[10px] font-black text-zinc-500 group-hover:text-yellow-400 tracking-[0.3em] uppercase transition-colors">{svc.label}</span>
            </motion.div>
          ))}
        </section>

        {/* CUPONS */}
        {availableCoupons.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black tracking-tight text-zinc-100">Cupons Disponíveis</h3>
              <span className="text-[10px] font-black text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full">
                {availableCoupons.length} {availableCoupons.length === 1 ? "cupom" : "cupons"}
              </span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {availableCoupons.map((coupon, i) => {
                const isCopied = copiedCoupon === coupon.coupon_code;
                return (
                  <motion.div key={coupon.id || i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                    className="flex-shrink-0 w-64 h-28 bg-zinc-900/60 rounded-2xl p-5 flex justify-between items-center border border-zinc-800/60">
                    <div>
                      <p className="text-yellow-400 text-[10px] font-bold mb-1 uppercase tracking-wider">CUPOM ATIVO</p>
                      <h5 className="text-base font-black text-white font-mono tracking-widest">{coupon.coupon_code}</h5>
                      <p className="text-zinc-500 text-[10px] mt-1">
                        {coupon.discount_type === "fixed" ? `R$ ${coupon.discount_value?.toFixed(2)} OFF` : `${coupon.discount_value}% OFF`}
                        {coupon.min_order_value > 0 && ` • Mín R$${coupon.min_order_value}`}
                      </p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(coupon.coupon_code).catch(() => {}); setCopiedCoupon(coupon.coupon_code); setTimeout(() => setCopiedCoupon(null), 2000); }}
                      className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center active:scale-90 transition-all">
                      <span className={`material-symbols-outlined text-lg ${isCopied ? "text-emerald-400" : "text-yellow-400"}`}>
                        {isCopied ? "check_circle" : "content_copy"}
                      </span>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        {/* FLASH OFFERS */}
        {activeStories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-zinc-100 uppercase tracking-[0.2em]">Izi Flash</h3>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">Ao Vivo</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {activeStories.map(story => (
                <div key={story.id}
                  onClick={() => {
                    if (story.isMaster && userLevel < 10) showToast("Esta oferta é exclusiva para membros Tier MASTER.", "info");
                    else if (story.isMaster) setShowMasterPerks(true);
                    else showToast(`Izi Flash: Oferta de ${story.discount} ativada para ${story.merchant}!`, "success");
                  }}
                  className={`relative flex-shrink-0 size-24 rounded-[28px] p-[2px] bg-gradient-to-tr ${story.isMaster ? "from-amber-400 via-yellow-400 to-orange-600" : "from-yellow-400 via-orange-400 to-rose-500"} cursor-pointer active:scale-95 transition-all group`}>
                  <div className="size-full rounded-[26px] overflow-hidden bg-zinc-900 border-2 border-zinc-900 relative">
                    <img src={story.img} className="size-full object-cover opacity-70 group-hover:scale-110 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2.5">
                      <p className="text-[7px] font-black text-white uppercase tracking-tighter truncate">{story.merchant}</p>
                      <p className="text-[10px] font-black text-yellow-400 italic">{story.discount}</p>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full">
                      <p className="text-[6px] font-black text-white">{story.timeLeft}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* MOBILIDADE */}
        <section className="bg-zinc-900/20 rounded-[32px] p-8 border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 size-40 bg-yellow-400/5 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
          <div className="flex flex-col items-center mb-10 text-center relative z-10">
            <p className="text-[9px] font-black text-yellow-400 tracking-[0.5em] uppercase mb-2">Ecossistema Urbano</p>
            <h2 className="text-2xl font-black tracking-tighter text-white italic uppercase">Mobilidade Izi</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-12 gap-x-8 relative z-10 p-4">
            {[
              { icon: "two_wheeler", label: "Mototáxi", action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false }); navigateSubView("taxi_wizard"); } },
              { icon: "airport_shuttle", label: "Van", action: () => { setTransitData({ ...transitData, type: "van", scheduled: false }); navigateSubView("van_wizard"); } },
              { icon: "directions_car", label: "Motorista Particular", action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false }); navigateSubView("taxi_wizard"); } },
              { icon: "local_shipping", label: "Frete", action: () => { setTransitData({ ...transitData, type: "utilitario", scheduled: false }); navigateSubView("freight_wizard"); } },
            ].map((svc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={svc.action}
                className="flex flex-col items-center gap-4 group cursor-pointer active:scale-95 transition-all"
              >
                <div className="relative w-24 h-24 flex items-center justify-center transition-all duration-700 group-hover:scale-110">
                  <div className="absolute inset-0 bg-yellow-400/10 blur-[30px] rounded-full opacity-60 group-hover:opacity-100 transition-opacity" />
                  <span className="material-symbols-outlined text-6xl text-white group-hover:text-yellow-400 transition-colors" style={{ filter: "drop-shadow(0 0 20px rgba(255,215,9,0.25))" }}>
                    {svc.icon}
                  </span>
                </div>
                <span className="text-[10px] font-black text-zinc-500 group-hover:text-yellow-400 tracking-[0.3em] uppercase transition-colors text-center leading-tight">
                  {svc.label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* FAVORITOS DA REGIÃO */}
        <section className="space-y-6">
          <div className="flex justify-between items-end px-1">
            <div className="space-y-1">
              <h3 className="text-xl font-black tracking-tighter text-white italic uppercase">Favoritos</h3>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Bombando Agora</p>
              </div>
            </div>
            <button className="text-[10px] font-black text-yellow-400 uppercase tracking-widest px-4 py-2 bg-yellow-400/5 rounded-xl border border-yellow-400/10 active:scale-95 transition-all">Ver todos</button>
          </div>
          
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-5 px-5">
            {ESTABLISHMENTS.map((shop, i) => (
              <motion.div 
                key={shop.id || i}
                onClick={() => handleShopClick(shop)}
                className="relative flex-shrink-0 w-[180px] group cursor-pointer"
              >
                <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden bg-zinc-900 border border-white/5 transition-all duration-500 group-hover:border-white/20 group-hover:shadow-2xl group-hover:shadow-black">
                  <img src={shop.img} className="size-full object-cover brightness-75 group-hover:scale-110 transition-transform duration-700" alt={shop.name} />
                  
                  {/* Overlay Gradiente Premium */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-5 flex flex-col justify-end">
                    <div className="flex items-center gap-1.5 mb-2">
                       <div className="flex items-center gap-0.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5">
                          <span className="material-symbols-outlined text-yellow-400 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-[10px] font-black text-white">{shop.rating}</span>
                       </div>
                       <span className="text-[8px] font-black text-white/50 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg border border-white/5 uppercase tracking-tighter">{shop.time}</span>
                    </div>
                    <h4 className="text-sm font-black text-white leading-tight tracking-tight uppercase italic">{shop.name}</h4>
                    <p className="text-[9px] font-bold text-zinc-400/80 truncate mt-1">{shop.tag}</p>
                  </div>

                  {/* Badge de Entrega Grátis (Redesenhado) */}
                  {shop.freeDelivery && (
                    <div className="absolute top-3 right-3 z-20">
                       <span className="bg-yellow-400 text-black text-[9px] font-black px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1 border border-black/10">
                          <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                          FRETE GRÁTIS
                       </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
