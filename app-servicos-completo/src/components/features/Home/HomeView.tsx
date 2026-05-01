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
}

export const HomeView: React.FC<HomeViewProps> = ({
  userLocation,
  userName,
  navigateSubView,
  setSubView,
  ESTABLISHMENTS,
  handleShopClick,
  banners,
  establishmentTypes = [],
  setExploreCategoryState,
}) => {
   const [isExploreOpen, setIsExploreOpen] = useState(false);

   const handleCategoryClick = (cat: any) => {
     const slug = cat.value || cat.id;
     
     // Viagem é uma rota nativa específica
     if (slug === 'izi_envios' || slug === 'viagem' || slug === 'mobilidade') {
       navigateSubView("explore_envios");
       return;
     }

     const customViews = ['restaurants', 'market', 'pharmacy', 'beverages', 'petshop', 'gas', 'bakery', 'fruit'];
     if (customViews.includes(slug)) {
       navigateSubView(`explore_${slug}`);
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
     ['restaurants', 'food', 'restaurante', 'restaurantes'],
     ['markets', 'mercado', 'mercados', 'market'],
     ['pharmacy', 'farmacia', 'farmacias'],
     ['beverages', 'bebidas', 'bebida'],
     ['gas', 'gas_agua', 'agua'],
     ['petshop', 'pets', 'pet_shop'],
     ['fruit', 'hortifrutti', 'frutas', 'verduras'],
     ['butcher', 'acougue', 'carnes'],
     ['viagem', 'izi_envios', 'mobilidade', 'corridas']
   ];

   const getPriority = (slug: string) => {
     const s = (slug || '').toLowerCase();
     for (let i = 0; i < priorityOrder.length; i++) {
       if (priorityOrder[i].includes(s)) return i;
     }
     return 999; // Fallback para categorias que não estão no destaque
   };

   // Filtra os ativos, ordena pela prioridade do usuário e pega os 9 primeiros
   const dynamicServices = establishmentTypes
     .filter((t: any) => t.is_active !== false)
     .sort((a: any, b: any) => getPriority(a.value || a.id) - getPriority(b.value || b.id))
     .slice(0, 9)
     .map((t: any) => ({
       ...t,
       action: () => handleCategoryClick(t)
     }));

   // Adiciona o botão "Ver Mais" para fechar 10 itens na grade
   const displayServices = [
     ...dynamicServices,
     { id: 'ver_mais', name: 'Ver mais', icon: 'grid_view', action: () => setIsExploreOpen(true) }
   ];

   return (
     <div className="relative h-screen bg-yellow-400 overflow-hidden">
       
       {/* 1. SEMANA DE CUPONS (HEADER FIXO NO FUNDO) */}
       <section className="bg-yellow-400 px-5 pt-10 pb-20 relative overflow-hidden">
          <div className="absolute top-4 left-4 opacity-20">
             <span className="material-symbols-rounded text-6xl text-white">shopping_bag</span>
          </div>
          <div className="absolute top-10 right-10 opacity-20">
             <span className="material-symbols-rounded text-4xl text-white">star</span>
          </div>
 
          <div className="flex flex-col items-center relative z-10">
             <div className="bg-yellow-500/30 px-6 py-2 rounded-full mb-4 border border-white/20">
                <h2 className="text-black font-black text-xl uppercase tracking-tighter italic">semana de <span className="text-2xl block -mt-1">CUPONS</span></h2>
             </div>
 
             {/* Dias de Resgate */}
             <div className="w-full bg-black/10 backdrop-blur-md rounded-3xl p-4 mb-6">
                <div className="grid grid-cols-7 gap-1">
                   {[1, 2, 3, 4, 5, 6].map(i => (
                     <div key={i} className="flex flex-col items-center gap-1 opacity-50">
                        <span className="text-[7px] font-bold text-black/60 uppercase">Dia {i}</span>
                        <div className="size-8 bg-emerald-600 rounded-lg flex flex-col items-center justify-center border border-emerald-700/30">
                           <span className="text-[6px] font-bold text-white uppercase leading-none">resgatado</span>
                           <span className="material-symbols-rounded text-white text-xs">check</span>
                        </div>
                     </div>
                   ))}
                   <div className="flex flex-col items-center gap-1 relative">
                      <span className="text-[7px] font-bold text-black uppercase">Dia 7</span>
                      <div className="w-14 h-16 bg-emerald-600 rounded-lg flex flex-col items-center justify-center border-2 border-white shadow-xl rotate-3 -mt-2">
                         <span className="text-[14px] font-black text-white leading-tight">40%</span>
                         <span className="text-[8px] font-black text-white uppercase leading-tight">OFF</span>
                         <span className="text-[6px] font-bold text-white/70 uppercase mt-1">resgatar</span>
                      </div>
                   </div>
                </div>
             </div>
 
             <motion.button 
               whileTap={{ scale: 0.95 }}
               className="bg-white text-black font-black text-lg px-12 py-3 rounded-2xl shadow-xl shadow-yellow-600/30 border-b-4 border-zinc-200 active:border-b-0 transition-all"
             >
               Pegar agora!
             </motion.button>
          </div>
       </section>

       {/* BOTTOM SHEET DESLIZANTE */}
       <motion.div 
         initial={{ y: 0 }}
         drag="y"
         dragConstraints={{ top: -300, bottom: 0 }}
         className="absolute top-[350px] inset-x-0 bottom-0 bg-white rounded-t-[48px] shadow-[0_-20px_50px_rgba(0,0,0,0.15)] z-20 flex flex-col h-[calc(100%-100px)]"
       >
          {/* Handle Bar */}
          <div className="w-full flex justify-center py-4 shrink-0">
             <div className="w-12 h-1.5 bg-zinc-200 rounded-full" />
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
             {/* 2. SERVICES GRID (DUAS LINHAS) */}
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

             {/* 3. SEARCH BAR */}
             <section className="px-5 mt-6">
                <div className="bg-zinc-50 border border-zinc-100 h-14 rounded-2xl flex items-center px-5 gap-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                   <span className="material-symbols-rounded text-zinc-400 group-hover:text-yellow-600 transition-colors">search</span>
                   <span className="text-zinc-400 font-bold text-sm">O que você quer comer hoje?</span>
                </div>
             </section>

             {/* 4. PROMO BANNERS */}
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

             {/* 5. FAMOSOS DA CIDADE */}
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

             {/* 6. CATEGORIAS ADICIONAIS */}
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

             {/* 7. MINI BANNERS */}
             <section className="mt-8 px-5 flex gap-4">
                <div className="flex-1 h-32 rounded-[32px] bg-rose-600 p-5 relative overflow-hidden shadow-lg shadow-rose-100">
                   <span className="text-white font-black text-sm leading-tight uppercase relative z-10">entrega <br /> grátis aqui</span>
                   <img src="https://cdn-icons-png.flaticon.com/512/3132/3132693.png" className="absolute -bottom-4 -right-4 size-24 opacity-20 rotate-12" alt="Burger" />
                </div>
                <div className="flex-1 h-32 rounded-[32px] bg-pink-400 p-5 relative overflow-hidden shadow-lg shadow-pink-100">
                   <span className="text-white font-black text-sm leading-tight uppercase relative z-10">cupom <br /> até <span className="text-2xl block -mt-1">R$ 30</span></span>
                   <span className="absolute -bottom-4 -right-4 material-symbols-rounded text-6xl text-white opacity-20 rotate-12">confirmation_number</span>
                </div>
             </section>

             {/* 8. FIDELIDADE CARD */}
             <section className="mt-8 px-5">
                <div className="bg-white rounded-[32px] p-6 border border-zinc-100 shadow-xl shadow-zinc-200/50">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col gap-1">
                         <h4 className="text-sm font-black text-zinc-900 leading-tight">Ganhe descontos ao fazer pedidos</h4>
                         <p className="text-xs font-bold text-zinc-400">Compre a partir de R$ 0,99</p>
                      </div>
                      <span className="material-symbols-rounded text-zinc-400">chevron_right</span>
                   </div>
                   <div className="flex items-center gap-2 mb-4">
                      <span className="material-symbols-rounded text-[16px] text-zinc-400">schedule</span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">30 dias para resgatar</span>
                   </div>
                   
                   <div className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-yellow-100 flex items-center justify-center border-2 border-white shadow-sm">
                         <span className="material-symbols-rounded text-yellow-600 text-[18px]">workspace_premium</span>
                      </div>
                      <div className="h-1.5 flex-1 bg-zinc-100 rounded-full relative">
                         <div className="absolute inset-y-0 left-0 w-1/4 bg-yellow-400 rounded-full shadow-[0_0_12px_rgba(255,215,9,0.6)]" />
                      </div>
                      <div className="size-8 rounded-full bg-zinc-50 flex items-center justify-center border-2 border-white shadow-sm">
                         <span className="material-symbols-rounded text-zinc-300 text-[18px]">lock</span>
                      </div>
                   </div>
                </div>
             </section>

             {/* 9. FILTROS & LISTA FINAL */}
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
       />
     </div>
   );
};
