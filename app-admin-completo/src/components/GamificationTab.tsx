import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toast, toastSuccess, toastError } from '../lib/useToast';

interface Mission {
    id: string;
    title: string;
    description: string;
    target_type: 'user' | 'driver';
    action_type: string;
    goal_value: number;
    xp_reward: number;
    coin_reward: number;
    icon: string;
    is_active: boolean;
}

interface Level {
    id: string;
    target_type: 'user' | 'driver';
    level_number: number;
    xp_required: number;
    title: string;
    reward_multiplier: number;
    perks: string[];
}

export default function GamificationTab() {
    const [activeSubTab, setActiveSubTab] = useState<'missions' | 'levels' | 'stats'>('missions');
    const [missions, setMissions] = useState<Mission[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [currentMission, setCurrentMission] = useState<Partial<Mission> | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [missionsRes, levelsRes] = await Promise.all([
                supabase.from('gamification_missions').select('*').order('created_at', { ascending: false }),
                supabase.from('gamification_levels').select('*').order('level_number', { ascending: true })
            ]);

            if (missionsRes.data) setMissions(missionsRes.data);
            if (levelsRes.data) setLevels(levelsRes.data);
        } catch (error) {
            console.error('Error fetching gamification data:', error);
            toast.error('Erro ao carregar dados de gamificação');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveMission = async () => {
        if (!currentMission?.title || !currentMission?.target_type) {
            toast.error('Preencha os campos obrigatórios');
            return;
        }

        try {
            const { error } = await supabase
                .from('gamification_missions')
                .upsert(currentMission);

            if (error) throw error;
            toast.success('Missão salva com sucesso!');
            setShowMissionModal(false);
            fetchData();
        } catch (error) {
            toast.error('Erro ao salvar missão');
        }
    };

    const toggleMissionStatus = async (mission: Mission) => {
        try {
            const { error } = await supabase
                .from('gamification_missions')
                .update({ is_active: !mission.is_active })
                .eq('id', mission.id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            toast.error('Erro ao atualizar status');
        }
    };

    return (
        <div className="space-y-10 pb-20 font-display">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">
                        Central de <span className="text-primary italic font-black">Gamificação</span>
                    </h1>
                    <p className="text-slate-400 font-bold text-sm mt-1 uppercase tracking-widest">
                        Gerencie missões, níveis e recompensas de XP para usuários e entregadores
                    </p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1.5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {(['missions', 'levels', 'stats'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setActiveSubTab(t)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                activeSubTab === t 
                                ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' 
                                : 'text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            {t === 'missions' ? 'Missões' : t === 'levels' ? 'Níveis & XP' : 'Estatísticas'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="size-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-amber-500 font-black">star_rate</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missões Ativas</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                        {missions.filter(m => m.is_active).length}
                    </h2>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-emerald-500 font-black">military_tech</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Níveis Configurados</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                        {levels.length}
                    </h2>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary font-black">generating_tokens</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Total Distribuído</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                        128.5k
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeSubTab === 'missions' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Catálogo de Missões</h3>
                            <button 
                                onClick={() => { setCurrentMission({ is_active: true, xp_reward: 10, goal_value: 1, target_type: 'user' }); setShowMissionModal(true); }}
                                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">add</span>
                                Nova Missão
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {missions.map((mission) => (
                                <div key={mission.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`size-12 rounded-xl flex items-center justify-center ${mission.target_type === 'user' ? 'bg-blue-500/10 text-blue-500' : 'bg-primary/10 text-primary'}`}>
                                            <span className="material-symbols-outlined font-black">{mission.target_type === 'user' ? 'person' : 'delivery_dining'}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setCurrentMission(mission); setShowMissionModal(true); }} className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary transition-colors">
                                                <span className="material-symbols-outlined text-sm">edit</span>
                                            </button>
                                            <button onClick={() => toggleMissionStatus(mission)} className={`size-8 rounded-lg flex items-center justify-center transition-colors ${mission.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                                <span className="material-symbols-outlined text-sm">{mission.is_active ? 'check_circle' : 'cancel'}</span>
                                            </button>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight uppercase italic mb-2 line-clamp-1">{mission.title}</h4>
                                    <p className="text-xs font-bold text-slate-400 line-clamp-2 mb-6 h-8 leading-relaxed italic">{mission.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-slate-50 dark:border-slate-800">
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Recompensa</p>
                                            <p className="text-sm font-black text-primary italic">+{mission.xp_reward} XP</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white italic">{mission.goal_value}x {mission.action_type.split('_')[0]}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'levels' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-10"
                    >
                        {/* Users Levels */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <span className="material-symbols-outlined text-blue-500">person</span>
                                Progressão: Clientes
                            </h3>
                            <div className="space-y-4">
                                {levels.filter(l => l.target_type === 'user').map((level) => (
                                    <div key={level.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-blue-500/30 transition-all">
                                        <div className="size-16 rounded-2xl bg-blue-500/10 flex flex-col items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                            <span className="text-[10px] font-black uppercase leading-none">LVL</span>
                                            <span className="text-2xl font-black italic">{level.level_number}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{level.title}</h4>
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{level.xp_required} XP</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-500 w-full opacity-20" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Drivers Levels */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">delivery_dining</span>
                                Progressão: Entregadores
                            </h3>
                            <div className="space-y-4">
                                {levels.filter(l => l.target_type === 'driver').map((level) => (
                                    <div key={level.id} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary/30 transition-all">
                                        <div className="size-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-slate-900 transition-all">
                                            <span className="text-[10px] font-black uppercase leading-none">LVL</span>
                                            <span className="text-2xl font-black italic">{level.level_number}</span>
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic">{level.title}</h4>
                                                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{level.xp_required} XP</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary w-full opacity-20" />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mission Modal */}
            <AnimatePresence>
                {showMissionModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" onClick={() => setShowMissionModal(false)} />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl relative z-10 border border-white/10 p-10"
                        >
                            <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Configurar Missão</h2>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tipo de Alvo</label>
                                        <select 
                                            value={currentMission?.target_type}
                                            onChange={(e) => setCurrentMission({ ...currentMission, target_type: e.target.value as any })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        >
                                            <option value="user">Usuário (Cliente)</option>
                                            <option value="driver">Entregador (Piloto)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Evento Gatilho</label>
                                        <select 
                                            value={currentMission?.action_type}
                                            onChange={(e) => setCurrentMission({ ...currentMission, action_type: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        >
                                            <option value="order_completed">Pedido Concluído</option>
                                            <option value="daily_login">Acesso Diário</option>
                                            <option value="spent_amount">Valor Gasto</option>
                                            <option value="dedicated_slot">Vaga Dedicada</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Título da Missão</label>
                                    <input 
                                        value={currentMission?.title || ''}
                                        onChange={(e) => setCurrentMission({ ...currentMission, title: e.target.value })}
                                        placeholder="Ex: Explorador de Sabores"
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Descrição curta</label>
                                    <textarea 
                                        value={currentMission?.description || ''}
                                        onChange={(e) => setCurrentMission({ ...currentMission, description: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic h-24 resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Meta (Qtd)</label>
                                        <input 
                                            type="number"
                                            value={currentMission?.goal_value || ''}
                                            onChange={(e) => setCurrentMission({ ...currentMission, goal_value: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">XP Reward</label>
                                        <input 
                                            type="number"
                                            value={currentMission?.xp_reward || ''}
                                            onChange={(e) => setCurrentMission({ ...currentMission, xp_reward: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Coins Reward</label>
                                        <input 
                                            type="number"
                                            value={currentMission?.coin_reward || ''}
                                            onChange={(e) => setCurrentMission({ ...currentMission, coin_reward: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleSaveMission}
                                    className="w-full bg-primary hover:bg-primary/90 text-slate-900 font-black py-5 rounded-3xl shadow-xl shadow-primary/20 uppercase tracking-widest text-xs transition-all mt-6"
                                >
                                    Confirmar e Ativar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
