import { useApp } from "../../../hooks/useApp";
import { EstablishmentListView } from "../Establishment/EstablishmentListView";

interface CategoryListViewProps {
  onShopClick?: (shop: any) => void;
}

export const CategoryListView = ({ onShopClick }: CategoryListViewProps) => {
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
    handleShopClick: contextHandleShopClick
  } = useApp();

  const handleShopClick = onShopClick || contextHandleShopClick;

  const handleBack = () => setSubView("none");

  const getTitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Restaurantes";
      case "daily_menus": return "Pratos do Dia";
      case "market_list": return "Mercados";
      case "pharmacy_list": return "Farmácias";
      case "beverages_list": return "Bebidas & Adega";
      case "pets_list": return "Pet Shop";
      case "explore_hotels": return "Hotéis & Pousadas";
      case "explore_bars": return "Bares & Baladas";
      default: return activeService?.label || "Explorar";
    }
  };

  const getSubtitle = () => {
    switch (subView) {
      case "explore_restaurants": return "Os melhores sabores da região";
      case "daily_menus": return "Economia e praticidade hoje";
      case "market_list": return "Sua despensa sempre cheia";
      case "beverages_list": return "Acompanhamentos e geladas";
      case "pets_list": return "Tudo para o seu melhor amigo";
      case "explore_hotels": return "Hospedagem e conforto";
      case "explore_bars": return "A melhor vida noturna";
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
        case "explore_hotels":
          return type === "hotel" || type === "pousada" || type === "hospedagem";
        case "explore_bars":
          return type === "bar" || type === "balada" || type === "pub";
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
  );
};
