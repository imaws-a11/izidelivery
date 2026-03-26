import React from "react";
import { motion } from "framer-motion";

interface CartViewProps {
  cart: any[];
  setCart: React.Dispatch<React.SetStateAction<any[]>>;
  setSubView: (view: string) => void;
  navigateSubView: (view: string) => void;
}

export const CartView: React.FC<CartViewProps> = ({ cart, setCart, setSubView, navigateSubView }) => {
  const subtotal: number = cart.reduce((a: number, b: any) => a + (Number(b.price) || 0), 0);
  const taxa: number = 0;
  const total: number = subtotal + taxa;

  if (cart.length === 0) {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col items-center justify-center gap-6">
        <span className="material-symbols-outlined text-6xl text-zinc-800">shopping_bag</span>
        <div className="text-center">
          <h2 className="text-xl font-black text-white mb-2">Sua sacola está vazia</h2>
          <p className="text-zinc-500 text-sm">Adicione itens para continuar</p>
        </div>
        <button
          onClick={() => setSubView("none")}
          className="bg-yellow-400 text-black font-black px-8 py-3 rounded-2xl uppercase tracking-wider active:scale-95 transition-all"
        >
          Explorar
        </button>
      </div>
    );
  }

  const handleRemoveItem = (index: number) => {
    setCart((prev: any[]) => {
      const c = [...prev];
      c.splice(index, 1);
      return c;
    });
  };

  const handleClearCart = () => {
    setCart([]);
  };

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <button onClick={() => setSubView("none")} className="active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base tracking-tight text-white uppercase">Sua Sacola</h1>
        </div>
        <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full">
          {cart.length} {cart.length === 1 ? "item" : "itens"}
        </span>
      </header>

      <main className="px-5 pt-6 flex flex-col gap-4">
        {/* ITENS */}
        {cart.map((item: any, i: number) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4"
          >
            <div className="w-16 h-16 rounded-xl bg-zinc-800 overflow-hidden shrink-0">
              {item.img && <img src={item.img} alt={item.name} className="w-full h-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-sm text-white truncate">{item.name}</h4>
              <p className="text-yellow-400 font-black text-sm mt-0.5">
                R$ {Number(item.price || 0).toFixed(2).replace(".", ",")}
              </p>
            </div>
            <button
              onClick={() => handleRemoveItem(i)}
              className="size-8 rounded-full bg-zinc-800 flex items-center justify-center active:scale-90 transition-all hover:bg-red-500/20"
            >
              <span className="material-symbols-outlined text-zinc-500 hover:text-red-400 text-sm transition-colors">
                close
              </span>
            </button>
          </motion.div>
        ))}

        {/* TOTAIS */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5 mt-2 space-y-3">
          {[
            { label: "Subtotal", value: `R$ ${subtotal.toFixed(2).replace(".", ",")}` },
            { label: "Taxa de entrega", value: taxa === 0 ? "Grátis" : `R$ ${taxa.toFixed(2)}`, green: taxa === 0 },
          ].map((row: any) => (
            <div key={row.label} className="flex justify-between items-center">
              <span className="text-zinc-400 text-sm">{row.label}</span>
              <span className={`text-sm font-bold ${row.green ? "text-emerald-400" : "text-white"}`}>{row.value}</span>
            </div>
          ))}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-800">
            <span className="text-white font-black uppercase tracking-wider">Total</span>
            <span
              className="text-yellow-400 font-black text-xl"
              style={{ textShadow: "0 0 15px rgba(255,215,9,0.4)" }}
            >
              R$ {total.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* LIMPAR */}
        <button
          onClick={handleClearCart}
          className="flex items-center justify-center gap-2 py-3 text-zinc-600 hover:text-red-400 transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">delete_outline</span>
          <span className="text-[11px] font-black uppercase tracking-widest">Limpar sacola</span>
        </button>
      </main>

      {/* FOOTER FIXO */}
      <div className="fixed bottom-0 left-0 w-full px-5 pb-8 pt-4 bg-black/95 backdrop-blur-xl border-t border-zinc-900 z-50">
        <button
          onClick={() => navigateSubView("checkout")}
          className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(255,215,9,0.2)]"
          style={{
            background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)",
            color: "#000",
            boxShadow: "0 0 30px rgba(255,215,9,0.15)",
          }}
        >
          Ir para Checkout — R$ {total.toFixed(2).replace(".", ",")}
        </button>
      </div>
    </div>
  );
};


