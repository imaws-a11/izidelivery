import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface PharmacyExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const PharmacyExploreView: React.FC<PharmacyExploreViewProps> = (props) => {
  const categories = [
    { label: "Remédios", img: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" },
    { label: "Higiene", img: "https://cdn-icons-png.flaticon.com/512/2553/2553642.png" },
    { label: "Beleza", img: "https://cdn-icons-png.flaticon.com/512/3132/3132715.png" },
    { label: "Bebês", img: "https://cdn-icons-png.flaticon.com/512/3132/3132709.png" },
    { label: "Suplementos", img: "https://cdn-icons-png.flaticon.com/512/3132/3132693.png" },
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
