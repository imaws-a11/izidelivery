import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";

interface UserMissionsViewProps {
  userId: string | null;
  onBack: () => void;
}

export const UserMissionsView: React.FC<UserMissionsViewProps> = ({ userId, onBack }) => {
  const [missions, setMissions] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showComplete, setShowComplete] = useState<string | null>(null);

  const fetchMissions = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const [missionsRes, progressRes] = await Promise.all([
        supabase
          .from("gamification_missions")
          .select("*")
          .eq("audience", "user")
          .eq("is_active", true)
          .order("reward_xp", { ascending: false }),
        supabase
          .from("gamification_progress")
          .select("*")
          .eq("user_id", userId),
      ]);
      setMissions(missionsRes.data || []);
      setProgress(progressRes.data || []);
    } catch (e) {
      console.error("Erro ao buscar missões:", e);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  // Calcular totais
  const totalXP = progress
    .filter((p) => p.is_completed)
    .reduce((sum, p) => {
      const m = missions.find((m) => m.id === p.mission_id);
      return sum + (m?.reward_xp || 0);
    }, 0);
  const completedCount = progress.filter((p) => p.is_completed).length;

  return (
    <div className="fixed inset-0 z-[200] bg-[#F7F7F7] flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white px-6 pt-14 pb-5 flex items-center gap-4 border-b border-zinc-100 sticky top-0 z-50">
        <button
          onClick={onBack}
          className="size-10 rounded-full bg-zinc-100 flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-zinc-700 text-xl">arrow_back</span>
        </button>
        <div>
          <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] leading-none">Desafios</p>
          <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-tight">Suas Missões</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Hero Banner */}
        <div className="px-4 pt-4">
          <div
            className="rounded-[28px] p-7 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #facc15 0%, #f59e0b 100%)",
              boxShadow: "0 16px 40px rgba(250,204,21,0.25)",
            }}
          >
            {/* Decoração */}
            <div className="absolute -right-6 -bottom-6 opacity-10">
              <span className="material-symbols-outlined text-zinc-900" style={{ fontSize: 140 }}>emoji_events</span>
            </div>
            <div className="relative z-10">
              <p className="text-[10px] font-black text-zinc-900/60 uppercase tracking-[0.3em] mb-1">Programa de Recompensas</p>
              <h2 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none mb-4">
                Complete<br />e ganhe!
              </h2>
              {/* Stats */}
              <div className="flex gap-4">
                <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1 text-center border border-white/20">
                  <p className="text-[9px] font-black text-zinc-900/60 uppercase tracking-widest">Concluídas</p>
                  <p className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{completedCount}</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1 text-center border border-white/20">
                  <p className="text-[9px] font-black text-zinc-900/60 uppercase tracking-widest">XP Total</p>
                  <p className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{totalXP}</p>
                </div>
                <div className="bg-white/30 backdrop-blur-sm rounded-2xl px-4 py-3 flex-1 text-center border border-white/20">
                  <p className="text-[9px] font-black text-zinc-900/60 uppercase tracking-widest">Ativas</p>
                  <p className="text-2xl font-black text-zinc-900 leading-none mt-0.5">{missions.length}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Missões */}
        <div className="px-4 py-4 space-y-3 pb-32">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-1 mb-2">Missões disponíveis</p>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-[24px] p-6 animate-pulse border border-zinc-100">
                  <div className="h-12 bg-zinc-100 rounded-2xl mb-4" />
                  <div className="h-3 bg-zinc-100 rounded-full mb-2 w-3/4" />
                  <div className="h-3 bg-zinc-50 rounded-full w-1/2" />
                </div>
              ))}
            </div>
          ) : missions.length === 0 ? (
            <div className="bg-white rounded-[24px] p-10 text-center border border-zinc-100 border-dashed">
              <span className="material-symbols-outlined text-zinc-300 text-5xl mb-3 block">sentiment_dissatisfied</span>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest">
                Nenhuma missão ativa<br />no momento
              </p>
            </div>
          ) : (
            missions.map((mission, idx) => {
              const p = progress.find((p) => p.mission_id === mission.id);
              const current = p?.current_value || 0;
              const target = mission.target_value || 1;
              const pct = Math.min((current / target) * 100, 100);
              const isDone = p?.is_completed || false;

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className={`bg-white rounded-[24px] p-6 border relative overflow-hidden ${
                    isDone ? "border-emerald-100 bg-emerald-50/20" : "border-zinc-100"
                  }`}
                >
                  {/* Badge Concluída */}
                  {isDone && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 bg-emerald-500 text-white px-3 py-1.5 rounded-xl shadow-sm">
                      <span className="material-symbols-outlined text-[12px]">check</span>
                      <span className="text-[9px] font-black uppercase tracking-wider">Concluída</span>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-5">
                    {/* Ícone */}
                    <div
                      className={`size-14 rounded-[18px] flex items-center justify-center shrink-0 ${
                        isDone
                          ? "bg-emerald-100 border border-emerald-200"
                          : "bg-yellow-50 border border-yellow-100"
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-2xl ${
                          isDone ? "text-emerald-600" : "text-yellow-600"
                        }`}
                      >
                        {mission.icon || "emoji_events"}
                      </span>
                    </div>
                    {/* Título */}
                    <div className="flex-1 min-w-0 pr-16">
                      <h3 className="font-black text-zinc-900 text-base leading-tight uppercase tracking-tight">
                        {mission.title}
                      </h3>
                      {mission.description && (
                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-1">
                          {mission.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Recompensas */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {mission.reward_xp > 0 && (
                      <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-xl">
                        <span className="material-symbols-outlined text-blue-600 text-[13px]">stars</span>
                        <span className="text-blue-600 font-black text-[11px]">+{mission.reward_xp} XP</span>
                      </div>
                    )}
                    {mission.reward_coins > 0 && (
                      <div className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-100 px-3 py-1.5 rounded-xl">
                        <span className="material-symbols-outlined text-yellow-600 text-[13px]">paid</span>
                        <span className="text-yellow-600 font-black text-[11px]">+{mission.reward_coins} Coins</span>
                      </div>
                    )}
                  </div>

                  {/* Barra de progresso */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Progresso</span>
                      <span className="text-[11px] font-black text-zinc-700">
                        {current}<span className="text-zinc-300 mx-0.5 font-medium">/</span>
                        <span className="text-zinc-400 text-[10px]">{target}</span>
                      </span>
                    </div>
                    <div className="h-3 bg-zinc-100 rounded-full overflow-hidden border border-zinc-100 p-[2px]">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: idx * 0.08 }}
                        className={`h-full rounded-full ${
                          isDone
                            ? "bg-emerald-500"
                            : "bg-gradient-to-r from-yellow-400 to-amber-500"
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* Overlay Missão Concluída */}
      <AnimatePresence>
        {showComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowComplete(null)}
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
          >
            <motion.div
              initial={{ scale: 0.7, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 22 }}
              className="mx-6 rounded-[40px] p-10 flex flex-col items-center text-center gap-4"
              style={{
                background: "linear-gradient(145deg, #facc15, #eab308)",
                boxShadow: "0 40px 80px rgba(250,204,21,0.4)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="size-20 rounded-[28px] bg-zinc-900 flex items-center justify-center shadow-xl">
                <span className="material-symbols-outlined text-yellow-400 text-5xl">emoji_events</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-zinc-900/50 uppercase tracking-[0.4em]">Parabéns!</p>
                <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase">
                  Missão<br />Cumprida!
                </h2>
              </div>
              <button
                onClick={() => setShowComplete(null)}
                className="mt-2 px-10 py-4 bg-zinc-900 text-yellow-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em]"
              >
                Incrível! 🔥
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
