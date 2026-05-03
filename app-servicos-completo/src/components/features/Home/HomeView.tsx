import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { MerchantCard } from "../Establishment/MerchantCard";
import { FeaturedMerchantCard } from "./FeaturedMerchantCard";
import { ServicesExploreView } from "./ServicesExploreView";
import { DigitalTimer } from "../../common/DigitalTimer";

interface HomeViewProps {
  userLocation: { address: string; loading: boolean };
  userName: string | null;
  navigateSubView: (view: string) => void;
  setSubView: (view: string) => void;
  subView: string;
  ESTABLISHMENTS: any[];
  handleShopClick: (shop: any) => void;
  banners: any[];
  isIziBlackMembership: boolean;
  setTab: (tab: any) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onOpenDepositModal?: () => void;
  establishmentTypes?: any[];
  setExploreCategoryState?: (state: any) => void;
  appSettings?: any;
  setActiveService: (service: any) => void;
  flashOffers: any[];
  onRefresh?: () => Promise<void>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userLocation,
  userName,
  navigateSubView,
  setSubView,
  setActiveService,
  ESTABLISHMENTS,
  handleShopClick,
  banners,
  establishmentTypes = [],
  setExploreCategoryState,
  appSettings,
  flashOffers,
  onRefresh,
}) => {
    const [isExploreOpen, setIsExploreOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [sheetMode, setSheetMode] = useState<'normal' | 'expanded'>('normal');
    const [internalSearch, setInternalSearch] = useState('');

    // Lógica de Busca Ultra-Funcional
    const searchResults = useMemo(() => {
      if (!internalSearch.trim()) return { merchants: [], products: [] };
      
      const term = internalSearch.toLowerCase();
      
      // Busca em Lojistas
      const filteredMerchants = ESTABLISHMENTS.filter(m => 
        m.name?.toLowerCase().includes(term) || 
        m.store_name?.toLowerCase().includes(term) ||
        m.category?.toLowerCase().includes(term)
      );

      // Busca em Produtos (se existirem na estrutura)
      const filteredProducts: any[] = [];
      ESTABLISHMENTS.forEach(m => {
        if (m.products && Array.isArray(m.products)) {
          m.products.forEach((p: any) => {
            if (p.name?.toLowerCase().includes(term) || p.description?.toLowerCase().includes(term)) {
              filteredProducts.push({ ...p, merchant: m });
            }
          });
        }
      });

      return { merchants: filteredMerchants, products: filteredProducts };
    }, [internalSearch, ESTABLISHMENTS]);

    const handleCategoryClick = (cat: any) => {
      const title = cat.name || cat.label || "Explorar";
      setActiveService(title);
      const slug = (cat.value || cat.id || "").toLowerCase();
      
      if (['fruit', 'hortifruti', 'hortifrutti', 'frutas', 'verduras', 'legumes'].includes(slug)) {
        navigateSubView("explore_izi_envios");
        return;
      }

      if (['gas', 'gas_agua', 'agua', 'gas_e_agua', 'viagem', 'mobilidade', 'corridas', 'taxi'].includes(slug)) {
        navigateSubView("explore_envios");
        return;
      }

      if (['restaurants', 'food', 'restaurant', 'restaurante', 'restaurantes', 'almoço', 'jantar'].includes(slug)) {
        navigateSubView(`explore_restaurants`);
      } else if (['market', 'markets', 'mercado', 'mercados', 'mercearia'].includes(slug)) {
        navigateSubView(`explore_market`);
      } else if (['pharmacy', 'farmacia', 'farmacias', 'saude', 'drogaria'].includes(slug)) {
        navigateSubView(`explore_pharmacy`);
      } else if (['beverages', 'bebidas', 'bebida', 'adega', 'distribuidora'].includes(slug)) {
        navigateSubView(`explore_beverages`);
      } else if (['petshop', 'pets', 'pet_shop', 'pet'].includes(slug)) {
        navigateSubView(`explore_petshop`);
      } else if (['bakery', 'padaria', 'confeitaria', 'pães'].includes(slug)) {
        navigateSubView(`explore_bakery`);
      } else {
        if (setExploreCategoryState) {
          setExploreCategoryState({
            id: slug,
            title: cat.name,
            tagline: cat.description || `Tudo de ${cat.name} para você`,
            icon: cat.icon || 'storefront',
            primaryColor: 'bg-yellow-400'
          });
          navigateSubView('explore_category');
        }
      }
    };

    const priorityOrder = [
      ['fruit', 'hortifruti', 'hortifrutti', 'frutas', 'verduras'],
      ['gas', 'gas_agua', 'agua', 'viagem', 'mobilidade'],
      ['padaria', 'bakery', 'confeitaria'],
      ['restaurants', 'food', 'restaurante', 'restaurantes'],
      ['markets', 'mercado', 'mercados', 'market'],
      ['pharmacy', 'farmacia', 'farmacias'],
      ['beverages', 'bebidas', 'bebida'],
      ['petshop', 'pets', 'pet_shop'],
      ['butcher', 'acougue', 'carnes']
    ];

    const getPriority = (slug: string) => {
      const s = (slug || '').toLowerCase();
      for (let i = 0; i < priorityOrder.length; i++) {
        if (priorityOrder[i].includes(s)) return i;
      }
      return 999;
    };

    const dynamicServices = establishmentTypes
      .filter((t: any) => t.is_active !== false)
      .map((t: any) => {
        const slug = (t.value || t.id || "").toLowerCase();
        if (['fruit', 'hortifruti', 'hortifrutti', 'frutas', 'verduras', 'legumes'].includes(slug)) {
          return { ...t, name: 'Izi Envios', icon: 'package_2', action: () => handleCategoryClick(t) };
        }
        if (['gas', 'gas_agua', 'agua', 'gas_e_agua', 'viagem', 'mobilidade', 'corridas', 'taxi'].includes(slug)) {
          return { ...t, name: 'Viagens', icon: 'directions_car', action: () => handleCategoryClick(t) };
        }
        return {
          ...t,
          action: () => handleCategoryClick(t)
        };
      })
      .sort((a: any, b: any) => getPriority(a.value || a.id) - getPriority(b.value || b.id))
      .slice(0, 9);

    const displayServices = [
      ...dynamicServices,
      { id: 'ver_mais', name: 'Ver mais', icon: 'grid_view', action: () => setIsExploreOpen(true) }
    ];

    const heroImages = useMemo(() => 
      appSettings?.promo_banner_config?.image_urls?.length > 0 
        ? appSettings.promo_banner_config.image_urls 
        : [appSettings?.home_hero_image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop"]
    , [appSettings]);

    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    useEffect(() => {
      if (heroImages.length <= 1) return;
      const timer = setInterval(() => {
        setCurrentHeroIndex(prev => (prev + 1) % heroImages.length);
      }, 6000);
      return () => clearInterval(timer);
    }, [heroImages.length]);

    const dragControls = useDragControls();

    return (
      <div className="relative h-screen bg-zinc-950 overflow-hidden">
        
        {/* INDICADOR DE PULL-TO-REFRESH */}
        <div className="absolute top-0 inset-x-0 flex justify-center z-50 pointer-events-none">
           <motion.div 
             style={{ 
               y: pullDistance > 0 ? pullDistance - 80 : -80,
               opacity: pullDistance > 20 ? (pullDistance / 100) : 0,
               scale: pullDistance > 20 ? Math.min(pullDistance / 80, 1.2) : 0.5
             }}
             className="bg-yellow-400 size-12 rounded-2xl shadow-2xl flex items-center justify-center text-black"
           >
              {isRefreshing ? (
                <motion.span 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="material-symbols-rounded"
                >
                  autorenew
                </motion.span>
              ) : (
                <motion.span 
                  animate={{ rotate: pullDistance * 2 }}
                  className="material-symbols-rounded"
                >
                  arrow_downward
                </motion.span>
              )}
           </motion.div>
        </div>

        {/* 1. HERO CARROSSEL IMERSIVO */}
         <header className="absolute top-0 inset-x-0 h-[480px] overflow-hidden z-0 bg-zinc-900">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.img 
                key={currentHeroIndex}
                src={heroImages[currentHeroIndex]} 
                initial={{ x: 300, opacity: 0, scale: 1.1 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -300, opacity: 0 }}
                transition={{ 
                  duration: 1, 
                  ease: [0.16, 1, 0.3, 1] 
                }}
                className="absolute inset-0 size-full object-cover" 
                alt="Izi Delivery Hero" 
              />
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950" />
            
            {/* Indicadores do Carrossel */}
            {heroImages.length > 1 && (
              <div className="absolute bottom-24 left-8 flex gap-2 z-10">
                {heroImages.map((_: any, i: number) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-500 ${currentHeroIndex === i ? 'w-8 bg-yellow-400' : 'w-2 bg-white/30'}`}
                  />
                ))}
              </div>
            )}
        </header>

        {/* BOTTOM SHEET ULTRA PROFISSIONAL */}
        <motion.div 
          animate={{ y: sheetMode === 'expanded' ? -380 : 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          drag="y"
          dragControls={dragControls}
          dragListener={false}
          dragConstraints={{ top: -380, bottom: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.y < -50) setSheetMode('expanded');
            if (info.offset.y > 50) {
              setSheetMode('normal');
              if (internalSearch) setInternalSearch('');
            }
          }}
          className="fixed top-[420px] inset-x-0 bottom-0 bg-white rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.4)] z-20 flex flex-col overflow-hidden"
          style={{ height: 'calc(100vh - 40px)' }}
        >
           {/* Handle de Arrasto */}
           <div 
             onPointerDown={(e) => dragControls.start(e)}
             className="w-full flex justify-center py-5 shrink-0 cursor-grab active:cursor-grabbing"
           >
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
           </div>

           <div id="home-scroll-container" className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6">
              
              {/* BARRA DE BUSCA FUNCIONAL */}
              <section className="mb-10">
                 <div className="relative group">
                    <div className={`absolute left-6 top-1/2 -translate-y-1/2 transition-colors ${internalSearch ? 'text-yellow-600' : 'text-zinc-400'}`}>
                       <span className="material-symbols-rounded text-2xl">search</span>
                    </div>
                    <input 
                      type="text"
                      placeholder="O que você quer comer hoje?"
                      value={internalSearch}
                      onFocus={() => setSheetMode('expanded')}
                      onChange={(e) => setInternalSearch(e.target.value)}
                      className="w-full h-16 bg-zinc-50 border border-zinc-100 rounded-[28px] pl-16 pr-6 font-bold text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-yellow-400/10 focus:border-yellow-400 transition-all text-sm"
                    />
                    {internalSearch && (
                      <button 
                        onClick={() => setInternalSearch('')}
                        className="absolute right-6 top-1/2 -translate-y-1/2 size-8 bg-zinc-200 rounded-full flex items-center justify-center active:scale-90 transition-all"
                      >
                         <span className="material-symbols-rounded text-zinc-600 text-sm">close</span>
                      </button>
                    )}
                 </div>
              </section>

              <AnimatePresence mode="wait">
                {internalSearch.trim() ? (
                  <motion.div 
                    key="search-results"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    {/* Resultados de Lojas */}
                    {searchResults.merchants.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Lojas Encontradas</h3>
                        <div className="space-y-4">
                          {searchResults.merchants.map((shop, i) => (
                            <MerchantCard key={shop.id || i} shop={shop} onClick={() => handleShopClick(shop)} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Resultados de Produtos */}
                    {searchResults.products.length > 0 && (
                      <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-2">Produtos Encontrados</h3>
                        <div className="grid grid-cols-1 gap-4">
                          {searchResults.products.map((prod, i) => (
                            <div 
                              key={i} 
                              onClick={() => handleShopClick(prod.merchant)}
                              className="bg-white p-4 rounded-3xl border border-zinc-100 flex items-center gap-4 active:scale-[0.98] transition-all"
                            >
                               <div className="size-16 rounded-2xl bg-zinc-50 overflow-hidden shrink-0 border border-zinc-50">
                                  <img src={prod.image_url || prod.image} className="size-full object-cover" alt={prod.name} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-zinc-900 truncate">{prod.name}</h4>
                                  <p className="text-[10px] text-zinc-400 font-bold uppercase truncate mt-0.5">{prod.merchant.name}</p>
                                  <p className="text-xs font-black text-yellow-600 mt-1">R$ {Number(prod.price).toFixed(2).replace('.', ',')}</p>
                               </div>
                               <span className="material-symbols-rounded text-zinc-300">chevron_right</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {searchResults.merchants.length === 0 && searchResults.products.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 opacity-40">
                         <span className="material-symbols-rounded text-6xl text-zinc-300 mb-4">search_off</span>
                         <p className="text-sm font-black text-zinc-500 uppercase tracking-widest">Nenhum resultado para "{internalSearch}"</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div 
                    key="home-content"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-12"
                  >
                    {/* Categorias */}
                    <section>
                      <div className="grid grid-cols-5 gap-y-8 gap-x-4">
                          {displayServices.map((s: any) => (
                            <motion.div 
                              key={s.id}
                              whileTap={{ scale: 0.95 }}
                              onClick={s.action}
                              className="flex flex-col items-center gap-2 cursor-pointer group"
                            >
                               <div className="size-16 rounded-3xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm group-hover:bg-yellow-50 transition-all relative overflow-hidden active:scale-90">
                                  {s.icon && s.icon.startsWith('http') ? (
                                    <img src={s.icon} className="size-10 object-contain" alt={s.name} />
                                  ) : s.img ? (
                                    <img src={s.img} className="size-10 object-contain" alt={s.name} />
                                  ) : (
                                    <span className="material-symbols-rounded text-zinc-400 text-[28px]">{s.icon || 'storefront'}</span>
                                  )}
                               </div>
                               <span className="text-[10px] font-black text-zinc-900 text-center leading-tight uppercase tracking-tighter truncate w-full">
                                 {s.name || s.label}
                               </span>
                            </motion.div>
                          ))}
                      </div>
                    </section>

                    {/* OFERTAS IZI FLASH */}
                    <section>
                      <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
                            <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Ofertas Izi Flash</h3>
                          </div>
                          <button onClick={() => setSubView("flash_offers")} className="flex items-center gap-2 group">
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ver tudo</span>
                            <span className="material-symbols-rounded text-yellow-500">bolt</span>
                          </button>
                      </div>
                      <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 -mx-6 px-6">
                          {(flashOffers || []).slice(0, 10).map((f, i) => (
                            <div 
                              key={i} 
                              onClick={() => setSubView("flash_offers")}
                              className="snap-center shrink-0 w-[85vw] h-56 rounded-[44px] overflow-hidden shadow-2xl border border-zinc-100 relative bg-zinc-900"
                            >
                                <img src={f.product_image || f.admin_users?.store_logo} className="size-full object-cover opacity-60" alt="Promo" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-8 flex flex-col justify-end">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Oferta Flash</span>
                                      <span className="text-white/60 text-[9px] font-bold uppercase tracking-widest truncate">{f.admin_users?.store_name}</span>
                                      {f.expires_at && (
                                          <div className="ml-auto">
                                            <DigitalTimer targetDate={f.expires_at} size="sm" />
                                          </div>
                                      )}
                                    </div>
                                    <h4 className="text-2xl font-black text-white uppercase tracking-tighter leading-tight line-clamp-1">{f.product_name || f.title}</h4>
                                    <div className="flex items-center gap-3 mt-2">
                                      <span className="text-yellow-400 text-xl font-black tracking-tighter">R$ {Number(f.discounted_price).toFixed(2).replace('.', ',')}</span>
                                      <span className="text-white/40 text-xs line-through font-bold">R$ {Number(f.original_price).toFixed(2).replace('.', ',')}</span>
                                    </div>
                                </div>
                            </div>
                          ))}
                      </div>
                    </section>

                    {/* FAMOSOS DA CIDADE */}
                    <section>
                      <div className="flex items-center justify-between mb-2">
                          <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Famosos da cidade</h3>
                          <button className="text-yellow-600 font-black text-[10px] uppercase tracking-widest">Ver ranking</button>
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400 mb-8 uppercase tracking-widest">Os restaurantes mais pedidos da sua região</p>

                      <div className="flex overflow-x-auto no-scrollbar gap-6 -mx-6 px-6 pb-6">
                          {ESTABLISHMENTS.slice(0, 6).map((shop, i) => (
                            <FeaturedMerchantCard 
                              key={i}
                              shop={shop}
                              onClick={() => handleShopClick(shop)}
                            />
                          ))}
                      </div>
                    </section>

                    {/* EXPERIÊNCIAS ÚNICAS - REDESIGN PREMIUM */}
                    <section>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex flex-col">
                                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Experiências Únicas</h3>
                                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">Explore o melhor da sua cidade</p>
                            </div>
                            <div className="size-10 rounded-full bg-yellow-50 flex items-center justify-center">
                                <span className="material-symbols-rounded text-yellow-600 text-xl">explore</span>
                            </div>
                        </div>
                        <div className="flex gap-5 overflow-x-auto no-scrollbar -mx-6 px-6 py-2">
                            {[
                              { label: "Excursões", tagline: "Viagens em grupo", img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&h=600&fit=crop", action: () => navigateSubView('explore_excursions') },
                              { label: "Bate e volta", tagline: "Passeios rápidos", img: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=400&h=600&fit=crop", action: () => navigateSubView('explore_daytrips') },
                              { label: "Hospedagem", tagline: "Resorts e hotéis", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=600&fit=crop", action: () => navigateSubView('explore_hotels') },
                              { label: "Noite (Bar)", tagline: "Bares e baladas", img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=400&h=600&fit=crop", action: () => navigateSubView('explore_nightlife') },
                              { label: "Agenda", tagline: "Eventos locais", img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=400&h=600&fit=crop", action: () => navigateSubView('explore_agenda') },
                              { label: "Passeios", tagline: "Tour guiado", img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=600&fit=crop", action: () => navigateSubView('explore_tours') },
                            ].map((c, i) => (
                              <motion.div 
                                key={i} 
                                whileTap={{ scale: 0.95 }}
                                onClick={c.action} 
                                className="relative shrink-0 w-44 aspect-[3/4.5] rounded-[32px] overflow-hidden group cursor-pointer shadow-xl shadow-zinc-200/50"
                              >
                                  <img 
                                    src={c.img} 
                                    className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" 
                                    alt={c.label} 
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5 flex flex-col justify-end">
                                      <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1">{c.tagline}</span>
                                      <h4 className="text-lg font-black text-white uppercase tracking-tighter leading-tight">{c.label}</h4>
                                      <div className="mt-3 size-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center self-end opacity-0 group-hover:opacity-100 transition-opacity">
                                         <span className="material-symbols-rounded text-white text-sm">arrow_forward</span>
                                      </div>
                                  </div>
                              </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* RESTAURANTES LISTA */}
                    <section>
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Explorar Lojas</h3>
                        </div>
                        <div className="space-y-8">
                          {ESTABLISHMENTS.slice(6, 16).map((shop, i) => (
                            <motion.div
                              key={shop.id || i}
                              initial={{ opacity: 0, y: 20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                            >
                              <MerchantCard 
                                shop={shop}
                                onClick={() => handleShopClick(shop)}
                                index={i}
                              />
                            </motion.div>
                          ))}
                        </div>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </motion.div>

         <ServicesExploreView 
           isOpen={isExploreOpen} 
           onClose={() => setIsExploreOpen(false)} 
           navigateSubView={navigateSubView}
           establishmentTypes={establishmentTypes}
           setExploreCategoryState={setExploreCategoryState}
           setActiveService={setActiveService}
           ESTABLISHMENTS={ESTABLISHMENTS}
           handleShopClick={handleShopClick}
         />
      </div>
    );
};
