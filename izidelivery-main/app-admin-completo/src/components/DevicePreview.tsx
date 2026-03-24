import React from 'react';
import type { Merchant, MerchantProfile, Product, MenuCategory } from '../lib/types';

interface DevicePreviewProps {
  targetItem: Merchant | MerchantProfile | null;
  targetProducts: Product[];
  targetCategories: any[];
}

export default function DevicePreview({ targetItem, targetProducts, targetCategories }: DevicePreviewProps) {
  return (
    <div className="hidden lg:flex w-[400px] bg-slate-50 dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex-col items-center justify-center p-10 select-none">
      <div className="relative w-full max-w-[320px] aspect-[9/19] bg-white dark:bg-slate-900 rounded-[50px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.3)] border-[8px] border-slate-900 dark:border-slate-800 overflow-hidden">
        {/* Status Bar */}
        <div className="absolute top-0 w-full h-8 flex items-center justify-between px-8 z-20">
          <span className="text-[10px] font-black dark:text-white">9:41</span>
          <div className="flex gap-1.5">
            <span className="material-symbols-outlined text-xs dark:text-white">signal_cellular_4_bar</span>
            <span className="material-symbols-outlined text-xs dark:text-white">wifi</span>
            <span className="material-symbols-outlined text-xs dark:text-white">battery_full</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-hide pt-4">
          {/* Banner */}
          <div className="relative h-40 bg-slate-200 dark:bg-slate-800">
            <img 
              src={targetItem?.store_banner || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1000'} 
              className="w-full h-full object-cover"
              alt="Banner"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-4 left-6 flex items-center gap-3">
              <div className="size-14 rounded-2xl bg-white p-0.5 shadow-lg border-2 border-white overflow-hidden">
                <img className="w-full h-full object-cover rounded-[14px]" src={targetItem?.store_logo || 'https://via.placeholder.com/150'} />
              </div>
              <div className="text-white">
                <h4 className="text-sm font-black truncate max-w-[150px]">{targetItem?.store_name || 'Minha Loja'}</h4>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[10px] fill-1 text-primary">star</span>
                  <span className="text-[10px] font-black">4.9 • 30-40 min</span>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4">
             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
               {targetItem?.store_description || 'Bem-vindo ao nosso estabelecimento! Qualidade e sabor em cada pedido.'}
             </p>
          </div>

          <div className="flex gap-3 px-6 pb-4 overflow-x-auto scrollbar-hide">
             {targetCategories && targetCategories.filter(c => !c.parent_id).length > 0 ? (
               targetCategories.filter(c => !c.parent_id).map((cat, i) => (
                 <span key={cat.id} className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                   {cat.name}
                 </span>
               ))
             ) : (
                ['Destaques', 'Combos', 'Bebidas'].map((c, i) => (
                  <span key={i} className={`whitespace-nowrap px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider ${i === 0 ? 'bg-primary text-slate-900 shadow-md shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                    {c}
                  </span>
                ))
             )}
          </div>

          <div className="px-6 space-y-3 pb-20">
            {(targetProducts && targetProducts.length > 0 ? targetProducts : [1,2,3]).map((p: any, i: number) => (
              <div key={p.id || i} className="flex gap-4 bg-white dark:bg-slate-800 p-3 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="size-20 rounded-[18px] bg-slate-50 dark:bg-slate-900 shrink-0 overflow-hidden">
                  <img src={p.image_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h5 className="text-[11px] font-black text-slate-900 dark:text-white truncate">{p.name || `Produto Exemplo ${i+1}`}</h5>
                  <p className="text-[9px] text-slate-400 font-bold truncate mt-0.5">{p.description || 'Descrição deliciosa...'}</p>
                  <div className="flex justify-between items-end mt-2">
                     <span className="text-xs font-black text-primary">R$ {p.price || '0,00'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-900 dark:bg-slate-800 rounded-b-[20px] z-30"></div>
      </div>
    </div>
  
  );
}
