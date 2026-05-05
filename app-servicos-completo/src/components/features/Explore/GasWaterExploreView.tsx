import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface GasWaterExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
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
        : undefined,
      icon: "propane"
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Gás 13kg", icon: "propane" },
    { label: "Água 20L", icon: "water_drop" },
    { label: "Água 1.5L", icon: "water_bottle" },
    { label: "Acessórios", icon: "build" },
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
