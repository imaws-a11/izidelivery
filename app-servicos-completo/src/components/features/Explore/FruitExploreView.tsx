import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface FruitExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const FruitExploreView: React.FC<FruitExploreViewProps> = (props) => {
  const categories = [
    { label: "Frutas", img: "https://cdn-icons-png.flaticon.com/512/3194/3194766.png" },
    { label: "Legumes", img: "https://cdn-icons-png.flaticon.com/512/3194/3194770.png" },
    { label: "Verduras", img: "https://cdn-icons-png.flaticon.com/512/3194/3194775.png" },
    { label: "Orgânicos", img: "https://cdn-icons-png.flaticon.com/512/3194/3194780.png" },
    { label: "Ovos", img: "https://cdn-icons-png.flaticon.com/512/3105/3105814.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Hortifrutti"
      placeholder="Frescor direto para sua mesa"
      activeService="Hortifrutti"
      categories={categories}
      listTitle="Melhores do Hortifrutti"
      serviceType="fruit"
    />
  );
};
