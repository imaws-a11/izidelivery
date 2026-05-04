import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { toastSuccess, toastError } from "../../../lib/useToast";

export const AccountDetailsView = ({ onBack, userName, userId }: { onBack: () => void, userName: string | null, userId: string | null }) => {
  const [name, setName] = useState(userName || "");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("name, email, phone, cpf, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      if (data && !error) {
        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setCpf(data.cpf || "");
        setAvatarUrl(data.avatar_url);
      }
    };
    fetchUserData();
  }, [userId]);

  const handleSave = async () => {
    if (!userId) return;
    setIsSaving(true);
    
    const { error } = await supabase
      .from("users_delivery")
      .update({ name, email, phone })
      .eq("id", userId);

    setIsSaving(false);
    if (error) {
      toastError("Erro ao salvar os dados.");
    } else {
      toastSuccess("Dados atualizados com sucesso!");
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-zinc-50 pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Dados da Conta</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-8 space-y-8">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="size-28 rounded-full overflow-hidden bg-yellow-100 border-4 border-white shadow-xl">
              <img src={avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "izi"}`} alt="Avatar" className="size-full object-cover" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-[32px] p-6 shadow-xl border border-zinc-100 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Nome Completo</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">E-mail</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Telefone</label>
            <input 
              type="tel" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all border border-zinc-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">CPF</label>
            <input 
              type="text" 
              value={cpf}
              disabled
              className="w-full bg-zinc-100 h-14 rounded-2xl px-4 font-bold text-zinc-500 border border-zinc-200"
            />
            <p className="text-[10px] text-zinc-400 font-medium ml-2 mt-1">O CPF não pode ser alterado após o cadastro.</p>
          </div>
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-yellow-400 text-black h-16 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-yellow-400/20 active:translate-y-1 transition-all disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar Alterações"}
        </motion.button>
        
        <button className="w-full text-rose-500 font-black text-sm py-4 active:opacity-50 transition-opacity">
          Excluir minha conta
        </button>
      </main>
    </div>
  );
};
