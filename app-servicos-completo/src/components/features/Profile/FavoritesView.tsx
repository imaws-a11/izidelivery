import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

export const FavoritesView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<"restaurants" | "items">("restaurants");
  const { userId } = useAuth();
  
  const [favoriteStores, setFavoriteStores] = useState<any[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchFavorites = async () => {
      setIsLoading(true);
      
      const { data: storesData } = await supabase
        .from("user_favorites_delivery")
        .select(`
          id,
          merchants_delivery(id, name, type, rating, logo_url, delivery_time)
        `)
        .eq("user_id", userId)
        .not("merchant_id", "is", null);

      if (storesData) {
        setFavoriteStores(storesData.map(f => f.merchants_delivery).filter(Boolean));
      }

      const { data: itemsData } = await supabase
        .from("user_favorites_delivery")
        .select(`
          id,
          products_delivery(id, name, price, discount_price, image_url, category)
        `)
        .eq("user_id", userId)
        .not("product_id", "is", null);

      if (itemsData) {
        setFavoriteItems(itemsData.map(f => f.products_delivery).filter(Boolean));
      }

      setIsLoading(false);
    };
    
    fetchFavorites();
  }, [userId]);

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] pb-20 overflow-y-auto">
      <header className="bg-white px-6 pt-20 pb-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Favoritos</h1>
        <div className="size-10" />
      </header>

      <div className="bg-white px-6 pb-4 border-b border-zinc-100 sticky top-[92px] z-40">
        <div className="flex bg-zinc-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("restaurants")}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'restaurants' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Lojas
          </button>
          <button 
            onClick={() => setActiveTab("items")}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'items' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Itens
          </button>
        </div>
      </div>

      <main className="px-6 py-6 space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="size-10 border-4 border-zinc-200 border-t-yellow-400 rounded-full animate-spin" /></div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "restaurants" && (
              <motion.div key="restaurants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {favoriteStores.length > 0 ? favoriteStores.map((store: any, idx: number) => (
                  <motion.div 
                    key={store.id || idx}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-3xl p-4 flex gap-4 items-center shadow-sm border border-zinc-100 relative"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="material-symbols-rounded text-rose-500 fill-1">favorite</span>
                    </div>
                    <div className="size-16 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                       {store.logo_url ? (
                         <img src={store.logo_url} alt={store.name} className="size-full object-cover" />
                       ) : (
                         <div className="size-full flex items-center justify-center bg-yellow-100 text-yellow-600 font-bold">{store.name?.charAt(0)}</div>
                       )}
                    </div>
                    <div>
                       <h3 className="font-black text-zinc-900 text-lg leading-tight">{store.name}</h3>
                       <p className="text-xs text-zinc-500 font-medium mb-1">{store.type || 'Restaurante'} • {store.delivery_time || '30-40 min'}</p>
                       <div className="flex items-center gap-1">
                         <span className="material-symbols-rounded text-yellow-400 text-[14px] fill-1">star</span>
                         <span className="text-xs font-bold text-zinc-900">{store.rating || 'Novo'}</span>
                       </div>
                    </div>
                  </motion.div>
                )) : (
                   <div className="text-center py-20">
                      <span className="material-symbols-rounded text-6xl text-zinc-200">store</span>
                      <p className="font-bold text-zinc-400 mt-4">Nenhuma loja favoritada.</p>
                   </div>
                )}
              </motion.div>
            )}

            {activeTab === "items" && (
              <motion.div key="items" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {favoriteItems.length > 0 ? favoriteItems.map((item: any, idx: number) => (
                  <motion.div 
                    key={item.id || idx}
                    whileTap={{ scale: 0.98 }}
                    className="bg-white rounded-3xl p-4 flex gap-4 items-center shadow-sm border border-zinc-100 relative"
                  >
                    <div className="absolute top-4 right-4">
                      <span className="material-symbols-rounded text-rose-500 fill-1">favorite</span>
                    </div>
                    <div className="size-16 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
                       {item.image_url ? (
                         <img src={item.image_url} alt={item.name} className="size-full object-cover" />
                       ) : (
                         <div className="size-full flex items-center justify-center bg-zinc-100"><span className="material-symbols-rounded text-zinc-300">restaurant</span></div>
                       )}
                    </div>
                    <div className="flex-1">
                       <h3 className="font-black text-zinc-900 text-[15px] leading-tight line-clamp-2 pr-6">{item.name}</h3>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1 mb-1">{item.category || 'Categoria do Prato'}</p>
                       <div className="flex items-center gap-2">
                         {item.discount_price > 0 && (
                           <span className="text-xs font-medium text-zinc-400 line-through">R$ {item.price}</span>
                         )}
                         <span className="text-sm font-black text-emerald-600">R$ {item.discount_price > 0 ? item.discount_price : item.price}</span>
                       </div>
                    </div>
                  </motion.div>
                )) : (
                   <div className="text-center py-20">
                      <span className="material-symbols-rounded text-6xl text-zinc-200">restaurant</span>
                      <p className="font-bold text-zinc-400 mt-4">Nenhum item salvo ainda.</p>
                   </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};
