import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import Icon from '../common/Icon';

interface Notification {
    id: string;
    title: string;
    body: string;
    created_at: string;
    status: string;
    data?: any;
}

interface NotificationsCenterViewProps {
    driverId: string;
    onBack: () => void;
    getSecureToken: () => Promise<string>;
}

const NotificationsCenterView: React.FC<NotificationsCenterViewProps> = ({ driverId, onBack, getSecureToken }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        if (!driverId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const timeout = setTimeout(() => setLoading(false), 10000);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const authToken = await getSecureToken();

            const response = await fetch(`${supabaseUrl}/rest/v1/notifications_delivery?user_id=eq.${driverId}&app_type=eq.driver&order=created_at.desc`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            } else {
                console.error("[NOTIFS] Erro na resposta:", response.status);
            }
        } catch (e) {
            console.error("[NOTIFS] Erro ao buscar notificações:", e);
        } finally {
            clearTimeout(timeout);
            setLoading(false);
        }
    }, [driverId, getSecureToken]);

    useEffect(() => {
        fetchNotifications();

        // Realtime ainda via SDK pois é mais prático, mas o fetch inicial é via nativo
        const subscription = supabase
            .channel(`notifications-${driverId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications_delivery',
                filter: `user_id=eq.${driverId}&app_type=eq.driver`
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setNotifications(prev => [payload.new as Notification, ...prev]);
                } else if (payload.eventType === 'UPDATE') {
                    setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                } else if (payload.eventType === 'DELETE') {
                    setNotifications(prev => prev.filter(n => n.id === payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [driverId, fetchNotifications]);

    const markAsRead = async (id: string) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const authToken = await getSecureToken();

            const response = await fetch(`${supabaseUrl}/rest/v1/notifications_delivery?id=eq.${id}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ status: 'read' })
            });

            if (response.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
            }
        } catch (e) {
            console.error("[NOTIFS] Erro ao marcar como lida:", e);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const authToken = await getSecureToken();

            const response = await fetch(`${supabaseUrl}/rest/v1/notifications_delivery?id=eq.${id}`, {
                method: 'DELETE',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }
        } catch (e) {
            console.error("[NOTIFS] Erro ao deletar notificação:", e);
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-zinc-50 font-['Plus_Jakarta_Sans']">
            {/* Header Interno */}
            <div className="px-6 py-6 flex items-center justify-between bg-white border-b border-zinc-100 shadow-sm sticky top-0 z-20">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    className="size-11 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner"
                >
                    <Icon name="arrow_back" size={24} className="text-zinc-900" />
                </motion.button>
                <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Central de Alertas</h2>
                <button 
                    onClick={fetchNotifications}
                    className="size-11 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 active:scale-90 transition-all"
                >
                    <Icon name="sync" size={20} className={loading ? "text-yellow-500 animate-spin" : "text-zinc-400"} />
                </button>
            </div>

            <div className="flex-1 p-6 space-y-4 pb-24 overflow-y-auto no-scrollbar">
                {loading && notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="size-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Sincronizando...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="size-24 rounded-[32px] bg-white border border-zinc-100 flex items-center justify-center text-zinc-200 shadow-sm">
                            <Icon name="notifications_off" size={48} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Radar Limpo</h3>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed mx-auto">Nenhuma mensagem nova detectada no seu radar.</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group relative p-6 rounded-[32px] border transition-all duration-300 ${
                                    notif.status === 'read' 
                                        ? 'bg-zinc-50/50 border-zinc-100 opacity-70' 
                                        : 'bg-white border-yellow-200 shadow-[0_15px_40px_rgba(250,204,21,0.08)]'
                                }`}
                                onClick={() => markAsRead(notif.id)}
                            >
                                <div className="flex gap-4">
                                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                        notif.status === 'read' 
                                            ? 'bg-zinc-100 text-zinc-400' 
                                            : 'bg-yellow-400 text-zinc-950'
                                    }`}>
                                        <Icon 
                                            name={notif.status === 'read' ? 'notifications' : 'notifications_active'} 
                                            size={22} 
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <h4 className={`text-xs font-black uppercase tracking-tight leading-tight ${
                                            notif.status === 'read' ? 'text-zinc-500' : 'text-zinc-900'
                                        }`}>
                                            {notif.title}
                                        </h4>
                                        <p className={`text-[10px] leading-relaxed font-bold ${
                                            notif.status === 'read' ? 'text-zinc-400' : 'text-zinc-600'
                                        }`}>
                                            {notif.body}
                                        </p>
                                        <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest pt-1">
                                            {new Date(notif.created_at).toLocaleDateString('pt-BR')} às {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notif.id);
                                        }}
                                        className="size-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 active:bg-rose-500 active:text-white transition-all"
                                    >
                                        <Icon name="delete" size={16} />
                                    </button>
                                </div>
                                
                                {notif.status !== 'read' && (
                                    <div className="absolute top-3 left-3 size-2 bg-yellow-400 rounded-full border border-white animate-pulse" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default NotificationsCenterView;
