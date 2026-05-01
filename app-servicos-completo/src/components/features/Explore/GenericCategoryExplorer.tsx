import React, { useState } from 'react';
import { motion } from "framer-motion";
import { useApp } from "../../../contexts/AppContext";
import { MerchantCard } from "../Establishment/MerchantCard";

interface CategoryOption {
  label: string;
  img: string;
}

interface GenericCategoryExplorerProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  title: string;
  placeholder: string;
  activeService: string;
  categories: CategoryOption[];
  banners?: any[];
  infoCard?: { text: string; link: string };
  listTitle: string;
  serviceType: string | string[]; // para filtrar estabelecimentos
}

export const GenericCategoryExplorer: React.FC<GenericCategoryExplorerProps> = ({
  onBack,
  onShopClick,
  title,
  placeholder,
  activeService,
  categories,
  banners = [],
  infoCard,
  listTitle,
  serviceType
}) => {
  const { 
    ESTABLISHMENTS: establishments, 
    handleShopClick: ctxHandleShopClick,
    searchQuery,
    setSearchQuery,
  } = useApp();

  const handleShopClick = onShopClick || ctxHandleShopClick;
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const safeSearchQuery = searchQuery || "";
  const safeEstablishments = Array.isArray(establishments) ? establishments : [];

  const filteredShops = safeEstablishments.filter(shop => {
    const shopName = shop?.name || "";
    const matchesSearch = shopName.toLowerCase().includes(safeSearchQuery.toLowerCase());
    
    let matchesType = false;
    if (serviceType === "all") {
      matchesType = true;
    } else if (Array.isArray(serviceType)) {
      matchesType = serviceType.includes(shop?.type);
    } else {
      matchesType = shop?.type === serviceType;
      // Caso especial para restaurantes que podem ser 'food' ou 'restaurant'
      if (serviceType === "restaurant" && shop?.type === "food") matchesType = true;
    }

    return matchesSearch && matchesType;
  });

  const topServices = [
    { label: "Restaurantes", icon: "restaurant" },
    { label: "Mercados", icon: "shopping_cart" },
    { label: "Farmácias", icon: "medical_services" },
    { label: "Bebidas", icon: "local_bar" },
    { label: "Petshop", icon: "pets" },
  ];

  const filters = ["Ordenar", "Cupom", "Entrega Grátis", "Entrega Rastreável"];

  return (
    <div className="absolute inset-0 z-[140] bg-zinc-50 text-zinc-900 flex flex-col overflow-y-auto no-scrollbar">
      
      {/* 1. HEADER & SEARCH */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center gap-3">
        <button 
          onClick={() => window.history.back()}
          className="size-10 rounded-full bg-zinc-100 flex items-center justify-center active:scale-95 transition-all"
        >
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        
        <div className="flex-1 relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-rounded text-zinc-400">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full h-12 bg-zinc-100 rounded-full pl-12 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
          />
        </div>
      </header>

      {/* 2. TOP SERVICE SELECTOR (Horizontal) */}
      <section className="px-4 py-2">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {topServices.map(svc => (
              <button 
                key={svc.label}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all border ${
                  svc.label === activeService 
                  ? "bg-yellow-50 border-yellow-100 text-yellow-600 font-bold shadow-sm" 
                  : "bg-white border-zinc-100 text-zinc-500 font-medium"
                }`}
              >
                <span className="material-symbols-rounded text-[18px]">{svc.icon}</span>
                <span className="text-xs">{svc.label}</span>
              </button>
            ))}
         </div>
      </section>

      {/* 3. PRODUCT CATEGORIES (3D ICONS) */}
      <section className="px-4 py-6">
         <div className="flex gap-6 overflow-x-auto no-scrollbar">
            {categories.map((cat, i) => (
              <motion.div 
                key={i} 
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-3 min-w-[70px] cursor-pointer"
              >
                 <div className="size-16 rounded-[22px] bg-zinc-50 flex items-center justify-center shadow-sm border border-zinc-100 overflow-hidden">
                    <img src={cat.img} alt={cat.label} className="size-12 object-contain" />
                 </div>
                 <span className="text-[11px] font-bold text-zinc-700 text-center leading-tight">{cat.label}</span>
              </motion.div>
            ))}
         </div>
      </section>

      {/* 4. BANNER CAROUSEL */}
      <section className="px-4 py-2">
         <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar">
            {banners.length > 0 ? banners.map((b, i) => (
               <div key={i} className="snap-center shrink-0 w-[90vw] aspect-[16/7] rounded-[28px] overflow-hidden shadow-lg border border-zinc-100">
                  <img src={b.image_url} className="size-full object-cover" alt="Banner" />
               </div>
            )) : (
              <div className="w-full aspect-[16/7] rounded-[28px] bg-yellow-400 flex items-center justify-center relative overflow-hidden shadow-xl">
                 <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                 <h2 className="text-white font-black text-2xl relative z-10 uppercase italic">Ofertas Exclusivas</h2>
              </div>
            )}
         </div>
      </section>

      {/* 5. INFO CARD (IF APPLICABLE) */}
      {infoCard && (
        <section className="px-4 py-6">
           <div className="bg-zinc-50 rounded-3xl p-6 flex flex-col gap-2 border border-zinc-100">
              <p className="text-sm text-zinc-500 leading-relaxed">
                 {infoCard.text}
              </p>
              <button className="text-yellow-600 font-bold text-sm text-left">{infoCard.link}</button>
           </div>
        </section>
      )}

      {/* 6. FILTERS */}
      <section className="sticky top-[72px] z-40 bg-white/95 backdrop-blur-md px-4 py-4 border-b border-zinc-50">
         <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {filters.map(f => (
              <button 
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-5 py-2 rounded-full border text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === f 
                  ? "bg-yellow-50 border-yellow-200 text-yellow-600" 
                  : "bg-white border-zinc-200 text-zinc-600"
                }`}
              >
                {f}
                <span className="material-symbols-rounded text-[16px]">expand_more</span>
              </button>
            ))}
         </div>
      </section>

      {/* 7. SHOPS LIST */}
      <section className="px-4 py-6 mb-20">
         <h3 className="text-lg font-black text-zinc-900 mb-6 px-1 uppercase italic tracking-tighter">{listTitle}</h3>
         <div className="flex flex-col gap-4">
            {filteredShops.length > 0 ? filteredShops.map((shop, i) => (
              <MerchantCard 
                key={shop.id || i}
                shop={shop}
                onClick={() => handleShopClick(shop)}
                index={i}
              />
            )) : (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-4">
                 <span className="material-symbols-rounded text-6xl">storefront</span>
                 <p className="font-bold">Nenhuma loja encontrada</p>
              </div>
            )}
         </div>
      </section>

    </div>
  );
};
