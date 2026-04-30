import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";
import { EstablishmentListView } from "../Establishment/EstablishmentListView";

export const CategoryListView = () => {
  const { 
    subView, 
    setSubView, 
    activeService, 
    establishments, 
    setSelectedShop 
  } = useApp();

  const handleBack = () => setSubView("none");

  const getTitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Restaurantes";
      case "daily_menus": return "Pratos do Dia";
      case "market_list": return "Mercados";
      case "pharmacy_list": return "Farmácias";
      case "drinks_list": return "Bebidas & Adega";
      case "pets_list": return "Pet Shop";
      default: return activeService?.label || "Explorar";
    }
  };

  const getSubtitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Os melhores sabores da região";
      case "daily_menus": return "Economia e praticidade hoje";
      case "market_list": return "Sua despensa sempre cheia";
      default: return "Selecionados para você";
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950 text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={handleBack} 
            className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl"
          >
            <Icon name="arrow_back" size={24} />
          </motion.button>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase leading-none">{getTitle()}</h1>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2">{getSubtitle()}</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-6">
        <EstablishmentListView 
          establishments={establishments} 
          onSelect={(shop) => {
            setSelectedShop(shop);
            setSubView("restaurant_menu");
          }} 
        />
      </main>
    </div>
  );
};
