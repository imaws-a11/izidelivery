import React from 'react';
import { motion, AnimatePresence } from "framer-motion";

interface ServicesExploreViewProps {
  isOpen: boolean;
  onClose: () => void;
  navigateSubView: (view: string) => void;
  establishmentTypes?: any[];
  setExploreCategoryState?: (state: any) => void;
}

export const ServicesExploreView: React.FC<ServicesExploreViewProps> = ({
  isOpen,
  onClose,
  navigateSubView,
  establishmentTypes = [],
  setExploreCategoryState,
}) => {
  const handleCategoryClick = (cat: any) => {
    const slug = cat.value || cat.id;
    
    // Viagem é uma rota nativa específica
    if (slug === 'izi_envios' || slug === 'viagem' || slug === 'mobilidade') {
      navigateSubView("explore_envios");
      return;
    }

    const customViews = ['restaurants', 'market', 'pharmacy', 'beverages', 'petshop', 'gas', 'bakery', 'fruit'];
    if (customViews.includes(slug)) {
      navigateSubView(`explore_${slug}`);
    } else {
      if (setExploreCategoryState) {
        setExploreCategoryState({
          id: slug,
          title: cat.name,
          tagline: cat.description || `Tudo de ${cat.name} para você`,
          icon: cat.icon || 'storefront',
          primaryColor: 'bg-yellow-400'
        });
        navigateSubView('explore_category');
      }
    }
  };

  const priorityOrder = [
    ['restaurants', 'food', 'restaurante', 'restaurantes'],
    ['markets', 'mercado', 'mercados', 'market'],
    ['pharmacy', 'farmacia', 'farmacias'],
    ['beverages', 'bebidas', 'bebida'],
    ['gas', 'gas_agua', 'agua'],
    ['petshop', 'pets', 'pet_shop'],
    ['fruit', 'hortifrutti', 'frutas', 'verduras'],
    ['butcher', 'acougue', 'carnes'],
    ['viagem', 'izi_envios', 'mobilidade', 'corridas']
  ];

  const getPriority = (slug: string) => {
    const s = (slug || '').toLowerCase();
    for (let i = 0; i < priorityOrder.length; i++) {
      if (priorityOrder[i].includes(s)) return i;
    }
    return 999;
  };

  const dynamicCategories = establishmentTypes
    .filter((t: any) => t.is_active !== false)
    .sort((a: any, b: any) => getPriority(a.value || a.id) - getPriority(b.value || b.id))
    .map((t: any) => ({
      ...t,
      action: () => handleCategoryClick(t)
    }));

  const highlights = [
    { id: 'taxi', label: 'Corridas', icon: 'local_taxi', color: 'bg-zinc-900', textColor: 'text-white', route: 'taxi_wizard' },
    { id: 'envios', label: 'Izi Envios', icon: 'package_2', color: 'bg-yellow-400', textColor: 'text-black', route: 'explore_envios', isNew: true },
    { id: 'clube', label: 'Clube', icon: 'loyalty', color: 'bg-rose-500', textColor: 'text-white' },
    { id: 'promos', label: 'Promoções', icon: 'percent', color: 'bg-emerald-500', textColor: 'text-white' },
    { id: 'favoritos', label: 'Favoritos', icon: 'favorite', color: 'bg-pink-500', textColor: 'text-white' },
    { id: 'doacoes', label: 'Doações', icon: 'volunteer_activism', color: 'bg-orange-500', textColor: 'text-white' },
  ];

  const restaurantHighlights = [
    { id: 'gourmet', label: 'Gourmet', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png' },
    { id: 'super', label: 'Super', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132715.png' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-[200] backdrop-blur-sm"
          />

          {/* Drawer Lateral */}
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[85%] max-w-sm bg-white z-[201] shadow-2xl flex flex-col rounded-r-[40px] overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 flex items-center justify-between">
               <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight">
                  Aproveite o <br /> Izi Delivery!
               </h2>
               <div className="bg-zinc-50 p-1.5 rounded-full flex gap-1 border border-zinc-100">
                  <div className="size-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                     <span className="material-symbols-rounded text-zinc-900 text-lg">grid_view</span>
                  </div>
                  <div className="size-8 flex items-center justify-center opacity-30">
                     <span className="material-symbols-rounded text-zinc-900 text-lg">reorder</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-8 pb-12 space-y-10">
               {/* Categorias Principais */}
               <div>
                  <h3 className="text-base font-black text-zinc-900 mb-6">Categorias</h3>
                   <div className="grid grid-cols-2 gap-3">
                     {dynamicCategories.map((cat: any) => (
                        <motion.div 
                          key={cat.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (cat.action) cat.action();
                            onClose();
                          }}
                          className="bg-zinc-50 rounded-3xl p-4 flex items-center gap-3 border border-zinc-100/50 hover:bg-zinc-100 transition-colors cursor-pointer"
                        >
                           {cat.icon && cat.icon.startsWith('http') ? (
                             <img src={cat.icon} className="size-10 object-contain" alt={cat.name} />
                           ) : cat.img ? (
                             <img src={cat.img} className="size-10 object-contain" alt={cat.name} />
                           ) : (
                             <div className="size-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                               <span className="material-symbols-rounded text-zinc-900">{cat.icon || 'storefront'}</span>
                             </div>
                           )}
                           <span className="text-xs font-black text-zinc-900 line-clamp-2 leading-tight">{cat.name || cat.label}</span>
                        </motion.div>
                     ))}
                  </div>
               </div>

               {/* Destaques do Izi */}
               <div>
                  <h3 className="text-base font-black text-zinc-900 mb-6">Destaques do Izi</h3>
                  <div className="grid grid-cols-4 gap-3">
                     {highlights.map(h => (
                        <motion.div 
                          key={h.id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                             if(h.route) navigateSubView(h.route);
                             onClose();
                          }}
                          className="flex flex-col items-center gap-2 cursor-pointer group"
                        >
                           <div className={`size-14 rounded-2xl ${h.color} flex items-center justify-center shadow-sm relative overflow-visible group-hover:scale-105 transition-transform`}>
                              <span className={`material-symbols-rounded ${h.textColor} text-[26px]`}>{h.icon}</span>
                              {h.isNew && (
                                <div className="absolute -top-2 -left-1 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full border-2 border-white shadow-sm uppercase tracking-tighter">
                                   Novo
                                </div>
                              )}
                           </div>
                           <span className="text-[10px] font-bold text-zinc-400 text-center leading-tight">{h.label}</span>
                        </motion.div>
                     ))}
                  </div>
               </div>

               {/* Destaques em Restaurantes */}
               <div>
                  <h3 className="text-base font-black text-zinc-900 mb-6">Destaques em Restaurantes</h3>
                  <div className="grid grid-cols-2 gap-3">
                     {restaurantHighlights.map(rh => (
                        <div key={rh.id} className="bg-zinc-50 rounded-3xl p-4 flex items-center gap-3 border border-zinc-100/50">
                           <img src={rh.img} className="size-10 object-contain" alt={rh.label} />
                           <span className="text-xs font-black text-zinc-900">{rh.label}</span>
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Footer / Close Button */}
            <div className="p-8 border-t border-zinc-50">
               <button 
                 onClick={onClose}
                 className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-zinc-200"
               >
                  Fechar
               </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
