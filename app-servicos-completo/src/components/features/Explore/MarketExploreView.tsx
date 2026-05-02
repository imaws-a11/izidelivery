import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface MarketExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
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
        : `https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100&h=100&fit=crop` 
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Hortifruti", img: "https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=100&h=100&fit=crop" },
    { label: "Carnes", img: "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=100&h=100&fit=crop" },
    { label: "Limpeza", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=100&h=100&fit=crop" },
    { label: "Higiene", img: "https://images.unsplash.com/photo-1603507864264-325290f671b5?w=100&h=100&fit=crop" },
    { label: "Bebidas", img: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=100&h=100&fit=crop" },
    { label: "Padaria", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop" },
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
