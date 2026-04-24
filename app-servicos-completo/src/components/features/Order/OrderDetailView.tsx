import React from "react";
import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";

interface OrderDetailViewProps {
  order: any;
  onBack: () => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({ order, onBack }) => {
  if (!order) return null;

  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = order.subtotal || items.reduce((sum: number, item: any) => sum + (Number(item.price) * (item.quantity || 1)), 0);
  const deliveryFee = Number(order.delivery_fee || 0);
  const discount = Number(order.discount_amount || 0);
  const total = Number(order.total_price || 0);

  const statusMap: Record<string, string> = {
    pending: "Aguardando",
    novo: "Processando",
    aceito: "Confirmado",
    preparando: "Em Preparação",
    pronto: "Pronto para Entrega",
    saiu_para_entrega: "Em Rota",
    concluido: "Concluido",
    cancelado: "Cancelado",
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black text-zinc-100 flex flex-col overflow-hidden">
      <header className="z-[60] bg-black/60 backdrop-blur-2xl flex items-center gap-5 px-6 py-7 border-b border-white/5">
        <button 
          onClick={onBack} 
          className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all clay-card"
        >
          <Icon name="arrow_back" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-black text-xl tracking-tight text-white italic uppercase leading-none">Detalhes do Pedido</h1>
          <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-1.5">
             #{order.id.slice(0,8).toUpperCase()} • {new Date(order.created_at).toLocaleDateString()}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 py-8 space-y-8 pb-32">
        {/* Status Card */}
        <section className="bg-zinc-900/40 rounded-[35px] border border-white/5 p-6 clay-card">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status Atual</span>
            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : order.status === 'cancelado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20'}`}>
              {statusMap[order.status] || order.status}
            </span>
          </div>
          <h3 className="text-xl font-black text-white italic uppercase tracking-tighter truncate">
            {order.merchant_name || order.store_name || "Loja Parceira"}
          </h3>
        </section>

        {/* Items List */}
        <section className="space-y-4">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] px-2 italic">Itens do Pedido</h4>
          <div className="space-y-3">
            {items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900/20 rounded-[28px] border border-white/5">
                <div className="size-12 rounded-2xl bg-zinc-950 border border-white/5 overflow-hidden">
                  {item.img ? <img src={item.img} className="size-full object-cover" /> : <div className="size-full flex items-center justify-center text-zinc-800"><Icon name="restaurant" /></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-black text-white truncate italic uppercase">{item.name}</h5>
                  <p className="text-[10px] text-zinc-500 font-bold">Qtd: {item.quantity || 1}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">R$ {(Number(item.price) * (item.quantity || 1)).toFixed(2).replace(".",",")}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Address */}
        <section className="bg-zinc-900/20 rounded-[35px] border border-white/5 p-6">
          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 italic">Endereço de Entrega</h4>
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-500 border border-white/5">
              <Icon name="location_on" />
            </div>
            <p className="text-xs font-bold text-zinc-300 leading-relaxed uppercase italic">
              {order.delivery_address || "Endereço não informado"}
            </p>
          </div>
        </section>

        {/* Financial Summary */}
        <section className="bg-zinc-900/40 rounded-[35px] border border-white/5 p-7 clay-card">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase italic">
              <span>Subtotal</span>
              <span>R$ {subtotal.toFixed(2).replace(".",",")}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-zinc-500 uppercase italic">
              <span>Taxa de Entrega</span>
              <span>{deliveryFee === 0 ? "GRÁTIS" : `R$ ${deliveryFee.toFixed(2).replace(".",",")}`}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase italic">
                <span>Desconto</span>
                <span>- R$ {discount.toFixed(2).replace(".",",")}</span>
              </div>
            )}
          </div>
          <div className="pt-5 border-t border-white/5 flex justify-between items-end">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">Total Final</span>
            <span className="text-3xl font-black text-white italic tracking-tighter">R$ {total.toFixed(2).replace(".",",")}</span>
          </div>
        </section>
      </main>
    </div>
  );
};
