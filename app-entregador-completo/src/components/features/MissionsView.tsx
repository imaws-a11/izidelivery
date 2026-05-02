import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { BespokeIcons } from '../../lib/BespokeIcons';

function Icon({ name, className = "", size = 20 }: any) {
    const icons: Record<string, any> = {
        'emoji_events': BespokeIcons.StarFilled,
        'payments': BespokeIcons.Wallet,
        'stars': BespokeIcons.StarFilled,
        'check': BespokeIcons.Check,
        'sync': BespokeIcons.History,
        'sentiment_dissatisfied': BespokeIcons.Help,
        'close': BespokeIcons.X,
        'celebration': BespokeIcons.StarFilled,
    };
    const IconComp = icons[name] || BespokeIcons.Help;
    return <IconComp size={size} className={className} />;
}

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
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
            onClick={onClose}
        >
            {/* Partículas de confete */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map(p => (
                    <ConfettiParticle key={p.id} delay={p.delay} x={p.x} color={p.color} />
                ))}
            </div>

            {/* Card central */}
            <motion.div
                initial={{ scale: 0.3, y: 60, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: 20, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
                className="relative mx-6 overflow-hidden"
                style={{
                    background: 'linear-gradient(145deg, #facc15, #eab308)',
                    borderRadius: '48px',
                    boxShadow: '0 40px 80px rgba(250,204,21,0.5), inset 8px 8px 24px rgba(255,255,255,0.5), inset -8px -8px 24px rgba(0,0,0,0.15)',
                    padding: '48px 40px',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Anel pulsante de fundo */}
                <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-[48px] bg-yellow-300"
                />

                <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                    {/* Ícone animado */}
                    <motion.div
                        animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.15, 1] }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="size-24 rounded-[32px] bg-zinc-950 flex items-center justify-center shadow-[0_15px_30px_rgba(0,0,0,0.25),inset_2px_2px_8px_rgba(255,255,255,0.1)]"
                    >
                        <Icon name="emoji_events" size={52} className="text-yellow-400" />
                    </motion.div>

                    <div className="space-y-3">
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-[10px] font-black text-zinc-900/50 uppercase tracking-[0.4em]"
                        >
                            Parabéns!
                        </motion.p>
                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="text-4xl font-black text-zinc-900 tracking-tighter leading-none uppercase"
                        >
                            Missão<br />Cumprida!
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-sm font-bold text-zinc-900/60 max-w-[200px] leading-relaxed"
                        >
                            Você completou um desafio e ganhou uma recompensa extra!
                        </motion.p>
                    </div>

                    {/* Badges de recompensa */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="flex items-center gap-3"
                    >
                        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2.5 rounded-2xl shadow-lg">
                            <Icon name="payments" size={16} className="text-yellow-400" />
                            <span className="text-yellow-400 font-black text-sm">Taxa Extra</span>
                        </div>
                        <div className="flex items-center gap-2 bg-zinc-950 px-4 py-2.5 rounded-2xl shadow-lg">
                            <Icon name="stars" size={16} className="text-blue-400" />
                            <span className="text-blue-400 font-black text-sm">+XP</span>
                        </div>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        onClick={onClose}
                        className="mt-2 px-10 py-4 bg-zinc-950 text-yellow-400 rounded-2xl font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl"
                    >
                        Incrível! 🔥
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    );
};

