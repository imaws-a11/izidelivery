import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface PetshopExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
}

export const PetshopExploreView: React.FC<PetshopExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  const master = establishmentTypes.find(t => t.value === 'pet' || t.value === 'petshop');
  
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : undefined,
      icon: "pets"
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Ração", icon: "cruelty_free" },
    { label: "Petiscos", icon: "bone" },
    { label: "Brinquedos", icon: "smart_toy" },
    { label: "Higiene", icon: "bathtub" },
    { label: "Acessórios", icon: "checkroom" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Pet Shop"
      placeholder="Tudo para o seu pet"
      activeService="Petshop"
      categories={categories}
      listTitle="Pet Shops na Região"
      serviceType={["pet", "petshop", "veterinaria", "pets"]}
    />
  );
};
