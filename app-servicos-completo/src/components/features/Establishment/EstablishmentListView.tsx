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
      <header className="sticky top-0 z-50 px-5 py-3 bg-black/40 backdrop-blur-2xl border-b border-white/5 transition-all">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSubView(backView)} className="size-10 rounded-full bg-zinc-900/50 border border-white/10 flex items-center justify-center active:scale-95 transition-all">
              <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
            </button>
            <div className="flex flex-col justify-center">
              <h1 className="text-lg font-black tracking-tight text-white leading-none">{title}</h1>
              {subtitle && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-1 leading-none">{subtitle}</p>}
            </div>
          </div>
          <button onClick={() => cartLength > 0 && navigateSubView("cart")} className="relative size-10 rounded-full bg-zinc-900/50 border border-white/10 flex items-center justify-center active:scale-95 transition-all group">
            <span className="material-symbols-outlined text-zinc-100 text-xl group-hover:text-yellow-400">shopping_bag</span>
            {cartLength > 0 && <span className="absolute -top-1 -right-1 size-4.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black animate-in fade-in zoom-in duration-300">{cartLength}</span>}
          </button>
        </div>
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 text-lg group-focus-within:text-yellow-400 transition-colors">search</span>
          </div>
          <input
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-11 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/20 text-xs font-medium transition-all"
            placeholder="O que você procura?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </header>


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
