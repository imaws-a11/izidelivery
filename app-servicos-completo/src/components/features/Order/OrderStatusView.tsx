import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const OrderStatusView = () => {
  const { 
    subView, 
    setSubView, 
    selectedItem, 
    handleCancelOrder,
  } = useApp();

  if (!selectedItem) return null;

  const renderActiveOrder = () => {
    const status = selectedItem?.status || "pendente";
    const statusMap: any = {
      "pendente": { label: "Aguardando Loja", color: "text-zinc-500", bg: "bg-zinc-100", icon: "schedule" },
      "confirmado": { label: "Preparando", color: "text-blue-600", bg: "bg-blue-50", icon: "restaurant" },
      "em_rota": { label: "Em Entrega", color: "text-emerald-600", bg: "bg-emerald-50", icon: "moped" },
      "concluido": { label: "Entregue", color: "text-zinc-400", bg: "bg-zinc-100", icon: "check_circle" },
      "cancelado": { label: "Cancelado", color: "text-red-600", bg: "bg-red-50", icon: "close" }
    };

    const currentStatus = statusMap[status] || statusMap["pendente"];

    return (
      <div className="absolute inset-0 z-40 bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar">
        <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 border-b border-zinc-100 sticky top-0 z-50">
          <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-50 flex items-center justify-center">
            <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
          </button>
          <div>
            <h1 className="font-black text-xl tracking-tight leading-none uppercase">Acompanhar</h1>
            <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">Pedido #{String(selectedItem.id).slice(0,6).toUpperCase()}</p>
          </div>
        </header>

        <main className="px-5 py-8 space-y-8">
           {/* Visualização de Status Central */}
           <div className="flex flex-col items-center text-center py-10 bg-zinc-50 rounded-3xl border border-zinc-100 shadow-inner">
              <div className="size-24 rounded-full bg-white border border-zinc-100 flex items-center justify-center mb-6 shadow-sm">
                 <Icon name={currentStatus.icon} className={`text-5xl ${currentStatus.color}`} />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 leading-none mb-2 uppercase italic tracking-tighter">
                {currentStatus.label}
              </h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Previsão de entrega: 15-25 min</p>
           </div>

           {/* Itens do Pedido */}
           <section className="space-y-4">
              <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest px-1">Resumo do pedido</h3>
              <div className="bg-white border border-zinc-100 rounded-2xl p-5 space-y-4">
                 <div className="space-y-3">
                   {selectedItem.items?.map((item: any, i: number) => (
                     <div key={i} className="flex justify-between items-center">
                       <span className="text-sm font-bold text-zinc-600">{item.quantity}x <span className="text-zinc-900">{item.name}</span></span>
                       <span className="text-sm font-black text-zinc-900">R$ {(item.price * item.quantity).toFixed(2).replace(".", ",")}</span>
                     </div>
                   ))}
                 </div>
                 <div className="pt-4 border-t border-zinc-50 flex justify-between items-center">
                    <span className="text-xs font-black text-zinc-400 uppercase tracking-wider">Total</span>
                    <span className="text-xl font-black text-zinc-900">R$ {Number(selectedItem.total_price).toFixed(2).replace(".", ",")}</span>
                 </div>
              </div>
           </section>

           {/* Ações */}
           <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setSubView("order_chat")} className="h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all">
                <span className="material-symbols-rounded text-yellow-600">chat</span>
                <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">Chat</span>
              </button>
              <button onClick={() => setSubView("order_support")} className="h-16 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all">
                <span className="material-symbols-rounded text-zinc-400">help</span>
                <span className="text-xs font-black text-zinc-900 uppercase tracking-widest">Ajuda</span>
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
               className="w-full py-6 text-zinc-300 hover:text-red-500 font-black text-[11px] uppercase tracking-[0.2em] transition-colors"
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
        <motion.div key="order-status" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute inset-0 z-[100]">
          {renderActiveOrder()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
