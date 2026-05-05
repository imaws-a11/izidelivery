import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { toastError } from "../../../lib/useToast";

export const ConnectedAccountsView = ({ onBack }: { onBack: () => void }) => {
  const [identities, setIdentities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchIdentities = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.identities) {
        setIdentities(user.identities);
      }
      setIsLoading(false);
    };
    fetchIdentities();
  }, []);

  const isConnected = (provider: string) => {
    return identities.some(id => id.provider === provider);
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Contas Conectadas</h1>
        <div className="size-10" />
      </header>

      <main className="mt-4">
        <div className="bg-white border-y border-zinc-100">
           {/* GOOGLE */}
           <div className="px-6 py-5 flex items-center justify-between border-b border-zinc-50">
              <div className="flex items-center gap-4">
                 <img src="https://cdn-icons-png.flaticon.com/512/2991/2991148.png" className="size-6 object-contain" alt="Google" />
                 <span className="text-base font-bold text-zinc-800">Google</span>
              </div>
              {isLoading ? (
                <div className="size-4 border-2 border-zinc-200 border-t-zinc-400 rounded-full animate-spin" />
              ) : isConnected("google") ? (
                <button className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Desconectar</button>
              ) : (
                <button className="text-xs font-black text-zinc-900 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Conectar</button>
              )}
           </div>

           {/* APPLE */}
           <div className="px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <img src="https://cdn-icons-png.flaticon.com/512/0/747.png" className="size-6 object-contain" alt="Apple" />
                 <span className="text-base font-bold text-zinc-800">Apple</span>
              </div>
              {isLoading ? (
                <div className="size-4 border-2 border-zinc-200 border-t-zinc-400 rounded-full animate-spin" />
              ) : isConnected("apple") ? (
                <button className="text-xs font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Desconectar</button>
              ) : (
                <button className="text-xs font-black text-zinc-900 uppercase tracking-widest bg-zinc-100 px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Conectar</button>
              )}
           </div>
        </div>

        <div className="px-6 mt-6">
           <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed text-center px-4">
              Vincule suas contas para fazer login de forma mais rápida e segura no Izi Delivery.
           </p>
        </div>
      </main>
    </div>
  );
};
