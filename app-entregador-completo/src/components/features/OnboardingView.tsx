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

export const OnboardingView: React.FC<OnboardingViewProps> = ({ userId, onApproved, onLogout, onClose }) => {
 const [step, setStep] = useState<'welcome' | 'form' | 'waiting' | 'rejected'>('welcome');
 const [loading, setLoading] = useState(true);
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

 const [files, setFiles] = useState<Record<DocType, File | null>>({
 cnh_front: null,
 cnh_back: null,
 vehicle_front: null,
 vehicle_back: null,
 residence: null,
 });

 const [previews, setPreviews] = useState<Record<DocType, string | null>>({
 cnh_front: null,
 cnh_back: null,
 vehicle_front: null,
 vehicle_back: null,
 residence: null,
 });

 const [showFeedback, setShowFeedback] = useState(false);
 const isFirstLoad = useRef(true);

 // 1. CARREGAR STATUS E RASCUNHO
 const loadInitialData = async () => {
 if (!userId) {
 console.warn("[DEBUG] userId ausente em OnboardingView. Cancelando load.");
 setLoading(false);
 return;
 }
 
 setLoading(true);
 
 try {
 console.log("[DEBUG] Iniciando loadInitialData para userId:", userId);
 
 // Cria um wrapper com timeout para evitar que requisições Supabase fiquem pendentes infinitamente
 const withTimeout = <T,>(promise: Promise<T>, ms = 8000): Promise<T> => {
 return Promise.race([
 promise,
 new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))
 ]);
 };

 // Verifica drivers
 const driverReq = supabase.from('drivers_delivery').select('id, is_active').eq('id', userId).maybeSingle();
 const { data: driver } = await withTimeout(driverReq);
 
 if (driver?.is_active) {
 onApproved();
 return;
 }

 // Verifica candidatura
 const appReq = supabase.from('driver_applications_delivery').select('*').eq('user_id', userId).maybeSingle();
 const { data: app } = await withTimeout(appReq);
 
 if (app) {
 if (app.status === 'pending' || app.status === 'approved') setStep('waiting');
 else if (app.status === 'rejected') setStep('rejected');
 return;
 }

 // Se não tem candidatura, busca rascunho para sincronização multidispositivo
 const userReq = supabase.from('users_delivery').select('onboarding_draft').eq('id', userId).maybeSingle();
 const { data: userData } = await withTimeout(userReq);
 
 if (userData?.onboarding_draft && typeof userData.onboarding_draft === 'object') {
 const draft = userData.onboarding_draft as any;
 if (draft.formData) setFormData(draft.formData);
 if (draft.previews) setPreviews(draft.previews);
 console.log("[DEBUG] Rascunho carregado para sincronização");
 }

 setStep('welcome');
 } catch (err) {
 console.error("[DEBUG] Erro no carregamento inicial OnboardingView:", err);
 // Se houver erro, forçamos o step welcome para não prender o usuário
 setStep('welcome');
 } finally {
 console.log("[DEBUG] Finalizando loadInitialData (setLoading = false)");
 setLoading(false);
 }
 };

 useEffect(() => { loadInitialData(); }, [userId]);

 // 2. AUTO-SAVE RASCUNHO (Sincronização Multidispositivo)
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
 }, 2000);

 return () => clearTimeout(timer);
 }, [formData, previews, step]);

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: DocType) => {
 const file = e.target.files?.[0];
 if (file) {
 if (file.size > 5 * 1024 * 1024) {
 toastError("Arquivo muito grande. Máximo 5MB.");
 return;
 }

 setFiles(prev => ({ ...prev, [type]: file }));
 
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
 <div className="fixed inset-0 bg-zinc-900/60 z-[150] flex flex-col items-center justify-center p-10 text-center">
 <motion.div 
 animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
 transition={{ duration: 2, repeat: Infinity }}
 className="size-20 rounded-xl bg-yellow-400 flex items-center justify-center mb-6 shadow-yellow-400/20"
 >
 <span className="material-symbols-outlined text-4xl text-black">moped</span>
 </motion.div>
 <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Validando Dados...</h2>
 </div>
 );
 }

 return (
 <div className="fixed inset-0 bg-white z-[150] flex flex-col font-display overflow-y-auto">
 <AnimatePresence mode="wait">
 {step === 'welcome' && (
 <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-screen">
 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
 <div className="size-24 bg-yellow-400 rounded-xl flex items-center justify-center mb-8 shadow-yellow-400/20">
 <span className="material-symbols-outlined text-5xl text-black font-black">moped</span>
 </div>
 <h1 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase mb-4 leading-none">Seja um<br/>Entregador Izi</h1>
 <p className="text-zinc-400 font-bold text-sm leading-relaxed mb-12 px-4 uppercase tracking-wide">
 Sua conta está sincronizada. Comece aqui e termine em qualquer dispositivo.
 </p>
 <div className="w-full max-w-xs space-y-4">
 <button onClick={() => setStep('form')} className="w-full h-18 bg-zinc-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem] shadow-zinc-900/20 active:scale-95 transition-all">
 {previews.cnh_front ? "Continuar Cadastro" : "Começar Cadastro"}
 </button>
 <button onClick={onLogout} className="w-full h-18 bg-white border border-zinc-100 text-zinc-400 font-black uppercase tracking-[0.2em] rounded-[2rem] active:scale-95 transition-all">Sair da Conta</button>
 {onClose && (
 <button onClick={onClose} className="w-full h-18 bg-transparent text-zinc-500 font-black uppercase tracking-[0.2em] rounded-[2rem] active:scale-95 transition-all text-xs">Voltar</button>
 )}
 </div>
 </div>
 </motion.div>
 )}

 {step === 'form' && (
 <motion.div key="form" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} className="flex-1 flex flex-col bg-white min-h-screen pb-32">
 <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-white z-50">
 <div className="flex items-center gap-4">
 <button onClick={() => setStep('welcome')} className="size-10 rounded-full bg-zinc-100 flex items-center justify-center"><span className="material-symbols-outlined text-zinc-800">arrow_back</span></button>
 <h1 className="text-xl font-black tracking-tight uppercase">Cadastro</h1>
 </div>
 {savingDraft && <span className="text-[10px] font-black text-yellow-600 animate-pulse uppercase tracking-widest">Sincronizando...</span>}
 </header>

 <form onSubmit={handleSubmit} className="px-6 space-y-10 pt-4">
 <section className="space-y-6">
 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Dados Pessoais</h2>
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
 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Veículo</h2>
 <div className="grid grid-cols-4 gap-2">
 {[
 { id: 'mototaxi', icon: 'moped' },
 { id: 'carro', icon: 'directions_car' },
 { id: 'bicicleta', icon: 'pedal_bike' },
 { id: 'van', icon: 'airport_shuttle' },
 ].map(type => (
 <button key={type.id} type="button" onClick={() => setFormData({...formData, vehicle_type: type.id})} className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${formData.vehicle_type === type.id ? 'border-yellow-400 bg-yellow-50' : 'border-zinc-50 bg-[#F3F3F3]'}`}>
 <span className="material-symbols-outlined text-zinc-800 text-lg">{type.icon}</span>
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
 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-yellow-600 ml-1">Documentos (Imagem ou PDF)</h2>
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
 <button disabled={loading} className={`w-full h-18 rounded-[2rem] bg-zinc-900 text-white font-black uppercase tracking-[0.2em] shadow-zinc-900/20 flex items-center justify-center gap-3 ${loading ? 'opacity-70' : ''}`}>
 {loading ? 'Processando...' : 'Finalizar Cadastro'}
 </button>
 </div>
 </form>
 </motion.div>
 )}

 {(step === 'waiting' || step === 'rejected') && (
 <motion.div key={step} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-white min-h-screen">
 <div className={`size-24 rounded-xl flex items-center justify-center mb-8 ${step === 'waiting' ? 'bg-yellow-100 text-yellow-600' : 'bg-rose-100 text-rose-600'}`}>
 <span className="material-symbols-outlined text-5xl font-black">{step === 'waiting' ? 'hourglass_empty' : 'error_outline'}</span>
 </div>
 <h1 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase mb-4 leading-none">{step === 'waiting' ? <>Análise em<br/>Andamento</> : 'Cadastro Recusado'}</h1>
 <p className="text-zinc-400 font-bold text-sm leading-relaxed mb-12 uppercase tracking-wide">
 {step === 'waiting' ? 'Nossa equipe está validando seus 5 documentos. Você receberá uma notificação em breve.' : 'Verifique seus documentos e tente novamente.'}
 </p>
 <div className="w-full max-w-xs space-y-4">
 {step === 'rejected' && <button onClick={() => setStep('form')} className="w-full h-18 bg-zinc-900 text-white font-black uppercase tracking-[0.2em] rounded-[2rem]">Tentar Novamente</button>}
 <button onClick={onLogout} className="w-full h-18 bg-white border border-zinc-100 text-zinc-400 font-black uppercase tracking-[0.2em] rounded-[2rem]">Sair da Conta</button>
 {onClose && (
 <button onClick={onClose} className="w-full h-18 bg-transparent text-zinc-500 font-black uppercase tracking-[0.2em] rounded-[2rem] active:scale-95 transition-all text-xs">Voltar</button>
 )}
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
 <div className={`p-4 h-40 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-2 ${preview ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200 bg-[#F3F3F3]'}`}>
 {preview ? (
 isPDF ? (
 <div className="flex flex-col items-center gap-2">
 <span className="material-symbols-outlined text-rose-500 text-4xl">picture_as_pdf</span>
 <span className="text-[8px] font-black text-rose-600 uppercase">PDF Pronto</span>
 </div>
 ) : (
 <img src={preview} alt={label} className="h-24 w-full object-cover rounded-xl" />
 )
 ) : (
 <span className="material-symbols-outlined text-zinc-400 text-3xl group-hover:scale-110 transition-transform">cloud_upload</span>
 )}
 <p className={`text-[9px] font-black uppercase tracking-tight ${preview ? 'text-emerald-700' : 'text-zinc-500'}`}>{label}</p>
 </div>
 </label>
 );
};
