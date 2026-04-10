import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { toastSuccess, toastError, showConfirm } from '../lib/useToast';
import { AddressSearchInput } from './AddressSearchInput';

interface PartnerStudioProps {
  onClose: () => void;
}

export default function PartnerStudio({ onClose }: PartnerStudioProps) {
  const { 
    editingItem, setEditingItem, handleUpdatePartner, isSaving, handleFileUpload
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'geral' | 'imagens' | 'localizacao'>('geral');
  const [isUploading, setIsUploading] = useState<'logo' | 'banner' | null>(null);

  if (!editingItem) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(type);
      const bucketName = type === 'logo' ? 'logos' : 'banners';
      const url = await handleFileUpload(file, bucketName);
      if (url) {
        setEditingItem({
          ...editingItem,
          [type === 'logo' ? 'logo_url' : 'banner_url']: url
        });
        toastSuccess(`${type === 'logo' ? 'Logo' : 'Banner'} carregado com sucesso!`);
      }
    } catch (err: any) {
      toastError("Erro no upload: " + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  const tabs = [
    { id: 'geral', label: 'Dados Gerais', icon: 'info' },
    { id: 'imagens', label: 'Identidade Visual', icon: 'image' },
    { id: 'localizacao', label: 'Localização', icon: 'distance' },
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 font-display">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" 
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col h-[90vh]"
      >
        {/* Header com Banner e Perfil */}
        <div className="relative h-64 shrink-0 group">
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-800">
            {editingItem.banner_url ? (
              <img src={editingItem.banner_url} className="w-full h-full object-cover" alt="Banner" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900">
                <span className="material-symbols-outlined text-6xl text-slate-400 dark:text-slate-700">landscape</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all"></div>
          </div>
          
          <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer">
            <div className="bg-white/20 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest">
              <span className="material-symbols-outlined text-sm">edit_square</span>
              Alterar Banner
            </div>
            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
          </label>

          <div className="absolute -bottom-16 left-12 flex items-end gap-6">
            <div className="relative group/logo">
              <div className="size-32 rounded-[32px] bg-white dark:bg-slate-800 p-1 shadow-2xl border-4 border-white dark:border-slate-900 overflow-hidden">
                {editingItem.logo_url ? (
                  <img src={editingItem.logo_url} className="w-full h-full object-cover rounded-[24px]" alt="Logo" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
                  </div>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-all cursor-pointer bg-black/40 rounded-[28px]">
                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
              </label>
            </div>
            
            <div className="mb-4 space-y-1">
              <h2 className="text-3xl font-black text-white drop-shadow-lg tracking-tighter italic uppercase flex items-center gap-3">
                {editingItem.name || 'Novo Parceiro'}
                <span className="material-symbols-outlined text-emerald-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="bg-primary px-3 py-1 rounded-lg text-slate-950 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                  {editingItem.type || 'Ponto de Retirada'}
                </span>
                <span className="text-white/80 text-[10px] font-black uppercase tracking-widest bg-black/40 px-3 py-1 rounded-lg backdrop-blur-md">
                   Click & Retire Izi
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="absolute top-8 right-8 size-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-20 px-12 pb-2 border-b border-slate-100 dark:border-slate-800/50 flex gap-8 shrink-0">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2.5 py-4 px-2 border-b-4 transition-all ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <span className="material-symbols-outlined text-xl">{t.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-12 scrollbar-hide">
          <form onSubmit={handleUpdatePartner} className="space-y-10">
            <AnimatePresence mode="wait">
              {activeTab === 'geral' && (
                <motion.div
                  key="geral"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-8"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Parceiro</label>
                    <input
                      type="text"
                      required
                      value={editingItem.name || ''}
                      onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-5 font-black text-lg focus:ring-2 focus:ring-primary transition-all dark:text-white"
                      placeholder="Ex: Izi Flash Centro"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Estabelecimento</label>
                    <select
                      value={editingItem.type || ''}
                      onChange={e => setEditingItem({ ...editingItem, type: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-5 font-black text-lg focus:ring-2 focus:ring-primary transition-all dark:text-white appearance-none"
                    >
                      <option value="Ponto de Retirada">Ponto de Retirada</option>
                      <option value="Hub Logístico">Hub Logístico</option>
                      <option value="Loja Parceira">Loja Parceira</option>
                      <option value="Quiosque">Quiosque</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Contato</label>
                    <input
                      type="email"
                      value={editingItem.email || ''}
                      onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-5 font-bold focus:ring-2 focus:ring-primary transition-all dark:text-white"
                      placeholder="contato@parceiro.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone / WhatsApp</label>
                    <input
                      type="text"
                      value={editingItem.phone || ''}
                      onChange={e => setEditingItem({ ...editingItem, phone: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-5 font-bold focus:ring-2 focus:ring-primary transition-all dark:text-white"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Horário de Funcionamento</label>
                    <input
                      type="text"
                      value={editingItem.hours || ''}
                      onChange={e => setEditingItem({ ...editingItem, hours: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl px-8 py-5 font-bold focus:ring-2 focus:ring-primary transition-all dark:text-white"
                      placeholder="Ex: Seg a Sex: 08:00 - 18:00 | Sáb: 09:00 - 13:00"
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === 'imagens' && (
                <motion.div
                  key="imagens"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-6">
                        <div className="size-24 rounded-3xl bg-white dark:bg-slate-800 p-1 shadow-xl relative">
                           {editingItem.logo_url ? <img src={editingItem.logo_url} className="w-full h-full object-cover rounded-2xl" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-3xl text-slate-300">image</span></div>}
                           {isUploading === 'logo' && <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center"><div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Avatar do Parceiro</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px]">Esta imagem aparecerá nos cards de seleção do cliente.</p>
                        </div>
                        <label className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all cursor-pointer">
                           Enviar Logo
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                        </label>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-800/30 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center gap-6">
                        <div className="w-full h-24 rounded-3xl bg-white dark:bg-slate-800 p-1 shadow-xl relative overflow-hidden">
                           {editingItem.banner_url ? <img src={editingItem.banner_url} className="w-full h-full object-cover rounded-2xl" /> : <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-3xl text-slate-300">landscape</span></div>}
                           {isUploading === 'banner' && <div className="absolute inset-0 bg-black/40 rounded-3xl flex items-center justify-center"><div className="size-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>}
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Banner de Capa</h4>
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px]">Capa visual que reforça a marca no estúdio e detalhes.</p>
                        </div>
                        <label className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all cursor-pointer">
                           Enviar Capa
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                        </label>
                      </div>
                   </div>
                   <div className="bg-amber-50 dark:bg-amber-500/10 p-6 rounded-[32px] border border-amber-200 dark:border-amber-500/20 flex items-center gap-4">
                      <span className="material-symbols-outlined text-amber-500 text-3xl">lightbulb</span>
                      <p className="text-[11px] font-medium text-amber-700 dark:text-amber-500/80 leading-relaxed">
                        <b>Dica Extra:</b> Use imagens com fundo sólido ou gradientes suaves para garantir que os nomes fiquem legíveis nos banners. Recomendamos 800x400 para banners.
                      </p>
                   </div>
                </motion.div>
              )}

              {activeTab === 'localizacao' && (
                <motion.div
                  key="localizacao"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined">location_on</span>
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Bússola de Entrega</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Defina o endereço exato para cálculos de distância.</p>
                      </div>
                    </div>
                    
                    <AddressSearchInput
                      value={editingItem.address || ''}
                      onChange={(data) => {
                        setEditingItem({
                          ...editingItem,
                          address: data.address,
                          city: data.city || editingItem.city,
                          latitude: data.latitude,
                          longitude: data.longitude,
                          google_place_id: data.placeId
                        });
                      }}
                      placeholder="Pesquise o endereço (Rua, Número, Bairro, Cidade)..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Latitude</span>
                      <p className="font-mono text-xs dark:text-white">{editingItem.latitude || '---'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Longitude</span>
                      <p className="font-mono text-xs dark:text-white">{editingItem.longitude || '---'}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-4 pt-4 shrink-0">
               <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 py-6 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[32px] font-black text-[11px] uppercase tracking-widest transition-all dark:text-white"
               >
                  Descartar
               </button>
               <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] py-6 bg-primary text-slate-950 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
               >
                  {isSaving ? (
                    <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined">verified</span>
                      {editingItem.id && !editingItem.id.toString().startsWith('new-') ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                    </>
                  )}
               </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
