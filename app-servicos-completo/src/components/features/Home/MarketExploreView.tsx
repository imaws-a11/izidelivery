import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MerchantCard } from "../Establishment/MerchantCard";

interface MarketExploreViewProps {
  setSubView: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  establishments: any[];
  onShopClick: (shop: any) => void;
  availableCoupons: any[];
}

const marketCategories = [
  { id: "all", name: "Todos", icon: "storefront", color: "zinc-400", img: "https://images.unsplash.com/photo-1534723452862-4c874018d66d?q=80&w=800" },
  { id: "mercearia", name: "Mercearia", icon: "shopping_basket", color: "amber-500", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=600" },
  { id: "congelados", name: "Congelados", icon: "ac_unit", color: "blue-400", img: "https://images.unsplash.com/photo-1584263343327-447967b33da0?q=80&w=600" },
  { id: "padaria", name: "Padaria", icon: "bakery_dining", color: "orange-400", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600" },
  { id: "higiene", name: "Higiene", icon: "clean_hands", color: "rose-400", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=600" },
  { id: "limpeza", name: "Limpeza", icon: "cleaning_services", color: "cyan-400", img: "https://images.unsplash.com/photo-1584622781564-1d987f7333c1?q=80&w=600" },
  { id: "pet", name: "Pet Shop", icon: "pets", color: "emerald-400", img: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?q=80&w=600" },
  { id: "bebidas", name: "Bebidas", icon: "local_bar", color: "purple-400", img: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?q=80&w=600" },
];

export const MarketExploreView: React.FC<MarketExploreViewProps> = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  navigateSubView,
  establishments,
  onShopClick,
  availableCoupons,
}) => {
  const [selectedCategory, setSelectedCategory] = useState("Todos");

  const filteredMarkets = useMemo(() => {
    const normalize = (s: string) => s ? s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_') : "";
    
    return establishments.filter(shop => {
      const type = normalize(shop.type);
      const isMarketRelated = type.includes('mercado') || type.includes('market') || type.includes('mercearia') || type.includes('higiene') || type.includes('limpeza');
      
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategory !== "Todos") {
        const catNormalized = normalize(selectedCategory);
        const shopType = normalize(shop.type);
        const shopTag = normalize(shop.tag);
        const shopDesc = normalize(shop.description);
        const shopName = normalize(shop.name);
        
        matchesCategory = shopType.includes(catNormalized) ||
                         shopTag.includes(catNormalized) || 
                         shopDesc.includes(catNormalized) ||
                         shopName.includes(catNormalized);

        // Fallback para termos específicos de mercado
        if (!matchesCategory) {
           if (catNormalized === 'higiene') {
              matchesCategory = shopTag.includes('cosmetico') || shopTag.includes('farmacia') || shopName.includes('farma');
           }
           if (catNormalized === 'limpeza') {
              matchesCategory = shopTag.includes('utilidades') || shopTag.includes('casa');
           }
           if (catNormalized === 'pet_shop') {
             matchesCategory = shopTag.includes('pets') || shopName.includes('pet');
           }
        }
      }

      return isMarketRelated && matchesSearch && matchesCategory;
    });
  }, [establishments, searchQuery, selectedCategory]);

  return (
    <div className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      {/* HEADER FIXO - ILHA FLUTUANTE */}
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
              <h1 className="text-base font-black tracking-tighter text-white leading-none uppercase italic">Izi Market</h1>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                Mercados Próximos
              </p>
            </div>
          </div>
          <button 
            onClick={() => cart.length > 0 && navigateSubView("cart")} 
            className="group relative size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800"
          >
            <span className="material-symbols-outlined text-white text-[20px] group-hover:text-emerald-400 transition-colors">shopping_bag</span>
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
                <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-emerald-400 transition-colors text-lg">search</span>
              </div>
              <input 
                type="text"
                placeholder="O que você precisa hoje?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
           </div>
        </div>
      </header>

      <main className="flex flex-col pt-44 px-4">
        {/* CARROSSEL DE CATEGORIAS VISUAIS */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6 px-1">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Categorias do Mercado</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4 h-[120px]">
             {marketCategories.map((cat) => (
               <motion.button
                 key={cat.id}
                 onClick={() => setSelectedCategory(cat.name)}
                 whileTap={{ scale: 0.95 }}
                 className={`relative flex-shrink-0 w-32 h-24 rounded-3xl overflow-hidden group transition-all border-2 ${selectedCategory === cat.name ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]" : "border-white/5"}`}
               >
                  <img src={cat.img} className={`absolute inset-0 size-full object-cover transition-transform duration-700 ${selectedCategory === cat.name ? "scale-110 blur-[1px]" : "brightness-[0.6] group-hover:scale-110"}`} />
                  <div className={`absolute inset-0 ${selectedCategory === cat.name ? "bg-emerald-400/20" : "bg-gradient-to-t from-black/80 to-transparent"}`} />
                  <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                     <span className={`material-symbols-outlined text-2xl ${selectedCategory === cat.name ? "text-emerald-400" : "text-white"}`}>{cat.icon}</span>
                     <span className={`text-[9px] font-black uppercase tracking-widest text-center ${selectedCategory === cat.name ? "text-white" : "text-zinc-300"}`}>{cat.name}</span>
                  </div>
               </motion.button>
             ))}
          </div>
        </section>

        {/* LISTA DE MERCADOS */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedCategory === "Todos" ? "Todos os Mercados" : selectedCategory}</h3>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{filteredMarkets.length} Lojas Encontradas</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((shop, i) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MerchantCard 
                      shop={shop} 
                      onClick={() => onShopClick(shop)} 
                    />
                  </motion.div>
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30">
                   <div className="size-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl">storefront</span>
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhum mercado nesta região</p>
                </div>
              )}
           </div>
        </section>
      </main>
    </div>
  );
};
