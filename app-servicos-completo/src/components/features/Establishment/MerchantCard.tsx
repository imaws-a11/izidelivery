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
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ 
        delay: index * 0.04,
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      onClick={() => onClick(shop)}
      className="group bg-zinc-800 p-4 rounded-[35px] shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden mb-2"
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Thumbnail */}
      <div className="relative size-20 rounded-[28px] overflow-hidden shrink-0 shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.1)] border border-white/5">
        <motion.img 
          src={shop.img} 
          alt={shop.name} 
          className="size-full object-cover"
          whileHover={{ scale: 1.15 }}
          transition={{ duration: 0.8 }}
        />
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <h4 className="font-black text-white text-[15px] tracking-tight group-hover:text-yellow-400 transition-colors uppercase truncate leading-none">
            {shop.name}
          </h4>
          <div className="flex items-center gap-1 bg-zinc-900/50 px-2.5 py-1 rounded-xl shrink-0 shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.3)]">
            <span className="material-symbols-outlined text-[10px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[10px] font-black text-white">{shop.rating || "5.0"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div 
            className="flex items-center justify-center px-4 py-2 rounded-2xl bg-yellow-400 shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] transition-all"
          >
            <span className="text-[10px] font-black text-black uppercase tracking-tight italic">
              {shop.time}
            </span>
          </motion.div>
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1">Preparo &</span>
            <span className="text-[7px] font-black text-yellow-400/60 uppercase tracking-[0.2em] leading-none">Entrega Izi</span>
          </div>
        </div>
      </div>
      
      {/* Action Arrow Button */}
      <div className="size-11 rounded-2xl bg-zinc-900 shadow-[4px_4px_8px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.02),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0 group-hover:bg-yellow-400 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all duration-500">
        <span className="material-symbols-outlined text-[18px] text-zinc-600 group-hover:text-black font-black">arrow_forward_ios</span>
      </div>
    </motion.div>
  );
};
