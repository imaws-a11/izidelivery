import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface GasWaterExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const GasWaterExploreView: React.FC<GasWaterExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  const master = establishmentTypes.find(t => t.value === 'gas' || t.value === 'agua_gas');
  
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : `https://images.unsplash.com/photo-1585351239634-11933219491b?w=100&h=100&fit=crop` 
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Gás 13kg", img: "https://images.unsplash.com/photo-1585351239634-11933219491b?w=100&h=100&fit=crop" },
    { label: "Água 20L", img: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=100&h=100&fit=crop" },
    { label: "Água 1.5L", img: "https://images.unsplash.com/photo-1560064831-299f041284a9?w=100&h=100&fit=crop" },
    { label: "Acessórios", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=100&h=100&fit=crop" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Gás & Água"
      placeholder="Buscar Gás ou Água"
      activeService="Gás & Água"
      categories={categories}
      listTitle="Distribuidores"
      serviceType="gas"
    />
  );
};
