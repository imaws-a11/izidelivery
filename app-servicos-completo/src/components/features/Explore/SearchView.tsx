import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useApp } from '../../../hooks/useApp';

interface SearchViewProps {
  onCategoryClick: (category: any) => void;
  onSearch: (query: string) => void;
  establishmentTypes?: any[];
}

export const SearchView: React.FC<SearchViewProps> = ({ onCategoryClick, onSearch, establishmentTypes = [] }) => {
  const { user } = useApp();
  const [query, setQuery] = useState('');
  const [missions, setMissions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [missionsRes, couponsRes] = await Promise.all([
          supabase.from('gamification_missions').select('*').eq('is_active', true).eq('type', 'user'),
          supabase.from('promotions_delivery').select('*').eq('is_active', true).eq('type', 'coupon').limit(5)
        ]);

        if (missionsRes.data) setMissions(missionsRes.data);
        if (couponsRes.data) setCoupons(couponsRes.data);
      } catch (err) {
        console.error('Error fetching search data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeMission = missions[0] || {
    title: 'Ganhe descontos ao fazer pedidos',
    description: 'Compre a partir de R$0,99',
    target_value: 5,
    current_progress: 1
  };

  // Lógica Sênior: Filtrar e Organizar Categorias Reais
  const categories = useMemo(() => {
    const types = establishmentTypes.filter(t => t.is_active !== false);
    
    return {
      convenience: types.filter(t => ['market', 'pharmacy', 'beverages', 'gas'].includes(t.value?.toLowerCase())),
      restaurants: types.filter(t => !['market', 'pharmacy', 'beverages', 'gas'].includes(t.value?.toLowerCase()))
    };
  }, [establishmentTypes]);

  // Fallback de cores e imagens para categorias dinâmicas
  const getCategoryStyles = (slug: string) => {
    const s = slug.toLowerCase();
    if (s.includes('restaurante') || s.includes('food')) return { color: '#ff7a00', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png' };
    if (s.includes('mercado') || s.includes('market')) return { color: '#00a35e', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081986.png' };
    if (s.includes('farmacia') || s.includes('pharmacy')) return { color: '#ef4444', img: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' };
    if (s.includes('bebida') || s.includes('beverage')) return { color: '#facc15', img: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png' };
    if (s.includes('pet')) return { color: '#3b82f6', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081913.png' };
    return { color: '#18181b', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132715.png' };
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar pb-32">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white px-5 pt-24 pb-4 border-b border-zinc-50 shadow-sm">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-rounded text-zinc-400">search</span>
          </div>
          <input
            type="text"
            placeholder="O que vai pedir hoje?"
            value={query}
            onChange={(e) => {
                setQuery(e.target.value);
                onSearch(e.target.value);
            }}
            className="w-full bg-[#f2f2f2] border-none rounded-xl py-4 pl-12 pr-4 text-zinc-900 placeholder:text-zinc-500 focus:ring-2 focus:ring-yellow-400/20 text-[15px] font-bold"
          />
        </div>
      </div>

      <div className="px-5 space-y-8 mt-4">
        {/* Progress Card */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-[17px] font-black text-zinc-900 tracking-tight">{activeMission.title}</h3>
              <p className="text-[14px] text-zinc-500 font-medium">{activeMission.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="size-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <span className="text-xl">{activeMission.icon || '🎁'}</span>
             </div>
             <div className="flex-1 space-y-3">
                <div className="relative h-2 w-full bg-[#f2f2f2] rounded-full overflow-hidden">
                    <div 
                      className="absolute top-0 left-0 h-full bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.4)] transition-all duration-1000" 
                      style={{ width: `${(activeMission.current_progress || 0) / (activeMission.target_value || 1) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between px-1">
                    {Array.from({ length: activeMission.target_value || 4 }).map((_, i) => (
                        <div key={i} className={`size-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${i < (activeMission.current_progress || 0) ? 'bg-yellow-400' : 'bg-zinc-100'}`}>
                            <span className="material-symbols-rounded text-[14px] font-bold text-zinc-400">
                              {i < (activeMission.current_progress || 0) ? 'check' : 'lock'}
                            </span>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>

        {/* Cupons */}
        {coupons.length > 0 && (
          <div className="space-y-4">
              <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">Alguém buscando cupons?</h3>
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {coupons.map((coupon) => (
                      <motion.div
                          key={coupon.id}
                          whileTap={{ scale: 0.95 }}
                          className="relative min-w-[140px] h-20 bg-yellow-400 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-yellow-100"
                      >
                          <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-4 bg-white rounded-full" />
                          <div className="absolute -right-2 top-1/2 -translate-y-1/2 size-4 bg-white rounded-full" />
                          <span className="text-black text-[9px] font-bold uppercase opacity-60 leading-none">Cupom de</span>
                          <span className="text-black text-2xl font-black italic tracking-tighter">
                            {coupon.discount_type === 'percent' ? `${coupon.discount_value}%` : `R$ ${coupon.discount_value}`}
                          </span>
                      </motion.div>
                  ))}
              </div>
          </div>
        )}

        {/* Conveniência Real */}
        {categories.convenience.length > 0 && (
          <div className="space-y-4">
              <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">Conveniência</h3>
              <div className="grid grid-cols-2 gap-3">
                  {categories.convenience.map((cat, i) => {
                      const styles = getCategoryStyles(cat.value || cat.id);
                      return (
                          <motion.button
                              key={cat.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onCategoryClick(cat)}
                              className="relative h-28 rounded-2xl overflow-hidden shadow-sm"
                              style={{ backgroundColor: styles.color }}
                          >
                              <div className="absolute inset-0 p-4 flex flex-col justify-start z-10 text-left">
                                  <span className={`font-black text-xl leading-tight tracking-tight ${styles.color === '#facc15' ? 'text-black' : 'text-white'}`}>
                                    {cat.name || cat.label}
                                  </span>
                              </div>
                              <img 
                                src={cat.icon && cat.icon.startsWith('http') ? cat.icon : styles.img} 
                                className="absolute right-[-5px] bottom-[-5px] w-20 h-20 rotate-[-5deg] opacity-80 object-contain" 
                                alt={cat.name} 
                              />
                          </motion.button>
                      );
                  })}
              </div>
          </div>
        )}

        {/* Restaurantes Reais */}
        {categories.restaurants.length > 0 && (
          <div className="space-y-4">
              <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">Explorar Categorias</h3>
              <div className="grid grid-cols-2 gap-3 pb-12">
                  {categories.restaurants.map((cat) => {
                      const styles = getCategoryStyles(cat.value || cat.id);
                      return (
                          <motion.button
                              key={cat.id}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => onCategoryClick(cat)}
                              className="relative h-32 rounded-2xl overflow-hidden shadow-sm flex flex-col items-start p-4"
                              style={{ backgroundColor: styles.color }}
                          >
                              <span className={`font-black text-lg text-left leading-tight tracking-tight z-10 ${styles.color === '#facc15' ? 'text-black' : 'text-white'}`}>
                                {cat.name || cat.label}
                              </span>
                              <img 
                                src={cat.icon && cat.icon.startsWith('http') ? cat.icon : styles.img} 
                                className="absolute right-[-5px] bottom-[-5px] w-24 h-24 object-contain" 
                                alt={cat.name} 
                              />
                          </motion.button>
                      );
                  })}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};
