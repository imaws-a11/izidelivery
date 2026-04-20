import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
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
  initialCategory = "Todos",
  isIziBlackMembership = false
}: ExploreRestaurantsViewProps) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchExploreImage = async () => {
       let queryTitle = selectedCategory;
       if (selectedCategory === "all" || selectedCategory === "Todos") {
           queryTitle = "Restaurantes";
       }
       
       const { data } = await supabase
          .from('promotions_delivery')
          .select('image_url')
          .eq('type', 'explore')
          .ilike('title', `%${queryTitle}%`)
          .limit(1);
          
       if (data && data.length > 0 && data[0].image_url) {
          setBgImage(data[0].image_url);
       } else {
          setBgImage(null);
       }
    };
    fetchExploreImage();
  }, [selectedCategory]);

  const getCategoryImg = (name: string) => {
    return "";
  };

  // Garantir que categorias de comida tenham "Todos" e não incluam redundâncias
  const categories = useMemo(() => {
    const list = foodCategories.map(cat => ({
      ...cat,
      // Se não tiver name, tenta usar o id como fallback formatado
      name: cat.name || cat.id
    }));
    
    if (!list.find(c => c.id === "all")) {
       list.unshift({ id: "all", name: "Todos", icon: "restaurant" } as any);
    }
    return list.filter(c => c.id !== "daily" && c.name !== "Padaria" && c.name !== "Carnes");
  }, [foodCategories]);

  const filteredRestaurants = useMemo(() => {
    const normalize = (s: string) => s ? s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_') : "";
    
    return establishments.filter(shop => {
      // Filtragem por tipo e categoria
      const shopType = (shop.type || "").toLowerCase().trim();
      
      // Base: Esta view é exclusiva para o ecossistema de Food (Restaurante, Doceria, Lanches)
      const foodMasterTypes = ['restaurant', 'restaurante', 'candy', 'doceria', 'comida', 'lanches'];
      const isFoodRelated = foodMasterTypes.includes(shopType);
      if (!isFoodRelated) return false;

      const shopFoodCats = Array.isArray(shop.foodCategory) 
        ? shop.foodCategory.map(c => (c || "").toLowerCase())
        : [(shop.foodCategory || "").toLowerCase()];
      
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategory !== "all" && selectedCategory !== "Todos") {
        const catId = selectedCategory.toLowerCase();
        
        matchesCategory = shopFoodCats.includes(catId) || 
                         shopType === catId ||
                         shopFoodCats.some(c => normalize(c).includes(normalize(selectedCategory))) ||
                         normalize(shop.name).includes(normalize(selectedCategory));
                         
        if (!matchesCategory) {
          if (catId === 'burguer' || catId === 'burger' || catId === 'hamburguer') {
            matchesCategory = shopFoodCats.some(c => c.includes('burg')) || shopType.includes('burg');
          } else if (catId === 'pizza') {
            matchesCategory = shopFoodCats.some(c => c.includes('pizz')) || shopType.includes('pizz');
          } else if (catId === 'japonesa' || catId === 'japones') {
            matchesCategory = shopFoodCats.some(c => c.includes('japon') || c.includes('sushi')) || shopType.includes('japon');
          }
        }
      }

      return matchesSearch && matchesCategory;
    });
  }, [establishments, searchQuery, selectedCategory]);

  return (
    <div 
      ref={scrollContainerRef}
      className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10"
    >
      {/* HEADER PREMIUM - ILHA FLUTUANTE */}
      <header className="fixed top-4 inset-x-4 z-[110] flex flex-col bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[36px] shadow-[20px_20px_50px_rgba(0,0,0,0.6),inset_8px_8px_16px_rgba(255,255,255,0.02),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-5">
            <button 
              onClick={() => setSubView("none")} 
              className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800 shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03)]"
            >
              <span className="material-symbols-outlined text-white text-[24px]">chevron_left</span>
            </button>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-white leading-none uppercase italic drop-shadow-lg">Izi Food</h1>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mt-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_#facc15]" />
                Explorar Sabores
              </p>
            </div>
          </div>
          <button 
            onClick={() => navigateSubView("cart")} 
            className="group relative size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800 shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03)]"
          >
            <span className="material-symbols-outlined text-white text-[22px] group-hover:text-yellow-400 transition-colors">shopping_bag</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* BUSCA INTEGRADA */}
        <div className="px-6 pb-5">
            <div className="relative group">
               <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
                 <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-all duration-500 text-2xl">search</span>
               </div>
               <input 
                 type="text"
                 placeholder="O que você quer comer?"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full h-15 bg-zinc-900 shadow-[15px_15px_30px_rgba(0,0,0,0.5),inset_6px_6px_12px_rgba(255,255,255,0.02),inset_-6px_-6px_12px_rgba(0,0,0,0.4)] border border-white/10 rounded-[26px] pl-16 pr-6 text-sm font-black text-white placeholder:text-zinc-700 focus:outline-none focus:placeholder:text-zinc-500 transition-all"
               />
            </div>
        </div>
      </header>

      <main className="flex flex-col pt-44 px-4">
        {bgImage && (
          <section className="mb-8">
            <div className="w-full aspect-[2/1] rounded-[32px] overflow-hidden relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 group cursor-pointer">
               <img src={bgImage} className="absolute inset-0 size-full object-cover group-hover:scale-105 transition-transform duration-700" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end" />
            </div>
          </section>
        )}
        {/* CARROSSEL DE CATEGORIAS VISUAIS (ESTILO MARKET) */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-8 px-1">
            <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.4em] drop-shadow-md">Categorias Populares</h2>
          </div>
          <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 h-[140px]">
             {categories.map((cat, i) => {
                const isActive = selectedCategory === cat.id || (selectedCategory === "Todos" && cat.id === "all");
                const catImg = ""; 
                
                return (
                  <motion.button
                    key={cat.id || i}
                    onClick={() => setSelectedCategory(cat.id)}
                    whileTap={{ scale: 0.92 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 20 }}
                    className={`relative flex-shrink-0 w-36 h-28 rounded-[38px] overflow-hidden group transition-all duration-500
                      ${isActive 
                        ? "bg-yellow-400 shadow-[15px_15px_30px_rgba(0,0,0,0.5),inset_6px_6px_12px_rgba(255,255,255,0.6),inset_-6px_-6px_12px_rgba(0,0,0,0.2)]" 
                        : "bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] hover:bg-zinc-750"}
                    `}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
                    )}
                    <div className="relative h-full flex flex-col items-center justify-center gap-2.5 p-3 z-10">
                       <div className={`size-11 rounded-[20px] flex items-center justify-center mb-1 transition-all duration-500
                         ${isActive ? "bg-black/10 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.2)]" : "bg-zinc-900 shadow-[inset_4px_4px_8px_rgba(0,0,0,0.5)]"}
                       `}>
                          <span className={`material-symbols-outlined text-2xl ${isActive ? "text-black" : "text-yellow-400"}`}>{cat.icon || 'restaurant'}</span>
                       </div>
                       <span className={`text-[12px] font-black uppercase tracking-tighter leading-tight transition-all duration-500 text-center ${isActive ? "text-black" : "text-zinc-400"}`}>{cat.name}</span>
                    </div>
                  </motion.button>
                );
             })}
          </div>
        </section>

        {/* CUPONS VIP - PREMIUM STYLE */}
        {isIziBlackMembership && availableCoupons && availableCoupons.filter(cpn => cpn.is_vip).length > 0 && (
          <section className="mb-10 animate-in fade-in slide-in-from-right duration-700">
            <div className="flex items-center justify-between mb-4 px-1">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Benefícios Ativos</h3>
              <span className="text-[8px] font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full uppercase tracking-widest animate-pulse border border-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.2)]">IZI BLACK</span>
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
                  className="flex-shrink-0 w-72 h-36 rounded-[40px] relative overflow-hidden group border border-white/5 cursor-pointer shadow-[20px_20px_40px_rgba(0,0,0,0.6),inset_8px_8px_16px_rgba(255,255,255,0.05)]"
                >
                  <img src={cpn.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80"} className="absolute inset-0 size-full object-cover brightness-[0.4] group-hover:scale-110 transition-transform duration-[1200ms] ease-out" />
                  
                  {/* Glassmorphic Layer */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  <div className="absolute inset-4 rounded-[32px] border border-white/10 bg-black/20 backdrop-blur-[4px] p-5 flex flex-col justify-between shadow-[inset_4px_4px_8px_rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col">
                         <span className="text-yellow-400 text-[10px] font-black uppercase tracking-[0.2em]">{cpn.title || "Cupom Izi"}</span>
                         <span className="text-[7px] font-black text-white/40 uppercase tracking-widest mt-1">Exclusivo para Você</span>
                       </div>
                       <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${copiedCoupon === cpn.coupon_code ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'bg-white/5 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1)]'}`}>
                          <span className={`material-symbols-outlined ${copiedCoupon === cpn.coupon_code ? 'text-black' : 'text-white/40'} text-lg`}>
                            {copiedCoupon === cpn.coupon_code ? "check" : "content_copy"}
                          </span>
                       </div>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase drop-shadow-2xl">
                          {cpn.discount_type === "percent" ? `${cpn.discount_value}%` : `R$ ${cpn.discount_value}`}
                          <span className="text-sm text-yellow-400 ml-1.5 non-italic">OFF</span>
                        </p>
                        <p className="text-[8px] font-black text-white/20 mt-2 uppercase tracking-[0.3em]">CÓDIGO: {cpn.coupon_code}</p>
                      </div>
                      <div className="bg-yellow-400 text-black text-[8px] font-black px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg active:scale-90 transition-transform">
                        Copiar
                      </div>
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
