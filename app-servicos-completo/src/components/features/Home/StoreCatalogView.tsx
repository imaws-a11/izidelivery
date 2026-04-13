import { motion } from "framer-motion";


interface StoreCatalogViewProps {
  selectedShop: any;
  setSubView: (view: any) => void;
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  handleAddToCart: (item: any, e?: any) => void;
  navigateSubView: (view: any) => void;
  cart: any[];
  iziCoinRate?: number;
  isIziBlack?: boolean;
}

export const StoreCatalogView = ({
  selectedShop,
  setSubView,
  activeCategory,
  setActiveCategory,
  handleAddToCart,
  navigateSubView,
  cart,
  iziCoinRate = 0,
  isIziBlack = false,
}: StoreCatalogViewProps) => {
  const shop = selectedShop || { name: "Loja", rating: "5.0", time: "30 min", freeDelivery: false, img: "", banner: "", categories: [] };
  
  const isMarket = shop.type === "market" || shop.store_type === "market";

  const getCategoryAssets = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('todos') || n.includes('destaque')) return { icon: "storefront", img: "", color: "zinc-400" };
    if (n.includes('mercearia') || n.includes('despensa')) return { icon: "shopping_basket", img: "", color: "amber-500" };
    if (n.includes('congelado')) return { icon: "ac_unit", img: "", color: "blue-400" };
    if (n.includes('padaria') || n.includes('pães')) return { icon: "bakery_dining", img: "", color: "orange-400" };
    if (n.includes('higiene') || n.includes('banho')) return { icon: "clean_hands", img: "", color: "rose-400" };
    if (n.includes('limpeza')) return { icon: "cleaning_services", img: "", color: "cyan-400" };
    if (n.includes('pet')) return { icon: "pets", img: "", color: "emerald-400" };
    if (n.includes('sorvete') || n.includes('gelado') || n.includes('doces')) return { icon: "icecream", img: "", color: "sky-300" };
    if (n.includes('bebida')) return { icon: "local_bar", img: "", color: "purple-400" };
    if (n.includes('carne') || n.includes('açougue')) return { icon: "kebab_dining", img: "", color: "red-500" };
    if (n.includes('fruta') || n.includes('verdura') || n.includes('horti')) return { icon: "potted_plant", img: "", color: "green-500" };
    
    return { icon: "category", img: "", color: "zinc-400" };
  };

  const categorizeProduct = (p: any): string => {
    const text = (`${p.name} ${p.category || ""} ${p.desc || ""}`).toLowerCase();
    if (text.includes("limpador") || text.includes("limpeza") || text.includes("detergente") || text.includes("sabao") || text.includes("amaciante")) return "Limpeza";
    if (text.includes("higiene") || text.includes("shampoo") || text.includes("sabonete") || text.includes("dental") || text.includes("perfume") || text.includes("absorvente")) return "Higiene";
    if (text.includes("carne") || text.includes("frango") || text.includes("bovino") || text.includes("suino") || text.includes("linguiça") || text.includes("açougue")) return "Açougue";
    if (text.includes("fruta") || text.includes("verdura") || text.includes("legume") || text.includes("horti") || text.includes("ovo")) return "Hortifruti";
    if (text.includes("pao") || text.includes("bolo") || text.includes("biscoito") || text.includes("bolacha") || text.includes("padaria")) return "Padaria";
    if (text.includes("cerveja") || text.includes("refrigerante") || text.includes("suco") || text.includes("bebida") || text.includes("agua") || text.includes("vinho") || text.includes("energetico")) return "Bebidas";
    if (text.includes("congelado") || text.includes("pizza") || text.includes("lasanha") || text.includes("hamburguer") || text.includes("nuggets")) return "Congelados";
    if (text.includes("pet") || text.includes("cachorro") || text.includes("gato") || text.includes("racao")) return "Pet Shop";
    if (text.includes("sorvete") || text.includes("açai") || text.includes("doce") || text.includes("chocolate") || text.includes("bala")) return "Doces e Sorvetes";
    if (text.includes("arroz") || text.includes("feijao") || text.includes("oleo") || text.includes("açucar") || text.includes("cafe") || text.includes("leite") || text.includes("massa") || text.includes("molho")) return "Mercearia";
    return "Diversos";
  };

  const MARKET_SECTIONS = [
    "Todos", "Mercearia", "Hortifruti", "Açougue", "Padaria", "Bebidas", "Limpeza", "Higiene", "Congelados", "Pet Shop", "Doces e Sorvetes", "Diversos"
  ];

  const allCategoryNames = isMarket ? MARKET_SECTIONS : ["Todos", ...(shop.categories || []).map((c: any) => c.name)];
  
  const displayCategories = (() => {
    if (!isMarket) {
      return activeCategory === "Todos" || activeCategory === "Destaques"
        ? shop.categories || []
        : (shop.categories || []).filter((c: any) => c.name === activeCategory);
    }
    
    // Logica para Mercados: Agrupamento Virtual
    const allProducts = (shop.categories || []).flatMap((c: any) => c.items || []);
    
    if (activeCategory === "Todos") {
        const sections: Record<string, any[]> = {};
        allProducts.forEach(p => {
           const cat = categorizeProduct(p);
           if (!sections[cat]) sections[cat] = [];
           sections[cat].push(p);
        });
        
        // Ordenar seções para manter padrão
        return MARKET_SECTIONS
          .filter(name => name !== "Todos" && sections[name])
          .map(name => ({ name, items: sections[name] }));
    }
    
    const filteredItems = allProducts.filter(p => categorizeProduct(p) === activeCategory);
    return filteredItems.length > 0 ? [{ name: activeCategory, items: filteredItems }] : [];
  })();

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-5 py-4 pointer-events-none">
        <button onClick={() => setSubView("none")} className="pointer-events-auto flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <button onClick={() => navigateSubView("cart")} className="pointer-events-auto relative flex items-center justify-center w-10 h-10 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/10 active:scale-95 transition-all group">
          <span className="material-symbols-outlined group-hover:text-emerald-400 transition-colors">shopping_bag</span>
          {cart.length > 0 && <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black animate-pulse">{cart.length}</span>}
        </button>
      </nav>

      <header className="relative w-full h-80 overflow-hidden shrink-0">
        <img src={shop.banner || shop.img || ""} alt={shop.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
           <div className="size-24 rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl mb-4">
              <img src={shop.img} alt="Logo" className="size-full object-cover" />
           </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
      </header>

      <section className="px-5 mt-4 relative z-10 mb-2 flex flex-col items-center text-center">
        <h1 className="font-extrabold text-3xl tracking-tighter text-white mb-2 uppercase leading-tight italic">{shop.name}</h1>
        <div className="flex items-center gap-5 text-sm font-medium">
          <div className="flex items-center gap-1.5 text-yellow-400 bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            <span className="font-black">{shop.rating}</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            <span className="material-symbols-outlined text-[16px]">schedule</span>
            <span className="font-bold tracking-tight">{shop.time}</span>
          </div>
          <span className={`text-sm font-black uppercase tracking-widest ${shop.freeDelivery ? "text-emerald-400" : "text-zinc-500"}`}>
            {shop.freeDelivery || shop.free_delivery ? "Frete Grátis" : (shop.service_fee ? `R$ ${Number(shop.service_fee).toFixed(2)}` : "Frete Variável")}
          </span>
        </div>
      </section>

      {/* CARROSSEL DE CATEGORIAS VISUAIS */}
      <section className="mt-8 mb-6">
        <div className="px-5 mb-4 border-l-4 border-emerald-400 ml-5 text-left">
           <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Navegar por Seção</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 px-5">
          {allCategoryNames.map((cat, i) => {
            const assets = getCategoryAssets(cat);
            const isActive = activeCategory === cat || (activeCategory === "Destaques" && cat === "Todos");
            
            return (
              <motion.button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex-shrink-0 w-32 h-24 rounded-3xl overflow-hidden group transition-all border-2 ${isActive ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.2)]" : "border-white/5"}`}
              >
                 <img src={assets.img} alt={cat} className={`absolute inset-0 size-full object-cover transition-transform duration-700 ${isActive ? "scale-110 blur-[1px]" : "brightness-[0.4] group-hover:scale-110"}`} />
                 <div className={`absolute inset-0 ${isActive ? "bg-emerald-400/20" : "bg-gradient-to-t from-black/80 to-transparent"}`} />
                 <div className="relative h-full flex flex-col items-center justify-center gap-2 p-2">
                    <span className={`material-symbols-outlined text-2xl ${isActive ? "text-emerald-400" : "text-white"}`}>{assets.icon}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest text-center ${isActive ? "text-white" : "text-zinc-300"}`}>{cat}</span>
                 </div>
              </motion.button>
            );
          })}
        </div>
      </section>

      <main className="px-5 pt-4 space-y-12">
        {displayCategories.length === 0 && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="size-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
               <span className="material-symbols-outlined text-4xl text-zinc-500">inventory_2</span>
            </div>
            <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">Nenhum item em {activeCategory}</p>
          </div>
        )}
        {displayCategories.map((category: any) => (
          <section key={category.name}>
            <div className="flex items-center justify-between mb-8">
               <h2 className="font-black text-lg uppercase tracking-tighter text-white italic">{category.name}</h2>
               <div className="h-px flex-1 bg-gradient-to-r from-emerald-400/30 to-transparent ml-4" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {(category.items || []).map((item: any, idx: number) => (
                <motion.div 
                  key={item.id} 
                  initial={{ opacity: 0, y: 15 }} 
                  whileInView={{ opacity: 1, y: 0 }} 
                  transition={{ delay: idx * 0.05 }}
                  className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-[28px] p-3 flex flex-col gap-3 group relative active:scale-[0.98] transition-all"
                >
                  <div className="relative aspect-square rounded-[22px] overflow-hidden shadow-2xl bg-zinc-800">
                    <img src={item.img || ""} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        const btn = e.currentTarget;
                        btn.classList.add('scale-75', 'bg-emerald-500');
                        setTimeout(() => btn.classList.remove('scale-75', 'bg-emerald-500'), 200);
                        handleAddToCart(item, e);
                      }}
                      className="absolute bottom-2 right-2 w-10 h-10 rounded-2xl bg-emerald-400 text-black shadow-[0_4px_12px_rgba(52,211,153,0.4)] flex items-center justify-center active:scale-90 transition-all group/btn overflow-hidden"
                    >
                      <span className="material-symbols-outlined font-black text-[18px] z-10 transition-transform group-active/btn:rotate-12">shopping_cart</span>
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                    </button>
                  </div>
                  <div className="px-1 flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-black text-[11px] uppercase tracking-tight text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2 mb-1">{item.name}</h3>
                      <p className="text-zinc-500 text-[9px] font-medium leading-tight line-clamp-1">{item.desc}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-emerald-400 font-black text-sm tracking-tighter">R$ {Number(item.price).toFixed(2).replace(".", ",")}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {cart.length > 0 && (
        <div className="fixed bottom-24 left-0 w-full px-5 z-50 pointer-events-none">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-md mx-auto bg-zinc-950/90 backdrop-blur-3xl border border-white/5 rounded-[32px] px-6 py-4 flex items-center justify-between shadow-[0_30px_60px_rgba(0,0,0,0.8)] pointer-events-auto border-t-emerald-400/20">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-[0.3em] text-emerald-400/60 font-black mb-0.5">Sua Sacola</span>
              <span className="text-white font-black text-sm italic">{cart.length} {cart.length === 1 ? "Item" : "Itens"}</span>
              {iziCoinRate > 0 && (
                <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mt-0.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                  +{Math.floor(cart.reduce((a, b) => a + (b.price || 0), 0) * (isIziBlack ? iziCoinRate * 2 : iziCoinRate))} Coins
                </span>
              )}
            </div>
            <button onClick={() => navigateSubView("cart")}
              className="flex items-center gap-4 bg-emerald-400 text-black px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(52,211,153,0.3)] active:scale-95 transition-all">
              <span>Concluir Compra</span>
              <span className="bg-black/10 px-2 py-1 rounded-lg">R$ {cart.reduce((a: number, b: any) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}</span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
