import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { MerchantCard } from "../Establishment/MerchantCard";

interface FoodCategoryExplorerProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const FoodCategoryExplorer: React.FC<FoodCategoryExplorerProps> = ({ onBack, onShopClick }) => {
  const { 
    ESTABLISHMENTS: establishments, 
    handleShopClick: ctxHandleShopClick,
    searchQuery,
    setSearchQuery,
    subView
  } = useApp();

  const handleShopClick = onShopClick || ctxHandleShopClick;

  const [activeService, setActiveService] = useState("Restaurantes");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const services = [
    { id: "Restaurantes", label: "Restaurantes", icon: "🍔" },
    { id: "Mercados", label: "Mercados", icon: "🛒" },
    { id: "Farmácias", label: "Farmácias", icon: "💊" },
    { id: "Pet", label: "Pet Shop", icon: "🐶" },
    { id: "Bebidas", label: "Bebidas", icon: "🍺" },
  ];

  const subCategories = [
    { id: "lanches", label: "Lanches", img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop" },
    { id: "pizza", label: "Pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop" },
    { id: "acai", label: "Açaí", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=100&h=100&fit=crop" },
    { id: "promocoes", label: "Promoções", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&h=100&fit=crop" },
    { id: "brasileira", label: "Brasil", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=100&fit=crop" },
    { id: "japonesa", label: "Japonesa", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop" },
  ];

  const filters = ["Ordenar", "Entrega grátis", "Vale-refeição", "Distância"];

  const filteredEstablishments = establishments.filter(shop => {
    // Filtro básico de tipo para restaurantes
    const isFood = (shop.type === "restaurant" || shop.type === "food");
    if (!isFood) return false;

    // Filtro de busca
    if (searchQuery && !shop.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    // Filtro de "Entrega grátis"
    if (activeFilter === "Entrega grátis" && (shop.service_fee || 0) > 0) return false;

    return true;
  });

  return (
    <div className="absolute inset-0 z-[120] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="size-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">chevron_left</span>
        </button>
        
        <div className="flex-1 relative group">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-rounded text-zinc-400 text-xl group-focus-within:text-yellow-600 transition-colors">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar em Restaurantes"
            className="w-full h-11 bg-zinc-100 rounded-full pl-11 pr-4 text-sm font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all"
          />
        </div>

        <button className="size-10 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">grid_view</span>
        </button>
      </header>

      {/* TOP SERVICES CAROUSEL */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar px-4 py-4 shrink-0">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveService(s.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all border ${
              activeService === s.id 
                ? "bg-yellow-100 border-yellow-200 text-yellow-900" 
                : "bg-zinc-50 border-zinc-100 text-zinc-600"
            }`}
          >
            <span className="text-lg">{s.icon}</span>
            <span className="text-[13px] font-black uppercase tracking-tight">{s.label}</span>
          </button>
        ))}
      </div>

      {/* SUBCATEGORIES GRID/CAROUSEL */}
      <div className="flex items-start gap-6 overflow-x-auto no-scrollbar px-6 py-6 shrink-0">
        {subCategories.map((sc) => (
          <button key={sc.id} className="flex flex-col items-center gap-2 min-w-[70px] group">
            <div className="size-16 rounded-[24px] bg-zinc-50 overflow-hidden border border-zinc-100 shadow-sm group-active:scale-90 transition-transform">
              <img src={sc.img} alt={sc.label} className="size-full object-cover" />
            </div>
            <span className="text-[11px] font-black text-zinc-600 uppercase tracking-tighter">{sc.label}</span>
          </button>
        ))}
      </div>

      {/* BANNER */}
      <div className="px-4 py-2">
        <div className="relative w-full aspect-[21/9] rounded-[32px] overflow-hidden shadow-xl shadow-yellow-100">
           <img 
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" 
            alt="Promo" 
            className="absolute inset-0 size-full object-cover"
           />
           <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-yellow-400/80 to-transparent" />
           <div className="absolute inset-y-0 left-8 flex flex-col justify-center max-w-[200px] space-y-1">
              <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.3em]">Copa de Ofertas</p>
              <h2 className="text-2xl font-black text-black leading-none uppercase italic">Tudo por</h2>
              <div className="flex items-baseline gap-1">
                 <span className="text-xs font-black text-black">R$</span>
                 <span className="text-5xl font-black text-black tracking-tighter">4,90</span>
              </div>
           </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar px-4 py-6 shrink-0">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(activeFilter === f ? null : f)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[13px] font-bold whitespace-nowrap transition-all ${
              activeFilter === f 
                ? "bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-100" 
                : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300"
            }`}
          >
            {f}
            <span className="material-symbols-rounded text-base">expand_more</span>
          </button>
        ))}
      </div>

      {/* LISTA DE LOJAS */}
      <section className="flex-1 pb-20">
        <div className="px-6 py-2 flex items-center justify-between">
           <h3 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter">Lojas</h3>
        </div>

        <div className="flex flex-col">
          {filteredEstablishments.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
               <span className="material-symbols-rounded text-6xl mb-4">storefront</span>
               <p className="font-bold text-sm uppercase tracking-widest">Nenhuma loja encontrada</p>
            </div>
          ) : (
            filteredEstablishments.map((shop, i) => (
              <MerchantCard 
                key={shop.id || i}
                shop={shop}
                onClick={handleShopClick}
                index={i}
              />
            ))
          )}
        </div>
      </section>
    </div>
  );
};
