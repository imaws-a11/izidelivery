import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../contexts/AppContext";
import { MerchantCard } from "../Establishment/MerchantCard";
import { ExploreBanners } from "../../common/ExploreBanners";

interface CategoryOption {
  label: string;
  img?: string;
  icon?: string;
}

interface GenericCategoryExplorerProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  title: string;
  placeholder: string;
  activeService: string;
  categories: CategoryOption[];
  exploreBanners?: any[];
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
  exploreBanners = [],
  infoCard,
  listTitle,
  serviceType
}) => {
  const { 
    ESTABLISHMENTS: establishments, 
    handleShopClick: ctxHandleShopClick,
    searchQuery,
    setSearchQuery,
    handleAddToCart,
    navigateSubView
  } = useApp();

  const handleShopClick = onShopClick || ctxHandleShopClick;
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const safeSearchQuery = searchQuery || "";
  const safeEstablishments = Array.isArray(establishments) ? establishments : [];

  // 1. Filtrar Lojistas
  const filteredShops = useMemo(() => {
    return safeEstablishments.filter(shop => {
      const shopName = shop?.name || "";
      const matchesSearch = shopName.toLowerCase().includes(safeSearchQuery.toLowerCase());
      
      let matchesType = false;
      if (serviceType === "all") {
        matchesType = true;
      } else if (Array.isArray(serviceType)) {
        matchesType = serviceType.includes(shop?.type);
      } else {
        matchesType = shop?.type === serviceType;
        if (serviceType === "restaurant" && shop?.type === "food") matchesType = true;
      }

      // Filtro por Categoria de Produto (Sub-categoria)
      let matchesCategory = true;
      if (activeCategoryFilter) {
        const tags = (shop?.tags || "").toLowerCase();
        const description = (shop?.description || "").toLowerCase();
        const cat = activeCategoryFilter.toLowerCase();
        matchesCategory = tags.includes(cat) || description.includes(cat);
        
        // Se nâo bater na descrição/tags, checar se tem produtos com essa categoria
        if (!matchesCategory && shop?.products) {
          matchesCategory = shop.products.some((p: any) => 
            (p.category || "").toLowerCase().includes(cat) || 
            (p.name || "").toLowerCase().includes(cat)
          );
        }
      }

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [safeEstablishments, safeSearchQuery, serviceType, activeCategoryFilter]);

  // 2. Extrair Produtos das Lojas Filtradas (para a seção de "Produtos")
  const filteredProducts = useMemo(() => {
    if (!activeCategoryFilter) return [];
    
    const allProducts: any[] = [];
    const cat = activeCategoryFilter.toLowerCase();
    
    filteredShops.forEach(shop => {
      if (shop.products) {
        shop.products.forEach((p: any) => {
          const pCat = (p.category || "").toLowerCase();
          const pName = (p.name || "").toLowerCase();
          if (pCat.includes(cat) || pName.includes(cat)) {
            allProducts.push({ ...p, store_name: shop.name, merchant_id: shop.id });
          }
        });
      }
    });
    
    return allProducts.slice(0, 20); // Limitar para performance
  }, [filteredShops, activeCategoryFilter]);

  const topServices = [
    { label: "Restaurantes", icon: "restaurant" },
    { label: "Mercados", icon: "shopping_cart" },
    { label: "Farmácias", icon: "medical_services" },
    { label: "Bebidas", icon: "local_bar" },
    { label: "Gás e Água", icon: "local_fire_department" },
    { label: "Petshop", icon: "pets" },
  ];

  const filters = ["Ordenar", "Cupom", "Entrega Grátis", "Entrega Rastreável"];

  const featuredShops = React.useMemo(() => {
    return filteredShops.slice(0, 3);
  }, [filteredShops]);

  return (
    <div 
      className="absolute inset-0 z-[140] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar"
    >
      
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-6 flex items-center gap-4">
        <button 
          onClick={onBack}
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
            placeholder={placeholder}
            className="w-full h-14 bg-zinc-50 rounded-[20px] pl-14 pr-6 text-sm font-black uppercase tracking-tighter focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-100"
          />
        </div>
      </header>

      {/* SUB-HEADER TABS */}
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
                  svc.label === activeService 
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
          key={activeService}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1"
        >
          {/* BANNERS DE EXPLORAÇÃO */}
      <ExploreBanners banners={exploreBanners} serviceType={activeService} />

      {/* CATEGORIAS DE PRODUTOS (CARDS IMERSIVOS) */}
      <section className="px-6 py-8 bg-zinc-50/30">
         <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter px-1">Categorias</h3>
            {activeCategoryFilter && (
               <button 
                 onClick={() => setActiveCategoryFilter(null)}
                 className="text-[10px] font-black text-yellow-600 uppercase tracking-widest"
               >
                 Limpar Filtro
               </button>
            )}
         </div>
         <div className="flex gap-8 overflow-x-auto no-scrollbar">
            {categories.map((cat, i) => {
              const isActive = activeCategoryFilter === cat.label;
              return (
                <motion.div 
                  key={i} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategoryFilter(isActive ? null : cat.label)}
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

      {/* SEÇÃO DE PRODUTOS DA CATEGORIA (NOVO) */}
      <AnimatePresence>
        {activeCategoryFilter && filteredProducts.length > 0 && (
          <motion.section 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-6 py-8 overflow-hidden"
          >
             <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-6 px-1">Produtos em <span className="text-yellow-500">{activeCategoryFilter}</span></h3>
             <div className="flex gap-6 overflow-x-auto no-scrollbar pb-4">
                {filteredProducts.map((prod, i) => (
                  <motion.div 
                    key={i}
                    whileTap={{ scale: 0.95 }}
                    className="min-w-[200px] bg-white rounded-[32px] p-4 border border-zinc-100 shadow-xl shadow-zinc-100 flex flex-col gap-3 group"
                  >
                     <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner bg-zinc-50">
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

      {/* FEATURED / OS FAVORITOS */}
      {(!activeCategoryFilter || activeCategoryFilter === "Todos") && featuredShops.length > 0 && (
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
                    onClick={() => handleShopClick(shop)}
                    className="min-w-[280px] h-[340px] bg-white rounded-[44px] overflow-hidden shadow-2xl shadow-zinc-200/50 relative border border-zinc-50 cursor-pointer"
                  >
                     <img src={coverImage} className="size-full object-cover" alt={shop.name} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Top {i + 1}</div>
                           <div className="flex items-center gap-1 text-white text-[12px] font-bold">
                              <span className="material-symbols-rounded text-yellow-400 text-[12px]">star</span>
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

      {/* LISTA DE LOJISTAS */}
      <section className="px-6 py-8 mb-32">
         <div className="flex items-center justify-between mb-8 px-1">
            <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter leading-none">{listTitle}</h3>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{filteredShops.length} Lojas</span>
         </div>
         
         <div className="flex flex-col gap-6">
            {filteredShops.length > 0 ? filteredShops.map((shop, i) => (
              <MerchantCard 
                key={shop.id || i}
                shop={shop}
                onClick={() => handleShopClick(shop)}
                index={i}
              />
            )) : (
              <div className="py-20 flex flex-col items-center justify-center text-zinc-400 gap-6 text-center">
                 <div className="size-24 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner">
                    <span className="material-symbols-rounded text-5xl">storefront</span>
                 </div>
                 <div>
                    <p className="font-black uppercase tracking-widest text-xs mb-2">Nenhuma loja encontrada</p>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Tente outro filtro ou categoria</p>
                 </div>
              </div>
            )}
         </div>
      </section>

        </motion.div>
      </AnimatePresence>
    </div>
  );
};