export const MissionsView = ({ driverId }: { driverId: string }) => {
    const [missions, setMissions] = useState<any[]>([]);
    const [missionsProgress, setMissionsProgress] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showMissionComplete, setShowMissionComplete] = useState(false);
    const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchMissions = useCallback(async () => {
        if (!driverId) return;
        setIsLoading(true);
        try {
            const { data: missionsData } = await supabase
                .from('gamification_missions')
                .select('*')
                .eq('audience', 'driver')
                .eq('is_active', true);
            setMissions(missionsData || []);

            const { data: progressData } = await supabase
                .from('gamification_progress')
                .select('*')
                .eq('driver_id', driverId);
            setMissionsProgress(progressData || []);
        } catch (err) {
            console.error("Erro ao buscar missões:", err);
        } finally {
            setIsLoading(false);
        }
    }, [driverId]);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    // Ouvir evento de missão concluída disparado pelo App.tsx
    useEffect(() => {
        const handleMissionCompleted = () => {
            setShowMissionComplete(true);
            // Atualizar progresso após a animação
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
            refreshTimeoutRef.current = setTimeout(() => fetchMissions(), 2000);
        };

        window.addEventListener('izi:mission_completed', handleMissionCompleted);
        return () => {
            window.removeEventListener('izi:mission_completed', handleMissionCompleted);
            if (refreshTimeoutRef.current) clearTimeout(refreshTimeoutRef.current);
        };
    }, [fetchMissions]);

    return (
        <>
            {/* Overlay de Missão Cumprida */}
            <AnimatePresence>
                {showMissionComplete && (
                    <MissionCompleteOverlay onClose={() => setShowMissionComplete(false)} />
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col bg-zinc-50 h-full overflow-hidden"
            >
                <header className="px-6 pt-12 pb-6 bg-white/80 backdrop-blur-xl border-b border-zinc-100 flex items-center justify-between sticky top-0 z-50">
                    <div className="flex flex-col">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.3em] mb-1">Gamificação</p>
                        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Suas Missões</h2>
                    </div>
                    <button
                        onClick={() => fetchMissions()}
                        className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 active:scale-95 transition-all shadow-sm"
                    >
                        <Icon name="sync" className={isLoading ? 'animate-spin text-yellow-500' : 'text-zinc-400'} />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8 pb-40">
                    {/* Banner Hero Claymorphic */}
                    <div
                        className="rounded-[40px] p-8 relative overflow-hidden shadow-xl"
                        style={{
                            background: 'linear-gradient(145deg, #facc15, #eab308)',
                            boxShadow: '0 20px 45px rgba(250,204,21,0.25), inset 8px 8px 16px rgba(255,255,255,0.5), inset -8px -8px 16px rgba(0,0,0,0.15)',
                        }}
                    >
                        <div className="absolute -right-8 -bottom-8 opacity-10 rotate-12">
                            <Icon name="emoji_events" size={180} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="size-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                                <Icon name="stars" className="text-zinc-900" size={32} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-zinc-900 tracking-tighter">Bônus e Recompensas</h3>
                                <p className="text-[11px] text-zinc-900/60 font-bold leading-relaxed max-w-[220px] mt-2 uppercase tracking-wide">
                                    Complete os desafios para ganhar taxas extras e pontos de experiência.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lista de missões */}
                    <div className="space-y-6">
                        <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] px-2">Missões Disponíveis</h3>

                        {isLoading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="bg-white rounded-[40px] p-8 border border-zinc-100 animate-pulse">
                                        <div className="h-16 bg-zinc-100 rounded-2xl mb-6" />
                                        <div className="h-4 bg-zinc-100 rounded-full mb-3" />
                                        <div className="h-4 bg-zinc-50 rounded-full w-2/3" />
                                    </div>
                                ))}
                            </div>
                        ) : missions.length === 0 ? (
                            <div className="p-12 text-center space-y-4 bg-white rounded-[40px] border border-zinc-100 shadow-sm">
                                <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center mx-auto border border-zinc-50 shadow-inner">
                                    <Icon name="sentiment_dissatisfied" size={40} className="text-zinc-300" />
                                </div>
                                <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest leading-relaxed">
                                    Nenhuma missão ativa para o seu perfil no momento.<br />Volte em breve!
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
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
                                            className={`bg-white rounded-[40px] p-8 border shadow-sm relative overflow-hidden group active:scale-[0.98] transition-all ${
                                                isCompleted ? 'border-emerald-100 bg-emerald-50/30' : 'border-zinc-100'
                                            }`}
                                        >
                                            {/* Badge "Concluída" */}
                                            {isCompleted && (
                                                <div className="absolute top-6 right-6 flex items-center gap-1.5 bg-emerald-500 px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-500/20">
                                                    <Icon name="check" size={12} className="text-white" />
                                                    <span className="text-white text-[9px] font-black uppercase tracking-widest">Concluída</span>
                                                </div>
                                            )}

                                            <div className="flex gap-5 items-center mb-6">
                                                <motion.div
                                                    animate={isCompleted ? { scale: [1, 1.1, 1] } : {}}
                                                    transition={{ duration: 0.5 }}
                                                    className={`size-16 rounded-[24px] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500 ${
                                                        isCompleted
                                                            ? 'bg-emerald-100 border border-emerald-200'
                                                            : 'bg-zinc-50 border border-zinc-100'
                                                    }`}
                                                >
                                                    <Icon
                                                        name={mission.icon || 'emoji_events'}
                                                        size={32}
                                                        className={isCompleted ? 'text-emerald-600' : 'text-yellow-600'}
                                                    />
                                                </motion.div>
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <h4 className="text-lg font-black text-zinc-900 tracking-tight leading-none uppercase">{mission.title}</h4>
                                                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">{mission.description}</p>
                                                </div>
                                            </div>

                                            {/* Recompensas */}
                                            <div className="flex items-center gap-2 mb-5">
                                                <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Recompensa:</span>
                                                {mission.reward_extra_fee > 0 && (
                                                    <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                                                        <Icon name="payments" size={13} className="text-emerald-600" />
                                                        <span className="text-emerald-600 font-black text-[11px]">+R$ {Number(mission.reward_extra_fee).toFixed(2)}</span>
                                                    </div>
                                                )}
                                                {mission.reward_xp > 0 && (
                                                    <div className="flex items-center gap-1.5 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                                                        <Icon name="stars" size={13} className="text-blue-600" />
                                                        <span className="text-blue-600 font-black text-[11px]">+{mission.reward_xp} XP</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Barra de progresso */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center px-1">
                                                    <span className="text-[9px] font-black text-zinc-300 uppercase tracking-widest">Progresso</span>
                                                    <span className="text-xs font-black text-zinc-900">
                                                        {current}
                                                        <span className="text-zinc-300 font-bold mx-0.5">/</span>
                                                        <span className="text-zinc-400 text-[10px]">{target}</span>
                                                    </span>
                                                </div>
                                                <div className="h-4 bg-zinc-50 rounded-full border border-zinc-100 p-[3px] shadow-inner overflow-hidden relative">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        transition={{ duration: 1.2, ease: 'easeOut', delay: index * 0.1 }}
                                                        className={`h-full rounded-full ${
                                                            isCompleted
                                                                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                                                                : 'bg-gradient-to-r from-yellow-400 to-amber-500 shadow-[0_0_8px_rgba(250,204,21,0.4)]'
                                                        }`}
                                                    />
                                                    {percent > 20 && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                            <span className="text-[8px] font-black text-white/70 uppercase tracking-widest drop-shadow">
                                                                {Math.round(percent)}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>
            </motion.div>
        </>
    );
};
