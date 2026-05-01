import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface MarketExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const MarketExploreView: React.FC<MarketExploreViewProps> = (props) => {
  const categories = [
    { label: "Básicos", img: "https://cdn-icons-png.flaticon.com/512/3081/3081986.png" },
    { label: "Limpeza", img: "https://cdn-icons-png.flaticon.com/512/2553/2553642.png" },
    { label: "Congelados", img: "https://cdn-icons-png.flaticon.com/512/2362/2362252.png" },
    { label: "Padaria", img: "https://cdn-icons-png.flaticon.com/512/3014/3014535.png" },
    { label: "Carnes", img: "https://cdn-icons-png.flaticon.com/512/3143/3143640.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Mercados"
      placeholder="Buscar em Mercados"
      activeService="Mercados"
      categories={categories}
      listTitle="Mais Pedidos"
      serviceType="market"
    />
  );
};
