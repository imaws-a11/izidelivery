import React, { useState } from "react";
import { motion } from "framer-motion";

export const FavoritesView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<"restaurants" | "items">("restaurants");

  const restaurants = [
    { name: "Burger King", category: "Lanches", rating: "4.8", time: "20-30 min", img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=200&q=80" },
    { name: "Outback", category: "Carnes", rating: "4.9", time: "40-50 min", img: "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&q=80" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F7F7] pb-20">
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
        {activeTab === "restaurants" && restaurants.map((store, idx) => (
          <motion.div 
            key={idx}
            whileTap={{ scale: 0.98 }}
            className="bg-white rounded-3xl p-4 flex gap-4 items-center shadow-sm border border-zinc-100 relative"
          >
            <div className="absolute top-4 right-4">
              <span className="material-symbols-rounded text-rose-500 fill-1">favorite</span>
            </div>
            <div className="size-16 rounded-2xl overflow-hidden bg-zinc-100 shrink-0">
               <img src={store.img} alt={store.name} className="size-full object-cover" />
            </div>
            <div>
               <h3 className="font-black text-zinc-900 text-lg leading-tight">{store.name}</h3>
               <p className="text-xs text-zinc-500 font-medium mb-1">{store.category} • {store.time}</p>
               <div className="flex items-center gap-1">
                 <span className="material-symbols-rounded text-yellow-400 text-[14px] fill-1">star</span>
                 <span className="text-xs font-bold text-zinc-900">{store.rating}</span>
               </div>
            </div>
          </motion.div>
        ))}

        {activeTab === "items" && (
           <div className="text-center py-20">
              <span className="material-symbols-rounded text-6xl text-zinc-200">restaurant</span>
              <p className="font-bold text-zinc-400 mt-4">Nenhum item salvo ainda.</p>
           </div>
        )}
      </main>
    </div>
  );
};
