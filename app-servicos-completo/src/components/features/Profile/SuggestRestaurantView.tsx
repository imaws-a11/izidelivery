import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { toastSuccess, toastError } from "../../../lib/useToast";

export const SuggestRestaurantView = ({ onBack }: { onBack: () => void }) => {
  const [storeName, setStoreName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!storeName.trim()) {
      toastError("Por favor, informe o nome da loja.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("store_suggestions")
        .insert({
          user_id: user?.id,
          store_name: storeName,
          instagram_handle: instagram,
          reason: reason
        });

      if (error) throw error;

      toastSuccess("Sugestão enviada com sucesso! Obrigado.");
      onBack();
    } catch (err: any) {
      toastError(err.message || "Erro ao enviar sugestão.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-zinc-50 pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Sugerir Loja</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-8 space-y-6">
        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-zinc-100 space-y-6">
          <p className="text-sm font-medium text-zinc-500 mb-4">Sua loja favorita não está no Izi? Conta pra gente!</p>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Nome do Estabelecimento</label>
            <input 
              type="text" 
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Ex: Pizzaria do Zé"
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Instagram ou Link (Opcional)</label>
            <input 
              type="text" 
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@pizzariadoze"
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Por que devemos chamá-los?</label>
            <textarea 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="A melhor pizza da cidade!"
              className="w-full bg-zinc-50 rounded-2xl p-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200 resize-none"
            />
          </div>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full h-16 rounded-3xl font-black uppercase tracking-widest shadow-xl transition-all ${isSubmitting ? 'bg-zinc-200 text-zinc-400' : 'bg-yellow-400 text-black shadow-yellow-400/20 active:translate-y-1'}`}
        >
          {isSubmitting ? "Enviando..." : "Enviar Sugestão"}
        </motion.button>
      </main>
    </div>
  );
};
