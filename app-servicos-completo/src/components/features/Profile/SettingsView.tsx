import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";

export const SettingsView = ({ onBack }: { onBack: () => void }) => {
  const { userId } = useAuth();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("users_delivery")
        .select("push_notifications_enabled")
        .eq("id", userId)
        .single();
        
      if (data && data.push_notifications_enabled !== null) {
        setPushEnabled(data.push_notifications_enabled);
      }
      setIsLoading(false);
    };
    fetchSettings();
  }, [userId]);

  const togglePush = async () => {
    const newValue = !pushEnabled;
    setPushEnabled(newValue);
    if (userId) {
      await supabase
        .from("users_delivery")
        .update({ push_notifications_enabled: newValue })
        .eq("id", userId);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    // document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] pb-20 overflow-y-auto">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Configurações</h1>
        <div className="size-10" />
      </header>

      <main className="mt-4">
        {isLoading ? (
          <div className="flex justify-center py-10"><div className="size-8 border-4 border-zinc-200 border-t-yellow-400 rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white border-y border-zinc-100">
             <button 
               onClick={togglePush}
               className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50 active:bg-zinc-50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <span className="material-symbols-rounded text-zinc-800 text-[22px]">notifications_active</span>
                   <span className="text-base font-bold text-zinc-800">Notificações Push</span>
                </div>
                <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${pushEnabled ? 'bg-yellow-400 justify-end' : 'bg-zinc-200 justify-start'}`}>
                   <motion.div layout className="size-4 bg-white rounded-full shadow-sm" />
                </div>
             </button>
             
             <button 
               onClick={toggleTheme}
               className="w-full px-6 py-5 flex items-center justify-between border-b border-zinc-50 active:bg-zinc-50 transition-colors"
             >
                <div className="flex items-center gap-4">
                   <span className="material-symbols-rounded text-zinc-800 text-[22px]">dark_mode</span>
                   <span className="text-base font-bold text-zinc-800">Tema Escuro</span>
                </div>
                <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${darkMode ? 'bg-zinc-800 justify-end' : 'bg-zinc-200 justify-start'}`}>
                   <motion.div layout className="size-4 bg-white rounded-full shadow-sm" />
                </div>
             </button>
             
             <button className="w-full px-6 py-5 flex items-center justify-between active:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                   <span className="material-symbols-rounded text-zinc-800 text-[22px]">language</span>
                   <span className="text-base font-bold text-zinc-800">Idioma</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                   <span className="text-sm font-bold">Português (BR)</span>
                   <span className="material-symbols-rounded text-sm">chevron_right</span>
                </div>
             </button>
          </div>
        )}
      </main>
    </div>
  );
};
