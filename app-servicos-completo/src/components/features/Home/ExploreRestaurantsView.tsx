import React, { useState, useMemo, useEffect, useRef } from "react";
import { ExploreBanners } from "../../common/ExploreBanners";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../contexts/AppContext";
import { Icon } from "../../common/Icon";
import { MerchantCard } from "../Establishment/MerchantCard";

interface ExploreRestaurantsViewProps {
  setSubView: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  foodCategories: any[];
  availableCoupons: any[];
  establishments: any[];
  onShopClick: (shop: any) => void;
  copiedCoupon: string | null;
  setCopiedCoupon: (c: string | null) => void;
  initialCategory?: string;
  isIziBlackMembership?: boolean;
  exploreBanners?: any[];
}

export const ExploreRestaurantsView = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  foodCategories,
  availableCoupons,
  establishments,
  onShopClick,
  copiedCoupon,
  setCopiedCoupon,
  initialCategory = "Todos",
  isIziBlackMembership = false,
  exploreBanners = []
}: ExploreRestaurantsViewProps) => {
  const { activeService, navigateSubView } = useApp();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const topServices = [
    { label: "Restaurantes", icon: "restaurant" },
    { label: "Mercados", icon: "shopping_cart" },
    { label: "Farmácias", icon: "medical_services" },
    { id: "bebidas", label: "Bebidas", icon: "local_bar" },
    { label: "Gás e Água", icon: "local_fire_department" },
    { id: "pet", label: "Petshop", icon: "pets" },
  ];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 40);
  };

  // Fallback para ícones no estilo SVG / Material
  const categoryIcons: Record<string, string> = {
    "Todos": "restaurant_menu",
    "Promoções": "local_offer",
    "Burguer": "lunch_dining",
    "Pizza": "local_pizza",
    "Japonês": "set_meal",
    "Brasileira": "stew",
    "Saudável": "eco",
    "Italiana": "ramen_dining",
    "Marmita": "takeout_dining",
    "Carnes": "kebab_dining",
    "Doces": "icecream",
  };

  const categories = useMemo(() => {
    if (foodCategories && foodCategories.length > 0) {
      return foodCategories.map(c => ({
        id: c.name || c.id,
        label: c.name,
        img: (c.icon && c.icon.startsWith('http')) ? c.icon : undefined,
        icon: categoryIcons[c.name] || "restaurant",
      }));
    }
    return [
      { id: "Todos", label: "Tudo", icon: categoryIcons["Todos"] },
      { id: "Promoções", label: "Promoções", icon: categoryIcons["Promoções"] },
      { id: "Burguer", label: "Burguer", icon: categoryIcons["Burguer"] },
      { id: "Pizza", label: "Pizza", icon: categoryIcons["Pizza"] },
      { id: "Japonês", label: "Japonês", icon: categoryIcons["Japonês"] },
    ];
  }, [foodCategories]);

  const filteredShops = useMemo(() => {
    return establishments.filter(shop => {
      const type = shop.type?.toLowerCase() || "";
      const isRestaurante = type.includes("restaurant") || type.includes("restaurante");
                            
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           shop.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           shop.foodCategory?.some((c: string) => c.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           shop.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
                            
      const matchesCat = activeCategory === "Todos" || 
                        shop.category?.toLowerCase().includes(activeCategory.toLowerCase()) || 
                        shop.foodCategory?.some((c: string) => c.toLowerCase().includes(activeCategory.toLowerCase())) ||
                        shop.tags?.some((t: string) => t.toLowerCase().includes(activeCategory.toLowerCase()));
      
      return isRestaurante && matchesSearch && matchesCat;
    });
  }, [establishments, searchQuery, activeCategory]);

  const featuredShops = useMemo(() => filteredShops.slice(0, 3), [filteredShops]);

  return (
    <div className="absolute inset-0 z-[140] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar font-sans select-none">
      
      {/* HEADER PREMIUM IDENTICO AO GENERIC */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-6 flex items-center gap-4">
        <button 
          onClick={() => navigateSubView("home")}
          className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-rounded text-zinc-900">arrow_back_ios_new</span>
        </button>
        
        <div className="flex-1 relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-rounded text-zinc-400">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar em Restaurantes"
            className="w-full h-14 bg-zinc-50 rounded-[20px] pl-14 pr-6 text-sm font-black uppercase tracking-tighter focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-100"
          />
        </div>
      </header>

      {/* SUB-HEADER TABS IDENTICO AO GENERIC */}
      <section className="px-6 py-2 border-b border-zinc-50">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
            {topServices.map(svc => (
              <button 
                key={svc.label}
                onClick={() => {
                  const viewMap: Record<string, string> = {
                    "Restaurantes": "explore_restaurants",
                    "Mercados": "explore_market",
                    "Farmácias": "explore_pharmacy",
                    "Bebidas": "explore_beverages",
                    "Gás e Água": "explore_gas",
                    "Petshop": "explore_petshop"
                  };
                  const targetView = viewMap[svc.label];
                  if (targetView) navigateSubView(targetView);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                  svc.label === "Restaurantes" 
                  ? "bg-yellow-400 border-yellow-400 text-black font-black" 
                  : "bg-zinc-100 border-zinc-100 text-zinc-500 font-bold hover:bg-zinc-200"
                }`}
              >
                <span className="material-symbols-rounded text-[20px]">{svc.icon}</span>
                <span className="text-[10px] uppercase tracking-widest">{svc.label}</span>
              </button>
            ))}
         </div>
      </section>

      {/* CONTEÚDO DINÂMICO (Anima apenas o conteúdo abaixo das abas) */}
      <AnimatePresence mode="wait">
        <motion.div
          key="explore_restaurants"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1"
        >

         {/* ── BANNERS DE EXPLORAÇÃO (ADMIN) ── */}
         <ExploreBanners banners={exploreBanners} serviceType="Restaurante" />

         {/* ── SEÇÃO DE CUPONS (Design Sincronizado com Busca) ── */}
         {availableCoupons && availableCoupons.length > 0 && (
           <section className="mb-10">
              <div className="flex items-center justify-between px-6 mb-4">
                 <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Alguém buscando cupons?</h2>
                 <span className="material-symbols-rounded text-yellow-500">confirmation_number</span>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
                 {availableCoupons.map((coupon, i) => (
                   <motion.div 
                     key={i} 
                     whileTap={{ scale: 0.95 }}
                     onClick={() => {
                       setCopiedCoupon(coupon.code);
                       setTimeout(() => setCopiedCoupon(null), 2000);
                     }}
                     className="relative min-w-[150px] h-24 bg-yellow-400 rounded-3xl flex flex-col items-center justify-center shadow-lg shadow-yellow-100 cursor-pointer overflow-hidden"
                   >
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-4 bg-[#F8F9FA] rounded-full" />
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 size-4 bg-[#F8F9FA] rounded-full" />
                      
                      <span className="text-black text-[8px] font-black uppercase opacity-60 leading-none mb-1">Cupom de</span>
                      <span className="text-black text-2xl font-black italic tracking-tighter leading-none">
                        {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
                      </span>
                      <span className="text-black text-[7px] font-black uppercase tracking-widest mt-1 opacity-40">{coupon.code}</span>

                      {copiedCoupon === coupon.code && (
                        <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
                           <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Copiado!</span>
                        </div>
                      )}
                   </motion.div>
                 ))}
              </div>
           </section>
         )}

        {/* CATEGORIAS DE PRODUTOS (CARDS IMERSIVOS) */}
        <section className="px-6 py-8 bg-zinc-50/30 mb-12">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter px-1">Categorias</h3>
              {activeCategory !== "Todos" && (
                 <button 
                   onClick={() => setActiveCategory("Todos")}
                   className="text-[10px] font-black text-yellow-600 uppercase tracking-widest"
                 >
                   Limpar Filtro
                 </button>
              )}
           </div>
           <div className="flex gap-8 overflow-x-auto no-scrollbar px-6 -mx-6 pb-4">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <motion.div 
                    key={cat.id} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(isActive ? "Todos" : cat.id)}
                    className="flex flex-col items-center gap-4 min-w-[85px] cursor-pointer group"
                  >
                     <div className={`size-16 rounded-3xl flex items-center justify-center border shadow-sm transition-all relative overflow-hidden active:scale-90 ${
                       isActive 
                         ? 'bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 border-yellow-300 shadow-lg shadow-yellow-400/30 scale-105' 
                         : 'bg-zinc-50 border-zinc-100 group-hover:bg-yellow-50'
                     }`}>
                        {cat.img ? (
                          <img src={cat.img} alt={cat.label} className={`size-10 object-contain relative z-[1] transition-transform duration-700 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                        ) : (
                          <span className={`material-symbols-rounded text-[28px] relative z-[1] ${isActive ? 'text-black' : 'text-zinc-400'}`}>
                            {cat.icon || 'category'}
                          </span>
                        )}
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight transition-colors ${
                       isActive ? 'text-yellow-600' : 'text-zinc-500'
                     }`}>{cat.label}</span>
                  </motion.div>
                );
              })}
           </div>
        </section>

        {/* ── PRODUTOS REAIS EM DESTAQUE ── */}
        {activeCategory === "Todos" && (() => {
          const realProducts: any[] = [];
          establishments.forEach(shop => {
            if (shop.products && Array.isArray(shop.products)) {
              shop.products.slice(0, 2).forEach(p => realProducts.push({ ...p, storeName: shop.name, shop }));
            }
          });
          
          if (realProducts.length === 0) return null;

          return (
            <section className="mb-12">
               <div className="flex items-center justify-between px-6 mb-6">
                  <h2 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Sugestões Reais</h2>
                  <div className="size-8 rounded-full bg-yellow-50 flex items-center justify-center">
                     <span className="material-symbols-rounded text-yellow-600 text-sm">auto_awesome</span>
                  </div>
               </div>
               <div className="flex gap-5 overflow-x-auto no-scrollbar px-6">
                  {realProducts.slice(0, 8).map((prod, i) => (
                    <motion.div 
                      key={i} 
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onShopClick(prod.shop)}
                      className="min-w-[240px] bg-white rounded-[40px] overflow-hidden shadow-xl shadow-zinc-200/50 border border-zinc-50 group cursor-pointer"
                    >
                       <div className="h-44 relative overflow-hidden bg-zinc-50">
                          {prod.image_url || prod.image ? (
                            <img src={prod.image_url || prod.image} className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={prod.name} />
                          ) : (
                            <div className="size-full flex items-center justify-center text-zinc-200">
                               <span className="material-symbols-rounded text-5xl">restaurant</span>
                            </div>
                          )}
                          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-lg">
                             <span className="text-[10px] font-black text-zinc-900 tracking-tighter">R$ {Number(prod.price).toFixed(2).replace('.', ',')}</span>
                          </div>
                       </div>
                       <div className="p-6">
                          <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tighter line-clamp-1">{prod.name}</h4>
                          <p className="text-[9px] font-bold text-yellow-600 uppercase tracking-widest mt-1">{prod.storeName}</p>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </section>
          );
        })()}

        {/* FEATURED / OS FAVORITOS */}
        {/* FEATURED / OS FAVORITOS */}
        {activeCategory === "Todos" && featuredShops.length > 0 && (
          <section className="mb-12">
             <div className="flex items-center justify-between px-6 mb-6">
                <h2 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter">Famosos no Izi</h2>
                <button className="text-yellow-600 font-black text-[10px] uppercase tracking-widest">Ver ranking</button>
             </div>
             <div className="flex gap-6 overflow-x-auto no-scrollbar px-6">
                {featuredShops.map((shop, i) => {
                  const coverImage = shop.banner_url || shop.banner || shop.image_url || shop.img || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500&auto=format&fit=crop";
                  return (
                    <motion.div 
                      key={shop.id || i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onShopClick(shop)}
                      className="min-w-[280px] h-[340px] bg-white rounded-[44px] overflow-hidden shadow-2xl shadow-zinc-200/50 relative border border-zinc-50 cursor-pointer"
                    >
                       <img src={coverImage} className="size-full object-cover" alt={shop.name} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                          <div className="flex items-center gap-2 mb-2">
                             <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Top {i + 1}</div>
                             <div className="flex items-center gap-1 text-white text-[12px] font-bold">
                                <Icon name="star" size={12} className="text-yellow-400 fill-1" />
                                {shop.rating || "4.9"}
                             </div>
                          </div>
                          <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">{shop.name}</h3>
                          <p className="text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">{shop.delivery_time || "25-35"} min • {shop.delivery_fee === 0 || shop.free_delivery || shop.freeDelivery ? "Entrega Grátis" : `R$ ${shop.delivery_fee}`}</p>
                       </div>
                    </motion.div>
                  );
                })}
             </div>
          </section>
        )}

        {/* LISTAGEM PRINCIPAL */}
        <section className="px-6 pb-40">
           <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase italic">
                  {activeCategory === "Todos" ? `${activeService || "Restaurantes"} Próximos` : `Especialistas em ${activeCategory}`}
                </h3>
                <div className="w-12 h-1.5 bg-yellow-400 rounded-full mt-1" />
              </div>
           </div>

           <div className="space-y-8">
              {filteredShops.length > 0 ? (
                filteredShops.map((shop, i) => (
                  <motion.div
                    key={shop.id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MerchantCard 
                      shop={shop}
                      onClick={() => onShopClick(shop)}
                      index={i}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-300 gap-6">
                   <div className="size-24 rounded-full bg-zinc-100 flex items-center justify-center">
                     <Icon name="search_off" size={48} className="opacity-20" />
                   </div>
                   <p className="font-black uppercase text-[12px] tracking-widest text-center">Nenhum restaurante encontrado <br /> nesta categoria</p>
                   <button 
                     onClick={() => { setActiveCategory("Todos"); setSearchQuery(""); }}
                     className="bg-zinc-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
                   >
                     Resetar Filtros
                   </button>
                </div>
              )}
           </div>
        </section>
        </motion.div>
      </AnimatePresence>

      {/* ── BOTÃO DE CARRINHO PREMIUM ── */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div 
            initial={{ y: 150 }}
            animate={{ y: 0 }}
            exit={{ y: 150 }}
            className="fixed bottom-8 inset-x-6 z-[170]"
          >
            <button 
              onClick={() => navigateSubView("cart")}
              className="w-full h-24 bg-zinc-900 rounded-[40px] flex items-center justify-center px-10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-[85%] transition-transform opacity-10" />
              
              {(() => {
                const subtotal = cart.reduce((sum: number, item: any) => {
                  const basePrice = Number(item.price) || 0;
                  const addonsPrice = Array.isArray(item.addonDetails) 
                    ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
                    : 0;
                  return sum + basePrice + addonsPrice;
                }, 0);

                return (
                  <div className="flex items-center gap-6 relative z-10 w-full justify-between">
                    <div className="flex items-center gap-4">
                      <div className="size-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-400/20">
                        {cart.length}
                      </div>
                      <span className="text-white font-black uppercase tracking-[0.2em] italic text-sm">Ver Sacola</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-white/40 font-black italic text-xs uppercase">Total</span>
                      <span className="text-yellow-400 font-black italic text-xl tracking-tighter">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  </div>
                );
              })()}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
