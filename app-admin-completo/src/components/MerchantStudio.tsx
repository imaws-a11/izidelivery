import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { AddressSearchInput } from './AddressSearchInput';
import { toastSuccess, toastError } from '../lib/useToast';

export default function MerchantStudio() {
  const { 
    editingItem, setEditingItem, handleUpdateMerchant, isSaving, handleFileUpload,
    establishmentTypes, appSettings, setActiveTab, setEditType
  } = useAdmin();



  const [step, setStep] = useState(1);
  const [isUploading, setIsUploading] = useState<'logo' | 'banner' | null>(null);

  if (!editingItem) return (
    <div className="flex flex-col items-center justify-center h-full gap-6 opacity-50">
      <span className="material-symbols-outlined text-8xl">storefront</span>
      <p className="font-black uppercase tracking-widest text-sm">Selecione ou crie um lojista</p>
      <button 
        onClick={() => {
          setEditType('new_merchant');
          setEditingItem({
            store_name: '',
            email: '',
            password: '',
            store_type: establishmentTypes[0]?.value || 'restaurant',
            commission_percent: appSettings.appCommission || 15,
            service_fee: appSettings.serviceFee || 1.5,
            is_active: true,
            role: 'merchant'
          });
        }}
        className="px-8 py-4 bg-primary text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
      >
        Iniciar Novo Cadastro
      </button>
    </div>
  );

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
          [type === 'logo' ? 'store_logo' : 'store_banner']: url
        });
        toastSuccess(`${type === 'logo' ? 'Logo' : 'Banner'} carregado com sucesso!`);
      }
    } catch (err: any) {
      toastError("Erro no upload: " + err.message);
    } finally {
      setIsUploading(null);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toastError("Geolocalização não suportada pelo seu navegador.");
      return;
    }
    
    toastSuccess("Buscando sua localização via satélite...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await response.json();
          const address = data.display_name;
          setEditingItem((prev: any) => ({
            ...prev,
            store_address: address,
            latitude,
            longitude
          }));
          toastSuccess("Localização capturada e endereço preenchido!");
        } catch (err) {
          setEditingItem((prev: any) => ({
            ...prev,
            latitude,
            longitude
          }));
          toastSuccess("Coordenadas obtidas! Por favor, digite o nome da rua manualmente.");
        }
      },
      (error) => {
        toastError("Erro ao acessar GPS. Verifique as permissões do navegador.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const steps = [
    { id: 1, label: 'Identidade', icon: 'storefront' },
    { id: 2, label: 'Visual', icon: 'palette' },
    { id: 3, label: 'Localização', icon: 'distance' },
    { id: 4, label: 'Acesso e Taxas', icon: 'key' },
  ];

  const canGoNext = () => {
    if (step === 1) return editingItem.store_name && editingItem.store_type;
    if (step === 3) return editingItem.store_address;
    if (step === 4) return editingItem.email && (editingItem.id || editingItem.password);
    return true;
  };

  return (
    <div className="flex flex-col h-full font-display bg-white dark:bg-slate-900 p-6 md:p-10 overflow-y-auto">
      {/* HEADER DO ESTÚDIO */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={() => {
                setEditType(null);
                setEditingItem(null);
                setActiveTab('merchants');
              }}
              className="size-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all group"
            >
              <span className="material-symbols-outlined text-xl group-hover:font-black transition-all">arrow_back</span>
            </button>
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
              Estúdio de Lojistas
            </h1>
          </div>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 ml-12">
            <span className="material-symbols-outlined text-sm text-primary">auto_fix_high</span>
            {editingItem.id ? 'Editando Perfil Profissional' : 'Workshop de Novos Parceiros'}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 p-2 rounded-[32px] border border-white/5">
          {steps.map(s => (
            <button
              key={s.id}
              onClick={() => s.id <= step || canGoNext() ? setStep(s.id) : null}
              className={`flex items-center gap-3 px-6 py-4 rounded-[24px] transition-all ${step === s.id ? 'bg-white dark:bg-slate-800 shadow-xl text-primary' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              <span className={`material-symbols-outlined text-xl ${step === s.id ? 'font-black' : ''}`}>{s.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-10 min-h-0">
        {/* LADO ESQUERDO: FORMULÁRIO */}
        <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-[48px] border border-slate-100 dark:border-white/5 shadow-2xl shadow-slate-200/50 dark:shadow-none p-10 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome da Loja</label>
                      <input
                        type="text"
                        value={editingItem.store_name || ''}
                        onChange={e => setEditingItem({ ...editingItem, store_name: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl px-8 py-5 font-black text-xl focus:ring-4 focus:ring-primary/20 transition-all dark:text-white"
                        placeholder="Ex: Izi Burguer Premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Estabelecimento</label>
                      <div className="relative">
                        <select
                          value={editingItem.store_type || 'restaurant'}
                          onChange={e => setEditingItem({ ...editingItem, store_type: e.target.value })}
                          className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl px-8 py-5 font-black text-lg focus:ring-4 focus:ring-primary/20 transition-all dark:text-white appearance-none cursor-pointer"
                        >
                          {establishmentTypes.length > 0 ? (
                            establishmentTypes.map(t => (
                              <option key={t.id} value={t.value}>{t.name}</option>
                            ))
                          ) : (
                            <>
                              <option value="restaurant">Restaurante</option>
                              <option value="market">Mercado</option>
                              <option value="pharmacy">Farmácia</option>
                              <option value="beverages">Bebidas</option>
                            </>
                          )}
                        </select>
                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                          <span className="material-symbols-outlined font-black">expand_more</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Breve Descrição (Slogan)</label>
                      <textarea
                        rows={3}
                        value={editingItem.store_description || ''}
                        onChange={e => setEditingItem({ ...editingItem, store_description: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl px-8 py-5 font-bold focus:ring-4 focus:ring-primary/20 transition-all dark:text-white resize-none"
                        placeholder="Conte um pouco sobre o que a loja oferece..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone Público</label>
                      <input
                        type="text"
                        value={editingItem.store_phone || ''}
                        onChange={e => setEditingItem({ ...editingItem, store_phone: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl px-8 py-5 font-bold focus:ring-4 focus:ring-primary/20 transition-all dark:text-white"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Documento (CNPJ/CPF)</label>
                      <input
                        type="text"
                        value={editingItem.document || ''}
                        onChange={e => setEditingItem({ ...editingItem, document: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border-none rounded-3xl px-8 py-5 font-bold focus:ring-4 focus:ring-primary/20 transition-all dark:text-white"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Categorias de Especialidade</label>
                      <div className="flex flex-wrap gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-3xl min-h-[100px]">
                        {['Pizza', 'Hambúrguer', 'Japonesa', 'Brasileira', 'Doces', 'Bebidas', 'Saudável', 'Açaí', 'Italiana', 'Chinesa'].map(cat => {
                          const isSelected = (editingItem.food_category || []).includes(cat.toLowerCase());
                          return (
                            <button
                              key={cat}
                              onClick={() => {
                                const current = editingItem.food_category || [];
                                const lower = cat.toLowerCase();
                                if (current.includes(lower)) {
                                  setEditingItem({ ...editingItem, food_category: current.filter((c: string) => c !== lower) });
                                } else {
                                  setEditingItem({ ...editingItem, food_category: [...current, lower] });
                                }
                              }}
                              className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                isSelected ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {cat}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[40px] flex flex-col items-center text-center gap-6 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all" />
                      <div className="size-32 rounded-[32px] bg-white dark:bg-slate-800 p-1 shadow-2xl relative z-10">
                        {editingItem.store_logo ? (
                          <img src={editingItem.store_logo} className="w-full h-full object-cover rounded-[24px]" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-[24px]">
                            <span className="material-symbols-outlined text-4xl text-slate-300">add_a_photo</span>
                          </div>
                        )}
                        {isUploading === 'logo' && (
                          <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center z-20">
                            <div className="size-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 relative z-10">
                        <h4 className="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Logo da Marca</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px]">Formatos sugeridos: PNG ou JPG, proporção 1:1.</p>
                      </div>
                      <label className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all cursor-pointer relative z-10 shadow-xl">
                        Escolher Arquivo
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'logo')} />
                      </label>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[40px] flex flex-col items-center text-center gap-6 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-all" />
                      <div className="w-full h-32 rounded-[32px] bg-white dark:bg-slate-800 p-1 shadow-2xl relative z-10 overflow-hidden">
                        {editingItem.store_banner ? (
                          <img src={editingItem.store_banner} className="w-full h-full object-cover rounded-[24px]" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-[24px]">
                            <span className="material-symbols-outlined text-4xl text-slate-300">landscape</span>
                          </div>
                        )}
                        {isUploading === 'banner' && (
                          <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center z-20">
                            <div className="size-8 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 relative z-10">
                        <h4 className="font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Banner de Capa</h4>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest max-w-[200px]">Formatos sugeridos: JPG, proporção 16:9.</p>
                      </div>
                      <label className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all cursor-pointer relative z-10 shadow-xl">
                        Escolher Arquivo
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'banner')} />
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[40px] border border-slate-100 dark:border-white/5">
                    <div className="flex items-center gap-5 mb-8">
                      <div className="size-14 rounded-2xl bg-primary flex items-center justify-center text-slate-900 shadow-xl shadow-primary/20">
                        <span className="material-symbols-outlined text-3xl font-black">location_on</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Localização do Estabelecimento</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Crucial para o cálculo dinâmico de frete e visibilidade.</p>
                      </div>
                    </div>

                    <AddressSearchInput
                      value={editingItem.store_address || ''}
                      onChange={(data) => {
                        setEditingItem({
                          ...editingItem,
                          store_address: data.address,
                          latitude: data.latitude,
                          longitude: data.longitude,
                          google_place_id: data.placeId
                        });
                      }}
                      placeholder="Pesquise o endereço completo (Rua, Número, Bairro)..."
                    />

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleGetCurrentLocation}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                      >
                        <span className="material-symbols-outlined text-sm">my_location</span>
                        Usar Minha Localização Atual
                      </button>
                    </div>

                    {editingItem.store_address && (
                      <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm flex items-start gap-4 border border-emerald-500/20">
                        <div className="size-10 min-w-[40px] rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <span className="material-symbols-outlined">where_to_vote</span>
                        </div>
                        <div className="w-full">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-1 flex items-center gap-2">
                            Endereço Confirmado
                            <span className="material-symbols-outlined text-[10px]">edit</span>
                          </span>
                          <AddressSearchInput
                            initialValue={editingItem.store_address}
                            onSelect={(data: any) => {
                              setEditingItem({
                                ...editingItem,
                                store_address: data.formatted_address,
                                latitude: data.lat || editingItem.latitude,
                                longitude: data.lng || editingItem.longitude,
                                google_place_id: data.placeId || editingItem.google_place_id
                              });
                            }}
                            onChangeRaw={(val) => setEditingItem({ ...editingItem, store_address: val })}
                            className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed focus:ring-0 outline-none placeholder-slate-400"
                            placeholder="Digite ou corrija o endereço manualmente..."
                          />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-6 mt-8">
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Latitude</span>
                        <p className="font-mono text-sm dark:text-white font-bold">{editingItem.latitude || 'Aguardando...'}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Longitude</span>
                        <p className="font-mono text-sm dark:text-white font-bold">{editingItem.longitude || 'Aguardando...'}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="bg-slate-900 p-10 rounded-[40px] space-y-8 text-white">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-2xl font-black">lock</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-widest italic">Acesso ao Painel</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Credenciais para o terminal do lojista</p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Login</label>
                          <input
                            type="email"
                            value={editingItem.email || ''}
                            onChange={e => setEditingItem({ ...editingItem, email: e.target.value })}
                            className="w-full bg-white/10 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary text-white"
                            placeholder="exemplo@izidelivery.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Senha</label>
                          <input
                            type="text"
                            value={editingItem.password || ''}
                            onChange={e => setEditingItem({ ...editingItem, password: e.target.value })}
                            className="w-full bg-white/10 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary text-white"
                            placeholder={editingItem.id ? "Deixe em branco para manter" : "Defina uma senha forte"}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-white/5 p-10 rounded-[40px] border border-slate-100 dark:border-white/5 space-y-8">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <span className="material-symbols-outlined text-2xl font-black">payments</span>
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest italic">Financeiro e Repasse</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Regras de comissionamento</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Comissão (%)</label>
                          <input
                            type="number"
                            value={editingItem.commission_percent || 0}
                            onChange={e => setEditingItem({ ...editingItem, commission_percent: parseFloat(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Taxa Fixa (R$)</label>
                          <input
                            type="number"
                            value={editingItem.service_fee || 0}
                            onChange={e => setEditingItem({ ...editingItem, service_fee: parseFloat(e.target.value) })}
                            className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-black text-lg focus:ring-2 focus:ring-primary dark:text-white"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX para Repasse</label>
                        <input
                          type="text"
                          value={editingItem.bank_info?.pix_key || ''}
                          onChange={e => setEditingItem({ ...editingItem, bank_info: { ...editingItem.bank_info, pix_key: e.target.value } })}
                          className="w-full bg-white dark:bg-slate-800 border-none rounded-2xl px-6 py-5 font-bold text-sm focus:ring-2 focus:ring-primary dark:text-white"
                          placeholder="CPF, E-mail ou Telefone"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RODAPÉ DO FORM: BOTÕES DE NAVEGAÇÃO */}
          <div className="pt-10 flex gap-4 mt-auto border-t border-slate-100 dark:border-white/5">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex-1 py-6 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-[32px] font-black text-[11px] uppercase tracking-widest transition-all dark:text-white flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">west</span>
                Voltar
              </button>
            )}
            
            {step < 4 ? (
              <button 
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="flex-[2] py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale"
              >
                Próximo Passo
                <span className="material-symbols-outlined text-lg">east</span>
              </button>
            ) : (
              <button 
                onClick={handleUpdateMerchant}
                disabled={isSaving || !canGoNext()}
                className="flex-[2] py-6 bg-primary text-slate-950 rounded-[32px] font-black text-[11px] uppercase tracking-widest shadow-2xl shadow-primary/30 hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined font-black">verified</span>
                    {editingItem.id ? 'Salvar Edição' : 'Lançar no Ecossistema'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
