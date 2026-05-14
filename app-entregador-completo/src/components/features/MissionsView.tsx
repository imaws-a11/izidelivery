import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import Icon from '../common/Icon';

// Componente de partícula de confete
const ConfettiParticle = ({ delay, x, color }: { delay: number; x: number; color: string }) => (
 <motion.div
 initial={{ y: -20, x, opacity: 1, scale: 1, rotate: 0 }}
 animate={{ y: 400, opacity: 0, scale: 0.3, rotate: 720 }}
 transition={{ duration: 1.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
 className="absolute top-0 w-3 h-3 rounded-sm"
 style={{ left: `${x}%`, backgroundColor: color }}
 />
);

// Overlay de "Missão Cumprida!"
const MissionCompleteOverlay = ({ onClose }: { onClose: () => void }) => {
 const colors = ['#facc15', '#22c55e', '#3b82f6', '#f97316', '#ec4899', '#a855f7'];
 const particles = Array.from({ length: 18 }, (_, i) => ({
 id: i,
 delay: i * 0.07,
 x: (i / 18) * 90 + 5,
 color: colors[i % colors.length]
 }));

 useEffect(() => {
 const timer = setTimeout(onClose, 4000);
 return () => clearTimeout(timer);
 }, [onClose]);

 return (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[9999] flex items-center justify-center font-['Plus_Jakarta_Sans']"
 style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
 onClick={onClose}
 >
 {/* Partículas de confete */}
 <div className="absolute inset-0 overflow-hidden pointer-events-none">
 {particles.map(p => (
 <ConfettiParticle key={p.id} delay={p.delay} x={p.x} color={p.color} />
 ))}
 </div>

 {/* Card central Minimalist Premium */}
 <motion.div
 initial={{ scale: 0.3, y: 60, opacity: 0 }}
 animate={{ scale: 1, y: 0, opacity: 1 }}
 exit={{ scale: 0.8, y: 20, opacity: 0 }}
 transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 0.1 }}
 className="relative mx-6 bg-white rounded-xl overflow-hidden p-10 flex flex-col items-center gap-6 text-center "
 onClick={e => e.stopPropagation()}
 >
 <div className="size-24 rounded-3xl bg-yellow-400 flex items-center justify-center shadow-yellow-400/20">
 <Icon name="emoji_events" size={52} className="text-zinc-900" />
 </div>

 <div className="space-y-3">
 <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.4em]">Parabéns!</p>
 <h2 className="text-4xl font-black text-zinc-900 tracking-tighter leading-none uppercase">Missão<br />Cumprida!</h2>
 <p className="text-sm font-bold text-zinc-400 max-w-[220px] leading-relaxed">Você completou um desafio e ganhou uma recompensa extra!</p>
 </div>

 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-100">
 <Icon name="payments" size={16} className="text-emerald-600" />
 <span className="text-emerald-600 font-black text-sm">Taxa Extra</span>
 </div>
 <div className="flex items-center gap-2 bg-blue-50 px-4 py-2.5 rounded-2xl border border-blue-100">
 <Icon name="stars" size={16} className="text-blue-600" />
 <span className="text-blue-600 font-black text-sm">+XP</span>
 </div>
 </div>

 <button
 onClick={onClose}
 className="mt-2 w-full py-4 bg-zinc-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all "
 >
 Continuar 🔥
 </button>
 </motion.div>
 </motion.div>
 );
};

