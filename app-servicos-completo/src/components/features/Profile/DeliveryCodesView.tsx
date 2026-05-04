import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";
import { toastSuccess, toastError } from "../../../lib/useToast";

export const DeliveryCodesView = ({ onBack }: { onBack: () => void }) => {
  const { userId } = useAuth();
  const [code, setCode] = useState<string>("0000");
  const [isEditing, setIsEditing] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetchCode = async () => {
      const { data } = await supabase
        .from("users_delivery")
        .select("delivery_code, phone")
        .eq("id", userId)
        .single();
      
      if (data) {
        if (data.delivery_code) {
          setCode(data.delivery_code);
        } else if (data.phone) {
          const onlyNumbers = data.phone.replace(/\D/g, "");
          const last4 = onlyNumbers.slice(-4);
          setCode(last4.padStart(4, "0"));
        }
      }
      setIsLoading(false);
    };
    fetchCode();
  }, [userId]);

  const handleSave = async () => {
    if (newCode.length !== 4 || isNaN(Number(newCode))) {
      toastError("O código deve ter exatamente 4 números.");
      return;
    }
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("users_delivery")
        .update({ delivery_code: newCode })
        .eq("id", userId);
        
      if (error) throw error;
      
      setCode(newCode);
      setIsEditing(false);
      setNewCode("");
      toastSuccess("Código de entrega atualizado!");
    } catch (e) {
      toastError("Erro ao salvar código.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-zinc-900 text-white pb-20">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors">
          <span className="material-symbols-rounded text-white">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-white">Código de Entrega</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-10 flex flex-col items-center flex-1">
        <div className="bg-white/10 p-8 rounded-full mb-8">
           <span className="material-symbols-rounded text-6xl text-yellow-400">qr_code_2</span>
        </div>
        
        <h2 className="text-2xl font-black text-center mb-4">Mantenha sua entrega segura</h2>
        <p className="text-zinc-400 text-center text-sm mb-8">
          Informe o código abaixo ao entregador apenas quando ele chegar com o seu pedido. Nunca repasse por chat ou telefone.
        </p>

        <div className="bg-yellow-400 w-full rounded-[40px] p-8 text-center shadow-2xl shadow-yellow-400/20 mt-8 relative overflow-hidden">
           <p className="text-black/60 font-black text-xs uppercase tracking-[0.3em] mb-2">Código Atual</p>
           
           {isLoading ? (
             <div className="h-20 flex items-center justify-center">
               <div className="size-8 border-4 border-black/20 border-t-black rounded-full animate-spin" />
             </div>
           ) : (
             <h3 className="text-6xl font-black text-black tracking-[0.2em] mb-4">{code}</h3>
           )}
           
           <p className="text-black text-xs font-bold bg-black/10 inline-block px-4 py-2 rounded-full mb-6">
             Válido para pedidos em andamento
           </p>

           <AnimatePresence mode="wait">
             {!isEditing ? (
               <motion.button 
                 key="btn-edit"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => { setIsEditing(true); setNewCode(""); }}
                 className="w-full h-12 bg-black text-white rounded-2xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-black/20"
               >
                 Alterar Código
               </motion.button>
             ) : (
               <motion.div 
                 key="form-edit"
                 initial={{ opacity: 0, height: 0 }}
                 animate={{ opacity: 1, height: "auto" }}
                 exit={{ opacity: 0, height: 0 }}
                 className="flex flex-col gap-3 border-t border-black/10 pt-6 mt-2"
               >
                 <p className="text-black text-xs font-bold mb-1">Digite o novo código de 4 dígitos:</p>
                 <input 
                   type="text" 
                   inputMode="numeric"
                   maxLength={4}
                   value={newCode}
                   onChange={(e) => setNewCode(e.target.value.replace(/\D/g, ""))}
                   placeholder="Ex: 1234"
                   className="w-full h-14 bg-white text-center text-2xl font-black text-black rounded-2xl outline-none border-2 border-transparent focus:border-black transition-colors"
                 />
                 <div className="flex gap-2 mt-2">
                   <button 
                     onClick={() => setIsEditing(false)}
                     className="flex-1 h-12 bg-black/10 text-black rounded-xl font-bold text-sm active:scale-95 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                     onClick={handleSave}
                     disabled={isSaving || newCode.length !== 4}
                     className="flex-1 h-12 bg-black text-yellow-400 rounded-xl font-black text-sm active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center"
                   >
                     {isSaving ? <div className="size-5 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" /> : "Salvar"}
                   </button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
