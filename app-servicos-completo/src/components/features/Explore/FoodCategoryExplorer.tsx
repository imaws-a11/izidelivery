import React from "react";
import { GenericCategoryExplorer } from "./GenericCategoryExplorer";

interface FoodCategoryExplorerProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const FoodCategoryExplorer: React.FC<FoodCategoryExplorerProps> = (props) => {
  const categories = [
    { label: "Lanches", img: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop" },
    { label: "Pizza", img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=100&h=100&fit=crop" },
    { label: "Açaí", img: "https://images.unsplash.com/photo-1590301157890-4810ed352733?w=100&h=100&fit=crop" },
    { label: "Promoções", img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=100&h=100&fit=crop" },
    { label: "Brasil", img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=100&h=100&fit=crop" },
    { label: "Japonesa", img: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&h=100&fit=crop" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Restaurantes"
      placeholder="Buscar em Restaurantes"
      activeService="Restaurantes"
      categories={categories}
      listTitle="Melhores Restaurantes"
      serviceType="restaurant"
    />
  );
};
