import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { MerchantCard } from "../Establishment/MerchantCard";

interface MarketExploreViewProps {
  setSubView: (view: any) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  establishments: any[];
  onShopClick: (shop: any) => void;
}

export const MarketExploreView: React.FC<MarketExploreViewProps> = ({
  setSubView,
  searchQuery,
  setSearchQuery,
  cart,
  navigateSubView,
  establishments,
  onShopClick,
}) => {
  const filteredMarkets = useMemo(() => {
    const normalize = (s: string) => s ? s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '_') : "";
    
    return establishments.filter(shop => {
      const type = normalize(shop.type);
      const isMarketRelated = type.includes('mercado') || type.includes('market') || type.includes('mercearia') || type.includes('higiene') || type.includes('limpeza') || type.includes('sorvete');
      
      const matchesSearch = shop.name.toLowerCase().includes(searchQuery.toLowerCase());
      
      return isMarketRelated && matchesSearch;
    });
  }, [establishments, searchQuery]);

  return (
    <div className="absolute inset-0 z-[100] bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      {/* HEADER FIXO - ILHA FLUTUANTE */}
      <header className="fixed top-4 inset-x-4 z-[110] flex flex-col bg-black/60 backdrop-blur-3xl border border-white/5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSubView("none")} 
              className="size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800"
            >
              <span className="material-symbols-outlined text-white text-[22px]">arrow_back</span>
            </button>
            <div>
              <h1 className="text-base font-black tracking-tighter text-white leading-none uppercase italic">Izi Market</h1>
              <p className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.2em] mt-1.5 flex items-center gap-1.5">
                <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
                Mercados Próximos
              </p>
            </div>
          </div>
          <button 
            onClick={() => cart.length > 0 && navigateSubView("cart")} 
            className="group relative size-11 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-90 transition-all hover:bg-zinc-800"
          >
            <span className="material-symbols-outlined text-white text-[20px] group-hover:text-emerald-400 transition-colors">shopping_bag</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-black">
                {cart.length}
              </span>
            )}
          </button>
        </div>

        {/* BUSCA INTEGRADA */}
        <div className="px-5 pb-4">
           <div className="relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-emerald-400 transition-colors text-lg">search</span>
              </div>
              <input 
                type="text"
                placeholder="O que você precisa hoje?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl pl-12 pr-4 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-emerald-400/30 transition-all"
              />
           </div>
        </div>
      </header>

      <main className="flex flex-col pt-44 px-4">
        {/* LISTA DE MERCADOS */}
        <section className="space-y-6">
           <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Todos os Mercados</h3>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1.5">{filteredMarkets.length} Lojas Encontradas</p>
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {filteredMarkets.length > 0 ? (
                filteredMarkets.map((shop, i) => (
                  <motion.div
                    key={shop.id || i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                <div className="py-20 flex flex-col items-center justify-center gap-6 opacity-30">
                   <div className="size-20 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-4xl">storefront</span>
                   </div>
                   <p className="text-xs font-black uppercase tracking-[0.2em]">Nenhum mercado nesta região</p>
                </div>
              )}
           </div>
        </section>
      </main>
    </div>
  );
};
