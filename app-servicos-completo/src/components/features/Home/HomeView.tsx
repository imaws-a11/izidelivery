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
  isIziBlackMembership: boolean;
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
  isIziBlackMembership,
}) => {
  const handleBannerClick = () => {
    if (isIziBlackMembership) {
      navigateSubView("exclusive_offer");
    } else {
      navigateSubView("izi_black_purchase");
    }
  };

  const deliveryServices = [
    { icon: "restaurant",     label: "Restaurantes", type: "restaurant", action: null },
    { icon: "local_mall",     label: "Mercados",     type: "market",     action: null },
    { icon: "local_bar",      label: "Bebidas",      type: "beverages",  action: null },
    { icon: "local_pharmacy", label: "Saúde",        type: "pharmacy",   action: null },
    { icon: "pedal_bike",     label: "Logística",    type: null,         action: () => { setTransitData({ ...transitData, type: "utilitario", destination: "" }); navigateSubView("explore_envios"); } },
    { icon: "pets",           label: "Petshop",      type: "generic",    action: () => { setExploreCategoryState({ id: "pets", title: "Pet Shop Premium", tagline: "Mimo para seu melhor amigo", primaryColor: "rose-500", icon: "pets", banner: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=1200" }); navigateSubView("explore_category"); } },
  ];

  const handleServiceSelection = (cat: any) => {
    if (cat.action) return cat.action();
    setActiveService(cat);
    if (cat.type === "restaurant") navigateSubView("restaurant_list");
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
      {/* HEADER */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-6 py-5"
        style={{ background: "linear-gradient(to bottom, #000000 60%, transparent)" }}>
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setSubView(subView === "addresses" ? "none" : "addresses")}>
          <div className="relative">
            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-yellow-400/20">
              <img className="w-full h-full object-cover" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`} alt="User" />
            </div>
            {userLevel >= 10 && (
              <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-[0_0_10px_rgba(255,215,9,0.5)]">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                VIP
              </div>
            )}
          </div>
          <div>
            <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-widest">Entregar em</p>
            <div className="flex items-center gap-1">
              <span className="text-zinc-100 font-bold text-sm tracking-tight max-w-[150px] truncate">
                {userLocation.loading ? "Buscando..." : userLocation.address}
              </span>
              <span className="material-symbols-outlined text-yellow-400 text-sm">expand_more</span>
            </div>
          </div>
        </div>

        <h1 className="text-lg font-extrabold tracking-[0.4em] italic text-yellow-400 hidden md:block uppercase">IZI</h1>

        <div className="flex items-center gap-3">
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800/50 transition-all active:scale-95">
            <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>
            )}
          </button>
          <button onClick={() => setSubView("quest_center")} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-800/50 transition-all active:scale-95">
            <span className="material-symbols-outlined text-zinc-100">notifications</span>
          </button>
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

        {/* BANNER PROMO */}
        <section>
          <div className="relative h-44 w-full rounded-2xl overflow-hidden group cursor-pointer" onClick={handleBannerClick}>
            <img className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700" src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800" alt="Promo" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent flex flex-col justify-center p-7">
              <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Oferta VIP</span>
              <h2 className="text-2xl font-extrabold text-white leading-tight">Ganhe 50% OFF<br/>na Primeira Entrega</h2>
              <p className="text-zinc-300 text-xs mt-1.5 font-medium">Use o código: IZI-FIRST</p>
            </div>
          </div>
        </section>

        {/* CARD ELITE */}
        <section>
          <div className="relative overflow-hidden rounded-[2rem] h-48 flex items-center p-7 bg-gradient-to-br from-zinc-900/60 to-black border border-white/5">
            <div className="relative z-10 space-y-2">
              <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.3em]">Privilégio Elite</span>
              <h2 className="text-2xl font-extrabold text-white leading-tight tracking-tight">Taxa zero em<br/>toda a cidade.</h2>
              <p className="text-zinc-500 text-xs font-medium max-w-[190px]">A velocidade máxima do ecossistema IZI Black ao seu comando.</p>
            </div>
            <div className="absolute right-[-5%] top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
              <span className="material-symbols-outlined text-[160px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 0" }}>delivery_dining</span>
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

        {/* FAVORITOS DA REGIÃO */}
        <section>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="text-xl font-extrabold tracking-tight text-white">Favoritos da Região</h3>
              <p className="text-zinc-500 text-xs mt-0.5">Os mais pedidos agora</p>
            </div>
            <button className="text-yellow-400 text-xs font-bold hover:underline">Ver todos</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ESTABLISHMENTS.filter(e => e.type === 'restaurant').length > 0 && (
              <div className="md:col-span-2 group cursor-pointer" onClick={() => handleShopClick(ESTABLISHMENTS.find(e => e.type === 'restaurant'))}>
                <div className="relative rounded-2xl overflow-hidden aspect-video">
                  <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={ESTABLISHMENTS[0].img} alt={ESTABLISHMENTS[0].name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-5 flex flex-col justify-end">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded uppercase">Exclusivo</span>
                      <div className="flex items-center text-yellow-400 text-xs font-bold">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                        {ESTABLISHMENTS[0].rating}
                      </div>
                    </div>
                    <h4 className="text-lg font-bold text-white">{ESTABLISHMENTS[0].name}</h4>
                    <p className="text-zinc-400 text-xs">{ESTABLISHMENTS[0].tag} • {ESTABLISHMENTS[0].time} • {ESTABLISHMENTS[0].freeDelivery ? "Grátis" : ESTABLISHMENTS[0].fee}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-6">
              {ESTABLISHMENTS.slice(1, 3).map((shop) => (
                <div key={shop.id} className="group cursor-pointer" onClick={() => handleShopClick(shop)}>
                  <div className="relative rounded-2xl overflow-hidden aspect-video">
                    <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={shop.img} alt={shop.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent p-4 flex flex-col justify-end">
                      <h4 className="font-bold text-white text-sm">{shop.name}</h4>
                      <p className="text-zinc-400 text-xs">{shop.tag} • {shop.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MOBILIDADE */}
        <section>
          <div className="mb-10 text-center">
            <p className="text-[10px] font-black text-yellow-400 tracking-[0.4em] uppercase mb-1">Ecossistema Urbano</p>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Mobilidade e Transporte</h2>
          </div>
          <div className="grid grid-cols-2 gap-y-12 gap-x-8">
            {[
              { icon: "two_wheeler", label: "Mototáxi", action: () => { setTransitData({ ...transitData, type: "mototaxi", scheduled: false }); navigateSubView("taxi_wizard"); } },
              { icon: "airport_shuttle", label: "Van", action: () => { setTransitData({ ...transitData, type: "van", scheduled: false }); navigateSubView("van_wizard"); } },
              { icon: "directions_car", label: "Motorista\nParticular", action: () => { setTransitData({ ...transitData, type: "carro", scheduled: false }); navigateSubView("taxi_wizard"); } },
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
                  {svc.label.split("\n").map((line: string, j: number) => (
                    <span key={j}>{line}{j < svc.label.split("\n").length - 1 && <br/>}</span>
                  ))}
                </span>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
