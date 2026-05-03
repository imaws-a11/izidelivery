import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";

interface DriverRegistrationViewProps {
  userId: string | null;
  onBack: () => void;
  showToast?: (msg: string, type: 'success' | 'error' | 'warning') => void;
}

export const DriverRegistrationView: React.FC<DriverRegistrationViewProps> = ({
  userId,
  onBack,
  showToast
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    vehicle_type: "moto",
    vehicle_model: "",
    vehicle_plate: "",
  });

  const [files, setFiles] = useState<{ cnh: File | null; vehicle: File | null }>({
    cnh: null,
    vehicle: null
  });

  const [previews, setPreviews] = useState<{ cnh: string | null; vehicle: string | null }>({
    cnh: null,
    vehicle: null
  });

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
    
    const { data, error } = await supabase.storage
      .from('driver-documents')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('driver-documents')
      .getPublicUrl(fileName);
      
    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    if (!files.cnh || !files.vehicle) {
      showToast?.("Por favor, anexe todos os documentos necessários.", "warning");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload dos documentos
      const cnhUrl = await uploadDocument(files.cnh, "cnh");
      const vehicleUrl = await uploadDocument(files.vehicle, "vehicle");

      // 2. Salvar candidatura no banco
      const { error } = await supabase
        .from("driver_applications_delivery")
        .insert({
          user_id: userId,
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          vehicle_type: formData.vehicle_type,
          vehicle_model: formData.vehicle_model,
          vehicle_plate: formData.vehicle_plate,
          document_cnh: cnhUrl,
          document_vehicle: vehicleUrl,
          status: 'pending'
        });

      if (error) throw error;

      showToast?.("Candidatura enviada com sucesso! Aguarde nossa análise.", "success");
      onBack();
    } catch (err: any) {
      console.error("[DRIVER_REG] Erro:", err);
      showToast?.("Erro ao enviar candidatura: " + (err.message || "Verifique sua conexão"), "error");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-[#F3F3F3] border-none rounded-2xl px-5 py-4 font-bold text-zinc-800 placeholder:text-zinc-400 focus:ring-2 focus:ring-yellow-400 transition-all outline-none";
  const labelClass = "text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 ml-2 block";

  return (
    <div className="flex flex-col min-h-screen bg-white text-zinc-900 pb-32">
      {/* HEADER */}
      <header className="px-6 pt-12 pb-6 flex items-center gap-4 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <button 
          onClick={onBack}
          className="size-10 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-transform"
        >
          <span className="material-symbols-outlined text-zinc-800">arrow_back</span>
        </button>
        <h1 className="text-xl font-black tracking-tight">Seja um Entregador</h1>
      </header>

      <form onSubmit={handleSubmit} className="px-6 space-y-8 pt-4">
        {/* INFO CARD */}
        <div className="bg-yellow-50 p-6 rounded-[32px] border border-yellow-100 flex gap-4">
           <div className="size-12 rounded-2xl bg-yellow-400 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-black font-black">moped</span>
           </div>
           <div>
              <p className="font-black text-sm text-yellow-900 leading-tight">Ganhe dinheiro entregando com a Izi!</p>
              <p className="text-yellow-700 text-[10px] font-bold mt-1 leading-relaxed">Complete os dados abaixo e entraremos em contato para ativar seu cadastro.</p>
           </div>
        </div>

        {/* DADOS PESSOAIS */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Dados Pessoais</h2>
          
          <div>
            <label className={labelClass}>Nome Completo</label>
            <input 
              type="text" 
              required
              className={inputClass}
              placeholder="Ex: João Silva"
              value={formData.full_name}
              onChange={e => setFormData({...formData, full_name: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className={labelClass}>E-mail</label>
              <input 
                type="email" 
                required
                className={inputClass}
                placeholder="seu@email.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>Telefone / WhatsApp</label>
              <input 
                type="tel" 
                required
                className={inputClass}
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Endereço Completo</label>
            <textarea 
              required
              rows={2}
              className={inputClass + " resize-none"}
              placeholder="Rua, número, bairro, cidade..."
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>
        </section>

        {/* DADOS DO VEÍCULO */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Veículo</h2>
          
          <div>
            <label className={labelClass}>Tipo de Veículo</label>
            <div className="grid grid-cols-2 gap-3">
               {[
                 { id: 'moto', label: 'Moto', icon: 'moped' },
                 { id: 'carro', label: 'Carro', icon: 'directions_car' },
                 { id: 'bike', label: 'Bicicleta', icon: 'pedal_bike' },
                 { id: 'van', label: 'Van / Utilitário', icon: 'airport_shuttle' },
               ].map(type => (
                 <button
                   key={type.id}
                   type="button"
                   onClick={() => setFormData({...formData, vehicle_type: type.id})}
                   className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.vehicle_type === type.id ? 'border-yellow-400 bg-yellow-50' : 'border-zinc-50 bg-[#F3F3F3]'}`}
                 >
                   <span className="material-symbols-outlined text-zinc-800 text-lg">{type.icon}</span>
                   <span className="text-[11px] font-black uppercase tracking-tight">{type.label}</span>
                 </button>
               ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className={labelClass}>Modelo / Ano</label>
              <input 
                type="text" 
                required
                className={inputClass}
                placeholder="Ex: CG 160 2022"
                value={formData.vehicle_model}
                onChange={e => setFormData({...formData, vehicle_model: e.target.value})}
              />
            </div>
            <div>
              <label className={labelClass}>Placa</label>
              <input 
                type="text" 
                required
                className={inputClass}
                placeholder="ABC-1234"
                value={formData.vehicle_plate}
                onChange={e => setFormData({...formData, vehicle_plate: e.target.value.toUpperCase()})}
              />
            </div>
          </div>
        </section>

        {/* DOCUMENTOS */}
        <section className="space-y-6">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Documentos</h2>
          
          <div className="grid grid-cols-1 gap-4">
             <label className="relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => handleFileChange(e, 'cnh')}
                />
                <div className={`p-6 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${previews.cnh ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200 bg-[#F3F3F3]'}`}>
                   {previews.cnh ? (
                     <img src={previews.cnh} alt="CNH" className="h-20 rounded-xl object-cover shadow-md" />
                   ) : (
                     <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-zinc-400">add_a_photo</span>
                     </div>
                   )}
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
                        {previews.cnh ? "CNH Selecionada" : "Foto da CNH"}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">Frente e Verso (aberta)</p>
                   </div>
                </div>
             </label>

             <label className="relative cursor-pointer group">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={e => handleFileChange(e, 'vehicle')}
                />
                <div className={`p-6 rounded-[28px] border-2 border-dashed transition-all flex flex-col items-center justify-center text-center gap-3 ${previews.vehicle ? 'border-emerald-400 bg-emerald-50' : 'border-zinc-200 bg-[#F3F3F3]'}`}>
                   {previews.vehicle ? (
                     <img src={previews.vehicle} alt="Veículo" className="h-20 rounded-xl object-cover shadow-md" />
                   ) : (
                     <div className="size-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <span className="material-symbols-outlined text-zinc-400">add_a_photo</span>
                     </div>
                   )}
                   <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">
                        {previews.vehicle ? "Documento Selecionado" : "Documento do Veículo"}
                      </p>
                      <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase">CRLV atualizado</p>
                   </div>
                </div>
             </label>
          </div>
        </section>

        {/* SUBMIT */}
        <div className="pt-6">
           <motion.button
             whileTap={{ scale: 0.98 }}
             disabled={loading}
             className={`w-full h-16 rounded-[28px] bg-zinc-900 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-zinc-900/20 flex items-center justify-center gap-3 ${loading ? 'opacity-70' : ''}`}
           >
             {loading ? (
               <div className="size-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
             ) : (
               <>
                 Enviar Cadastro
                 <span className="material-symbols-outlined">send</span>
               </>
             )}
           </motion.button>
           <p className="text-center text-[9px] font-bold text-zinc-400 mt-6 uppercase leading-relaxed px-10">
             Ao enviar, você concorda com os termos de uso e política de privacidade da Izi Delivery.
           </p>
        </div>
      </form>
    </div>
  );
};
