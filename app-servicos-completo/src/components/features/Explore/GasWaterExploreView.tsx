import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../../contexts/AppContext';
import { Icon } from '../../common/Icon';
import { MerchantCard } from '../Establishment/MerchantCard';
import { ExploreBanners } from '../../common/ExploreBanners';

interface GasWaterExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
}

export const GasWaterExploreView: React.FC<GasWaterExploreViewProps> = ({ 
  onBack, 
  onShopClick = () => {}, 
  exploreBanners = [] 
}) => {
  const { ESTABLISHMENTS, activeService, navigateSubView, cart } = useApp();
  const establishments = Array.isArray(ESTABLISHMENTS) ? ESTABLISHMENTS : [];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Todos");

  const topServices = [
    { label: "Restaurantes", icon: "restaurant" },
    { label: "Mercados", icon: "shopping_cart" },
    { label: "Farmácias", icon: "medical_services" },
    { label: "Bebidas", icon: "local_bar" },
    { label: "Gás e Água", icon: "local_fire_department" },
    { label: "Petshop", icon: "pets" },
  ];

  const gasCategories = [
    { id: "Todos", label: "Todos", icon: "grid_view" },
    { id: "Gás", label: "Gás de Cozinha", icon: "propane_tank" },
    { id: "Água", label: "Água Mineral", icon: "water_drop" },
    { id: "Acessórios", label: "Acessórios", icon: "settings_input_component" },
  ];

  const filteredShops = useMemo(() => {
    return establishments.filter(shop => {
      const isGasWater = shop.type?.toLowerCase() === 'gas' || 
                         shop.category?.toLowerCase().includes('gás') || 
                         shop.category?.toLowerCase().includes('água');
      
      const matchesSearch = (shop.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTab = activeTab === "Todos" || 
                         shop.category?.toLowerCase().includes(activeTab.toLowerCase());

      return isGasWater && matchesSearch && matchesTab;
    });
  }, [establishments, searchQuery, activeTab]);

  const featuredShops = useMemo(() => filteredShops.slice(0, 3), [filteredShops]);

  return (
    <div className="absolute inset-0 z-[140] bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar font-sans select-none">
      
      {/* HEADER PREMIUM IDENTICO AO ECOSSISTEMA */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-6 py-6 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-rounded text-zinc-900">arrow_back_ios_new</span>
        </button>
        
        <div className="flex-1 relative">
          <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-rounded text-zinc-400">search</span>
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar Gás ou Água"
            className="w-full h-14 bg-zinc-50 rounded-[20px] pl-14 pr-6 text-sm font-black uppercase tracking-tighter focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-100"
          />
        </div>
      </header>

      {/* SUB-HEADER TABS (NAVEGAÇÃO ENTRE SERVIÇOS) */}
      <section className="px-6 py-2 border-b border-zinc-50">
         <div className="flex gap-2 overflow-x-auto no-scrollbar pb-4">
            {topServices.map(svc => (
              <button 
                key={svc.label}
                onClick={() => {
                  const viewMap: Record<string, string> = {
                    "Restaurantes": "explore_restaurants",
                    "Mercados": "explore_market",
                    "Farmácias": "explore_pharmacy",
                    "Bebidas": "explore_beverages",
                    "Gás e Água": "explore_gas",
                    "Petshop": "explore_petshop"
                  };
                  const targetView = viewMap[svc.label];
                  if (targetView) navigateSubView(targetView);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl whitespace-nowrap transition-all border ${
                  svc.label === "Gás e Água" 
                  ? "bg-yellow-400 border-yellow-400 text-black font-black shadow-lg shadow-yellow-400/20" 
                  : "bg-zinc-100 border-zinc-100 text-zinc-500 font-bold hover:bg-zinc-200"
                }`}
              >
                <span className="material-symbols-rounded text-[20px]">{svc.icon}</span>
                <span className="text-[10px] uppercase tracking-widest">{svc.label}</span>
              </button>
            ))}
         </div>
      </section>

      {/* CONTEÚDO DINÂMICO COM ANIMAÇÃO */}
      <AnimatePresence mode="wait">
        <motion.div
          key="explore_gas"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="flex-1"
        >
          {/* BANNERS */}
          <ExploreBanners banners={exploreBanners} serviceType="gas" />

          {/* HERO SECTION / QUICK ACTIONS */}
          <section className="px-6 py-8">
            <div className="grid grid-cols-2 gap-4">
               <motion.div 
                 whileTap={{ scale: 0.95 }}
                 className="h-48 bg-gradient-to-br from-blue-600 to-blue-400 rounded-[32px] p-6 relative overflow-hidden group cursor-pointer shadow-xl shadow-blue-200/50"
                 onClick={() => setActiveTab("Água")}
               >
                  <div className="relative z-10">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Hidrate-se</p>
                    <h3 className="text-white text-xl font-black uppercase tracking-tighter leading-tight italic">Água<br/>Mineral</h3>
                  </div>
                  <div className="absolute -bottom-4 -right-4 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <span className="material-symbols-rounded text-white/20 text-8xl absolute -bottom-4 -right-4 rotate-12 group-hover:rotate-0 transition-transform duration-500">water_drop</span>
               </motion.div>

               <motion.div 
                 whileTap={{ scale: 0.95 }}
                 className="h-48 bg-gradient-to-br from-orange-600 to-orange-400 rounded-[32px] p-6 relative overflow-hidden group cursor-pointer shadow-xl shadow-orange-200/50"
                 onClick={() => setActiveTab("Gás")}
               >
                  <div className="relative z-10">
                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Fogo no Fogão</p>
                    <h3 className="text-white text-xl font-black uppercase tracking-tighter leading-tight italic">Gás de<br/>Cozinha</h3>
                  </div>
                  <div className="absolute -bottom-4 -right-4 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <span className="material-symbols-rounded text-white/20 text-8xl absolute -bottom-4 -right-4 rotate-12 group-hover:rotate-0 transition-transform duration-500">propane_tank</span>
               </motion.div>
            </div>
          </section>

          {/* CATEGORIAS TIPO CARDS CIRCULARES */}
          <section className="px-6 mb-12">
            <div className="flex gap-6 overflow-x-auto no-scrollbar py-4">
              {gasCategories.map((cat) => {
                const isActive = activeTab === cat.id;
                return (
                  <motion.div 
                    key={cat.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveTab(cat.id)}
                    className="flex flex-col items-center gap-3 min-w-[100px] cursor-pointer"
                  >
                    <div className={`size-16 rounded-[24px] flex items-center justify-center border-2 transition-all ${
                      isActive 
                      ? 'bg-yellow-400 border-yellow-400 shadow-lg shadow-yellow-400/30' 
                      : 'bg-white border-zinc-100'
                    }`}>
                      <span className={`material-symbols-rounded text-2xl ${isActive ? 'text-black' : 'text-zinc-400'}`}>{cat.icon}</span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest text-center ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`}>{cat.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* FAMOSOS NO IZI (DISTRIBUIDORES) */}
          {activeTab === "Todos" && featuredShops.length > 0 && (
            <section className="mb-12">
               <div className="flex items-center justify-between px-6 mb-6">
                  <h2 className="text-xl font-black text-zinc-900 uppercase italic tracking-tighter">Famosos no Izi</h2>
                  <button className="text-yellow-600 font-black text-[10px] uppercase tracking-widest">Ver ranking</button>
               </div>
               <div className="flex gap-6 overflow-x-auto no-scrollbar px-6">
                  {featuredShops.map((shop, i) => {
                    const coverImage = shop.banner_url || shop.banner || shop.image_url || shop.img || "https://images.unsplash.com/photo-1584263347416-85a18a482d99?q=80&w=500&auto=format&fit=crop";
                    return (
                      <motion.div 
                        key={shop.id || i}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onShopClick(shop)}
                        className="min-w-[280px] h-[340px] bg-white rounded-[44px] overflow-hidden shadow-2xl shadow-zinc-200/50 relative border border-zinc-50 cursor-pointer"
                      >
                         <img src={coverImage} className="size-full object-cover" alt={shop.name} />
                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8">
                            <div className="flex items-center gap-2 mb-2">
                               <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter">Top {i + 1}</div>
                               <div className="flex items-center gap-1 text-white text-[12px] font-bold">
                                  <span className="material-symbols-rounded text-yellow-400 text-[12px]">star</span>
                                  {shop.rating || "4.9"}
                               </div>
                            </div>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">{shop.name}</h3>
                            <p className="text-zinc-400 text-xs font-bold mt-1 uppercase tracking-widest">{shop.delivery_time || "25-35"} min • {shop.delivery_fee === 0 ? "Entrega Grátis" : `R$ ${shop.delivery_fee}`}</p>
                         </div>
                      </motion.div>
                    );
                  })}
               </div>
            </section>
          )}

          {/* LISTAGEM DE DISTRIBUIDORES */}
          <section className="px-6 pb-32">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-zinc-900 tracking-tighter uppercase italic">Distribuidores Próximos</h3>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{filteredShops.length} Abertos</span>
             </div>
             
             <div className="flex flex-col gap-6">
                {filteredShops.map((shop, i) => (
                  <MerchantCard 
                    key={shop.id || i}
                    shop={shop}
                    onClick={() => onShopClick(shop)}
                    index={i}
                  />
                ))}
             </div>
          </section>
        </motion.div>
      </AnimatePresence>

      {/* CARRINHO (OPCIONAL SE HOUVER ITENS) */}
      {cart && cart.length > 0 && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-8 inset-x-6 z-[160]"
        >
          <button 
            onClick={() => navigateSubView("cart")}
            className="w-full h-24 bg-zinc-900 rounded-[40px] flex items-center justify-center px-10 shadow-[0_30px_60px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-yellow-400 translate-y-full group-hover:translate-y-[85%] transition-transform opacity-10" />
            
            {(() => {
              const subtotal = cart.reduce((sum: number, item: any) => {
                const basePrice = Number(item.price) || 0;
                const addonsPrice = Array.isArray(item.addonDetails) 
                  ? item.addonDetails.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0)
                  : 0;
                return sum + basePrice + addonsPrice;
              }, 0);

              return (
                <div className="flex items-center gap-6 relative z-10 w-full justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 bg-yellow-400 rounded-2xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-400/20">
                      {cart.length}
                    </div>
                    <span className="text-white font-black uppercase tracking-[0.2em] italic text-sm">Ver Sacola</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 font-black italic text-xs uppercase">Total</span>
                    <span className="text-yellow-400 font-black italic text-xl tracking-tighter">R$ {subtotal.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              );
            })()}
          </button>
        </motion.div>
      )}

    </div>
  );
};
