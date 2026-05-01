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

  const handleRemoveItem = (index: number) => {
    setCart((prev: any[]) => {
      const c = [...prev];
      c.splice(index, 1);
      return c;
    });
  };

  if (cart.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-center p-10 overflow-hidden">
        <div className="size-48 bg-zinc-50 rounded-full flex items-center justify-center mb-8 border border-zinc-100">
           <span className="material-symbols-rounded text-8xl text-zinc-200">shopping_bag</span>
        </div>
        <h2 className="text-2xl font-black text-zinc-900 mb-2">Sua sacola está vazia</h2>
        <p className="text-zinc-500 text-center mb-10 max-w-[240px]">Explore restaurantes e mercados para adicionar itens aqui.</p>
        <button
          onClick={() => setSubView("none")}
          className="bg-yellow-400 text-black font-black px-12 py-4 rounded-2xl shadow-xl shadow-yellow-100 active:scale-95 transition-all"
        >
          Ir para a Home
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-white text-zinc-900 flex flex-col overflow-hidden">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 border-b border-zinc-100">
        <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-50 flex items-center justify-center">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <div className="flex flex-col">
          <h1 className="font-black text-xl tracking-tight leading-none uppercase">Sacola</h1>
          <p className="text-[11px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">{merchantName || "Loja"}</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        {/* LISTA DE ITENS */}
        <section className="space-y-6">
          {cart.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-4 pb-6 border-b border-zinc-50 last:border-0">
               <div className="size-16 rounded-2xl bg-zinc-50 border border-zinc-100 overflow-hidden shrink-0">
                  {item.img && <img src={item.img} alt={item.name} className="size-full object-cover" />}
               </div>
               
               <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                     <h4 className="font-bold text-zinc-900 text-base leading-tight mb-1 truncate">{item.name}</h4>
                     <span className="font-black text-zinc-900 text-sm">R$ {getItemTotal(item).toFixed(2).replace(".", ",")}</span>
                  </div>
                  
                  {getAddonDetails(item).length > 0 && (
                    <div className="mb-2">
                       {getAddonDetails(item).map((addon: any, ai: number) => (
                         <p key={ai} className="text-[12px] text-zinc-400 font-medium">
                           {addon.name} x{addon.quantity}
                         </p>
                       ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3">
                     <button 
                        onClick={() => handleRemoveItem(i)}
                        className="text-[11px] font-black text-yellow-600 uppercase tracking-widest"
                     >
                        Remover
                     </button>
                     <button className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Editar</button>
                  </div>
               </div>
            </div>
          ))}
        </section>

        {/* RESUMO DE VALORES */}
        <section className="mt-10 space-y-4 pt-8 border-t-8 border-zinc-50 -mx-5 px-5">
           <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="text-zinc-900 font-bold">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
           </div>
           <div className="flex items-center justify-between">
              <span className="text-zinc-500 font-medium">Taxa de entrega</span>
              <span className={taxa === 0 ? "text-emerald-600 font-bold" : "text-zinc-900 font-bold"}>
                 {taxa === 0 ? "Grátis" : `R$ ${taxa.toFixed(2).replace(".", ",")}`}
              </span>
           </div>
           <div className="flex items-center justify-between pt-4 border-t border-zinc-50">
              <span className="text-zinc-900 font-black text-lg">Total</span>
              <span className="text-zinc-900 font-black text-lg">R$ {total.toFixed(2).replace(".", ",")}</span>
           </div>
        </section>

        <button
          onClick={handleClearCart}
          className="mt-12 mb-20 w-full py-4 text-zinc-400 font-bold text-sm uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          Limpar Sacola
        </button>
      </main>

      {/* FOOTER FIXO */}
      <div className="p-5 border-t border-zinc-100 bg-white">
        <button
          onClick={() => navigateSubView("checkout")}
          className="w-full h-16 bg-yellow-400 rounded-2xl flex items-center justify-center gap-4 shadow-xl shadow-yellow-100 active:scale-95 transition-all"
        >
           <span className="text-black font-black text-lg">Escolher forma de pagamento</span>
        </button>
      </div>
    </div>
  );
};
