import { motion } from "framer-motion";
import type { Establishment } from "../../../types";
import { useState } from "react";

interface MerchantCardProps {
  shop: Establishment;
  onClick: (shop: Establishment) => void;
  index: number;
}

export const MerchantCard = ({ shop, onClick, index }: MerchantCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onClick(shop)}
      className="w-full bg-white px-5 py-4 flex items-center gap-4 active:bg-zinc-50 transition-all cursor-pointer group border-b border-zinc-50"
    >
      {/* Merchant Logo */}
      <div className="relative size-16 rounded-2xl overflow-hidden shrink-0 border border-zinc-100 shadow-sm">
        <img 
          src={shop.img || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop"} 
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {!shop.isOpen && (
           <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="text-[9px] font-black text-white uppercase tracking-tighter">Fechado</span>
           </div>
        )}
      </div>

      {/* Info Content */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <h3 className="text-[15px] font-black text-zinc-900 truncate tracking-tight">{shop.name}</h3>
        
        <div className="flex items-center gap-1.5 mt-0.5">
          {/* Rating */}
          <div className="flex items-center gap-0.5">
             <span className="material-symbols-rounded text-[14px] text-yellow-500 fill-1">star</span>
             <span className="text-[13px] font-black text-yellow-500">{shop.rating || "4.8"}</span>
          </div>
          
          <span className="text-zinc-300 text-[10px]">•</span>
          
          {/* Time */}
          <span className="text-[13px] font-bold text-zinc-500 truncate">
             {shop.estimated_time || "45-55 min"}
          </span>
          
          <span className="text-zinc-300 text-[10px]">•</span>
          
          {/* Fee */}
          <span className="text-[13px] font-bold text-zinc-500">
             {shop.service_fee === 0 ? "Grátis" : `R$ ${shop.service_fee?.toFixed(2).replace('.', ',')}`}
          </span>
        </div>
      </div>

      {/* Favorite Heart (Yellow per user request) */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsFavorite(!isFavorite);
        }}
        className="size-10 flex items-center justify-center text-zinc-300 hover:text-yellow-400 transition-colors"
      >
        <span className={`material-symbols-rounded text-[22px] ${isFavorite ? 'text-yellow-400 fill-1' : ''}`}>
          favorite
        </span>
      </button>
    </motion.div>
  );
};
