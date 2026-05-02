import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../contexts/AppContext";
import { MerchantCard } from "../Establishment/MerchantCard";
import { ExploreBanners } from "../../common/ExploreBanners";

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
    { label: "Petshop", icon: "pets" },
  ];

  const filters = ["Ordenar", "Cupom", "Entrega Grátis", "Entrega Rastreável"];

  return (
    <div className="absolute inset-0 z-[140] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar">
      
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
                    "Petshop": "explore_petshop"
                  };
                  const targetView = viewMap[svc.label];
                  if (targetView) navigateSubView(targetView);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                  svc.label === activeService 
                  ? "bg-zinc-900 border-zinc-900 text-yellow-400 font-black shadow-xl" 
                  : "bg-white border-zinc-100 text-zinc-400 font-bold"
                }`}
              >
                <span className="material-symbols-rounded text-[20px]">{svc.icon}</span>
                <span className="text-[10px] uppercase tracking-widest">{svc.label}</span>
              </button>
            ))}
         </div>
      </section>

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

    </div>
  );
};
