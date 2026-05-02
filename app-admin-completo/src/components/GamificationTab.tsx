import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { toastSuccess, toastError } from '../lib/useToast';

interface Mission {
    id: string;
    title: string;
    description: string;
    type: string;
    target_action: string;
    target_value: number;
    reward_xp: number;
    reward_coins: number;
    icon: string;
    color: string;
    is_active: boolean;
}

interface Level {
    id: string;
    level_number: number;
    xp_required: number;
    name: string;
    title: string;
    icon: string;
    color: string;
    is_active: boolean;
}

interface Stats {
    missions_active: number;
    levels_active: number;
    total_xp: number;
    missions_completed: number;
    active_drivers: number;
}

export default function GamificationTab() {
    const [activeSubTab, setActiveSubTab] = useState<'missions' | 'levels' | 'stats'>('missions');
    const [missions, setMissions] = useState<Mission[]>([]);
    const [levels, setLevels] = useState<Level[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showMissionModal, setShowMissionModal] = useState(false);
    const [currentMission, setCurrentMission] = useState<Partial<Mission> | null>(null);
    const [stats, setStats] = useState<Stats>({ missions_active: 0, levels_active: 0, total_xp: 0, missions_completed: 0, active_drivers: 0 });

    const [editingLevelId, setEditingLevelId] = useState<string | null>(null);
    const [editedLevel, setEditedLevel] = useState<Partial<Level>>({});

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [missionsRes, levelsRes, progressRes] = await Promise.all([
                supabase.from('gamification_missions').select('*').order('created_at', { ascending: false }),
                supabase.from('gamification_levels').select('*').order('level_number', { ascending: true }),
                supabase.from('gamification_progress').select('*, gamification_missions(reward_xp)')
            ]);

            if (missionsRes.data) setMissions(missionsRes.data);
            if (levelsRes.data) setLevels(levelsRes.data);

            let xp = 0;
            let completed = 0;
            const drivers = new Set();
            
            if (progressRes.data) {
                progressRes.data.forEach((p: any) => {
                    if (p.is_completed) completed++;
                    if (p.driver_id) drivers.add(p.driver_id);
                    xp += (p.current_value || 0) * (p.gamification_missions?.reward_xp || 0);
                });
            }

            setStats({
                missions_active: missionsRes.data?.filter(m => m.is_active).length || 0,
                levels_active: levelsRes.data?.length || 0,
                total_xp: xp,
                missions_completed: completed,
                active_drivers: drivers.size
            });

        } catch (error) {
            console.error('Error fetching gamification data:', error);
            toastError('Erro ao carregar dados de gamificação');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSaveMission = async () => {
        if (!currentMission?.title || !(currentMission as any)?.target_type) {
            toastError('Preencha os campos obrigatórios');
            return;
        }

        try {
            const { error } = await supabase
                .from('gamification_missions')
                .upsert(currentMission);

            if (error) throw error;
            toastSuccess('Missão salva com sucesso!');
            setShowMissionModal(false);
            fetchData();
        } catch (error) {
            toastError('Erro ao salvar missão');
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
            toastError('Erro ao atualizar status');
        }
    };

    const handleEditLevelClick = (level: Level) => {
        if (editingLevelId === level.id) {
            // Se já está editando e clicou, vamos salvar
            handleSaveLevel(level.id);
        } else {
            setEditingLevelId(level.id);
            setEditedLevel(level);
        }
    };

    const handleSaveLevel = async (id: string) => {
        try {
            const { error } = await supabase
                .from('gamification_levels')
                .update(editedLevel)
                .eq('id', id);
            
            if (error) throw error;
            toastSuccess('Nível atualizado!');
            setEditingLevelId(null);
            fetchData();
        } catch (e) {
            toastError('Erro ao atualizar nível');
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
                        {stats.missions_active}
                    </h2>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-emerald-500 font-black">military_tech</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Níveis Configurados</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                        {stats.levels_active}
                    </h2>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary font-black">generating_tokens</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">XP Total Distribuído</p>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter">
                        {stats.total_xp.toLocaleString()}
                    </h2>
                </div>
            </div>

            {/* Content Area */}
            <AnimatePresence mode="wait">
                {activeSubTab === 'missions' && (
                    <motion.div
                        key="missions"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">Catálogo de Missões</h3>
                            <button 
                                onClick={() => { setCurrentMission({ is_active: true, reward_xp: 10, target_value: 1, target_action: 'user' }); setShowMissionModal(true); }}
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
                                        <div className={`size-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary`}>
                                            <span className="material-symbols-outlined font-black">{mission.icon || 'emoji_events'}</span>
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
                                            <p className="text-sm font-black text-primary italic">+{mission.reward_xp} XP</p>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Meta</p>
                                            <p className="text-sm font-black text-slate-900 dark:text-white italic">{mission.target_value}x {(mission.target_action || '').split('_')[0] || 'ação'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'levels' && (
                    <motion.div
                        key="levels"
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
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-4">Clique em qualquer campo para editar</p>
                            <div className="space-y-4">
                                {levels.map((level) => {
                                    const isEditing = editingLevelId === `user-${level.id}`;
                                    return (
                                        <div key={`u-${level.id}`} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-blue-500/30 transition-all">
                                            <div
                                                onClick={() => { setEditingLevelId(`user-${level.id}`); setEditedLevel(level); }}
                                                className="size-16 rounded-2xl bg-blue-500/10 flex flex-col items-center justify-center text-blue-500 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all cursor-pointer"
                                            >
                                                <span className="text-[10px] font-black uppercase leading-none">LVL</span>
                                                <span className="text-2xl font-black italic">{level.level_number}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    {isEditing ? (
                                                        <input autoFocus type="text" value={editedLevel.title || editedLevel.name || ''} onChange={(e) => setEditedLevel({ ...editedLevel, title: e.target.value, name: e.target.value })} className="text-base font-black uppercase italic bg-blue-50 dark:bg-slate-800 border border-blue-200 px-2 py-1 rounded-xl w-1/2 outline-none" />
                                                    ) : (
                                                        <h4 onClick={() => { setEditingLevelId(`user-${level.id}`); setEditedLevel(level); }} className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic cursor-pointer hover:text-blue-500 transition-colors">{level.title || level.name}</h4>
                                                    )}
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input type="number" value={editedLevel.xp_required || ''} onChange={(e) => setEditedLevel({ ...editedLevel, xp_required: Number(e.target.value) })} className="text-[10px] font-black text-blue-500 bg-blue-50 dark:bg-slate-800 border border-blue-200 px-2 py-1 rounded-xl w-16 outline-none" />
                                                            <button onClick={() => handleSaveLevel(level.id)} className="size-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow">
                                                                <span className="material-symbols-outlined text-sm">save</span>
                                                            </button>
                                                            <button onClick={() => setEditingLevelId(null)} className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span onClick={() => { setEditingLevelId(`user-${level.id}`); setEditedLevel(level); }} className="text-[10px] font-black text-blue-500 uppercase tracking-widest cursor-pointer hover:underline">{level.xp_required} XP</span>
                                                    )}
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 w-full opacity-20" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Drivers Levels */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter flex items-center gap-3">
                                <span className="material-symbols-outlined text-primary">delivery_dining</span>
                                Progressão: Entregadores
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-4">Clique em qualquer campo para editar</p>
                            <div className="space-y-4">
                                {levels.map((level) => {
                                    const isEditing = editingLevelId === `driver-${level.id}`;
                                    return (
                                        <div key={`d-${level.id}`} className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 flex items-center gap-6 group hover:border-primary/30 transition-all">
                                            <div
                                                onClick={() => { setEditingLevelId(`driver-${level.id}`); setEditedLevel(level); }}
                                                className="size-16 rounded-2xl bg-primary/10 flex flex-col items-center justify-center text-primary border border-primary/20 group-hover:bg-primary group-hover:text-slate-900 transition-all cursor-pointer"
                                            >
                                                <span className="text-[10px] font-black uppercase leading-none">LVL</span>
                                                <span className="text-2xl font-black italic">{level.level_number}</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    {isEditing ? (
                                                        <input autoFocus type="text" value={editedLevel.title || editedLevel.name || ''} onChange={(e) => setEditedLevel({ ...editedLevel, title: e.target.value, name: e.target.value })} className="text-base font-black uppercase italic bg-yellow-50 dark:bg-slate-800 border border-primary/40 px-2 py-1 rounded-xl w-1/2 outline-none" />
                                                    ) : (
                                                        <h4 onClick={() => { setEditingLevelId(`driver-${level.id}`); setEditedLevel(level); }} className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight italic cursor-pointer hover:text-primary transition-colors">{level.title || level.name}</h4>
                                                    )}
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <input type="number" value={editedLevel.xp_required || ''} onChange={(e) => setEditedLevel({ ...editedLevel, xp_required: Number(e.target.value) })} className="text-[10px] font-black text-primary bg-yellow-50 dark:bg-slate-800 border border-primary/40 px-2 py-1 rounded-xl w-16 outline-none" />
                                                            <button onClick={() => handleSaveLevel(level.id)} className="size-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors shadow">
                                                                <span className="material-symbols-outlined text-sm">save</span>
                                                            </button>
                                                            <button onClick={() => setEditingLevelId(null)} className="size-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                                                <span className="material-symbols-outlined text-sm">close</span>
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span onClick={() => { setEditingLevelId(`driver-${level.id}`); setEditedLevel(level); }} className="text-[10px] font-black text-primary uppercase tracking-widest cursor-pointer hover:underline">{level.xp_required} XP</span>
                                                    )}
                                                </div>
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                    <div className="h-full bg-primary w-full opacity-20" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeSubTab === 'stats' && (
                    <motion.div
                        key="stats"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter mb-4">
                            Estatísticas Reais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missões Concluídas</p>
                                <h2 className="text-4xl font-black text-emerald-500 italic tracking-tighter mt-2">{stats.missions_completed}</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Entregadores Engajados</p>
                                <h2 className="text-4xl font-black text-primary italic tracking-tighter mt-2">{stats.active_drivers}</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total XP Gerado</p>
                                <h2 className="text-4xl font-black text-blue-500 italic tracking-tighter mt-2">{stats.total_xp.toLocaleString()}</h2>
                            </div>
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Missões Criadas</p>
                                <h2 className="text-4xl font-black text-amber-500 italic tracking-tighter mt-2">{stats.missions_active}</h2>
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
                            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[48px] overflow-hidden shadow-2xl relative z-10 border border-slate-200 dark:border-slate-800 p-10"
                        >
                            <h2 className="text-2xl font-black uppercase italic mb-8 tracking-tighter">Configurar Missão</h2>
                            
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Público Alvo</label>
                                        <select 
                                            value={(currentMission as any)?.target_type || 'user'}
                                            onChange={(e) => setCurrentMission({ ...currentMission, target_type: e.target.value as any } as any)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        >
                                            <option value="user">Usuário (Cliente)</option>
                                            <option value="driver">Entregador (Piloto)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Evento Gatilho</label>
                                        <select 
                                            value={(currentMission as any)?.action_type || 'complete_delivery'}
                                            onChange={(e) => setCurrentMission({ ...currentMission, action_type: e.target.value } as any)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        >
                                            <option value="complete_delivery">Pedido Concluído / Entrega</option>
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
                                            value={currentMission?.target_value || ''}
                                            onChange={(e) => setCurrentMission({ ...currentMission, target_value: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">XP Reward</label>
                                        <input 
                                            type="number"
                                            value={currentMission?.reward_xp || ''}
                                            onChange={(e) => setCurrentMission({ ...currentMission, reward_xp: parseInt(e.target.value) })}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-4 text-sm font-black italic"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Coins Reward</label>
                                        <input 
                                            type="number"
                                            value={currentMission?.reward_coins || ''}
                                            onChange={(e) => setCurrentMission({ ...currentMission, reward_coins: parseInt(e.target.value) })}
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
