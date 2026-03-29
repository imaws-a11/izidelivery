import React, { useState } from 'react';

interface MerchantSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchants: any[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
}

export const MerchantSelectorModal: React.FC<MerchantSelectorModalProps> = ({ isOpen, onClose, merchants, selectedIds, onConfirm }) => {
  const [localSelection, setLocalSelection] = useState<string[]>(selectedIds);
  const [search, setSearch] = useState("");

  React.useEffect(() => {
    if (isOpen) {
      setLocalSelection(selectedIds);
      setSearch("");
    }
  }, [isOpen, selectedIds]);

  if (!isOpen) return null;

  const filteredMerchants = merchants.filter(m => 
    m.store_name?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () => {
    if (localSelection.length === merchants.length) {
      setLocalSelection([]);
    } else {
      setLocalSelection(merchants.map(m => m.id));
    }
  };

  const currentSelectionCount = localSelection.length;
  const totalCount = merchants.length;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-zinc-950 border border-white/10 rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 relative bg-gradient-to-b from-zinc-900 to-zinc-950">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
               <span className="material-symbols-outlined text-yellow-400">storefront</span>
            </div>
            <div>
              <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">Seleção de Lojistas</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-1">Multi-Broker Network</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 bg-zinc-950 flex flex-col gap-5">
           
           <div className="relative">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">search</span>
              <input 
                 autoFocus
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-yellow-400/50 transition-colors"
                 placeholder="Pesquisar loja parceira..."
              />
           </div>

           <div className="flex justify-between items-center px-1">
             <span className="text-xs font-bold text-zinc-500">{currentSelectionCount} selecionados de {totalCount}</span>
             <button onClick={toggleAll} className="text-[10px] font-black uppercase tracking-widest text-yellow-400 hover:text-yellow-300 transition-colors">
               {currentSelectionCount === totalCount ? "Desmarcar Todos" : "Selecionar Todos"}
             </button>
           </div>

           <div className="grid grid-cols-1 gap-2">
              {filteredMerchants.map(m => {
                 const isSelected = localSelection.includes(m.id);
                 return (
                    <label key={m.id} className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all active:scale-[0.98] ${isSelected ? "bg-yellow-400/5 border-yellow-400/30" : "bg-zinc-900/50 border-white/5 hover:border-white/10"}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${isSelected ? "bg-yellow-400 border-yellow-400" : "bg-zinc-800 border-zinc-700"}`}>
                             {isSelected && <span className="material-symbols-outlined text-black text-[14px] font-bold">check</span>}
                          </div>
                          <div>
                             <span className={`text-sm font-bold block leading-none mb-1 ${isSelected ? "text-yellow-400" : "text-zinc-300"}`}>{m.store_name}</span>
                             <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold">Lojista ID: {m.id.substring(0, 8)}</span>
                          </div>
                       </div>
                       <input 
                         type="checkbox" 
                         className="sr-only" 
                         checked={isSelected} 
                         onChange={() => {
                           if (isSelected) {
                             setLocalSelection(localSelection.filter(id => id !== m.id));
                           } else {
                             setLocalSelection([...localSelection, m.id]);
                           }
                         }} 
                       />
                    </label>
                 );
              })}
           </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-zinc-950">
           <button 
             onClick={() => onConfirm(localSelection)}
             className="w-full bg-yellow-400 hover:bg-yellow-300 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(255,215,9,0.2)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
           >
             <span>Confirmar Lojistas ({currentSelectionCount})</span>
             <span className="material-symbols-outlined text-lg">arrow_forward</span>
           </button>
        </div>
      </div>
    </div>
  );
};
