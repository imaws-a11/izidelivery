import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../../../contexts/NotificationContext";
import { Icon } from "../../common/Icon";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface NotificationsCenterViewProps {
  onBack: () => void;
}

export const NotificationsCenterView: React.FC<NotificationsCenterViewProps> = ({ onBack }) => {
  const { notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotification();

  const getIconByType = (type: string) => {
    switch (type) {
      case 'order': return { name: 'shopping_bag', color: 'text-yellow-500', bg: 'bg-yellow-50' };
      case 'payment': return { name: 'account_balance_wallet', color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'promo': return { name: 'local_offer', color: 'text-rose-500', bg: 'bg-rose-50' };
      case 'system': return { name: 'settings', color: 'text-blue-500', bg: 'bg-blue-50' };
      default: return { name: 'notifications', color: 'text-zinc-400', bg: 'bg-zinc-50' };
    }
  };

  return (
    <motion.div 
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[150] bg-white flex flex-col"
    >
      {/* Header Premium */}
      <header className="px-8 pt-16 pb-8 flex items-center justify-between border-b border-zinc-50">
        <div className="flex flex-col">
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none italic uppercase">
            Notifica<span className="text-yellow-500">ções</span>
          </h2>
          <div className="flex items-center gap-2 mt-3">
             <div className="size-2 bg-yellow-400 rounded-full animate-ping" />
             <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Fique por dentro de tudo</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {notifications.some(n => n.status === 'pending') && (
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={markAllAsRead}
              className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-900 transition-colors"
            >
              <span className="material-symbols-rounded !text-xl">done_all</span>
            </motion.button>
          )}
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="size-12 rounded-2xl bg-zinc-950 flex items-center justify-center text-white shadow-lg shadow-zinc-200"
          >
            <span className="material-symbols-rounded !text-xl">close</span>
          </motion.button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 opacity-30">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="size-16 rounded-[24px] border-4 border-yellow-400 border-t-transparent"
             />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Sincronizando...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="size-32 rounded-[50px] bg-zinc-50 flex items-center justify-center mb-8 relative">
               <motion.div 
                 animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="absolute inset-0 bg-yellow-400 rounded-[50px] blur-2xl"
               />
               <span className="material-symbols-rounded !text-6xl text-zinc-200 relative z-10">notifications_off</span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter mb-2">Tudo limpo por aqui!</h3>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">
              Você ainda não recebeu nenhuma notificação importante.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {notifications.map((notif, idx) => {
                const config = getIconByType(notif.data?.type || 'system');
                return (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-6 rounded-[35px] border group relative transition-all duration-300 cursor-pointer ${
                      notif.status === 'pending' 
                      ? 'bg-zinc-50 border-zinc-100 shadow-sm' 
                      : 'bg-white border-zinc-50 opacity-60 grayscale-[0.5]'
                    }`}
                  >
                    {notif.status === 'pending' && (
                      <div className="absolute top-6 right-6 size-2.5 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15]" />
                    )}
                    
                    <div className="flex gap-5">
                      <div className={`size-14 rounded-[22px] ${config.bg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-110`}>
                          <span className={`material-symbols-rounded !text-2xl ${config.color}`}>{config.name}</span>
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                             <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight truncate leading-none">
                               {notif.title}
                             </h4>
                          </div>
                          <p className="text-[11px] text-zinc-500 font-bold leading-relaxed mb-4">
                             {notif.body}
                          </p>
                          
                          <div className="flex items-center justify-between">
                             <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                                {format(new Date(notif.created_at), "HH:mm '•' dd MMM", { locale: ptBR })}
                             </span>
                             
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 deleteNotification(notif.id);
                               }}
                               className="size-8 rounded-xl bg-zinc-100/50 flex items-center justify-center text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-50 hover:text-rose-500"
                             >
                                <span className="material-symbols-rounded !text-sm">delete</span>
                             </button>
                          </div>
                       </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer / Banner de Promoção opcional */}
      <div className="p-8 pb-12">
         <div className="bg-zinc-950 rounded-[35px] p-8 flex items-center justify-between shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full blur-[60px] -mr-16 -mt-16 opacity-20" />
            <div className="relative z-10">
               <h5 className="text-white font-black text-lg uppercase italic tracking-tighter leading-none mb-1">Central de Ajuda</h5>
               <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.2em]">Dúvidas sobre seus alertas?</p>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="size-14 rounded-2xl bg-yellow-400 text-black flex items-center justify-center shadow-xl shadow-yellow-400/10 relative z-10"
            >
               <span className="material-symbols-rounded !text-2xl">support_agent</span>
            </motion.button>
         </div>
      </div>
    </motion.div>
  );
};
