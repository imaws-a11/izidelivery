import React from "react";
import { motion } from "framer-motion";

interface CartViewProps {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  handleClearCart: () => void;
  setSubView: (view: string) => void;
  navigateSubView: (view: string) => void;
  merchantProducts: any[];
  merchantName?: string;
  handleAddToCart: (item: any) => void;
  isIziBlack?: boolean;
  iziCoinRate?: number;
  deliveryFee?: number;
  iziBlackRate?: number;
}

export const CartView: React.FC<CartViewProps> = ({ 
  cart, setCart, handleClearCart, setSubView, navigateSubView, merchantProducts, merchantName, handleAddToCart,
  isIziBlack = false, iziCoinRate = 0, deliveryFee = 0, iziBlackRate = 0
}) => {
  const subtotal: number = cart.reduce((sum, item) => {
    const basePrice = Number(item.price) || 0;
    const addonsPrice = Array.isArray(item.addonDetails) 
      ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
      : 0;
    return sum + basePrice + addonsPrice;
  }, 0);
  const taxa: number = deliveryFee; 
  const total: number = subtotal + taxa;
  const getAddonDetails = (item: any) => Array.isArray(item.addonDetails) ? item.addonDetails : [];
  const getItemTotal = (item: any) => {
    const basePrice = Number(item.price) || 0;
    const addonsPrice = getAddonDetails(item).reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0);
    return basePrice + addonsPrice;
  };
  const cartProductIds = new Set(cart.map((item: any) => item.id));
  const suggestedMerchantProducts = (merchantProducts || [])
    .filter((item: any) => item?.id && !cartProductIds.has(item.id))
    .slice(0, 8);

  const handleRemoveItem = (index: number) => {
    setCart((prev: any[]) => {
      const c = [...prev];
      c.splice(index, 1);
      return c;
    });
  };

  if (cart.length === 0) {
    return (
      <div 
        className="fixed inset-0 z-[200] bg-black text-zinc-100 flex flex-col items-center justify-center p-10 overflow-hidden select-none touch-none"
        style={{ touchAction: 'none', overscrollBehavior: 'none' }}
      >
        {/* Animated Mesh Gradient Background - FIXED */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] size-[500px] bg-yellow-400/10 blur-[120px] rounded-full animate-pulse" />
           <div className="absolute bottom-[-10%] right-[-10%] size-[400px] bg-zinc-800/20 blur-[100px] rounded-full" />
        </div>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-[210] flex flex-col items-center w-full max-w-xs pointer-events-auto"
        >
          {/* Central Clay Icon */}
          <div className="size-28 rounded-[38px] bg-zinc-900 border border-white/5 flex items-center justify-center mb-9 shadow-[20px_20px_60px_rgba(0,0,0,0.8),-5px_-5px_20px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.05)] relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <span className="material-symbols-outlined text-5xl text-zinc-700 group-hover:text-yellow-400 transition-all duration-500 scale-110 group-hover:scale-125">shopping_cart_off</span>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-[28px] font-black text-white italic uppercase tracking-tighter leading-none mb-4">
              Sacola <br/>
              <span className="text-yellow-400">Vazia</span>
            </h2>
            <div className="w-12 h-1 bg-yellow-400/20 mx-auto rounded-full mb-4" />
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.25em] leading-relaxed opacity-80">
              Transforme seu dia com <br/> novos sabores exclusivos.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubView("none")}
            className="w-full h-16 rounded-3xl bg-yellow-400 text-black font-black text-[12px] uppercase tracking-[0.2em] italic shadow-[0_20px_40px_-10px_rgba(255,215,9,0.3)] flex items-center justify-center gap-3 active:brightness-90 transition-all cursor-pointer"
          >
            Explorar Agora
            <span className="material-symbols-outlined text-lg font-black">arrow_forward</span>
          </motion.button>
        </motion.div>

        {/* Bottom Tag */}
        <div className="absolute bottom-12 text-[8px] font-black text-zinc-800 uppercase tracking-[0.4em]">
           Izi Experience • Digital Concept
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-[60] bg-black/60 backdrop-blur-2xl flex items-center justify-between px-6 py-5 border-b border-white/5">
        <div className="flex items-center gap-5">
          <button onClick={() => setSubView("none")} className="size-11 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-black text-lg tracking-tight text-white italic uppercase leading-none">Minha Sacola</h1>
            <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-1.5">
               <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
               Izi Delivery Experience
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{cart.length} ITENS</span>
          <span className="text-white font-black text-xs">R$ {total.toFixed(2).replace(".", ",")}</span>
        </div>
      </header>

      <main className="px-6 flex flex-col pt-6">
        {/* LISTA DE ITENS - BORDERLESS */}
        {cart.length > 0 && (
          <section className="mt-2 space-y-2">
            <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Itens Selecionados</h2>
          {cart.map((item: any, i: number) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-5 py-5 border-b border-white/5 last:border-0 group"
            >
              <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden shrink-0 shadow-2xl relative">
                {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[8px] font-bold text-yellow-400 uppercase tracking-widest mb-1 truncate">{item.merchant_name || item.store || "Premium Partner"}</p>
                <h4 className="font-black text-base text-white truncate leading-tight group-hover:text-yellow-400 transition-colors uppercase italic">{item.name}</h4>
                {getAddonDetails(item).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {getAddonDetails(item).map((addon: any) => (
                      <p key={`${item.cartId || item.id}-${addon.group_id}-${addon.id}`} className="text-[10px] text-zinc-500 font-bold leading-relaxed">
                        {addon.group_name}: {addon.name} x{addon.quantity} - R$ {Number(addon.total_price || 0).toFixed(2).replace(".", ",")}
                      </p>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                   <p className="text-white font-black text-sm">R$ {getItemTotal(item).toFixed(2).replace(".", ",")}</p>
                   {item.oldPrice && <p className="text-[10px] text-zinc-600 line-through font-bold">R$ {item.oldPrice.toFixed(2).replace(".", ",")}</p>}
                </div>
              </div>
              <button
                onClick={() => handleRemoveItem(i)}
                className="size-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-95 transition-all text-zinc-600 hover:text-red-500 hover:border-red-500/30"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </motion.div>
          ))}
        </section>
      )}

        {/* UPSELL SECTION */}
        {suggestedMerchantProducts.length > 0 && (
        <section className="mt-12 mb-8">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] italic">Completa seu pedido?</h3>
              <span className="text-[9px] font-medium text-zinc-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">{merchantName || "Loja"}</span>
           </div>
           
           <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-6 px-6 pb-4">
              {suggestedMerchantProducts.map((product: any) => (
                <motion.div 
                  key={product.id} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAddToCart(product)}
                  className="flex-shrink-0 w-44 bg-zinc-800 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] rounded-[32px] p-4 flex flex-col gap-3 group transition-all cursor-pointer"
                >
                   <div className="w-full h-24 rounded-[22px] overflow-hidden bg-zinc-900 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)] relative">
                      <img src={product.img} className="size-full object-cover brightness-90 group-hover:brightness-110 transition-all" />
                   </div>
                   <div className="px-1">
                      <p className="text-[8px] font-black text-yellow-400/60 uppercase tracking-widest mb-1 truncate">{product.store || merchantName || "Loja"}</p>
                      <h5 className="text-[13px] font-black text-white leading-tight uppercase italic truncate">{product.name}</h5>
                      <div className="flex items-center justify-between mt-3">
                         <span className="text-sm font-black text-white tracking-tighter">R$ {Number(product.price || 0).toFixed(2).replace(".", ",")}</span>
                         <div className="size-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center shadow-[4px_4px_8px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
                            <span className="material-symbols-outlined text-xl font-black">add</span>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>
        )}

        {/* RESUMO DE VALORES - BORDERLESS */}
        {cart.length > 0 && (
          <section className="py-8 border-t border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Subtotal</span>
              <span className="text-white font-black text-sm tracking-tight">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm font-medium uppercase tracking-widest">Taxa de entrega</span>
              <div className="flex flex-col items-end">
                 {taxa === 0 ? (
                   <>
                     <span className="text-emerald-400 font-bold text-sm tracking-widest uppercase italic">Grátis</span>
                     {isIziBlack && (
                       <span className="text-[8px] text-zinc-600 font-bold tracking-[0.2em] uppercase mt-1">Benefício Izi Black</span>
                     )}
                   </>
                 ) : (
                   <span className="text-white font-black text-sm tracking-tight italic">R$ {taxa.toFixed(2).replace(".", ",")}</span>
                 )}
              </div>
            </div>

            {/* CASHBACK INFO */}
            <div className="p-4 rounded-[24px] bg-yellow-400/5 border border-yellow-400/10 flex items-center justify-between group overflow-hidden relative">
              <div className="absolute inset-0 bg-yellow-400/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="size-10 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-lg italic shadow-[0_0_20px_rgba(255,215,9,0.2)]">Z</div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-yellow-400 uppercase tracking-widest leading-none mb-1">Você vai ganhar</span>
                  <span className="text-white font-black text-sm tracking-tight uppercase italic">{((subtotal * (isIziBlack ? (iziBlackRate || 1) : (iziCoinRate || 1))) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} IZI COINS</span>
                </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1 italic">Cashback {isIziBlack ? 'Izi Black' : 'Standard'}</span>
                <span className="text-emerald-400 font-extrabold text-[10px] tracking-widest uppercase">{isIziBlack ? `${iziBlackRate || 1}%` : `${iziCoinRate || 1}%`}</span>
              </div>
            </div>
            
            <div className="pt-8 border-t border-white/10 flex justify-between items-end">
              <div>
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2 font-black italic">Previsão</p>
                 <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-yellow-400 text-sm">schedule</span>
                    <span className="font-black text-white text-xs uppercase tracking-tight italic">35 - 45 min</span>
                 </div>
              </div>
               <div className="text-right">
                 <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Valor Total</p>
                 <p className="text-4xl font-black text-white leading-none tracking-tighter" style={{ textShadow: "0 0 30px rgba(255,255,255,0.1)" }}>
                   R$ {total.toFixed(2).replace(".", ",")}
                 </p>
               </div>
             </div>
           </section>
        )}

        {/* BOTÃO DE LIMPEZA DISCRETO */}
        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="my-12 flex items-center justify-center gap-3 py-4 text-zinc-600 hover:text-red-500/80 transition-all active:scale-95 group"
          >
            <div className="size-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all">
               <span className="material-symbols-outlined text-lg">delete_outline</span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Esvaziar Sacola</span>
          </button>
        )}
      </main>

      {/* FOOTER FIXO PREMIUM */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full px-6 pb-10 pt-6 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
          <button
            onClick={() => navigateSubView("checkout")}
            className="w-full h-16 rounded-[25px] flex items-center justify-between px-8 transition-all active:scale-[0.98] relative overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)",
              boxShadow: "0 10px 40px -10px rgba(255, 215, 9, 0.4)",
            }}
          >
            <div className="flex flex-col items-start">
               <span className="text-[8px] font-black uppercase tracking-[0.2em] text-black/40 leading-none mb-1">Finalizar</span>
               <span className="text-black font-black text-sm uppercase tracking-widest italic">Continuar para Pagamento</span>
            </div>
            <div className="flex items-center gap-3">
               <div className="h-4 w-px bg-black/10" />
               <span className="text-black font-black text-lg italic tracking-tighter leading-none">R$ {total.toFixed(2).replace(".", ",")}</span>
            </div>
            
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
};
