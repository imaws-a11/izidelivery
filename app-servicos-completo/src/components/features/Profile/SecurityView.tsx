import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { toastSuccess, toastError } from "../../../lib/useToast";

export const SecurityView = ({ onBack }: { onBack: () => void }) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(() => {
    return localStorage.getItem("izi_biometrics_enabled") === "true";
  });

  const toggleBiometrics = () => {
    const newValue = !biometricsEnabled;
    setBiometricsEnabled(newValue);
    localStorage.setItem("izi_biometrics_enabled", String(newValue));
    toastSuccess(newValue ? "Biometria ativada!" : "Biometria desativada.");
  };

  const handleUpdatePassword = async () => {
    if (newPassword.length < 6) {
      toastError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toastError("As senhas não coincidem.");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toastSuccess("Senha atualizada com sucesso!");
      setShowPasswordModal(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toastError(err.message || "Erro ao atualizar senha.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Segurança</h1>
        <div className="size-10" />
      </header>

      <main className="mt-4">
        <div className="bg-white border-y border-zinc-100">
           {/* ALTERAR SENHA */}
           <button 
             onClick={() => setShowPasswordModal(true)}
             className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50 active:bg-zinc-50"
           >
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">password</span>
                 <span className="text-base font-bold text-zinc-800">Alterar Senha</span>
              </div>
              <span className="material-symbols-rounded text-zinc-300 text-sm">chevron_right</span>
           </button>

           {/* BIOMETRIA */}
           <button 
             onClick={toggleBiometrics}
             className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50 active:bg-zinc-50"
           >
              <div className="flex items-center gap-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">fingerprint</span>
                 <div className="text-left">
                    <span className="text-base font-bold text-zinc-800 block">Biometria (Face ID/Touch ID)</span>
                    <span className="text-xs text-zinc-400 font-medium">Acesse o app sem senha</span>
                 </div>
              </div>
              <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-all ${biometricsEnabled ? 'bg-yellow-400 justify-end' : 'bg-zinc-200 justify-start'}`}>
                 <motion.div layout className="size-4 bg-white rounded-full shadow-sm" />
              </div>
           </button>

           {/* DISPOSITIVOS */}
           <div className="px-6 py-5">
              <div className="flex items-center gap-4 mb-4">
                 <span className="material-symbols-rounded text-zinc-800 text-[22px]">devices</span>
                 <span className="text-base font-bold text-zinc-800">Este Dispositivo</span>
              </div>
              <div className="bg-zinc-50 p-4 rounded-2xl flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center">
                       <span className="material-symbols-rounded text-zinc-400">smartphone</span>
                    </div>
                    <div>
                       <p className="text-sm font-bold text-zinc-900">iPhone 15 Pro Max</p>
                       <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">Sessão Ativa</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* MODAL ALTERAR SENHA */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 bg-black/40 backdrop-blur-sm">
             <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className="w-full max-w-md bg-white rounded-[40px] p-8 shadow-2xl"
             >
                <div className="flex items-center justify-between mb-8">
                   <h2 className="text-2xl font-black text-zinc-900">Nova Senha</h2>
                   <button onClick={() => setShowPasswordModal(false)} className="size-10 rounded-full bg-zinc-50 flex items-center justify-center">
                      <span className="material-symbols-rounded text-zinc-400">close</span>
                   </button>
                </div>

                <div className="space-y-4">
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Senha Atualizada</label>
                      <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none border border-zinc-100"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Confirmar Senha</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full bg-zinc-50 h-14 rounded-2xl px-4 font-bold text-zinc-900 focus:outline-none border border-zinc-100"
                      />
                   </div>

                   <button 
                     onClick={handleUpdatePassword}
                     disabled={isUpdating}
                     className="w-full h-16 bg-zinc-900 text-white rounded-3xl font-black uppercase tracking-widest mt-4 shadow-xl shadow-zinc-900/20 active:scale-95 transition-transform"
                   >
                     {isUpdating ? "Atualizando..." : "Salvar Nova Senha"}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
