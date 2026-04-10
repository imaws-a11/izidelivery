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
    { id: 'access', label: 'Dados de Acesso', icon: 'lock_person' },
    { id: 'financial', label: 'Repasses & Financeiro', icon: 'payments' },
  ];

  const [passwordPreview, setPasswordPreview] = useState('');

  const generateStrongPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pass = "";
    for (let i = 0; i < 12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    setEditingItem({ ...editingItem, password: pass });
    setPasswordPreview(pass);
  };

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
        <div className="mt-20 px-12 pb-2 border-b border-slate-100 dark:border-slate-800/50 flex gap-8 shrink-0 overflow-x-auto scrollbar-hide">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2.5 py-4 px-2 border-b-4 transition-all whitespace-nowrap ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
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

              {activeTab === 'access' && (
                <motion.div
                  key="access"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-10"
                >
                  <div className="bg-slate-50 dark:bg-slate-800/30 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-8">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined text-2xl">account_circle</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Credenciais do Parceiro</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Acesso do parceiro ao seu próprio terminal de retirada</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Login</label>
                        <input
                          type="email"
                          value={editingItem.email || ''}
                          onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
                          placeholder="login@parceiro.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Senha Temporária</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={editingItem.password || ''}
                            onChange={e => setEditingItem({ ...editingItem, password: e.target.value })}
                            className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
                            placeholder="Defina ou gere uma senha"
                          />
                          <button
                            type="button"
                            onClick={generateStrongPassword}
                            className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                          >
                            Gerar
                          </button>
                        </div>
                        {passwordPreview && (
                           <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mt-2 ml-4">Nova senha gerada com sucesso!</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-900 dark:bg-slate-800 p-10 rounded-[40px] space-y-8 text-white">
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Configurações de Rede</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Parâmetros exclusivos da administração IZI</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Taxa de Manuseio (%)</label>
                        <input
                          type="number"
                          value={editingItem.commission_percent || 10}
                          onChange={e => setEditingItem({ ...editingItem, commission_percent: parseFloat(e.target.value) })}
                          className="w-full bg-slate-800 dark:bg-slate-950 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary text-white shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Taxa Fixa IZI (R$)</label>
                        <input
                          type="number"
                          value={editingItem.service_fee || 0}
                          onChange={e => setEditingItem({ ...editingItem, service_fee: parseFloat(e.target.value) })}
                          className="w-full bg-slate-800 dark:bg-slate-950 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary text-white shadow-sm"
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2">Status da Operação</label>
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...editingItem, is_active: !editingItem.is_active })}
                          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${editingItem.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}
                        >
                          {editingItem.is_active ? 'Ativo na Rede' : 'Suspenso'}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'financial' && (
                <motion.div
                  key="financial"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-500/20">
                      <span className="material-symbols-outlined text-emerald-500 text-3xl mb-4">account_balance_wallet</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo de Repasse</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">R$ 0,00</h3>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-950/20 p-8 rounded-[40px] border border-indigo-100 dark:border-indigo-500/20">
                      <span className="material-symbols-outlined text-indigo-500 text-3xl mb-4">package_2</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pacotes Manuseados</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">0</h3>
                    </div>
                    <div className="bg-amber-50 dark:bg-amber-950/20 p-8 rounded-[40px] border border-amber-100 dark:border-amber-500/20">
                      <span className="material-symbols-outlined text-amber-500 text-3xl mb-4">star</span>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nota do Ponto</p>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter italic">5.0</h3>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/30 p-10 rounded-[40px] border border-slate-100 dark:border-slate-800 space-y-8">
                     <div className="flex items-center gap-4">
                      <div className="size-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                        <span className="material-symbols-outlined text-2xl">account_balance</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Dados Bancários para Repasse</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Onde o parceiro receberá suas comissões por Click & Retire</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome Completo / Razão Social</label>
                        <input
                          type="text"
                          value={editingItem.bank_info?.holder_name || ''}
                          onChange={e => setEditingItem({ ...editingItem, bank_info: { ...(editingItem.bank_info || {}), holder_name: e.target.value } })}
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX</label>
                        <input
                          type="text"
                          value={editingItem.bank_info?.pix_key || ''}
                          onChange={e => setEditingItem({ ...editingItem, bank_info: { ...(editingItem.bank_info || {}), pix_key: e.target.value } })}
                          className="w-full bg-white dark:bg-slate-900 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
                          placeholder="CPF, E-mail ou Celular"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-indigo-600 p-8 rounded-[32px] text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <span className="material-symbols-outlined text-3xl">currency_exchange</span>
                       <div>
                         <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Padrão de Repasse</p>
                         <p className="text-sm font-bold">Repasse Semanal (Toda Terça-feira)</p>
                       </div>
                    </div>
                    <button type="button" className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Ver Detalhes</button>
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
