import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../ui/Icon";
import { EstablishmentListView } from "./EstablishmentListView";

export const CategoryListView = () => {
  const { 
    subView, 
    setSubView, 
    searchQuery, 
    setSearchQuery, 
    ESTABLISHMENTS, 
    handleShopClick, 
    establishmentTypes,
    restaurantInitialCategory,
    setRestaurantInitialCategory
  } = useApp();

  const getTitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Restaurantes";
      case "daily_menus": return "Pratos do Dia";
      case "market_list": return "Mercados";
      case "beverages_list": return "Bebidas";
      case "pharmacy_list": return "Farmácias";
      case "generic_list": return "Explorar";
      default: return "Explorar";
    }
  };

  const getIcon = () => {
    switch (subView) {
      case "explore_restaurants": return "restaurant";
      case "daily_menus": return "lunch_dining";
      case "market_list": return "shopping_basket";
      case "beverages_list": return "local_bar";
      case "pharmacy_list": return "medical_services";
      default: return "explore";
    }
  };

  return (
    <div className="absolute inset-0 z-[120] bg-black text-zinc-100 flex flex-col hide-scrollbar overflow-y-auto">
      <header className="px-6 py-8 flex items-center justify-between gap-4 sticky top-0 bg-black/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSubView("none")}
            className="size-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
          >
            <Icon name="arrow_back" />
          </button>
          <div>
             <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1">
               {getTitle()}
             </h2>
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Encontre o melhor perto de você</p>
          </div>
        </div>
        <div className="size-11 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20">
           <Icon name={getIcon()} />
        </div>
      </header>

      <div className="px-6 py-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-zinc-500 group-focus-within:text-yellow-400 transition-colors">search</span>
          </div>
          <input
            type="text"
            placeholder={`Buscar em ${getTitle().toLowerCase()}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border border-white/5 rounded-[28px] py-6 pl-16 pr-8 text-sm font-bold text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-yellow-400/20 transition-all shadow-inner"
          />
        </div>
      </div>

      <main className="flex-1 px-6 pb-32">
        <EstablishmentListView 
          type={subView === "explore_restaurants" ? "Restaurante" : 
                subView === "market_list" ? "Mercado" : 
                subView === "beverages_list" ? "Bebidas" : 
                subView === "pharmacy_list" ? "Farmácia" : undefined}
          establishments={ESTABLISHMENTS}
          onShopClick={handleShopClick}
          searchQuery={searchQuery}
          initialCategory={restaurantInitialCategory}
          onCategoryChange={setRestaurantInitialCategory}
          establishmentTypes={establishmentTypes}
        />
      </main>
    </div>
  );
};
