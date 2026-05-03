import React from "react";
import { motion } from "framer-motion";

export const LoyaltyView = ({ onBack, userName, userLevel = 1, userXP = 450 }: { onBack: () => void, userName: string | null, userLevel?: number, userXP?: number }) => {
  const nextLevelXP = userLevel * 1000;
  const progress = (userXP / nextLevelXP) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900 text-white pb-20">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors">
          <span className="material-symbols-rounded text-white">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-white">Fidelidade</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-6 space-y-8">
        {/* Status Card */}
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[40px] p-8 relative overflow-hidden shadow-2xl shadow-yellow-400/20">
           <div className="absolute -right-10 -top-10 text-white/20">
              <span className="material-symbols-rounded text-[200px]">military_tech</span>
           </div>
           
           <div className="relative z-10">
              <span className="px-3 py-1 bg-black/20 rounded-full text-[10px] font-black uppercase tracking-widest text-black">Nível {userLevel}</span>
              <h2 className="text-4xl font-black text-black mt-4 leading-tight">Explorador<br/>Izi</h2>
              
              <div className="mt-8 space-y-2">
                 <div className="flex justify-between text-black text-xs font-bold">
                    <span>{userXP} XP</span>
                    <span>Faltam {nextLevelXP - userXP} XP</span>
                 </div>
                 <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${progress}%` }} 
                      className="h-full bg-black rounded-full"
                    />
                 </div>
              </div>
           </div>
        </div>

        {/* Benefícios */}
        <section className="space-y-4">
           <h3 className="text-lg font-black tracking-tight">Seus Benefícios</h3>
           <div className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700/50 flex items-center gap-4">
              <div className="size-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                 <span className="material-symbols-rounded text-yellow-400">local_shipping</span>
              </div>
              <div>
                 <h4 className="font-bold text-white">Frete Grátis</h4>
                 <p className="text-xs text-zinc-400 mt-1">Em restaurantes parceiros às terças.</p>
              </div>
           </div>
           <div className="bg-zinc-800 rounded-3xl p-6 border border-zinc-700/50 flex items-center gap-4">
              <div className="size-12 rounded-xl bg-zinc-700 flex items-center justify-center">
                 <span className="material-symbols-rounded text-emerald-400">payments</span>
              </div>
              <div>
                 <h4 className="font-bold text-white">Cashback em Dobro</h4>
                 <p className="text-xs text-zinc-400 mt-1">2% de cashback pagando com Izi Pay.</p>
              </div>
           </div>
        </section>

        {/* Como ganhar XP */}
        <section className="space-y-4">
           <h3 className="text-lg font-black tracking-tight">Como ganhar XP?</h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-800 p-5 rounded-3xl border border-zinc-700/50 text-center">
                 <span className="material-symbols-rounded text-3xl text-zinc-400 mb-2">shopping_bag</span>
                 <p className="text-xs font-bold text-zinc-300">Faça pedidos<br/>+10 XP</p>
              </div>
              <div className="bg-zinc-800 p-5 rounded-3xl border border-zinc-700/50 text-center">
                 <span className="material-symbols-rounded text-3xl text-zinc-400 mb-2">reviews</span>
                 <p className="text-xs font-bold text-zinc-300">Avalie lojas<br/>+5 XP</p>
              </div>
           </div>
        </section>
      </main>
    </div>
  );
};
