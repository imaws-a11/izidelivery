import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabase";

import type { Establishment } from "../../../types";
import { MerchantCard } from "./MerchantCard";

interface EstablishmentListViewProps {
  title: string;
  subtitle?: string;
  icon?: string;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setSubView: (view: any) => void;
  establishments: Establishment[];
  filterFn: (shop: Establishment) => boolean;
  onShopClick: (shop: any) => void;
  cartLength: number;
  navigateSubView: (view: any) => void;
  backView?: any;
}

export const EstablishmentListView = ({
  title,
  subtitle,
  icon,
  searchQuery,
  setSearchQuery,
  setSubView,
  establishments,
  filterFn,
  onShopClick,
  cartLength,
  navigateSubView,
  backView = "none"
}: EstablishmentListViewProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [bgImage, setBgImage] = useState<string | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);

    const fetchExploreImage = async () => {
       try {
         let queryTitle = title || "";
         if (title === "Farmácias" || title === "Todas as Farmácias") queryTitle = "Farmácia";
         else if (title.includes("Pet Shop")) queryTitle = "Pet Shop";
         else if (title.includes("Gás") || title.includes("Agua") || title.includes("Água")) queryTitle = "Gás e Água";
         else if (title === "Corte Prime" || title.includes("Açougue")) queryTitle = "Carnes";
         else if (title.includes("Padaria")) queryTitle = "Padaria";
         else if (title.includes("Hortifruti")) queryTitle = "Hortifruti";

         if (!queryTitle) return;

         const { data, error } = await supabase
            .from('promotions_delivery')
            .select('image_url')
            .eq('type', 'explore')
            .ilike('title', `%${queryTitle}%`)
            .limit(1);
            
         if (!error && data && data.length > 0 && data[0].image_url) {
            setBgImage(data[0].image_url);
         }
       } catch (err) {
         console.error("Erro ao buscar imagem de exploração:", err);
       }
    };
    fetchExploreImage();
  }, [title]);

  return (
    <div 
      ref={scrollContainerRef}
      className="absolute inset-0 z-[120] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-32"
    >
      {/* HEADER PREMIUM - SEM FUNDO ITALICO */}
      <header className="sticky top-0 z-[150] bg-white/80 backdrop-blur-md px-6 py-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-rounded text-zinc-900 text-xl">arrow_back_ios_new</span>
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-black tracking-tighter text-zinc-900 leading-none uppercase">{title}</h1>
              {subtitle && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-600 mt-2 leading-none flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
                {subtitle}
              </p>}
            </div>
          </div>
          <button 
            onClick={() => cartLength > 0 && navigateSubView("cart")} 
            className="relative size-12 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-95 transition-all group shadow-xl"
          >
            <span className="material-symbols-rounded text-yellow-400 text-2xl">shopping_bag</span>
            {cartLength > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white shadow-lg">{cartLength}</span>}
          </button>
        </div>
        
        <div className="relative group mt-2">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
            <span className="material-symbols-rounded text-zinc-400 text-lg group-focus-within:text-yellow-600 transition-colors">search</span>
          </div>
          <input
            className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-[20px] pl-14 pr-6 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all text-xs font-black uppercase tracking-tighter"
            placeholder="O que você procura?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      <main className="px-6 flex flex-col gap-8 pt-4">
        {icon && (
          <section>
            <div className="relative h-48 rounded-[40px] overflow-hidden shadow-2xl shadow-zinc-200 border border-zinc-100 bg-zinc-50 group">
               {bgImage ? (
                  <img src={bgImage} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3s]" />
               ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white flex items-center justify-center">
                     <span className="material-symbols-rounded text-[80px] text-zinc-200">{icon}</span>
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent flex flex-col justify-end p-8">
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{title}</h2>
               </div>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between px-1">
             <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Sugestões Próximas</h3>
             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                {establishments.filter(filterFn).length} Lojas
             </span>
          </div>

          {(establishments || [])
            .filter(filterFn || (() => true))
            .filter(shop => (shop.name || "").toLowerCase().includes((searchQuery || "").toLowerCase()))
            .map((shop, i) => (
            <MerchantCard 
              key={shop.id || i}
              shop={shop}
              onClick={() => onShopClick(shop)}
              index={i}
            />
          ))}
        </div>
      </main>
    </div>
  );
};
