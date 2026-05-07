import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";

export const LoyaltyView = ({ onBack, userName, userLevel = 1, userXP = 0 }: { onBack: () => void, userName: string | null, userLevel?: number, userXP?: number }) => {
  const [levelData, setLevelData] = useState<any>(null);
  const [nextLevelData, setNextLevelData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLevels = async () => {
      const { data: currentLevel } = await supabase
        .from("gamification_levels")
        .select("*")
        .eq("level_number", userLevel)
        .single();
        
      const { data: nextLvl } = await supabase
        .from("gamification_levels")
        .select("xp_required")
        .eq("level_number", userLevel + 1)
        .single();

      if (currentLevel) setLevelData(currentLevel);
      if (nextLvl) setNextLevelData(nextLvl);
      
      setIsLoading(false);
    };
    fetchLevels();
  }, [userLevel]);

  const nextLevelXP = nextLevelData?.xp_required || userLevel * 1000;
  const progress = Math.min((userXP / nextLevelXP) * 100, 100);

  return (
    <div className="flex flex-col min-h-screen h-full bg-black text-white pb-20 overflow-y-auto">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between sticky top-0 z-50 bg-black/90 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full active:scale-90 transition-all">
          <span className="material-symbols-rounded text-white">arrow_back</span>
        </button>
        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Assinatura</p>
          <h1 className="text-xl font-black text-white tracking-tighter">Clube Izi Black</h1>
        </div>
        <div className="size-10 flex items-center justify-center">
          <span className="material-symbols-rounded text-yellow-500 text-xl">workspace_premium</span>
        </div>
      </header>

      <main className="px-6 py-6 space-y-10">
        {/* Status Card Minimalista */}
        <div className="rounded-[32px] p-8 relative overflow-hidden border border-zinc-800 bg-zinc-900/50">
           <div className="absolute -right-6 -top-6 text-white/5">
              <span className="material-symbols-rounded text-[180px]">{levelData?.icon || 'workspace_premium'}</span>
           </div>
           
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="h-1 w-6 bg-yellow-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Nível {userLevel}</span>
              </div>
              
              <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-1">
                {levelData?.title || 'Membro Black'}
              </h2>
              <p className="text-sm font-bold text-zinc-500">{userName || 'Cliente VIP'}</p>
              
              <div className="mt-10 space-y-3">
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Progresso</p>
                      <span className="text-lg font-black text-white">{userXP} <span className="text-zinc-600 text-xs font-bold">XP</span></span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Faltam</p>
                      <span className="text-lg font-black text-zinc-300">{Math.max(0, nextLevelXP - userXP)} <span className="text-zinc-600 text-xs font-bold">XP</span></span>
                    </div>
                 </div>
                 <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${progress}%` }} 
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="absolute top-0 left-0 h-full bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Benefícios Minimalistas */}
        <section className="space-y-6">
           <div>
             <h3 className="text-lg font-black text-white tracking-tight">Benefícios Black</h3>
             <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Vantagens exclusivas da sua assinatura</p>
           </div>
           
           <div className="space-y-6">
             {isLoading ? (
               <div className="flex justify-center py-4"><div className="size-6 border-2 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" /></div>
             ) : levelData?.rewards && Array.isArray(levelData.rewards) ? (
               levelData.rewards.map((reward: any, idx: number) => (
                 <div key={idx} className="flex items-start gap-4 border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                       <span className="material-symbols-rounded text-yellow-500 text-[18px]">{reward.icon || 'star'}</span>
                    </div>
                    <div className="flex-1 pt-1">
                       <h4 className="font-black text-white text-[15px] leading-tight tracking-tight">{reward.title}</h4>
                       <p className="text-xs text-zinc-500 font-bold leading-relaxed mt-1">{reward.description}</p>
                    </div>
                 </div>
               ))
             ) : (
               <>
                 <div className="flex items-start gap-4 border-b border-zinc-800 pb-6">
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                       <span className="material-symbols-rounded text-yellow-500 text-[18px]">local_shipping</span>
                    </div>
                    <div className="flex-1 pt-1">
                       <h4 className="font-black text-white text-[15px] leading-tight tracking-tight">Frete Grátis Black</h4>
                       <p className="text-xs text-zinc-500 font-bold leading-relaxed mt-1">Entregas gratuitas ilimitadas em todos os restaurantes parceiros e mercados.</p>
                    </div>
                 </div>
                 <div className="flex items-start gap-4 border-b border-zinc-800 pb-6 last:border-0 last:pb-0">
                    <div className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                       <span className="material-symbols-rounded text-emerald-400 text-[18px]">payments</span>
                    </div>
                    <div className="flex-1 pt-1">
                       <h4 className="font-black text-white text-[15px] leading-tight tracking-tight">Cashback em Dobro</h4>
                       <p className="text-xs text-zinc-500 font-bold leading-relaxed mt-1">Acumule 2% de cashback em todas as compras pagando com saldo Izi Pay.</p>
                    </div>
                 </div>
               </>
             )}
           </div>
        </section>

        {/* Como ganhar XP Minimalista */}
        <section className="space-y-6 pt-4 border-t border-zinc-900">
           <div>
             <h3 className="text-lg font-black text-white tracking-tight">Evolução no Clube</h3>
             <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Como subir de nível</p>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="p-5 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center">
                 <span className="material-symbols-rounded text-2xl text-zinc-600 mb-3">shopping_bag</span>
                 <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Pedidos</p>
                 <span className="text-sm font-black text-yellow-500">+10 XP</span>
              </div>
              <div className="p-5 border border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-center">
                 <span className="material-symbols-rounded text-2xl text-zinc-600 mb-3">reviews</span>
                 <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Avaliações</p>
                 <span className="text-sm font-black text-yellow-500">+5 XP</span>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
};
