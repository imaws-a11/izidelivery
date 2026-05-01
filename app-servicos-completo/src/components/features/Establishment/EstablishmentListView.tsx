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
      className="absolute inset-0 z-[120] bg-zinc-50 text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-10"
    >
      <header className="fixed top-4 inset-x-4 z-[150] flex flex-col bg-white/90 backdrop-blur-xl border border-zinc-100 rounded-[32px] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="size-11 rounded-[20px] bg-white border border-zinc-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
            >
              <span className="material-symbols-rounded text-zinc-900 text-xl">arrow_back</span>
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-base font-black tracking-tighter text-zinc-900 leading-none uppercase italic">{title}</h1>
              {subtitle && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-600 mt-2 leading-none flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
                {subtitle}
              </p>}
            </div>
          </div>
          <button 
            onClick={() => cartLength > 0 && navigateSubView("cart")} 
            className="relative size-11 rounded-[20px] bg-white border border-zinc-100 flex items-center justify-center active:scale-95 transition-all group shadow-sm"
          >
            <span className="material-symbols-rounded text-zinc-900 text-xl group-hover:text-yellow-600">shopping_bag</span>
            {cartLength > 0 && <span className="absolute -top-1 -right-1 size-4.5 bg-zinc-900 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">{cartLength}</span>}
          </button>
        </div>
        <div className="px-6 pb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
              <span className="material-symbols-rounded text-zinc-400 text-lg group-focus-within:text-yellow-600 transition-colors">search</span>
            </div>
            <input
              className="w-full h-12 bg-zinc-50 border border-zinc-100 rounded-[22px] pl-14 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/20 transition-all text-xs font-bold"
              placeholder="O que você procura?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="pt-44" />

      <main className="px-5 flex flex-col gap-6">
        {icon && (
          <section>
            <div className="relative h-40 rounded-[32px] overflow-hidden mb-6 shadow-sm border border-zinc-100 bg-white group">
               {bgImage ? (
                  <img src={bgImage} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" />
               ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white flex items-center justify-center">
                     <span className="material-symbols-rounded text-[80px] text-zinc-100">{icon}</span>
                  </div>
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4 pb-10">
          {(establishments || []).filter(filterFn || (() => true)).filter(shop => shop.name && shop.name.toLowerCase().includes((searchQuery || "").toLowerCase())).map((shop, i) => (
            <MerchantCard 
              key={shop.id || i}
              shop={shop}
              onClick={onShopClick}
              index={i}
            />
          ))}
        </div>
      </main>
    </div>

  );
};
