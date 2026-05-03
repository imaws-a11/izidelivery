import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

interface OrderDetailViewProps {
  order: any;
  onBack: () => void;
  onSupport: () => void;
  toastSuccess?: (msg: string) => void;
  toastError?: (msg: string) => void;
}

export const OrderDetailView: React.FC<OrderDetailViewProps> = ({
  order,
  onBack,
  onSupport,
  toastSuccess,
  toastError
}) => {
  const [merchantInfo, setMerchantInfo] = useState<any>(null);

  useEffect(() => {
    const loadMerchant = async () => {
      if (order?.merchant_id) {
        const { data } = await supabase
          .from("admin_users")
          .select("store_name, store_logo, store_address")
          .eq("id", order.merchant_id)
          .maybeSingle();
        if (data) {
          setMerchantInfo({
            name: data.store_name,
            logo_url: data.store_logo,
            address: data.store_address
          });
        }
      }
    };
    loadMerchant();
  }, [order?.merchant_id]);

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

  const isCoin = order.service_type === "coin_purchase" || order.merchant_name?.includes('Izi Coin') || (order.items?.[0]?.name && order.items[0].name.includes('Izi Coin'));
  const items = Array.isArray(order.items) ? order.items : [];
  
  // Ajuste de cálculo para Izi Coins (não tem taxa de entrega ou serviço)
  const deliveryFee = isCoin ? 0 : (order.delivery_fee || 0);
  const serviceFee = isCoin ? 0 : 0.99;
  const subtotal = (order.total_price || 0) - deliveryFee + (order.discount || 0);
  const total = (order.total_price || 0) + serviceFee;

  const isPending = ['pendente_pagamento', 'pendente', 'novo'].includes(order.status) && order.payment_status !== 'paid';

  // Unifica os dados do lojista (estado carregado ou objeto do pedido)
  const finalMerchant = merchantInfo || order.merchants_delivery || {};
  
  const merchantName = isCoin 
    ? 'Compra de IZI Coins' 
    : (finalMerchant.name || order.merchant_name || items[0]?.merchant_name || 'Izi Delivery');
  
  const merchantLogo = isCoin
    ? "https://cdn-icons-png.flaticon.com/512/2533/2533558.png"
    : (finalMerchant.logo_url || order.merchant_image || order.merchant_logo || order.logo_url || items[0]?.merchant_logo);

  return (
    <div className="fixed inset-0 bg-white z-[500] flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <header className="sticky top-0 bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-rounded text-zinc-900 text-2xl">arrow_back</span>
        </button>
        <h1 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest">Detalhes do Pedido</h1>
        <button onClick={onSupport} className="text-sm font-bold text-zinc-600">Ajuda</button>
      </header>

      <main className="px-6 py-4 space-y-8 pb-32">
        {/* Info da Loja / Produto */}
        <section className="flex items-start gap-4">
           <div className="size-16 rounded-full bg-zinc-100 overflow-hidden border border-zinc-100 flex items-center justify-center shrink-0">
              {merchantLogo ? (
                <img src={merchantLogo} alt={merchantName} className="size-full object-cover" />
              ) : (
                <div className="size-full bg-yellow-400 flex items-center justify-center">
                   <span className="text-zinc-900 font-black text-xl">{merchantName.charAt(0)}</span>
                </div>
              )}
           </div>
           <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-zinc-900 truncate tracking-tight">
                {merchantName}
              </h2>
              <div className="flex flex-col mt-0.5">
                 <p className="text-[11px] font-bold text-zinc-400">Pedido nº {String(order.id).slice(-4)} • {orderDate}</p>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Acompanhando</span>
                 </div>
              </div>
           </div>
        </section>

        {/* Action Button - Se estiver pendente */}
        {isPending && (
          <section className="space-y-3">
            <div className="bg-yellow-50 rounded-[32px] p-6 border border-yellow-200/50 space-y-4">
              <div className="flex items-center gap-3 text-yellow-700">
                  <span className="material-symbols-rounded text-xl">info</span>
                  <p className="text-xs font-black uppercase tracking-widest">Pagamento Pendente</p>
              </div>
              <p className="text-[11px] text-yellow-800 font-medium leading-relaxed">
                Este pedido ainda não foi pago. Finalize o pagamento para que possamos processar sua solicitação.
              </p>
              <button
                onClick={() => {
                    const method = order.payment_method;
                    if (isCoin) {
                      (window as any).izi_navigate?.('izi_black_purchase', order);
                    } else {
                      (window as any).izi_navigate?.(method === 'pix' ? 'pix_payment' : method === 'lightning' ? 'lightning_payment' : 'checkout', order);
                    }
                }}
                className="w-full py-4 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-200/50 active:scale-95 transition-all"
              >
                Ir para o Pagamento
              </button>
            </div>

            <button
              onClick={async () => {
                if (!confirm('Deseja realmente cancelar este pedido?')) return;
                const { error } = await supabase
                  .from('orders_delivery')
                  .update({ status: 'cancelado' })
                  .eq('id', order.id);
                
                if (!error) {
                  if (toastSuccess) toastSuccess('Pedido cancelado com sucesso!');
                  onBack();
                } else {
                  if (toastError) toastError('Erro ao cancelar pedido.');
                }
              }}
              className="w-full py-4 border-2 border-zinc-100 text-zinc-400 font-black text-xs uppercase tracking-widest rounded-2xl active:bg-zinc-50 transition-all"
            >
              Cancelar Pedido
            </button>
          </section>
        )}

        {/* Lista de Itens */}
        {!isCoin && (
          <section className="space-y-6">
            <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Itens do pedido</h3>
             {items.length > 0 ? items.map((item: any, i: number) => {
                const itemPrice = Number(item.price) || Number(item.unit_price) || 0;
                const itemQty = Number(item.quantity) || 1;
                const itemTotal = itemPrice * itemQty;
                const itemImg = item.image_url || item.product_image || item.image || item.thumbnail || item.img || "https://cdn-icons-png.flaticon.com/512/3132/3132693.png";

                return (
                  <div key={i} className="flex items-center gap-4">
                     <div className="size-16 rounded-2xl bg-zinc-50 border border-zinc-100 relative overflow-hidden shrink-0 flex items-center justify-center">
                        <img 
                          src={itemImg} 
                          className="size-full object-cover" 
                          alt={item.name || item.product_name} 
                          onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn-icons-png.flaticon.com/512/3132/3132693.png"; }}
                        />
                        <div className="absolute top-1 left-1 size-5 bg-zinc-900/80 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
                           <span className="text-[9px] font-black text-white">{itemQty}x</span>
                        </div>
                     </div>
                     <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-zinc-800 truncate">{item.name || item.product_name}</h3>
                        <p className="text-[10px] text-zinc-400 font-medium">Preço unitário: R$ {itemPrice.toFixed(2).replace(".", ",")}</p>
                     </div>
                     <div className="text-right">
                        <p className="text-sm font-black text-zinc-900">R$ {itemTotal.toFixed(2).replace(".", ",")}</p>
                     </div>
                  </div>
                );
             }) : (
               <p className="text-xs text-zinc-400 italic">Detalhes não informados</p>
             )}
          </section>
        )}

        {/* Resumo de Valores */}
        <section className="bg-zinc-50 rounded-3xl p-6 border border-zinc-100 space-y-4">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Resumo de valores</h3>
           
           <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-medium text-zinc-600">
                 <span>Subtotal</span>
                 <span>R$ {Number(subtotal || 0).toFixed(2).replace(".", ",")}</span>
              </div>
              {(order.discount || 0) > 0 && (
                 <div className="flex justify-between items-center text-sm font-medium text-emerald-600">
                    <span className="flex items-center gap-1.5">
                       <span className="material-symbols-rounded text-base">sell</span>
                       Descontos
                    </span>
                    <span>- R$ {Number(order.discount).toFixed(2).replace(".", ",")}</span>
                 </div>
              )}
              {deliveryFee > 0 && (
                 <div className="flex justify-between items-center text-sm font-medium text-zinc-600">
                    <span>Taxa de entrega</span>
                    <span>R$ {Number(deliveryFee).toFixed(2).replace(".", ",")}</span>
                 </div>
              )}
              {serviceFee > 0 && (
                 <div className="flex justify-between items-center text-sm font-medium text-zinc-600">
                    <span>Taxa de serviço</span>
                    <span>R$ {Number(serviceFee).toFixed(2).replace(".", ",")}</span>
                 </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
                 <span className="text-lg font-black text-zinc-900">Total</span>
                 <span className="text-xl font-black text-zinc-900 tracking-tighter">R$ {Number(total || 0).toFixed(2).replace(".", ",")}</span>
              </div>
           </div>
        </section>

        {/* Endereços */}
        {!isCoin && (
          <section className="space-y-6">
             <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                   <div className="size-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                      <span className="material-symbols-rounded text-zinc-900 text-xl">store</span>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Origem / Lojista</p>
                      <p className="text-sm font-bold text-zinc-800 leading-tight">
                         {order.merchant_name || 'Estabelecimento'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                         {order.pickup_address || 'Endereço da loja não informado'}
                      </p>
                   </div>
                </div>

                <div className="ml-5 -my-4 h-8 border-l-2 border-dashed border-zinc-200" />

                <div className="flex items-start gap-4">
                   <div className="size-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0 shadow-lg shadow-yellow-100">
                      <span className="material-symbols-rounded text-black text-xl">location_on</span>
                   </div>
                   <div className="flex flex-col">
                      <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Destino / Entrega</p>
                      <p className="text-sm font-bold text-zinc-800 leading-tight">
                         {order.user_name || 'Meu Endereço'}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                         {order.delivery_address || 'Endereço de entrega não disponível'}
                      </p>
                   </div>
                </div>
             </div>
          </section>
        )}

        {/* Pagamento */}
        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Forma de pagamento</h3>
           <div className="bg-white p-5 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                 <span className="material-symbols-rounded text-zinc-400 text-2xl">payments</span>
              </div>
              <div className="flex flex-col flex-1">
                 <span className="text-sm font-black text-zinc-800 uppercase tracking-tight">{order.payment_method?.replace("_", " ") || 'Não definido'}</span>
                 <span className={`text-[10px] font-bold uppercase tracking-widest ${order.payment_status === 'paid' ? 'text-emerald-500' : 'text-yellow-600'}`}>
                    {order.payment_status === 'paid' ? 'Pagamento Aprovado' : 'Aguardando Pagamento'}
                 </span>
              </div>
              {order.payment_status === 'paid' && (
                <div className="size-8 rounded-full bg-emerald-50 flex items-center justify-center">
                   <span className="material-symbols-rounded text-emerald-500 text-lg">check_circle</span>
                </div>
              )}
           </div>
        </section>
      </main>
    </div>
  );
};
