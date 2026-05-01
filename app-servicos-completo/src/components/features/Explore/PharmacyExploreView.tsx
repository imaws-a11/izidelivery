import React from 'react';
import { GenericCategoryExplorer } from './GenericCategoryExplorer';

interface PharmacyExploreViewProps {
  onBack: () => void;
  onShopClick?: (shop: any) => void;
}

export const PharmacyExploreView: React.FC<PharmacyExploreViewProps> = (props) => {
  const categories = [
    { label: "Ofertas", img: "https://cdn-icons-png.flaticon.com/512/3132/3132721.png" },
    { label: "Entrega rápida", img: "https://cdn-icons-png.flaticon.com/512/3125/3125724.png" },
    { label: "Remédios", img: "https://cdn-icons-png.flaticon.com/512/3063/3063822.png" },
    { label: "Beleza", img: "https://cdn-icons-png.flaticon.com/512/3132/3132715.png" },
    { label: "Fitness", img: "https://cdn-icons-png.flaticon.com/512/3132/3132709.png" },
  ];

  return (
    <GenericCategoryExplorer
      {...props}
      title="Farmácias"
      placeholder="Buscar em Farmácias"
      activeService="Farmácias"
      categories={categories}
      listTitle="Mais Pedidos"
      serviceType="pharmacy"
      infoCard={{
        text: "As farmácias são as responsáveis pela venda dos medicamentos. O Izi Delivery não comercializa nem entrega tais produtos sem a devida prescrição.",
        link: "Saber mais >"
      }}
    />
  );
};
