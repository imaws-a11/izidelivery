import React, { useState } from 'react';
import { motion } from "framer-motion";
import { MerchantCard } from "../Establishment/MerchantCard";
import { FeaturedMerchantCard } from "./FeaturedMerchantCard";
import { ServicesExploreView } from "./ServicesExploreView";

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

   return (
     <div className="relative h-screen bg-yellow-400 overflow-hidden">
       
       {/* 1. SEMANA DE CUPONS (HEADER FIXO NO FUNDO) */}
       {(appSettings?.promo_banner_config?.active !== false) && (
       <section 
         className={`px-5 pt-10 pb-20 relative overflow-hidden transition-all duration-700 ${appSettings?.promo_banner_config?.image_url ? 'bg-zinc-900' : 'bg-yellow-400'}`}
         style={appSettings?.promo_banner_config?.image_url ? {
           backgroundImage: `url(${appSettings.promo_banner_config.image_url})`,
           backgroundSize: 'cover',
           backgroundPosition: 'center'
         } : {}}
       >
          {appSettings?.promo_banner_config?.image_url && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60 z-0" />
          )}

          <div className="absolute top-4 left-4 opacity-20 z-0">
             <span className={`material-symbols-rounded text-6xl ${appSettings?.promo_banner_config?.image_url ? 'text-white/40' : 'text-white'}`}>shopping_bag</span>
          </div>
          <div className="absolute top-10 right-10 opacity-20 z-0">
             <span className={`material-symbols-rounded text-4xl ${appSettings?.promo_banner_config?.image_url ? 'text-white/40' : 'text-white'}`}>star</span>
          </div>
 
          <div className="flex flex-col items-center relative z-10">
             <div className={`px-6 py-2 rounded-full mb-4 border ${appSettings?.promo_banner_config?.image_url ? 'bg-black/60 border-white/20 backdrop-blur-md' : 'bg-yellow-500/30 border-white/20'}`}>
                <h2 className={`${appSettings?.promo_banner_config?.image_url ? 'text-yellow-400' : 'text-black'} font-black text-xl uppercase tracking-tighter italic`}>
                  {appSettings?.promo_banner_config?.title || 'semana de'}{' '}
                  {!appSettings?.promo_banner_config?.title && <span className="text-2xl block -mt-1">CUPONS</span>}
                </h2>
             </div>
 
             <div className={`w-full rounded-3xl p-4 mb-6 backdrop-blur-md ${appSettings?.promo_banner_config?.image_url ? 'bg-black/40 border border-white/10' : 'bg-black/10'}`}>
                <div className="grid grid-cols-7 gap-1">
                   {(appSettings?.promo_banner_config?.days || [1,2,3,4,5,6,7].map((d: number) => ({day: d, active: true, redeemed: d < 7}))).map((dayObj: any, i: number) => (
                     <div key={i} className={`flex flex-col items-center gap-1 ${!dayObj.active ? 'opacity-30' : dayObj.redeemed ? 'opacity-50' : ''}`}>
                        <span className={`text-[7px] font-bold uppercase ${appSettings?.promo_banner_config?.image_url ? 'text-white/60' : 'text-black/60'}`}>Dia {dayObj.day}</span>
                        {dayObj.redeemed ? (
                          <div className="size-8 bg-emerald-600 rounded-lg flex flex-col items-center justify-center border border-emerald-700/30">
                             <span className="text-[6px] font-bold text-white uppercase leading-none">resgatado</span>
                             <span className="material-symbols-rounded text-white text-xs">check</span>
                          </div>
                        ) : (
                          <div className={`${i === (appSettings?.promo_banner_config?.days?.length || 7) - 1 ? 'w-14 h-16 rotate-3 -mt-2' : 'size-8'} bg-emerald-600 rounded-lg flex flex-col items-center justify-center border-2 border-white shadow-xl`}>
                             <span className="text-[14px] font-black text-white leading-tight">40%</span>
                             <span className="text-[8px] font-black text-white uppercase leading-tight">OFF</span>
                             <span className="text-[6px] font-bold text-white/70 uppercase mt-1">resgatar</span>
                          </div>
                        )}
                     </div>
                   ))}
                </div>
             </div>
 
             <motion.button 
               whileTap={{ scale: 0.95 }}
               className={`text-black font-black text-lg px-12 py-3 rounded-2xl shadow-xl border-b-4 transition-all ${appSettings?.promo_banner_config?.image_url ? 'bg-yellow-400 shadow-yellow-400/20 border-yellow-600' : 'bg-white shadow-yellow-600/30 border-zinc-200'}`}
             >
               Pegar agora!
             </motion.button>
          </div>
       </section>
       )}

       {/* BOTTOM SHEET DESLIZANTE */}
       <motion.div 
         initial={{ y: 0 }}
         drag="y"
         dragConstraints={{ top: -300, bottom: 0 }}
         className="absolute top-[350px] inset-x-0 bottom-0 bg-white rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] z-20 flex flex-col h-[calc(100%-100px)]"
       >
          <div className="w-full flex justify-center py-4 shrink-0">
             <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
             <section className="px-5 mt-2">
                <div className="grid grid-cols-5 gap-y-6 gap-x-2">
                   {displayServices.map((s: any) => (
                     <motion.div 
                       key={s.id}
                       whileTap={{ scale: 0.95 }}
                       onClick={s.action}
                       className="flex flex-col items-center gap-1.5 cursor-pointer group"
                     >
                        <div className="size-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm group-hover:bg-yellow-50 transition-colors relative">
                           {s.icon && s.icon.startsWith('http') ? (
                             <img src={s.icon} className="size-9 object-contain" alt={s.name} />
                           ) : s.img ? (
                             <img src={s.img} className="size-9 object-contain" alt={s.name} />
                           ) : (
                             <span className="material-symbols-rounded text-zinc-400 text-[24px]">{s.icon || 'storefront'}</span>
                           )}
                        </div>
                        <span className="text-[10px] font-bold text-zinc-500 text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {s.name || s.label}
                        </span>
                     </motion.div>
                   ))}
                </div>
             </section>

             <section className="px-5 mt-6 space-y-4">
                <div className="bg-zinc-50 border border-zinc-100 h-14 rounded-2xl flex items-center px-5 gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                   <span className="material-symbols-rounded text-zinc-400 group-hover:text-yellow-600 transition-colors">search</span>
                   <span className="text-zinc-400 font-bold text-sm">O que você quer comer hoje?</span>
                </div>

                <div className="bg-yellow-400 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-lg shadow-yellow-100 border-2 border-white">
                   <div className="relative z-10">
                      <h4 className="text-sm font-black text-black uppercase tracking-tighter">Ofertas Izi Flash</h4>
                      <p className="text-[10px] font-bold text-black/60">Os melhores descontos do dia</p>
                   </div>
                   <span className="material-symbols-rounded text-5xl text-black/10 absolute -right-2 -bottom-2 rotate-12">bolt</span>
                </div>
             </section>

             <section className="mt-10">
                <div className="flex overflow-x-auto snap-x snap-mandatory no-scrollbar gap-4 px-5">
                   {banners.map((b, i) => (
                      <div key={i} className="snap-center shrink-0 w-[85vw] h-48 rounded-[32px] overflow-hidden shadow-lg border border-zinc-100 relative group">
                         <img src={b.image_url} className="size-full object-cover group-hover:scale-105 transition-transform duration-[5s]" alt="Promo" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                   ))}
                </div>
             </section>

             <section className="mt-10">
                <div className="px-5 flex items-center justify-between mb-1">
                   <h3 className="text-xl font-black text-zinc-900 tracking-tight">Famosos da cidade</h3>
                   <button className="text-zinc-900 font-bold text-sm">Ver mais</button>
                </div>
                <p className="px-5 text-xs font-bold text-zinc-400 mb-6">Os mais conhecidos da cidade com frete grátis</p>

                <div className="flex overflow-x-auto no-scrollbar gap-4 px-5 pb-4">
                   {ESTABLISHMENTS.slice(0, 6).map((shop, i) => (
                     <FeaturedMerchantCard 
                       key={i}
                       shop={shop}
                       onClick={() => handleShopClick(shop)}
                     />
                   ))}
                </div>
             </section>

             <section className="mt-6 px-5">
                <div className="flex gap-6 overflow-x-auto no-scrollbar py-2">
                   {[
                     { label: "Marmita", img: "https://cdn-icons-png.flaticon.com/512/3132/3132693.png" },
                     { label: "Salgados", img: "https://cdn-icons-png.flaticon.com/512/3132/3132715.png" },
                     { label: "Padarias", img: "https://cdn-icons-png.flaticon.com/512/3014/3014535.png" },
                     { label: "Saudável", img: "https://cdn-icons-png.flaticon.com/512/3194/3194766.png" },
                     { label: "Doces", img: "https://cdn-icons-png.flaticon.com/512/3132/3132709.png" },
                   ].map((c, i) => (
                     <div key={i} className="flex flex-col items-center gap-2 min-w-[60px] cursor-pointer">
                        <div className="size-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-sm hover:bg-zinc-100 transition-colors">
                           <img src={c.img} className="size-9 object-contain" alt={c.label} />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-600">{c.label}</span>
                     </div>
                   ))}
                </div>
             </section>

             <section className="mt-8 px-5 flex gap-4">
                <div className="flex-1 h-32 rounded-[32px] bg-zinc-900 p-5 relative overflow-hidden shadow-lg shadow-zinc-200">
                   <span className="text-white font-black text-sm leading-tight uppercase relative z-10">entrega <br /> grátis aqui</span>
                   <img src="https://cdn-icons-png.flaticon.com/512/3132/3132693.png" className="absolute -bottom-4 -right-4 size-24 opacity-20 rotate-12" alt="Burger" />
                </div>
                <div className="flex-1 h-32 rounded-[32px] bg-yellow-400 p-5 relative overflow-hidden shadow-lg shadow-yellow-100">
                   <span className="text-black font-black text-sm leading-tight uppercase relative z-10">cupom <br /> até <span className="text-2xl block -mt-1">R$ 30</span></span>
                   <span className="absolute -bottom-4 -right-4 material-symbols-rounded text-6xl text-black opacity-20 rotate-12">confirmation_number</span>
                </div>
             </section>

             <section className="mt-10">
                <div className="px-5 flex gap-2 overflow-x-auto no-scrollbar mb-6">
                   {["Ordenar", "Entrega grátis", "Vale-refeição", "Distância"].map(f => (
                     <button key={f} className="px-5 py-2 rounded-full border border-zinc-200 text-[11px] font-bold text-zinc-600 whitespace-nowrap flex items-center gap-1 bg-white hover:bg-zinc-50 transition-colors">
                        {f}
                        <span className="material-symbols-rounded text-[16px]">expand_more</span>
                     </button>
                   ))}
                </div>

                <div className="flex flex-col px-2 pb-20">
                   {ESTABLISHMENTS.slice(6, 16).map((shop, i) => (
                     <MerchantCard 
                       key={shop.id || i}
                       shop={shop}
                       onClick={() => handleShopClick(shop)}
                       index={i}
                     />
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
