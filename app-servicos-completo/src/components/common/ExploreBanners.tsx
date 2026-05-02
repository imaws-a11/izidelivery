import React from 'react';
import { motion } from 'framer-motion';

interface Banner {
  id: string;
  title: string;
  description: string;
  image_url: string;
  service_type: string;
}

interface ExploreBannersProps {
  banners: Banner[];
  serviceType?: string;
}

export const ExploreBanners: React.FC<ExploreBannersProps> = ({ banners, serviceType }) => {
  const filteredBanners = banners.filter(b => 
    !serviceType || 
    !b.service_type || 
    b.service_type.toLowerCase() === serviceType.toLowerCase() ||
    (serviceType.toLowerCase() === 'restaurante' && b.service_type.toLowerCase() === 'food')
  );

  if (filteredBanners.length === 0) {
    return (
      <section className="mb-10 px-6">
        <motion.div
          whileTap={{ scale: 0.98 }}
          className="w-full h-[160px] rounded-[32px] bg-zinc-900 relative overflow-hidden shadow-xl shadow-zinc-200 group"
        >
           <img 
             src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800" 
             className="size-full object-cover" 
             alt="Banner Fallback" 
           />
        </motion.div>
      </section>
    );
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
