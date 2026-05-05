import React, { useEffect, useState } from 'react';
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
}

const NotificationsCenterView: React.FC<NotificationsCenterViewProps> = ({ driverId, onBack }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!driverId) return;

        const fetchNotifications = async () => {
            const { data, error } = await supabase
                .from('notifications_delivery')
                .select('*')
                .eq('user_id', driverId)
                .order('created_at', { ascending: false });

            if (!error && data) {
                setNotifications(data);
            }
            setLoading(false);
        };

        fetchNotifications();

        const subscription = supabase
            .channel(`notifications-${driverId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'notifications_delivery',
                filter: `user_id=eq.${driverId}`
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
    }, [driverId]);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications_delivery')
            .update({ status: 'read' })
            .eq('id', id);
            
        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
        }
    };

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from('notifications_delivery')
            .delete()
            .eq('id', id);
            
        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-zinc-50 h-full overflow-hidden">
            {/* Header Interno */}
            <div className="px-6 py-8 flex items-center justify-between bg-white border-b border-zinc-100 shadow-sm z-10">
                <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={onBack}
                    className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner"
                >
                    <Icon name="arrow_back" size={24} className="text-zinc-900" />
                </motion.button>
                <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Central de Alertas</h2>
                <div className="size-12" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-4 pb-32">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="size-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Sincronizando...</span>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                        <div className="size-32 rounded-[48px] bg-white border border-zinc-100 flex items-center justify-center text-zinc-200 shadow-sm relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-white opacity-50" />
                            <Icon name="notifications_off" size={64} className="relative z-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Radar Limpo</h3>
                            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">Nenhuma mensagem nova detectada no seu radar.</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence initial={false}>
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`group relative p-6 rounded-[32px] border transition-all duration-300 ${
                                    notif.status === 'read' 
                                        ? 'bg-zinc-50/50 border-zinc-100' 
                                        : 'bg-white border-yellow-200 shadow-[0_15px_40px_rgba(250,204,21,0.08)] ring-1 ring-yellow-400/10'
                                }`}
                                onClick={() => markAsRead(notif.id)}
                            >
                                <div className="flex gap-5">
                                    <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                                        notif.status === 'read' 
                                            ? 'bg-zinc-100 text-zinc-400' 
                                            : 'bg-yellow-400 text-zinc-950 shadow-[0_8px_20px_rgba(250,204,21,0.2)]'
                                    }`}>
                                        <Icon 
                                            name={notif.status === 'read' ? 'notifications' : 'notifications_active'} 
                                            size={28} 
                                        />
                                    </div>
                                    <div className="flex-1 space-y-1.5 pr-8">
                                        <div className="flex justify-between items-center">
                                            <h4 className={`text-sm font-black uppercase tracking-tight leading-tight ${
                                                notif.status === 'read' ? 'text-zinc-500' : 'text-zinc-900'
                                            }`}>
                                                {notif.title}
                                            </h4>
                                        </div>
                                        <p className={`text-xs leading-relaxed font-medium ${
                                            notif.status === 'read' ? 'text-zinc-400' : 'text-zinc-600'
                                        }`}>
                                            {notif.body}
                                        </p>
                                        <div className="flex items-center gap-2 pt-1">
                                            <div className="size-1.5 rounded-full bg-zinc-200" />
                                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">
                                                {new Date(notif.created_at).toLocaleDateString('pt-BR')} às {new Date(notif.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteNotification(notif.id);
                                        }}
                                        className="absolute top-6 right-6 size-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                                    >
                                        <Icon name="delete" size={20} />
                                    </button>
                                </div>
                                
                                {notif.status !== 'read' && (
                                    <div className="absolute top-4 left-4 size-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}
            </div>

            {/* Background Aesthetic Decor */}
            <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-50 to-transparent pointer-events-none" />
        </div>
    );
};

export default NotificationsCenterView;
