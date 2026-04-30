import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";
import { EstablishmentListView } from "../Establishment/EstablishmentListView";

export const CategoryListView = () => {
  const { 
    subView, 
    setSubView, 
    activeService, 
    ESTABLISHMENTS: establishments, 
    setSelectedShop,
    searchQuery,
    setSearchQuery,
    navigateSubView,
    cart,
    handleShopClick
  } = useApp();

  const handleBack = () => setSubView("none");

  const getTitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Restaurantes";
      case "daily_menus": return "Pratos do Dia";
      case "market_list": return "Mercados";
      case "pharmacy_list": return "Farmácias";
      case "beverages_list": return "Bebidas & Adega";
      case "pets_list": return "Pet Shop";
      default: return activeService?.label || "Explorar";
    }
  };

  const getSubtitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Os melhores sabores da região";
      case "daily_menus": return "Economia e praticidade hoje";
      case "market_list": return "Sua despensa sempre cheia";
      case "beverages_list": return "Acompanhamentos e geladas";
      default: return "Selecionados para você";
    }
  };

  const getFilterFn = () => {
    return (estab: any) => {
      const type = (estab.type || "").toLowerCase();
      const foodCats = Array.isArray(estab.foodCategory) 
        ? estab.foodCategory.map((c: any) => (c || "").toLowerCase())
        : [(estab.foodCategory || "").toLowerCase()];

      switch (subView) {
        case "explore_restaurants": 
          return type === "restaurant" || type === "food";
        case "market_list": 
          return type === "market";
        case "pharmacy_list": 
          return type === "pharmacy";
        case "beverages_list": 
          // Filtro mais estrito: apenas lojas cujo tipo principal é bebidas
          // Isso evita que restaurantes que vendem bebidas apareçam aqui
          return type === "beverages" || type === "adegas";
        case "pets_list": 
          return type === "petshop" || type === "pet";
        default: 
          // Se for uma lista genérica ou desconhecida, tentamos filtrar pelo activeService
          if (activeService?.id) {
            const serviceId = activeService.id.toLowerCase();
            return type === serviceId || foodCats.includes(serviceId);
          }
          return true;
      }
    };
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

      <main className="flex-1">
        <EstablishmentListView 
          title={getTitle()}
          subtitle={getSubtitle()}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setSubView={setSubView}
          establishments={establishments}
          filterFn={getFilterFn()}
          onShopClick={handleShopClick}
          cartLength={cart.length}
          navigateSubView={navigateSubView}
        />
      </main>
    </div>
  );
};
