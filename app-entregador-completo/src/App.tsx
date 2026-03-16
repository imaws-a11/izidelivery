import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { playIziSound } from './lib/iziSounds';

// Icons using Material Symbols Outlined
const Icon = ({ name, className = "", fill = false }: { name: string; className?: string; fill?: boolean }) => (
    <span className={`material-symbols-outlined ${className} ${fill ? 'font-fill' : ''}`} style={{ fontVariationSettings: fill ? "'FILL' 1" : "" }}>{name}</span>
);

type View = 'dashboard' | 'history' | 'earnings' | 'profile' | 'active_mission' | 'dedicated' | 'sos';
type ServiceType = 'package' | 'mototaxi' | 'car_ride';

interface Mission {
    id: string;
    title: string;
    description: string;
    rewardXp: number;
    rewardCash: number;
    progress: number;
    goal: number;
}

interface Order {
    id: string; // ID encurtado para UI
    realId: string; // UUID real do banco
    type: ServiceType;
    title: string;
    origin: string;
    destination: string;
    price: number;
    distance: string;
    time: string;
    customer: string;
    rating: number;
    items?: string;
    weight?: string;
    scheduled_at?: string;
}

function App() {
    // --- Auth State ---
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [driverId, setDriverId] = useState<string | null>(null);
    const [driverName, setDriverName] = useState('Entregador');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authName, setAuthName] = useState('');
    const [authVehicle, setAuthVehicle] = useState<'mototaxi' | 'carro' | 'bicicleta'>('mototaxi');
    const [authPhone, setAuthPhone] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [authInitLoading, setAuthInitLoading] = useState(true);

    // Listen for Supabase auth session on mount
    useEffect(() => {
        const ensureDriverRecord = async (user: any) => {
            const { data } = await supabase.from('drivers_delivery').select('name').eq('id', user.id).maybeSingle();
            if (!data) {
                // Se não existe, cria um perfil básico para evitar erro de FK
                await supabase.from('drivers_delivery').upsert({
                    id: user.id,
                    name: user.user_metadata?.name || 'Entregador Izi',
                    email: user.email,
                    is_online: true,
                    is_active: true,
                    vehicle_type: 'mototaxi'
                });
            } else if (data.name) {
                setDriverName(data.name);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setDriverId(session.user.id);
                setIsAuthenticated(true);
                ensureDriverRecord(session.user);
            }
            setAuthInitLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setDriverId(session.user.id);
                setIsAuthenticated(true);
                ensureDriverRecord(session.user);
            } else {
                setDriverId(null);
                setIsAuthenticated(false);
                setDriverName('Entregador');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    // Auth handlers
    const handleAuthLogin = async () => {
        setAuthLoading(true);
        setAuthError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: authPassword
            });
            if (error) throw error;
            // Auth state listener will handle the rest
        } catch (e: any) {
            setAuthError(e.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : e.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleAuthRegister = async () => {
        setAuthLoading(true);
        setAuthError('');
        if (!authName.trim()) { setAuthError('Informe seu nome completo.'); setAuthLoading(false); return; }
        if (authPassword.length < 6) { setAuthError('A senha deve ter no mínimo 6 caracteres.'); setAuthLoading(false); return; }
        try {
            const { data, error } = await supabase.auth.signUp({
                email: authEmail,
                password: authPassword,
                options: { data: { name: authName } }
            });
            if (error) throw error;
            if (!data.user) throw new Error('Erro ao criar conta.');

            // Create driver record
            const { error: driverError } = await supabase.from('drivers_delivery').upsert({
                id: data.user.id,
                name: authName.trim(),
                is_online: false,
                vehicle_type: authVehicle,
                phone: authPhone || null,
                rating: 5.0,
                is_active: true
            });
            if (driverError) console.warn('Driver record sync:', driverError.message);

            setDriverName(authName.trim());
            // Auth state listener handles isAuthenticated + driverId
        } catch (e: any) {
            if (e.message.includes('already registered')) {
                setAuthError('Este email já está cadastrado. Faça login.');
            } else {
                setAuthError(e.message);
            }
        } finally {
            setAuthLoading(false);
        }
    };

    const [activeTab, setActiveTab] = useState<View>('dashboard');
    const [isOnline, setIsOnline] = useState(() => {
        return localStorage.getItem('Izi_online') !== 'false';
    });

    useEffect(() => {
        if (!driverId || !isAuthenticated) return;
        localStorage.setItem('Izi_online', isOnline.toString());

        const syncStatus = async () => {
            try {
                const { error } = await supabase
                    .from('drivers_delivery')
                    .update({ is_online: isOnline })
                    .eq('id', driverId);

                if (error) console.warn("Sync aviso:", error.message);
            } catch (e) {
                console.warn("Sync offline");
            }
        };

        syncStatus();
    }, [isOnline, isAuthenticated, driverId]);

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeMission, setActiveMission] = useState<Order | null>(null);
    const [history, setHistory] = useState<Order[]>([]);
    const [filter, setFilter] = useState<ServiceType | 'all'>('all');
    const [stats, setStats] = useState({ balance: 0, today: 0, count: 0, level: 1, xp: 0, nextXp: 100 });
    const [orders, setOrders] = useState<Order[]>([]);
    const [scheduledOrders, setScheduledOrders] = useState<Order[]>([]);
    const [dedicatedSlots, setDedicatedSlots] = useState<any[]>([]);
    
    // --- Izi Elite Features State ---
    const [autoPilot, setAutoPilot] = useState(false);
    const [autoPilotMinPrice, setAutoPilotMinPrice] = useState(15);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [showHUD, setShowHUD] = useState(false);
    
    // Virtual Heatmap Data
    const heatmapZones = useMemo(() => [
        { id: 1, name: 'Zona Sul', intensity: 0.9, orders: 15 },
        { id: 2, name: 'Centro', intensity: 0.6, orders: 8 },
        { id: 3, name: 'Zona Oeste', intensity: 0.4, orders: 4 },
        { id: 4, name: 'Zona Norte', intensity: 0.2, orders: 2 },
    ], []);

    const dailyMissions = useMemo<Mission[]>(() => [
        { id: 'm1', title: 'Piloto da Manhã', description: 'Complete 5 entregas antes das 11h', rewardXp: 50, rewardCash: 15, progress: 2, goal: 5 },
        { id: 'm2', title: 'Maratonista', description: 'Rode mais de 50km no dia', rewardXp: 100, rewardCash: 30, progress: 12, goal: 50 },
        { id: 'm3', title: 'Elite Delivery', description: 'Mantenha avaliação 5.0 hoje', rewardXp: 80, rewardCash: 20, progress: 1, goal: 1 },
    ], []);


    useEffect(() => {
        if ("Notification" in window) {
            Notification.requestPermission();
        }
    }, []);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data, error } = await supabase
                    .from('orders_delivery')
                    .select('*')
                    .eq('status', 'pendente');

                if (error) throw error;

                if (data && data.length > 0) {
                    const declinedIds = JSON.parse(localStorage.getItem('Izi_declined') || '[]');
                    const formatted: Order[] = data.map(o => ({
                        id: o.id.slice(0, 8).toUpperCase(),
                        realId: o.id,
                        type: o.service_type as ServiceType,
                        title: o.service_type === 'package' ? 'Entrega de Encomenda' : 'Chamada de Passageiro',
                        origin: o.pickup_address,
                        destination: o.delivery_address,
                        price: o.total_price,
                        distance: '---',
                        time: 'Imediato',
                        customer: 'Cliente Izi',
                        rating: 4.8
                    })).filter(o => !declinedIds.includes(o.id));
                    setOrders(formatted);
                } else {
                    setOrders([]);
                }
            } catch (err) {
                console.warn("Erro ao buscar pedidos reais");
                setOrders([]);
            }
        };

        const fetchDedicatedSlots = async () => {
            try {
                const declinedIds = JSON.parse(localStorage.getItem('Izi_declined_slots') || '[]');
                const { data, error } = await supabase
                    .from('dedicated_slots_delivery')
                    .select('*, admin_users(store_name, store_logo, store_address, store_phone)')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                const filtered = (data || []).filter(s => !declinedIds.includes(s.id));
                setDedicatedSlots(filtered);
            } catch (err) {
                console.warn("Erro ao buscar vagas dedicadas");
            }
        };

        fetchDedicatedSlots();
        fetchOrders();

        const channel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new;
                const shortId = o.id.slice(0, 8).toUpperCase();
                const declinedIds = JSON.parse(localStorage.getItem('Izi_declined') || '[]');
                if (o.status === 'pendente' && !declinedIds.includes(shortId)) {
                    // Toca Alerta Sonoro
                    playIziSound('driver');

                    // Envia Notificação de Sistema
                    if (Notification.permission === "granted") {
                        new Notification("🚀 Nova Missão Izi!", {
                            body: `Coleta em: ${o.pickup_address}\nValor: R$ ${o.total_price.toFixed(2)}`,
                            icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'
                        });
                    }

                    const newOrder: Order = {
                        id: o.id.slice(0, 8).toUpperCase(),
                        realId: o.id,
                        type: o.service_type as ServiceType,
                        title: `Nova Chamada: ${o.service_type}`,
                        origin: o.pickup_address,
                        destination: o.delivery_address,
                        price: o.total_price,
                        distance: 'Local',
                        time: 'Imediato',
                        customer: 'Cliente Real',
                        rating: 5.0
                    };
                    setOrders(prev => [newOrder, ...prev]);
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new;
                const shortId = o.id.slice(0, 8).toUpperCase();
                
                if (o.status === 'pendente') {
                    // Se o status mudou para pendente, adicionamos à lista (se não estiver lá)
                    setOrders(prev => {
                        const exists = prev.some(order => order.id === shortId);
                        if (exists) return prev;
                        
                        // Toca Alerta Sonoro
                        playIziSound('driver');

                        const newOrder: Order = {
                            id: shortId,
                            realId: o.id,
                            type: o.service_type as ServiceType,
                            title: `Nova Coleta: ${o.service_type}`,
                            origin: o.pickup_address,
                            destination: o.delivery_address,
                            price: o.total_price,
                            distance: 'Local',
                            time: 'Imediato',
                            customer: 'Cliente Real',
                            rating: 5.0
                        };
                        return [newOrder, ...prev];
                    });
                } else {
                    // Se o status mudou para qualquer outra coisa, removemos da lista
                    setOrders(prev => prev.filter(order => order.id !== shortId));
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'dedicated_slots_delivery' }, () => {
                fetchDedicatedSlots();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [isOnline]);

    // --- Auto-Pilot Logic ---
    useEffect(() => {
        if (autoPilot && orders.length > 0 && !activeMission && isOnline) {
            const bestOrder = orders.find(o => o.price >= autoPilotMinPrice);
            if (bestOrder) {
                console.log("Auto-Pilot: Aceitando missão lucrativa...");
                handleAccept(bestOrder);
            }
        }
    }, [orders, autoPilot, activeMission, isOnline, autoPilotMinPrice]);

    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter(o => o.type === filter);
    }, [filter, orders]);

    const handleAccept = async (order: Order) => {
        try {
            // Usamos o realId que agora está guardado no objeto order
            const targetId = order.realId || order.id;

            const { data: realOrder, error: findError } = await supabase
                .from('orders_delivery')
                .select('id, status')
                .eq('id', targetId)
                .single();

            if (findError || !realOrder || realOrder.status !== 'pendente') {
                console.warn("Pedido não disponível ou já aceito.");
                alert("Erro: Pedido indisponível ou já aceito.");
                setOrders(prev => prev.filter(o => o.id !== order.id));
                return;
            }

            if (!driverId) {
                alert("Erro: Sessão do motorista não identificada. Re-faça o login.");
                return;
            }

            const { error } = await supabase
                .from('orders_delivery')
                .update({
                    status: 'a_caminho',
                    driver_id: driverId
                })
                .eq('id', realOrder.id);

            if (error) {
                console.error("Erro ao aceitar pedido:", error);
                alert("Erro de conexão ao aceitar a corrida.");
                return;
            }

            setActiveMission({ ...order, id: realOrder.id }); // Salva o UUID real
            setOrders(prev => prev.filter(o => !o.id.startsWith(order.id)));
            setActiveTab('active_mission');
        } catch (e) {
            console.error("Erro fatal ao aceitar:", e);
            alert("Erro fatal ao aceitar pedido.");
        }
    };

    const handleDecline = (orderId: string) => {
        const declined = JSON.parse(localStorage.getItem('Izi_declined') || '[]');
        if (!declined.includes(orderId)) {
            declined.push(orderId);
            localStorage.setItem('Izi_declined', JSON.stringify(declined));
        }
        setOrders(prev => prev.filter(o => o.id !== orderId));
    };

    const handleComplete = async () => {
        if (activeMission) {
            try {
                const { error } = await supabase
                    .from('orders_delivery')
                    .update({ status: 'concluido' })
                    .eq('id', activeMission.id);

                if (error) {
                    console.error("Erro ao sincronizar conclusão:", error.message);
                    alert("Erro ao concluir a missão.");
                    return; // Prevent local completion if DB update fails
                }
                
                // Conclusão local
                setHistory([{ ...activeMission, id: activeMission.id.slice(0, 8).toUpperCase() }, ...history]);
                setStats(prev => {
                    const bonusXp = 25 + (prev.level * 5); // XP escala com nível
                    const newXp = prev.xp + bonusXp;
                    const levelUp = newXp >= prev.nextXp;
                    
                    if (levelUp) {
                        // Alerta visual de Level Up (Simulado)
                        setTimeout(() => alert(`🎉 PROMOÇÃO! Você agora é Nível ${prev.level + 1}! Novas missões desbloqueadas.`), 500);
                    }

                    return {
                        ...prev,
                        balance: prev.balance + activeMission.price,
                        today: prev.today + activeMission.price,
                        count: prev.count + 1,
                        xp: levelUp ? newXp - prev.nextXp : newXp,
                        level: levelUp ? prev.level + 1 : prev.level,
                        nextXp: levelUp ? prev.nextXp + 50 : prev.nextXp
                    };
                });
            } catch (e) {
                console.error("Erro de conexão ao finalizar missão.", e);
                alert("Erro de conexão ao finalizar missão.");
                return;
            }
        }
        setActiveMission(null);
        setActiveTab('dashboard');
    };

    const handleLogout = async () => {
        if (confirm('Deseja encerrar a sessão do terminal operacional?')) {
            // Set driver offline before signing out
            if (driverId) {
                await supabase.from('drivers_delivery').update({ is_online: false }).eq('id', driverId);
            }
            await supabase.auth.signOut();
            setIsMenuOpen(false);
            setIsOnline(false);
            localStorage.removeItem('Izi_online');
            localStorage.removeItem('Izi_declined');
        }
    };

    const getTypeDetails = (type: ServiceType) => {
        switch (type) {
            case 'package': return { icon: 'package_2', color: 'text-primary', bg: 'bg-primary/10', label: 'Encomenda' };
            case 'mototaxi': return { icon: 'two_wheeler', color: 'text-accent', bg: 'bg-accent/10', label: 'MotoTaxi' };
            case 'car_ride': return { icon: 'directions_car', color: 'text-secondary', bg: 'bg-secondary/10', label: 'Privado' };
            default: return { icon: 'help', color: 'text-white', bg: 'bg-white/10', label: 'Outro' };
        }
    };

    const renderNavigationDrawer = () => (
        <AnimatePresence>
            {isMenuOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMenuOpen(false)}
                        className="drawer-overlay"
                    />
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="drawer-content"
                    >
                        <div className="flex items-center gap-4 mb-12">
                            <div className="size-16 rounded-3xl bg-gradient-to-br from-primary to-secondary p-[2px]">
                                <div className="w-full h-full rounded-[22px] bg-background bg-cover bg-center" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{driverName}</h3>
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Patente Platina</p>
                            </div>
                        </div>

                        <div className="flex-1 space-y-2">
                            {[
                                { id: 'dashboard', label: 'Painel de Operações', icon: 'grid_view' },
                                { id: 'dedicated', label: 'Vagas Dedicadas', icon: 'stars' },
                                { id: 'history', label: 'Logs de Missão', icon: 'history' },
                                { id: 'earnings', label: 'Financeiro', icon: 'payments' },
                                { id: 'profile', label: 'Perfil do Piloto', icon: 'person' },
                            ].map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); }}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-white/40 hover:bg-white/5'}`}
                                >
                                    <Icon name={item.icon} className="text-xl" fill={activeTab === item.id} />
                                    <span className="text-sm font-black uppercase tracking-widest italic">{item.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-8 border-t border-white/5 space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">Status do Sistema</span>
                                <button onClick={() => setIsOnline(!isOnline)} className={`h-8 w-14 rounded-full relative transition-colors ${isOnline ? 'bg-primary' : 'bg-white/10'}`}>
                                    <motion.div animate={{ x: isOnline ? 24 : 4 }} className="absolute top-1 size-6 bg-white rounded-full shadow-lg" />
                                </button>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full h-14 border border-red-500/20 text-red-500 rounded-2xl text-[10px] font-black uppercase tracking-widest italic hover:bg-red-500/5"
                            >
                                Desativar Painel Izi
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const renderHeader = () => (
        <header className="p-6 flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="size-12 glass-card rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all text-primary"
                >
                    <Icon name="menu" className="text-2xl" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-lg font-black text-white italic tracking-tighter uppercase leading-none">Painel <span className="text-primary">Izi</span></h1>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className={`size-1.5 rounded-full ${isOnline ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></div>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{isOnline ? 'Operacional' : 'Em Pausa'}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div onClick={() => setActiveTab('earnings')} className="glass-card px-4 py-2.5 rounded-2xl flex items-center gap-3 border-primary/10 cursor-pointer active:scale-95 transition-all">
                    <Icon name="account_balance_wallet" className="text-primary text-sm" />
                    <span className="text-xs font-black text-white whitespace-nowrap">R$ {stats.balance.toFixed(0)}</span>
                </div>
            </div>
        </header>
    );

    const renderDashboard = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-6 space-y-8 pb-32 page-transition relative">
            {/* XP Performance Card & Auto-Pilot Toggle */}
            <section className="glass-card p-6 rounded-[35px] aura-border overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="relative z-10 flex justify-between items-start mb-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Patente Atual</p>
                        <h3 className="text-3xl font-black text-white italic tracking-tighter flex items-end gap-2">
                            {stats.level >= 10 ? 'Comandante' : stats.level >= 5 ? 'Veterano' : 'Soldado'} 
                            <span className="text-xs text-primary not-italic font-black mb-1">NÍVEL {stats.level}</span>
                        </h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <motion.button 
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { 
                              e.preventDefault();
                              e.stopPropagation(); 
                              const newState = !autoPilot;
                              setAutoPilot(newState); 
                            }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center gap-2 ${autoPilot ? 'bg-primary text-slate-900 shadow-primary/20 snap-pulse' : 'bg-white/5 text-white/40 border border-white/10'}`}
                        >
                            <Icon name={autoPilot ? "smart_toy" : "person"} className="text-sm" fill={autoPilot} />
                            {autoPilot ? "Auto-Pilot ATIVO" : "Auto-Pilot INATIVO"}
                        </motion.button>
                        <button 
                          onClick={() => playIziSound('driver')}
                          className="px-4 py-2 rounded-xl text-[7px] font-black uppercase text-white/20 hover:text-white/40 border border-white/5 transition-all"
                        >
                          TESTAR SOM IZI
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[9px] font-black uppercase text-white/60 tracking-widest">
                        <span>XP Progress</span>
                        <span>{stats.xp} / {stats.nextXp}</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-[px] border border-white/5">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(stats.xp / stats.nextXp) * 100}%` }}
                            className="h-full bg-gradient-to-r from-primary via-secondary to-accent rounded-full shadow-[0_0_15px_rgba(255,217,0,0.4)]"
                        />
                    </div>
                </div>
            </section>

            {/* Strategic Radar (Heatmap) */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Icon name="radar" className="text-primary animate-pulse" />
                        Radar Estratégico
                    </h2>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full uppercase tracking-widest">Tempo Real</span>
                </div>
                
                <div className="glass-card p-6 rounded-[40px] border-white/5 relative overflow-hidden h-48 group">
                    <div className="absolute inset-0 z-0 opacity-40">
                        {/* Simulated Map Grid */}
                        <div className="grid grid-cols-4 grid-rows-2 h-full gap-4 p-4">
                            {heatmapZones.map(zone => (
                                <div key={zone.id} className="relative rounded-2xl border border-white/5 bg-white/5 overflow-hidden">
                                     <div 
                                        className="absolute inset-0 bg-primary/40 blur-[30px]" 
                                        style={{ opacity: zone.intensity, transform: `scale(${zone.intensity * 2})` }}
                                     />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative z-10 h-full flex flex-col justify-end">
                        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                            {heatmapZones.map(zone => (
                                <div key={zone.id} className="bg-slate-900/80 backdrop-blur-md p-3 rounded-2xl min-w-[120px] border border-white/10">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{zone.name}</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-black text-white italic">{zone.orders} pedidos</span>
                                        <div className={`size-2 rounded-full ${zone.intensity > 0.7 ? 'bg-orange-500 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'bg-emerald-500'}`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Missions Section */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                        <Icon name="military_tech" className="text-accent" fill />
                        Missões de Elite
                    </h2>
                </div>
                <div className="space-y-3">
                    {dailyMissions.map(m => (
                        <div key={m.id} className="glass-card p-5 rounded-[30px] border-white/5 flex items-center gap-4 group hover:aura-border transition-all">
                            <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                                <Icon name="bolt" className="text-primary" fill={m.progress >= m.goal} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-black text-white uppercase italic tracking-tighter">{m.title}</h4>
                                <p className="text-[9px] text-white/40 uppercase tracking-widest mt-1 truncate">{m.description}</p>
                                <div className="mt-2 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-accent rounded-full" style={{ width: `${(m.progress / m.goal) * 100}%` }}></div>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-primary italic leading-none">+R$ {m.rewardCash}</span>
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">{m.progress}/{m.goal}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Scheduled Services Section - New Feature */}
            <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="size-2 bg-accent rounded-full animate-pulse"></div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Agendamentos</h2>
                    </div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">{scheduledOrders.length} RESERVADOS</span>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pt-2 -mx-2 px-2">
                    {scheduledOrders.length === 0 ? (
                        <div className="w-full glass-card p-10 rounded-[35px] text-center border-dashed border-white/10 opacity-40">
                            <p className="text-[10px] font-black uppercase tracking-widest italic">Nenhum serviço agendado</p>
                        </div>
                    ) : scheduledOrders.map((order, i) => {
                        const details = getTypeDetails(order.type);

                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: i * 0.1 }}
                                className="min-w-[280px] glass-card p-6 rounded-[40px] border-white/5 relative overflow-hidden group aura-border"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <div className="bg-primary/10 text-primary px-3 py-1.5 rounded-full border border-primary/20">
                                        <span className="text-[8px] font-black uppercase tracking-widest italic">{order.scheduled_at}</span>
                                    </div>
                                </div>

                                <div className="size-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10 group-hover:scale-110 transition-transform">
                                    <Icon name={details.icon} className={`text-3xl ${details.color}`} fill />
                                </div>

                                <div className="space-y-1 mb-6">
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] italic">{details.label}</p>
                                    <h4 className="text-lg font-black text-white uppercase italic tracking-tighter truncate">{order.title}</h4>
                                </div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="size-1.5 rounded-full bg-slate-500"></div>
                                        <p className="text-[10px] font-bold text-white/60 truncate italic">{order.origin.split(',')[0]}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_#ffd900]"></div>
                                        <p className="text-[10px] font-black text-white truncate">{order.destination.split(',')[0]}</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Valor</span>
                                        <span className="text-xl font-black text-primary italic">R$ {order.price.toFixed(0)}</span>
                                    </div>
                                    <button className="bg-white/5 hover:bg-white/10 p-4 rounded-2xl border border-white/5 transition-all active:scale-90">
                                        <Icon name="event_upcoming" className="text-white/60 text-lg" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </section>

            {/* Dedicated Slots Showcase - NEW */}
            {dedicatedSlots.length > 0 && (
                <section className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <Icon name="stars" className="text-primary animate-pulse" fill />
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Vagas Dedicadas</h2>
                        </div>
                        <button 
                            onClick={() => setActiveTab('dedicated')}
                            className="text-[10px] font-black text-primary uppercase tracking-[0.2em] italic border-b border-primary/20"
                        >
                            VER TODAS
                        </button>
                    </div>

                    <div className="flex gap-6 overflow-x-auto no-scrollbar pb-6 pt-2 -mx-2 px-2">
                        {dedicatedSlots.slice(0, 3).map((slot, i) => (
                            <motion.div
                                key={slot.id}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setActiveTab('dedicated')}
                                className="min-w-[320px] glass-card p-6 rounded-[45px] border-l-4 border-emerald-500 shadow-2xl relative overflow-hidden group cursor-pointer"
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest italic">DIÁRIA FIXA</span>
                                    <h5 className="text-xl font-black text-white text-right italic">R$ {parseFloat(slot.fee_per_day).toFixed(0)}</h5>
                                </div>

                                <div className="flex items-center gap-4 mb-6">
                                    <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform overflow-hidden p-1.5">
                                        <img src={slot.admin_users?.store_logo || "https://cdn-icons-png.flaticon.com/512/3063/3063822.png"} className="w-full h-full object-contain" alt="store" />
                                    </div>
                                    <div className="min-w-0 pr-16">
                                        <h4 className="text-base font-black text-white uppercase italic tracking-tighter truncate leading-none">{slot.title}</h4>
                                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1 truncate">{slot.admin_users?.store_name}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-[10px] font-black uppercase italic text-white/60">
                                    <div className="flex items-center gap-1.5">
                                        <Icon name="schedule" className="text-emerald-500 text-sm" />
                                        {slot.working_hours}
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-white/10"></div>
                                    <div className="flex items-center gap-1.5 truncate text-white/40">
                                        <Icon name="location_on" className="text-sm" />
                                        {slot.admin_users?.store_address?.split(',')[0]}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

            {/* Filter Swiper */}
            <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
                {[
                    { id: 'all', label: 'Radar', icon: 'radar' },
                    { id: 'package', label: 'Pacotes', icon: 'package_2' },
                    { id: 'mototaxi', label: 'Moto', icon: 'two_wheeler' },
                    { id: 'car_ride', label: 'Carro', icon: 'directions_car' }
                ].map(item => (
                    <button
                        key={item.id}
                        onClick={() => setFilter(item.id as any)}
                        className={`flex items-center gap-3 px-6 py-4 rounded-[22px] whitespace-nowrap transition-all duration-300 ${filter === item.id
                            ? 'bg-primary text-background font-black scale-105 shadow-xl shadow-primary/30 border-none'
                            : 'glass-card text-white/40 hover:text-white/80 border-white/5'}`}
                    >
                        <Icon name={item.icon} className="text-lg" fill={filter === item.id} />
                        <span className="text-[12px] font-black uppercase tracking-tighter italic">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Live Feed */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="size-2 bg-primary rounded-full animate-ping"></div>
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Chamadas Izi</h2>
                    </div>
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] italic">{filteredOrders.length} DISPONÍVEIS</span>
                </div>

                <div className="space-y-5">
                    {!isOnline ? (
                        <div className="py-24 glass-card rounded-[40px] flex flex-col items-center gap-6 text-center border-white/5">
                            <div className="size-24 rounded-full bg-red-500/5 flex items-center justify-center text-red-500/40 border border-red-500/10 mb-2">
                                <Icon name="power_off" className="text-5xl" />
                            </div>
                            <div className="space-y-2">
                                <h4 className="text-lg font-black text-white uppercase italic tracking-[0.2em]">Scanner Desativado</h4>
                                <p className="text-xs font-bold text-white/40 uppercase tracking-widest max-w-[200px]">Fique online no HUD lateral para receber novas chamadas.</p>
                            </div>
                            <button onClick={() => setIsOnline(true)} className="bg-primary hover:bg-primary/90 text-background font-black px-10 py-4 rounded-2xl text-xs uppercase tracking-[0.3em] italic shadow-xl shadow-primary/20 transition-all active:scale-95">Reativar Agora</button>
                        </div>
                    ) : filteredOrders.map((order, i) => {
                        const isMobility = order.type === 'mototaxi' || order.type === 'car_ride';
                        const details = getTypeDetails(order.type);

                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-card p-6 rounded-[35px] hover:bg-white/[0.08] transition-all group border-white/5 relative overflow-hidden"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-5">
                                        <div className={`size-16 rounded-[24px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10 shadow-lg relative`}>
                                            <Icon name={details.icon} className="text-4xl" fill />
                                            {isMobility && <div className="absolute -top-1 -right-1 size-4 bg-primary border-2 border-background rounded-full animate-pulse"></div>}
                                        </div>
                                        <div>
                                            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${details.color} mb-1 italic`}>{details.label}</p>
                                            <h3 className="text-xl font-black text-white italic tracking-tighter leading-none group-hover:text-primary transition-colors uppercase">
                                                {isMobility ? 'Chamada de Passageiro' : 'Entrega de Pacotes'}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-primary italic tracking-tighter leading-none">R$ {order.price.toFixed(0)}</p>
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1 block tracking-[0.2em]">GANHO ESTIMADO</span>
                                    </div>
                                </div>

                                {/* Contextual Details Area */}
                                <div className="bg-white/5 rounded-[28px] p-5 mb-6 border border-white/5 space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 size-2 rounded-full bg-slate-500"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Ponto de Partida</p>
                                            <p className="text-xs font-bold text-white/80 uppercase truncate italic">{order.origin}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1 size-2 rounded-full bg-primary shadow-[0_0_10px_#ffd900]"></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Destino Final</p>
                                            <p className="text-xs font-black text-white uppercase truncate">{order.destination}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="glass-card bg-white/5 rounded-2xl p-4 flex items-center gap-3 border-white/5">
                                        <Icon name={isMobility ? "person" : "inventory_2"} className="text-primary text-xl" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/30 uppercase">
                                                {isMobility ? "Passageiro" : "Volume"}
                                            </span>
                                            <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">
                                                {isMobility ? order.customer : (order.items || "Pacote Médio")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="glass-card bg-white/5 rounded-2xl p-4 flex items-center gap-3 border-white/5">
                                        <Icon name="payments" className="text-primary text-xl" />
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-white/30 uppercase">Pagamento</span>
                                            <span className="text-[10px] font-black text-white uppercase tracking-tighter italic">App Izi</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleAccept(order)}
                                        className="premium-button flex-[2] h-16 bg-primary text-background font-black text-[10px] uppercase tracking-[0.2em] italic rounded-2xl shadow-xl shadow-primary/20"
                                    >
                                        <span className="relative z-10">{isMobility ? 'Aceitar Corrida' : 'Aceitar Coleta'}</span>
                                    </button>
                                    <button
                                        onClick={() => handleDecline(order.id)}
                                        className="premium-button flex-1 h-16 glass-card bg-red-500/5 text-red-500/60 font-black text-[10px] uppercase tracking-[0.1em] italic rounded-2xl border-red-500/10"
                                    >
                                        <Icon name="close" className="relative z-10 text-lg" />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );


    const renderHistoryView = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 space-y-8 pt-6 pb-20 page-transition">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.8em] ml-1">Terminal de Logs</p>
                <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase underline decoration-primary decoration-4 underline-offset-8">Registros</h2>
            </div>
            {history.length === 0 ? (
                <div className="py-40 text-center opacity-30 grayscale flex flex-col items-center gap-6 glass-card rounded-[45px] border-white/5 mt-10">
                    <div className="size-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                        <Icon name="history_edu" className="text-6xl" />
                    </div>
                    <p className="text-xs uppercase font-black tracking-[0.3em] italic">Nenhum log operacional.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {history.map((order, i) => {
                        const details = getTypeDetails(order.type);
                        return (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={i} className="glass-card p-6 rounded-[35px] flex items-center justify-between group hover:bg-white/5 transition-all border-white/5 relative overflow-hidden">
                                <div className="absolute left-0 h-full w-1.5 bg-current" style={{ color: `var(--color-${order.type === 'package' ? 'primary' : order.type === 'mototaxi' ? 'accent' : 'secondary'})` }}></div>
                                <div className="flex items-center gap-6">
                                    <div className={`size-14 rounded-2xl ${details.bg} ${details.color} flex items-center justify-center border border-current/10`}>
                                        <Icon name={details.icon} className="text-2xl" fill />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter truncate max-w-[180px]">{order.destination.split(',')[0]}</h4>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{order.customer} • MISSÃO_CONCLUÍDA</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-white italic tracking-tighter leading-none">R$ {order.price.toFixed(0)}</p>
                                    <div className="flex items-center gap-1 justify-end mt-1">
                                        <Icon name="verified" className="text-[10px] text-accent" fill />
                                        <span className="text-[8px] font-black text-accent uppercase tracking-widest">VALIDADO</span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );

    const renderEarningsView = () => (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="px-6 space-y-12 pt-6 pb-20 page-transition">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-secondary uppercase tracking-[0.8em] ml-1 italic">Consoles Financeiros</p>
                <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">Rendimentos</h2>
            </div>

            {/* Futuristic Vault Card */}
            <section className="p-12 rounded-[60px] glass-card border-white/5 relative overflow-hidden group aura-border">
                <div className="absolute top-0 right-0 p-10 opacity-[0.05] group-hover:opacity-10 transition-opacity">
                    <Icon name="account_balance_wallet" className="text-[200px] -rotate-12" fill />
                </div>
                <div className="relative z-10 space-y-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="size-2 bg-accent rounded-full animate-pulse shadow-[0_0_8px_#ADFF2F]"></div>
                            <p className="text-[11px] font-black text-white/40 uppercase tracking-[0.5em]">Saldo Izi Liquidável</p>
                        </div>
                        <h3 className="text-7xl font-black text-white italic tracking-tighter leading-none">R$ {stats.balance.toFixed(2).replace('.', ',')}</h3>
                    </div>
                    <div className="flex gap-5">
                        <button className="flex-1 h-16 bg-gradient-to-r from-secondary to-pink-500 text-background font-black rounded-3xl text-xs uppercase tracking-[0.4em] italic shadow-2xl shadow-secondary/30 active:scale-95 transition-all">Sacar PIX</button>
                        <button className="size-16 glass-card rounded-3xl flex items-center justify-center text-white border-white/10 hover:bg-white/5 transition-all active:scale-90"><Icon name="analytics" className="text-2xl" /></button>
                    </div>
                </div>
            </section>

            {/* Performance Matrix */}
            <div className="space-y-8">
                <div className="flex justify-between items-center px-4">
                    <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.6em]">Volumetria Operacional</h3>
                    <span className="text-primary text-[10px] font-black uppercase italic tracking-tighter">Ranking 3% Brasil</span>
                </div>
                <div className="glass-card p-10 rounded-[50px] h-72 flex items-end gap-4 justify-between bg-black/30 border-white/5 group hover:border-primary/20 transition-all">
                    {[35, 65, 45, 85, 55, 120, 95].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-5">
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${h}%` }}
                                className={`w-full rounded-2xl relative transition-all duration-700 ${i === 5 ? 'bg-gradient-to-t from-primary to-accent shadow-[0_0_30px_rgba(0,245,255,0.3)]' : 'bg-white/5 group-hover:bg-white/10'}`}
                            >
                                {i === 5 && <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-background text-[9px] font-black px-3 py-1.5 rounded-xl italic whitespace-nowrap shadow-2xl">Dia de Pico</div>}
                            </motion.div>
                            <span className={`text-[10px] font-black ${i === 5 ? 'text-primary' : 'text-white/20 uppercase'}`}>D S T Q Q S S</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Stats Matrix */}
            <div className="grid grid-cols-2 gap-5">
                <div className="glass-card p-8 rounded-[40px] border-white/5 space-y-3">
                    <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary"><Icon name="electric_bolt" /></div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-tight">Sequência de Missão</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">{stats.count} Ativas</p>
                </div>
                <div className="glass-card p-8 rounded-[40px] border-white/5 space-y-3">
                    <div className="size-12 bg-secondary/10 rounded-2xl flex items-center justify-center text-secondary"><Icon name="military_tech" /></div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest leading-tight">Classificação Atual</p>
                    <p className="text-2xl font-black text-white italic tracking-tighter uppercase">Nível {stats.level}</p>
                </div>
            </div>
        </motion.div>
    );

    const renderDedicatedView = () => (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-6 space-y-8 pt-6 pb-20 page-transition">
            <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.8em] ml-1">Exclusivo</p>
                <h2 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">Vagas Dedicadas</h2>
                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest mt-2 italic">Seja um piloto exclusivo de um de nossos parceiros.</p>
            </div>

            <div className="space-y-6 mt-10">
                {dedicatedSlots.length === 0 ? (
                    <div className="py-40 text-center opacity-30 grayscale flex flex-col items-center gap-6 glass-card rounded-[45px] border-white/5">
                        <div className="size-24 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                            <Icon name="sentiment_dissatisfied" className="text-6xl" />
                        </div>
                        <p className="text-xs uppercase font-black tracking-[0.3em] italic">Nenhuma vaga disponível no momento.</p>
                    </div>
                ) : dedicatedSlots.map((slot, i) => (
                    <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-card p-8 rounded-[50px] border-white/5 relative overflow-hidden group aura-border"
                    >
                        <div className="absolute top-0 right-0 p-6">
                            <div className="bg-primary/10 border border-primary/20 backdrop-blur-md px-4 py-2 rounded-2xl flex flex-col items-end shadow-[0_0_20px_rgba(0,245,255,0.1)]">
                                <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Mínimo Garantido</span>
                                <h4 className="text-2xl font-black text-white italic tracking-tighter">R$ {parseFloat(slot.fee_per_day).toFixed(0)}<span className="text-[10px] ml-1 text-white/40">/dia</span></h4>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 mb-8">
                            <div className="size-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform overflow-hidden p-2">
                                <img src={slot.admin_users?.store_logo || "https://cdn-icons-png.flaticon.com/512/3063/3063822.png"} className="w-full h-full object-contain" alt="store" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{slot.admin_users?.store_name || "Loja Parceira"}</p>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none group-hover:text-primary transition-colors truncate">{slot.title}</h3>
                            </div>
                        </div>

                        {slot.admin_users?.store_address && (
                            <div className="mb-8 bg-white/5 border border-white/10 rounded-3xl p-5 flex items-center gap-4 group/addr hover:bg-white/10 transition-all">
                                <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                    <Icon name="location_on" className="text-xl" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em] mb-0.5">Local de Coleta</p>
                                    <p className="text-xs font-bold text-white leading-tight">{slot.admin_users.store_address}</p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Horário Previsto</p>
                                <p className="text-[11px] font-black text-white uppercase italic">{slot.working_hours}</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Status</p>
                                <div className="flex items-center gap-2">
                                    <div className="size-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <p className="text-[11px] font-black text-green-500 uppercase italic">Aberta</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 mb-10">
                            <p className="text-xs font-medium text-white/60 leading-relaxed italic border-l-2 border-primary/20 pl-4">
                                {slot.description}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => {
                                    if (slot.admin_users?.store_phone) {
                                        window.open(`https://wa.me/55${slot.admin_users.store_phone.replace(/\D/g, '')}`, '_blank');
                                    } else {
                                        alert("Contato não disponível");
                                    }
                                }}
                                className="h-16 bg-emerald-500 text-slate-900 font-black text-xs uppercase tracking-[0.2em] italic rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 w-full"
                            >
                                <Icon name="chat" className="text-xl" />
                                Falar com Lojista no WhatsApp
                            </button>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => {
                                        const declinedIds = JSON.parse(localStorage.getItem('Izi_declined_slots') || '[]');
                                        localStorage.setItem('Izi_declined_slots', JSON.stringify([...declinedIds, slot.id]));
                                        setDedicatedSlots(prev => prev.filter(s => s.id !== slot.id));
                                        alert('Vaga ignorada. Ela não aparecerá mais para você.');
                                    }}
                                    className="h-16 bg-white/5 text-rose-500 font-black text-[10px] uppercase tracking-widest italic rounded-2xl border border-white/5 hover:bg-rose-500/10 transition-all active:scale-95 flex items-center justify-center gap-3"
                                >
                                    <Icon name="close" className="text-lg" />
                                    Ignorar
                                </button>
                                <button 
                                    onClick={() => alert('Parabéns! Sua candidatura para esta vaga dedicada foi enviada. O lojista entrará em contato em breve!')}
                                    className="h-16 bg-primary text-background font-black text-[10px] uppercase tracking-widest italic rounded-2xl shadow-[0_0_30px_rgba(0,245,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Icon name="check_circle" className="text-lg" />
                                    Aceitar Missão
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );

    const renderProfileView = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-6 space-y-12 pt-10 pb-20 flex flex-col items-center page-transition">
            <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full group-hover:bg-primary/40 transition-all opacity-50"></div>
                <div className="relative size-48 rounded-[60px] bg-gradient-to-br from-primary via-secondary to-accent p-1 rotate-3 group-hover:rotate-0 transition-all duration-700 shadow-5xl">
                    <div className="w-full h-full rounded-[57px] bg-background bg-cover bg-center border-4 border-background" style={{ backgroundImage: "url('https://api.dicebear.com/7.x/avataaars/svg?seed=Felix')" }}></div>
                </div>
                <div className="absolute -bottom-6 -right-6 size-20 bg-accent text-background rounded-3xl flex items-center justify-center border-[10px] border-background shadow-3xl rotate-12 group-hover:rotate-0 transition-transform">
                    <Icon name="verified" className="text-3xl" fill />
                </div>
            </div>

            <div className="text-center space-y-4">
                <div className="space-y-1">
                    <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{driverName}</h2>
                    <p className="text-[12px] font-black text-primary uppercase tracking-[0.8em] mt-2 italic shadow-lg shadow-primary/10 border-b border-primary/20 pb-2">Piloto de Elite Izi</p>
                </div>
                <div className="flex gap-4 justify-center pt-2">
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                        <Icon name="star" className="text-accent text-sm" fill />
                        <span className="text-xs font-black text-white">4.98</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                        <Icon name="timer" className="text-secondary text-sm" />
                        <span className="text-xs font-black text-white">1.2k Horas</span>
                    </div>
                </div>
            </div>

            <div className="w-full grid grid-cols-1 gap-5 mt-4">
                {[
                    { l: 'Centro de Frota Operacional', i: 'local_taxi', c: 'text-primary' },
                    { l: 'Protocolos de Suporte HUD', i: 'support_agent', c: 'text-secondary' },
                    { l: 'Credenciais de Autonome', i: 'quick_reference', c: 'text-accent' },
                    { l: 'Configurações do Terminal', i: 'settings_cinematic_blur', c: 'text-white' },
                ].map((item, i) => (
                    <button key={i} className="glass-card p-8 rounded-[45px] flex items-center justify-between group hover:bg-white/10 transition-all text-left border-white/5 relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-transparent via-current to-transparent opacity-20" style={{ color: `var(--color-${item.c.replace('text-', '')})` }}></div>
                        <div className="flex items-center gap-6">
                            <div className={`size-16 rounded-[24px] bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/10 ${item.c}`}>
                                <Icon name={item.i} className="text-3xl" />
                            </div>
                            <span className="font-black text-white text-lg italic uppercase tracking-tighter leading-tight max-w-[180px]">{item.l}</span>
                        </div>
                        <Icon name="chevron_right" className="text-white/10 group-hover:text-primary transition-colors hover:translate-x-1 transition-transform" />
                    </button>
                ))}
            </div>

            <button
                onClick={handleLogout}
                className="w-full h-24 border-2 border-red-500/20 text-red-500 rounded-[45px] font-black uppercase tracking-[0.6em] italic text-[11px] mt-12 mb-10 hover:bg-red-500/5 transition-all active:scale-95 shadow-2xl"
            >
                Encerrar Sessão Terminal
            </button>
        </motion.div>
    );

    const renderLoginView = () => {
        if (authInitLoading) {
            return (
                <div className="h-screen w-full flex items-center justify-center bg-background">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                </div>
            );
        }

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-screen w-full flex flex-col items-center justify-center px-8 relative overflow-hidden bg-background"
            >
                <div className="absolute top-[-10%] left-[-10%] size-96 bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] size-96 bg-purple-600/10 blur-[120px] rounded-full animate-pulse"></div>

                <div className="w-full max-w-md space-y-10 relative z-10">
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center size-20 glass-card rounded-3xl border-white/10 text-primary mb-4 shadow-2xl">
                            <Icon name="two_wheeler" className="text-5xl" />
                        </div>
                        <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">
                            Terminal <span className="text-primary">Izi</span>
                        </h1>
                        <p className="text-xs font-black text-white/40 uppercase tracking-[0.6em] italic">
                            {authMode === 'login' ? 'Autenticação do Entregador' : 'Cadastro de Novo Piloto'}
                        </p>
                    </div>

                    {authError && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/30 rounded-2xl px-5 py-3 text-red-400 text-xs font-bold text-center">
                            {authError}
                        </motion.div>
                    )}

                    <div className="space-y-5">
                        {authMode === 'register' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Nome Completo</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-5 flex items-center text-primary/40 group-focus-within:text-primary transition-colors">
                                            <Icon name="badge" className="text-xl" />
                                        </div>
                                        <input
                                            type="text"
                                            value={authName}
                                            onChange={(e) => setAuthName(e.target.value)}
                                            placeholder="Seu nome completo"
                                            className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/5 rounded-[25px] text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-primary/30 focus:bg-white/[0.06] transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Telefone (WhatsApp)</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-5 flex items-center text-primary/40 group-focus-within:text-primary transition-colors">
                                            <Icon name="phone" className="text-xl" />
                                        </div>
                                        <input
                                            type="tel"
                                            value={authPhone}
                                            onChange={(e) => setAuthPhone(e.target.value)}
                                            placeholder="(11) 99999-9999"
                                            className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/5 rounded-[25px] text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-primary/30 focus:bg-white/[0.06] transition-all"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Tipo de Veículo</label>
                                    <div className="flex gap-3">
                                        {([
                                            { value: 'mototaxi', label: 'Moto', icon: 'two_wheeler' },
                                            { value: 'carro', label: 'Carro', icon: 'directions_car' },
                                            { value: 'bicicleta', label: 'Bike', icon: 'pedal_bike' },
                                        ] as const).map(v => (
                                            <button
                                                key={v.value}
                                                type="button"
                                                onClick={() => setAuthVehicle(v.value)}
                                                className={`flex-1 h-16 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all ${authVehicle === v.value ? 'bg-primary/10 border-primary/40 text-primary' : 'bg-white/[0.03] border-white/5 text-white/30 hover:bg-white/[0.06]'}`}
                                            >
                                                <Icon name={v.icon} className="text-xl" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center text-primary/40 group-focus-within:text-primary transition-colors">
                                    <Icon name="mail" className="text-xl" />
                                </div>
                                <input
                                    type="email"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    placeholder="seuemail@exemplo.com"
                                    className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/5 rounded-[25px] text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-primary/30 focus:bg-white/[0.06] transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] ml-4 italic">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-5 flex items-center text-primary/40 group-focus-within:text-primary transition-colors">
                                    <Icon name="key" className="text-xl" />
                                </div>
                                <input
                                    type="password"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/5 rounded-[25px] text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-primary/30 focus:bg-white/[0.06] transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <button
                            onClick={authMode === 'login' ? handleAuthLogin : handleAuthRegister}
                            disabled={authLoading}
                            className="w-full h-20 bg-primary text-background font-black text-lg italic tracking-[0.3em] rounded-[30px] shadow-3xl shadow-primary/30 active:scale-95 transition-all uppercase flex items-center justify-center gap-4 group disabled:opacity-50"
                        >
                            {authLoading ? (
                                <div className="w-6 h-6 border-3 border-background/20 border-t-background rounded-full animate-spin"></div>
                            ) : authMode === 'login' ? (
                                <>Conectar <Icon name="login" className="group-hover:translate-x-1 transition-transform" /></>
                            ) : (
                                <>Criar Conta <Icon name="person_add" className="group-hover:translate-x-1 transition-transform" /></>
                            )}
                        </button>

                        <button
                            onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }}
                            className="w-full h-14 glass-card bg-white/5 text-white/40 font-black text-[10px] uppercase tracking-[0.4em] italic rounded-2xl hover:text-white hover:bg-white/10 transition-all"
                        >
                            {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-10 text-center">
                    <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.4em]">Izi v5.0 • Autenticação Segura</p>
                </div>
            </motion.div>
        );
    };

    const BottomNav = () => (
        <nav className="fixed bottom-0 left-0 right-0 h-24 bg-slate-950/80 backdrop-blur-2xl border-t border-white/5 px-6 flex items-center justify-between z-50">
            {[
                { id: 'dashboard', icon: 'grid_view' },
                { id: 'history', icon: 'history' },
                { id: 'dedicated', icon: 'stars' },
                { id: 'earnings', icon: 'payments' },
                { id: 'profile', icon: 'person' },
            ].map((item) => (
                <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id as any)}
                    className={`relative size-12 flex items-center justify-center transition-all ${activeTab === item.id ? 'text-primary scale-110' : 'text-white/20 hover:text-white/40'}`}
                >
                    <Icon name={item.id === 'dedicated' ? 'stars' : item.icon} fill={activeTab === item.id} />
                    {activeTab === item.id && (
                        <motion.div layoutId="nav-glow" className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
                    )}
                </button>
            ))}
        </nav>
    );

    const renderActiveMissionView = () => {
        if (!activeMission) return null;
        const details = getTypeDetails(activeMission.type);
        const isMobility = activeMission.type === 'mototaxi' || activeMission.type === 'car_ride';

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-background flex flex-col font-display overflow-hidden">
                {/* HUD Header */}
                <div className="p-6 bg-slate-950/50 backdrop-blur-3xl border-b border-white/5 flex items-center justify-between z-10">
                    <div className="flex items-center gap-5">
                        <div className={`size-14 rounded-2xl ${details.bg} ${details.color} flex items-center justify-center border border-current/20 shadow-lg`}>
                            <Icon name="satellite_alt" className="text-3xl animate-pulse" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-1 italic">Sistema Operacional</p>
                            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Missão Em Rota</h2>
                        </div>
                    </div>
                    <button 
                        onClick={() => setShowHUD(!showHUD)}
                        className={`size-12 rounded-xl flex items-center justify-center transition-all ${showHUD ? 'bg-primary text-slate-950' : 'bg-white/5 text-white/40'}`}
                    >
                        <Icon name="view_in_ar" fill={showHUD} />
                    </button>
                </div>

                <div className="flex-1 relative">
                    {/* Simulated Navigation HUD */}
                    <div className="absolute inset-0 bg-[#020617] flex items-center justify-center">
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,217,0,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,217,0,0.05)_2px,transparent_2px)] bg-[size:40px_40px]"></div>
                        <div className="relative">
                            <div className="size-64 border border-primary/20 rounded-full animate-ping opacity-20"></div>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <Icon name="navigation" className="text-5xl text-primary animate-bounce" />
                                <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-4">Calculando Vetor...</p>
                            </div>
                        </div>
                    </div>

                    {/* HUD Overlay Elements */}
                    <AnimatePresence>
                        {showHUD && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-x-6 top-6 z-20 space-y-4">
                                <div className="glass-card p-6 rounded-[30px] border-primary/20 flex justify-between items-center bg-slate-900/80 backdrop-blur-md">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Compensação</p>
                                        <p className="text-2xl font-black text-primary italic">R$ {activeMission.price.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">ETA</p>
                                        <p className="text-2xl font-black text-white italic">4 MIN</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Controls Footer */}
                    <div className="absolute bottom-10 left-6 right-6 space-y-5">
                         <div className="glass-card p-8 rounded-[45px] border-white/5 space-y-6 shadow-4xl aura-border bg-slate-950/90 backdrop-blur-xl">
                            <div className="flex flex-col gap-2">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] ml-2 italic">Destino Final</p>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-sm font-black text-white uppercase italic truncate">{activeMission.destination}</p>
                                </div>
                            </div>
                            
                            <div className="flex gap-4">
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(activeMission.destination)}`, '_blank')}
                                    className="flex-1 h-16 rounded-[24px] bg-white/5 text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 border border-white/10 hover:bg-white/10 transition-all"
                                >
                                    <Icon name="map" className="text-primary text-xl" /> GPS EXTERNO
                                </button>
                                <button
                                    onClick={() => alert("SOS ACIONADO! Transmitindo telemetria e posição atual para central de comando...")}
                                    className="size-16 rounded-[24px] bg-rose-600/20 text-rose-500 flex items-center justify-center border border-rose-600/30 active:scale-95 transition-all shadow-[0_0_20px_rgba(225,29,72,0.2)]"
                                >
                                    <Icon name="emergency" fill />
                                </button>
                            </div>

                            <button 
                                onClick={handleComplete}
                                className="w-full h-20 bg-gradient-to-r from-primary to-orange-500 text-background font-black text-base italic tracking-[0.3em] rounded-[30px] shadow-3xl shadow-primary/20 active:scale-95 transition-all uppercase flex items-center justify-center gap-4"
                            >
                                {isMobility ? 'CONCLUIR MISSÃO' : 'FINALIZAR ENTREGA'} <Icon name="check_circle" className="text-2xl" fill />
                            </button>
                         </div>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderSOS = () => (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[200] bg-rose-600 flex flex-col items-center justify-center p-8 text-center page-transition">
            <div className="size-32 bg-white/20 rounded-full flex items-center justify-center mb-10 animate-pulse">
                <Icon name="emergency_share" className="text-6xl text-white" />
            </div>
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter mb-4">MODO SOS ATIVADO</h1>
            <p className="text-white/80 font-bold text-lg mb-12 max-w-xs uppercase tracking-widest leading-tight">Sua localização está sendo compartilhada com a central e outros pilotos Elite próximos.</p>
            
            <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
                <button 
                    onClick={() => { window.open('tel:190'); setIsSOSActive(false); }}
                    className="h-24 bg-white text-rose-600 rounded-[35px] flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all"
                >
                    <Icon name="local_police" className="text-3xl" fill />
                    <span className="text-2xl font-black uppercase italic tracking-tighter">Ligar 190</span>
                </button>
                <button 
                    onClick={() => { alert("Pedido de apoio mecânico enviado."); setIsSOSActive(false); }}
                    className="h-24 bg-white/20 border-2 border-white/20 text-white rounded-[35px] flex items-center justify-center gap-4 active:scale-95 transition-all"
                >
                    <Icon name="build" className="text-3xl" />
                    <span className="text-2xl font-black uppercase italic tracking-tighter">Mecânico</span>
                </button>
                <button 
                    onClick={() => setIsSOSActive(false)}
                    className="mt-6 text-white/60 font-black uppercase tracking-[0.3em] italic text-sm"
                >
                    CANCELAR
                </button>
            </div>
        </motion.div>
    );

    return (
        <div className="w-full h-[100dvh] bg-background font-sans overflow-hidden relative">
            {!isAuthenticated && authInitLoading ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-950">
                    <div className="size-24 bg-primary/20 rounded-full mb-8 flex items-center justify-center animate-pulse">
                        <Icon name="bolt" className="text-5xl text-primary" fill />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Izi Protocol</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Inicializando Terminal...</p>
                    </div>
                </div>
            ) : !isAuthenticated ? (
                renderLoginView()
            ) : (
                <>
                    <AnimatePresence mode="wait">
                        {isSOSActive ? renderSOS() : (
                            <div className="flex-1 flex flex-col h-full overflow-y-auto no-scrollbar">
                                {renderActiveMissionView()}
                                {renderNavigationDrawer()}
                                {renderHeader()}
                                
                                <main className="flex-1 pb-32">
                                    {activeTab === 'dashboard' && renderDashboard()}
                                    {activeTab === 'history' && renderHistoryView()}
                                    {activeTab === 'earnings' && renderEarningsView()}
                                    {activeTab === 'profile' && renderProfileView()}
                                    {activeTab === 'dedicated' && renderDedicatedView()}
                                </main>

                                {/* SOS Floating Button */}
                                {!activeMission && (
                                    <motion.button
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        whileTap={{ scale: 0.8 }}
                                        onClick={() => setIsSOSActive(true)}
                                        className="fixed bottom-32 right-6 size-16 bg-rose-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(225,29,72,0.4)] z-[60] border-4 border-slate-950"
                                    >
                                        <Icon name="emergency" className="text-white text-3xl animate-pulse" />
                                    </motion.button>
                                )}

                                <BottomNav />
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </div>
    );
}

export default App;
