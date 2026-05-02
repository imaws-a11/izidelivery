import React, { useMemo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { MerchantCard } from "../Establishment/MerchantCard";
import { useApp } from "../../../contexts/AppContext";

interface MarketExploreViewProps {
  setSubView: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  establishments: any[];
  onShopClick: (shop: any) => void;
}

export const MarketExploreView: React.FC<MarketExploreViewProps> = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  navigateSubView,
  establishments,
  onShopClick,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { handleAddToCart } = useApp();

  const categories = [
    { label: "Hortifruti", img: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100&h=100&fit=crop" },
    { label: "Carnes", img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=100&h=100&fit=crop" },
    { label: "Limpeza", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=100&h=100&fit=crop" },
    { label: "Higiene", img: "https://images.unsplash.com/photo-1603507864264-325290f671b5?w=100&h=100&fit=crop" },
    { label: "Bebidas", img: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&h=100&fit=crop" },
    { label: "Padaria", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop" },
  ];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    const fetchExploreImage = async () => {
       const { data } = await supabase
          .from('promotions_delivery')
          .select('image_url')
          .eq('type', 'explore')
          .ilike('title', `%Mercado%`)
          .limit(1);
          
       if (data && data.length > 0 && data[0].image_url) {
          setBgImage(data[0].image_url);
       }
    };
    fetchExploreImage();
  }, []);

  const normalize = (s: string) => s ? s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_') : "";

  const filteredMarkets = useMemo(() => {
    return establishments.filter(shop => {
      const type = normalize(shop.type);
      const isMarketRelated = type.includes('mercado') || type.includes('market') || type.includes('mercearia') || type.includes('higiene') || type.includes('limpeza') || type.includes('sorvete');
      
      const matchesSearch = (shop.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (activeCategory) {
        const cat = activeCategory.toLowerCase();
        const tags = (shop.tags || "").toLowerCase();
        const desc = (shop.description || "").toLowerCase();
        matchesCategory = tags.includes(cat) || desc.includes(cat);
        
        if (!matchesCategory && shop.products) {
          matchesCategory = shop.products.some((p: any) => 
            (p.category || "").toLowerCase().includes(cat) || 
            (p.name || "").toLowerCase().includes(cat)
          );
        }
      }

      return isMarketRelated && matchesSearch && matchesCategory;
    });
  }, [establishments, searchQuery, activeCategory]);

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return [];
    const allProducts: any[] = [];
    const cat = activeCategory.toLowerCase();
    
    filteredMarkets.forEach(shop => {
      if (shop.products) {
        shop.products.forEach((p: any) => {
          if ((p.category || "").toLowerCase().includes(cat) || (p.name || "").toLowerCase().includes(cat)) {
            allProducts.push({ ...p, store_name: shop.name, merchant_id: shop.id });
          }
        });
      }
    });
    return allProducts.slice(0, 20);
  }, [filteredMarkets, activeCategory]);

  return (
    <div 
      ref={scrollContainerRef}
      className="absolute inset-0 z-[120] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-32"
    >
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-[150] bg-white/80 backdrop-blur-md px-6 py-6 flex items-center gap-4">
        <button 
          onClick={() => window.history.back()} 
          className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-90 transition-all shadow-sm"
        >
          <span className="material-symbols-rounded text-black text-xl">arrow_back_ios_new</span>
        </button>
        
        <div className="flex-1 relative">
           <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-rounded text-zinc-400">search</span>
           <input 
             type="text"
             placeholder="Buscar no mercado..."
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-[20px] pl-14 pr-6 text-sm font-black uppercase tracking-tighter focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
           />
        </div>

        <button 
          onClick={() => navigateSubView("cart")} 
          className="relative size-12 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-all shadow-xl"
        >
          <span className="material-symbols-rounded text-yellow-400 text-2xl">shopping_bag</span>
          {cart.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">
              {cart.length}
            </span>
          )}
        </button>
      </header>

      <main className="flex flex-col pt-4">
        {/* HERO BANNER */}
        {bgImage && (
          <section className="px-6 mb-10">
            <div className="w-full h-48 rounded-[40px] overflow-hidden relative shadow-2xl shadow-zinc-200 border border-zinc-100 group cursor-pointer">
               <img src={bgImage} className="absolute inset-0 size-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" alt="Explore" />
               <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-8">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">Izi Market</h2>
                  <p className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-2">Os melhores itens da região</p>
               </div>
            </div>
          </section>
        )}

        {/* CATEGORIAS HORIZONTAL */}
        <section className="px-6 mb-10">
           <div className="flex gap-8 overflow-x-auto no-scrollbar">
              {categories.map((cat, i) => {
                const isActive = activeCategory === cat.label;
                return (
                  <motion.div 
                    key={i} 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveCategory(isActive ? null : cat.label)}
                    className="flex flex-col items-center gap-4 min-w-[85px] cursor-pointer group"
                  >
                     <div className={`size-20 rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 border-4 ${
                       isActive ? 'border-yellow-400 scale-110 shadow-yellow-400/20' : 'border-white shadow-zinc-200'
                     }`}>
                        <img src={cat.img} alt={cat.label} className={`size-full object-cover transition-transform duration-700 ${isActive ? 'scale-125' : 'group-hover:scale-110'}`} />
                     </div>
                     <span className={`text-[10px] font-black uppercase tracking-tighter text-center leading-tight transition-colors ${
                       isActive ? 'text-yellow-600' : 'text-zinc-500'
                     }`}>{cat.label}</span>
                  </motion.div>
                );
              })}
           </div>
        </section>

        {/* SEÇÃO DE PRODUTOS (CASO FILTRADO) */}
        <AnimatePresence>
          {activeCategory && filteredProducts.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-6 py-4 overflow-hidden mb-8"
            >
               <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-6">Sugestões de <span className="text-yellow-500">{activeCategory}</span></h3>
               <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                  {filteredProducts.map((prod, i) => (
                    <motion.div 
                      key={i}
                      whileTap={{ scale: 0.95 }}
                      className="min-w-[200px] bg-zinc-50 rounded-[32px] p-4 border border-zinc-100 shadow-sm flex flex-col gap-3 group"
                    >
                       <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner bg-white">
                          <img src={prod.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-500" alt={prod.name} />
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleAddToCart(prod); }}
                            className="absolute bottom-2 right-2 size-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center shadow-lg active:scale-90 transition-all"
                          >
                             <span className="material-symbols-rounded">add</span>
                          </button>
                       </div>
                       <div className="px-1">
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">{prod.store_name}</p>
                          <h4 className="text-xs font-black text-zinc-900 uppercase tracking-tighter line-clamp-1 mb-2">{prod.name}</h4>
                          <p className="text-sm font-black text-zinc-900 tracking-tighter">R$ {prod.price?.toFixed(2).replace('.', ',')}</p>
                       </div>
                    </motion.div>
                  ))}
               </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* LISTA DE MERCADOS */}
        <section className="px-6 space-y-8">
           <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter leading-none">Todos os Mercados</h3>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-2">{filteredMarkets.length} Lojas Disponíveis</p>
              </div>
           </div>

           <div className="flex flex-col gap-6">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((shop, i) => (
                  <MerchantCard 
                    key={shop.id || i}
                    shop={shop} 
                    onClick={() => onShopClick(shop)} 
                    index={i}
                  />
                ))
              ) : (
                <div className="py-20 flex flex-col items-center justify-center gap-6 text-center">
                   <div className="size-24 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                      <span className="material-symbols-rounded text-5xl text-zinc-300">storefront</span>
                   </div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nenhum mercado nesta região</p>
                </div>
              )}
           </div>
        </section>
      </main>
    </div>
  );
};
