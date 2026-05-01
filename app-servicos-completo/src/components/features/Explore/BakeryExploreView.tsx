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
    { label: "Doces", img: "https://cdn-icons-png.flaticon.com/512/3132/3132709.png" },
    { label: "Café", img: "https://cdn-icons-png.flaticon.com/512/3132/3132715.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Padarias"
      placeholder="Pão quentinho e muito mais"
      activeService="Padaria"
      categories={categories}
      listTitle="Padarias e Confeitarias"
      serviceType="bakery"
    />
  );
};
