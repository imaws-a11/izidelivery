import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface BeverageExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const BeverageExploreView: React.FC<BeverageExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  const master = establishmentTypes.find(t => t.value === 'beverages' || t.value === 'bebidas');
  
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : `https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=100&h=100&fit=crop` 
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Cervejas", img: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=100&h=100&fit=crop" },
    { label: "Vinhos", img: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=100&h=100&fit=crop" },
    { label: "Destilados", img: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=100&h=100&fit=crop" },
    { label: "Gelo", img: "https://images.unsplash.com/photo-1551326806-2d01f5e824eb?w=100&h=100&fit=crop" },
    { label: "Refrigerantes", img: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=100&h=100&fit=crop" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Bebidas"
      placeholder="Buscar em Bebidas"
      activeService="Bebidas"
      categories={categories}
      listTitle="Distribuidoras na Região"
      serviceType="beverages"
    />
  );
};
