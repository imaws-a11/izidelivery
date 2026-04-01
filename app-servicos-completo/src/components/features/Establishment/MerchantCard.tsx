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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ 
        delay: index * 0.04,
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      onClick={() => onClick(shop)}
      className="group bg-white/[0.03] backdrop-blur-2xl p-3 rounded-[32px] border border-white/[0.05] transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden"
    >
      {/* Glossy Overlay Effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Thumbnail */}
      <div className="relative size-20 rounded-[24px] overflow-hidden shrink-0 shadow-2xl border border-white/10">
        <motion.img 
          src={shop.img} 
          alt={shop.name} 
          className="size-full object-cover"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.8 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="font-black text-white text-[14px] tracking-tight group-hover:text-yellow-400 transition-colors uppercase truncate leading-none">
            {shop.name}
          </h4>
          <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-xl shrink-0 border border-yellow-400/20">
            <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[10px] font-bold text-yellow-400">{shop.rating || "5.0"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="flex items-center justify-center px-4 py-1.5 rounded-2xl bg-yellow-400 shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-all"
          >
            <span className="text-[11px] font-black text-black uppercase tracking-tight italic">
              {shop.time}
            </span>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] leading-none mb-1">Tempo de</span>
            <span className="text-[8px] font-black text-yellow-400/80 uppercase tracking-[0.2em] leading-none">Preparo & Entrega</span>
          </div>
        </div>
      </div>
      
      {/* Action Arrow */}
      <div className="size-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:border-yellow-400 group-hover:scale-110 transition-all duration-500 shadow-2xl">
        <span className="material-symbols-outlined text-[16px] text-white/20 group-hover:text-black font-black">arrow_forward_ios</span>
      </div>
    </motion.div>
  );
};