export const MissionsView = ({ driverId }: { driverId: string }) => {
 const [missions, setMissions] = useState<any[]>([]);
 const [missionsProgress, setMissionsProgress] = useState<any[]>([]);
 const [isLoading, setIsLoading] = useState(true);
 const [showMissionComplete, setShowMissionComplete] = useState(false);
 const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
 const isFetchingRef = useRef(false);

 const fetchMissions = useCallback(async () => {
 if (isFetchingRef.current) return;
 isFetchingRef.current = true;
 
 setIsLoading(true);
 
 try {
 const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
 const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
 
 const response = await fetch(
 `${supabaseUrl}/rest/v1/gamification_missions?is_active=eq.true&select=*`,
 {
 headers: {
 'apikey': supabaseKey,
 'Authorization': `Bearer ${supabaseKey}`
 }
 }
 );

 if (!response.ok) throw new Error(`HTTP ${response.status}`);

 const rawMissions = await response.json();
 const filtered = (rawMissions || []).filter((m: any) => 
 m.audience === 'driver' || m.audience === 'pilot' || m.audience === 'entregador'
 );
 
 setMissions(filtered);
 setIsLoading(false);

 if (driverId) {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 const token = session?.access_token || supabaseKey;

 const progressPromise = fetch(
 `${supabaseUrl}/rest/v1/gamification_progress?driver_id=eq.${driverId}&select=*`,
 {
 headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` }
 }
 );

 const timeoutPromise = new Promise((_, reject) => 
 setTimeout(() => reject(new Error('timeout')), 3000)
 );

 const pResponse = await Promise.race([progressPromise, timeoutPromise]) as any;

 if (pResponse.ok) {
 const progressData = await pResponse.json();
 setMissionsProgress(progressData || []);
 }
 } catch (pErr) {
 // Ignora erros de progresso para não travar a UI
 }
 }
 } catch (err: any) {
 console.error('[BONUS] Erro:', err);
 } finally {
 setIsLoading(false);
 isFetchingRef.current = false;
 }
 }, [driverId]);

 useEffect(() => {
 fetchMissions();
 }, [fetchMissions]);

 useEffect(() => {
 const handleMissionCompleted = () => {
 setShowMissionComplete(true);
 if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
 refreshTimeoutRef.current = setTimeout(() => fetchMissions(), 2000);
 };

 window.addEventListener('izi:mission_completed', handleMissionCompleted);
 
 // Listener de auth para refetch caso o token seja renovado ou a sessão restaurada
 const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
 if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
 fetchMissions();
 }
 });

 return () => {
 window.removeEventListener('izi:mission_completed', handleMissionCompleted);
 if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
 if (subscription) subscription.unsubscribe();
 };
 }, [fetchMissions]);

 return (
 <div className="flex-1 flex flex-col bg-zinc-50 min-h-0 overflow-hidden font-['Plus_Jakarta_Sans']">
 <AnimatePresence>
 {showMissionComplete && (
 <MissionCompleteOverlay onClose={() => setShowMissionComplete(false)} />
 )}
 </AnimatePresence>

 <header className="px-6 pt-10 pb-6 bg-zinc-50 flex items-center justify-between sticky top-0 z-50">
 <div className="flex flex-col">
 <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.4em] mb-1">Missions Control</p>
 <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Desafios</h2>
 </div>
 <button
 onClick={() => fetchMissions()}
 className="size-12 rounded-2xl bg-white flex items-center justify-center border border-zinc-100 active:scale-95 transition-all "
 >
 <Icon name="sync" className={isLoading ? 'animate-spin text-yellow-500' : 'text-zinc-400'} />
 </button>
 </header>

 <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-40">
 {/* Hero Banner Minimalist Premium */}
 <div className="bg-yellow-400 rounded-xl p-8 relative overflow-hidden shadow-yellow-400/20">
 <div className="absolute -right-6 -bottom-6 opacity-20 rotate-12">
 <Icon name="emoji_events" size={160} />
 </div>
 <div className="relative z-10 space-y-4">
 <div className="size-14 rounded-2xl bg-zinc-900 flex items-center justify-center ">
 <Icon name="stars" className="text-yellow-400" size={32} />
 </div>
 <div>
 <h3 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Bônus Izi</h3>
 <p className="text-[11px] text-zinc-900/60 font-black leading-relaxed max-w-[220px] mt-2 uppercase tracking-widest">
 Complete os desafios abaixo e multiplique seus ganhos diários.
 </p>
 </div>
 </div>
 </div>

 {/* Lista de missões */}
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-2">Disponíveis hoje</h3>

 {isLoading ? (
 <div className="space-y-4">
 {[1, 2].map(i => (
 <div key={i} className="bg-white rounded-3xl p-8 border border-zinc-100 animate-pulse">
 <div className="h-16 bg-zinc-50 rounded-2xl mb-4" />
 <div className="h-4 bg-zinc-50 rounded-full w-2/3" />
 </div>
 ))}
 </div>
 ) : missions.length === 0 ? (
 <div className="p-12 text-center space-y-4 bg-white rounded-xl border border-zinc-100">
 <div className="size-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-6">
 <Icon name="stars" size={40} className="text-zinc-200" />
 </div>
 <h3 className="text-xl font-black text-zinc-900">Nenhum bônus ativo</h3>
 <p className="text-zinc-500 font-bold text-sm max-w-[240px] mx-auto leading-relaxed">
 No momento não há campanhas de bônus disponíveis para você.
 </p>
 </div>
 ) : (
 <div className="grid gap-4">
 {missions.map((mission, index) => {
 const progress = missionsProgress.find(p => p.mission_id === mission.id);
 const current = progress?.current_value || 0;
 const target = mission.target_value || 1;
 const percent = Math.min((current / target) * 100, 100);
 const isCompleted = progress?.is_completed || false;

 return (
 <motion.div
 key={mission.id}
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ delay: index * 0.08 }}
 className={`bg-white rounded-[2rem] p-6 border transition-all active:scale-[0.98] ${
 isCompleted ? 'border-emerald-500/20 bg-emerald-50/20' : 'border-zinc-100 '
 }`}
 >
 <div className="flex gap-4 items-center mb-6">
 <div className={`size-14 rounded-2xl flex items-center justify-center ${
 isCompleted ? 'bg-emerald-500 text-white' : 'bg-zinc-900 text-yellow-400'
 }`}>
 <Icon name={mission.icon || 'emoji_events'} size={28} />
 </div>
 <div className="flex-1 min-w-0">
 <h4 className="text-base font-black text-zinc-900 tracking-tight uppercase">{mission.title}</h4>
 <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-tight mt-0.5">{mission.description}</p>
 </div>
 {isCompleted && (
 <div className="size-8 rounded-full bg-emerald-500 flex items-center justify-center">
 <Icon name="check" size={16} className="text-white" />
 </div>
 )}
 </div>

 <div className="flex items-center gap-2 mb-6">
 {mission.reward_extra_fee && Number(mission.reward_extra_fee) > 0 && (
 <div className="bg-emerald-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
 <Icon name="payments" size={12} className="text-emerald-600" />
 <span className="text-emerald-600 font-black text-[9px] uppercase">+R$ {Number(mission.reward_extra_fee).toFixed(2)}</span>
 </div>
 )}
 {mission.reward_xp && Number(mission.reward_xp) > 0 && (
 <div className="bg-blue-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
 <Icon name="stars" size={12} className="text-blue-600" />
 <span className="text-blue-600 font-black text-[9px] uppercase">+{mission.reward_xp} XP</span>
 </div>
 )}
 </div>

 <div className="space-y-2">
 <div className="flex justify-between items-center px-1">
 <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Progresso</span>
 <span className="text-[11px] font-black text-zinc-900 uppercase">
 {current} <span className="text-zinc-300">/</span> {target}
 </span>
 </div>
 <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
 <motion.div
 initial={{ width: 0 }}
 animate={{ width: `${percent}%` }}
 transition={{ duration: 1, ease: 'easeOut' }}
 className={`h-full rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-yellow-400'}`}
 />
 </div>
 </div>
 </motion.div>
 );
 })}
 </div>
 )}
 </div>
 </main>
 </div>
 );
};
