import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface PetshopExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const PetshopExploreView: React.FC<PetshopExploreViewProps> = (props) => {
  const categories = [
    { label: "Cães", img: "https://cdn-icons-png.flaticon.com/512/620/620851.png" },
    { label: "Gatos", img: "https://cdn-icons-png.flaticon.com/512/616/616430.png" },
    { label: "Aves", img: "https://cdn-icons-png.flaticon.com/512/616/616412.png" },
    { label: "Peixes", img: "https://cdn-icons-png.flaticon.com/512/616/616421.png" },
    { label: "Farmácia", img: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Petshop"
      placeholder="Buscar em Petshop"
      activeService="Petshop"
      categories={categories}
      listTitle="Lojas Próximas"
      serviceType="pet"
    />
  );
};
