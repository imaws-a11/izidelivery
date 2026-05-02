import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';
import { useApp } from '../../../contexts/AppContext';

interface PharmacyExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
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
        : `https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop` 
    }));

  const categories = dynamicCategories.length > 0 ? dynamicCategories : [
    { label: "Remédios", img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&h=100&fit=crop" },
    { label: "Higiene", img: "https://images.unsplash.com/photo-1603507864264-325290f671b5?w=100&h=100&fit=crop" },
    { label: "Beleza", img: "https://images.unsplash.com/photo-1596462502278-27bfdc4033c8?w=100&h=100&fit=crop" },
    { label: "Bebês", img: "https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=100&h=100&fit=crop" },
    { label: "Suplementos", img: "https://images.unsplash.com/photo-1584017945366-b97f0482aef2?w=100&h=100&fit=crop" },
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
