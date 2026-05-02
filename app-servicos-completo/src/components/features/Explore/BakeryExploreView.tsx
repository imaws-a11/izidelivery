import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface BakeryExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
}

export const BakeryExploreView: React.FC<BakeryExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  // Encontra a categoria master de Padaria
  const master = establishmentTypes.find(t => t.value === 'bakery' || t.value === 'padaria');
  
  // Filtra as subcategorias vinculadas a ela
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : `https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop` 
    }));

  // Fallback caso o admin ainda não tenha cadastrado subcategorias
  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Pães", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop" },
    { label: "Bolos", img: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&h=100&fit=crop" },
    { label: "Salgados", img: "https://images.unsplash.com/photo-1619671607534-192f155988d6?w=100&h=100&fit=crop" },
    { label: "Doces", img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=100&h=100&fit=crop" },
    { label: "Café", img: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=100&h=100&fit=crop" },
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
