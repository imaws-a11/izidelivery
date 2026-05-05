import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface PharmacyExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
  exploreBanners?: any[];
}

export const PharmacyExploreView: React.FC<PharmacyExploreViewProps> = (props) => {
  const { establishmentTypes } = useApp();
  
  const master = establishmentTypes.find(t => t.value === 'pharmacy' || t.value === 'farmacia');
  
  const dynamicCategories = establishmentTypes
    .filter(t => t.parent_id === master?.id)
    .map(t => ({ 
      label: t.name, 
      img: t.icon && (t.icon.startsWith('http') || t.icon.startsWith('/')) 
        ? t.icon 
        : undefined,
      icon: "vaccines"
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Remédios", icon: "medication" },
    { label: "Higiene", icon: "clean_hands" },
    { label: "Beleza", icon: "face_retouching_natural" },
    { label: "Bebês", icon: "child_care" },
    { label: "Suplementos", icon: "fitness_center" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Farmácias"
      placeholder="O que você precisa da farmácia?"
      activeService="Farmácias"
      categories={categories}
      listTitle="Farmácias Próximas"
      serviceType="pharmacy"
      infoCard={{
        text: "Medicamentos controlados exigem retenção de receita. O Izi Delivery facilita sua busca, mas a venda é responsabilidade da farmácia.",
        link: "Regras de Entrega >"
      }}
    />
  );
};
