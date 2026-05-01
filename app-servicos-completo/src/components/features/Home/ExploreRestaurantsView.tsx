import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../contexts/AppContext";
import { Icon } from "../../common/Icon";
import { MerchantCard } from "../Establishment/MerchantCard";

interface ExploreRestaurantsViewProps {
  setSubView: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  foodCategories: any[];
  availableCoupons: any[];
  establishments: any[];
  onShopClick: (shop: any) => void;
  copiedCoupon: string | null;
  setCopiedCoupon: (c: string | null) => void;
  initialCategory?: string;
  isIziBlackMembership?: boolean;
}

export const ExploreRestaurantsView = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  navigateSubView,
  foodCategories,
  availableCoupons,
  establishments,
  onShopClick,
  copiedCoupon,
  setCopiedCoupon,
  initialCategory = "Todos",
  isIziBlackMembership = false
}: ExploreRestaurantsViewProps) => {
  const { activeService } = useApp();
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 40);
  };

  const categories = useMemo(() => [
    { id: "Todos", label: "Tudo", img: "https://cdn-icons-png.flaticon.com/512/3132/3132693.png" },
    { id: "Burgers", label: "Burgers", img: "https://cdn-icons-png.flaticon.com/512/3081/3081986.png" },
    { id: "Pizza", label: "Pizza", img: "https://cdn-icons-png.flaticon.com/512/3132/3132721.png" },
    { id: "Japonesa", label: "Sushi", img: "https://cdn-icons-png.flaticon.com/512/3132/3132733.png" },
    { id: "Saudável", label: "Fit", img: "https://cdn-icons-png.flaticon.com/512/3132/3132688.png" },
    { id: "Doces", label: "Doces", img: "https://cdn-icons-png.flaticon.com/512/3132/3132715.png" },
  ], []);

  const filteredShops = useMemo(() => {
    return establishments.filter(shop => {
      const isFood = shop.type === "restaurant" || shop.type === "food";
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === "Todos" || 
                        shop.category?.toLowerCase().includes(activeCategory.toLowerCase()) || 
                        shop.tags?.some((t: string) => t.toLowerCase().includes(activeCategory.toLowerCase()));
      return isFood && matchesSearch && matchesCat;
    });
  }, [establishments, searchQuery, activeCategory]);

  const featuredShops = useMemo(() => filteredShops.slice(0, 3), [filteredShops]);
  const restShops = useMemo(() => filteredShops.slice(3), [filteredShops]);

  return (
    <div className="absolute inset-0 z-[150] bg-[#F8F9FA] flex flex-col overflow-hidden font-sans select-none">
      
      {/* ── HEADER FLUTUANTE ── */}
      <header className={`fixed top-0 left-0 right-0 z-[160] px-6 pt-12 pb-4 transition-all duration-500 ${isScrolled ? 'bg-white/90 backdrop-blur-2xl shadow-xl shadow-zinc-200/50' : 'bg-transparent'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setSubView("none")}
              className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isScrolled ? 'bg-zinc-100 text-zinc-900' : 'bg-white/20 backdrop-blur-md text-zinc-900 shadow-sm border border-white/40'}`}
            >
              <Icon name="arrow_back" size={24} />
            </motion.button>
            <AnimatePresence>
              {isScrolled && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <h1 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase italic">{activeService || "Explorar"}</h1>
                  <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Os melhores da cidade</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-3">
             <motion.button 
               whileTap={{ scale: 0.9 }}
               className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isScrolled ? 'bg-zinc-100 text-zinc-900' : 'bg-white/20 backdrop-blur-md text-zinc-900 shadow-sm border border-white/40'}`}
             >
                <Icon name="tune" size={20} />
             </motion.button>
          </div>
        </div>
      </header>

      {/* ── CORPO PRINCIPAL SCROLLABLE ── */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto no-scrollbar pt-28"
      >
        {/* HERO SECTION */}
        {!isScrolled && (
          <section className="px-6 mb-10">
             <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-[44px] font-black text-zinc-900 tracking-tighter leading-[0.9] uppercase italic"
             >
               O que vamos <br /> <span className="text-yellow-500">comer</span> hoje?
             </motion.h1>
             <p className="text-zinc-400 font-bold text-sm mt-4 uppercase tracking-widest">Descubra os melhores sabores da sua região</p>
          </section>
        )}

        {/* BUSCA ESTILO NEUMORPHIC */}
        <section className="px-6 mb-10">
           <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-yellow-500 transition-colors">
                <Icon name="search" size={24} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Busque por prato ou restaurante..."
                className="w-full h-20 bg-white border-2 border-transparent rounded-[32px] pl-16 pr-8 text-lg font-bold focus:outline-none focus:border-yellow-400 transition-all shadow-2xl shadow-zinc-200/50 placeholder:text-zinc-300"
              />
           </div>
        </section>

        {/* CATEGORIAS 3D / IMERSIVAS */}
        <section className="mb-12">
           <div className="flex gap-5 overflow-x-auto no-scrollbar px-6 pb-4">
              {categories.map((cat) => (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center gap-4 min-w-[90px]"
                >
                   <div className={`size-20 rounded-[30px] flex items-center justify-center transition-all relative
                     ${activeCategory === cat.id 
                       ? "bg-zinc-900 text-yellow-400 shadow-[0_15px_30px_rgba(0,0,0,0.2)] rotate-3" 
                       : "bg-white text-zinc-400 shadow-xl shadow-zinc-100 border border-zinc-50"}`}
                   >
                      <img src={cat.img} alt={cat.label} className="size-12 object-contain" />
                      {activeCategory === cat.id && (
                        <motion.div 
                          layoutId="activeCircle"
                          className="absolute -bottom-1 -right-1 size-6 bg-yellow-400 rounded-full flex items-center justify-center"
                        >
                           <Icon name="check" size={14} className="text-black font-black" />
                        </motion.div>
                      )}
                   </div>
                   <span className={`text-[12px] font-black uppercase tracking-tighter transition-colors
                     ${activeCategory === cat.id ? "text-zinc-900" : "text-zinc-400"}`}>
                     {cat.label}
                   </span>
                </motion.button>
              ))}
           </div>
        </section>

        {/* FEATURED / OS FAVORITOS */}
        {activeCategory === "Todos" && featuredShops.length > 0 && (
          <section className="mb-12">
             <div className="flex items-center justify-between px-6 mb-6">
                <h2 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter">Famosos no Izi</h2>
                <button className="text-yellow-600 font-black text-[10px] uppercase tracking-widest">Ver ranking</button>
             </div>
             <div className="flex gap-6 overflow-x-auto no-scrollbar px-6">
                {featuredShops.map((shop, i) => (
                  <motion.div 
                    key={shop.id || i}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onShopClick(shop)}
                    className="min-w-[280px] h-[340px] bg-white rounded-[44px] overflow-hidden shadow-2xl shadow-zinc-200/50 relative border border-zinc-50 cursor-pointer"
                  >
                     <img src={shop.image_url || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=500&auto=format&fit=crop"} className="size-full object-cover" alt={shop.name} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Top 1</div>
                           <div className="flex items-center gap-1 text-white text-[12px] font-bold">
                              <Icon name="star" size={12} className="text-yellow-400 fill-1" />
                              {shop.rating || "4.9"}
                           </div>
                        </div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">{shop.name}</h3>
                        <p className="text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">{shop.delivery_time || "25-35"} min • {shop.delivery_fee === 0 ? "Entrega Grátis" : `R$ ${shop.delivery_fee}`}</p>
                     </div>
                  </motion.div>
                ))}
             </div>
          </section>
        )}

        {/* LISTAGEM PRINCIPAL */}
        <section className="px-6 pb-40">
           <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase italic">
                  {activeCategory === "Todos" ? `${activeService || "Restaurantes"} Próximos` : `Especialistas em ${activeCategory}`}
                </h3>
                <div className="w-12 h-1.5 bg-yellow-400 rounded-full mt-1" />
              </div>
           </div>

           <div className="space-y-8">
              {filteredShops.length > 0 ? (
                filteredShops.map((shop, i) => (
                  <motion.div
                    key={shop.id || i}
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <MerchantCard 
                      shop={shop}
                      onClick={() => onShopClick(shop)}
                      index={i}
                    />
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-300 gap-6">
                   <div className="size-24 rounded-full bg-zinc-100 flex items-center justify-center">
                     <Icon name="search_off" size={48} className="opacity-20" />
                   </div>
                   <p className="font-black uppercase text-[12px] tracking-widest text-center">Nenhum restaurante encontrado <br /> nesta categoria</p>
                   <button 
                     onClick={() => { setActiveCategory("Todos"); setSearchQuery(""); }}
                     className="bg-zinc-900 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
                   >
                     Resetar Filtros
                   </button>
                </div>
              )}
           </div>
        </section>
      </div>

      {/* ── BOTÃO DE CARRINHO PREMIUM ── */}
      <AnimatePresence>
        {cart.length > 0 && (
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
                    <p className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Finalizar Pedido</p>
                 </div>
              </div>
              
              <div className="relative z-10 flex items-center gap-4">
                 <span className="text-white/30 text-xs font-bold uppercase tracking-widest">Izi Flash</span>
                 <Icon name="arrow_forward_ios" size={18} className="text-white" />
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
