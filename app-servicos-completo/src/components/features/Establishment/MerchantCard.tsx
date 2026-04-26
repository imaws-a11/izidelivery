import { motion } from "framer-motion";
import type { Establishment } from "../../../types";

interface MerchantCardProps {
  shop: Establishment;
  onClick: (shop: Establishment) => void;
  index: number;
}

export const MerchantCard = ({ shop, onClick, index }: MerchantCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick(shop)}
      className="relative group bg-zinc-900 border border-white/5 rounded-[32px] p-4 flex gap-4 active:scale-95 transition-all shadow-[12px_12px_24px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] overflow-hidden"
    >
      {/* Background Glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Image Container */}
      <div className="relative size-24 rounded-2xl overflow-hidden shrink-0 shadow-lg border border-white/5">
        <img 
          src={shop.img || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"} 
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {!shop.isOpen && (
           <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center">
              <span className="text-[8px] font-black text-white uppercase tracking-widest text-center px-2">Fechado</span>
           </div>
        )}
        {(shop as any).hasPromotions && (
           <div className="absolute top-1 right-1 bg-yellow-400 text-black text-[7px] font-black px-1.5 py-0.5 rounded-lg shadow-lg uppercase tracking-tighter z-20">
              Ofertas
           </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase italic tracking-tight group-hover:text-primary transition-colors">{shop.name}</h3>
            <div className="flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5">
               <span className="material-symbols-outlined text-[10px] text-yellow-400 fill-1">star</span>
               <span className="text-[10px] font-black text-white">{shop.rating || "Novo"}</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest line-clamp-1">{shop.store_type || "Restaurante"}</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-primary">timer</span>
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tight">{shop.estimated_time || "30-40 min"}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-primary">delivery_dining</span>
            <span className="text-[9px] font-black text-zinc-300 uppercase tracking-tight">
               {shop.service_fee === 0 ? "Grátis" : `R$ ${shop.service_fee?.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
      
      {/* Selection Indicator */}
      <div className="absolute top-4 right-4 translate-x-12 group-hover:translate-x-0 transition-transform duration-300">
         <div className="size-8 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-slate-900 text-sm font-black">arrow_forward</span>
         </div>
      </div>
    </motion.div>
  );
};
