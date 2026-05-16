import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { toast, toastSuccess, toastError } from '../../lib/useToast';

interface OnboardingViewProps {
  userId: string;
  onApproved: () => void;
  onLogout: () => void;
  onClose?: () => void;
}

type DocType = 'cnh_front' | 'cnh_back' | 'vehicle_front' | 'vehicle_back' | 'residence';

const Icon = ({ name, className, size = 24 }: { name: string, className?: string, size?: number }) => (
  <span className={`material-symbols-outlined ${className}`} style={{ fontSize: size }}>{name}</span>
);

export const OnboardingView: React.FC<OnboardingViewProps> = ({ userId, onApproved, onLogout, onClose }) => {
  const [step, setStep] = useState<'welcome' | 'form' | 'waiting' | 'rejected' | 'update_docs'>('welcome');
  const [loading, setLoading] = useState(true);
  const [isAlreadyActive, setIsAlreadyActive] = useState(false);
  const [missingDocs, setMissingDocs] = useState<DocType[]>([]);
  const [savingDraft, setSavingDraft] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    vehicle_type: 'mototaxi',
    vehicle_model: '',
    vehicle_plate: '',
  });

  const [previews, setPreviews] = useState<Record<DocType, string | null>>({
    cnh_front: null,
    cnh_back: null,
    vehicle_front: null,
    vehicle_back: null,
    residence: null,
  });

  const isFirstLoad = useRef(true);

  // 1. CARREGAR STATUS E RASCUNHO
  const loadInitialData = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    try {
      // Wrapper com timeout reduzido para 5s para falhar rápido e não prender a UI
      const withTimeout = <T,>(promise: Promise<T>, ms = 5000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
        ]);
      };

      // Verifica drivers e documentos obrigatórios
      const driverReq = supabase
        .from('drivers_delivery')
        .select('id, is_active, doc_cnh_frente, doc_cnh_verso, doc_vehicle, doc_vehicle_verso, doc_residencia')
        .eq('id', userId)
        .maybeSingle();
      const { data: driver } = await withTimeout(driverReq);
      
      const hasAllDocs = 
        driver?.doc_cnh_frente && 
        driver?.doc_cnh_verso && 
        driver?.doc_vehicle && 
        driver?.doc_vehicle_verso && 
        driver?.doc_residencia;

      if (driver?.is_active && hasAllDocs) {
        onApproved();
        return;
      }

      const missing: DocType[] = [];
      if (!driver?.doc_cnh_frente) missing.push('cnh_front');
      if (!driver?.doc_cnh_verso) missing.push('cnh_back');
      if (!driver?.doc_vehicle) missing.push('vehicle_front');
      if (!driver?.doc_vehicle_verso) missing.push('vehicle_back');
      if (!driver?.doc_residencia) missing.push('residence');
      
      setMissingDocs(missing);

      if (driver?.is_active && missing.length === 0) {
        onApproved();
        return;
      }

      if (driver?.is_active && missing.length > 0) {
        setIsAlreadyActive(true);
        // Se o usuário clicar em "Atualizar", vamos levá-lo para update_docs
      }

      // Verifica candidatura (pega a mais recente caso haja duplicidade)
      const appReq = supabase
        .from('driver_applications_delivery')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);
      const { data: apps } = await withTimeout(appReq);
      const app = apps && apps.length > 0 ? apps[0] : null;
      
      if (app) {
        if (app.status === 'pending' || app.status === 'approved') setStep('waiting');
        else if (app.status === 'rejected') setStep('rejected');
        return;
      }

      // Busca rascunho
      const userReq = supabase.from('users_delivery').select('onboarding_draft').eq('id', userId).maybeSingle();
      const { data: userData } = await withTimeout(userReq);
      
      if (userData?.onboarding_draft && typeof userData.onboarding_draft === 'object') {
        const draft = userData.onboarding_draft as any;
        if (draft.formData) setFormData(prev => ({ ...prev, ...draft.formData }));
        if (draft.previews) setPreviews(prev => ({ ...prev, ...draft.previews }));
      }

      setStep('welcome');
    } catch (err) {
      console.warn("[ONBOARDING] Falha no load assíncrono (possível timeout ou offline):", err);
      // Fallback: se falhar o carregamento, mostramos a tela de boas vindas para permitir que ele tente preencher
      setStep('welcome');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInitialData(); }, [userId]);

  // 2. AUTO-SAVE RASCUNHO
  useEffect(() => {
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      if (step !== 'form') return;
      setSavingDraft(true);
      try {
        await supabase.from('users_delivery').update({
          onboarding_draft: { formData, previews }
        }).eq('id', userId);
      } catch (err) {
        console.error("Erro ao salvar rascunho:", err);
      } finally {
        setSavingDraft(false);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [formData, previews, step]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: DocType) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toastError("Arquivo muito grande. Máximo 5MB.");
        return;
      }

      try {
        const url = await uploadDocument(file, type);
        setPreviews(prev => ({ ...prev, [type]: url }));
        toastSuccess("Documento enviado!");
      } catch (err) {
        toastError("Erro ao subir arquivo.");
      }
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
    const missingDocs = Object.entries(previews).filter(([_, url]) => !url);
    if (missingDocs.length > 0) {
      toastError("Por favor, anexe todos os 5 documentos obrigatórios.");
      return;
    }

    if (!formData.full_name || !formData.email || !formData.phone || !formData.address || !formData.vehicle_model || !formData.vehicle_plate) {
      toastError("Preencha todos os campos do formulário.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('driver_applications_delivery').insert({
        user_id: userId,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        vehicle_type: formData.vehicle_type,
        vehicle_model: formData.vehicle_model,
        vehicle_plate: formData.vehicle_plate,
        document_cnh: previews.cnh_front,
        document_cnh_verso: previews.cnh_back,
        document_vehicle: previews.vehicle_front,
        document_vehicle_verso: previews.vehicle_back,
        document_residence: previews.residence,
        status: 'pending'
      });

      if (error) throw error;
      await supabase.from('users_delivery').update({ onboarding_draft: {} }).eq('id', userId);
      toastSuccess("Cadastro enviado com sucesso!");
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
      <div className="fixed inset-0 bg-white z-[6000] flex flex-col items-center justify-center p-10 text-center">
        <motion.div 
          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="size-24 rounded-[2.5rem] bg-yellow-400 flex items-center justify-center mb-8 shadow-2xl shadow-yellow-400/20"
        >
          <Icon name="moped" size={48} className="text-black font-black" />
        </motion.div>
        <h2 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter mb-2">Sincronizando</h2>
        <p className="text-zinc-400 font-bold text-[10px] uppercase tracking-[0.4em] animate-pulse">Aguarde um instante...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[6000] flex flex-col font-display overflow-y-auto">
      <AnimatePresence mode="wait">
        {step === 'welcome' && (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-screen">
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
              <div className="size-28 bg-yellow-400 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-2xl shadow-yellow-400/20">
                <Icon name="moped" size={56} className="text-black font-black" />
              </div>
              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase mb-4 leading-none">Seja um<br/>Entregador Izi</h1>
              <p className="text-zinc-400 font-bold text-sm leading-relaxed mb-12 px-4 uppercase tracking-wide">
                Sua conta está sincronizada. Comece aqui e termine em qualquer dispositivo.
              </p>
              <div className="w-full max-w-xs space-y-4">
                <button onClick={() => setStep('form')} className="w-full h-18 bg-zinc-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-2xl shadow-zinc-900/20 active:scale-95 transition-all">
                  {previews.cnh_front ? "Continuar Cadastro" : "Começar Cadastro"}
                </button>
                <button onClick={onLogout} className="w-full h-18 bg-white border-2 border-zinc-100 text-zinc-400 font-black uppercase tracking-[0.2em] rounded-[2rem] active:scale-95 transition-all">Sair da Conta</button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div key="form" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col bg-white min-h-screen pb-32">
            <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-50">
              <div className="flex items-center gap-4">
                <button onClick={() => setStep('welcome')} className="size-11 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-all"><Icon name="arrow_back" className="text-zinc-800" /></button>
                <h1 className="text-2xl font-black tracking-tight uppercase">Cadastro</h1>
              </div>
              {savingDraft && <span className="text-[10px] font-black text-yellow-600 animate-pulse uppercase tracking-widest">Sincronizando...</span>}
            </header>

            <form onSubmit={handleSubmit} className="px-6 space-y-12 pt-4">
              <section className="space-y-6">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Dados Pessoais</h2>
                <div>
                  <label className={labelClass}>Nome Completo</label>
                  <input type="text" required className={inputClass} value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>E-mail</label>
                    <input type="email" required className={inputClass} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>WhatsApp</label>
                    <input type="tel" required className={inputClass} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Endereço Completo</label>
                  <textarea required rows={2} className={inputClass + " resize-none"} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Veículo</h2>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: 'mototaxi', icon: 'moped' },
                    { id: 'carro', icon: 'directions_car' },
                    { id: 'bicicleta', icon: 'pedal_bike' },
                    { id: 'van', icon: 'airport_shuttle' },
                  ].map(type => (
                    <button key={type.id} type="button" onClick={() => setFormData({...formData, vehicle_type: type.id})} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-95 ${formData.vehicle_type === type.id ? 'border-yellow-400 bg-yellow-50' : 'border-zinc-50 bg-[#F3F3F3]'}`}>
                      <Icon name={type.icon} className="text-zinc-800" />
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Modelo</label>
                    <input type="text" required className={inputClass} value={formData.vehicle_model} onChange={e => setFormData({...formData, vehicle_model: e.target.value})} />
                  </div>
                  <div>
                    <label className={labelClass}>Placa</label>
                    <input type="text" required className={inputClass} value={formData.vehicle_plate} onChange={e => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})} />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Documentos (Imagem ou PDF)</h2>
                <div className="grid grid-cols-2 gap-4">
                  <DocUpload slot="cnh_front" label="CNH Frente" preview={previews.cnh_front} onChange={handleFileChange} />
                  <DocUpload slot="cnh_back" label="CNH Verso" preview={previews.cnh_back} onChange={handleFileChange} />
                  <DocUpload slot="vehicle_front" label="CRLV Frente" preview={previews.vehicle_front} onChange={handleFileChange} />
                  <DocUpload slot="vehicle_back" label="CRLV Verso" preview={previews.vehicle_back} onChange={handleFileChange} />
                  <div className="col-span-2">
                    <DocUpload slot="residence" label="Comprovante de Residência" preview={previews.residence} onChange={handleFileChange} />
                  </div>
                </div>
              </section>

              <div className="pt-6">
                <button disabled={loading} className={`w-full h-20 rounded-[2.5rem] bg-zinc-900 text-white font-black uppercase tracking-[0.3em] shadow-2xl shadow-zinc-900/20 flex items-center justify-center gap-3 active:scale-95 transition-all ${loading ? 'opacity-70' : ''}`}>
                  {loading ? 'Processando...' : 'Finalizar Cadastro'}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {(step === 'waiting' || step === 'rejected') && (
          <motion.div 
            key={step} 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 z-50 flex flex-col items-center justify-center p-8 text-center overflow-hidden font-['Plus_Jakarta_Sans']"
          >
            {/* Stealth Luxury Background */}
            <div className="absolute inset-0 bg-white z-0" />
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-yellow-400/5 via-transparent to-zinc-900/5 z-0" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-yellow-400/10 blur-[120px] rounded-full" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-900/5 blur-[120px] rounded-full" />

            <div className="relative z-10 w-full max-w-md flex flex-col items-center">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`size-32 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl backdrop-blur-md border border-white/60 ${step === 'waiting' ? 'bg-yellow-400/20 text-yellow-600 shadow-yellow-400/10' : 'bg-rose-500/10 text-rose-500 shadow-rose-500/10'}`}
              >
                <Icon name={step === 'waiting' ? 'hourglass_empty' : 'error_outline'} size={64} className="font-black" />
              </motion.div>

              <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase mb-4 leading-[0.9] flex flex-col">
                {step === 'waiting' ? (
                  <>
                    <span className="text-sm font-black text-yellow-600 tracking-[0.4em] mb-3">Dossiê Izi</span>
                    Análise em<br/>Andamento
                  </>
                ) : (
                  <>
                    <span className="text-sm font-black text-rose-600 tracking-[0.4em] mb-3">Atenção</span>
                    Cadastro<br/>Recusado
                  </>
                )}
              </h1>

              <p className="text-zinc-400 font-bold text-[11px] leading-relaxed mb-16 px-6 uppercase tracking-[0.15em] max-w-xs">
                {step === 'waiting' ? 'Nossa equipe de inteligência está validando seus documentos. Você receberá uma notificação em breve.' : 'Houve um problema com seus documentos. Por favor, revise os dados e tente novamente.'}
              </p>

              <div className="w-full space-y-4 px-4">
                {step === 'rejected' && (
                  <button 
                    onClick={() => setStep('form')} 
                    className="w-full h-20 bg-zinc-900 text-white font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-2xl shadow-zinc-900/30 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    Revisar Dados <Icon name="edit" size={18} />
                  </button>
                )}

                {step === 'waiting' && isAlreadyActive && (
                  <button 
                    onClick={() => setStep('update_docs')} 
                    className="w-full h-20 bg-yellow-400 text-zinc-900 font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-2xl shadow-yellow-400/30 active:scale-95 transition-all flex items-center justify-center gap-3 border-2 border-white"
                  >
                    Atualizar Documentos <Icon name="upload_file" size={20} />
                  </button>
                )}

                <button 
                  onClick={onLogout} 
                  className="w-full h-20 bg-white/40 backdrop-blur-md border-2 border-zinc-950/5 text-zinc-950 font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Sair da Conta <Icon name="logout" size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 'update_docs' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[60] bg-white overflow-y-auto font-['Plus_Jakarta_Sans']"
          >
            <div className="min-h-screen flex flex-col p-8 lg:p-16 max-w-2xl mx-auto">
              <header className="mb-12 flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Atualização<br/>de Dossiê</h2>
                  <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] mt-3">Documentação Pendente</p>
                </div>
                <button onClick={() => setStep('waiting')} className="size-14 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400"><Icon name="close" /></button>
              </header>

              <div className="flex-1 space-y-10">
                <div className="p-8 bg-zinc-900 rounded-[3rem] text-white shadow-2xl shadow-zinc-900/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10"><Icon name="security" size={80} /></div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-2">Segurança Izi</h3>
                  <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed">
                    Para mantermos a conformidade com a nova política de segurança, precisamos que você envie apenas os arquivos abaixo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {missingDocs.map(docSlot => (
                    <DocUpload 
                      key={docSlot}
                      slot={docSlot} 
                      label={
                        docSlot === 'cnh_front' ? 'CNH Frente' :
                        docSlot === 'cnh_back' ? 'CNH Verso' :
                        docSlot === 'vehicle_front' ? 'CRLV Frente' :
                        docSlot === 'vehicle_back' ? 'CRLV Verso' : 'Comprovante de Residência'
                      } 
                      preview={previews[docSlot]} 
                      onChange={handleFileChange} 
                    />
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <button 
                  onClick={handleSubmit}
                  disabled={loading || missingDocs.some(slot => !formData[`document_${slot === 'cnh_front' ? 'cnh' : slot === 'cnh_back' ? 'cnh_verso' : slot === 'vehicle_front' ? 'vehicle' : slot === 'vehicle_back' ? 'vehicle_verso' : 'residence'}` as keyof typeof formData])}
                  className="w-full h-20 bg-zinc-900 text-white font-black uppercase tracking-[0.3em] rounded-[2.5rem] shadow-2xl shadow-zinc-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? 'Processando...' : 'Enviar Atualização'}
                </button>
                <p className="text-center mt-6 text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sua conta permanecerá ativa enquanto analisamos</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DocUpload = ({ slot, label, preview, onChange }: { slot: DocType, label: string, preview: string | null, onChange: any }) => {
  const isPDF = preview?.toLowerCase().includes('.pdf');
  return (
    <label className="relative cursor-pointer group">
      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={e => onChange(e, slot)} />
      <div className={`p-5 h-44 rounded-[2.5rem] border-3 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 active:scale-95 ${preview ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-100 bg-[#F3F3F3]'}`}>
        {preview ? (
          isPDF ? (
            <div className="flex flex-col items-center gap-2">
              <Icon name="picture_as_pdf" className="text-rose-500" size={40} />
              <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest">PDF Pronto</span>
            </div>
          ) : (
            <div className="relative w-full h-28">
              <img src={preview} alt={label} className="h-full w-full object-cover rounded-2xl" />
              <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Icon name="check_circle" className="text-white" size={32} />
              </div>
            </div>
          )
        ) : (
          <Icon name="cloud_upload" className="text-zinc-300 group-hover:scale-110 group-hover:text-yellow-500 transition-all" size={40} />
        )}
        <p className={`text-[10px] font-black uppercase tracking-tight ${preview ? 'text-emerald-700' : 'text-zinc-500'}`}>{label}</p>
      </div>
    </label>
  );
};
