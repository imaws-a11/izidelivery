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
      <header className="sticky top-0 z-50 px-5 pt-5 pb-4"
        style={{ background: "linear-gradient(to bottom, #000000 70%, transparent)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView(backView)} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white leading-none">{title}</h1>
              {subtitle && <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button onClick={() => cartLength > 0 && navigateSubView("cart")} className="relative size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">shopping_bag</span>
            {cartLength > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cartLength}</span>}
          </button>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 text-xl">search</span>
          </div>
          <input
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-3.5 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium"
            placeholder="Buscar..."
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
              <div className="relative h-44 rounded-2xl overflow-hidden mb-3">
                <img src={shop.img} alt={shop.name} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10">
                  <span className="material-symbols-outlined text-[14px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-xs font-black text-white">{shop.rating}</span>
                </div>
                {shop.freeDelivery && (
                  <div className="absolute bottom-3 left-3 z-10">
                     <span className="bg-yellow-400 text-black text-[9px] font-black px-3 py-1.5 rounded-full shadow-xl flex items-center gap-1.5 border border-black/10">
                        <span className="material-symbols-outlined text-[12px]">local_shipping</span>
                        FRETE GRÁTIS
                     </span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h4 className="font-black text-white text-base tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                  <div className="flex items-center gap-3 mt-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">schedule</span>{shop.time}</span>
                    <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[13px]">local_fire_department</span>{shop.tag}</span>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 group-hover:bg-yellow-400 group-hover:border-yellow-400 flex items-center justify-center transition-all duration-300">
                  <span className="material-symbols-outlined text-lg text-zinc-400 group-hover:text-black transition-colors">arrow_forward</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};
