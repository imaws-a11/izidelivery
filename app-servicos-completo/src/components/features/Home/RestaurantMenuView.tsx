import { motion } from "framer-motion";


interface RestaurantMenuViewProps {
  selectedShop: any;
  setSubView: (view: any) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  handleAddToCart: (item: any, e?: any) => void;
  navigateSubView: (view: any) => void;
  cart: any[];
  iziCoinRate?: number;
  iziBlackRate?: number;
  isIziBlack?: boolean;
}

export const RestaurantMenuView = ({
  selectedShop,
  setSubView,
  activeCategory,
  setActiveCategory,
  handleAddToCart,
  navigateSubView,
  cart,
  iziCoinRate = 0,
  iziBlackRate = 0,
  isIziBlack = false,
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
                  className="bg-zinc-800 rounded-[28px] p-4 shadow-[8px_8px_16px_rgba(0,0,0,0.4),-4px_-4px_12px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] flex flex-col gap-4 group relative active:scale-95 transition-all overflow-hidden"
                >
                   <div className="relative aspect-square rounded-[22px] overflow-hidden shrink-0 shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.1)]">
                      <img 
                        src={item.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"} 
                        alt={item.name} 
                        className="size-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      {/* Carrinho Clay Button */}
                      <motion.button 
                        whileTap={{ scale: 0.8 }}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          handleAddToCart(item, e); 
                        }}
                        className="absolute bottom-2 right-2 size-11 rounded-[18px] bg-yellow-400 text-black flex items-center justify-center transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] group/btn overflow-hidden"
                      >
                        <motion.span 
                          initial={false}
                          className="material-symbols-outlined text-[20px] z-10 font-black"
                        >
                          shopping_cart
                        </motion.span>
                      </motion.button>
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h3 className="text-[12px] font-black text-white leading-tight mb-1 truncate group-hover:text-yellow-400 transition-colors uppercase tracking-tight">{item.name}</h3>
                        <p className="text-[9px] text-zinc-500 font-bold line-clamp-1 mb-2 uppercase tracking-tighter">{item.desc}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                         <div className="bg-zinc-900/50 px-3 py-1.5 rounded-xl shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05),inset_-1px_-1px_2px_rgba(0,0,0,0.3)]">
                            <span className="text-[13px] font-black text-yellow-400 tracking-tighter">R$ {Number(item.price).toFixed(2).replace('.', ',')}</span>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* FLOATING CART BAR */}
      {cart.length > 0 && (() => {
        const subtotal = cart.reduce((sum, item) => {
          const basePrice = Number(item.price) || 0;
          const addonsPrice = Array.isArray(item.addonDetails) 
            ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
            : 0;
          return sum + basePrice + addonsPrice;
        }, 0);

        const cashbackRate = isIziBlack ? iziBlackRate : iziCoinRate;
        const estimatedCashback = (subtotal * (cashbackRate / 100));

        return (
          <div className="fixed bottom-24 left-0 w-full px-5 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto bg-zinc-950/95 backdrop-blur-2xl border border-white/5 rounded-3xl px-5 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
            >
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">Sua Sacola</span>
                <span className="text-white font-black text-sm">
                  {cart.length} {cart.length === 1 ? "item" : "itens"} • R$ {subtotal.toFixed(2).replace(".", ",")}
                </span>
                {(cashbackRate > 0) && (
                  <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="izi-coin-symbol size-3.5 bg-yellow-500 text-black rounded-full flex items-center justify-center text-[9px] not-italic shadow-[0_0_10px_rgba(250,204,21,0.4)]">Z</span>
                    +{estimatedCashback.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} IZI COINS
                  </span>
                )}
              </div>
              <button
                onClick={() => navigateSubView("cart")}
                className="flex items-center gap-3 bg-yellow-400 text-black px-5 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-[0_0_20px_rgba(255,215,9,0.2)] active:scale-95 transition-all shrink-0"
              >
                <span>Ver Sacola</span>
                <span style={{ textShadow: "0 0 10px rgba(255,215,9,0.5)" }}>
                  R$ {subtotal.toFixed(2).replace(".", ",")}
                </span>
              </button>
            </motion.div>
          </div>
        );
      })()}

    </div>
  );
};
