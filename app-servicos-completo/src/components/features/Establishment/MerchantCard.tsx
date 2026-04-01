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
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onClick(shop)}
      className="group bg-zinc-900/40 hover:bg-zinc-800/60 p-2.5 rounded-[22px] border border-white/5 active:scale-[0.98] transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden"
    >
      {/* Background Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Thumbnail */}
      <div className="relative size-20 rounded-[18px] overflow-hidden shrink-0 shadow-lg border border-white/5">
        <img 
          src={shop.img} 
          alt={shop.name} 
          className="size-full object-cover group-hover:scale-110 transition-transform duration-1000" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Rating overlay on mobile or status? No, let's keep it in the info section for detail. */}
      </div>
      
      <div className="flex-1 min-w-0 pr-2 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <h4 className="font-black text-white text-[13px] tracking-tight group-hover:text-yellow-400 transition-colors uppercase truncate">
            {shop.name}
          </h4>
          <div className="flex items-center gap-1 bg-yellow-400/10 px-1.5 py-0.5 rounded-lg shrink-0 border border-yellow-400/10">
            <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[9px] font-black text-yellow-400">{shop.rating || "5.0"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-3">
          <span className="truncate">{shop.tag || shop.type || "Loja"}</span>
          <span className="size-0.5 rounded-full bg-zinc-800 shrink-0" />
          <div className="flex items-center gap-1 text-zinc-400">
            <span className="material-symbols-outlined text-[10px]">schedule</span>
            <span>{shop.time}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/5">
            <span className="material-symbols-outlined text-[12px] text-zinc-400">local_shipping</span>
            <span className={`text-[9px] font-black italic ${shop.freeDelivery ? 'text-emerald-400' : 'text-zinc-500'}`}>
              {shop.freeDelivery ? "GRÁTIS" : `R$ ${Number((shop as any).service_fee || 5.9).toFixed(2).replace('.', ',')}`}
            </span>
          </div>
          
          {/* Subtle info about distance if available could go here */}
        </div>
      </div>
      
      {/* Action Arrow */}
      <div className="size-8 rounded-full bg-black/40 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:border-yellow-400 transition-all duration-500 shadow-xl">
        <span className="material-symbols-outlined text-[14px] text-zinc-600 group-hover:text-black">arrow_forward_ios</span>
      </div>
    </motion.div>
  );
};
