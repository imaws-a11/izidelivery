import React from 'react';
import { motion } from 'framer-motion';

interface RestaurantMenuViewProps {
  selectedShop: any;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  cart: any[];
  handleAddToCart: (item: any) => void;
}

export const RestaurantMenuView: React.FC<RestaurantMenuViewProps> = ({
  selectedShop,
  activeCategory,
  setActiveCategory,
  setSubView,
  navigateSubView,
  cart,
  handleAddToCart
}) => {
  const shop = selectedShop || {
    name: "Restaurante",
    rating: "5.0",
    tag: "",
    time: "-- min",
    freeDelivery: false,
    img: "",
    banner: "",
    categories: []
  };

  const allCategoryNames = ["Destaques", ...(shop.categories || []).map((c: any) => c.name)];

  const displayCategories = activeCategory === "Destaques"
    ? shop.categories || []
    : (shop.categories || []).filter((c: any) => c.name === activeCategory);

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">

      {/* FLOATING NAV */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-4 pointer-events-none">
        <button
          onClick={() => setSubView("restaurant_list")}
          className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex gap-3 pointer-events-auto">
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined">share</span>
          </button>
          <button className="flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
            <span className="material-symbols-outlined">favorite_border</span>
          </button>
        </div>
      </nav>

      {/* HERO */}
      <header className="relative w-full h-80 overflow-hidden shrink-0">
        <img src={shop.banner || shop.img} alt={shop.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent" />
      </header>

      {/* METADATA */}
      <section className="px-5 -mt-10 relative z-10 mb-2">
        <h1
          className="font-extrabold text-3xl tracking-tighter text-white mb-2 uppercase leading-tight"
          style={{ textShadow: "0 0 10px rgba(255,215,9,0.5), 0 0 20px rgba(255,215,9,0.3)" }}
        >
          {shop.name}
        </h1>
        <div className="flex items-center gap-5 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-yellow-400">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-black">{shop.rating}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span>{shop.time}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-zinc-400">delivery_dining</span>
            <span className={shop.freeDelivery ? "text-yellow-400 font-bold" : "text-zinc-400"}>
              {shop.freeDelivery ? "Grátis" : shop.fee}
            </span>
          </div>
        </div>
      </section>

      {/* CATEGORY TABS */}
      <nav className="sticky top-0 z-40 mt-8 px-5 py-3 bg-black/90 backdrop-blur-xl border-b border-zinc-900">
        <div className="flex gap-3 overflow-x-auto no-scrollbar">
          {allCategoryNames.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest whitespace-nowrap transition-all active:scale-95 ${
                activeCategory === cat
                  ? "bg-yellow-400 text-black shadow-[0_0_15px_rgba(255,215,9,0.3)]"
                  : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </nav>

      {/* MENU */}
      <main className="px-5 pt-8 space-y-12">
        {displayCategories.map((category: any) => (
          <section key={category.name}>
            <h2 className="font-black text-lg uppercase tracking-widest text-zinc-500 mb-8 border-l-4 border-yellow-400 pl-4">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {(category.items || []).map((item: any, idx: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`group relative flex flex-col gap-4 ${idx % 2 === 1 ? "md:mt-12" : ""}`}
                >
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover:scale-[1.02]">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                    <button
                      onClick={() => handleAddToCart(item)}
                      className="absolute bottom-5 right-5 w-14 h-14 rounded-2xl bg-yellow-400 text-black shadow-[0_0_20px_rgba(255,215,9,0.4)] flex items-center justify-center active:scale-90 transition-all"
                    >
                      <span className="material-symbols-outlined font-bold">add</span>
                    </button>
                  </div>
                  <div className="px-2">
                    <div className="flex justify-between items-start mb-1 gap-3">
                      <h3 className="font-black text-base uppercase tracking-tight text-white group-hover:text-yellow-400 transition-colors leading-tight flex-1">
                        {item.name}
                      </h3>
                      {item.has_options ? (
                        <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_rgba(255,215,9,0.1)]">
                          Ver todos
                        </span>
                      ) : (
                        <span className="text-yellow-400 font-black text-sm whitespace-nowrap" style={{ textShadow: "0 0 10px rgba(255,215,9,0.5)" }}>
                          R$ {item.price.toFixed(2).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-sm leading-relaxed max-w-[85%]">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-32 left-0 w-full px-5 z-50 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-zinc-950/95 backdrop-blur-2xl border border-white/5 rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Sua Sacola</span>
              <span className="text-white font-black text-sm">{cart.length} {cart.length === 1 ? "item" : "itens"}</span>
            </div>
            <button
              onClick={() => navigateSubView("cart")}
              className="flex items-center gap-3 bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,9,0.2)] active:scale-95 transition-all"
            >
              <span>Ver Sacola</span>
              <span style={{ textShadow: "0 0 10px rgba(255,215,9,0.5)" }}>
                R$ {cart.reduce((a: number, b: any) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}
              </span>
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
};
