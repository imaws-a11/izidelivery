import React, { useState } from 'react';

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: any[];
  selectedProducts: any[];
  onConfirm: (selected: any[]) => void;
}

export const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({ isOpen, onClose, products, selectedProducts, onConfirm }) => {
  const [localSelection, setLocalSelection] = useState<any[]>(selectedProducts);
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelection = (product: any) => {
    setLocalSelection(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  const currentSelectionCount = localSelection.length;
  const totalValue = localSelection.reduce((acc, curr) => acc + Number(curr.price), 0);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[36px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header - Stealth Luxury */}
        <div className="p-8 pb-6 border-b border-white/5 relative bg-gradient-to-br from-zinc-900 via-zinc-950 to-black">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-[20px] bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,215,9,0.3)]">
               <span className="material-symbols-outlined text-black font-black">inventory_2</span>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-md">Inventário</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 mt-1">Montador Estratégico de Combos</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 bg-zinc-950 flex flex-col gap-6">
           
           <div className="relative group">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-yellow-400 transition-colors">search</span>
              <input 
                 autoFocus
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full bg-zinc-900/50 border border-white/10 rounded-[20px] pl-14 pr-5 py-4 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400/50 transition-colors shadow-inner"
                 placeholder="Buscar por nome do produto..."
              />
           </div>

           <div className="flex justify-between items-center px-2">
             <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-yellow-400 font-bold animate-pulse"></span>
               <span className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-400">Selecionados: <span className="text-yellow-400">{currentSelectionCount}</span></span>
             </div>
             
             {currentSelectionCount > 0 && (
               <button onClick={() => setLocalSelection([])} className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-rose-500 transition-colors">
                 Limpar Combo
               </button>
             )}
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredProducts.map(p => {
                 const isSelected = localSelection.some(sp => sp.id === p.id);
                 return (
                    <label key={p.id} className={`group relative flex items-center gap-4 p-4 rounded-[24px] border border-white/5 cursor-pointer transition-all active:scale-[0.98] overflow-hidden ${isSelected ? "bg-yellow-400/5 border-yellow-400/30" : "bg-black hover:bg-zinc-900 hover:border-white/10"}`}>
                       {isSelected && <div className="absolute inset-y-0 left-0 w-1 bg-yellow-400 shadow-[0_0_10px_rgba(255,215,9,0.5)]" />}
                       
                       <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 relative">
                          <img src={p.image_url || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"} alt="" className={`w-full h-full object-cover transition-transform ${isSelected ? 'scale-110 brightness-75' : 'group-hover:scale-110 grayscale brightness-50 group-hover:grayscale-0 group-hover:brightness-100'}`} />
                          
                          <div className={`absolute inset-0 flex items-center justify-center transition-all ${isSelected ? "opacity-100" : "opacity-0 scale-50"}`}>
                             <div className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                               <span className="material-symbols-outlined text-black text-[14px] font-black">check</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex-1 min-w-0 pr-2">
                          <h4 className={`text-sm font-black truncate leading-tight mb-1 transition-colors ${isSelected ? "text-yellow-400" : "text-white group-hover:text-yellow-400/50"}`}>{p.name}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-0.5 rounded-md inline-block">
                             R$ {Number(p.price).toFixed(2).replace('.', ',')}
                          </span>
                       </div>
                       <input type="checkbox" checked={isSelected} onChange={() => toggleSelection(p)} className="sr-only" />
                    </label>
                 );
              })}
           </div>
           {filteredProducts.length === 0 && (
             <div className="py-12 flex flex-col items-center justify-center gap-3">
               <span className="material-symbols-outlined text-4xl text-zinc-700">search_off</span>
               <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Nenhum produto encontrado</p>
             </div>
           )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-white/5 bg-gradient-to-t from-zinc-950 to-zinc-900/50 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex flex-col w-full md:w-auto">
             <span className="text-[9px] uppercase tracking-[0.2em] font-black text-zinc-500 mb-1">Valor Original do Combo</span>
             <span className="text-2xl font-black text-white tracking-tighter shadow-sm">
                R$ {totalValue.toFixed(2).replace('.', ',')}
             </span>
           </div>
           
           <button 
             onClick={() => onConfirm(localSelection)}
             disabled={currentSelectionCount === 0}
             className="w-full md:w-auto flex-1 bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none hover:bg-yellow-300 text-black py-4 px-8 rounded-[20px] font-black text-[11px] uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(255,215,9,0.15)] hover:shadow-[0_0_40px_rgba(255,215,9,0.3)] transition-all active:scale-[0.98] flex items-center justify-center gap-3"
           >
             <span>Adicionar Combo ({currentSelectionCount})</span>
             <span className="material-symbols-outlined text-lg">magic_button</span>
           </button>
        </div>
      </div>
    </div>
  );
};
