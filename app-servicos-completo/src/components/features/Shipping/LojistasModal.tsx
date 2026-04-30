import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../ui/Icon";

export const LojistasModal = () => {
  const { 
    showLojistasModal, 
    setShowLojistasModal, 
    ESTABLISHMENTS, 
    transitData, 
    setTransitData,
    calculateDistancePrices 
  } = useApp();

  if (!showLojistasModal) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={() => setShowLojistasModal(false)}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-[450px] bg-zinc-900 border border-white/10 rounded-[45px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        <header className="p-8 border-b border-white/5 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black text-white tracking-tighter mb-1">Lojas Parceiras</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Selecione para retirar</p>
           </div>
           <button 
             onClick={() => setShowLojistasModal(false)}
             className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
           >
             <Icon name="close" />
           </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {ESTABLISHMENTS.filter(e => e.is_partner).map((shop) => (
            <motion.div
              key={shop.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setTransitData({
                  ...transitData,
                  receiverName: shop.name,
                  receiverPhone: shop.phone || "",
                  origin: shop.address || ""
                });
                if (shop.address && transitData.destination) {
                  calculateDistancePrices(shop.address, transitData.destination);
                }
                setShowLojistasModal(false);
              }}
              className="bg-zinc-800/50 p-6 rounded-[32px] border border-white/5 hover:border-yellow-400/30 transition-all cursor-pointer flex items-center gap-5 group"
            >
              <div className="size-14 rounded-2xl bg-black/40 overflow-hidden border border-white/5 flex items-center justify-center shrink-0">
                {shop.image ? (
                  <img src={shop.image} alt={shop.name} className="size-full object-cover" />
                ) : (
                  <Icon name="store" className="text-zinc-600" />
                )}
              </div>
              <div className="flex-1">
                <h4 className="text-base font-black text-white tracking-tight group-hover:text-yellow-400 transition-colors">{shop.name}</h4>
                <p className="text-[11px] text-zinc-500 font-bold line-clamp-1 mt-0.5">{shop.address}</p>
              </div>
              <Icon name="chevron_right" className="text-zinc-600 group-hover:text-yellow-400 transition-colors" />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
