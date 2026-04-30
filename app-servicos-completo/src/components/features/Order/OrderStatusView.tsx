import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const OrderStatusView = () => {
  const { 
    subView, 
    setSubView, 
    selectedItem, 
    setTab,
    handleCancelOrder,
    toastSuccess,
    toastError
  } = useApp();

  if (!selectedItem) return null;

  const isMobility = ['mototaxi', 'carro', 'van', 'utilitario', 'frete', 'logistica'].includes(selectedItem.service_type);

  const renderActiveOrder = () => {
    const status = selectedItem?.status || "pendente";
    const statusMap: any = {
      "pendente": { label: "Aguardando Loja", color: "text-zinc-500", bg: "bg-zinc-900", icon: "timer" },
      "confirmado": { label: "Sendo Preparado", color: "text-blue-400", bg: "bg-blue-400/10", icon: "skillet" },
      "em_rota": { label: "Em Entrega", color: "text-emerald-400", bg: "bg-emerald-400/10", icon: "delivery_dining" },
      "concluido": { label: "Entregue", color: "text-zinc-400", bg: "bg-zinc-900", icon: "check_circle" },
      "cancelado": { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10", icon: "cancel" }
    };

    const currentStatus = statusMap[status] || statusMap["pendente"];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <div className="flex items-center gap-4">
            <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
              <Icon name="arrow_back" />
            </button>
            <div>
              <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Status do Pedido</h1>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">#DT-{String(selectedItem.id).slice(0,6).toUpperCase()}</p>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full ${currentStatus.bg} flex items-center gap-2 border border-white/5`}>
            <span className={`size-1.5 rounded-full ${currentStatus.color.replace('text', 'bg')} animate-pulse`} />
            <span className={`text-[9px] font-black uppercase tracking-wider ${currentStatus.color}`}>{currentStatus.label}</span>
          </div>
        </header>

        <main className="px-5 py-8 space-y-8">
           {/* Visualização de Status Central */}
           <div className="relative py-10 flex flex-col items-center text-center">
              <div className="absolute inset-0 bg-yellow-400/5 blur-[100px] rounded-full" />
              <div className="size-28 rounded-[40px] bg-zinc-900 border border-white/5 flex items-center justify-center mb-6 relative">
                 <div className="absolute inset-0 rounded-[40px] bg-yellow-400/10 animate-ping opacity-20" />
                 <Icon name={currentStatus.icon} className={`text-5xl ${currentStatus.color}`} />
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">
                {status === 'em_rota' ? 'Pedido a Caminho!' : currentStatus.label}
              </h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Previsão: 15-25 min</p>
           </div>

           {/* Itens do Pedido */}
           <section className="clay-card-dark rounded-[32px] p-6 space-y-4">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Itens do Pedido</p>
              <div className="space-y-3">
                {selectedItem.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 font-bold">{item.quantity}x <span className="text-white">{item.name}</span></span>
                    <span className="text-zinc-500 font-mono">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                 <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Total Pago</span>
                 <span className="text-lg font-black text-white">R$ {Number(selectedItem.total_price).toFixed(2)}</span>
              </div>
           </section>

           {/* AçÃµes Rápidas */}
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSubView("order_chat")} className="h-16 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <Icon name="chat" className="text-yellow-400" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Chat</span>
              </button>
              <button onClick={() => setSubView("order_support")} className="h-16 rounded-2xl bg-zinc-900 border border-white/5 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all">
                <Icon name="help" className="text-zinc-500" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Suporte</span>
              </button>
           </div>

           {status === 'pendente' && (
             <button 
               onClick={async () => {
                 if(window.confirm("Deseja cancelar seu pedido?")) {
                   const success = await handleCancelOrder(selectedItem.id);
                   if(success) setSubView("none");
                 }
               }}
               className="w-full py-4 text-red-500/50 text-[10px] font-black uppercase tracking-widest"
             >
               Cancelar Pedido
             </button>
           )}
        </main>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {subView === "active_order" && (
        <motion.div key="order-status" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          {renderActiveOrder()}
        </motion.div>
      )}
      {/* Aqui poderiam entrar outras views de status como logistics_tracking */}
    </AnimatePresence>
  );
};
