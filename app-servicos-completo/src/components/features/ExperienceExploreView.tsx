import React from 'react';
import { motion } from 'framer-motion';

interface ExperienceItem {
  id: string;
  title: string;
  description: string;
  image: string;
  price: number;
  rating: number;
  location: string;
  category: string;
  type?: string;
  amenities?: string[];
  liveMusic?: boolean;
  vehicle?: string;
  seats?: number;
  date?: string;
  startTime?: string;
  highlight?: string;
}

interface ExperienceExploreViewProps {
  title: string;
  category: string;
  items: ExperienceItem[];
  onClose: () => void;
  onSelectItem: (item: any) => void;
}

export const ExperienceExploreView: React.FC<ExperienceExploreViewProps> = ({
  title,
  category,
  items,
  onClose,
  onSelectItem
}) => {
  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[150] bg-white flex flex-col overflow-hidden"
    >
      {/* HEADER TRANSPARENTE SEM FUNDO */}
      <header className="absolute top-0 left-0 right-0 z-[160] p-6 flex items-center justify-between pointer-events-none">
        <button 
          onClick={onClose}
          className="size-12 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-xl active:scale-90 transition-all pointer-events-auto"
        >
          <span className="material-symbols-rounded font-black">close</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* HERO BANNER - AJUSTADO PARA BOTTOMSHEET FEEL */}
        <section className="relative h-80 overflow-hidden mb-6">
           <img 
             src={items[0]?.image || "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1200&auto=format&fit=crop"} 
             className="size-full object-cover"
             alt="Hero"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
           <div className="absolute bottom-8 left-8 right-8">
              <h1 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter leading-none mb-2">{title}</h1>
              <p className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.2em]">Explore o melhor de sua cidade</p>
           </div>
        </section>

        {/* LISTA DE CARDS */}
        <div className="px-6 space-y-8">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => onSelectItem(item)}
              className="group relative bg-white border border-zinc-100 rounded-[40px] overflow-hidden cursor-pointer active:scale-[0.98] transition-all shadow-sm hover:shadow-2xl hover:border-transparent"
            >
              <div className="relative h-64 overflow-hidden">
                <img src={item.image} className="size-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Preço estilo Izi */}
                <div className="absolute top-6 right-6 bg-yellow-400 text-zinc-900 px-6 py-2.5 rounded-2xl font-black tracking-tight shadow-2xl scale-110">
                  R$ {item.price.toFixed(2).replace('.', ',')}
                </div>

                {/* Rating */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md border border-zinc-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg">
                   <span className="material-symbols-rounded text-yellow-500 text-sm fill-1">star</span>
                   <span className="text-xs font-black text-zinc-900">{item.rating}</span>
                </div>
              </div>

              <div className="p-8 space-y-4">
                <div className="flex items-center justify-between">
                   <span className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.1em]">{item.location}</span>
                   {item.type && <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-50 px-3 py-1 rounded-full">{item.type}</span>}
                </div>

                <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter leading-none">
                  {item.title}
                </h3>

                <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="pt-6 border-t border-zinc-50 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-zinc-900 flex items-center justify-center">
                        <span className="material-symbols-rounded text-yellow-400 text-lg">
                          {category === 'hotels' ? 'bed' : category === 'nightlife' ? 'music_note' : 'explore'}
                        </span>
                      </div>
                      <span className="text-[10px] font-black text-zinc-900 uppercase tracking-tight">Experiência Izi</span>
                   </div>
                   <button className="h-12 px-8 bg-zinc-50 group-hover:bg-yellow-400 group-hover:text-zinc-900 border border-zinc-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Ver detalhes
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
