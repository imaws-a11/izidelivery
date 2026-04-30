import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

export const NotificationsCenterView = () => {
  const { setSubView } = useApp();

  const notifications = [
    { id: 1, title: 'Pedido Confirmado', content: 'Seu pedido da Casa do Baleiro está a caminho.', time: '2 min atrás', icon: 'shopping_bag', color: 'text-emerald-400', bg: 'bg-emerald-400/10', unread: true },
    { id: 2, title: 'Nova Quest Disponível', content: 'Complete 3 pedidos hoje e ganhe 50 XP extras!', time: '1h atrás', icon: 'bolt', color: 'text-yellow-400', bg: 'bg-yellow-400/10', unread: true },
    { id: 3, title: 'Promoção Izi Flash', content: 'Hambúrguer Gourmet com 50% de desconto por tempo limitado.', time: '3h atrás', icon: 'local_fire_department', color: 'text-orange-400', bg: 'bg-orange-400/10', unread: false },
    { id: 4, title: 'Izi Pay: Depósito', content: 'Seu depósito de R$ 50,00 foi processado com sucesso.', time: '5h atrás', icon: 'account_balance_wallet', color: 'text-blue-400', bg: 'bg-blue-400/10', unread: false },
    { id: 5, title: 'Nível Avançado!', content: 'Parabéns! Você alcançou o Nível 12 e desbloqueou novos badges.', time: '1 dia atrás', icon: 'military_tech', color: 'text-purple-400', bg: 'bg-purple-400/10', unread: false },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubView("none")} 
            className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl active:scale-95"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase leading-none">Notificações</h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Seu resumo de atividades Izi</p>
          </div>
        </div>
        <button className="px-4 py-2 rounded-xl bg-zinc-900/50 border border-white/5 text-[9px] font-black text-zinc-500 uppercase tracking-widest active:scale-95 transition-all">
          Limpar
        </button>
      </header>

      <main className="px-6 py-10 space-y-6">
        {notifications.map((n, i) => (
          <motion.div 
            key={n.id || `notif-${i}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`p-6 rounded-[35px] border-2 flex items-start gap-5 transition-all active:scale-[0.98]
              ${n.unread 
                ? 'bg-zinc-900/40 border-yellow-400/20 shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02)]' 
                : 'bg-transparent border-white/5 shadow-none'
              }`}
          >
            <div className={`size-14 rounded-[22px] ${n.bg} flex items-center justify-center shadow-inner shrink-0 relative`}>
              <span className={`material-symbols-outlined ${n.color} text-2xl`}>{n.icon}</span>
              {n.unread && (
                <div className="absolute -top-1 -right-1 size-3 bg-yellow-400 rounded-full border-2 border-black animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between">
                 <p className={`font-black text-sm tracking-tight ${n.unread ? 'text-white' : 'text-zinc-400'}`}>{n.title}</p>
                 <span className="text-[9px] font-black text-zinc-600 uppercase shrink-0 ml-2">{n.time}</span>
              </div>
              <p className={`text-[11px] leading-relaxed ${n.unread ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>{n.content}</p>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  );
};
