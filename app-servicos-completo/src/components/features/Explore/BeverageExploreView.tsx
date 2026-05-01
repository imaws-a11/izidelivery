import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface BeverageExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const BeverageExploreView: React.FC<BeverageExploreViewProps> = (props) => {
  const categories = [
    { label: "Cervejas", img: "https://cdn-icons-png.flaticon.com/512/931/931949.png" },
    { label: "Vinhos", img: "https://cdn-icons-png.flaticon.com/512/920/920610.png" },
    { label: "Destilados", img: "https://cdn-icons-png.flaticon.com/512/920/920582.png" },
    { label: "Gelo", img: "https://cdn-icons-png.flaticon.com/512/2115/2115955.png" },
    { label: "Refrigerantes", img: "https://cdn-icons-png.flaticon.com/512/2405/2405479.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Bebidas"
      placeholder="Buscar em Bebidas"
      activeService="Bebidas"
      categories={categories}
      listTitle="Mais Pedidos"
      serviceType="beverages"
    />
  );
};
