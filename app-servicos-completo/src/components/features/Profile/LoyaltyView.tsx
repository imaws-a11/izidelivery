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
    <div className="flex flex-col min-h-screen h-full bg-zinc-900 text-white pb-20 overflow-y-auto">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors">
          <span className="material-symbols-rounded text-white">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-white">Fidelidade</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-6 space-y-8">
        {/* Status Card */}
        <div className={`rounded-[40px] p-8 relative overflow-hidden shadow-2xl ${levelData?.color ? '' : 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-yellow-400/20'}`} style={levelData?.color ? { background: `linear-gradient(to bottom right, ${levelData.color}, #a16207)` } : {}}>
           <div className="absolute -right-10 -top-10 text-white/20">
              <span className="material-symbols-rounded text-[200px]">{levelData?.icon || 'military_tech'}</span>
           </div>
           
           <div className="relative z-10">
              <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white">Nível {userLevel}</span>
              <h2 className="text-4xl font-black text-white mt-4 leading-tight">{levelData?.title || 'Explorador'}<br/>Izi</h2>
              
              <div className="mt-8 space-y-2">
                 <div className="flex justify-between text-white text-xs font-bold">
                    <span>{userXP} XP</span>
                    <span>Faltam {Math.max(0, nextLevelXP - userXP)} XP</span>
                 </div>
                 <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${progress}%` }} 
                      className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Benefícios */}
        <section className="space-y-4">
           <h3 className="text-lg font-black tracking-tight">Seus Benefícios</h3>
           {isLoading ? (
             <div className="flex justify-center py-4"><div className="size-6 border-2 border-zinc-700 border-t-yellow-400 rounded-full animate-spin" /></div>
           ) : levelData?.rewards && Array.isArray(levelData.rewards) ? (
             levelData.rewards.map((reward: any, idx: number) => (
               <div key={idx} className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700/50 flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                     <span className="material-symbols-rounded text-yellow-400">{reward.icon || 'star'}</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-white leading-tight">{reward.title}</h4>
                     <p className="text-xs text-zinc-400 mt-1">{reward.description}</p>
                  </div>
               </div>
             ))
           ) : (
             <>
               <div className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700/50 flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                     <span className="material-symbols-rounded text-yellow-400">local_shipping</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-white">Frete Grátis</h4>
                     <p className="text-xs text-zinc-400 mt-1">Em restaurantes parceiros às terças.</p>
                  </div>
               </div>
               <div className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700/50 flex items-center gap-4">
                  <div className="size-12 rounded-xl bg-zinc-700 flex items-center justify-center shrink-0">
                     <span className="material-symbols-rounded text-emerald-400">payments</span>
                  </div>
                  <div>
                     <h4 className="font-bold text-white">Cashback em Dobro</h4>
                     <p className="text-xs text-zinc-400 mt-1">2% de cashback pagando com Izi Pay.</p>
                  </div>
               </div>
             </>
           )}
        </section>

        {/* Como ganhar XP */}
        <section className="space-y-4">
           <h3 className="text-lg font-black tracking-tight">Como ganhar XP?</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 p-5 rounded-3xl border border-zinc-700/50 text-center flex flex-col items-center justify-center">
                 <span className="material-symbols-rounded text-3xl text-zinc-400 mb-2">shopping_bag</span>
                 <p className="text-xs font-bold text-zinc-300">Faça pedidos<br/><span className="text-yellow-400">+10 XP</span></p>
              </div>
              <div className="bg-zinc-800 p-5 rounded-3xl border border-zinc-700/50 text-center flex flex-col items-center justify-center">
                 <span className="material-symbols-rounded text-3xl text-zinc-400 mb-2">reviews</span>
                 <p className="text-xs font-bold text-zinc-300">Avalie lojas<br/><span className="text-yellow-400">+5 XP</span></p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
};
