import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../../components/common/Icon";

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

  // Garantir que categorias de comida tenham "Todos" e não incluam redundâncias
  const categories = useMemo(() => {
    const list = foodCategories.map(cat => ({
      ...cat,
      name: cat.name === "Burgers" ? "Burguer" : cat.name // Normalização simples para bater com tags
    }));
    
    if (!list.find(c => c.name === "Todos")) {
       list.unshift({ id: "all", name: "Todos", icon: "restaurant" } as any);
    }
    return list.filter(c => c.id !== "daily");
  }, [foodCategories]);

  const filteredRestaurants = useMemo(() => {
    return establishments.filter(shop => {
      const isRestaurant = shop.type === 'restaurant';
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategory !== "Todos") {
        const cat = selectedCategory.toLowerCase();
        // Verifica se a categoria está na tag, descrição ou nome
        matchesCategory = (shop.tag && shop.tag.toLowerCase().includes(cat)) || 
                         (shop.description && shop.description.toLowerCase().includes(cat)) ||
                         (shop.name.toLowerCase().includes(cat)) ||
                         // Caso especial para Burguer/Burger
                         (cat === "burguer" && (shop.tag?.toLowerCase().includes("burger") || shop.name.toLowerCase().includes("burger")));
      }

      return isRestaurant && matchesSearch && matchesCategory;
    });
  }, [establishments, searchQuery, selectedCategory]);

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      <header className="sticky top-0 z-50 px-5 pt-8 pb-4" style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">Restaurantes</h1>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Explore novos sabores</p>
            </div>
          </div>
          <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
            {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
          </div>
          <input
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
            placeholder="Buscar pratos ou restaurantes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="px-5 flex flex-col gap-8">
        {/* BANNER VIP */}
        <section>
          <div className="relative h-44 rounded-[2rem] overflow-hidden group cursor-pointer border border-zinc-800">
            <img className="w-full h-full object-cover brightness-50 group-hover:scale-105 transition-transform duration-700" src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800" alt="Restaurantes" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent flex flex-col justify-center p-6">
              <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Ofertas VIP</span>
              <h2 className="text-xl font-extrabold text-white leading-tight">Os melhores sabores<br/>na sua porta</h2>
            </div>
          </div>
        </section>

        {/* CATEGORIAS (FILTRO INLINE) */}
        <section>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
            {categories.map((cat, i) => {
              const isActive = selectedCategory === cat.name;
              return (
                <motion.button
                  key={cat.id || i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all active:scale-95 group ${
                    isActive 
                      ? "bg-yellow-400 border-yellow-400 text-black" 
                      : "bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-yellow-400/40 hover:text-yellow-400"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[18px] ${isActive ? "text-black" : "group-hover:text-yellow-400"}`}>{cat.icon}</span>
                  <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap">{cat.name}</span>
                </motion.button>
              );
            })}
          </div>
        </section>

        {/* CUPONS VIP */}
        {availableCoupons.filter(p => p.is_vip).length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Cupons VIP</h3>
              <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest animate-pulse">Exclusivo</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-5 px-5">
              {availableCoupons.filter(p => p.is_vip).map((cpn, i) => (
                <motion.div key={cpn.id || i} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }} className="flex-shrink-0 w-72 h-36 rounded-2xl relative overflow-hidden group border border-zinc-800 cursor-pointer active:scale-95 transition-all">
                  <img src={cpn.image_url || "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=800"} className="absolute inset-0 size-full object-cover opacity-40 group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent p-5 flex flex-col justify-between">
                    <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest">{cpn.title || "Oferta Especial"}</span>
                    <div>
                      <p className="text-3xl font-black text-white leading-none">
                        {cpn.discount_type === "percent" ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`}
                        <span className="text-base text-zinc-400 ml-1">OFF</span>
                      </p>
                      {cpn.coupon_code && (
                        <button onClick={() => { navigator.clipboard.writeText(cpn.coupon_code); setCopiedCoupon(cpn.coupon_code); setTimeout(() => setCopiedCoupon(null), 2000); }} className="mt-2 flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 px-3 py-1 rounded-full active:scale-95 transition-all">
                          <span className="text-yellow-400 text-[10px] font-black tracking-widest">{cpn.coupon_code}</span>
                          <span className="material-symbols-outlined text-yellow-400 text-xs">{copiedCoupon === cpn.coupon_code ? "check_circle" : "content_copy"}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* SEÇÃO: MAIS PRÓXIMOS (DINÂMICA) */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white uppercase">
                {selectedCategory === "Todos" ? "Mais Próximos" : `${selectedCategory} Próximos`}
              </h3>
              <div className="w-8 h-1 bg-yellow-400 rounded-full mt-1" />
            </div>
            <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
              Resultados: {filteredRestaurants.length}
            </button>
          </div>

          <div className="flex flex-col gap-4 pb-10">
            <AnimatePresence mode="popLayout">
              {filteredRestaurants.map((shop, i) => (
                <motion.div
                  key={shop.id || i}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onShopClick({ ...shop, type: "restaurant" })}
                  className="group cursor-pointer active:scale-[0.98] transition-all"
                >
                  <div className="relative h-48 rounded-2xl overflow-hidden mb-3">
                    <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                      <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      <span className="text-xs font-black text-white">{shop.rating || "5.0"}</span>
                    </div>
                    {shop.freeDelivery && (
                      <div className="absolute bottom-3 left-3 bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
                        Entrega Grátis
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-1">
                    <div>
                      <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                      <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">local_fire_department</span>
                          {shop.tag}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          {shop.time}
                        </span>
                      </div>
                    </div>
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                      <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredRestaurants.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
                <p className="text-[11px] font-black uppercase text-zinc-600 tracking-widest">Nenhum restaurante encontrado</p>
                <p className="text-zinc-500 text-[10px]">Tente mudar a categoria ou sua busca.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
