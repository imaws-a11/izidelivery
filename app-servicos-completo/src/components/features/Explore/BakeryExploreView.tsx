import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface BakeryExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const BakeryExploreView: React.FC<BakeryExploreViewProps> = (props) => {
  const categories = [
    { label: "Pães", img: "https://cdn-icons-png.flaticon.com/512/3014/3014535.png" },
    { label: "Bolos", img: "https://cdn-icons-png.flaticon.com/512/3014/3014545.png" },
    { label: "Salgados", img: "https://cdn-icons-png.flaticon.com/512/3132/3132693.png" },
    { label: "Frios", img: "https://cdn-icons-png.flaticon.com/512/3143/3143640.png" },
    { label: "Leite & Ovos", img: "https://cdn-icons-png.flaticon.com/512/3105/3105814.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Padarias"
      placeholder="Buscar em Padarias"
      activeService="Padaria"
      categories={categories}
      listTitle="Padarias Próximas"
      serviceType="bakery"
    />
  );
};
