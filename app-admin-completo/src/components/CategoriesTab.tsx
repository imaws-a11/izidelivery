import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

// Gestão de Categorias
export default function CategoriesTab() {
  const {
    categoriesState, setCategoriesState, categoryGroupFilter, setCategoryGroupFilter, showCategoryListModal, setShowCategoryListModal, selectedCategoryStudio, setSelectedCategoryStudio, editingItem, setEditingItem, editType, setEditType, isSaving, handleUpdateCategory, handleSeedCategories, fetchCategories, setActiveStudioTab
  } = useAdmin();

  return (
    <>
      {/* Categories Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">Ecosistema de Serviços</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Gerencie as modalidades de mobilidade e serviços de entrega.</p>
        </div>
        
        {/* Segment Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px] border border-slate-200 dark:border-slate-700 shadow-inner">
          {[
            { id: 'all', label: 'Todos', icon: 'grid_view' },
            { id: 'mobility', label: 'Mobilidade', icon: 'directions_car' },
            { id: 'service', label: 'Serviços', icon: 'shopping_bag' }
          ].map((seg) => (
            <button
              key={seg.id}
              onClick={() => setCategoryGroupFilter(seg.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${
                categoryGroupFilter === seg.id 
                ? 'bg-white dark:bg-slate-700 text-primary shadow-lg ring-1 ring-black/5' 
                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-base">{seg.icon}</span>
              {seg.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          {categoriesState.length === 0 && (
            <button
              onClick={handleSeedCategories}
              className="flex items-center gap-3 bg-emerald-500 text-white px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-lg">rocket_launch</span>
              Configuração Inicial
            </button>
          )}
          <button
            onClick={() => {
              setSelectedCategoryStudio({ 
                id: `new-${Date.now()}`, 
                name: '', 
                description: '', 
                icon: 'category', 
                type: categoryGroupFilter === 'all' ? 'service' : categoryGroupFilter, 
                is_active: true 
              });
              setActiveStudioTab('general');
            }}
            className="flex items-center gap-3 bg-primary text-slate-900 px-8 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Nova Categoria
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Categorias', val: categoriesState.length.toString().padStart(2, '0'), icon: 'layers', color: 'bg-primary/10 text-primary', clickable: true },
          { label: 'Ativas', val: categoriesState.filter(c => c.is_active).length.toString().padStart(2, '0'), icon: 'check_circle', color: 'bg-emerald-50 text-emerald-500' },
          { label: 'Inativas', val: categoriesState.filter(c => !c.is_active).length.toString().padStart(2, '0'), icon: 'cancel', color: 'bg-slate-100 text-slate-400' },
          { label: 'Novas (Mês)', val: '+1', icon: 'fiber_new', color: 'bg-blue-50 text-blue-500' },
        ].map((stat, i) => (
          <div 
            key={i} 
            onClick={() => stat.clickable && setShowCategoryListModal(true)}
            className={`bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm group ${stat.clickable ? 'cursor-pointer hover:border-primary transition-all hover:shadow-lg' : ''}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${stat.color}`}>
                <span className="material-symbols-outlined">{stat.icon}</span>
              </div>
              {stat.clickable && <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">open_in_new</span>}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-2 tracking-tight">{stat.val}</h3>
          </div>
        ))}
      </div>

      {/* Categories Grid (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {categoriesState
          .filter(c => !c.parent_id)
          .filter(c => categoryGroupFilter === 'all' || (c.type || 'service') === categoryGroupFilter)
          .map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-[48px] p-8 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group flex flex-col relative overflow-hidden"
          >
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 -mr-16 -mt-16 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors"></div>

            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className="w-20 h-20 rounded-[28px] flex items-center justify-center shadow-lg overflow-hidden group-hover:scale-110 transition-transform"
                style={{ backgroundColor: (cat.type || 'service') === 'mobility' ? '#E6F0FF' : '#FFF0E6' }}
              >
                {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/') || cat.icon.length > 30) ? (
                  <img src={cat.icon} className="w-[80%] h-[80%] object-contain drop-shadow-md" alt={cat.name} />
                ) : (
                  <span className="material-symbols-outlined text-4xl font-bold text-slate-600">{cat.icon || 'category'}</span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setSelectedCategoryStudio(cat); setActiveStudioTab('general'); }}
                  className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                </button>
                <button
                  onClick={async () => {
                    const confirm = await showConfirm({ message: 'Excluir esta categoria e todas as suas subcategorias?' });
                    if (confirm) {
                      const { error } = await supabase.from('categories_delivery').delete().eq('id', cat.id);
                      if (!error) fetchCategories();
                    }
                  }}
                  className="size-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 transition-all flex items-center justify-center border border-slate-100 dark:border-slate-700"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </button>
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{cat.name}</h3>
                <div className={`size-2 rounded-full ${cat.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-md border ${
                  (cat.type || 'service') === 'mobility' 
                  ? 'bg-blue-50 text-blue-500 border-blue-100' 
                  : 'bg-amber-50 text-amber-500 border-amber-100'
                }`}>
                  {(cat.type || 'service') === 'mobility' ? 'Mobilidade' : 'Serviço'}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                {cat.description || cat.desc || 'Nenhuma descrição informada para esta categoria principal.'}
              </p>
            </div>

            {/* Subcategories Area */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 rounded-[32px] p-6 mb-8 border border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4 px-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Subcategorias ({categoriesState.filter(s => s.parent_id === cat.id).length})</span>
                <button 
                  onClick={() => {
                    setSelectedCategoryStudio(cat);
                    setActiveStudioTab('subcategories');
                  }}
                  className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Adicionar
                </button>
              </div>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                {categoriesState.filter(s => s.parent_id === cat.id).map(sub => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 group/sub">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{sub.name}</span>
                    <div className="flex gap-2 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedCategoryStudio(cat); setActiveStudioTab('subcategories'); }} className="text-slate-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined text-sm">edit</span>
                      </button>
                      <button onClick={async () => { if(await showConfirm({ message: 'Excluir?' })) await supabase.from('categories_delivery').delete().eq('id', sub.id); fetchCategories(); }} className="text-slate-400 hover:text-red-500 transition-colors">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  </div>
                ))}
                {categoriesState.filter(s => s.parent_id === cat.id).length === 0 && (
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center py-4 italic">Nenhuma subcategoria</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto">
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                <span className={`text-[9px] font-black uppercase tracking-widest ${cat.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {cat.is_active ? 'Habilitado' : 'Desabilitado'}
                </span>
              </div>
              <button 
                onClick={async () => {
                  await supabase.from('categories_delivery').update({ is_active: !cat.is_active }).eq('id', cat.id);
                  fetchCategories();
                }}
                className={`w-12 h-6 rounded-full relative transition-all ${cat.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 size-4 bg-white rounded-full shadow-sm transition-all ${cat.is_active ? 'left-7' : 'left-1'}`}></div>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}
}
