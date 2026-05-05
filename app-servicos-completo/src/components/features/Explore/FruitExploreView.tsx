import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface FruitExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
}

export const FruitExploreView: React.FC<FruitExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  const master = establishmentTypes.find(t => t.value === 'fruit' || t.value === 'hortifruti');
  
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : undefined,
      icon: "nutrition"
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Frutas", icon: "apple" },
    { label: "Legumes", icon: "eco" },
    { label: "Verduras", icon: "grass" },
    { label: "Orgânicos", icon: "compost" },
    { label: "Ovos", icon: "egg" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Hortifrutti"
      placeholder="Frescor direto para sua mesa"
      activeService="Hortifrutti"
      categories={categories}
      listTitle="Melhores do Hortifrutti"
      serviceType="fruit"
    />
  );
};
