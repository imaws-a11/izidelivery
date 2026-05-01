import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError } from '../lib/useToast';
import { supabase } from '../lib/supabase';

export default function EstablishmentTypesTab() {
  const { 
    establishmentTypes, handleUpdateEstablishmentType, handleDeleteEstablishmentType, 
    isSaving, userRole 
  } = useAdmin();

  const [editingType, setEditingType] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `icon_${Date.now()}.${fileExt}`;
      const filePath = `taxonomias/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('assets').getPublicUrl(filePath);
      
      setEditingType({ ...editingType, icon: data.publicUrl });
      toastSuccess('Ícone 3D carregado!');
    } catch (err: any) {
      toastError('Erro no upload: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-black uppercase tracking-widest italic opacity-30">
        Acesso Restrito ao Admin Master
      </div>
    );
  }

  const filtered = establishmentTypes.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleUpdateEstablishmentType(editingType);
    setEditingType(null);
  };

  const generateSlug = (text: string) => {
    return text.toString().toLowerCase().trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9 -]/g, "") // Mantém apenas letras, números, espaços e hifens
      .replace(/\s+/g, "-") // Troca espaços por hifens
      .replace(/-+/g, "-"); // Evita múltiplos hifens seguidos
  };

  return (
    <div className="flex flex-col h-full font-display">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
            Ecossistema de Serviços
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mt-1">
            Gestão de Taxonomia e Categorias Globais do Izi
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <input
              type="text"
              placeholder="Pesquisar categoria..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl px-6 py-4 pl-12 font-bold text-sm focus:ring-4 focus:ring-primary/20 transition-all dark:text-white w-64 shadow-sm"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors">search</span>
          </div>

          <button 
            onClick={() => setEditingType({ name: '', value: '', icon: '', description: '', is_active: true })}
            className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
          >
            Nova Categoria
          </button>
        </div>
      </div>

      {/* GRID DE CATEGORIAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pr-2 scrollbar-hide pb-20">
        <AnimatePresence mode="popLayout">
          {filtered.map((t, idx) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-primary/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all" />
              
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="size-16 rounded-[24px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-slate-900 transition-all shadow-inner overflow-hidden">
                    {t.icon?.startsWith('http') ? (
                      <img src={t.icon} alt={t.name} className="w-full h-full object-contain p-2 drop-shadow-md" />
                    ) : (
                      <span className="material-symbols-outlined text-3xl font-black">category</span>
                    )}
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${t.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                    {t.is_active ? 'Ativo' : 'Inativo'}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter truncate">{t.name}</h3>
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">ID: {t.value}</p>
                </div>

                <p className="text-slate-400 text-[10px] font-bold leading-relaxed line-clamp-2 min-h-[30px]">
                  {t.description || 'Nenhuma descrição definida para esta categoria de serviço.'}
                </p>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setEditingType(t)}
                    className="flex-1 py-3 bg-slate-50 dark:bg-white/5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteEstablishmentType(t.id)}
                    className="size-10 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-400 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined text-xl">delete</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* MODAL DE EDIÇÃO */}
      <AnimatePresence>
        {editingType && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-xl bg-black/40">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[48px] shadow-2xl border border-white/10 p-10 overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Editor de Taxonomia</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Defina as propriedades globais da categoria</p>
                  </div>
                  <button 
                    onClick={() => setEditingType(null)}
                    className="size-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome da Especialidade</label>
                      <input
                        type="text"
                        required
                        value={editingType.name}
                        onChange={e => {
                          const newName = e.target.value;
                          setEditingType({ 
                            ...editingType, 
                            name: newName,
                            value: generateSlug(newName)
                          });
                        }}
                        placeholder="Ex: Pizzaria Artesanal"
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-4 focus:ring-primary/20 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Ícone Representativo (Upload PNG/SVG)</label>
                    <div className="relative flex items-center gap-6 p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/10 group hover:border-primary/50 transition-all">
                      <div className="size-20 rounded-[28px] bg-white dark:bg-slate-800 flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                        {editingType.icon?.startsWith('http') ? (
                          <img src={editingType.icon} alt="Preview" className="w-full h-full object-contain p-2" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-300 text-4xl">add_photo_alternate</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Upload de Ícone 3D</p>
                        <label className="cursor-pointer bg-primary text-slate-900 px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-2">
                          {isUploading ? (
                            <div className="size-3 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                          ) : (
                            <span className="material-symbols-outlined text-sm">upload</span>
                          )}
                          Escolher Arquivo
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Slug (Sistema)</label>
                       <input
                         type="text"
                         readOnly
                         value={editingType.value}
                         className="w-full bg-slate-100 dark:bg-white/10 border-none rounded-2xl px-6 py-4 font-bold text-sm text-slate-400 cursor-not-allowed"
                       />
                    </div>
                    <div className="flex items-center justify-center pt-6">
                       <label className="flex items-center gap-4 cursor-pointer">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo</span>
                          <div 
                            onClick={() => setEditingType({ ...editingType, is_active: !editingType.is_active })}
                            className={`w-14 h-8 rounded-full p-1 transition-all ${editingType.is_active ? 'bg-primary' : 'bg-slate-200 dark:bg-white/10'}`}
                          >
                            <div className={`size-6 bg-white dark:bg-slate-900 rounded-full shadow-sm transition-all transform ${editingType.is_active ? 'translate-x-6' : 'translate-x-0'}`} />
                          </div>
                       </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição curta</label>
                    <textarea
                      rows={3}
                      value={editingType.description || ''}
                      onChange={e => setEditingType({ ...editingType, description: e.target.value })}
                      placeholder="Descreva brevemente o propósito desta especialidade..."
                      className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-2xl px-6 py-4 font-bold text-sm focus:ring-4 focus:ring-primary/20 dark:text-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[28px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-3"
                  >
                    {isSaving ? (
                      <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined font-black text-xl">check_circle</span>
                        Salvar Nova Especialidade
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
