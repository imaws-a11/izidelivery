import { motion } from "framer-motion";


interface RestaurantMenuViewProps {
  selectedShop: any;
  setSubView: (view: any) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  handleAddToCart: (item: any) => void;
  navigateSubView: (view: any) => void;
  cart: any[];
}

export const RestaurantMenuView = ({
  selectedShop,
  setSubView,
  activeCategory,
  setActiveCategory,
  handleAddToCart,
  navigateSubView,
  cart,
}: RestaurantMenuViewProps) => {
  const shop = selectedShop || {
    name: "Gourmet Lab",
    rating: "4.9",
    tag: "Artesanal • Premium",
    time: "20-30 min",
    freeDelivery: false,
    img: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000",
    banner: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200",
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
          onClick={() => setSubView("explore_restaurants")}
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
            <div className="grid grid-cols-2 gap-4">
              {(category.items || []).map((item: any, idx: number) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900 rounded-2xl p-3 shadow-lg border border-zinc-800 flex flex-col gap-3 group relative active:scale-95 transition-all overflow-hidden"
                >
                   <div className="relative aspect-square rounded-xl overflow-hidden shrink-0 shadow-md">
                      <img src={item.img} alt={item.name} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                        className="absolute bottom-2 right-2 size-8 rounded-lg bg-yellow-400 text-black flex items-center justify-center transition-all shadow-md active:scale-90"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                      </button>
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[11px] font-black text-white leading-tight mb-1 truncate group-hover:text-yellow-400 transition-colors uppercase">{item.name}</h3>
                        <p className="text-[9px] text-zinc-500 font-medium line-clamp-1 mb-2">{item.desc}</p>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-sm font-black text-yellow-400">R$ {Number(item.price).toFixed(2).replace('.', ',')}</span>
                      </div>
                   </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-5 z-50 pointer-events-none">
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
