import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface GasWaterExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const GasWaterExploreView: React.FC<GasWaterExploreViewProps> = (props) => {
  const categories = [
    { label: "Gás 13kg", img: "https://cdn-icons-png.flaticon.com/512/2933/2933866.png" },
    { label: "Água 20L", img: "https://cdn-icons-png.flaticon.com/512/3105/3105807.png" },
    { label: "Água 1.5L", img: "https://cdn-icons-png.flaticon.com/512/3105/3105807.png" },
    { label: "Acessórios", img: "https://cdn-icons-png.flaticon.com/512/911/911462.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Gás & Água"
      placeholder="Buscar Gás ou Água"
      activeService="Gás & Água"
      categories={categories}
      listTitle="Distribuidores"
      serviceType="gas"
    />
  );
};
