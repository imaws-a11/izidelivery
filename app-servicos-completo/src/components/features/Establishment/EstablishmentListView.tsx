import { motion } from "framer-motion";

import type { Establishment } from "../../../types";

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
  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
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
            <div className="relative h-36 rounded-2xl overflow-hidden mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center">
                <span className="material-symbols-outlined text-[100px] text-yellow-400/10">{icon}</span>
              </div>
              <div className="absolute inset-0 flex flex-col justify-center p-5">
                <span className="bg-yellow-400 text-black font-extrabold text-[10px] px-2 py-0.5 rounded w-fit mb-2 uppercase tracking-wider">Disponível agora</span>
                <h2 className="text-lg font-extrabold text-white leading-tight">{title} premium<br/>na sua porta</h2>
              </div>
            </div>
          </section>
        )}

        <div className="flex flex-col gap-4 pb-10">
          {establishments.filter(filterFn).filter(shop => shop.name.toLowerCase().includes(searchQuery.toLowerCase())).map((shop, i) => (
            <motion.div key={shop.id || i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => onShopClick(shop)}
              className="group cursor-pointer active:scale-[0.98] transition-all">
              <div className="relative h-32 rounded-xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full flex items-center gap-1 border border-white/10">
                  <span className="material-symbols-outlined text-[12px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[10px] font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && (
                  <div className="absolute bottom-2.5 left-2.5 z-10">
                     <span className="bg-yellow-400 text-black text-[9px] font-black px-2.5 py-1 rounded-full shadow-xl flex items-center gap-1 border border-black/10">
                        <span className="material-symbols-outlined text-[11px]">local_shipping</span>
                        FRETE GRÁTIS
                     </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-sm tracking-tight group-hover:text-yellow-400 transition-colors uppercase">{shop.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">schedule</span>{shop.time}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[11px]">local_fire_department</span>{shop.tag}</span>
                  </div>
                </div>
                <div className="size-8 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-base text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};
