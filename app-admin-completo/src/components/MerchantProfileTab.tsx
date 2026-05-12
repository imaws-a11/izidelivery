import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { AddressSearchInput } from './AddressSearchInput';
import { toastSuccess, toastError } from '../lib/useToast';

export default function MerchantProfileTab() {
  const { merchantProfile, handleUpdateMerchantProfile, isSaving } = useAdmin();
  
  const [formData, setFormData] = useState({
    store_name: merchantProfile?.store_name || '',
    email: merchantProfile?.email || '',
    document: merchantProfile?.document || '',
    store_phone: merchantProfile?.store_phone || '',
    store_address: merchantProfile?.store_address || '',
    latitude: merchantProfile?.latitude || 0,
    longitude: merchantProfile?.longitude || 0,
    pix_key: merchantProfile?.bank_info?.pix_key || ''
  });

  useEffect(() => {
    if (merchantProfile) {
      setFormData({
        store_name: merchantProfile.store_name || '',
        email: merchantProfile.email || '',
        document: merchantProfile.document || '',
        store_phone: merchantProfile.store_phone || '',
        store_address: merchantProfile.store_address || '',
        latitude: merchantProfile.latitude || 0,
        longitude: merchantProfile.longitude || 0,
        pix_key: merchantProfile.bank_info?.pix_key || ''
      });
    }
  }, [merchantProfile]);

  const handleSave = async () => {
    // Mesclar a chave pix no objeto bank_info
    const updatedBankInfo = {
      ...(merchantProfile?.bank_info || {}),
      pix_key: formData.pix_key
    };

    const updates = {
      store_name: formData.store_name,
      email: formData.email,
      document: formData.document,
      store_phone: formData.store_phone,
      store_address: formData.store_address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      bank_info: updatedBankInfo
    };

    await handleUpdateMerchantProfile(updates);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Configurações de Perfil</h2>
        <p className="text-slate-500 font-bold text-sm">Gerencie seus dados cadastrais e financeiros para recebimentos.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Dados Gerais */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">person</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Dados Gerais</h3>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome da Loja / Razão Social</label>
              <input 
                type="text"
                value={formData.store_name}
                onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-primary outline-none transition-all"
                placeholder="Ex: Izi Delivery"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">E-mail de Contato</label>
              <input 
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-primary outline-none transition-all"
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">CPF ou CNPJ</label>
                <input 
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-primary outline-none transition-all"
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Telefone</label>
                <input 
                  type="text"
                  value={formData.store_phone}
                  onChange={(e) => setFormData({ ...formData, store_phone: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl px-6 py-4 font-bold text-slate-700 dark:text-white focus:border-primary outline-none transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card: Financeiro */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-amber-500 text-2xl">account_balance_wallet</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Dados de Recebimento</h3>
          </div>

          <div className="p-6 bg-amber-50 dark:bg-amber-500/5 rounded-3xl border border-amber-100 dark:border-amber-500/10 mb-4">
            <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 leading-relaxed">
              Utilizamos a Chave PIX abaixo para processar seus saques e reembolsos. Certifique-se de que a chave está correta.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Chave PIX (E-mail, CPF, CNPJ ou Telefone)</label>
              <div className="relative flex items-center">
                <span className="material-symbols-outlined absolute left-6 text-slate-400">qr_code</span>
                <input 
                  type="text"
                  value={formData.pix_key}
                  onChange={(e) => setFormData({ ...formData, pix_key: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-3xl pl-14 pr-6 py-5 font-black text-lg text-slate-700 dark:text-white focus:border-amber-400 outline-none transition-all"
                  placeholder="Sua chave PIX"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Card: Endereço (Full Width) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="size-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-violet-500 text-2xl">map</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Endereço da Operação</h3>
          </div>

          <div className="space-y-4">
            <AddressSearchInput
              initialValue={formData.store_address}
              placeholder="Digite o endereço do seu estabelecimento..."
              onSelect={(addr) => {
                setFormData({
                  ...formData,
                  store_address: addr.formatted_address,
                  latitude: addr.lat,
                  longitude: addr.lng
                });
              }}
            />
            
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
               <span className="material-symbols-outlined text-violet-500">location_on</span>
               <p className="text-[10px] font-bold text-slate-500">
                 Localização Confirmada: <span className="font-black text-slate-700 dark:text-white">{formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}</span>
               </p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex justify-end pt-4">
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="px-12 py-6 bg-primary hover:bg-primary/90 text-slate-900 font-black rounded-[28px] shadow-2xl shadow-primary/20 uppercase tracking-[0.2em] text-xs transition-all active:scale-95 disabled:grayscale flex items-center gap-3"
        >
          {isSaving ? (
            <>
              <div className="size-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined">check_circle</span>
              Salvar Alterações
            </>
          )}
        </button>
      </div>
    </div>
  );
}
