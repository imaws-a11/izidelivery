import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface MarketExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
}

export const MarketExploreView: React.FC<MarketExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  const master = establishmentTypes.find(t => t.value === 'market' || t.value === 'mercado');
  
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : undefined,
      icon: "shopping_cart"
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Hortifruti", icon: "nutrition" },
    { label: "Carnes", icon: "kebab_dining" },
    { label: "Limpeza", icon: "cleaning_services" },
    { label: "Higiene", icon: "clean_hands" },
    { label: "Bebidas", icon: "sports_bar" },
    { label: "Padaria", icon: "bakery_dining" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Mercados"
      placeholder="Buscar em Mercados"
      activeService="Mercados"
      categories={categories}
      listTitle="Mais Pedidos"
      serviceType="market"
    />
  );
};
