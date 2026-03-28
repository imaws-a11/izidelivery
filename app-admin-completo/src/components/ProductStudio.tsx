import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError, showConfirm } from '../lib/useToast';

interface ProductStudioProps {
  product: any;
  onClose: () => void;
  onSave: () => void;
  menuCategoriesList: any[];
  handleFileUpload: (file: File, path: string) => Promise<string | null>;
  merchantId: string;
  fetchMenuCategories: () => void;
}

export const ProductStudio: React.FC<ProductStudioProps> = ({ 
  product, 
  onClose, 
  onSave, 
  menuCategoriesList,
  handleFileUpload,
  merchantId,
  fetchMenuCategories
}) => {
  const [editingItem, setEditingItem] = useState<any>({
    ...product,
    option_groups: product.option_groups || []
  });
  const [activeTab, setActiveTab] = useState<'info' | 'options'>('info');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState<{ parentId: string | null, title: string } | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (product.id && !product.id.startsWith('new-')) {
      fetchOptions();
    }
  }, [product.id]);

  const fetchOptions = async () => {
    setIsLoadingOptions(true);
    try {
      const { data: groups, error: groupsError } = await supabase
        .from('product_options_groups_delivery')
        .select(`
          *,
          options:product_options_items_delivery(*)
        `)
        .eq('product_id', product.id)
        .order('sort_order', { ascending: true });

      if (groupsError) throw groupsError;
      setEditingItem((prev: any) => ({ ...prev, option_groups: groups || [] }));
    } catch (err: any) {
      toastError('Erro ao carregar adicionais: ' + err.message);
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const handleSave = async () => {
    if (!editingItem.name || !editingItem.price) {
      toastError('Nome e Preço são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      const isNew = !editingItem.id || editingItem.id.startsWith('new-');
      const productData = {
        name: editingItem.name,
        description: editingItem.description,
        price: Number(editingItem.price),
        category: editingItem.category,
        sub_category: editingItem.subcategory || editingItem.sub_category,
        image_url: editingItem.image_url,
        merchant_id: merchantId,
        is_available: editingItem.is_available ?? true,
        featured: editingItem.featured ?? false,
      };

      let productId = editingItem.id;

      if (isNew) {
        const { data, error } = await supabase
          .from('products_delivery')
          .insert([productData])
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      } else {
        const { error } = await supabase
          .from('products_delivery')
          .update(productData)
          .eq('id', editingItem.id);
        if (error) throw error;
      }

      // Save Option Groups
      // Simple strategy: Delete all existing options and re-insert (common for complex forms)
      // Or manage it carefully. Let's do a cleaner approach if possible, but for delivery, re-sync is common.
      
      // Delete existing groups (cascades to items if foreign key is set correctly)
      if (!isNew) {
        await supabase
          .from('product_options_groups_delivery')
          .delete()
          .eq('product_id', productId);
      }

      if (editingItem.option_groups && editingItem.option_groups.length > 0) {
        for (const group of editingItem.option_groups) {
          const { data: newGroup, error: groupError } = await supabase
            .from('product_options_groups_delivery')
            .insert([{
              product_id: productId,
              name: group.name,
              min_select: group.min_select || 0,
              max_select: group.max_select || 1,
              is_required: group.is_required || false,
              sort_order: group.sort_order || 0
            }])
            .select()
            .single();

          if (groupError) throw groupError;

          if (group.options && group.options.length > 0) {
            const itemsToInsert = group.options.map((opt: any, idx: number) => ({
              group_id: newGroup.id,
              name: opt.name,
              price: Number(opt.price) || 0,
              sort_order: opt.sort_order || idx
            }));

            const { error: itemsError } = await supabase
              .from('product_options_items_delivery')
              .insert(itemsToInsert);

            if (itemsError) throw itemsError;
          }
        }
      }

      toastSuccess('Produto salvo com sucesso!');
      onSave();
      onClose();
    } catch (err: any) {
      toastError('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateQuickCategory = (parentId: string | null = null) => {
    const title = parentId ? 'Criar Subcategoria' : 'Criar Nova Categoria';
    setIsAddingCategory({ parentId, title });
    setNewCategoryName('');
  };

  const saveNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('merchant_categories_delivery')
        .insert([{
          merchant_id: merchantId,
          name: newCategoryName.trim(),
          parent_id: isAddingCategory?.parentId,
          is_active: true,
          sort_order: 0
        }]);

      if (error) throw error;
      
      toastSuccess(`${isAddingCategory?.title} concluída!`);
      fetchMenuCategories();
      setIsAddingCategory(null);
    } catch (err: any) {
      toastError('Erro ao criar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const addOptionGroup = () => {
    const newGroup = {
      name: 'Novo Grupo',
      min_select: 0,
      max_select: 1,
      is_required: false,
      sort_order: editingItem.option_groups.length,
      options: []
    };
    setEditingItem({
      ...editingItem,
      option_groups: [...editingItem.option_groups, newGroup]
    });
  };

  const removeOptionGroup = async (index: number) => {
    const group = editingItem.option_groups[index];
    if (await showConfirm({ 
      title: 'Excluir Grupo', 
      message: `Tem certeza que deseja excluir o grupo "${group.name || 'Novo Grupo'}" e todos os seus itens?`,
      danger: true 
    })) {
      const groups = [...editingItem.option_groups];
      groups.splice(index, 1);
      setEditingItem({ ...editingItem, option_groups: groups });
    }
  };

  const updateGroup = (index: number, field: string, value: any) => {
    const groups = [...editingItem.option_groups];
    groups[index] = { ...groups[index], [field]: value };
    setEditingItem({ ...editingItem, option_groups: groups });
  };

  const addOptionItem = (groupIndex: number) => {
    const groups = [...editingItem.option_groups];
    groups[groupIndex].options = [
      ...(groups[groupIndex].options || []),
      { name: '', price: 0, sort_order: (groups[groupIndex].options?.length || 0) }
    ];
    setEditingItem({ ...editingItem, option_groups: groups });
  };

  const removeOptionItem = (groupIndex: number, itemIndex: number) => {
    const groups = [...editingItem.option_groups];
    groups[groupIndex].options.splice(itemIndex, 1);
    setEditingItem({ ...editingItem, option_groups: groups });
  };

  const updateOptionItem = (groupIndex: number, itemIndex: number, field: string, value: any) => {
    const groups = [...editingItem.option_groups];
    groups[groupIndex].options[itemIndex] = { ...groups[groupIndex].options[itemIndex], [field]: value };
    setEditingItem({ ...editingItem, option_groups: groups });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-10 text-white overflow-hidden">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-5xl bg-slate-950 rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)] relative z-10 flex flex-col border border-white/5 h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-black/40">
          <div className="flex items-center gap-6">
            <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-slate-950 shadow-[0_0_30px_rgba(255,217,0,0.3)]">
              <span className="material-symbols-outlined text-4xl font-black">inventory_2</span>
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight leading-none mb-2">Estúdio de Produto</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary animate-pulse"></span>
                {editingItem.id?.startsWith('new-') ? 'Novo Produto Profissional' : `Editando: ${editingItem.name}`}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white/10 transition-all border border-white/5"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="px-10 py-2 border-b border-white/5 flex gap-10 bg-black/20">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-3 py-6 px-4 border-b-4 transition-all ${activeTab === 'info' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-2xl">info</span>
            <span className="text-xs font-black uppercase tracking-widest">Informações Base</span>
          </button>
          <button
            onClick={() => setActiveTab('options')}
            className={`flex items-center gap-3 py-6 px-4 border-b-4 transition-all ${activeTab === 'options' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <span className="material-symbols-outlined text-2xl">add_box</span>
            <span className="text-xs font-black uppercase tracking-widest">Complementos & Adicionais</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
          <AnimatePresence mode="wait">
            {activeTab === 'info' ? (
              <motion.div
                key="info"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12"
              >
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome do Produto</label>
                    <input 
                      type="text" 
                      value={editingItem.name || ''}
                      onChange={e => setEditingItem({...editingItem, name: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                      placeholder="Ex: Burger Izi Bacon"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Preço (R$)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={editingItem.price || ''}
                        onChange={e => setEditingItem({...editingItem, price: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoria</label>
                        <button 
                          onClick={() => handleCreateQuickCategory(null)}
                          className="flex items-center gap-1 text-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span> Criar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-[32px] border border-white/5 shadow-inner max-h-[140px] overflow-y-auto scrollbar-hide">
                        {menuCategoriesList.filter(c => !c.parent_id).length === 0 ? (
                          <p className="w-full text-center py-4 text-[10px] text-slate-600 font-black uppercase tracking-widest">Nenhuma categoria</p>
                        ) : (
                          menuCategoriesList.filter(c => !c.parent_id).map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setEditingItem({...editingItem, category: cat.name, subcategory: ''})}
                              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                editingItem.category === cat.name 
                                ? 'bg-primary text-slate-950 border-primary shadow-lg shadow-primary/20 scale-105' 
                                : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {editingItem.category && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-500">
                      <div className="flex justify-between items-center px-4">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Subcategoria (Opcional)</label>
                        <button 
                          onClick={() => {
                            const cat = menuCategoriesList.find(c => c.name === editingItem.category && !c.parent_id);
                            if (cat) handleCreateQuickCategory(cat.id);
                            else toastError('Selecione uma categoria primeiro');
                          }}
                          className="flex items-center gap-1 text-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span> Criar
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 p-4 bg-white/5 rounded-[32px] border border-white/5 shadow-inner max-h-[140px] overflow-y-auto scrollbar-hide">
                        <button
                          type="button"
                          onClick={() => setEditingItem({...editingItem, subcategory: ''})}
                          className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                            !(editingItem.subcategory || editingItem.sub_category)
                            ? 'bg-slate-800 text-white border-white/20' 
                            : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          Nenhuma
                        </button>
                        {menuCategoriesList
                          .filter(c => c.parent_id === menuCategoriesList.find(pc => pc.name === editingItem.category && !pc.parent_id)?.id)
                          .map(sub => (
                            <button
                              key={sub.id}
                              type="button"
                              onClick={() => setEditingItem({...editingItem, subcategory: sub.name, sub_category: sub.name})}
                              className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                (editingItem.subcategory === sub.name || editingItem.sub_category === sub.name)
                                ? 'bg-primary text-slate-950 border-primary shadow-lg shadow-primary/20 scale-105' 
                                : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))
                        }
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Descrição</label>
                    <textarea 
                      value={editingItem.description || ''}
                      onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                      className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-sm focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner min-h-[120px] resize-none"
                      placeholder="Descreva os ingredientes, tamanho, peso..."
                    />
                  </div>

                  <div className="flex items-center gap-6 p-6 bg-white/5 rounded-[32px] border border-white/5 shadow-inner">
                    <div className="flex-1">
                      <p className="text-sm font-black">Item Ativo</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Habilita no cardápio público</p>
                    </div>
                    <button
                      onClick={() => setEditingItem({...editingItem, is_available: !editingItem.is_available})}
                      className={`w-16 h-10 rounded-full relative transition-all duration-300 ${editingItem.is_available ? 'bg-primary' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-300 ${editingItem.is_available ? 'left-7' : 'left-1'}`}></div>
                    </button>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Mídia do Produto</label>
                    <div className="aspect-square rounded-[48px] bg-white/5 border-2 border-dashed border-white/10 relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                      {editingItem.image_url ? (
                        <>
                          <img src={editingItem.image_url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-5xl">edit</span>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-slate-500 group-hover:text-primary transition-colors">
                          <span className="material-symbols-outlined text-6xl">add_photo_alternate</span>
                          <span className="text-xs font-black uppercase tracking-widest">Clique ou arraste a imagem</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await handleFileUpload(file, 'products');
                            if (url) setEditingItem({ ...editingItem, image_url: url });
                          }
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-center text-slate-500 mt-4 uppercase tracking-[0.2em]">Formatos aceitos: JPG, PNG • Máximo 2MB</p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="options"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-10"
              >
                <div className="flex justify-between items-center bg-white/5 p-8 rounded-[40px] border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined font-black">layers</span>
                    </div>
                    <div>
                      <h4 className="font-black text-lg">Grupos de Adicionais</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Crie variações e complementos</p>
                    </div>
                  </div>
                  <button 
                    onClick={addOptionGroup}
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-slate-950 font-black text-xs uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined font-black">add</span> Novo Grupo
                  </button>
                </div>

                {isLoadingOptions ? (
                  <div className="py-20 flex flex-col items-center justify-center text-primary/50 animate-pulse">
                     <span className="material-symbols-outlined text-6xl mb-4 animate-spin">refresh</span>
                     <p className="text-xs font-black uppercase tracking-widest">Carregando Adicionais...</p>
                  </div>
                ) : (
                  <>
                    {editingItem.option_groups.length === 0 && (
                      <div className="py-20 flex flex-col items-center justify-center text-slate-600">
                        <span className="material-symbols-outlined text-8xl mb-4">stylus_note</span>
                        <p className="font-bold text-lg">Nenhum adicional configurado</p>
                        <p className="text-xs">Comece criando um grupo como "Escolha sua Bebida" ou "Ingredientes Extra"</p>
                      </div>
                    )}

                    <div className="space-y-8">
                      {editingItem.option_groups.map((group: any, gIdx: number) => (
                        <div key={gIdx} className="bg-slate-900/40 rounded-[48px] border border-white/5 overflow-hidden group/group-card">
                          <div className="bg-white/5 p-8 flex flex-wrap items-center gap-6 border-b border-white/5">
                            <div className="flex-1 min-w-[200px] space-y-2">
                              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Título do Grupo</label>
                              <input 
                                type="text"
                                value={group.name}
                                onChange={e => updateGroup(gIdx, 'name', e.target.value)}
                                className="bg-transparent border-none p-0 font-black text-2xl focus:ring-0 placeholder-slate-700 w-full"
                                placeholder="Ex: Adicionais"
                              />
                            </div>
                            
                            <div className="flex flex-wrap gap-4 items-center">
                              <div className="bg-black/40 rounded-3xl p-2 flex items-center gap-4 border border-white/5">
                                <div className="px-4 py-2">
                                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Min</label>
                                  <input 
                                    type="number" 
                                    value={group.min_select}
                                    onChange={e => updateGroup(gIdx, 'min_select', parseInt(e.target.value))}
                                    className="w-12 bg-transparent border-none p-0 text-center font-bold focus:ring-0"
                                  />
                                </div>
                                <div className="w-px h-8 bg-white/10"></div>
                                <div className="px-4 py-2">
                                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1">Max</label>
                                  <input 
                                    type="number" 
                                    value={group.max_select}
                                    onChange={e => updateGroup(gIdx, 'max_select', parseInt(e.target.value))}
                                    className="w-12 bg-transparent border-none p-0 text-center font-bold focus:ring-0"
                                  />
                                </div>
                              </div>
                              
                              <button 
                                onClick={() => updateGroup(gIdx, 'is_required', !group.is_required)}
                                className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest transition-all ${group.is_required ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-white/5 text-slate-500 border border-white/5'}`}
                              >
                                Obrigatório
                              </button>
                              
                              <button 
                                onClick={() => removeOptionGroup(gIdx)}
                                className="size-14 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center border border-red-500/20"
                              >
                                <span className="material-symbols-outlined">delete_sweep</span>
                              </button>
                            </div>
                          </div>

                          <div className="p-8 space-y-4">
                            <div className="flex justify-between items-center mb-6">
                               <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                 <span className="size-1.5 rounded-full bg-slate-500"></span>
                                 Itens do Grupo
                               </h5>
                               <button 
                                 onClick={() => addOptionItem(gIdx)}
                                 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:brightness-125 flex items-center gap-1"
                               >
                                 <span className="material-symbols-outlined text-sm">add_circle</span> Adicionar Item
                               </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {group.options?.map((opt: any, oIdx: number) => (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  key={oIdx} 
                                  className="bg-black/30 rounded-[32px] p-5 flex items-center gap-4 group/item border border-white/5 hover:border-white/10 transition-all shadow-inner"
                                >
                                  <div className="flex-1 space-y-1">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-3">Nome</label>
                                    <input 
                                      type="text" 
                                      value={opt.name}
                                      onChange={e => updateOptionItem(gIdx, oIdx, 'name', e.target.value)}
                                      className="w-full bg-transparent border-none p-0 font-bold text-sm focus:ring-0 placeholder-slate-700"
                                      placeholder="Ex: Queijo Extra"
                                    />
                                  </div>
                                  <div className="w-px h-8 bg-white/5"></div>
                                  <div className="w-24 space-y-1">
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-3">Preço R$</label>
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      value={opt.price}
                                      onChange={e => updateOptionItem(gIdx, oIdx, 'price', e.target.value)}
                                      className="w-full bg-transparent border-none p-0 font-bold text-sm focus:ring-0 text-primary"
                                      placeholder="0,00"
                                    />
                                  </div>
                                  <button 
                                    onClick={() => removeOptionItem(gIdx, oIdx)}
                                    className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-white/10 transition-all"
                                  >
                                    <span className="material-symbols-outlined text-lg">close</span>
                                  </button>
                                </motion.div>
                              ))}
                            </div>
                            
                            {(!group.options || group.options.length === 0) && (
                              <div className="py-8 border-2 border-dashed border-white/5 rounded-[32px] flex flex-col items-center justify-center text-zinc-700">
                                 <p className="text-xs font-bold uppercase tracking-widest">Nenhum item adicionado</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-10 border-t border-white/5 bg-black/60 backdrop-blur-md flex justify-between items-center">
          <div className="flex gap-6">
            <button 
              onClick={onClose}
              className="px-6 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
            >
              Descartar
            </button>
            {!editingItem.id?.startsWith('new-') && (
              <button 
                onClick={async () => {
                  if (await showConfirm({ title: 'Excluir Produto', message: `Deseja realmente excluir ${editingItem.name}?`, danger: true })) {
                    try {
                      setIsSaving(true);
                      await supabase.from('products_delivery').delete().eq('id', editingItem.id);
                      toastSuccess('Produto excluído!');
                      onSave();
                      onClose();
                    } catch (err: any) {
                      toastError('Erro: ' + err.message);
                    } finally {
                      setIsSaving(false);
                    }
                  }
                }}
                className="px-6 py-5 text-red-500 font-black text-[10px] uppercase tracking-widest hover:brightness-125 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                Excluir Produto
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button 
              disabled={isSaving}
              onClick={handleSave}
              className="px-16 py-6 bg-primary text-slate-950 font-black text-sm uppercase tracking-[0.2em] rounded-3xl shadow-[0_15px_40px_rgba(255,217,0,0.15)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="material-symbols-outlined animate-spin">refresh</span> Salvando Estúdio
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined font-black">verified</span> Finalizar & Publicar
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
      {/* Modal de Nova Categoria */}
      <AnimatePresence>
        {isAddingCategory && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddingCategory(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-slate-950 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative z-10"
            >
              <div className="p-10 space-y-8">
                <div className="flex items-center gap-4">
                  <div className="size-12 rounded-2xl bg-primary flex items-center justify-center text-slate-950">
                    <span className="material-symbols-outlined font-black">add_circle</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-black">{isAddingCategory.title}</h3>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      {isAddingCategory.parentId ? 'Vincular à categoria selecionada' : 'Nova categoria principal'}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-4">Nome da Categoria</label>
                  <input 
                    autoFocus
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveNewCategory()}
                    placeholder="Ex: Pizzas Gourmet"
                    className="w-full bg-white/5 border border-white/5 rounded-3xl px-8 py-5 font-bold text-lg focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all shadow-inner"
                  />
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsAddingCategory(null)}
                    className="flex-1 py-5 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    disabled={isSaving || !newCategoryName.trim()}
                    onClick={saveNewCategory}
                    className="flex-[2] py-5 bg-primary text-slate-950 font-black text-[10px] uppercase tracking-widest rounded-3xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Criando...' : 'Salvar Categoria'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
