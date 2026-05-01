import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";

interface RestaurantMenuViewProps {
  selectedShop: any;
  setSubView: (view: any) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  handleAddToCart: (item: any, e?: any) => void;
  handleRemoveOneFromCart: (productId: string) => void;
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
  handleRemoveOneFromCart,
  navigateSubView,
  cart,
  iziCoinRate = 0,
  iziBlackRate = 0,
  isIziBlack = false,
}: RestaurantMenuViewProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 180);
  };

  const allCategoryNames = ["Destaques", ...(shop.categories || []).map((c: any) => c.name)];

  const displayCategories = activeCategory === "Destaques"
    ? shop.categories || []
    : (shop.categories || []).filter((c: any) => c.name === activeCategory);

  return (
    <div className="absolute inset-0 z-[150] bg-[#F8F9FA] flex flex-col overflow-hidden font-sans select-none">
      
      {/* ── HEADER FLUTUANTE ── */}
      <header className={`fixed top-0 left-0 right-0 z-[160] px-6 pt-12 pb-4 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-2xl shadow-xl shadow-zinc-200/50' : 'bg-transparent'}`}>
        <div className="flex items-center justify-between">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubView("none")}
            className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isScrolled ? 'bg-zinc-100 text-zinc-900' : 'bg-black/20 backdrop-blur-md text-white shadow-sm border border-white/20'}`}
          >
            <Icon name="arrow_back" size={24} />
          </motion.button>
          
          <AnimatePresence>
            {isScrolled && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-lg font-black text-zinc-900 tracking-tighter uppercase italic leading-none">{shop.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1 text-yellow-500 text-[10px] font-black">
                    <Icon name="star" size={10} className="fill-1" />
                    {shop.rating}
                  </div>
                  <span className="text-zinc-300">•</span>
                  <span className="text-zinc-400 text-[10px] font-bold uppercase">{shop.time}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-2">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isScrolled ? 'bg-zinc-100 text-zinc-900' : 'bg-black/20 backdrop-blur-md text-white shadow-sm border border-white/20'}`}
            >
              <Icon name="favorite" size={20} />
            </motion.button>
          </div>
        </div>
      </header>

      {/* ── CORPO PRINCIPAL SCROLLABLE ── */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar"
      >
        {/* HERO SECTION */}
        <section className="relative w-full h-[320px] overflow-hidden">
           <img src={shop.banner || shop.img} className="size-full object-cover" alt={shop.name} />
           <div className="absolute inset-0 bg-gradient-to-t from-[#F8F9FA] via-[#F8F9FA]/20 to-transparent" />
        </section>

        {/* SHOP INFO CARD */}
        <section className="px-6 -mt-20 relative z-10 mb-10">
           <div className="bg-white rounded-[44px] p-8 shadow-2xl shadow-zinc-200/50 border border-white">
              <div className="flex items-center justify-between mb-4">
                 <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase italic leading-none">{shop.name}</h1>
                 {shop.isOpen ? (
                   <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Aberto</div>
                 ) : (
                   <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Fechado</div>
                 )}
              </div>
              
              <div className="flex items-center gap-6">
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Avaliação</span>
                    <div className="flex items-center gap-1.5 text-zinc-900 font-black">
                       <Icon name="star" size={16} className="text-yellow-400 fill-1" />
                       {shop.rating}
                    </div>
                 </div>
                 <div className="w-px h-8 bg-zinc-100" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Tempo</span>
                    <div className="flex items-center gap-1.5 text-zinc-900 font-black">
                       <Icon name="schedule" size={16} className="text-zinc-400" />
                       {shop.time}
                    </div>
                 </div>
                 <div className="w-px h-8 bg-zinc-100" />
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-1">Entrega</span>
                    <div className="flex items-center gap-1.5 text-zinc-900 font-black">
                       <Icon name="delivery_dining" size={16} className="text-zinc-400" />
                       {shop.freeDelivery ? "Grátis" : shop.fee || "Consultar"}
                    </div>
                 </div>
              </div>

              {!shop.isOpen && (
                <div className="mt-6 p-4 rounded-3xl bg-red-50 flex items-center gap-4 border border-red-100">
                   <div className="size-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-500">
                      <Icon name="error" size={20} />
                   </div>
                   <p className="text-[11px] font-black text-red-900 uppercase tracking-tighter">O lojista não está aceitando pedidos no momento.</p>
                </div>
              )}
           </div>
        </section>

        {/* CATEGORY TABS STICKY */}
        <nav className="sticky top-28 z-[155] px-6 py-4 bg-[#F8F9FA]/80 backdrop-blur-xl mb-4">
           <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
              {allCategoryNames.map((cat, i) => (
                <motion.button
                  key={cat || `cat-${i}`}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap
                    ${activeCategory === cat 
                      ? "bg-zinc-900 text-white shadow-xl shadow-zinc-200" 
                      : "bg-white text-zinc-400 border border-zinc-100 shadow-sm"}`}
                >
                  {cat}
                </motion.button>
              ))}
           </div>
        </nav>

        {/* PRODUCT LIST */}
        <main className="px-6 pb-40 space-y-12">
           {displayCategories.map((category: any, idx: number) => (
             <section key={category.id || category.name || `section-${idx}`}>
                <div className="flex items-center gap-3 mb-8">
                   <div className="w-1.5 h-6 bg-yellow-400 rounded-full" />
                   <h2 className="text-2xl font-black text-zinc-900 uppercase italic tracking-tighter">{category.name}</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                   {(category.items || []).map((item: any, i: number) => {
                     const itemQty = cart.filter(c => c.id === item.id).length;
                     return (
                       <motion.div
                         key={item.id || i}
                         initial={{ opacity: 0, y: 20 }}
                         whileInView={{ opacity: 1, y: 0 }}
                         viewport={{ once: true }}
                         transition={{ delay: i * 0.05 }}
                         onClick={(e) => { e.stopPropagation(); handleAddToCart(item, e as any); }}
                         className="bg-white rounded-[32px] p-4 flex gap-6 shadow-xl shadow-zinc-200/50 border border-white hover:border-zinc-100 transition-all cursor-pointer relative overflow-hidden group"
                       >
                          <div className="size-32 rounded-[24px] overflow-hidden shrink-0 bg-zinc-100">
                             <img src={item.img || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.name} />
                          </div>

                          <div className="flex-1 flex flex-col justify-center min-w-0">
                             <h3 className="text-lg font-black text-zinc-900 uppercase italic tracking-tighter leading-tight mb-1 truncate">{item.name}</h3>
                             <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-tighter line-clamp-2 mb-4 leading-tight">{item.desc || "Experimente nosso prato especial feito com ingredientes selecionados."}</p>
                             
                             <div className="flex items-center justify-between mt-auto">
                                <div className="flex flex-col">
                                   {item.oldPrice && (
                                     <span className="text-[10px] text-zinc-300 line-through font-black italic">R$ {Number(item.oldPrice).toFixed(2).replace('.', ',')}</span>
                                   )}
                                   <span className="text-xl font-black text-zinc-900 tracking-tighter">R$ {Number(item.price).toFixed(2).replace('.', ',')}</span>
                                </div>

                                {shop.isOpen && (
                                  <div className="flex items-center gap-3">
                                     {itemQty > 0 ? (
                                       <div className="flex items-center gap-3 bg-zinc-900 text-white p-1.5 rounded-2xl shadow-lg">
                                          <motion.button 
                                            whileTap={{ scale: 0.8 }}
                                            onClick={(e) => { e.stopPropagation(); handleRemoveOneFromCart(item.id); }}
                                            className="size-10 rounded-xl bg-white/10 flex items-center justify-center"
                                          >
                                            <Icon name="remove" size={18} />
                                          </motion.button>
                                          <span className="font-black italic text-lg px-2">{itemQty}</span>
                                          <motion.button 
                                            whileTap={{ scale: 0.8 }}
                                            onClick={(e) => { e.stopPropagation(); handleAddToCart(item, e); }}
                                            className="size-10 rounded-xl bg-yellow-400 text-black flex items-center justify-center"
                                          >
                                            <Icon name="add" size={18} />
                                          </motion.button>
                                       </div>
                                     ) : (
                                       <motion.button
                                         whileTap={{ scale: 0.9 }}
                                         onClick={(e) => { e.stopPropagation(); handleAddToCart(item, e); }}
                                         className="size-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-lg active:bg-yellow-400 active:text-black transition-colors"
                                       >
                                          <Icon name="add" size={24} />
                                       </motion.button>
                                     )}
                                  </div>
                                )}
                             </div>
                          </div>
                       </motion.div>
                     );
                   })}
                </div>
             </section>
           ))}
        </main>
      </div>

      {/* ── BOTÃO DE CARRINHO PREMIUM ── */}
      <AnimatePresence>
        {cart.length > 0 && (() => {
          const subtotal = cart.reduce((sum, item) => {
            const basePrice = Number(item.price) || 0;
            const addonsPrice = Array.isArray(item.addonDetails) 
              ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
              : 0;
            return sum + basePrice + addonsPrice;
          }, 0);

          return (
            <motion.div 
              initial={{ y: 150 }}
              animate={{ y: 0 }}
              exit={{ y: 150 }}
              className="fixed bottom-8 inset-x-6 z-[170]"
            >
              <button 
                onClick={() => navigateSubView("cart")}
                className="w-full h-24 bg-zinc-900 rounded-[40px] flex items-center justify-between px-10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-[85%] transition-transform opacity-10" />
                
                <div className="flex items-center gap-6 relative z-10">
                   <div className="size-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-400/20">
                     {cart.length}
                   </div>
                   <div className="text-left">
                      <p className="text-white font-black text-lg uppercase tracking-tighter leading-none italic">Ver Sacola</p>
                      <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Total: R$ {subtotal.toFixed(2).replace(".", ",")}</p>
                   </div>
                </div>
                
                <div className="relative z-10 flex items-center gap-4">
                   <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Izi Flash</span>
                   <Icon name="arrow_forward_ios" size={18} className="text-white" />
                </div>
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
};
