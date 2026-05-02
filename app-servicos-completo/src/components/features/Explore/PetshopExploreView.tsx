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
        : `https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100&h=100&fit=crop` 
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Ração", img: "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100&h=100&fit=crop" },
    { label: "Petiscos", img: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=100&h=100&fit=crop" },
    { label: "Brinquedos", img: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=100&h=100&fit=crop" },
    { label: "Higiene", img: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=100&h=100&fit=crop" },
    { label: "Acessórios", img: "https://images.unsplash.com/photo-1544568100-847a948585b9?w=100&h=100&fit=crop" },
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
