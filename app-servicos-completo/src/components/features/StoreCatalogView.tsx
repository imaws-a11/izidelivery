import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface StoreCatalogViewProps {
  selectedShop: any;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  cart: any[];
  handleAddToCart: (item: any) => void;
}

export const StoreCatalogView: React.FC<StoreCatalogViewProps> = ({
  selectedShop,
  activeCategory,
  setActiveCategory,
  setSubView,
  navigateSubView,
  cart,
  handleAddToCart
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  const shop = selectedShop || { name: "Loja", rating: "5.0", time: "30 min", freeDelivery: false, img: "", banner: "", categories: [] };
  const allCategoryNames = ["Destaques", ...(shop.categories || []).map((c: any) => c.name)];
  const displayCategories = activeCategory === "Destaques"
    ? shop.categories || []
    : (shop.categories || []).filter((c: any) => c.name === activeCategory);

  return (
    <div 
      ref={scrollContainerRef}
      className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10"
    >
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-4 pointer-events-none">
        <button onClick={() => setSubView("none")} className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button onClick={() => navigateSubView("cart")} className="pointer-events-auto relative flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined">shopping_bag</span>
          {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </nav>

      <header className="relative w-full h-72 overflow-hidden shrink-0">
        <img src={shop.banner || shop.img || "/images/banner-default.png"} alt={shop.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
      </header>

      <section className="px-5 -mt-8 relative z-10 mb-2">
        <h1 className="font-extrabold text-2xl tracking-tighter text-white mb-2 uppercase leading-tight">{shop.name}</h1>
        <div className="flex items-center gap-5 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-yellow-400">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-black">{shop.rating}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>{shop.time}</span>
          </div>
          <span className={shop.freeDelivery ? "text-yellow-400 font-bold text-sm" : "text-zinc-400 text-sm"}>
            {shop.freeDelivery ? "Entrega Grátis" : shop.fee}
          </span>
        </div>
      </section>

      <nav className="sticky top-0 z-40 mt-6 px-5 py-3 bg-black/90 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {allCategoryNames.map((cat) => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${activeCategory === cat ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,9,0.3)]" : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"}`}>
              {cat}
            </button>
          ))}
        </div>
      </nav>

      <main className="px-5 pt-8 space-y-12">
        {displayCategories.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3">
            <span className="material-symbols-outlined text-5xl text-zinc-800">storefront</span>
            <p className="text-zinc-600 text-sm font-bold uppercase tracking-widest">Cardápio em breve</p>
          </div>
        )}
        {displayCategories.map((category: any) => (
          <section key={category.name}>
            <h2 className="font-black text-base uppercase tracking-widest text-zinc-500 mb-6 border-l-4 border-yellow-400 pl-4">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(category.items || []).map((item: any, idx: number) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  className={`group relative flex flex-col gap-3 ${idx % 2 === 1 ? "md:mt-10" : ""}`}>
                  <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.02]">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <button onClick={() => handleAddToCart(item)}
                      className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-yellow-400 text-black shadow-[0_0_20px_rgba(255,215,9,0.4)] flex items-center justify-center active:scale-90 transition-all">
                      <span className="material-symbols-outlined font-bold">add</span>
                    </button>
                  </div>
                  <div className="px-1">
                    <div className="flex justify-between items-start mb-1 gap-3">
                      <h3 className="font-black text-base uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors leading-tight flex-1">{item.name}</h3>
                      {item.has_options ? (
                        <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                          Ver todos
                        </span>
                      ) : (
                        <span className="text-yellow-400 font-black text-sm whitespace-nowrap">R$ {Number(item.price).toFixed(2).replace(".", ",")}</span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-32 left-0 w-full px-5 z-50 pointer-events-none">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-zinc-950/95 backdrop-blur-2xl border border-white/5 rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Sacola</span>
              <span className="text-white font-black text-sm">{cart.length} {cart.length === 1 ? "item" : "itens"}</span>
            </div>
            <button onClick={() => navigateSubView("cart")}
              className="flex items-center gap-3 bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,9,0.2)] active:scale-95 transition-all">
              <span>Ver Sacola</span>
              <span>R$ {cart.reduce((a: number, b: any) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}</span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
