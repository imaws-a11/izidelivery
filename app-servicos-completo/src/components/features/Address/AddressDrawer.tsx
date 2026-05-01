import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useAddress } from "../../../hooks/useAddress";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

interface AddressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddressDrawer: React.FC<AddressDrawerProps> = ({ isOpen, onClose }) => {
  const { savedAddresses, handleSetActiveAddress } = useAddress();
  const { setSubView } = useApp();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Imersivo */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[300] backdrop-blur-md"
          />

          {/* Drawer Lateral (Direita para Esquerda) - Ocupando Metade da Tela */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-[85%] sm:w-[50%] bg-white z-[301] shadow-2xl flex flex-col rounded-l-[40px] overflow-hidden border-l border-zinc-100"
          >
             {/* Header Estilo Ver Mais - Barra sem fundo */}
             <div className="p-10 pb-6 flex items-start justify-between bg-transparent">
                <div className="flex flex-col">
                   <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-[0.9] italic uppercase">
                      Meus <br /> <span className="text-yellow-500">Endereços</span>
                   </h2>
                   <div className="flex items-center gap-2 mt-4">
                      <div className="size-2 rounded-full bg-yellow-400 animate-ping" />
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Onde entregamos?</p>
                   </div>
                </div>
                <button 
                  onClick={() => { setSubView("addresses"); onClose(); }}
                  className="size-14 rounded-[24px] bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 active:scale-90 transition-all hover:bg-yellow-400 hover:text-black hover:border-yellow-400 shadow-sm"
                >
                   <Icon name="settings" className="!text-xl" />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto no-scrollbar px-10 pb-12 space-y-6">
                <div className="h-px w-full bg-gradient-to-r from-zinc-100 to-transparent mb-2" />
                
                {savedAddresses.length === 0 ? (
                  <div className="py-20 flex flex-col items-center text-center gap-6">
                    <div className="size-20 rounded-[30px] bg-zinc-50 flex items-center justify-center text-zinc-200 border border-zinc-100">
                      <Icon name="location_off" className="!text-4xl" />
                    </div>
                    <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.3em] max-w-[150px]">Nenhum local salvo para entrega</p>
                  </div>
                ) : savedAddresses.map((addr: any) => (
                   <motion.div
                     key={addr.id}
                     whileTap={{ scale: 0.96 }}
                     onClick={() => {
                        handleSetActiveAddress(addr.id);
                        onClose();
                     }}
                     className={`p-6 rounded-[35px] border transition-all cursor-pointer flex items-center gap-5 group relative overflow-hidden ${
                       addr.active 
                       ? 'bg-zinc-950 border-zinc-900 text-white shadow-2xl shadow-zinc-200' 
                       : 'bg-zinc-50/50 border-zinc-100/80 hover:bg-zinc-100 text-zinc-900'
                     }`}
                   >
                      {addr.active && (
                        <div className="absolute top-0 right-0 p-3">
                           <div className="size-2 bg-yellow-400 rounded-full shadow-[0_0_10px_#facc15]" />
                        </div>
                      )}
                      
                      <div className={`size-14 rounded-[22px] flex items-center justify-center shrink-0 transition-all duration-500 ${
                        addr.active ? 'bg-yellow-400 text-black rotate-6' : 'bg-white shadow-sm text-zinc-400 group-hover:bg-yellow-50 group-hover:text-yellow-600'
                      }`}>
                         <Icon name={addr.label?.toLowerCase().includes("casa") ? "home" : addr.label?.toLowerCase().includes("trabalho") ? "work" : "location_on"} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2">
                            <span className={`text-sm font-black uppercase tracking-tight truncate ${addr.active ? 'text-white' : 'text-zinc-900'}`}>
                               {addr.label}
                            </span>
                         </div>
                         <p className={`text-[11px] truncate mt-1 font-bold ${addr.active ? 'text-zinc-500' : 'text-zinc-400'}`}>
                           {addr.street}
                         </p>
                      </div>
                   </motion.div>
                ))}

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { 
                    setSubView("addresses"); 
                    onClose(); 
                  }}
                  className="w-full p-8 rounded-[35px] border-2 border-dashed border-zinc-100 flex flex-col items-center justify-center gap-3 text-zinc-300 hover:border-yellow-400/50 hover:text-yellow-600 hover:bg-yellow-50/30 transition-all group"
                >
                   <Icon name="add_location" className="!text-3xl group-hover:scale-110 transition-transform" />
                   <span className="text-[9px] font-black uppercase tracking-[0.3em]">Adicionar Novo</span>
                </motion.button>
             </div>

             <div className="p-10 pt-6 border-t border-zinc-50 bg-white/80 backdrop-blur-lg">
                <button 
                  onClick={onClose}
                  className="w-full bg-zinc-950 text-white h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl shadow-zinc-100 flex items-center justify-center gap-3"
                >
                   <Icon name="close" className="!text-lg" />
                   Fechar Menu
                </button>
             </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
