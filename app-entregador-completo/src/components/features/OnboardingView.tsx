import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast, toastSuccess, toastError } from '../../lib/useToast';

interface OnboardingViewProps {
  userId: string;
  onApproved: () => void;
  onLogout: () => void;
  onClose?: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ userId, onApproved, onLogout, onClose }) => {
  console.log("[DEBUG] OnboardingView montado para o usuário:", userId);
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
  const [showFeedback, setShowFeedback] = useState(false);

  const checkStatus = async () => {
    if (!userId || userId === '') {
      console.log("[DEBUG] userId ausente ou vazio, pulando checkStatus");
      return;
    }
    setLoading(true);
    try {
      console.log("[DEBUG] Verificando status para:", userId);
      // 1. Verifica se já foi aprovado e está na tabela oficial
      const { data: driver } = await supabase.from('drivers_delivery').select('id, is_active').eq('id', userId).maybeSingle();
      if (driver?.is_active) {
        console.log("[DEBUG] Driver já ativo, fechando onboarding");
        onApproved();
        return;
      }

      // 2. Verifica se tem candidatura pendente
      const { data: app } = await supabase.from('driver_applications_delivery').select('*').eq('user_id', userId).maybeSingle();
      
      if (app) {
        console.log("[DEBUG] Candidatura encontrada:", app.status);
        if (app.status === 'pending') setStep('waiting');
        else if (app.status === 'rejected') setStep('rejected');
        else if (app.status === 'approved') onApproved();
      } else {
        console.log("[DEBUG] Nenhuma candidatura encontrada, mostrando welcome");
        setStep('welcome');
      }
    } catch (err) {
      console.error("[DEBUG] Erro ao verificar status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    checkStatus(); 
  }, [userId]);

  useEffect(() => {
    let timer: any;
    if (loading && step === 'welcome') {
      timer = setTimeout(() => {
        setShowFeedback(true);
      }, 3000);
    } else {
      setShowFeedback(false);
    }
    return () => clearTimeout(timer);
  }, [loading, step]);

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
      toastError("Anexe todos os documentos (CNH e Documento do Veículo).");
      return;
    }

    if (!formData.full_name || !formData.email || !formData.phone || !formData.address || !formData.vehicle_model || !formData.vehicle_plate) {
      toastError("Preencha todos os campos do formulário.");
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

  const inputClass = "w-full bg-[#F3F3F3] border-none rounded-2xl px-5 py-4 font-bold text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-400 transition-all outline-none";
  const labelClass = "text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-2 block";

  if (loading && step === 'welcome') {
    return (
      <div className="fixed inset-0 bg-white z-[20000] flex flex-col items-center justify-center p-10 text-center">
        {onClose && (
            <div className="absolute top-6 right-6">
                <button onClick={onClose} className="size-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
        )}
        <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="size-20 rounded-[32px] bg-yellow-400 flex items-center justify-center mb-6 shadow-xl shadow-yellow-400/20"
        >
            <span className="material-symbols-outlined text-4xl text-black">moped</span>
        </motion.div>
        <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">
          {showFeedback ? "Cadastro ainda em análise" : "Validando Cadastro..."}
        </h2>
        <p className="text-zinc-400 font-bold text-xs mt-2 uppercase tracking-widest">
          {showFeedback ? "Nossa equipe está revisando seus dados" : "Aguarde um momento"}
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[15000] flex flex-col font-display overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div 
            key="welcome" 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex-1 flex flex-col min-h-screen"
          >
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                <div className="size-24 bg-yellow-400 rounded-[32px] flex items-center justify-center mb-8 shadow-2xl shadow-yellow-400/20">
                    <span className="material-symbols-outlined text-5xl text-black font-black">moped</span>
                </div>
                <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase mb-4 leading-none">Seja um<br/>Entregador Izi</h1>
                <p className="text-zinc-400 font-bold text-sm leading-relaxed mb-12 px-4 uppercase tracking-wide">
                    Ganhe dinheiro com sua própria rotina. Cadastre seu veículo e comece hoje mesmo.
                </p>
                
                <div className="w-full max-w-xs space-y-4">
                    <button 
                        onClick={() => setStep('form')} 
                        className="w-full h-18 bg-zinc-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-zinc-900/20 active:scale-95 transition-all"
                    >
                        Começar Cadastro
                    </button>
                    <button 
                        onClick={onLogout} 
                        className="w-full h-18 bg-zinc-100 text-zinc-400 font-black uppercase tracking-[0.2em] rounded-[2rem] active:scale-95 transition-all"
                    >
                        Sair da Conta
                    </button>
                </div>
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div 
            key="form" 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="flex-1 flex flex-col bg-white min-h-screen pb-32"
          >
            {/* HEADER */}
            <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-50">
                <button 
                    onClick={() => setStep('welcome')}
                    className="size-10 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-transform"
                >
                    <span className="material-symbols-outlined text-zinc-800">arrow_back</span>
                </button>
                <h1 className="text-xl font-black tracking-tight uppercase">Dados do Cadastro</h1>
            </header>

            <form onSubmit={handleSubmit} className="px-6 space-y-10 pt-4">
                {/* DADOS PESSOAIS */}
                <section className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Dados Pessoais</h2>
                    
                    <div>
                        <label className={labelClass}>Nome Completo</label>
                        <input type="text" required className={inputClass} placeholder="Ex: João Silva" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className={labelClass}>E-mail</label>
                            <input type="email" required className={inputClass} placeholder="seu@email.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>WhatsApp</label>
                            <input type="tel" required className={inputClass} placeholder="(00) 00000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Endereço Completo</label>
                        <textarea required rows={2} className={inputClass + " resize-none"} placeholder="Rua, número, bairro..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                    </div>
                </section>

                {/* VEÍCULO */}
                <section className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Seu Veículo</h2>
                    
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'moto', label: 'Moto', icon: 'moped' },
                            { id: 'carro', label: 'Carro', icon: 'directions_car' },
                            { id: 'bike', label: 'Bike', icon: 'pedal_bike' },
                            { id: 'van', label: 'Van', icon: 'airport_shuttle' },
                        ].map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setFormData({...formData, vehicle_type: type.id})}
                                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.vehicle_type === type.id ? 'border-yellow-400 bg-yellow-50' : 'border-zinc-50 bg-[#F3F3F3]'}`}
                            >
                                <span className="material-symbols-outlined text-zinc-800 text-lg">{type.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-tight">{type.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Modelo</label>
                            <input type="text" required className={inputClass} placeholder="Modelo/Ano" value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} />
                        </div>
                        <div>
                            <label className={labelClass}>Placa</label>
                            <input type="text" required className={inputClass} placeholder="ABC-1234" value={formData.vehicle_plate} onChange={e => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})} />
                        </div>
                    </div>
                </section>

                {/* DOCUMENTOS */}
                <section className="space-y-6">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Documentos</h2>
                    
                    <div className="grid grid-cols-1 gap-4">
                        <label className="relative cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'cnh')} />
                            <div className={`p-6 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${previews.cnh ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200 bg-[#F3F3F3]'}`}>
                                {previews.cnh ? (
                                    <img src={previews.cnh} alt="CNH" className="h-20 rounded-xl object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-zinc-400 text-3xl">add_a_photo</span>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
                                    {previews.cnh ? "CNH Selecionada" : "Foto da CNH"}
                                </p>
                            </div>
                        </label>

                        <label className="relative cursor-pointer">
                            <input type="file" accept="image/*" className="hidden" onChange={e => handleFileChange(e, 'vehicle')} />
                            <div className={`p-6 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${previews.vehicle ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200 bg-[#F3F3F3]'}`}>
                                {previews.vehicle ? (
                                    <img src={previews.vehicle} alt="Veículo" className="h-20 rounded-xl object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-zinc-400 text-3xl">add_a_photo</span>
                                )}
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
                                    {previews.vehicle ? "Documento Selecionado" : "Documento do Veículo"}
                                </p>
                            </div>
                        </label>
                    </div>
                </section>

                <div className="pt-6">
                    <button
                        disabled={loading}
                        className={`w-full h-18 rounded-[2rem] bg-zinc-900 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/20 flex items-center justify-center gap-3 ${loading ? 'opacity-70' : ''}`}
                    >
                        {loading ? 'Enviando...' : 'Finalizar Cadastro'}
                    </button>
                </div>
            </form>
          </motion.div>
        )}

        {(step === 'waiting' || step === 'rejected') && (
            <motion.div 
                key={step} 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-white min-h-screen"
            >
                <div className={`size-24 rounded-[32px] flex items-center justify-center mb-8 ${step === 'waiting' ? 'bg-yellow-100 text-yellow-600' : 'bg-rose-100 text-rose-600'}`}>
                    <span className="material-symbols-outlined text-5xl font-black">
                        {step === 'waiting' ? 'hourglass_empty' : 'error_outline'}
                    </span>
                </div>
                <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase mb-4 leading-none">
                    {step === 'waiting' ? <>Análise em<br/>Andamento</> : 'Cadastro Recusado'}
                </h1>
                <p className="text-zinc-400 font-bold text-sm leading-relaxed mb-12 uppercase tracking-wide">
                    {step === 'waiting' 
                        ? 'Recebemos seus dados! Nossa equipe está validando seus documentos agora mesmo.' 
                        : 'Infelizmente seu cadastro não foi aprovado nesta fase. Verifique seus documentos e tente novamente.'
                    }
                </p>
                <div className="w-full max-w-xs space-y-4">
                    {step === 'rejected' && (
                        <button onClick={() => setStep('form')} className="w-full h-18 bg-zinc-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem]">Tentar Novamente</button>
                    )}
                    <button onClick={onClose} className="w-full h-18 bg-zinc-100 text-zinc-900 font-black uppercase tracking-[0.2em] rounded-[2rem]">Voltar ao Início</button>
                    <button onClick={onLogout} className="w-full h-18 bg-white border border-zinc-100 text-zinc-400 font-black uppercase tracking-[0.2em] rounded-[2rem]">Sair da Conta</button>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
