import React from "react";
import { GenericCategoryExplorer } from "./GenericCategoryExplorer";

interface FoodCategoryExplorerProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const FoodCategoryExplorer: React.FC<FoodCategoryExplorerProps> = (props) => {
  const categories = [
    { label: "Lanches", icon: "lunch_dining" },
    { label: "Pizza", icon: "local_pizza" },
    { label: "Açaí", icon: "icecream" },
    { label: "Promoções", icon: "local_offer" },
    { label: "Brasil", icon: "stew" },
    { label: "Japonesa", icon: "set_meal" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Restaurantes"
      placeholder="Buscar em Restaurantes"
      activeService="Restaurantes"
      categories={categories}
      listTitle="Melhores Restaurantes"
      serviceType={["restaurant", "food", "restaurante", "lanche", "pizza", "acai"]}
    />
  );
};
