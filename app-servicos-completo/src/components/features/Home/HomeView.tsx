// Force HMR reload
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
  setSelectedItem?: (item: any) => void;
  onReturnToPayment?: (order: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  userLocation,
  userName,
  navigateSubView,
  setSubView,
  subView,
  setActiveService,
  ESTABLISHMENTS,
  handleShopClick,
  banners,
  establishmentTypes = [],
  setExploreCategoryState,
  appSettings,
  flashOffers,
  onRefresh,
  myOrders = [],
  setSelectedItem,
  onReturnToPayment,
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
      
      if (['izi_envios', 'fruit', 'hortifruti'].includes(slug)) {
        navigateSubView("explore_izi_envios");
        return;
      }

      if (['viagens', 'viagem', 'mobilidade'].includes(slug)) {
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
      } else if (['gas', 'gas_agua', 'agua', 'gas_e_agua'].includes(slug)) {
        navigateSubView(`explore_gas`);
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



    const dynamicServices = establishmentTypes
      .filter((t: any) => t.is_active !== false && !t.parent_id)
      .map((t: any) => ({
        ...t,
        action: () => handleCategoryClick(t)
      }))
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));

    const displayServices = [
      ...dynamicServices.slice(0, 9),
      { id: 'ver_mais', name: 'Ver mais', icon: 'grid_view', action: () => setIsExploreOpen(true) }
    ].slice(0, 10);

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
          initial={false}
          animate={{ 
            y: subView !== 'none' ? 1000 : (sheetMode === 'expanded' ? -380 : 0),
            opacity: subView !== 'none' ? 0 : 1
          }}
          transition={{ type: "spring", damping: 35, stiffness: 350 }}
          drag={subView === 'none' ? "y" : false}
          dragElastic={0.05}
          dragConstraints={{ top: -380, bottom: 0 }}
          onDragEnd={(e, info) => {
            const v = info.velocity.y;
            const o = info.offset.y;
            if (o < -50 || v < -500) setSheetMode('expanded');
            else if (o > 50 || v > 500) {
              setSheetMode('normal');
              if (internalSearch) setInternalSearch('');
            }
          }}
          className="fixed top-[420px] inset-x-0 bottom-0 bg-white rounded-t-[48px] shadow-[0_-40px_80px_rgba(0,0,0,0.3)] z-[400] flex flex-col overflow-hidden border-t border-zinc-100"
          style={{ height: 'calc(100vh - 40px)', touchAction: 'none' }}
        >
           {/* Handle de Arrasto - Área de Toque Ampliada */}
           <div 
             onPointerDown={(e) => dragControls.start(e)}
             className="w-full flex justify-center py-6 shrink-0 cursor-grab active:cursor-grabbing"
           >
              <div className="w-16 h-1.5 bg-zinc-200 rounded-full shadow-inner" />
           </div>

           <div id="home-scroll-container" className="flex-1 overflow-y-auto no-scrollbar pb-32 px-6">
              
              {/* ANÚNCIO GLOBAL */}
              {appSettings?.global_announcement && (
                <motion.section 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-8"
                >
                  <div className="bg-zinc-900 p-6 rounded-[32px] border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 size-20 bg-yellow-400/20 blur-2xl rounded-full" />
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="size-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-black text-xl">campaign</span>
                      </div>
                      <p className="text-white text-xs font-bold leading-relaxed">{appSettings.global_announcement}</p>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* PEDIDO EM ANDAMENTO (SMART BANNER) */}
              {(() => {
                const activeOrder = myOrders.find(o => o.status && !["concluido", "cancelado"].includes(o.status));
                if (!activeOrder) return null;

                const isTrackingAvailable = ["a_caminho_coleta", "saiu_para_coleta", "picked_up", "a_caminho", "em_rota", "saiu_para_entrega", "no_local"].includes(activeOrder.status);

                const isMobility = activeOrder.service_type && ["mototaxi", "carro", "van", "utilitario"].includes(activeOrder.service_type);
                const isEnvios = activeOrder.service_type && ["logistica", "frete", "izi_envios"].includes(activeOrder.service_type);

                let bannerTitle = "Pedido em Andamento";
                let bannerName = activeOrder.merchant_name || "Izi Delivery";
                let bannerIcon = isTrackingAvailable ? "local_shipping" : "restaurant";

                if (isMobility) {
                  bannerTitle = "Viagem em Andamento";
                  bannerName = "Sua corrida Izi";
                  bannerIcon = activeOrder.service_type === "mototaxi" ? "two_wheeler" : "directions_car";
                } else if (isEnvios) {
                  bannerTitle = "Entrega em Andamento";
                  bannerName = "Izi Envios";
                  bannerIcon = "local_shipping";
                }

                const baseStatusMap: Record<string, string> = {
                  "pendente": "Aguardando",
                  "novo": "Aguardando",
                  "pendente_pagamento": "Aguardando Pagto",
                  "waiting_merchant": "Aguardando Loja",
                  "waiting_driver": "Buscando Parceiro",
                  "atribuindo": "Buscando Parceiro",
                  "aceito": "Aceito",
                  "confirmado": "Confirmado",
                  "preparando": "Preparando",
                  "no_preparo": "Preparando",
                  "pronto": "Pronto",
                  "a_caminho_coleta": "A Caminho da Coleta",
                  "saiu_para_coleta": "A Caminho da Coleta",
                  "chegou_coleta": "Na Coleta",
                  "no_local_coleta": "Na Coleta",
                  "picked_up": "Em Andamento",
                  "em_rota": "Em Andamento",
                  "saiu_para_entrega": "A Caminho",
                  "a_caminho": "A Caminho",
                  "no_local": "No Destino",
                  "concluido": "Concluído",
                  "delivered": "Entregue",
                  "finalizado": "Finalizado",
                  "cancelado": "Cancelado"
                };

                const mobilityStatusMap: Record<string, string> = {
                  ...baseStatusMap,
                  "pendente": "Buscando Parceiro",
                  "novo": "Buscando Parceiro",
                  "waiting_driver": "Buscando Parceiro",
                  "atribuindo": "Buscando Parceiro",
                  "aceito": "Motorista a Caminho",
                  "a_caminho_coleta": "Motorista a Caminho",
                  "saiu_para_coleta": "Motorista a Caminho",
                  "chegou_coleta": "Chegou ao Endereço",
                  "no_local_coleta": "Chegou ao Endereço",
                  "picked_up": "A Caminho",
                  "em_rota": "A Caminho",
                  "a_caminho": "A Caminho",
                  "saiu_para_entrega": "A Caminho",
                  "no_local": "No Destino",
                };
                
                const statusMap = isMobility ? mobilityStatusMap : baseStatusMap;
                const displayStatus = statusMap[activeOrder.status] || activeOrder.status?.replace("_", " ");

                const isPending = activeOrder.status === 'pendente_pagamento' || activeOrder.payment_status === 'pending';
                const isOffline = activeOrder.payment_method === 'dinheiro' || activeOrder.payment_method === 'cartao_entrega';

                return (
                  <motion.section 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 space-y-3"
                  >
                    <div 
                      onClick={() => {
                        if (setSelectedItem) setSelectedItem(activeOrder);
                        setSubView("active_order");
                      }}
                      className="bg-yellow-400 p-5 rounded-[32px] flex items-center gap-4 shadow-[0_20px_40px_rgba(250,204,21,0.25)] border-none relative overflow-hidden active:scale-[0.98] transition-all group"
                    >
                      <div className="absolute top-0 right-0 size-24 bg-white/20 blur-2xl rounded-full translate-x-8 -translate-y-8" />
                      
                      <div className="size-14 rounded-2xl bg-black flex items-center justify-center shadow-lg shrink-0">
                        <span className="material-symbols-rounded text-yellow-400 text-3xl animate-bounce">
                          {bannerIcon}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-black/50 uppercase tracking-[0.2em] mb-0.5">{bannerTitle}</p>
                        <h3 className="text-sm font-black text-black truncate tracking-tight">
                          {bannerName}
                        </h3>
                        <p className="text-[10px] font-bold text-black/60 truncate">
                          Status: {displayStatus?.toUpperCase()}
                        </p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[8px] font-black text-black/40 uppercase tracking-widest">Acompanhar</span>
                        <div className="size-8 rounded-full bg-black/10 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <span className="material-symbols-rounded text-black">arrow_forward</span>
                        </div>
                      </div>
                    </div>

                    {isPending && !isOffline && onReturnToPayment && (
                      <button 
                        onClick={() => onReturnToPayment(activeOrder)}
                        className="w-full h-14 bg-zinc-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         <span className="material-symbols-rounded text-yellow-400">payments</span>
                         Concluir Pagamento Agora
                      </button>
                    )}
                  </motion.section>
                );
              })()}
              
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
                            <MerchantCard key={shop.id || i} shop={shop} onClick={() => handleShopClick(shop)} index={i} />
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
                          {displayServices.map((s: any) => {
                            const nameStr = (s.name || s.label || '').toLowerCase();
                            const slugStr = (s.id || '').toLowerCase();
                            const isHighlight = s._exclusive === true || ['izi_envios', 'viagens', 'mobilidade'].includes(slugStr) || nameStr.includes('envios') || nameStr.includes('viagem') || nameStr.includes('viagens');
                            
                            return (
                              <motion.div 
                                key={s.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={s.action}
                                className="flex flex-col items-center gap-2 cursor-pointer group relative"
                              >
                                <div className={`size-16 rounded-3xl flex items-center justify-center border shadow-sm transition-all relative overflow-hidden active:scale-90 ${
                                  isHighlight 
                                    ? 'bg-gradient-to-br from-yellow-400 via-yellow-300 to-amber-400 border-yellow-300 shadow-lg shadow-yellow-400/30 group-hover:shadow-xl group-hover:shadow-yellow-400/40' 
                                    : 'bg-zinc-50 border-zinc-100 group-hover:bg-yellow-50'
                                }`}>
                                  {isHighlight && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent" />
                                  )}
                                  {s.icon && s.icon.startsWith('http') ? (
                                    <img src={s.icon} className="size-11 object-contain relative z-[1]" alt={s.name} />
                                  ) : s.img ? (
                                    <img src={s.img} className="size-11 object-contain relative z-[1]" alt={s.name} />
                                  ) : (
                                    <span className={`material-symbols-rounded text-[32px] relative z-[1] ${isHighlight ? 'text-black' : 'text-zinc-400'}`}>{s.icon || 'storefront'}</span>
                                  )}
                                </div>
                                <span className={`text-[10px] font-black text-center leading-tight uppercase tracking-tighter truncate w-full ${
                                  isHighlight ? 'text-yellow-600' : 'text-zinc-900'
                                }`}>
                                  {s.name || s.label}
                                </span>
                              </motion.div>
                            );
                          })}
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
                                            <DigitalTimer targetDate={f.expires_at} size="sm" variant="izi-flash" />
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

                    <section className="pb-20">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter">Explorar Lojas</h3>
                        </div>
                        <div className="space-y-8">
                          {ESTABLISHMENTS.map((shop, i) => (
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
