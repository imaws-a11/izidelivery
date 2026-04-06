import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';

export default function CategoriesTab() {
  const {
    merchantsList,
    establishmentTypes,
    handleUpdateEstablishmentType,
    handleDeleteEstablishmentType,
    handleUpdateMerchant,
    setEditingItem,
    setSelectedMerchantPreview,
    setActivePreviewTab,
    isSaving,
    fetchMerchants,
    fetchEstablishmentTypes,
    setActiveTab
  } = useAdmin();

  const [filter, setFilter] = useState('');
  const [selectedMerchantId, setSelectedMerchantId] = useState<string | null>(null);
  const [isEditingGlobal, setIsEditingGlobal] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  
  // States for the refined assignment flow
  const [tempStoreType, setTempStoreType] = useState<string | null>(null);
  const [tempFoodCategory, setTempFoodCategory] = useState<string | null>(null);

  const selectedMerchant = merchantsList.find(m => m.id === selectedMerchantId);

  // Sync temp states when merchant selection changes
  useEffect(() => {
    if (selectedMerchant) {
      setTempStoreType(selectedMerchant.store_type || 'restaurant');
      setTempFoodCategory(selectedMerchant.food_category || 'all');
    }
  }, [selectedMerchantId]);

  const handleSaveAssignment = async () => {
    if (!selectedMerchant || !tempStoreType) return;
    try {
      const updated = { 
        ...selectedMerchant, 
        store_type: tempStoreType, 
        food_category: tempFoodCategory || 'all' 
      };
      
      setEditingItem(updated);
      await handleUpdateMerchant({ preventDefault: () => {} } as React.FormEvent);
      fetchMerchants();
    } catch (err) {
      console.error(err);
    }
  };

  const getMainCategories = () => establishmentTypes.filter(t => !t.parent_id);
  const getSubcategories = (parentValue: string) => {
    const parent = establishmentTypes.find(p => p.value === parentValue);
    if (!parent) return [];
    return establishmentTypes.filter(t => t.parent_id === parent.id);
  };

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[40px] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-5">
           <div className="size-16 rounded-[24px] bg-primary/10 flex items-center justify-center border-2 border-primary/5">
              <span className="material-symbols-outlined text-3xl text-primary font-black">architecture</span>
           </div>
           <div>
              <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tighter italic uppercase leading-none">Taxonomia IZI</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-2 uppercase text-[9px] font-black tracking-[0.3em]">Engenharia de Categorias e Especialidades</p>
           </div>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[24px]">
          <button 
            onClick={() => setIsEditingGlobal(false)}
            className={`px-8 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${!isEditingGlobal ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xl shadow-black/5' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-lg">storefront</span>
            Atribuição Lojistas
          </button>
          <button 
            onClick={() => setIsEditingGlobal(true)}
            className={`px-8 py-3.5 rounded-[20px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${isEditingGlobal ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xl shadow-black/5' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <span className="material-symbols-outlined text-lg">settings_suggest</span>
            Editor Global
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* SIDEBAR: LISTA DE LOJISTAS (SEMPRE VISÍVEL SE NÃO ESTIVER NO GLOBAL) */}
        {!isEditingGlobal && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[48px] p-8 shadow-sm border border-slate-100 dark:border-slate-800 sticky top-8">
               <div className="flex items-center justify-between mb-8">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase italic tracking-tight">Rede de Lojistas</h3>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black dark:text-slate-400">{merchantsList.length}</span>
               </div>
               
               <div className="relative mb-6">
                 <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">search</span>
                 <input 
                   type="text"
                   placeholder="Filtrar parceiros..."
                   value={filter}
                   onChange={e => setFilter(e.target.value)}
                   className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[24px] pl-14 pr-4 py-5 text-xs font-bold focus:ring-2 focus:ring-primary dark:text-white placeholder:text-slate-400 shadow-inner"
                 />
               </div>

               <div className="space-y-2 max-h-[calc(100vh-450px)] overflow-y-auto pr-2 custom-scrollbar">
                 {merchantsList.filter(m => m.store_name?.toLowerCase().includes(filter.toLowerCase())).map(m => (
                   <button
                     key={m.id}
                     onClick={() => setSelectedMerchantId(m.id)}
                     className={`w-full flex items-center gap-4 p-5 rounded-[28px] transition-all border-2 relative group ${selectedMerchantId === m.id ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5' : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                   >
                     <div className="size-14 rounded-[20px] bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-slate-700">
                       {m.store_logo ? <img src={m.store_logo} className="size-full object-cover" loading="lazy" /> : <span className="material-symbols-outlined text-slate-400 text-2xl">store</span>}
                     </div>
                     <div className="text-left min-w-0 flex-1">
                       <p className={`font-black text-[11px] tracking-tight truncate uppercase italic ${selectedMerchantId === m.id ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>{m.store_name || 'Estabelecimento Sem Nome'}</p>
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate mt-1">
                          {establishmentTypes.find(t => t.value === m.store_type)?.name || 'NÃO CATEGORIZADO'}
                       </p>
                     </div>
                     {selectedMerchantId === m.id && (
                        <div className="size-2.5 rounded-full bg-primary" />
                     )}
                   </button>
                 ))}
               </div>
            </div>
          </div>
        )}

        {/* ÁREA DE CONTEÚDO PRINCIPAL */}
        <div className={`${isEditingGlobal ? 'lg:col-span-12' : 'lg:col-span-8'}`}>
           <AnimatePresence mode="wait">
             {!isEditingGlobal ? (
               selectedMerchant ? (
                 <motion.div 
                   key="assign-panel"
                   initial={{ opacity: 0, scale: 0.98 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.98 }}
                   className="bg-white dark:bg-slate-900 rounded-[56px] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 relative overflow-hidden"
                 >
                    {/* BACKGROUND GLOW */}
                    <div className="absolute -top-24 -right-24 size-96 bg-primary/5 blur-[100px] rounded-full pointer-events-none" />
                    
                    <div className="relative space-y-12">
                       {/* MERCHANT PROFILE HEADER */}
                       <div className="flex flex-col md:flex-row items-center md:items-start gap-10 pb-12 border-b border-slate-100 dark:border-slate-800">
                          <div className="relative group">
                            <div className="size-32 rounded-[40px] bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center border-4 border-white dark:border-slate-800 shadow-2xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700">
                               {selectedMerchant.store_logo ? <img src={selectedMerchant.store_logo} className="size-full object-cover" /> : <span className="material-symbols-outlined text-5xl text-slate-400 font-bold">landscape</span>}
                            </div>
                            <div className="absolute -bottom-3 -right-3 size-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 border-4 border-white dark:border-slate-900">
                               <span className="material-symbols-outlined text-lg">verified</span>
                            </div>
                          </div>
                          
                          <div className="flex-1 text-center md:text-left">
                             <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                                <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic leading-none">{selectedMerchant.store_name}</h2>
                                <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-[9px] font-black uppercase tracking-widest border border-primary/10 w-fit mx-auto md:mx-0">
                                   ID: {selectedMerchant.id.slice(0, 8)}
                                </span>
                             </div>
                             <p className="text-slate-500 font-bold text-xs max-w-xl">{selectedMerchant.store_description || 'Nenhuma descrição fornecida para este estabelecimento.'}</p>
                             
                             <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
                                <button 
                                  onClick={() => {
                                    setSelectedMerchantPreview(selectedMerchant);
                                    setActivePreviewTab('info');
                                    setActiveTab('my_studio');
                                  }}
                                  className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:translate-y-[-2px] transition-all"
                                >
                                   <span className="material-symbols-outlined text-lg">open_in_new</span>
                                   Studio Completo
                                </button>
                                <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                   <span className="material-symbols-outlined text-slate-400">alternate_email</span>
                                   <span className="text-[10px] font-bold text-slate-500 uppercase">{selectedMerchant.email}</span>
                                </div>
                             </div>
                          </div>
                       </div>

                       {/* REFINED SELECTION: STEP 1 - PRIMARY CATEGORY */}
                       <div className="space-y-6">
                          <div className="flex items-center gap-4">
                             <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-slate-900 font-black italic">01</div>
                             <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic underline decoration-primary decoration-4 underline-offset-8">Categoria Principal</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                             {getMainCategories().map(t => {
                               const isSelected = tempStoreType === t.value && t.value !== undefined && t.value !== null;
                               return (
                                <button
                                  key={t.id}
                                  onClick={() => {
                                    setTempStoreType(t.value);
                                    setTempFoodCategory('all');
                                  }}
                                  className={`flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all group relative overflow-hidden ${isSelected ? 'bg-primary border-primary text-slate-900 shadow-2xl shadow-primary/20 scale-[1.05]' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                   {isSelected && (
                                      <motion.div layoutId={`main-cat-bg-${t.id}`} className="absolute inset-0 bg-primary pointer-events-none" />
                                   )}
                                   <span className={`material-symbols-outlined text-4xl relative z-10 transition-transform group-hover:scale-110 ${isSelected ? 'text-slate-900' : 'text-slate-300 dark:text-slate-600'}`}>{t.icon}</span>
                                   <span className="font-black text-[10px] uppercase tracking-widest relative z-10">{t.name}</span>
                                   
                                   {isSelected && (
                                      <div className="absolute top-4 right-4 z-10">
                                         <span className="material-symbols-outlined text-lg">check_circle</span>
                                      </div>
                                   )}
                                 </button>
                               );
                             })}
                          </div>
                       </div>

                       {/* REFINED SELECTION: STEP 2 - SPECIALTY */}
                       <AnimatePresence mode="wait">
                          {tempStoreType ? (
                            <motion.div 
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 20 }}
                              className="space-y-6 pt-10 border-t border-slate-100 dark:border-slate-800"
                            >
                               <div className="flex items-center gap-4">
                                  <div className="size-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black italic shadow-lg shadow-emerald-500/20">02</div>
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic underline decoration-emerald-500 decoration-4 underline-offset-8">Especialidade do Lojista</h3>
                               </div>

                               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                  <button
                                    onClick={() => setTempFoodCategory('all')}
                                    className={`flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all group relative overflow-hidden ${tempFoodCategory === 'all' || !tempFoodCategory ? 'bg-slate-900 text-white border-slate-900 shadow-2xl scale-[1.05]' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                  >
                                     <span className="material-symbols-outlined text-4xl relative z-10">close</span>
                                     <span className="font-black text-[10px] uppercase tracking-widest relative z-10">Lojista Geral</span>
                                  </button>

                                  {getSubcategories(tempStoreType).map(t => {
                                     const isSubSelected = tempFoodCategory === t.value && t.value !== undefined && t.value !== null;
                                     return (
                                       <button
                                         key={t.id}
                                         onClick={() => setTempFoodCategory(t.value)}
                                         className={`flex flex-col items-center gap-4 p-8 rounded-[32px] border-2 transition-all group relative overflow-hidden ${isSubSelected ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xl shadow-emerald-500/20 scale-[1.05]' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                       >
                                          {isSubSelected && (
                                             <motion.div layoutId={`sub-cat-bg-${t.id}`} className="absolute inset-0 bg-emerald-500 pointer-events-none" />
                                          )}
                                          <span className={`material-symbols-outlined text-4xl relative z-10 ${isSubSelected ? 'text-white' : 'text-slate-300 dark:text-slate-600'}`}>{t.icon}</span>
                                          <span className="font-black text-[10px] uppercase tracking-widest relative z-10">{t.name}</span>
                                          
                                          {isSubSelected && (
                                             <div className="absolute top-4 right-4 z-10">
                                                <span className="material-symbols-outlined text-lg">verified</span>
                                             </div>
                                          )}
                                       </button>
                                     );
                                   })}
                                  
                                  {getSubcategories(tempStoreType).length === 0 && (
                                    <div className="col-span-full py-16 flex flex-col items-center gap-4 bg-slate-50 dark:bg-slate-800/50 rounded-[40px] border-2 border-dashed border-slate-200 dark:border-slate-800">
                                       <span className="material-symbols-outlined text-5xl text-slate-200 dark:text-slate-700">inventory_2</span>
                                       <div className="text-center">
                                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Nenhuma especialidade disponível</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Vá em "Editor Global" para criar subcategorias para {tempStoreType}</p>
                                       </div>
                                    </div>
                                  )}
                               </div>
                            </motion.div>
                          ) : null}
                       </AnimatePresence>

                       {/* FOOTER ACTIONS - PERMITE EDITAR/SALVAR APÓS SELEÇÃO */}
                       <div className="pt-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                             <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                                <span className={`size-2.5 rounded-full ${isSaving ? 'bg-primary animate-pulse' : 'bg-emerald-500'}`} />
                                {isSaving ? 'Sincronizando com a nuvem...' : 'Pronto para atualizar configuração'}
                             </p>
                             {!isSaving && (
                               <p className="text-[9px] font-bold text-slate-500 italic">As seleções acima estão pendentes de confirmação.</p>
                             )}
                          </div>

                          <div className="flex gap-4">
                             <button 
                               onClick={() => {
                                 setTempStoreType(selectedMerchant.store_type || null);
                                 setTempFoodCategory(selectedMerchant.food_category || null);
                               }}
                               className="px-8 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all"
                             >
                                Descartar
                             </button>
                             <button 
                               onClick={handleSaveAssignment}
                               disabled={isSaving || !tempStoreType}
                               className="px-12 py-4 rounded-2xl bg-primary text-slate-900 font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                             >
                                Confirmar Atualização
                             </button>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               ) : (
                 <div className="h-[750px] bg-slate-50 dark:bg-slate-900/50 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[64px] flex flex-col items-center justify-center gap-8 p-12 text-center overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                    
                    <div className="size-32 rounded-[48px] bg-white dark:bg-slate-800 flex items-center justify-center text-slate-200 shadow-xl">
                       <span className="material-symbols-outlined text-6xl">web_traffic</span>
                    </div>
                    <div className="max-w-md">
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight mb-4 leading-tight">Orquestração de Lojistas</h3>
                       <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em] leading-relaxed">Selecione um estabelecimento na rede à esquerda para iniciar o processo de refinamento de visibilidade e taxonomia.</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
                       {[
                         {icon: 'category', label: 'Tipo'},
                         {icon: 'auto_awesome', label: 'Especialidade'},
                         {icon: 'radar', label: 'Visibilidade'}
                       ].map(i => (
                         <div key={i.label} className="p-6 rounded-3xl bg-white dark:bg-slate-800/30 border border-slate-50 dark:border-slate-800 shadow-sm">
                            <span className="material-symbols-outlined text-slate-300 mb-2">{i.icon}</span>
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{i.label}</p>
                         </div>
                       ))}
                    </div>
                 </div>
               )
             ) : (
               /* GERENCIAMENTO GLOBAL DE TIPOS (ESTABLISHMENT TYPES) */
               <motion.div 
                 key="global-panel"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="bg-white dark:bg-slate-900 rounded-[56px] p-12 shadow-sm border border-slate-100 dark:border-slate-800"
               >
                  <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8 pb-10 border-b border-slate-100 dark:border-slate-800">
                     <div className="flex items-center gap-6">
                        <div className="size-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                           <span className="material-symbols-outlined text-3xl">settings_applications</span>
                        </div>
                        <div>
                           <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none">Matriz de Taxonomia</h2>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Dicionário global de classes e sub-classes</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => {
                         setEditingType({ name: '', value: '', icon: 'category', is_active: true, parent_id: null });
                       }}
                       className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/30 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all"
                     >
                       <span className="material-symbols-outlined text-xl">add_circle</span>
                       Nova Categoria Master
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                     {getMainCategories().map(main => (
                       <div key={main.id} className="bg-slate-50 dark:bg-slate-800 px-8 py-10 rounded-[40px] border border-slate-100 dark:border-slate-700/50 space-y-10 group hover:shadow-2xl hover:shadow-black/5 transition-all relative overflow-hidden">
                          <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-30" />
                          
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="size-14 rounded-3xl bg-white dark:bg-slate-700 flex items-center justify-center text-primary shadow-sm border border-slate-50 dark:border-slate-600">
                                   <span className="material-symbols-outlined text-3xl">{main.icon}</span>
                                </div>
                                <div>
                                   <span className="font-black text-[13px] uppercase tracking-tighter dark:text-white italic">{main.name}</span>
                                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{main.value}</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button onClick={() => setEditingType(main)} className="size-10 rounded-2xl bg-white dark:bg-slate-700 text-slate-400 hover:text-primary transition-all shadow-sm flex items-center justify-center hover:border-primary/30 border border-transparent">
                                   <span className="material-symbols-outlined text-lg font-bold">edit</span>
                                </button>
                                <button onClick={() => handleDeleteEstablishmentType(main.id)} className="size-10 rounded-2xl bg-rose-50 dark:bg-rose-500/10 text-rose-400 hover:text-rose-600 transition-all shadow-sm flex items-center justify-center border border-transparent hover:border-rose-500/30">
                                   <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                             </div>
                          </div>

                          <div className="space-y-4">
                             <div className="flex items-center justify-between ml-1 mb-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Especialidades Relacionadas</p>
                                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full">{establishmentTypes.filter(t => t.parent_id === main.id).length}</span>
                             </div>
                             
                             <div className="flex flex-wrap gap-2">
                                {establishmentTypes.filter(t => t.parent_id === main.id).map(sub => (
                                  <div key={sub.id} className="group/sub relative flex items-center gap-2 bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm transition-all hover:bg-slate-900 hover:text-white dark:hover:bg-primary dark:hover:text-slate-900 hover:scale-105 active:scale-95">
                                     <span className="text-[10px] font-black uppercase tracking-tight">{sub.name}</span>
                                     <div className="hidden group-hover/sub:flex absolute -top-12 left-1/2 -translate-x-1/2 gap-2 bg-slate-900 rounded-2xl p-2 shadow-2xl z-20 border border-white/10 min-w-max">
                                        <button onClick={(e) => { e.stopPropagation(); setEditingType(sub); }} className="px-3 py-1.5 rounded-xl bg-white/10 text-white text-[9px] font-black uppercase hover:bg-primary hover:text-slate-900 transition-all">Editar</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteEstablishmentType(sub.id); }} className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-500 text-[9px] font-black uppercase hover:bg-rose-500 hover:text-white transition-all">Excluir</button>
                                     </div>
                                  </div>
                                ))}
                                <button 
                                  onClick={() => setEditingType({ name: '', value: '', icon: 'subdirectory_arrow_right', parent_id: main.id, is_active: true })}
                                  className="flex items-center justify-center size-10 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-300 hover:border-primary hover:text-primary transition-all"
                                  title="Nova Especialidade"
                                >
                                   <span className="material-symbols-outlined text-xl">add</span>
                                </button>
                             </div>
                          </div>
                       </div>
                     ))}
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE TIPO DE ESTABELECIMENTO */}
      <AnimatePresence>
        {editingType && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
             <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setEditingType(null)} />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, rotateX: 20 }} 
               animate={{ scale: 1, opacity: 1, rotateX: 0 }} 
               exit={{ scale: 0.9, opacity: 0, rotateX: 20 }} 
               className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[56px] p-12 relative z-10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-white/5 h-auto max-h-[90vh] overflow-y-auto custom-scrollbar"
             >
                <button onClick={() => setEditingType(null)} className="absolute top-10 right-10 size-12 rounded-[20px] bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:text-rose-500 transition-all">
                   <span className="material-symbols-outlined font-black">close</span>
                </button>

                <div className="mb-10 text-center md:text-left">
                   <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6 mx-auto md:mx-0">
                      <span className="material-symbols-outlined text-3xl font-black">{editingType.parent_id ? 'subdirectory_arrow_right' : 'category'}</span>
                   </div>
                   <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tight leading-none">
                      {editingType.parent_id ? 'Nova Especialidade' : 'Categoria Master'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Configure os metadados da taxonomia</p>
                </div>
                
                <div className="space-y-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome de Exibição (Slug)</label>
                      <input 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-6 font-black text-sm focus:ring-4 focus:ring-primary/20 dark:text-white transition-all shadow-inner"
                        value={editingType.name}
                        onChange={e => {
                           const name = e.target.value;
                           // Só gera novo slug/value se for item novo (sem ID)
                           if (!editingType.id) {
                             const slug = name.toLowerCase().replace(/\s+/g, '_').normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9_]/g, '');
                             setEditingType({...editingType, name, value: slug});
                           } else {
                             setEditingType({...editingType, name});
                           }
                        }}
                        placeholder="Ex: Açaí & Shakes"
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4 flex justify-between">
                         ID do Sistema
                         <span className="text-[8px] text-slate-400">(Automático)</span>
                      </label>
                      <input 
                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-[28px] px-8 py-6 font-bold text-xs text-slate-400 uppercase tracking-widest pointer-events-none opacity-60"
                        value={editingType.value}
                        readOnly
                      />
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Ícone Representativo</label>
                      <div className="flex items-center gap-5 bg-slate-50 dark:bg-slate-800 p-4 rounded-[32px] border border-slate-100 dark:border-slate-700">
                         <div className="size-20 rounded-[24px] bg-white dark:bg-slate-700 flex items-center justify-center text-primary shadow-sm border border-slate-100 dark:border-slate-600">
                            <span className="material-symbols-outlined text-4xl">{editingType.icon || 'question_mark'}</span>
                         </div>
                         <div className="flex-1 space-y-2">
                            <input 
                              className="w-full bg-transparent border-none rounded-xl px-2 py-1 font-black text-xs focus:ring-0 dark:text-white"
                              value={editingType.icon}
                              onChange={e => setEditingType({...editingType, icon: e.target.value})}
                              placeholder="Google Icon Name"
                            />
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest ml-2 italic underline cursor-help">Ver biblioteca de ícones</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Disponibilidade</label>
                      <button 
                        onClick={() => setEditingType({...editingType, is_active: !editingType.is_active})}
                        className={`w-full flex items-center justify-between p-6 rounded-[32px] border-2 transition-all ${editingType.is_active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-rose-500/10 border-rose-500/20 text-rose-600'}`}
                      >
                         <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined">{editingType.is_active ? 'check_circle' : 'block'}</span>
                            <span className="font-black text-[10px] uppercase tracking-widest">Categoria {editingType.is_active ? 'Ativa' : 'Inativa'}</span>
                         </div>
                         <div className={`w-14 h-8 rounded-full relative transition-all ${editingType.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                            <div className={`absolute top-1 size-6 rounded-full bg-white shadow-lg transition-all ${editingType.is_active ? 'right-1' : 'left-1'}`} />
                          </div>
                       </button>
                    </div>

                   <div className="pt-10 flex gap-4">
                      <button onClick={() => setEditingType(null)} className="flex-1 py-5 rounded-[24px] bg-slate-100 dark:bg-slate-800 font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">Descartar</button>
                      <button 
                         onClick={async () => {
                           if (!editingType.name || !editingType.value) {
                             alert('Por favor, preencha o nome da categoria.');
                             return;
                           }
                           await handleUpdateEstablishmentType(editingType);
                           setEditingType(null);
                           fetchEstablishmentTypes();
                         }}
                         className="flex-[1.5] py-5 rounded-[24px] bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                      >
                         Salvar na Matriz
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
