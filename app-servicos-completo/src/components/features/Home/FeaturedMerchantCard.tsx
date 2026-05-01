import React from 'react';
import { motion } from "framer-motion";

interface FeaturedMerchantCardProps {
  shop: any;
  onClick: () => void;
}

export const FeaturedMerchantCard: React.FC<FeaturedMerchantCardProps> = ({ shop, onClick }) => {
  return (
    <motion.div 
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="shrink-0 w-40 bg-zinc-50 rounded-[32px] p-4 flex flex-col items-center gap-3 border border-zinc-100 shadow-sm cursor-pointer"
    >
       <div className="size-20 rounded-full bg-white shadow-md flex items-center justify-center overflow-hidden border-4 border-white">
          <img 
            src={shop.logo || shop.img || "https://cdn-icons-png.flaticon.com/512/3132/3132693.png"} 
            className="size-full object-contain" 
            alt={shop.name} 
          />
       </div>
       <div className="flex flex-col items-center text-center gap-0.5">
          <span className="text-sm font-black text-zinc-900 truncate w-full">{shop.name}</span>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
            {shop.isOpen ? "Disponível" : "Indisponível"}
          </span>
       </div>
    </motion.div>
  );
};
