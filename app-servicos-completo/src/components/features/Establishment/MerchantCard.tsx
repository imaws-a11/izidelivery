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
      whileHover={shop.isOpen ? { y: -6, scale: 1.02 } : {}}
      whileTap={shop.isOpen ? { scale: 0.97 } : {}}
      transition={{ 
        delay: index * 0.04,
        type: "spring",
        stiffness: 400,
        damping: 30
      }}
      onClick={() => shop.isOpen && onClick(shop)}
      className={`group bg-zinc-800 p-4 rounded-[42px] shadow-[20px_20px_40px_rgba(0,0,0,0.5),-10px_-10px_30px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(255,255,255,0.03),inset_-8px_-8px_16px_rgba(0,0,0,0.4)] transition-all flex items-center gap-4 cursor-pointer relative overflow-hidden mb-4 ${!shop.isOpen ? 'opacity-60 grayscale' : ''}`}
    >
      {/* Glossy Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      {/* Thumbnail */}
      <div className="relative size-20 rounded-[30px] overflow-hidden shrink-0 shadow-[8px_8px_16px_rgba(0,0,0,0.6),inset_4px_4px_8px_rgba(255,255,255,0.1)] border border-white/5">
        <motion.img 
          src={shop.img} 
          alt={shop.name} 
          className="size-full object-cover"
          whileHover={shop.isOpen ? { scale: 1.15 } : {}}
          transition={{ duration: 0.8 }}
        />
        {!shop.isOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px]">
            <span className="text-[9px] font-black text-white uppercase tracking-tighter">OFFLINE</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex flex-col min-w-0">
             <h4 className="font-black text-white text-[16px] tracking-tighter group-hover:text-yellow-400 transition-colors uppercase truncate leading-none">
              {shop.name}
            </h4>
            <div className={`mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full border w-fit shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05)] ${shop.isOpen ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-rose-500/10 border-rose-500/20 text-rose-500'}`}>
               <div className={`size-1.5 rounded-full ${shop.isOpen ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500'} animate-pulse`} />
               <span className="text-[9px] font-black uppercase tracking-widest">{shop.isOpen ? 'Aberto Agora' : 'Fechado'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-2xl shrink-0 shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03),inset_-2px_-2px_4px_rgba(0,0,0,0.4)] border border-white/5">
            <span className="material-symbols-outlined text-[12px] text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="text-[11px] font-black text-white">{shop.rating || "5.0"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.div 
            className={`flex items-center justify-center px-4 py-2 rounded-2xl ${shop.isOpen ? 'bg-yellow-400' : 'bg-zinc-700'} shadow-[6px_6px_12px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.5),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] transition-all`}
          >
            <span className={`text-[10px] font-black ${shop.isOpen ? 'text-black' : 'text-zinc-400'} uppercase tracking-tight italic`}>
              {shop.time}
            </span>
          </motion.div>
          <div className="flex flex-col">
            {(shop.freeDelivery || shop.free_delivery) ? (
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.2em] leading-none mb-1 animate-pulse drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">Frete Grátis</span>
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] leading-none italic">Entrega Izi</span>
              </div>
            ) : (
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-1 italic">Preparo &</span>
                <span className="text-[8px] font-black text-yellow-400/60 uppercase tracking-[0.2em] leading-none italic">Entrega Izi</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Frete Grátis Tag Flutuante (Premium Amarela) */}
      {(shop.freeDelivery || shop.free_delivery) && (
        <div className="absolute top-0 right-14 bg-yellow-400 text-black text-[8px] font-black px-4 py-1.5 rounded-b-[18px] uppercase tracking-widest shadow-[0_8px_20px_rgba(251,191,36,0.4),inset_2px_2px_4px_rgba(255,255,255,0.5)] border-x border-b border-black/10 z-20">
          FREE
        </div>
      )}
      
      {/* Action Arrow Button */}
      <div className={`size-12 rounded-[22px] bg-zinc-900 shadow-[6px_6px_12px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.02),inset_-2px_-2px_4px_rgba(0,0,0,0.5)] flex items-center justify-center shrink-0 ${shop.isOpen ? 'group-hover:bg-yellow-400 group-hover:shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'opacity-30'} transition-all duration-500`}>
        <span className={`material-symbols-outlined text-[20px] ${shop.isOpen ? 'text-zinc-600 group-hover:text-black' : 'text-zinc-700'} font-black`}>chevron_right</span>
      </div>
    </motion.div>
  );
};
