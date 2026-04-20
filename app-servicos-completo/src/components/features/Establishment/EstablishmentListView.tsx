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
       let queryTitle = title;
       if (title === "Farmácias" || title === "Todas as Farmácias") queryTitle = "Farmácia";
       else if (title.includes("Pet Shop")) queryTitle = "Pet Shop";
       else if (title.includes("Gás") || title.includes("Agua") || title.includes("Água")) queryTitle = "Gás e Água";
       else if (title === "Corte Prime" || title.includes("Açougue")) queryTitle = "Carnes";
       else if (title.includes("Padaria")) queryTitle = "Padaria";
       else if (title.includes("Hortifruti")) queryTitle = "Hortifruti";

       const { data, error } = await supabase
          .from('promotions_delivery')
          .select('image_url')
          .eq('type', 'explore')
          .ilike('title', `%${queryTitle}%`)
          .limit(1);
          
       if (data && data.length > 0 && data[0].image_url) {
          setBgImage(data[0].image_url);
       }
    };
    fetchExploreImage();
  }, [title]);

  return (
    <div 
      ref={scrollContainerRef}
      className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10"
    >
      <header className="fixed top-4 inset-x-4 z-50 flex flex-col bg-black/60 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[20px_20px_40px_rgba(0,0,0,0.6),inset_8px_8px_16px_rgba(255,255,255,0.02),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSubView(backView)} 
              className="size-11 rounded-[20px] bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-95 transition-all shadow-[6px_6px_12px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03)]"
            >
              <span className="material-symbols-outlined text-white text-xl">chevron_left</span>
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-base font-black tracking-tighter text-white leading-none uppercase italic drop-shadow-md">{title}</h1>
              {subtitle && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-2 leading-none flex items-center gap-1.5 ring-yellow-400/20">
                <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
                {subtitle}
              </p>}
            </div>
          </div>
          <button 
            onClick={() => cartLength > 0 && navigateSubView("cart")} 
            className="relative size-11 rounded-[20px] bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-95 transition-all group shadow-[6px_6px_12px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03)]"
          >
            <span className="material-symbols-outlined text-zinc-100 text-xl group-hover:text-yellow-400">shopping_bag</span>
            {cartLength > 0 && <span className="absolute -top-1 -right-1 size-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black shadow-lg">{cartLength}</span>}
          </button>
        </div>
        <div className="px-6 pb-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none z-10">
              <span className="material-symbols-outlined text-zinc-500 text-lg group-focus-within:text-yellow-400 transition-colors">search</span>
            </div>
            <input
              className="w-full h-12 bg-zinc-900 shadow-[10px_10px_20px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] border border-white/5 rounded-[22px] pl-14 pr-4 text-white placeholder:text-zinc-700 focus:outline-none transition-all text-xs font-black"
              placeholder="O que você procura?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      <div className="pt-40" />


      <main className="px-5 flex flex-col gap-6">
        {icon && (
          <section>
            <div className="relative h-40 rounded-[32px] overflow-hidden mb-6 shadow-2xl border border-white/5 bg-zinc-900 group">
               {bgImage ? (
                  <img src={bgImage} alt={title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-[3s]" />
               ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                     <span className="material-symbols-outlined text-[80px] text-white/5">{icon}</span>
                  </div>
               )}
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4 pb-10">
          {establishments.filter(filterFn).filter(shop => shop.name.toLowerCase().includes(searchQuery.toLowerCase())).map((shop, i) => (
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
