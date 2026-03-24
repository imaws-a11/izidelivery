import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { playIziSound } from './lib/iziSounds';
import { toast, toastSuccess, toastError, showConfirm } from './lib/useToast';
import { BespokeIcons } from './lib/BespokeIcons';
import { GoogleMap, useJsApiLoader, Marker, DirectionsService, DirectionsRenderer } from '@react-google-maps/api';


const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    styles: [
        { elementType: "geometry", stylers: [{ color: "#f0ebe3" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#523735" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f1ee" }] },
        { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#c9b2a6" }] },
        { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
        { featureType: "poi", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
        { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#93817c" }] },
        { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#a5b076" }] },
        { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#447530" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#f8c967" }] },
        { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
        { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#fafafb" }] },
        { featureType: "road.arterial", elementType: "geometry.stroke", stylers: [{ color: "#ff8c00" }] },
        { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
        { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
        { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#e98d58" }] },
        { featureType: "road.highway.controlled_access", elementType: "geometry.stroke", stylers: [{ color: "#db8555" }] },
        { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#806b63" }] },
        { featureType: "transit", elementType: "geometry", stylers: [{ color: "#dde9d0" }] },
        { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
        { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#dfd2ae" }] },
        { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#b9d3c2" }] },
        { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#92998d" }] }
    ]
};

function Icon({ name, className = "", size = 20, ...props }: any) {
  const icons: Record<string, any> = {
    'grid_view': BespokeIcons.Home,
    'stars': BespokeIcons.Star,
    'event': BespokeIcons.Clock,
    'history': BespokeIcons.History,
    'payments': BespokeIcons.Wallet,
    'person': BespokeIcons.User,
    'menu': BespokeIcons.Menu,
    'star': BespokeIcons.StarFilled,
    'account_balance_wallet': BespokeIcons.Wallet,
    'package_2': BespokeIcons.Bag,
    'two_wheeler': BespokeIcons.Motorcycle,
    'directions_car': BespokeIcons.Car,
    'local_shipping': BespokeIcons.Truck,
    'schedule': BespokeIcons.Clock,
    'location_on': BespokeIcons.Pin,
    'check_circle': BespokeIcons.Check,
    'verified': BespokeIcons.Check,
    'chat': BespokeIcons.Support,
    'power_off': BespokeIcons.Logout,
    'radar': BespokeIcons.Bolt,
    'check': BespokeIcons.Check,
    'close': BespokeIcons.X,
    'analytics': BespokeIcons.Coins,
    'today': BespokeIcons.Clock,
    'route': BespokeIcons.Map,
    'military_tech': BespokeIcons.Shield,
    'event_available': BespokeIcons.Check,
    'history_edu': BespokeIcons.History,
    'sentiment_dissatisfied': BespokeIcons.Help,
    'satellite_alt': BespokeIcons.Map,
    'navigation': BespokeIcons.Pin,
    'map': BespokeIcons.Map,
    'emergency': BespokeIcons.Help,
    'moped': BespokeIcons.Motorcycle,
    'chevron_right': BespokeIcons.ChevronRight,
  };

  const IconComp = icons[name] || BespokeIcons.Help;
  return <IconComp size={size} className={className} />;
}

type View = 'dashboard' | 'history' | 'earnings' | 'profile' | 'active_mission' | 'dedicated' | 'scheduled' | 'sos';
type ServiceType = 'package' | 'mototaxi' | 'car_ride' | string;

interface Order {
    id: string;
    realId: string;
    type: ServiceType;
    origin: string;
    destination: string;
    price: number;
    customer: string;
    scheduled_at?: string;
    title?: string;
    distance?: string;
    time?: string;
    rating? : number;
    status? : string;
    pickup_lat? : number;
    pickup_lng? : number;
    delivery_lat? : number;
    delivery_lng? : number;
}
function IziRealTimeMap({ driverCoords, destCoords, destAddress }: any) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "AIzaSyBi3EJ41-Kh7-ZXjNQ9K1d9AqmoD8UNiO8"
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [isNavMode, setIsNavMode] = useState(true);
  const lastDestRef = useRef<string>('');

  // Resolver destino: coordenadas OU endereço texto
  const resolvedDest = (destCoords?.lat && destCoords?.lng) ? destCoords : (destAddress || null);

  // Calcular rota: imediato na 1a vez e ao mudar destino, depois a cada 30s
  useEffect(() => {
    if (!isLoaded || !driverCoords || !resolvedDest) return;
    
    const calcRoute = () => {
      const service = new google.maps.DirectionsService();
      service.route(
        {
          origin: driverCoords,
          destination: resolvedDest,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          }
        }
      );
    };

    // Recalcular imediatamente se o destino mudou
    const destKey = typeof resolvedDest === 'string' ? resolvedDest : `${resolvedDest.lat},${resolvedDest.lng}`;
    if (destKey !== lastDestRef.current) {
      lastDestRef.current = destKey;
      calcRoute();
    }

    // Recalcular a cada 30s para atualizar com a posição do motorista
    const interval = setInterval(calcRoute, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, driverCoords, resolvedDest]);

  if (!isLoaded || !driverCoords) return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <Icon name="radar" className="text-primary text-4xl" />
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Sincronizando GPS...</p>
        </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={isNavMode ? driverCoords : undefined}
        zoom={16}
        options={mapOptions}
      >
        <Marker 
          position={driverCoords} 
          icon={{
            url: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png',
            scaledSize: new google.maps.Size(40, 40)
          }}
        />
        
        {directions ? (
          <DirectionsRenderer
            directions={directions}
            options={{
              polylineOptions: {
                strokeColor: "#ffd700",
                strokeWeight: 6,
                strokeOpacity: 0.8
              },
              suppressMarkers: false
            }}
          />
        ) : (
          destCoords && <Marker position={destCoords} />
        )}
      </GoogleMap>

      {/* Botão para Sair do Modo de Rota Ativa (Recentralizar) */}
      <button 
        onClick={() => setIsNavMode(!isNavMode)}
        className={`absolute top-6 right-6 z-50 size-14 rounded-2xl flex items-center justify-center border shadow-2xl transition-all active:scale-90 ${isNavMode ? 'bg-primary text-slate-950 border-white/20' : 'bg-slate-900/80 text-white border-white/10 backdrop-blur-md'}`}
        title={isNavMode ? 'Mudar para Mapa Livre' : 'Voltar para Navegação'}
      >
        <span className="material-symbols-outlined text-2xl">
          {isNavMode ? 'explore' : 'near_me'}
        </span>
      </button>

      {!isNavMode && (
        <div className="absolute top-24 right-6 z-50 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-right-4">
          Modo Mapa Livre Ativo
        </div>
      )}
    </div>
  );
}

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [driverId, setDriverId] = useState<string | null>(null);
    const [driverCoords, setDriverCoords] = useState<{lat: number, lng: number} | null>(null);
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
    const [activeTab, setActiveTab] = useState<View>(() => {
        const saved = localStorage.getItem('Izi_active_mission');
        return saved ? 'active_mission' : 'dashboard';
    });
    const [isOnline, setIsOnline] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [filter, setFilter] = useState<ServiceType | 'all'>('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [dedicatedSlots, setDedicatedSlots] = useState<any[]>([]);
    const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
    const [history, setHistory] = useState<Order[]>([]);
    const [stats, setStats] = useState({ balance: 0, today: 0, count: 0, level: 1, xp: 0, nextXp: 100 });

    const [activeMission, setActiveMission] = useState<Order | null>(() => {
        const saved = localStorage.getItem('Izi_active_mission');
        return saved ? JSON.parse(saved) : null;
    });
    const activeMissionRef = useRef(activeMission);
    useEffect(() => { activeMissionRef.current = activeMission; }, [activeMission]);

    // Sistema de Monitoramento de GPS em Tempo Real
    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        // Permite GPS se estiver ONLINE ou em uma MISSÃO ATIVA
        if (!isOnline && !activeMission) return;
        
        const updateLocation = async (lat: number, lng: number) => {
          setDriverCoords({ lat, lng });
          await supabase.from('drivers_delivery').update({ lat, lng }).eq('id', driverId);
        };

        // Obter posição IMEDIATA para agilizar o mapa
        navigator.geolocation.getCurrentPosition(
            (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
            (err) => console.log("Init GPS Error (ignoring):", err),
            { enableHighAccuracy: true }
        );

        const watchId = navigator.geolocation.watchPosition(
            (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
            (err) => console.error("GPS Error:", err),
            { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );
        
        return () => navigator.geolocation.clearWatch(watchId);
    }, [isAuthenticated, driverId, isOnline, activeMission]);
    useEffect(() => {
        const ensureDriverRecord = async (user: any) => {
            const { data } = await supabase.from('drivers_delivery').select('name, lat, lng').eq('id', user.id).maybeSingle();
            if (!data) {
                await supabase.from('drivers_delivery').upsert({
                    id: user.id, name: user.user_metadata?.name || 'Entregador Izi',
                    email: user.email, is_online: true, is_active: true, vehicle_type: 'mototaxi'
                });
            } else {
                if (data.name) setDriverName(data.name);
                if (data.lat && data.lng) setDriverCoords({ lat: data.lat, lng: data.lng });
            }
        };
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) { setDriverId(session.user.id); setIsAuthenticated(true); ensureDriverRecord(session.user); }
            setAuthInitLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) { setDriverId(session.user.id); setIsAuthenticated(true); ensureDriverRecord(session.user); }
            else { setDriverId(null); setIsAuthenticated(false); setDriverName('Entregador'); }
        });
        return () => subscription.unsubscribe();
    }, []);

    const handleAuthLogin = async () => {
        setAuthLoading(true); setAuthError('');
        try {
            const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
            if (error) throw error;
        } catch (e: any) {
            setAuthError(e.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : e.message);
        } finally { setAuthLoading(false); }
    };

    const handleAuthRegister = async () => {
        setAuthLoading(true); setAuthError('');
        if (!authName.trim()) { setAuthError('Informe seu nome completo.'); setAuthLoading(false); return; }
        if (authPassword.length < 6) { setAuthError('A senha deve ter no mínimo 6 caracteres.'); setAuthLoading(false); return; }
        try {
            const { data, error } = await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { name: authName } } });
            if (error) throw error;
            if (!data.user) throw new Error('Erro ao criar conta.');
            await supabase.from('drivers_delivery').upsert({ id: data.user.id, name: authName.trim(), is_online: false, vehicle_type: authVehicle, phone: authPhone || null, rating: 5.0, is_active: true });
            setDriverName(authName.trim());
        } catch (e: any) {
            setAuthError(e.message.includes('already registered') ? 'Este email já está cadastrado. Faça login.' : e.message);
        } finally { setAuthLoading(false); }
    };

    useEffect(() => {
        if (activeMission) { localStorage.setItem('Izi_active_mission', JSON.stringify(activeMission)); }
        else { localStorage.removeItem('Izi_active_mission'); }
    }, [activeMission]);

    useEffect(() => {
        if (!driverId || !isAuthenticated) return;
        const savedOnline = localStorage.getItem('Izi_online') === 'true';
        if (savedOnline !== isOnline) setIsOnline(savedOnline);
    }, [driverId, isAuthenticated]);

    useEffect(() => {
        if (!driverId || !isAuthenticated) return;
        localStorage.setItem('Izi_online', isOnline.toString());
        supabase.from('drivers_delivery').update({ is_online: isOnline }).eq('id', driverId);
    }, [isOnline, isAuthenticated, driverId]);

    useEffect(() => {
        if (!driverId || !isAuthenticated) return;
        const savedMission = localStorage.getItem('Izi_active_mission');
        if (savedMission) { setActiveTab('active_mission'); return; }
        supabase.from('orders_delivery').select('id, status, service_type, pickup_address, delivery_address, total_price')
            .eq('driver_id', driverId).order('created_at', { ascending: false }).limit(10)
            .then(({ data: orders, error: qErr }) => {
                if (qErr) { console.error('Erro busca missão:', qErr.message); return; }
                const activeOrder = orders?.find((o: any) => ['a_caminho', 'saiu_para_entrega', 'em_rota', 'no_local'].includes(o.status));
                if (activeOrder) {
                    const mission: any = { id: activeOrder.id, realId: activeOrder.id, type: activeOrder.service_type || 'delivery', origin: activeOrder.pickup_address || 'Origem', destination: activeOrder.delivery_address || 'Destino', price: activeOrder.total_price || 0, status: activeOrder.status, customer: 'Cliente Izi' };
                    setActiveMission(mission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                    setActiveTab('active_mission');
                }
            });
    }, [driverId, isAuthenticated]);

    // Canal separado para vagas dedicadas — funciona independente do status online
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchDedicatedSlotsRealtime = async () => {
            const declinedIds = JSON.parse(localStorage.getItem('Izi_declined_slots') || '[]');
            const { data } = await supabase.from('dedicated_slots_delivery').select('*, admin_users(store_name, store_logo, store_address, store_phone)').eq('is_active', true).order('created_at', { ascending: false });
            setDedicatedSlots((data || []).filter((s: any) => !declinedIds.includes(s.id)));
        };
        fetchDedicatedSlotsRealtime();
        const slotsChannel = supabase.channel('dedicated_slots_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dedicated_slots_delivery' }, fetchDedicatedSlotsRealtime)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dedicated_slots_delivery' }, (payload) => {
                const updated = payload.new as any;
                if (!updated.is_active) {
                    setDedicatedSlots(prev => prev.filter((s: any) => s.id !== updated.id));
                } else {
                    fetchDedicatedSlotsRealtime();
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'dedicated_slots_delivery' }, (payload) => {
                setDedicatedSlots(prev => prev.filter((s: any) => s.id !== (payload.old as any).id));
            })
            .subscribe();
        return () => { supabase.removeChannel(slotsChannel); };
    }, [isAuthenticated]);

    // Buscar agendamentos disponíveis e aceitos
    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        const fetchScheduled = async () => {
            const today = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('orders_delivery')
                .select('*, merchant_id')
                .not('scheduled_date', 'is', null)
                .in('status', ['pendente', 'agendado', 'a_caminho', 'preparando']).not('status', 'eq', 'novo')
                .gte('scheduled_date', today)
                .order('scheduled_date', { ascending: true })
                .order('scheduled_time', { ascending: true });

            if (data) setScheduledOrders(data);
        };

        fetchScheduled();

        // Realtime para agendamentos
        const scheduledChannel = supabase.channel('scheduled_orders_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_date) {
                    setScheduledOrders(prev => [...prev, o].sort((a, b) =>
                        new Date(a.scheduled_date + 'T' + (a.scheduled_time || '00:00')).getTime() -
                        new Date(b.scheduled_date + 'T' + (b.scheduled_time || '00:00')).getTime()
                    ));
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_date) {
                    if (['concluido', 'cancelado'].includes(o.status)) {
                        setScheduledOrders(prev => prev.filter(s => s.id !== o.id));
                    } else {
                        setScheduledOrders(prev => prev.map(s => s.id === o.id ? { ...s, ...o } : s));
                    }
                }
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                setScheduledOrders(prev => prev.filter(s => s.id !== (payload.old as any).id));
            })
            .subscribe();

        return () => { supabase.removeChannel(scheduledChannel); };
    }, [isAuthenticated, driverId]);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        const fetchOrders = async () => {
            const { data, error } = await supabase.from('orders_delivery').select('*').in('status', ['pendente', 'pronto', 'waiting_driver']).not('status', 'eq', 'novo').not('status', 'eq', 'waiting_merchant');
            if (error || !data) return;
            // Filtrar somente rejeições com menos de 5 segundos
            const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
            const now = Date.now();
            // Limpar rejeições expiradas (>5s)
            const cleanDeclined: Record<string, number> = {};
            Object.entries(declinedMap).forEach(([id, ts]) => {
                if (now - ts < 5000) cleanDeclined[id] = ts;
            });
            localStorage.setItem('Izi_declined_timed', JSON.stringify(cleanDeclined));
            setOrders(data.map((o: any) => ({ id: o.id.slice(0, 8).toUpperCase(), realId: o.id, type: o.service_type as ServiceType, origin: o.pickup_address, destination: o.delivery_address, price: o.total_price, customer: 'Cliente Izi' })).filter((o: any) => !cleanDeclined[o.realId]));
        };
        const fetchDedicatedSlots = async () => {
            const declinedIds = JSON.parse(localStorage.getItem('Izi_declined_slots') || '[]');
            const { data } = await supabase.from('dedicated_slots_delivery').select('*, admin_users(store_name, store_logo, store_address, store_phone)').eq('is_active', true).order('created_at', { ascending: false });
            setDedicatedSlots((data || []).filter((s: any) => !declinedIds.includes(s.id)));
        };
        fetchOrders(); fetchDedicatedSlots();

        // Polling a cada 5s para garantir que pedidos reapareçam após rejeição
        const pollInterval = setInterval(fetchOrders, 5000);
        
        const channel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new;
                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                if (!['pendente', 'pronto', 'waiting_driver'].includes(o.status) || (Date.now() - (declinedMap[o.id] || 0) < 5000)) return;
                playIziSound('driver');
                if (Notification.permission === 'granted') new Notification('🚀 Nova Missão Izi!', { body: `Coleta: ${o.pickup_address}`, icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' });
                setOrders(prev => {
                    if (prev.find(x => x.realId === o.id)) return prev;
                    return [{ id: o.id.slice(0, 8).toUpperCase(), realId: o.id, type: o.service_type, origin: o.pickup_address, destination: o.delivery_address, price: o.total_price, customer: 'Cliente Izi' }, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                const currentMission = activeMissionRef.current;
                
                // Se a missão ativa recebeu uma atualização do servidor, sincronizar o status
                if (currentMission && o.id === currentMission.id) {
                    if (o.status === 'pronto') {
                        playIziSound('driver');
                        toastSuccess('🔥 O Pedido está PRONTO para coleta!');
                        if (Notification.permission === 'granted') new Notification('📦 Pedido Pronto!', { body: 'O estabelecimento finalizou o preparo. Pode coletar!' });
                    }
                    // Sincronizar o status da missão ativa com o servidor
                    const updatedMission = { ...currentMission, status: o.status };
                    setActiveMission(updatedMission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(updatedMission));
                    return;
                }

                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                if (['pendente', 'pronto', 'waiting_driver'].includes(o.status) && !(Date.now() - (declinedMap[o.id] || 0) < 5000)) {
                    setOrders(prev => {
                        const isNew = !prev.find(x => x.realId === o.id);
                        if (isNew) {
                            // Tocar som quando um pedido novo aparece na lista (ex: lojista marcou como pronto)
                            playIziSound('driver');
                            if (Notification.permission === 'granted') new Notification('📦 Pedido Disponível!', { body: `Coleta: ${o.pickup_address}`, icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' });
                            return [{ id: o.id.slice(0, 8).toUpperCase(), realId: o.id, type: o.service_type, origin: o.pickup_address, destination: o.delivery_address, price: o.total_price, customer: 'Cliente Izi' }, ...prev];
                        }
                        return prev;
                    });
                } else if (!['pendente', 'pronto', 'waiting_driver'].includes(o.status) && (!currentMission || o.id !== currentMission.id)) {
                    setOrders(prev => prev.filter((order: any) => order.realId !== o.id));
                }
            })
            .subscribe();

        return () => { clearInterval(pollInterval); supabase.removeChannel(channel); };
    }, [isOnline, isAuthenticated, driverId]);

    // Função de sincronização manual
    const [isSyncing, setIsSyncing] = useState(false);
    const handleManualSync = async () => {
        setIsSyncing(true);
        try {
            // Limpar todas as rejeições para forçar pedidos a aparecerem
            localStorage.removeItem('Izi_declined_timed');
            const { data } = await supabase.from('orders_delivery').select('*').in('status', ['pendente', 'pronto', 'waiting_driver']);
            if (data) {
                setOrders(data.map((o: any) => ({ id: o.id.slice(0, 8).toUpperCase(), realId: o.id, type: o.service_type as ServiceType, origin: o.pickup_address, destination: o.delivery_address, price: o.total_price, customer: 'Cliente Izi' })));
            }
            toastSuccess('Sincronizado! ' + (data?.length || 0) + ' pedidos encontrados.');
        } catch { toastError('Erro ao sincronizar.'); }
        finally { setTimeout(() => setIsSyncing(false), 1000); }
    };



    const filteredOrders = useMemo(() => filter === 'all' ? orders : orders.filter((o: any) => o.type === filter), [filter, orders]);

    const handleAccept = async (order: Order) => {
        if (isAccepting) return;
        setIsAccepting(true);
        try {
            const targetId = order.realId || order.id;
            const { data: realOrder, error: findError } = await supabase.from('orders_delivery').select('id, status, pickup_lat, pickup_lng, delivery_lat, delivery_lng').eq('id', targetId).single();
            if (findError || !realOrder || !['pendente', 'pronto', 'waiting_driver'].includes(realOrder.status)) { toastError('Pedido indisponível ou já aceito.'); setOrders(prev => prev.filter((o: any) => o.id !== order.id)); return; }
            if (!driverId) { toastError('Sessão expirada. Faça login novamente.'); return; }
            const { error } = await supabase.from('orders_delivery').update({ status: 'a_caminho', driver_id: driverId }).eq('id', realOrder.id);
            if (error) { toastError('Erro ao aceitar corrida.'); return; }
            const mission = { ...order, ...realOrder, id: realOrder.id, realId: realOrder.id, status: 'a_caminho' };
            setActiveMission(mission);
            localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
            setOrders(prev => prev.filter((o: any) => o.realId !== order.realId));
            setActiveTab('active_mission');
        } catch { toastError('Erro ao aceitar pedido. Tente novamente.'); }
        finally { setIsAccepting(false); }
    };

    const handleDecline = (order: Order) => {
        // Rejeição temporária: salva com timestamp, pedido reaparece após 5s no próximo poll
        const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
        declinedMap[order.realId] = Date.now();
        localStorage.setItem('Izi_declined_timed', JSON.stringify(declinedMap));
        setOrders(prev => prev.filter((o: any) => o.realId !== order.realId));
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!activeMission) return;
        setIsAccepting(true); // Reusando loading state
        try {
            const { error } = await supabase.from('orders_delivery').update({ status: newStatus }).eq('id', activeMission.id);
            if (error) throw error;
            
            const updatedMission = { ...activeMission, status: newStatus };
            setActiveMission(updatedMission);
            localStorage.setItem('Izi_active_mission', JSON.stringify(updatedMission));
            
            if (newStatus === 'concluido') {
                setHistory(prev => [{ ...activeMission, id: activeMission.id.slice(0, 8).toUpperCase() }, ...prev]);
                setStats(prev => {
                    const bonusXp = 25 + (prev.level * 5); const newXp = prev.xp + bonusXp; const levelUp = newXp >= prev.nextXp;
                    if (levelUp) setTimeout(() => toast(`🎉 Nível ${prev.level + 1} desbloqueado!`), 500);
                    return { ...prev, balance: prev.balance + activeMission.price, today: prev.today + activeMission.price, count: prev.count + 1, xp: levelUp ? newXp - prev.nextXp : newXp, level: levelUp ? prev.level + 1 : prev.level, nextXp: levelUp ? prev.nextXp + 50 : prev.nextXp };
                });
                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
                toastSuccess('Entrega concluída! 🎉');
            } else {
                toastSuccess('Status atualizado!');
            }
        } catch (e: any) {
            toastError('Erro ao atualizar status: ' + e.message);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleLogout = async () => {
        if (!await showConfirm({ message: 'Deseja encerrar a sessão?' })) return;
        if (driverId) await supabase.from('drivers_delivery').update({ is_online: false }).eq('id', driverId);
        await supabase.auth.signOut();
        setIsMenuOpen(false); setIsOnline(false);
        localStorage.removeItem('Izi_online'); localStorage.removeItem('Izi_declined'); localStorage.removeItem('Izi_declined_timed'); localStorage.removeItem('Izi_active_mission');
    };

    const getTypeDetails = (type: ServiceType) => {
        switch (type) {
            case 'package': return { icon: 'package_2', color: 'text-primary', bg: 'bg-primary/10', label: 'Encomenda' };
            case 'mototaxi': return { icon: 'two_wheeler', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'MotoTaxi' };
            case 'car_ride': return { icon: 'directions_car', color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Carro' };
            default: return { icon: 'local_shipping', color: 'text-primary', bg: 'bg-primary/10', label: 'Entrega' };
        }
    };

    const renderHeader = () => (
        <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-3xl border-b border-white/5 shrink-0">
            <button onClick={() => setIsMenuOpen(true)} className="size-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-premium">
                <Icon name="menu" className="text-white" size={24} />
            </button>
            <div className="flex flex-col items-center">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-0.5">Terminal Operacional</span>
                <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Izi <span className="text-primary italic">Pilot</span></h1>
            </div>
            <button onClick={() => setIsOnline(!isOnline)} className={`flex items-center gap-2.5 px-4 py-2.5 rounded-[20px] border transition-all active:scale-90 ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10' : 'bg-red-500/10 border-red-500/20 text-red-400 shadow-lg shadow-red-500/10'}`}>
                <div className={`size-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
                <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Online' : 'Offline'}</span>
            </button>
        </header>
    );

    const renderNavigationDrawer = () => (
        <AnimatePresence>
            {isMenuOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-[100]" />
                    <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }} className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[320px] bg-[#030712] border-r border-white/5 z-[101] flex flex-col p-10 overflow-y-auto no-scrollbar shadow-premium">
                        <div className="flex items-center gap-5 mb-12 pb-10 border-b border-white/5">
                            <div className="size-16 rounded-[24px] bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5"><Icon name="person" size={32} className="text-primary" /></div>
                            <div>
                                <h3 className="text-lg font-black text-white tracking-tight">{driverName}</h3>
                                <div className="flex items-center gap-2 mt-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/5 w-fit"><Icon name="star" className="text-primary text-xs" /><span className="text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">Nível {stats.level}</span></div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[30px] p-6 mb-10 flex items-center justify-between shadow-inner">
                            <div><p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1">Saldo Total</p><p className="text-2xl font-black text-white tracking-tighter">R$ {stats.balance.toFixed(2).replace('.', ',')}</p></div>
                            <div className="size-12 bg-primary/20 rounded-2xl flex items-center justify-center"><Icon name="account_balance_wallet" size={24} className="text-primary" /></div>
                        </div>
                        <nav className="flex-1 space-y-2">
                            {[{ id: 'dashboard', label: 'Painel', icon: 'grid_view' }, { id: 'dedicated', label: 'Vagas Dedicadas', icon: 'stars' }, { id: 'scheduled', label: 'Agendamentos', icon: 'event', badge: scheduledOrders.length }, { id: 'history', label: 'Histórico', icon: 'history' }, { id: 'earnings', label: 'Financeiro', icon: 'payments' }, { id: 'profile', label: 'Meu Perfil', icon: 'person' }].map(item => (
                                <button key={item.id} onClick={() => { setActiveTab(item.id as any); setIsMenuOpen(false); }} className={`w-full flex items-center gap-5 px-5 py-4.5 rounded-[22px] transition-all text-left group ${activeTab === item.id ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                                    <div className="relative"><Icon name={item.icon} size={22} />{(item as any).badge > 0 && <span className="absolute -top-1.5 -right-1.5 size-5 bg-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#030712]">{(item as any).badge}</span>}</div><span className="text-sm font-black uppercase tracking-[0.1em]">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="pt-10 border-t border-white/5 space-y-6 mt-8">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Status Operacional</span>
                                <button onClick={() => setIsOnline(!isOnline)} className={`h-8 w-14 rounded-full relative transition-all duration-500 ${isOnline ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-white/10'}`}>
                                    <motion.div animate={{ x: isOnline ? 28 : 4 }} className="absolute top-1 size-6 bg-white rounded-full shadow-xl" />
                                </button>
                            </div>
                            <button onClick={handleLogout} className="w-full py-4.5 border border-red-500/20 text-red-500/60 rounded-[22px] text-[10px] font-black uppercase tracking-[0.3em] hover:bg-red-500/5 transition-all active:scale-95">Ejetar Sessão</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );

    const renderDashboard = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-24 pt-2">
            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 flex items-center justify-between">
                <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Nível Operacional</p>
                    <h3 className="text-2xl font-black text-white tracking-tight">{stats.level >= 10 ? 'Comandante' : stats.level >= 5 ? 'Veterano' : 'Soldado'}<span className="text-xs text-primary ml-2">Nív. {stats.level}</span></h3>
                    <div className="mt-3 h-1.5 w-40 bg-white/5 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.xp / stats.nextXp) * 100}%` }} className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" />
                    </div>
                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">{stats.xp}/{stats.nextXp} XP</p>
                </div>
                <div className="text-right space-y-2">
                    <div className="flex items-center gap-3 justify-end">
                        <div><p className="text-[8px] text-white/20 uppercase tracking-widest">Hoje</p><p className="text-sm font-black text-white">R$ {stats.today.toFixed(0)}</p></div>
                        <div><p className="text-[8px] text-white/20 uppercase tracking-widest">Corridas</p><p className="text-sm font-black text-primary">{stats.count}</p></div>
                    </div>
                </div>
            </div>

            {/* Vagas Dedicadas - Secao Principal */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Icon name="stars" className="text-primary text-sm" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Vagas Dedicadas</h2>
                        {dedicatedSlots.length > 0 && (
                            <span className="size-5 bg-primary text-slate-900 text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
                                {dedicatedSlots.length}
                            </span>
                        )}
                    </div>
                    {dedicatedSlots.length > 0 && (
                        <button onClick={() => setActiveTab('dedicated')} className="text-[9px] font-black text-primary uppercase tracking-widest">Ver todas</button>
                    )}
                </div>

                {dedicatedSlots.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-[28px] p-6 flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                            <Icon name="stars" className="text-white/20 text-xl" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">Nenhuma vaga disponível</p>
                            <p className="text-[10px] text-white/20 mt-0.5">Você será notificado quando surgirem novas vagas</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                        {dedicatedSlots.slice(0, 5).map((slot: any) => (
                            <motion.div
                                key={slot.id}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveTab('dedicated')}
                                className="min-w-[240px] bg-white/[0.04] border border-white/10 rounded-[28px] p-5 cursor-pointer shrink-0 hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="size-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden p-1 shrink-0">
                                        <img src={slot.admin_users?.store_logo || 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'} className="w-full h-full object-contain" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest truncate">{slot.admin_users?.store_name || 'Loja Parceira'}</p>
                                        <p className="text-sm font-black text-white truncate">{slot.title}</p>
                                    </div>
                                    <div className="size-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <Icon name="schedule" className="text-white/30 text-sm" />
                                            <span className="text-[10px] font-black text-white/50 uppercase">{slot.working_hours || 'Flexível'}</span>
                                        </div>
                                        <span className="text-sm font-black text-primary">R$ {parseFloat(slot.fee_per_day || 0).toFixed(0)}<span className="text-[9px] text-white/30">/dia</span></span>
                                    </div>
                                    {slot.admin_users?.store_address && (
                                        <div className="flex items-center gap-1.5">
                                            <Icon name="location_on" className="text-white/30 text-sm" />
                                            <span className="text-[10px] font-bold text-white/40 truncate">{slot.admin_users.store_address.split(',')[0]}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                        <div className="size-1.5 rounded-full bg-emerald-400" />
                                        Disponível
                                    </span>
                                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">Ver detalhes →</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Agendamentos */}
            <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                        <Icon name="event" className="text-blue-400 text-sm" />
                        <h2 className="text-sm font-black text-white uppercase tracking-widest">Agendamentos</h2>
                        {scheduledOrders.length > 0 && (
                            <span className="size-5 bg-blue-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {scheduledOrders.length}
                            </span>
                        )}
                    </div>
                </div>

                {scheduledOrders.length === 0 ? (
                    <div className="bg-white/[0.02] border border-white/5 border-dashed rounded-[28px] p-6 flex items-center gap-4">
                        <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                            <Icon name="event_available" className="text-white/20 text-xl" />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">Sem agendamentos</p>
                            <p className="text-[10px] text-white/20 mt-0.5">Novos pedidos agendados aparecerão aqui</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {scheduledOrders.map((order: any) => {
                            const isPending = (order.status === 'pendente' || order.status === 'agendado' || order.status === 'pronto') && order.status !== 'novo' && order.status !== 'waiting_merchant';
                            const isAccepted = order.driver_id === driverId;
                            const statusColor = isAccepted ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : isPending ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-white/40 bg-white/5 border-white/10';
                            const statusLabel = isAccepted ? 'Aceito por você' : isPending ? 'Disponível' : order.status;
                            return (
                                <motion.div
                                    key={order.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-white/[0.04] border border-white/10 rounded-[28px] p-5 space-y-4"
                                >
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Icon name="event" className="text-blue-400 text-sm" />
                                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                                                    {new Date(order.scheduled_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                    {order.scheduled_time && ` • ${order.scheduled_time.slice(0,5)}`}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-white truncate">{order.delivery_address}</p>
                                            <p className="text-[10px] text-white/30 truncate mt-0.5">{order.pickup_address}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className="text-base font-black text-primary">R$ {(order.total_price || 0).toFixed(2).replace('.', ',')}</p>
                                            <p className="text-[9px] text-white/30 uppercase">{order.service_type}</p>
                                        </div>
                                    </div>

                                    {/* Status e Acao */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColor}`}>
                                            {statusLabel}
                                        </span>
                                        {isPending && !isAccepted && (
                                            <button
                                                onClick={() => handleAccept({
                                                    id: order.id.slice(0, 8).toUpperCase(),
                                                    realId: order.id,
                                                    type: order.service_type as ServiceType,
                                                    title: 'Agendamento',
                                                    origin: order.pickup_address,
                                                    destination: order.delivery_address,
                                                    price: order.total_price,
                                                    distance: '---',
                                                    time: order.scheduled_time || 'Agendado',
                                                    customer: 'Cliente Izi',
                                                    rating: 5.0,
                                                    scheduled_at: order.scheduled_date
                                                })}
                                                disabled={isAccepting}
                                                className="bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest px-5 py-2.5 rounded-2xl flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                                            >
                                                <Icon name="check_circle" className="text-sm" />
                                                Aceitar
                                            </button>
                                        )}
                                        {isAccepted && (
                                            <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1.5">
                                                <Icon name="verified" className="text-sm" />
                                                Você aceitou esta corrida
                                            </span>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                {[{ id: 'all', label: 'Todos', icon: 'apps' }, { id: 'package', label: 'Pacotes', icon: 'package_2' }, { id: 'mototaxi', label: 'Moto', icon: 'two_wheeler' }, { id: 'car_ride', label: 'Carro', icon: 'directions_car' }].map(item => (
                    <button key={item.id} onClick={() => setFilter(item.id as any)} className={`flex items-center gap-2 px-5 py-3 rounded-2xl whitespace-nowrap transition-all shrink-0 ${filter === item.id ? 'bg-primary text-slate-900 font-black shadow-lg shadow-primary/20' : 'bg-white/[0.03] text-white/40 border border-white/5'}`}>
                        <Icon name={item.icon} className="text-base" /><span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>
                    </button>
                ))}
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2"><div className={`size-2 rounded-full ${isOnline ? 'bg-primary animate-ping' : 'bg-white/20'}`} /><h2 className="text-sm font-black text-white uppercase tracking-widest">{isOnline ? 'Chamadas' : 'Scanner Desativado'}</h2></div>
                    <div className="flex items-center gap-2">
                        <button onClick={handleManualSync} disabled={isSyncing} className="flex items-center gap-1.5 bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-xl active:scale-90 transition-all disabled:opacity-50" title="Sincronizar pedidos">
                            <span className={`material-symbols-outlined text-sm text-primary ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
                            <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">{isSyncing ? 'Sync...' : 'Sync'}</span>
                        </button>
                        <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{filteredOrders.length} disponíveis</span>
                    </div>
                </div>

                {!isOnline ? (
                    <div className="py-16 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-5 text-center">
                        <div className="size-16 rounded-[24px] bg-red-500/5 border border-red-500/10 flex items-center justify-center"><Icon name="power_off" className="text-red-400/40 text-3xl" /></div>
                        <div><p className="text-sm font-black text-white/30 uppercase tracking-widest">Você está offline</p><p className="text-[10px] text-white/20 uppercase tracking-widest mt-1">Ative o status para receber chamadas</p></div>
                        <button onClick={() => setIsOnline(true)} className="bg-primary text-slate-900 font-black px-8 py-3.5 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">Ficar Online</button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-16 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col items-center gap-4 text-center">
                        <div className="size-16 rounded-[24px] bg-primary/5 border border-primary/10 flex items-center justify-center"><Icon name="radar" className="text-primary/40 text-3xl" /></div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Aguardando novas chamadas...</p>
                    </div>
                ) : filteredOrders.map((order: any, i: number) => {
                    const details = getTypeDetails(order.type);
                    const isMobility = order.type === 'mototaxi' || order.type === 'car_ride';
                    return (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white/[0.03] border border-white/8 rounded-[32px] p-6 space-y-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`size-14 rounded-[20px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10`}><Icon name={details.icon} className="text-3xl" /></div>
                                    <div><p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${details.color}`}>{details.label}</p><h3 className="text-base font-black text-white">{isMobility ? 'Chamada de Passageiro' : 'Entrega de Pacote'}</h3></div>
                                </div>
                                <div className="text-right"><p className="text-2xl font-black text-primary">R$ {order.price.toFixed(0)}</p><p className="text-[8px] text-white/20 uppercase tracking-widest">Ganho estimado</p></div>
                            </div>
                            <div className="bg-black/20 rounded-[20px] p-4 space-y-3">
                                <div className="flex items-start gap-3"><div className="mt-1.5 size-2 rounded-full bg-white/30 shrink-0" /><div><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Coleta</p><p className="text-xs font-bold text-white/70 leading-tight">{order.origin}</p></div></div>
                                <div className="ml-[3px] h-4 w-[1px] bg-white/10" />
                                <div className="flex items-start gap-3"><div className="mt-1.5 size-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(255,217,0,0.6)]" /><div><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Entrega</p><p className="text-xs font-black text-white leading-tight">{order.destination}</p></div></div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => handleAccept(order)} disabled={isAccepting} className="flex-1 h-14 bg-primary text-slate-900 font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    {isAccepting ? <div className="size-4 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" /> : <><Icon name="check" className="text-lg" />{isMobility ? 'Aceitar Corrida' : 'Aceitar Coleta'}</>}
                                </button>
                                <button onClick={() => handleDecline(order)} className="size-14 bg-white/5 text-red-400 border border-red-500/10 rounded-2xl flex items-center justify-center active:scale-95 transition-all"><Icon name="close" className="text-xl" /></button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </motion.div>
    );

    const renderHistoryView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Histórico</p><h2 className="text-3xl font-black text-white tracking-tight mt-1">Missões Concluídas</h2></div>
            {history.length === 0 ? (
                <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-4 text-center">
                    <Icon name="history_edu" className="text-4xl text-white/10" /><p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhum registro ainda</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {history.map((order: any, i: number) => {
                        const details = getTypeDetails(order.type);
                        return (
                            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/[0.03] border border-white/5 rounded-[24px] p-5 flex items-center gap-4">
                                <div className={`size-12 rounded-[18px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10 shrink-0`}><Icon name={details.icon} className="text-2xl" /></div>
                                <div className="flex-1 min-w-0"><p className="text-sm font-black text-white truncate">{order.destination.split(',')[0]}</p><div className="flex items-center gap-1.5 mt-0.5"><Icon name="verified" className="text-emerald-400 text-xs" /><span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Concluída</span></div></div>
                                <div className="text-right shrink-0"><p className="text-lg font-black text-white">R$ {order.price.toFixed(0)}</p><p className="text-[8px] font-black text-white/20 uppercase">#{order.id}</p></div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );

    const renderEarningsView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Financeiro</p><h2 className="text-3xl font-black text-white tracking-tight mt-1">Rendimentos</h2></div>
            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[40px] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Icon name="account_balance_wallet" className="text-[120px] text-primary -rotate-12" /></div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">Saldo Disponível</p>
                <p className="text-5xl font-black text-white tracking-tight mt-2">R$ {stats.balance.toFixed(2).replace('.', ',')}</p>
                <div className="flex gap-4 mt-6">
                    <button className="flex-1 bg-primary text-slate-900 font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all py-3">Sacar via PIX</button>
                    <button className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center active:scale-90 transition-all py-3 px-4"><Icon name="analytics" className="text-white/40 text-xl" /></button>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Hoje', value: `R$ ${stats.today.toFixed(0)}`, icon: 'today', color: 'text-primary' }, { label: 'Corridas', value: stats.count.toString(), icon: 'route', color: 'text-emerald-400' }, { label: 'Nível', value: stats.level.toString(), icon: 'military_tech', color: 'text-blue-400' }, { label: 'Avaliação', value: '4.98', icon: 'star', color: 'text-yellow-400' }].map((stat, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-[24px] p-5 space-y-2">
                        <Icon name={stat.icon} className={`${stat.color} text-xl`} /><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{stat.label}</p><p className="text-xl font-black text-white">{stat.value}</p>
                    </div>
                ))}
            </div>
            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6">
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-5">Desempenho Semanal</p>
                <div className="flex items-end gap-3 h-28 justify-between">
                    {[35, 65, 45, 85, 55, 120, 95].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2">
                            <motion.div initial={{ height: 0 }} animate={{ height: `${(h / 120) * 100}%` }} transition={{ delay: i * 0.1, duration: 0.6 }} className={`w-full rounded-xl ${i === 5 ? 'bg-primary' : 'bg-white/10'}`} />
                            <span className={`text-[8px] font-black ${i === 5 ? 'text-primary' : 'text-white/20'}`}>{['D','S','T','Q','Q','S','S'][i]}</span>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );

    const renderScheduledView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.5em]">Calendário</p>
                <h2 className="text-3xl font-black text-white tracking-tight mt-1">Agendamentos</h2>
                <p className="text-xs text-white/30 mt-1">Pedidos agendados disponíveis e aceitos.</p>
            </div>

            {scheduledOrders.length === 0 ? (
                <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-4 text-center">
                    <Icon name="event_available" className="text-4xl text-white/10" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhum agendamento disponível</p>
                    <p className="text-[10px] text-white/10 mt-1">Novos agendamentos aparecem aqui em tempo real</p>
                </div>
            ) : scheduledOrders.map((order: any, i: number) => {
                const isPending = order.status === 'pendente' ||  order.status === 'agendado';
                const isAccepted = order.driver_id === driverId;
                const isMyAccepted = isAccepted;
                const statusColor = isMyAccepted ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : isPending ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-white/40 bg-white/5 border-white/10';
                const statusLabel = isMyAccepted ? '✓ Aceito por você' : isPending ? 'Disponível' : order.status;
                const schedDate = new Date(order.scheduled_date + 'T12:00:00');
                const isToday = schedDate.toDateString() === new Date().toDateString();
                const isTomorrow = schedDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                const dateLabel = isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : schedDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

                return (
                    <motion.div key={order.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className={`bg-white/[0.03] border rounded-[32px] p-6 space-y-5 ${isMyAccepted ? 'border-emerald-500/20' : 'border-white/8'}`}>

                        {/* Data e hora */}
                        <div className="flex items-center gap-3">
                            <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${isToday ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-white/5 border border-white/10'}`}>
                                <Icon name="event" className={`text-xl ${isToday ? 'text-blue-400' : 'text-white/30'}`} />
                            </div>
                            <div>
                                <p className={`text-sm font-black uppercase tracking-widest ${isToday ? 'text-blue-400' : 'text-white/50'}`}>{dateLabel}</p>
                                <p className="text-[10px] text-white/30">{order.scheduled_time ? order.scheduled_time.slice(0,5) + 'h' : 'Horário a confirmar'}</p>
                            </div>
                            <div className={`ml-auto text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusColor}`}>
                                {statusLabel}
                            </div>
                        </div>

                        {/* Endereços */}
                        <div className="space-y-2">
                            <div className="flex items-start gap-3">
                                <div className="size-6 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <div className="size-2 rounded-full bg-emerald-400" />
                                </div>
                                <p className="text-sm font-bold text-white/70 flex-1">{order.pickup_address}</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="size-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <Icon name="location_on" className="text-red-400 text-sm" />
                                </div>
                                <p className="text-sm font-bold text-white flex-1">{order.delivery_address}</p>
                            </div>
                        </div>

                        {/* Valor e tipo */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="flex items-center gap-3">
                                <span className="text-[9px] font-black text-white/20 uppercase bg-white/5 px-3 py-1 rounded-full">{order.service_type}</span>
                                {order.order_notes && <span className="text-[9px] text-white/20 truncate max-w-[120px]">{order.order_notes}</span>}
                            </div>
                            <span className="text-lg font-black text-primary">R$ {(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                        </div>

                        {/* Botao aceitar */}
                        {isPending && !isMyAccepted && (
                            <button
                                onClick={() => handleAccept({
                                    id: order.id.slice(0, 8).toUpperCase(),
                                    realId: order.id,
                                    type: order.service_type as ServiceType,
                                    title: 'Agendamento',
                                    origin: order.pickup_address,
                                    destination: order.delivery_address,
                                    price: order.total_price,
                                    distance: '---',
                                    time: order.scheduled_time || 'Agendado',
                                    customer: 'Cliente Izi',
                                    rating: 5.0,
                                    scheduled_at: order.scheduled_date
                                })}
                                disabled={isAccepting}
                                className="w-full bg-blue-500 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50"
                            >
                                <Icon name="check_circle" className="text-lg" />
                                Aceitar Agendamento
                            </button>
                        )}
                        {isMyAccepted && (
                            <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                                <Icon name="verified" className="text-emerald-400 text-lg" />
                                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Você aceitou esta corrida</span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </motion.div>
    );

    const renderDedicatedView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Exclusivo</p><h2 className="text-3xl font-black text-white tracking-tight mt-1">Vagas Dedicadas</h2><p className="text-xs text-white/30 mt-1">Seja piloto exclusivo de um parceiro Izi.</p></div>
            {dedicatedSlots.length === 0 ? (
                <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-4 text-center">
                    <Icon name="sentiment_dissatisfied" className="text-4xl text-white/10" /><p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhuma vaga disponível</p>
                </div>
            ) : dedicatedSlots.map((slot: any, i: number) => (
                <motion.div key={slot.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="bg-white/[0.03] border border-white/8 rounded-[32px] p-6 space-y-5">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="size-14 rounded-[20px] bg-white/5 border border-white/10 overflow-hidden p-2 shrink-0"><img src={slot.admin_users?.store_logo || 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'} className="w-full h-full object-contain" alt="" /></div>
                            <div><p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{slot.admin_users?.store_name}</p><h3 className="text-base font-black text-white">{slot.title}</h3></div>
                        </div>
                        <div className="text-right shrink-0"><p className="text-xl font-black text-primary">R$ {parseFloat(slot.fee_per_day).toFixed(0)}</p><p className="text-[8px] text-white/20 uppercase tracking-widest">/dia garantido</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-2xl p-3"><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Horário</p><p className="text-xs font-black text-white mt-0.5">{slot.working_hours}</p></div>
                        {slot.admin_users?.store_address && <div className="bg-black/20 rounded-2xl p-3"><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Local</p><p className="text-xs font-black text-white mt-0.5 truncate">{slot.admin_users.store_address.split(',')[0]}</p></div>}
                    </div>
                    {slot.description && <p className="text-xs text-white/40 leading-relaxed border-l-2 border-primary/20 pl-4">{slot.description}</p>}
                    <div className="flex gap-3">
                        {slot.admin_users?.store_phone && (
                            <button onClick={() => window.open(`https://wa.me/55${slot.admin_users.store_phone.replace(/\D/g, '')}`, '_blank')} className="flex-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all py-3">
                                <Icon name="chat" className="text-lg" />WhatsApp
                            </button>
                        )}
                        <button onClick={async () => { try { const { error } = await supabase.from('slot_applications').insert({ slot_id: slot.id, driver_id: driverId, status: 'pending', created_at: new Date().toISOString() }); if (error && error.code !== '42P01') throw error; toastSuccess('Candidatura enviada!'); setDedicatedSlots(prev => prev.filter((s: any) => s.id !== slot.id)); } catch { toastError('Erro ao candidatar. Tente pelo WhatsApp.'); } }} className="flex-1 bg-primary text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-primary/20 py-3">
                            <Icon name="check_circle" className="text-lg" />Candidatar
                        </button>
                        <button onClick={() => { const d = JSON.parse(localStorage.getItem('Izi_declined_slots') || '[]'); localStorage.setItem('Izi_declined_slots', JSON.stringify([...d, slot.id])); setDedicatedSlots(prev => prev.filter((s: any) => s.id !== slot.id)); toast('Vaga ignorada.'); }} className="bg-white/5 text-red-400 border border-red-500/10 rounded-2xl flex items-center justify-center active:scale-95 transition-all px-4 py-3">
                            <Icon name="close" className="text-xl" />
                        </button>
                    </div>
                </motion.div>
            ))}
        </motion.div>
    );

    const renderProfileView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div className="flex flex-col items-center pt-4 pb-2">
                <div className="size-24 rounded-[32px] bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center mb-4"><Icon name="person" className="text-primary text-5xl" /></div>
                <h2 className="text-2xl font-black text-white tracking-tight">{driverName}</h2>
                <div className="flex items-center gap-2 mt-1.5"><Icon name="verified" className="text-primary text-sm" /><span className="text-[10px] font-black text-primary uppercase tracking-widest">Piloto Izi • Nível {stats.level}</span></div>
                <div className="flex gap-4 mt-4">
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"><Icon name="star" className="text-primary text-sm" /><span className="text-sm font-black text-white">4.98</span></div>
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"><Icon name="route" className="text-emerald-400 text-sm" /><span className="text-sm font-black text-white">{stats.count} corridas</span></div>
                </div>
            </div>
            <div className="space-y-3">
                {[{ label: 'Dados do Veículo', icon: 'directions_car', color: 'text-primary' }, { label: 'Documentos e CNH', icon: 'badge', color: 'text-blue-400' }, { label: 'Suporte Izi', icon: 'support_agent', color: 'text-emerald-400' }, { label: 'Configurações', icon: 'settings', color: 'text-white/40' }].map((item, i) => (
                    <button key={i} className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] p-5 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-4"><div className={`size-11 rounded-[16px] bg-white/5 flex items-center justify-center border border-white/10 ${item.color}`}><Icon name={item.icon} className="text-xl" /></div><span className="text-sm font-black text-white">{item.label}</span></div>
                        <Icon name="chevron_right" className="text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                ))}
            </div>
            <button onClick={handleLogout} className="w-full py-5 border border-red-500/20 text-red-400 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-red-500/5 transition-all active:scale-[0.98] mt-4">Encerrar Sessão</button>
        </motion.div>
    );

    const [isMapOnly, setIsMapOnly] = useState(false);

    const renderActiveMissionView = () => {
        if (!activeMission) return null;
        const details = getTypeDetails(activeMission.type);
        const isMobility = activeMission.type === 'mototaxi' || activeMission.type === 'car_ride';
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#020617] flex flex-col overflow-hidden">
                {/* Header - esconde em modo mapa */}
                {!isMapOnly && (
                <div className="px-6 py-5 bg-black/40 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-[18px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10`}><Icon name="satellite_alt" className="text-2xl animate-pulse" /></div>
                        <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Em Andamento</p><h2 className="text-base font-black text-white tracking-tight uppercase">Missão em Rota</h2></div>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-2xl">
                        <div className="size-1.5 bg-emerald-400 rounded-full animate-pulse" /><span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Ativo</span>
                    </div>
                </div>
                )}
                 <div className="flex-1 bg-[#030a1a] relative overflow-hidden">
                    <IziRealTimeMap 
                      driverCoords={driverCoords} 
                      destCoords={activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'saiu_para_entrega'
                        ? { lat: activeMission.delivery_lat, lng: activeMission.delivery_lng } 
                        : { lat: activeMission.pickup_lat, lng: activeMission.pickup_lng }
                      }
                      destAddress={activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'saiu_para_entrega'
                        ? (activeMission.destination || activeMission.delivery_address)
                        : (activeMission.origin || activeMission.pickup_address)
                      }
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020617]/40 via-transparent to-[#030712]/40" />
                    
                    {/* Info overlay no canto superior direito */}
                    <div className="absolute top-5 right-5 flex flex-col items-end gap-2">
                        <div className="bg-black/70 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-3 text-right">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Ganho</p>
                            <p className="text-xl font-black text-primary">R$ {activeMission.price.toFixed(2)}</p>
                        </div>
                        
                        {/* Status do Estabelecimento para o Motoboy Flash */}
                        {activeMission.status === 'pronto' ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-emerald-500 text-white rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                                <Icon name="check_circle" className="text-xs" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Pedido Pronto!</span>
                            </motion.div>
                        ) : (
                            <div className="bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 rounded-xl px-3 py-1.5 flex items-center gap-2">
                                <div className="size-1.5 bg-blue-400 rounded-full animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Em Preparo...</span>
                            </div>
                        )}
                    </div>

                    {/* Botão flutuante para alternar modo mapa / painel completo */}
                    <button 
                        onClick={() => setIsMapOnly(!isMapOnly)}
                        className={`absolute bottom-6 left-6 z-50 h-14 px-5 rounded-2xl flex items-center justify-center gap-2.5 border shadow-2xl transition-all active:scale-90 ${isMapOnly ? 'bg-primary text-slate-950 border-primary/50 shadow-primary/30' : 'bg-slate-900/80 text-white border-white/10 backdrop-blur-md shadow-black/30'}`}
                        title={isMapOnly ? 'Voltar ao Painel' : 'Modo Mapa'}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {isMapOnly ? 'expand_less' : 'map'}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest">
                            {isMapOnly ? 'Painel' : 'Só Mapa'}
                        </span>
                    </button>
                </div>

                {/* Painel inferior - esconde em modo mapa */}
                {!isMapOnly && (
                <div className="px-5 pt-5 pb-8 bg-[#030712] border-t border-white/5 space-y-4 shrink-0">
                    <div className="bg-white/[0.03] border border-white/8 rounded-[24px] p-5 space-y-3">
                        <div className="flex items-start gap-3"><div className="mt-1.5 size-2 rounded-full bg-white/30 shrink-0" /><div><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Coleta</p><p className="text-xs font-bold text-white/60 leading-tight">{activeMission.origin}</p></div></div>
                        <div className="ml-[3px] h-3 w-[1px] bg-white/10" />
                        <div className="flex items-start gap-3"><div className="mt-1.5 size-2 rounded-full bg-primary shrink-0 shadow-[0_0_8px_rgba(255,217,0,0.5)]" /><div><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Destino Final</p><p className="text-xs font-black text-white leading-tight">{activeMission.destination}</p></div></div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                const isDeliveryPhase = activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'saiu_para_entrega';
                                const lat = isDeliveryPhase ? activeMission.delivery_lat : activeMission.pickup_lat;
                                const lng = isDeliveryPhase ? activeMission.delivery_lng : activeMission.pickup_lng;
                                const addressText = isDeliveryPhase ? (activeMission.destination || activeMission.delivery_address) : (activeMission.origin || activeMission.pickup_address);
                                let destination = '';
                                if (lat && lng) {
                                    destination = `${lat},${lng}`;
                                } else if (addressText) {
                                    destination = encodeURIComponent(addressText);
                                }
                                if (destination) {
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                                }
                            }}
                            className="flex-1 h-14 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Icon name="navigation" className="text-xl" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Navegar</span>
                        </button>
                        <button onClick={() => setIsSOSActive(true)} className="size-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center active:scale-95 transition-all"><Icon name="emergency" className="text-xl" /></button>
                    </div>
                    {/* BOTÕES DINÂMICOS DE PROGRESSO */}
                    {(!activeMission.status || ['a_caminho', 'pronto', 'confirmado', 'preparando'].includes(activeMission.status)) && (
                        <button 
                            onClick={() => handleUpdateStatus('picked_up')} 
                            disabled={isAccepting}
                            className={`w-full h-16 font-black text-sm uppercase tracking-widest rounded-[22px] shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${activeMission.status === 'pronto' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-emerald-500/20 animate-pulse' : 'bg-gradient-to-r from-blue-500 to-blue-400 text-white shadow-blue-500/20'}`}
                        >
                            <Icon name="package_2" className="text-2xl" />{activeMission.status === 'pronto' ? '📦 Coletar Pedido Pronto!' : 'Confirmar Coleta'}
                        </button>
                    )}

                    {activeMission.status === 'picked_up' && (
                        <button 
                            onClick={() => handleUpdateStatus('em_rota')} 
                            disabled={isAccepting}
                            className="w-full h-16 bg-gradient-to-r from-yellow-500 to-yellow-400 text-black font-black text-sm uppercase tracking-widest rounded-[22px] shadow-2xl shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Icon name="moped" className="text-2xl" />Iniciar Entrega
                        </button>
                    )}

                    {(activeMission.status === 'em_rota' || activeMission.status === 'saiu_para_entrega') && (
                        <button 
                            onClick={() => handleUpdateStatus('concluido')} 
                            disabled={isAccepting}
                            className="w-full h-16 bg-gradient-to-r from-primary to-yellow-400 text-slate-900 font-black text-sm uppercase tracking-widest rounded-[22px] shadow-2xl shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            <Icon name="check_circle" className="text-2xl" />{isMobility ? 'Concluir Corrida' : 'Finalizar Entrega'}
                        </button>
                    )}
                </div>
                )}
            </motion.div>
        );
    };

    const renderSOS = () => (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[200] bg-red-950 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-28 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mb-8 animate-pulse"><Icon name="emergency_share" className="text-6xl text-red-400" /></div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">SOS Ativado</h1>
            <p className="text-white/60 text-sm mb-10 max-w-xs leading-relaxed">Sua localização está sendo compartilhada com a central Izi.</p>
            <div className="w-full max-w-sm space-y-4">
                <button onClick={() => { window.open('tel:190'); setIsSOSActive(false); }} className="w-full h-16 bg-white text-red-600 rounded-[24px] flex items-center justify-center gap-4 font-black text-lg uppercase tracking-tight shadow-2xl active:scale-95 transition-all"><Icon name="local_police" className="text-3xl" />Ligar 190</button>
                <button onClick={() => { toastSuccess('Apoio mecânico acionado.'); setIsSOSActive(false); }} className="w-full h-16 bg-white/10 border border-white/20 text-white rounded-[24px] flex items-center justify-center gap-4 font-black text-base uppercase active:scale-95 transition-all"><Icon name="build" className="text-2xl" />Apoio Mecânico</button>
                <button onClick={() => setIsSOSActive(false)} className="text-white/30 font-black uppercase tracking-widest text-sm mt-4">Cancelar</button>
            </div>
        </motion.div>
    );

    const renderLoginView = () => {
        if (authInitLoading) return (
            <div className="h-screen flex items-center justify-center bg-[#020617]">
                <div className="flex flex-col items-center gap-4"><div className="size-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse"><Icon name="bolt" className="text-primary text-3xl" /></div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Inicializando...</p></div>
            </div>
        );
        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen w-full flex flex-col items-center justify-center px-7 relative overflow-hidden bg-[#020617]">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,217,0,0.04)_0%,transparent_60%)]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,217,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,217,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center size-16 bg-primary/10 border border-primary/20 rounded-[24px] mb-2"><Icon name="two_wheeler" className="text-primary text-3xl" /></div>
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase">Terminal <span className="text-primary">Izi</span></h1>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">{authMode === 'login' ? 'Autenticação do Entregador' : 'Cadastro de Novo Piloto'}</p>
                    </div>
                    {authError && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3 text-red-400 text-xs font-bold text-center">{authError}</motion.div>}
                    <div className="space-y-4">
                        {authMode === 'register' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="badge" className="text-xl" /></div><input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Nome completo" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" /></div>
                                <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="phone" className="text-xl" /></div><input type="tel" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Telefone (WhatsApp)" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" /></div>
                                <div className="flex gap-2">{(['mototaxi', 'carro', 'bicicleta'] as const).map(v => (<button key={v} type="button" onClick={() => setAuthVehicle(v)} className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 border transition-all text-[9px] font-black uppercase tracking-widest ${authVehicle === v ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/[0.03] border-white/5 text-white/20'}`}><Icon name={v === 'mototaxi' ? 'two_wheeler' : v === 'carro' ? 'directions_car' : 'pedal_bike'} className="text-xl" />{v === 'mototaxi' ? 'Moto' : v === 'carro' ? 'Carro' : 'Bike'}</button>))}</div>
                            </motion.div>
                        )}
                        <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="mail" className="text-xl" /></div><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" /></div>
                        <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="key" className="text-xl" /></div><input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Senha" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" onKeyDown={e => e.key === 'Enter' && authMode === 'login' && handleAuthLogin()} /></div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={authMode === 'login' ? handleAuthLogin : handleAuthRegister} disabled={authLoading} className="w-full h-14 bg-primary text-slate-900 font-black text-sm uppercase tracking-widest rounded-[20px] shadow-2xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                            {authLoading ? <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" /> : <>{authMode === 'login' ? 'Entrar' : 'Criar Conta'}<Icon name="arrow_forward" className="text-xl" /></>}
                        </button>
                        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="w-full h-12 bg-white/[0.03] border border-white/5 text-white/30 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-white/50 hover:bg-white/[0.05] transition-all">{authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}</button>
                    </div>
                </div>
                <p className="absolute bottom-8 text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Izi v5.0 • Conexão Segura</p>
            </motion.div>
        );
    };

    return (
        <div className="w-full h-[100dvh] bg-[#020617] font-sans overflow-hidden relative">
            <AnimatePresence mode="wait">
                {!isAuthenticated && authInitLoading && (
                    <div key="boot" className="h-full flex flex-col items-center justify-center bg-[#020617]">
                        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse mb-4"><Icon name="bolt" className="text-primary text-4xl" /></div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Inicializando Terminal...</p>
                    </div>
                )}
                {!isAuthenticated && !authInitLoading && <div key="login">{renderLoginView()}</div>}
                {isAuthenticated && (
                    <div key="app" className="flex flex-col h-full overflow-hidden">
                        <AnimatePresence>{isSOSActive && renderSOS()}</AnimatePresence>
                        <AnimatePresence>{activeMission && renderActiveMissionView()}</AnimatePresence>
                        {renderNavigationDrawer()}
                        <div className="flex flex-col h-full overflow-hidden">
                            {renderHeader()}
                            <AnimatePresence>
                                {activeMission && activeTab !== 'active_mission' && (
                                    <motion.button key="mission-btn" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onClick={() => setActiveTab('active_mission')} className="fixed bottom-8 left-5 right-5 z-[60] bg-primary text-slate-900 rounded-[24px] h-16 flex items-center justify-between px-6 shadow-2xl shadow-primary/30">
                                        <div className="flex items-center gap-3"><div className="size-3 bg-slate-900 rounded-full animate-pulse" /><span className="font-black text-sm uppercase tracking-widest">Missão em Andamento</span></div>
                                        <Icon name="arrow_forward" className="text-slate-900 text-xl font-black" />
                                    </motion.button>
                                )}
                            </AnimatePresence>
                            {!activeMission && (
                                <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.85 }} onClick={() => setIsSOSActive(true)} className="fixed bottom-8 right-5 size-14 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_24px_rgba(220,38,38,0.4)] z-[60] border-2 border-red-900">
                                    <Icon name="emergency" className="text-white text-2xl" />
                                </motion.button>
                            )}
                            <main className="flex-1 overflow-y-auto no-scrollbar">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'dashboard' && <div key="dash">{renderDashboard()}</div>}
                                    {activeTab === 'history' && <div key="hist">{renderHistoryView()}</div>}
                                    {activeTab === 'earnings' && <div key="earn">{renderEarningsView()}</div>}
                                    {activeTab === 'profile' && <div key="prof">{renderProfileView()}</div>}
                                    {activeTab === 'dedicated' && <div key="dedi">{renderDedicatedView()}</div>}
                                    {activeTab === 'scheduled' && <div key="sched">{renderScheduledView()}</div>}
                                </AnimatePresence>
                            </main>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default App;
