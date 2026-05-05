import React from 'react';
import { motion } from 'framer-motion';

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  service_type: string;
  type?: string;
}

interface ExploreBannersProps {
  banners: Banner[];
  serviceType?: string;
}

export const ExploreBanners: React.FC<ExploreBannersProps> = ({ banners, serviceType }) => {
  const filteredBanners = banners.filter(b => {
    const isExploreType = b.type === 'explore';
    const sType = (serviceType || '').toLowerCase();
    
    // Se for tipo explore, o admin salva a categoria no título (ex: "Restaurantes,Lanches")
    if (isExploreType) {
      const categories = (b.title || '').toLowerCase().split(',');
      
      // Mapeamento de sinônimos para garantir que o banner apareça independente de plural/espaços
      const synonyms: Record<string, string[]> = {
        'restaurante': ['restaurantes', 'restaurante', 'food'],
        'mercados': ['mercado', 'mercados', 'market'],
        'farmácias': ['farmácia', 'farmacias', 'pharmacy', 'farmacia'],
        'petshop': ['pet shop', 'petshop', 'pet'],
        'bebidas': ['bebida', 'bebidas', 'beverages']
      };

      const possibleMatches = synonyms[sType] || [sType];
      return categories.some(c => possibleMatches.includes(c.trim()));
    }

    // Filtro padrão para outros tipos de banners
    return !serviceType || 
           !b.service_type || 
           b.service_type.toLowerCase() === sType ||
           (sType === 'restaurante' && b.service_type.toLowerCase() === 'food');
  });

  if (filteredBanners.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="flex gap-5 overflow-x-auto no-scrollbar px-6 pb-4">
        {filteredBanners.map((banner, i) => (
          <motion.div
            key={banner.id || i}
            whileTap={{ scale: 0.98 }}
            className="min-w-[320px] h-[160px] rounded-[32px] bg-white relative overflow-hidden shadow-xl shadow-zinc-200/50 group border border-zinc-100"
          >
             <img 
               src={banner.image_url} 
               className="size-full object-cover group-hover:scale-105 transition-transform duration-700" 
               alt={banner.title} 
             />
          </motion.div>
        ))}
      </div>
    </section>
  );
};
