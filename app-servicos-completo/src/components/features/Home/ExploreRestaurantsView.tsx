import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
}

export const ExploreRestaurantsView = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  navigateSubView,
  foodCategories,
  availableCoupons,
  establishments,
  onShopClick,
  copiedCoupon,
  setCopiedCoupon,
  initialCategory = "Todos"
}: ExploreRestaurantsViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);

  const categoryImages: Record<string, string> = {
    "Todos": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600",
    "Promoções": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600",
    "Burgers": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600",
    "Pizza": "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600",
    "Doces e Bolos": "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=600",
    "Salgados": "https://images.unsplash.com/photo-1541014741259-de529411b96a?q=80&w=600",
    "Porções": "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=600",
    "Japonês": "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600",
    "Massas": "https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=600",
    "Carnes": "https://images.unsplash.com/photo-1558030006-450675393462?q=80&w=600",
    "Fit": "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600",
    "Açaí": "https://images.unsplash.com/photo-1590301157890-4810ed352733?q=80&w=600",
    "Sorvetes": "https://images.unsplash.com/photo-1501443762994-82bd5dabb89a?q=80&w=600",
    "Padaria": "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600",
    "Promoção do Dia": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=600",
    "Monte o seu": "https://images.unsplash.com/photo-1544333346-63e393789b52?q=80&w=600",
    "Pratos feitos": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600",
    "Marmitas": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=600"
  };

  // Garantir que categorias de comida tenham "Todos" e não incluam redundâncias
  const categories = useMemo(() => {
    const list = foodCategories.map(cat => ({
      ...cat,
      name: cat.name
    }));
    
    if (!list.find(c => c.name === "Todos")) {
       list.unshift({ id: "all", name: "Todos", icon: "restaurant" } as any);
    }
    return list.filter(c => c.id !== "daily");
  }, [foodCategories]);

  const filteredRestaurants = useMemo(() => {
    const normalize = (s: string) => s ? s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_') : "";
    
    return establishments.filter(shop => {
      // Normalizamos o tipo/segmento para uma verificação rigorosa de Whitelist
      const type = normalize(shop.type);
      
      // Apenas permitimos se o segmento principal for relacionado a alimentação
      // Excluímos explicitamente mercados, farmácias e serviços
      const whitelist = ['restaurante', 'food', 'hamburguer', 'pizzaria', 'acai', 'japones', 'lanche', 'gastronomia', 'doce', 'sorvete', 'confeitaria'];
      const blacklist = ['mercado', 'market', 'farmacia', 'pharmacy', 'saude', 'gas', 'agua', 'servico', 'van', 'taxi', 'frete', 'entrega', 'utility'];

      const isFoodRelated = whitelist.some(term => type.includes(term)) || 
                           (!blacklist.some(term => type.includes(term)) && type !== "");
      
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategory !== "Todos") {
        const catNormalized = normalize(selectedCategory);
        const shopFoodCat = normalize(shop.foodCategory);
        const shopType = normalize(shop.type);
        const shopTag = normalize(shop.tag);
        const shopDesc = normalize(shop.description);
        const shopName = normalize(shop.name);
        
        matchesCategory = shopFoodCat.includes(catNormalized) ||
                         shopType.includes(catNormalized) ||
                         shopTag.includes(catNormalized) || 
                         shopDesc.includes(catNormalized) ||
                         shopName.includes(catNormalized);
      }

      return isFoodRelated && matchesSearch && matchesCategory;
    });
  }, [establishments, searchQuery, selectedCategory]);

  return (
    <div className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      {/* HEADER PREMIUM - ILHA FLUTUANTE */}
      <header className="fixed top-4 inset-x-4 z-[110] flex flex-col bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSubView("none")} 
              className="size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800"
            >
              <span className="material-symbols-outlined text-white text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base font-black tracking-tighter text-white leading-none uppercase italic">Izi Food</h1>
              <p className="text-[9px] font-black text-yellow-400 font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
                Explorar Sabores
              </p>
            </div>
          </div>
          <button 
            onClick={() => cart.length > 0 && navigateSubView("cart")} 
            className="group relative size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800"
          >
            <span className="material-symbols-outlined text-white text-[20px] group-hover:text-yellow-400 transition-colors">shopping_bag</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* BUSCA INTEGRADA */}
        <div className="px-5 pb-4">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-colors text-lg">search</span>
              </div>
              <input 
                type="text"
                placeholder="O que você quer comer?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 transition-all"
              />
           </div>
        </div>
      </header>

      <main className="flex flex-col pt-44 px-4">
        {/* CARROSSEL DE CATEGORIAS VISUAIS (ESTILO MARKET) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Categorias Populares</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 h-[120px]">
             {categories.map((cat, i) => {
               const catImg = categoryImages[cat.name] || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400";
               const isActive = selectedCategory === cat.name;
               
               return (
                 <motion.button
                   key={cat.id || i}
                   onClick={() => setSelectedCategory(cat.name)}
                   whileTap={{ scale: 0.95 }}
                   initial={{ opacity: 0, scale: 0.8 }}
                   animate={{ opacity: 1, scale: 1 }}
                   transition={{ delay: i * 0.03 }}
                   className={`relative flex-shrink-0 w-32 h-24 rounded-3xl overflow-hidden group transition-all border-2 ${isActive ? "border-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]" : "border-white/5"}`}
                 >
                    <img 
                      src={catImg} 
                      className={`absolute inset-0 size-full object-cover transition-transform duration-700 ${isActive ? "scale-110 blur-[1px]" : "brightness-[0.6] group-hover:scale-110"}`} 
                    />
                    <div className={`absolute inset-0 ${isActive ? "bg-yellow-400/20" : "bg-gradient-to-t from-black/80 to-transparent"}`} />
                    <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                       <span className={`material-symbols-outlined text-2xl ${isActive ? "text-yellow-400" : "text-white"}`}>{cat.icon}</span>
                       <span className={`text-[9px] font-black uppercase tracking-widest text-center ${isActive ? "text-white" : "text-zinc-300"}`}>{cat.name}</span>
                    </div>
                 </motion.button>
               );
             })}
          </div>
        </section>

        {/* CUPONS VIP - PREMIUM STYLE */}
        {availableCoupons && availableCoupons.filter(cpn => cpn.is_vip).length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Ofertas Exclusivas</h3>
              <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse border border-yellow-400/20">VIP</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4">
              {availableCoupons.filter(cpn => cpn.is_vip).map((cpn, i) => (
                <motion.div 
                  key={cpn.id || i} 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transition={{ delay: i * 0.1 }}
                  onClick={() => {
                    if (cpn.coupon_code) {
                      navigator.clipboard.writeText(cpn.coupon_code);
                      setCopiedCoupon(cpn.coupon_code);
                      setTimeout(() => setCopiedCoupon(null), 2000);
                    }
                  }}
                  className="flex-shrink-0 w-64 h-32 rounded-[28px] relative overflow-hidden group border border-white/5 cursor-pointer shadow-xl"
                >
                  <img src={cpn.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600"} className="absolute inset-0 size-full object-cover brightness-50 group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/20 to-transparent p-5 flex flex-col justify-between backdrop-blur-[2px]">
                    <div className="flex items-center justify-between">
                       <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em]">{cpn.title || "Cupom Izi"}</span>
                       <span className="material-symbols-outlined text-white/50 text-sm">{copiedCoupon === cpn.coupon_code ? "check_circle" : "content_copy"}</span>
                    </div>
                    <div>
                      <p className="text-2xl font-black text-white tracking-tighter leading-none italic uppercase">
                        {cpn.discount_type === "percent" ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`}
                        <span className="text-xs text-yellow-400/80 ml-1">OFF</span>
                      </p>
                      <p className="text-[8px] font-black text-zinc-400 mt-1 uppercase tracking-widest">Toque para copiar: {cpn.coupon_code}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* LISTA DE RESTAURANTES */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                  {selectedCategory === "Todos" ? "Todos os Restaurantes" : selectedCategory}
                </h3>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{filteredRestaurants.length} Restaurantes Próximos</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4 pb-20">
              <AnimatePresence mode="popLayout">
                {filteredRestaurants.length > 0 ? (
                  filteredRestaurants.map((shop, i) => (
                    <motion.div
                      key={shop.id || i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <MerchantCard 
                        shop={{ ...shop, type: "restaurant" }} 
                        onClick={onShopClick} 
                        index={i}
                      />
                    </motion.div>
                  ))
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30">
                     <div className="size-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-4xl">search_off</span>
                     </div>
                     <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhum restaurante encontrado</p>
                  </div>
                )}
              </AnimatePresence>
           </div>
        </section>
      </main>
    </div>
  );
};
