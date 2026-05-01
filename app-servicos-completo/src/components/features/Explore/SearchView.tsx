import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface SearchViewProps {
  onCategoryClick: (category: string) => void;
  onSearch: (query: string) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onCategoryClick, onSearch }) => {
  const [query, setQuery] = useState('');

  const convenienceCategories = [
    { id: 'mercado', label: 'Mercado', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081986.png', color: '#00a35e' },
    { id: 'farmacia', label: 'Farmácia', img: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', color: '#ff7a00', badge: 'receba rápido' },
    { id: 'bebidas', label: 'Bebidas', img: 'https://cdn-icons-png.flaticon.com/512/3125/3125713.png', color: '#facc15' },
    { id: 'corridas', label: 'Corridas', img: 'https://cdn-icons-png.flaticon.com/512/3125/3125724.png', color: '#000000', brand: 'Uber' },
    { id: 'canarinho', label: 'Canarinho Izi', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132721.png', color: '#facc15' },
  ];

  const restaurantCategories = [
    { id: 'pizza', label: 'Pizza', color: '#ff7a00', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png' },
    { id: 'hamburguer', label: 'Lanches', color: '#facc15', img: 'https://cdn-icons-png.flaticon.com/512/3075/3075977.png' },
    { id: 'japonesa', label: 'Japonesa', color: '#000000', img: 'https://cdn-icons-png.flaticon.com/512/2252/2252431.png' },
    { id: 'brasileira', label: 'Brasileira', color: '#00a35e', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132715.png' },
    { id: 'doces', label: 'Doces', color: '#ff69b4', img: 'https://cdn-icons-png.flaticon.com/512/3132/3132709.png' },
    { id: 'padaria', label: 'Padaria', color: '#8b4513', img: 'https://cdn-icons-png.flaticon.com/512/3081/3081913.png' },
  ];

  return (
    <div className="flex flex-col h-full bg-white overflow-y-auto no-scrollbar pb-32">
      {/* Search Header */}
      <div className="sticky top-0 z-50 bg-white px-5 pt-4 pb-2">
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
        {/* Progress Card Izi Style */}
        <div className="bg-white rounded-3xl border border-zinc-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h3 className="text-[17px] font-black text-zinc-900 tracking-tight">Ganhe descontos ao fazer pedidos</h3>
              <p className="text-[14px] text-zinc-500 font-medium">Compre a partir de R$0,99</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="size-10 bg-yellow-400/20 rounded-full flex items-center justify-center">
                <span className="text-xl">🍔</span>
             </div>
             <div className="flex-1 space-y-3">
                <div className="relative h-2 w-full bg-[#f2f2f2] rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-yellow-400 w-[20%] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.4)]" />
                </div>
                <div className="flex justify-between px-1">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="size-6 bg-zinc-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <span className="material-symbols-rounded text-[14px] text-zinc-400">lock</span>
                        </div>
                    ))}
                </div>
             </div>
          </div>
        </div>

        {/* Alguém buscando cupons? Section - Yellow Tickets */}
        <div className="space-y-4">
            <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">Alguém buscando cupons?</h3>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                {[5, 10, 20].map((val) => (
                    <motion.div
                        key={val}
                        whileTap={{ scale: 0.95 }}
                        className="relative min-w-[120px] h-20 bg-yellow-400 rounded-2xl flex flex-col items-center justify-center shadow-lg shadow-yellow-100"
                    >
                        {/* Ticket notches */}
                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 size-4 bg-white rounded-full" />
                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 size-4 bg-white rounded-full" />
                        
                        <span className="text-black text-[10px] font-bold uppercase opacity-60 leading-none">a partir de</span>
                        <span className="text-black text-3xl font-black italic tracking-tighter">R${val}</span>
                    </motion.div>
                ))}
            </div>
        </div>

        {/* Conveniência Section */}
        <div className="space-y-4">
            <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">Conveniência</h3>
            <div className="grid grid-cols-2 gap-3">
                {convenienceCategories.map((cat, i) => (
                    <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCategoryClick(cat.id)}
                        className={`relative h-28 rounded-2xl overflow-hidden ${i === 4 ? 'col-span-2' : ''}`}
                        style={{ backgroundColor: cat.color }}
                    >
                        <div className="absolute inset-0 p-4 flex flex-col justify-start z-10 text-left">
                            <span className={`font-black text-xl leading-tight tracking-tight ${cat.color === '#facc15' ? 'text-black' : 'text-white'}`}>{cat.label}</span>
                            {cat.badge && (
                                <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1 mt-1 ${cat.color === '#facc15' ? 'text-black/70' : 'text-white/90'}`}>
                                    <span className="material-symbols-rounded text-[12px] fill-1">bolt</span>
                                    {cat.badge}
                                </span>
                            )}
                        </div>
                        <img 
                          src={cat.img} 
                          className={`absolute right-[-10px] bottom-[-10px] ${i === 4 ? 'w-32 h-full opacity-100' : 'w-20 h-20 rotate-[-5deg] opacity-80'} object-contain`} 
                          alt={cat.label} 
                        />
                    </motion.button>
                ))}
            </div>
        </div>

        {/* Restaurantes Section */}
        <div className="space-y-4">
            <h3 className="text-[18px] font-black text-zinc-900 tracking-tight">Restaurantes</h3>
            <div className="grid grid-cols-2 gap-3 pb-12">
                {restaurantCategories.map((cat) => (
                    <motion.button
                        key={cat.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onCategoryClick(cat.id)}
                        className="relative h-32 rounded-2xl overflow-hidden shadow-sm flex flex-col items-start p-4"
                        style={{ backgroundColor: cat.color }}
                    >
                        <span className={`font-black text-lg text-left leading-tight tracking-tight z-10 ${cat.color === '#facc15' ? 'text-black' : 'text-white'}`}>{cat.label}</span>
                        <img 
                          src={cat.img} 
                          className="absolute right-[-10px] bottom-[-10px] w-24 h-24 object-contain" 
                          alt={cat.label} 
                        />
                    </motion.button>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};
