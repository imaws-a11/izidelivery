import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast, toastSuccess, toastError } from '../../lib/useToast';

interface OnboardingViewProps {
  userId: string;
  onApproved: () => void;
  onLogout: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ userId, onApproved, onLogout }) => {
  const [step, setStep] = useState<'welcome' | 'form' | 'waiting' | 'rejected'>('welcome');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    vehicle_type: 'moto',
    vehicle_model: '',
    vehicle_plate: '',
  });

  const [files, setFiles] = useState<{ cnh: File | null; vehicle: File | null }>({ cnh: null, vehicle: null });
  const [previews, setPreviews] = useState<{ cnh: string | null; vehicle: string | null }>({ cnh: null, vehicle: null });

  const checkStatus = async () => {
    setLoading(true);
    try {
      // 1. Verifica se já foi aprovado e está na tabela oficial
      const { data: driver } = await supabase.from('drivers_delivery').select('id, is_active').eq('id', userId).maybeSingle();
      if (driver?.is_active) {
        onApproved();
        return;
      }

      // 2. Verifica se tem candidatura pendente
      const { data: app } = await supabase.from('driver_applications_delivery').select('*').eq('user_id', userId).maybeSingle();
      
      if (app) {
        if (app.status === 'pending') setStep('waiting');
        else if (app.status === 'rejected') setStep('rejected');
        else if (app.status === 'approved') onApproved();
      } else {
        setStep('welcome');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkStatus(); }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'cnh' | 'vehicle') => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles(prev => ({ ...prev, [type]: file }));
      setPreviews(prev => ({ ...prev, [type]: URL.createObjectURL(file) }));
    }
  };

  const uploadDocument = async (file: File, path: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${path}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('driver-documents').upload(fileName, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('driver-documents').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.cnh || !files.vehicle) {
      toastError("Anexe todos os documentos.");
      return;
    }

    setLoading(true);
    try {
      const cnhUrl = await uploadDocument(files.cnh, "cnh");
      const vehicleUrl = await uploadDocument(files.vehicle, "vehicle");

      const { error } = await supabase.from('driver_applications_delivery').insert({
        user_id: userId,
        ...formData,
        document_cnh: cnhUrl,
        document_vehicle: vehicleUrl,
        status: 'pending'
      });

      if (error) throw error;
      toastSuccess("Cadastro enviado!");
      setStep('waiting');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-[#111] flex items-center justify-center">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#111] z-[1000] flex flex-col font-display overflow-y-auto pb-10">
      <AnimatePresence mode="wait">
        
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="size-24 bg-primary rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-primary/20">
               <span className="material-symbols-outlined text-5xl text-black font-black">moped</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 leading-none">Seja um<br/>Entregador Izi</h1>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-12 px-4">
              Para começar a receber pedidos e faturar, precisamos conhecer você e seu veículo. O processo é rápido e seguro.
            </p>
            <div className="w-full space-y-4">
               <button onClick={() => setStep('form')} className="w-full h-16 bg-primary text-black font-black uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/10">Começar Cadastro</button>
               <button onClick={onLogout} className="w-full h-16 bg-white/5 text-slate-500 font-black uppercase tracking-widest rounded-3xl">Sair da Conta</button>
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
             <header className="flex items-center gap-4 mb-10">
                <button onClick={() => setStep('welcome')} className="size-12 rounded-2xl bg-white/5 flex items-center justify-center text-white"><span className="material-symbols-outlined">arrow_back</span></button>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Dados Cadastrais</h2>
             </header>

             <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">Dados Pessoais</p>
                   <input required placeholder="Nome Completo" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                   <input required type="email" placeholder="E-mail" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                   <input required placeholder="Telefone/WhatsApp" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                   <textarea required placeholder="Endereço Completo" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold h-24" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">Seu Veículo</p>
                   <div className="grid grid-cols-2 gap-3">
                      {['moto', 'carro', 'bike', 'van'].map(v => (
                        <button key={v} type="button" onClick={() => setFormData({...formData, vehicle_type: v})} className={`h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border transition-all ${formData.vehicle_type === v ? 'bg-primary text-black border-primary shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-500 border-white/5'}`}>{v}</button>
                      ))}
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <input required placeholder="Modelo/Ano" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} />
                      <input required placeholder="Placa" className="w-full bg-white/5 border border-white/5 rounded-2xl px-6 py-5 text-white font-bold" value={formData.vehicle_plate} onChange={e => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})} />
                   </div>
                </div>

                <div className="space-y-4">
                   <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] ml-2">Documentos</p>
                   <div className="grid grid-cols-1 gap-4">
                      <label className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center gap-3 cursor-pointer">
                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'cnh')} />
                         {previews.cnh ? <img src={previews.cnh} className="h-20 rounded-xl" /> : <span className="material-symbols-outlined text-slate-500 text-3xl">add_a_photo</span>}
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{previews.cnh ? 'CNH Alterar' : 'Foto da CNH'}</p>
                      </label>
                      <label className="bg-white/5 border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center gap-3 cursor-pointer">
                         <input type="file" className="hidden" onChange={e => handleFileChange(e, 'vehicle')} />
                         {previews.vehicle ? <img src={previews.vehicle} className="h-20 rounded-xl" /> : <span className="material-symbols-outlined text-slate-500 text-3xl">add_a_photo</span>}
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{previews.vehicle ? 'Doc Alterar' : 'Documento do Veículo'}</p>
                      </label>
                   </div>
                </div>

                <button disabled={loading} className="w-full h-20 bg-primary text-black font-black uppercase tracking-[0.2em] rounded-[32px] shadow-2xl shadow-primary/20">
                   {loading ? 'Enviando...' : 'Finalizar Cadastro'}
                </button>
             </form>
          </motion.div>
        )}

        {step === 'waiting' && (
          <motion.div key="waiting" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="size-24 bg-amber-500/10 border border-amber-500/20 rounded-[32px] flex items-center justify-center mb-8 relative">
               <span className="material-symbols-outlined text-5xl text-amber-500 animate-pulse">hourglass_empty</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4 leading-none">Análise em<br/>Andamento</h1>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-12">
              Recebemos seus dados! Nossa equipe está validando seus documentos. Você receberá uma notificação assim que for aprovado.
            </p>
            <button onClick={onLogout} className="w-full h-16 bg-white/5 text-slate-500 font-black uppercase tracking-widest rounded-3xl">Sair da Conta</button>
          </motion.div>
        )}

        {step === 'rejected' && (
          <motion.div key="rejected" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="size-24 bg-rose-500/10 border border-rose-500/20 rounded-[32px] flex items-center justify-center mb-8">
               <span className="material-symbols-outlined text-5xl text-rose-500">error</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-4">Cadastro Recusado</h1>
            <p className="text-slate-400 font-bold text-sm leading-relaxed mb-12">
              Infelizmente seu cadastro não foi aprovado nesta fase. Verifique se os documentos enviados estão legíveis.
            </p>
            <div className="w-full space-y-4">
               <button onClick={() => setStep('form')} className="w-full h-16 bg-white text-black font-black uppercase tracking-widest rounded-3xl">Tentar Novamente</button>
               <button onClick={onLogout} className="w-full h-16 bg-white/5 text-slate-500 font-black uppercase tracking-widest rounded-3xl">Sair da Conta</button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
