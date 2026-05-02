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
        : `https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100&h=100&fit=crop` 
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Frutas", img: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100&h=100&fit=crop" },
    { label: "Legumes", img: "https://images.unsplash.com/photo-1597362860722-39455a43b763?w=100&h=100&fit=crop" },
    { label: "Verduras", img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100&h=100&fit=crop" },
    { label: "Orgânicos", img: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop" },
    { label: "Ovos", img: "https://images.unsplash.com/photo-1582722872445-44ad5c78a9dd?w=100&h=100&fit=crop" },
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
