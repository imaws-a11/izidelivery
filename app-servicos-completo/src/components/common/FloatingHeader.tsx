import React from 'react';
import { motion } from "framer-motion";
import { Icon } from "./Icon";

interface FloatingHeaderProps {
  userAddress: string;
  cartLength: number;
  onAddressClick: () => void;
  onCartClick: () => void;
  onNotificationsClick: () => void;
  hasUnreadNotifications?: boolean;
}

export const FloatingHeader: React.FC<FloatingHeaderProps> = ({
  userAddress,
  cartLength,
  onAddressClick,
  onCartClick,
  onNotificationsClick,
  hasUnreadNotifications
}) => {
  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed top-0 inset-x-0 z-[200] px-4 pt-4 pointer-events-none"
    >
      <div className="flex items-center justify-between gap-3 pointer-events-auto max-w-lg mx-auto">
        
        {/* Notificações */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onNotificationsClick}
          className="size-12 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white relative shadow-2xl active:bg-white/10 transition-colors"
        >
          <Icon name="notifications" />
          {hasUnreadNotifications && (
            <span className="absolute top-3.5 right-3.5 size-2 bg-yellow-400 rounded-full border border-black" />
          )}
        </motion.button>

        {/* Seletor de Endereço */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={onAddressClick}
          className="flex-1 h-12 rounded-2xl bg-black/20 backdrop-blur-xl border border-white/10 flex items-center px-4 gap-3 shadow-2xl cursor-pointer active:bg-white/10 transition-colors overflow-hidden"
        >
          <div className="size-8 rounded-xl bg-yellow-400/10 flex items-center justify-center shrink-0">
            <Icon name="location_on" className="text-yellow-400 !text-lg" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] leading-none mb-0.5">Entregar em</span>
            <span className="text-[11px] font-black text-white truncate tracking-tight">{userAddress || "Definir endereço..."}</span>
          </div>
          <Icon name="expand_more" className="text-white/20 ml-auto shrink-0 !text-lg" />
        </motion.div>

        {/* Carrinho / Sacola */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onCartClick}
          className="size-12 rounded-2xl bg-yellow-400 flex items-center justify-center text-black relative shadow-2xl active:bg-yellow-500 transition-colors"
        >
          <Icon name="shopping_bag" />
          {cartLength > 0 && (
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-black text-white size-5 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-yellow-400"
            >
              {cartLength}
            </motion.div>
          )}
        </motion.button>

      </div>
    </motion.div>
  );
};
