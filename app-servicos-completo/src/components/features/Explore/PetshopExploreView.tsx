import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface PetshopExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const PetshopExploreView: React.FC<PetshopExploreViewProps> = (props) => {
  const categories = [
    { label: "Ração", img: "https://cdn-icons-png.flaticon.com/512/620/620851.png" },
    { label: "Petiscos", img: "https://cdn-icons-png.flaticon.com/512/616/616430.png" },
    { label: "Brinquedos", img: "https://cdn-icons-png.flaticon.com/512/616/616412.png" },
    { label: "Higiene", img: "https://cdn-icons-png.flaticon.com/512/616/616421.png" },
    { label: "Acessórios", img: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Pet Shop"
      placeholder="Tudo para o seu pet"
      activeService="Petshop"
      categories={categories}
      listTitle="Pet Shops na Região"
      serviceType="pet"
    />
  );
};
