import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface BeverageExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
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
        : undefined,
      icon: "sports_bar"
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Cervejas", icon: "sports_bar" },
    { label: "Vinhos", icon: "wine_bar" },
    { label: "Destilados", icon: "liquor" },
    { label: "Gelo", icon: "ac_unit" },
    { label: "Refrigerantes", icon: "local_drink" },
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
