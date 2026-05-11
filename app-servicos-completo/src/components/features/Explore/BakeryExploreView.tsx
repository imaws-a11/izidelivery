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
        : undefined,
      icon: "bakery_dining"
    }));

  // Fallback caso o admin ainda não tenha cadastrado subcategorias
  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Pães", icon: "breakfast_dining" },
    { label: "Bolos", icon: "cake" },
    { label: "Salgados", icon: "tapas" },
    { label: "Doces", icon: "icecream" },
    { label: "Café", icon: "coffee" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Padarias"
      placeholder="Pão quentinho e muito mais"
      activeService="Padaria"
      categories={categories}
      listTitle="Padarias e Confeitarias"
      serviceType={["bakery", "padaria", "confeitaria", "doceria"]}
    />
  );
};
