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
          <div className="size-32 rounded-[45px] bg-zinc-900 border border-white/5 flex items-center justify-center mb-10 clay-card relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <span className="material-symbols-outlined text-6xl text-zinc-700 group-hover:text-yellow-400 transition-all duration-700 scale-110 group-hover:scale-125 fill-1">shopping_basket</span>
          </div>

          <div className="text-center mb-12">
            <h2 className="text-[32px] font-black text-white italic uppercase tracking-tighter leading-none mb-5">
              Sacola <br/>
              <span className="text-yellow-400" style={{ textShadow: "0 0 20px rgba(250,204,21,0.3)" }}>Vazia</span>
            </h2>
            <div className="w-16 h-1.5 bg-yellow-400/20 mx-auto rounded-full mb-6" />
            <p className="text-[11px] text-zinc-500 font-black uppercase tracking-[0.3em] leading-relaxed opacity-80 italic">
              Explore o melhor da cidade <br/> e preencha sua sacola.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubView("none")}
            className="w-full h-16 rounded-[30px] bg-yellow-400 text-black font-black text-[13px] uppercase tracking-[0.2em] italic clay-button flex items-center justify-center gap-4 transition-all"
          >
            Explorar Menu
            <div className="size-8 rounded-xl bg-black/5 flex items-center justify-center border border-black/5">
               <span className="material-symbols-outlined text-xl font-black">restaurant_menu</span>
            </div>
          </motion.button>
        </motion.div>

        {/* Bottom Tag */}
        <div className="absolute bottom-12 text-[9px] font-black text-zinc-800 uppercase tracking-[0.5em] italic">
           Izi Experience • Premium Delivery
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-hidden select-none">
      {/* HEADER PREMIUM CLAY */}
      <header className="z-[60] bg-black/60 backdrop-blur-2xl flex items-center justify-between px-6 py-7 border-b border-white/5">
        <div className="flex items-center gap-5">
          <button 
            onClick={() => setSubView("none")} 
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all clay-card"
          >
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tight text-white italic uppercase leading-none">Minha Sacola</h1>
            <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-1.5">
               <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_#facc15]" />
               Izi Delivery Experience
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{cart.length} ITENS</span>
          <div className="px-4 py-1.5 rounded-xl bg-zinc-900/50 border border-white/5 clay-card">
            <span className="text-white font-black text-xs">R$ {total.toFixed(2).replace(".", ",")}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 flex flex-col pt-6 pb-44">
        {/* LISTA DE ITENS - CLAY STYLE */}
        {cart.length > 0 && (
          <section className="mt-2 space-y-4">
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.3em] italic">Itens Selecionados</h2>
              <div className="h-px flex-1 bg-white/5 ml-4" />
            </div>
            
            {cart.map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-5 p-5 bg-zinc-900/40 rounded-[35px] border border-white/5 clay-card group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-22 h-22 rounded-[30px] bg-zinc-950 border border-white/5 overflow-hidden shrink-0 shadow-2xl relative z-10">
                  {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                  <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.25em] mb-1.5 truncate">{item.merchant_name || item.store || "Premium Partner"}</p>
                  <h4 className="font-black text-lg text-white truncate leading-tight group-hover:text-yellow-400 transition-colors uppercase italic mb-2">{item.name}</h4>
                  
                  {getAddonDetails(item).length > 0 && (
                    <div className="mb-3 space-y-1">
                      {getAddonDetails(item).map((addon: any) => (
                        <p key={`${item.cartId || item.id}-${addon.group_id}-${addon.id}`} className="text-[10px] text-zinc-500 font-bold leading-relaxed flex items-center gap-1.5">
                          <span className="size-1 rounded-full bg-zinc-700" />
                          {addon.name} x{addon.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                     <span className="px-3 py-1 rounded-lg bg-yellow-400/10 text-yellow-400 font-black text-xs border border-yellow-400/10">
                        R$ {getItemTotal(item).toFixed(2).replace(".", ",")}
                     </span>
                     {item.oldPrice && <span className="text-[10px] text-zinc-600 line-through font-bold">R$ {item.oldPrice.toFixed(2).replace(".", ",")}</span>}
                  </div>
                </div>
                
                <button
                  onClick={() => handleRemoveItem(i)}
                  className="size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-95 transition-all text-zinc-600 hover:text-red-500 clay-card relative z-10"
                >
                  <span className="material-symbols-outlined text-xl">delete</span>
                </button>
              </motion.div>
            ))}
          </section>
        )}

        {/* UPSELL SECTION CLAY */}
        {suggestedMerchantProducts.length > 0 && (
          <section className="mt-14 mb-10">
             <div className="flex items-center justify-between mb-8 px-2">
                <h3 className="text-[12px] font-black text-white uppercase tracking-[0.25em] italic">Completa seu pedido?</h3>
                <span className="text-[9px] font-black text-yellow-400 bg-yellow-400/5 px-4 py-1.5 rounded-full border border-yellow-400/10 uppercase tracking-widest">{merchantName || "Loja"}</span>
             </div>
             
             <div className="flex gap-6 overflow-x-auto no-scrollbar -mx-6 px-6 pb-6">
                {suggestedMerchantProducts.map((product: any) => (
                  <motion.div 
                    key={product.id} 
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleAddToCart(product)}
                    className="flex-shrink-0 w-48 bg-zinc-900/60 rounded-[40px] p-4 flex flex-col gap-4 group transition-all cursor-pointer clay-card border border-white/5"
                  >
                     <div className="w-full h-28 rounded-[30px] overflow-hidden bg-zinc-950 relative shadow-inner">
                        <img src={product.img} className="size-full object-cover brightness-90 group-hover:brightness-110 transition-all duration-700" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                     </div>
                     <div className="px-2 pb-2">
                        <p className="text-[9px] font-black text-yellow-400/60 uppercase tracking-widest mb-1.5 truncate">{product.store || merchantName || "Loja"}</p>
                        <h5 className="text-[14px] font-black text-white leading-tight uppercase italic truncate mb-4">{product.name}</h5>
                        <div className="flex items-center justify-between">
                           <span className="text-base font-black text-white tracking-tighter italic">R$ {Number(product.price || 0).toFixed(2).replace(".", ",")}</span>
                           <div className="size-10 rounded-2xl bg-yellow-400 text-black flex items-center justify-center clay-card-yellow active:scale-90 transition-all">
                              <span className="material-symbols-outlined text-2xl font-black">add</span>
                           </div>
                        </div>
                     </div>
                  </motion.div>
                ))}
             </div>
          </section>
        )}

        {/* RESUMO DE VALORES CLAY */}
        {cart.length > 0 && (
          <section className="mt-4 space-y-5 p-7 bg-zinc-900/30 rounded-[45px] border border-white/5 clay-card mb-8">
            <div className="flex items-center justify-between px-1">
              <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] italic">Subtotal</span>
              <span className="text-white font-black text-sm tracking-tight italic">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
            </div>
            
            <div className="flex items-center justify-between px-1">
              <span className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] italic">Taxa de entrega</span>
              <div className="flex flex-col items-end">
                 {taxa === 0 ? (
                   <div className="flex flex-col items-end">
                     <span className="text-emerald-400 font-black text-xs tracking-widest uppercase italic bg-emerald-400/10 px-3 py-1 rounded-lg border border-emerald-400/10">Grátis</span>
                     {isIziBlack && (
                       <span className="text-[8px] text-zinc-600 font-black tracking-[0.2em] uppercase mt-1.5 italic">Benefício Izi Black</span>
                     )}
                   </div>
                 ) : (
                   <span className="text-white font-black text-sm tracking-tight italic">R$ {taxa.toFixed(2).replace(".", ",")}</span>
                 )}
              </div>
            </div>

            {/* CASHBACK INFO CLAY */}
            <div className="p-5 rounded-[32px] bg-zinc-950/50 border border-white/5 flex items-center justify-between group overflow-hidden relative clay-card">
              <div className="absolute inset-0 bg-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="size-11 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-xl italic clay-card-yellow shadow-[0_0_20px_rgba(255,215,9,0.2)]">Z</div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest leading-none mb-1.5 italic">Ganhe agora</span>
                  <span className="text-white font-black text-sm tracking-tight uppercase italic">{((subtotal * (isIziBlack ? (iziBlackRate || 1) : (iziCoinRate || 1))) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} IZI COINS</span>
                </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1.5 italic">Cashback {isIziBlack ? 'Black' : 'Base'}</span>
                <span className="text-emerald-400 font-black text-xs tracking-widest uppercase italic">{isIziBlack ? `${iziBlackRate || 1}%` : `${iziCoinRate || 1}%`}</span>
              </div>
            </div>
            
            <div className="pt-6 mt-2 border-t border-white/5 flex justify-between items-end px-1">
              <div className="flex flex-col gap-3">
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] font-black italic opacity-60">Entrega Estimada</p>
                 <div className="flex items-center gap-3 bg-zinc-950/50 px-4 py-2 rounded-2xl border border-white/5 clay-card w-fit">
                    <span className="material-symbols-outlined text-yellow-400 text-lg fill-1">schedule</span>
                    <span className="font-black text-white text-xs uppercase tracking-tight italic">35 - 45 min</span>
                 </div>
              </div>
               <div className="text-right">
                 <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-1 italic opacity-60">Total Final</p>
                 <p className="text-4xl font-black text-white leading-none tracking-tighter italic" style={{ textShadow: "0 0 30px rgba(255,255,255,0.15)" }}>
                   R$ {total.toFixed(2).replace(".", ",")}
                 </p>
               </div>
             </div>
          </section>
        )}

        {/* BOTÃO DE LIMPEZA CLAY */}
        {cart.length > 0 && (
          <button
            onClick={handleClearCart}
            className="mt-4 mb-12 flex items-center justify-center gap-4 py-5 w-full rounded-[30px] bg-zinc-900/20 border border-white/5 text-zinc-600 hover:text-red-500/80 transition-all active:scale-[0.98] group clay-card"
          >
            <div className="size-9 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-all clay-card shadow-none">
               <span className="material-symbols-outlined text-xl">delete_sweep</span>
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Esvaziar Sacola</span>
          </button>
        )}
      </main>

      {/* FOOTER FIXO CLAY PREMIUM */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 w-full px-6 pb-12 pt-8 bg-gradient-to-t from-black via-black/95 to-transparent z-[100] backdrop-blur-sm">
          <button
            onClick={() => navigateSubView("checkout")}
            className="w-full h-20 rounded-[35px] flex items-center justify-between px-10 transition-all active:scale-[0.97] relative overflow-hidden group clay-button"
            style={{
              boxShadow: "0 20px 50px -15px rgba(250, 204, 21, 0.4), inset 4px 4px 10px rgba(255, 255, 255, 0.5), inset -4px -4px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            <div className="flex flex-col items-start relative z-10">
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-black/50 leading-none mb-1.5 italic">Finalizar</span>
               <h3 className="text-black font-black text-base uppercase tracking-[0.1em] italic leading-none">Continuar</h3>
            </div>
            
            <div className="flex items-center gap-6 relative z-10">
               <div className="h-6 w-px bg-black/10" />
               <div className="flex flex-col items-end">
                  <span className="text-black font-black text-2xl italic tracking-tighter leading-none">R$ {total.toFixed(2).replace(".", ",")}</span>
                  <span className="text-[8px] font-black uppercase text-black/40 tracking-widest mt-1">Pague via Pix ou Cartão</span>
               </div>
               <div className="size-10 rounded-2xl bg-black/5 flex items-center justify-center border border-black/5">
                  <span className="material-symbols-outlined text-black font-black text-2xl">chevron_right</span>
               </div>
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </div>
      )}
    </div>
  );
};
