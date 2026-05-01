import React from 'react';

interface OrderDetailViewProps {
  order: any;
  onBack: () => void;
  onSupport: () => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  onBack,
  onSupport
}) => {
  if (!order) return null;

  const orderDate = order.created_at
    ? new Date(order.created_at).toLocaleString("pt-BR", {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : "Agora";

  const items = Array.isArray(order.items) ? order.items : [];
  
  const subtotal = (order.total_price || 0) - (order.delivery_fee || 0) + (order.discount || 0);
  const serviceFee = 0.99;
  const total = (order.total_price || 0) + serviceFee;

  return (
    <div className="fixed inset-0 bg-white z-[500] flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-rounded text-rose-500 text-2xl">chevron_left</span>
        </button>
        <h1 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Detalhes do Pedido</h1>
        <button onClick={onSupport} className="text-sm font-bold text-zinc-600">Ajuda</button>
      </header>

      <main className="px-6 py-4 space-y-8 pb-32">
        {/* Info da Loja */}
        <section className="flex items-start gap-4">
           <div className="size-16 rounded-full bg-zinc-100 overflow-hidden border border-zinc-100 flex items-center justify-center shrink-0">
              {order.merchant_image ? (
                <img src={order.merchant_image} alt={order.merchant_name} className="size-full object-cover" />
              ) : (
                <span className="material-symbols-rounded text-zinc-300 text-3xl">store</span>
              )}
           </div>
           <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-zinc-900 truncate tracking-tight">{order.merchant_name || 'Loja Parceira'}</h2>
              <div className="flex flex-col mt-0.5">
                 <p className="text-[11px] font-bold text-zinc-400">Pedido nº {String(order.id).slice(-4)} • {orderDate}</p>
                 <button className="text-[11px] font-black text-zinc-900 mt-1 flex items-center gap-1 underline underline-offset-4 decoration-zinc-200">
                   Ver cardápio
                 </button>
              </div>
           </div>
        </section>

        {/* Status Alert */}
        {order.status === 'cancelado' && (
           <section className="bg-zinc-50 rounded-2xl p-5 border border-zinc-100 flex gap-4">
              <div className="size-5 rounded-full bg-black flex items-center justify-center shrink-0 mt-1">
                 <span className="material-symbols-rounded text-white text-[14px]">close</span>
              </div>
              <p className="text-[13px] font-medium text-zinc-900 leading-relaxed">
                No momento, a loja está sem entregadores e precisou cancelar seu pedido. O reembolso será feito em até 24h. Que tal ver outras lojas?
              </p>
           </section>
        )}

        {/* Lista de Itens */}
        <section className="space-y-6">
           {items.length > 0 ? items.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-4">
                 <div className="size-16 rounded-2xl bg-zinc-100 border border-zinc-100 relative overflow-visible shrink-0">
                    <img 
                      src={item.image_url || item.product_image || "https://cdn-icons-png.flaticon.com/512/3132/3132693.png"} 
                      className="size-full object-contain p-2" 
                      alt={item.name || item.product_name} 
                    />
                    <div className="absolute -bottom-1 -right-1 size-6 bg-rose-500 rounded-lg flex items-center justify-center border-2 border-white shadow-sm">
                       <span className="text-[11px] font-black text-white">{item.quantity}</span>
                    </div>
                 </div>
                 <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-zinc-800 truncate">{item.name || item.product_name}</h3>
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-zinc-900">R$ {Number(item.price * item.quantity).toFixed(2).replace(".", ",")}</p>
                 </div>
              </div>
           )) : (
             <p className="text-xs text-zinc-400 italic">Itens não detalhados</p>
           )}
        </section>

        {/* Resumo de Valores */}
        <section className="space-y-4">
           <h3 className="text-base font-black text-zinc-900 tracking-tight">Resumo de valores</h3>
           
           <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-600">
                 <span>Subtotal</span>
                 <span>R$ {Number(subtotal).toFixed(2).replace(".", ",")}</span>
              </div>
              {(order.discount || 0) > 0 && (
                <div className="flex justify-between items-center text-sm font-medium text-rose-500">
                   <span>Descontos</span>
                   <span>- R$ {Number(order.discount).toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm font-medium text-zinc-600">
                 <span>Taxa de entrega</span>
                 <span>R$ {Number(order.delivery_fee || 0).toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-medium text-zinc-600">
                 <div className="flex items-center gap-1">
                    <span>Taxa de serviço</span>
                    <span className="material-symbols-rounded text-sm opacity-60">help</span>
                 </div>
                 <span>R$ {Number(serviceFee).toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <span className="text-lg font-black text-zinc-900">Total</span>
                 <span className="text-lg font-black text-zinc-900">R$ {Number(total).toFixed(2).replace(".", ",")}</span>
              </div>
           </div>
        </section>

        {/* Pagamento */}
        <section className="space-y-4">
           <h3 className="text-base font-black text-zinc-900 tracking-tight">Pago pelo app</h3>
           <div className="flex items-center gap-4">
              <div className="size-10 rounded-lg bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                 <img src="https://cdn-icons-png.flaticon.com/512/5968/5968279.png" className="size-6 object-contain grayscale opacity-60" alt="Pay" />
              </div>
              <div className="flex flex-col">
                 <span className="text-sm font-black text-zinc-800">Pagamento Online</span>
                 <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">{order.payment_method?.replace("_", " ")}</span>
              </div>
           </div>
           
           {(order.status === 'cancelado' || order.status === 'concluido') && (
              <div className="bg-zinc-50 rounded-xl px-5 py-3 border border-zinc-100 flex items-center gap-3">
                 <span className="material-symbols-rounded text-zinc-500 text-lg">
                    {order.status === 'cancelado' ? 'autorenew' : 'check_circle'}
                 </span>
                 <span className="text-xs font-bold text-zinc-600">
                    {order.status === 'cancelado' ? 'Reembolso aprovado' : 'Transação finalizada'}
                 </span>
              </div>
           )}
        </section>

        {/* Endereço */}
        <section className="space-y-4">
           <h3 className="text-base font-black text-zinc-900 tracking-tight">Endereço de entrega</h3>
           <div className="flex items-start gap-4">
              <div className="size-10 rounded-full bg-zinc-100 flex items-center justify-center shrink-0">
                 <span className="material-symbols-rounded text-zinc-900 text-xl">location_on</span>
              </div>
              <div className="flex flex-col">
                 <p className="text-sm font-black text-zinc-800 leading-tight">
                    {order.delivery_address || 'Endereço não disponível'}
                 </p>
                 <p className="text-[11px] font-bold text-zinc-400 mt-1">Destino do pedido</p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
};
