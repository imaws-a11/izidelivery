import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
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
}) => {
   const [isExploreOpen, setIsExploreOpen] = useState(false);

    const handleCategoryClick = (cat: any) => {
      const title = cat.name || cat.label || "Explorar";
      setActiveService(title);
      const slug = (cat.value || cat.id || "").toLowerCase();
     
     // Mapeamento para as views específicas do Izi Delivery
     if (['fruit', 'hortifruti', 'hortifrutti', 'frutas', 'verduras', 'legumes'].includes(slug)) {
       navigateSubView("explore_izi_envios");
       return;
     }

     if (['gas', 'gas_agua', 'agua', 'gas_e_agua', 'viagem', 'mobilidade', 'corridas', 'taxi'].includes(slug)) {
       navigateSubView("explore_envios");
       return;
     }

     // Mapeamento de Slugs para Views Customizadas (Padronizadas)
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

     // Lógica do Carrossel Hero
     const heroImages = appSettings?.promo_banner_config?.image_urls?.length > 0 
       ? appSettings.promo_banner_config.image_urls 
       : [appSettings?.home_hero_image || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1200&auto=format&fit=crop"];

     const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

     useEffect(() => {
       if (heroImages.length <= 1) return;
       const timer = setInterval(() => {
         setCurrentHeroIndex(prev => (prev + 1) % heroImages.length);
       }, 6000); // 6 segundos de exibição por banner
       return () => clearInterval(timer);
     }, [heroImages.length]);

    return (
      <div className="relative h-screen bg-zinc-950 overflow-hidden">
        
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

        {/* BOTTOM SHEET DESLIZANTE */}
        <motion.div 
          initial={{ y: 0 }}
          drag="y"
          dragConstraints={{ top: -350, bottom: 0 }}
          className="absolute top-[400px] inset-x-0 bottom-0 bg-white rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.4)] z-20 flex flex-col h-[calc(100%-100px)]"
        >
           <div className="w-full flex justify-center py-5 shrink-0">
              <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
           </div>

           <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
              <section className="px-6 mt-2">
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
                            <div className="absolute inset-0 bg-yellow-400 opacity-0 group-active:opacity-10 transition-opacity" />
                         </div>
                         <span className="text-[10px] font-black text-zinc-900 text-center leading-tight uppercase tracking-tighter truncate w-full">
                           {s.name || s.label}
                         </span>
                      </motion.div>
                    ))}
                 </div>
              </section>

              <section className="px-6 mt-10 space-y-4">
                 <div 
                   onClick={() => setTab("busca")}
                   className="bg-zinc-50 border border-zinc-100 h-20 rounded-[32px] flex items-center px-8 gap-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer group active:scale-[0.98]"
                 >
                    <span className="material-symbols-rounded text-zinc-400 group-hover:text-yellow-600 transition-colors text-3xl">search</span>
                    <span className="text-zinc-400 font-black text-lg uppercase tracking-tighter">O que você quer comer hoje?</span>
                 </div>
              </section>

              {/* OFERTAS IZI FLASH */}
              <section className="mt-12">
                 <div className="px-6 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                       <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
                       <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Ofertas Izi Flash</h3>
                    </div>
                    <button 
                      onClick={() => setSubView("flash_offers")}
                      className="flex items-center gap-2 group"
                    >
                       <span className="text-[10px] font-black text-zinc-400 group-hover:text-yellow-600 uppercase tracking-widest transition-colors">Ver tudo</span>
                       <span className="material-symbols-rounded text-yellow-500 animate-bounce group-hover:scale-125 transition-transform">bolt</span>
                    </button>
                 </div>
                  <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 px-6">
                     {(flashOffers || []).slice(0, 10).map((f, i) => (
                        <div 
                          key={i} 
                          onClick={() => setSubView("flash_offers")}
                          className="snap-center shrink-0 w-[85vw] h-56 rounded-[44px] overflow-hidden shadow-2xl border border-zinc-100 relative group active:scale-95 transition-all cursor-pointer bg-zinc-900"
                        >
                           <img src={f.product_image || f.admin_users?.store_logo} className="size-full object-cover group-hover:scale-110 transition-transform duration-[5s] opacity-60" alt="Promo" />
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
                     {(flashOffers || []).length === 0 && (
                         <div className="w-full flex items-center justify-center py-10 opacity-30">
                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Nenhuma oferta relâmpago agora</p>
                         </div>
                     )}
                  </div>
              </section>

              <section className="mt-14">
                 <div className="px-6 flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Famosos da cidade</h3>
                    <button className="text-yellow-600 font-black text-[10px] uppercase tracking-widest">Ver ranking</button>
                 </div>
                 <p className="px-6 text-[10px] font-bold text-zinc-400 mb-8 uppercase tracking-widest">Os restaurantes mais pedidos da sua região</p>

                 <div className="flex overflow-x-auto no-scrollbar gap-6 px-6 pb-6">
                    {ESTABLISHMENTS.slice(0, 6).map((shop, i) => (
                      <FeaturedMerchantCard 
                        key={i}
                        shop={shop}
                        onClick={() => handleShopClick(shop)}
                      />
                    ))}
                 </div>
              </section>

              <section className="mt-14 px-6">
                 <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Experiências Únicas</h3>
                    <span className="material-symbols-rounded text-yellow-500">explore</span>
                 </div>
                 <div className="flex gap-8 overflow-x-auto no-scrollbar py-2">
                    {[
                      { label: "Excursões", img: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=200&h=200&fit=crop", action: () => navigateSubView('explore_excursions') },
                      { label: "Bate e volta", img: "https://images.unsplash.com/photo-1506012787146-f92b2d7d6d96?w=200&h=200&fit=crop", action: () => navigateSubView('explore_daytrips') },
                      { label: "Hospedagem", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&h=200&fit=crop", action: () => navigateSubView('explore_hotels') },
                      { label: "Noite (Bar)", img: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=200&h=200&fit=crop", action: () => navigateSubView('explore_nightlife') },
                      { label: "Agenda", img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=200&h=200&fit=crop", action: () => navigateSubView('explore_agenda') },
                      { label: "Passeios", img: "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=200&h=200&fit=crop", action: () => navigateSubView('explore_tours') },
                    ].map((c, i) => (
                      <div key={i} onClick={c.action} className="flex flex-col items-center gap-4 min-w-[100px] cursor-pointer group active:scale-95 transition-all">
                         <div className="size-24 rounded-[40px] bg-white overflow-hidden border border-zinc-100 shadow-2xl shadow-zinc-100 group-hover:border-yellow-400 transition-all">
                            <img src={c.img} className="size-full object-cover group-hover:scale-125 transition-transform duration-700" alt={c.label} />
                         </div>
                         <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tighter text-center whitespace-nowrap px-2">{c.label}</span>
                      </div>
                    ))}
                 </div>
              </section>

              <section className="mt-14">
                 <div className="px-6 flex flex-col gap-8 pb-32">
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
           </div>
        </motion.div>

         <ServicesExploreView 
           isOpen={isExploreOpen} 
           onClose={() => setIsExploreOpen(false)} 
           navigateSubView={navigateSubView}
           establishmentTypes={establishmentTypes}
           setExploreCategoryState={setExploreCategoryState}
           setActiveService={setActiveService}
         />
      </div>
   );
};
