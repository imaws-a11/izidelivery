import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

export const QuestCenterView = () => {
  const { setSubView, userXP, userLevel } = useApp();
  
  const nextLevelXP = (userLevel * 1000) || 1000;

  const quests = [
    { id: 1, title: "Explorador Urbano", desc: "Faça 3 pedidos em categorias diferentes", xp: 150, progress: 33, icon: "explore", color: "text-blue-400", bg: "bg-blue-400/10" },
    { id: 2, title: "Cliente Fiel",      desc: "Peça do mesmo restaurante 3 vezes",        xp: 100, progress: 66, icon: "favorite", color: "text-rose-400", bg: "bg-rose-400/10" },
    { id: 3, title: "Madrugador",        desc: "Faça um pedido antes das 9h",              xp: 80,  progress: 0,  icon: "wb_sunny", color: "text-amber-400", bg: "bg-amber-400/10" },
    { id: 4, title: "Gourmet",           desc: "Experimente 5 restaurantes diferentes",    xp: 200, progress: 20, icon: "restaurant", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  const ranking = [
    { rank: 1, name: "Izi Master", xp: 12450, medal: "text-yellow-400", avatar: "IM" },
    { rank: 2, name: "Pedro Silva", xp: 8900,  medal: "text-zinc-300", avatar: "PS" },
    { rank: 3, name: "Ana Souza",  xp: 7200,  medal: "text-orange-500", avatar: "AS" },
    { rank: 15, name: "Você",       xp: userXP, isMe: true, avatar: "VC" },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubView("none")} 
            className="size-12 rounded-[20px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl active:scale-95"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase leading-none">Quests & Ranking</h1>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2">Nível {userLevel} • {userXP} XP Acumulado</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-10 space-y-12">

        {/* XP PROGRESS CARD */}
        <section className="bg-zinc-900/40 p-8 rounded-[45px] border border-white/5 shadow-[20px_20px_40px_rgba(0,0,0,0.6),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[60px] rounded-full" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.4em]">Infinity Tier</p>
              <div className="flex items-baseline gap-2">
                 <h3 className="text-4xl font-black text-white tracking-tighter">Nível {userLevel}</h3>
                 <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                 </div>
              </div>
            </div>
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="size-16 rounded-[28px] bg-yellow-400 flex items-center justify-center shadow-[10px_10px_25px_rgba(250,204,21,0.2),inset_4px_4px_10px_rgba(255,255,255,0.6),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] border-2 border-yellow-300/30"
            >
              <span className="material-symbols-outlined text-3xl text-black/80 font-black" style={{ fontVariationSettings: "'FILL' 1" }}>diamond</span>
            </motion.div>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">XP Progress</span>
              <span className="text-sm font-black text-white tabular-nums">{userXP} <span className="text-zinc-600 text-[10px] font-bold">/ {nextLevelXP}</span></span>
            </div>
            <div className="h-4 w-full bg-black/60 rounded-full p-1.5 shadow-inner border border-white/5 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${Math.min((userXP/nextLevelXP)*100,100)}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-[length:200%_auto] animate-gradient-x rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)]" 
              />
            </div>
          </div>
        </section>

        {/* ACTIVE QUESTS */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="font-black text-xl text-white tracking-tighter uppercase">Missões Ativas</h2>
             <div className="size-8 rounded-xl bg-zinc-900 border border-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-zinc-500 text-lg">bolt</span>
             </div>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            {quests.map((q, i) => (
              <motion.div 
                key={q.id || `quest-${i}`} 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: i * 0.1 }}
                className="bg-zinc-900/40 p-6 rounded-[35px] border border-white/5 shadow-[12px_12px_24px_rgba(0,0,0,0.3),-4px_-4px_12px_rgba(255,255,255,0.01),inset_3px_3px_6px_rgba(255,255,255,0.02),inset_-3px_-3px_6px_rgba(0,0,0,0.3)] flex items-center gap-5 group"
              >
                <div className={`size-14 rounded-[22px] ${q.bg} flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform shrink-0`}>
                  <span className={`material-symbols-outlined ${q.color} text-2xl`}>{q.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-black text-sm text-white tracking-tight leading-tight">{q.title}</p>
                    <div className="px-2 py-0.5 rounded-lg bg-yellow-400/10">
                       <span className="text-yellow-400 text-[9px] font-black">+{q.xp} XP</span>
                    </div>
                  </div>
                  <p className="text-zinc-500 text-[10px] leading-tight mb-3 opacity-70">{q.desc}</p>
                  <div className="h-1.5 w-full bg-black shadow-inner rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${q.progress}%` }}
                      className={`h-full bg-gradient-to-r ${q.progress === 100 ? 'from-emerald-400 to-green-500' : 'from-yellow-500 to-orange-500'}`} 
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* RANKING GLOBAL */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
             <h2 className="font-black text-xl text-white tracking-tighter uppercase">Ranking Semanal</h2>
             <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Cidade: São Paulo</span>
          </div>

          <div className="bg-zinc-900/30 rounded-[45px] border border-white/5 p-4 shadow-inner space-y-2">
             {ranking.map((row, i) => (
               <motion.div 
                 key={row.name || i}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.5 + (i * 0.1) }}
                 className={`flex items-center gap-4 p-4 rounded-[30px] border transition-all ${row.isMe ? 'bg-yellow-400 border-yellow-300 shadow-[8px_8px_16px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5)]' : 'bg-transparent border-transparent'}`}
               >
                  <div className={`size-10 rounded-2xl flex items-center justify-center font-black text-xs ${row.isMe ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-500 shadow-inner'}`}>
                     {row.rank}
                  </div>
                  <div className={`size-12 rounded-full flex items-center justify-center font-black text-sm border ${row.isMe ? 'bg-black/20 border-black/10 text-black' : 'bg-zinc-900 border-white/5 text-zinc-300'}`}>
                     {row.avatar}
                  </div>
                  <div className="flex-1">
                     <p className={`font-black text-sm ${row.isMe ? 'text-black' : 'text-white'}`}>{row.name}</p>
                     <p className={`text-[9px] font-bold ${row.isMe ? 'text-black/60' : 'text-zinc-600'}`}>{row.xp.toLocaleString()} XP TOTAL</p>
                  </div>
                  {i < 3 && !row.isMe && (
                     <span className={`material-symbols-outlined text-2xl ${row.medal}`} style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
                  )}
               </motion.div>
             ))}
          </div>
        </section>

      </main>
    </div>
  );
};
