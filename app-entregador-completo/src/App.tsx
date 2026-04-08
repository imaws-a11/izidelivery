import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './lib/supabase';
import { playIziSound } from './lib/iziSounds';
import { toast, toastSuccess, toastError, showConfirm } from './lib/useToast';
import { BespokeIcons } from './lib/BespokeIcons';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, OverlayView, Polyline } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];
const GOOGLE_MAPS_ID = 'izi-pilot-map';

const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: 'greedy',
    styles: [
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#00b2ff" }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffca28" }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#ffb300" }] },
        { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
        { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#dcdcdc" }] },
        { "featureType": "road.local", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
        { "featureType": "road.local", "elementType": "geometry.stroke", "stylers": [{ "color": "#eeeeee" }] },
        { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#8dc26f" }] },
        { "featureType": "transit.line", "elementType": "geometry.fill", "stylers": [{ "color": "#808080" }] },
        { "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] },
        { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }] }
    ]
};

function Icon({ name, className = "", size = 20 }: any) {
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
    'pedal_bike': BespokeIcons.Motorcycle,
    'support_agent': BespokeIcons.Support,
    'badge': BespokeIcons.User,
    'settings': BespokeIcons.Menu,
  };

  const IconComp = icons[name] || BespokeIcons.Help;
  return <IconComp size={size} className={className} />;
}

type View = 'dashboard' | 'history' | 'earnings' | 'profile' | 'active_mission' | 'dedicated' | 'scheduled' | 'sos';
type ServiceType = 'package' | 'mototaxi' | 'car_ride' | 'frete' | 'motorista_particular' | 'motoboy' | string;

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
    pickup_address?: string;
    delivery_address?: string;
    preparation_status?: string;
    merchant_name?: string;
    user_name?: string;
    delivery_fee?: number;
    total_price?: number;
    payment_method?: string;
    displayId?: string;
    items?: any[];
    notes?: string;
}
function IziRealTimeMap({ driverCoords, destCoords, destAddress }: any) {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_ID,
    googleMapsApiKey: mapsKey,
    libraries: GOOGLE_MAPS_LIBRARIES,
    language: 'pt-BR',
    region: 'BR',
  });

  const [routeData, setRouteData] = useState<{
    polyline: string;
    distance: string;
    duration: string;
  } | null>(null);
  const [isNavMode, setIsNavMode] = useState(true);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const lastDestRef = useRef<string>('');

  // Validar coordenadas
  const isValidCoord = (c: any): c is { lat: number; lng: number } =>
    c && typeof c.lat === 'number' && typeof c.lng === 'number' && isFinite(c.lat) && isFinite(c.lng);

  const validDriverCoords = isValidCoord(driverCoords) ? driverCoords : null;
  const validDestCoords = isValidCoord(destCoords) ? destCoords : null;
  const resolvedDest = validDestCoords ? validDestCoords : (destAddress || null);

  // Calcular rota: imediato na 1a vez e ao mudar destino, depois a cada 30s
  useEffect(() => {
    if (!isLoaded || !validDriverCoords || !resolvedDest) return;
    
    const calcRoute = async () => {
      if (!isLoaded || !validDriverCoords || !resolvedDest) return;
      try {
        const origin = { location: { latLng: { latitude: validDriverCoords.lat, longitude: validDriverCoords.lng } } };
        const destin = typeof resolvedDest === 'string' 
          ? { address: resolvedDest }
          : { location: { latLng: { latitude: resolvedDest.lat, longitude: resolvedDest.lng } } };

        const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": mapsKey,
            "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline",
          },
          body: JSON.stringify({
            origin,
            destination: destin,
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
            computeAlternativeRoutes: false,
            routeModifiers: { avoidTolls: false, avoidHighways: false, avoidFerries: false },
            languageCode: 'pt-BR',
            units: 'METRIC'
          })
        });

        if (res.status === 403) {
           console.error('⚠️ ERRO DE PERMISSÃO GOOGLE MAPS (403): Verifique se a "Routes API" está ATIVADA no Google Cloud Console e se o seu domínio está permitido.');
           return;
        }

        const data = await res.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          setRouteData({
            polyline: route.polyline.encodedPolyline,
            distance: (route.distanceMeters / 1000).toFixed(1) + ' km',
            duration: Math.ceil(parseInt(route.duration) / 60) + ' min'
          });
        }
      } catch (e) {
        console.error('ERRO ROUTES API:', e);
      }
    };

    const destKey = typeof resolvedDest === 'string' ? resolvedDest : `${resolvedDest.lat},${resolvedDest.lng}`;
    if (destKey !== lastDestRef.current) {
      lastDestRef.current = destKey;
      calcRoute();
    }

    const interval = setInterval(calcRoute, 30000);
    return () => clearInterval(interval);
  }, [isLoaded, validDriverCoords, resolvedDest]);

  // Centralização suave
  useEffect(() => {
    if (map && isNavMode && validDriverCoords) {
      map.panTo(validDriverCoords);
    }
  }, [map, isNavMode, validDriverCoords]);

  if (loadError) return (
    <div className="absolute inset-0 bg-red-950 flex flex-col items-center justify-center p-8 text-center z-50">
        <Icon name="satellite_alt" className="text-6xl text-red-500 mb-6 animate-bounce" />
        <h1 className="text-2xl font-black text-white uppercase mb-2">Erro de Mapa</h1>
        <p className="text-white/60 text-xs max-w-xs">{loadError.message || 'Falha ao conectar com Google Maps. Chave inválida ou limite atingido.'}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-white/10 rounded-2xl text-[10px] uppercase font-black tracking-widest text-white/40">Tentar Novamente</button>
    </div>
  );

  if (!isLoaded || !validDriverCoords) return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-pulse">
            <Icon name="radar" className="text-primary text-4xl" />
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">Calibrando Sinal GPS...</p>
        </div>
    </div>
  );

  return (
    <div className="absolute inset-0 z-0">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        onLoad={setMap}
        center={validDriverCoords}
        zoom={16}
        options={mapOptions}
      >
        {/* Marcador de Pulso do Usuário (Waze Style) */}
        <OverlayView
            position={validDriverCoords}
            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
        >
            <div className="marker-user-pulse" />
        </OverlayView>

        {validDestCoords && (
          <Marker 
            position={validDestCoords}
            options={{
              icon: {
                url: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png', // Pin de Destino Premium
                scaledSize: new window.google.maps.Size(42, 42),
                anchor: new window.google.maps.Point(21, 42)
              }
            }}
            zIndex={500}
          />
        )}

        {routeData?.polyline && isLoaded && (
          <Polyline 
            path={google.maps.geometry.encoding.decodePath(routeData.polyline)}
            options={{
              strokeColor: "#ffd700",
              strokeWeight: 6,
              strokeOpacity: 0.8,
              zIndex: 100
            }}
          />
        )}
      </GoogleMap>

      <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-3">
        <button 
                onClick={() => setIsNavMode(!isNavMode)}
                className={`size-14 rounded-2xl flex items-center justify-center border shadow-2xl transition-all active:scale-90 ${isNavMode ? 'bg-primary text-slate-950 border-white/20' : 'bg-slate-900/80 text-white border-white/10 backdrop-blur-md'}`}
                title={isNavMode ? 'Mudar para Mapa Livre' : 'Voltar para Navegação'}
            >
                <span className="material-symbols-outlined text-2xl">
                {isNavMode ? 'explore' : 'near_me'}
                </span>
        </button>
      </div>

      {routeData && (
        <div className="absolute top-6 left-6 z-[60] bg-slate-900/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-left-4">
          <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
            <Icon name="navigation" size={20} />
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Tempo Estimado</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white tracking-tight">{routeData.duration.replace('s', ' min')}</span>
              <span className="text-[10px] font-black text-primary">{routeData.distance}</span>
            </div>
          </div>
        </div>
      )}

      {!isNavMode && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-[0.2em] shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          Modo Mapa Livre Ativo
        </div>
      )}
    </div>
  );
}

// Normaliza aliases variados de service_type que vêm do banco de dados para os tipos canônicos
const normalizeServiceType = (raw: string | undefined | null): string => {
    if (!raw) return 'delivery';
    const t = raw.toLowerCase().trim();
    // Tipos de comida / restaurante
    if (['restaurant', 'restaurante', 'food', 'hamburguer', 'hamburger', 'burger',
         'lanchonete', 'lanche', 'pizzaria', 'pizza', 'sushi', 'japanese',
         'churrasco', 'grill', 'culinaria', 'culinária', 'refeicao', 'refeição'].includes(t)) return 'restaurant';
    // Mercado / supermercado
    if (['market', 'mercado', 'supermercado', 'hortifruti'].includes(t)) return 'market';
    // Farmácia / saúde
    if (['pharmacy', 'farmacia', 'farmácia', 'saude', 'saúde', 'health'].includes(t)) return 'pharmacy';
    // Bebidas
    if (['beverages', 'bebidas', 'drinks', 'bar'].includes(t)) return 'beverages';
    // Mobilidade
    if (['mototaxi', 'moto_taxi', 'motortaxi'].includes(t)) return 'mototaxi';
    if (['car_ride', 'carro', 'taxi', 'car', 'ride'].includes(t)) return 'car_ride';
    if (['motorista_particular', 'motorista particular', 'chauffeur'].includes(t)) return 'motorista_particular';
    // Logística
    if (['frete', 'carreto', 'freight', 'van', 'mudanca', 'mudança'].includes(t)) return 'frete';
    if (['package', 'pacote', 'encomenda', 'express', 'delivery'].includes(t)) return 'package';
    return t; // retorna o tipo original se não houver mapeamento
};

const getTypeDetails = (rawType: string) => {
    const type = normalizeServiceType(rawType);
    switch (type) {
        case 'package': return { icon: 'package_2', color: 'text-primary', bg: 'bg-primary/10', label: 'Encomenda', isFood: false };
        case 'mototaxi': return { icon: 'two_wheeler', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'MotoTaxi', isFood: false };
        case 'car_ride': return { icon: 'directions_car', color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Carro', isFood: false };
        case 'frete': return { icon: 'local_shipping', color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Frete/Carreto', isFood: false };
        case 'restaurant': return { icon: 'restaurant', color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Restaurante', isFood: true };
        case 'market': return { icon: 'local_mall', color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Mercado', isFood: false };
        case 'pharmacy': return { icon: 'medication', color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Farmácia', isFood: false };
        case 'beverages': return { icon: 'local_bar', color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Bebidas', isFood: false };
        case 'motorista_particular': return { icon: 'military_tech', color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Motorista Particular', isFood: false };
        case 'motoboy': return { icon: 'moped', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Motoboy', isFood: false };
        default: return { icon: 'local_shipping', color: 'text-primary', bg: 'bg-primary/10', label: 'Serviço Express', isFood: false };
    }
};

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('izi_driver_authenticated') === 'true');
    const [driverId, setDriverId] = useState<string | null>(() => localStorage.getItem('izi_driver_uid'));
    const [driverCoords, setDriverCoords] = useState<{lat: number, lng: number} | null>(null);
    const [driverName, setDriverName] = useState(() => localStorage.getItem('izi_driver_name') || 'Entregador');
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authName, setAuthName] = useState('');
    const [authVehicle, setAuthVehicle] = useState<'mototaxi' | 'carro' | 'bicicleta'>('mototaxi');
    const [authPhone, setAuthPhone] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [authInitLoading, setAuthInitLoading] = useState(true);
    const [appSettings, setAppSettings] = useState<any>(null);

    const fetchGlobalSettings = useCallback(async () => {
        try {
            const { data } = await supabase.from('app_settings_delivery').select('*').single();
            if (data) setAppSettings(data);
        } catch (e) {
            console.error('[SETTINGS] Erro ao buscar configurações:', e);
        }
    }, []);

    // Efeito para persistir dados básicos de autenticação no localStorage
    useEffect(() => {
        if (isAuthenticated && driverId) {
            localStorage.setItem('izi_driver_authenticated', 'true');
            localStorage.setItem('izi_driver_uid', driverId);
            localStorage.setItem('izi_driver_name', driverName);
            fetchGlobalSettings();
        } else if (!authInitLoading) {
            localStorage.removeItem('izi_driver_authenticated');
            localStorage.removeItem('izi_driver_uid');
            localStorage.removeItem('izi_driver_name');
        }
    }, [isAuthenticated, driverId, driverName, authInitLoading]);

    const [activeTab, setActiveTab] = useState<View>(() => {
        const saved = localStorage.getItem('Izi_active_mission');
        return saved ? 'active_mission' : 'dashboard';
    });
    const [isOnline, setIsOnline] = useState(() => localStorage.getItem('Izi_online') === 'true');
    const isFirstRender = useRef(true);
    const hasLoadedOnlineStatus = useRef(false); // Impede que refreshes de token sobrescrevam o status
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [filter, setFilter] = useState<ServiceType | 'all'>('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [dedicatedSlots, setDedicatedSlots] = useState<any[]>([]);
    const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
    const [history, setHistory] = useState<Order[]>([]);
    const [stats, setStats] = useState({ balance: 0, today: 0, count: 0, level: 1, xp: 0, nextXp: 100 });
    const [earningsHistory, setEarningsHistory] = useState<Order[]>([]);
    const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
    const [isFinanceLoading, setIsFinanceLoading] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [pixKey, setPixKey] = useState(() => localStorage.getItem('izi_driver_pix') || '');

    const [activeMission, setActiveMission] = useState<Order | null>(() => {
        const saved = localStorage.getItem('Izi_active_mission');
        return saved ? JSON.parse(saved) : null;
    });
    const activeMissionRef = useRef(activeMission);
    useEffect(() => { activeMissionRef.current = activeMission; }, [activeMission]);
    
    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    const getNetEarnings = useCallback((order: any) => {
        if (!order) return 0;
        
        // Configurações globais com valores padrão seguros
        const commission = appSettings?.appCommission ?? 7;
        const defaultBaseFee = appSettings?.baseFee ?? 8;
        
        const rawType = order.service_type || order.type || 'generic';
        const type = normalizeServiceType(rawType);
        
        // Categorias de serviço
        const isMobility = ['mototaxi', 'car_ride', 'frete', 'motorista_particular', 'van', 'utilitario'].includes(type);
        const isErrand = ['package', 'motoboy', 'generic'].includes(type);
        
        let driverBaseAmount = 0;
        
        if (isMobility) {
            // Em mobilidade, o valor base é o total da corrida
            driverBaseAmount = Number(order.total_price || order.price || 0);
        } else if (isErrand) {
            // Em entregas de encomendas/avulsas, o total costuma ser o próprio frete
            driverBaseAmount = Number(order.delivery_fee || order.total_price || order.price || 0);
        } else {
            // Em restaurante/mercado, usamos a delivery_fee ou o baseFee como fallback
            const deliveryFee = Number(order.delivery_fee || 0);
            driverBaseAmount = deliveryFee > 0 ? deliveryFee : defaultBaseFee;
        }

        // Se mesmo assim for zero, tentamos o total_price como última instância (limitado a um teto razoável se não for mobilidade)
        if (driverBaseAmount <= 0) {
            driverBaseAmount = Number(order.total_price || order.price || 0);
        }

        const net = driverBaseAmount * (1 - (commission / 100));
        return Number(net.toFixed(2));
    }, [appSettings]);

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
        const ensureDriverRecord = async (userId: string, email: string, name: string) => {
            // Busca o registro atual, mesmo que esteja marcado como deletado
            // Nota: Se houver RLS impedindo a leitura de is_deleted=true, o data virá null
            const { data } = await supabase.from('drivers_delivery').select('id, name, lat, lng, is_deleted').eq('id', userId).maybeSingle();
            
            // Se NÃO existe o ID no banco OU se o registro existe mas foi deletado, NÃO recriamos se o objetivo for deletar
            // Mas aqui, só criamos se for um usuário COMPLETAMENTE novo (sem registro nenhum)
            if (!data) {
                await supabase.from('drivers_delivery').upsert({
                    id: userId, 
                    name: name || 'Entregador Izi',
                    email: email, 
                    is_online: true, 
                    is_active: true, 
                    is_deleted: false,
                    vehicle_type: 'mototaxi'
                });
            } else {
                // Se o registro existe (mesmo que excluído pelo admin), não fazemos o upsert para não "ressuscitar"
                if (data.name) {
                    setDriverName(data.name);
                    localStorage.setItem('izi_driver_name', data.name);
                }
                const lat = Number(data.lat);
                const lng = Number(data.lng);
                if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) setDriverCoords({ lat, lng });
            }
        };

        // Check initial Supabase session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const user = session?.user;
            if (user) {
                setDriverId(user.id);
                setIsAuthenticated(true);
                const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Entregador';
                setDriverName(name);
                ensureDriverRecord(user.id, user.email || '', name);
            } else {
                setDriverId(null);
                setIsAuthenticated(false);
                setDriverName('Entregador');
            }
            setAuthInitLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user;
            if (user) {
                setDriverId(user.id);
                setIsAuthenticated(true);
                
                // Buscar perfil completo do banco para sincronizar entre dispositivos
                const { data: profile } = await supabase
                    .from('drivers_delivery')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setDriverName(profile.name || 'Entregador');
                    setPixKey(profile.bank_info?.pix_key || '');
                } else {
                    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Entregador';
                    setDriverName(name);
                    ensureDriverRecord(user.id, user.email || '', name);
                }
                
                fetchFinanceData();
                fetchMissionHistory();
            } else {
                setDriverId(null);
                setIsAuthenticated(false);
                setDriverName('Entregador');
                // REMOVIDO: setIsOnline(false); 
                // Não limpamos o status online aqui pois ele deve persistir do localStorage ao reiniciar
            }
            setAuthInitLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (activeTab === 'earnings' || activeTab === 'history') {
            fetchFinanceData();
            fetchMissionHistory();
        }
    }, [activeTab]);


    const handleAuthLogin = async () => {
        setAuthLoading(true); setAuthError('');
        if (!authEmail || !authPassword) { setAuthError('Preencha email e senha.'); setAuthLoading(false); return; }
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: authEmail,
                password: authPassword,
            });
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
            const { data, error } = await supabase.auth.signUp({
                email: authEmail,
                password: authPassword,
                options: {
                    data: {
                        name: authName.trim(),
                        phone: authPhone.trim(),
                    }
                }
            });
            if (error) throw error;
            
            const user = data.user;
            if (user) {
                await supabase.from('drivers_delivery').upsert({ 
                    id: user.id, 
                    name: authName.trim(), 
                    email: authEmail,
                    is_online: false, 
                    vehicle_type: authVehicle, 
                    phone: authPhone || null, 
                    rating: 5.0, 
                    is_active: true 
                });
                setDriverName(authName.trim());
            }
        } catch (e: any) {
            setAuthError(e.message?.includes('already registered') ? 'Este email já está cadastrado. Faça login.' : e.message);
        } finally { setAuthLoading(false); }
    };





    // Sincronização entre múltiplos dispositivos (Online status, Carteira, Perfil)
    useEffect(() => {
        if (!driverId || !isAuthenticated) return;
        const dId = String(driverId).trim();

        const channel = supabase.channel('my_driver_data')
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'drivers_delivery', 
                filter: `id=eq.${dId}` 
            }, (payload) => {
                const updated = payload.new;
                console.log('[REALTIME] Sincronização multi-dispositivo:', updated);
                
                // Sincronizar Online status
                if (updated.is_online !== undefined && updated.is_online !== isOnline) {
                    setIsOnline(updated.is_online);
                    localStorage.setItem('Izi_online', String(updated.is_online));
                }
                
                // Recarregar dados financeiros se o saldo mudou por outro dispositivo
                fetchFinanceData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [driverId, isAuthenticated, isOnline]);

    // Heartbeat: enquanto online, atualiza last_seen_at a cada 5 segundos
    useEffect(() => {
        if (!driverId || !isAuthenticated || !isOnline) return;
        const dId = String(driverId).trim();

        const sendHeartbeat = async () => {
            try {
                await supabase
                    .from('drivers_delivery')
                    .update({ 
                        last_seen_at: new Date().toISOString(),
                        is_online: true 
                    })
                    .eq('id', dId);
            } catch (err) {}
        };

        sendHeartbeat();
        const interval = setInterval(sendHeartbeat, 5 * 1000);
        return () => clearInterval(interval);
    }, [driverId, isAuthenticated, isOnline]);

    const handleToggleOnline = async () => {
        const nextState = !isOnline;
        setIsOnline(nextState); // Mudança visual imediata
        
        if (driverId) {
            try {
                // Atualizar banco (ao ficar online, atualiza last_seen_at para evitar auto-offline imediato)
                const updatePayload = nextState 
                    ? { is_online: true, last_seen_at: new Date().toISOString() }
                    : { is_online: false };
                const { error } = await supabase.from('drivers_delivery').update(updatePayload).eq('id', driverId);
                if (error) throw error;
                localStorage.setItem('Izi_online', nextState.toString());
                console.log(`[STATUS] Mudou para ${nextState ? 'ONLINE' : 'OFFLINE'}`);
            } catch (e: any) {
                console.error('Erro ao atualizar banco:', e);
                // Reverter se der erro crítico no banco
                setIsOnline(!nextState);
                toastError('Falha ao comunicar com o servidor. Tente novamente.');
            }
        }
    };


    // Remote Eject Listener (Kill Switch)
    // Monitora se o entregador foi desativado/ejetado pelo admin
    useEffect(() => {
        if (!driverId || !isAuthenticated) return;

        const channel = supabase
            .channel(`remote_eject_${driverId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'drivers_delivery',
                filter: `id=eq.${driverId}`
            }, (payload) => {
                // Se is_active mudar para false, ejeta na hora
                if (payload.new && payload.new.is_active === false) {
                    console.log('[EJECT] Sessão ejetada remotamente!');
                    handleLogout();
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [driverId, isAuthenticated]);

    const syncMissionWithDB = useCallback(async () => {
        if (!driverId || !isAuthenticated) return;
        try {
            console.log('[SYNC] Sincronizando missão ativa do banco...');
            const dId = String(driverId).trim();
            const { data: orders, error: qErr } = await supabase.from('orders_delivery')
                .select('*')
                .eq('driver_id', dId)
                .order('created_at', { ascending: false })
                .limit(10);

            if (qErr) throw qErr;

            const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
            const activeOrder = orders?.find((o: any) => 
                !['concluido', 'cancelado', 'pendente_pagamento', 'finalizado', 'entregue'].includes(o.status) &&
                !financialTypes.includes(o.service_type)
            );

            if (activeOrder) {
                const mission: any = { 
                    ...activeOrder, 
                    realId: activeOrder.id, 
                    type: activeOrder.service_type || 'delivery', 
                    origin: activeOrder.pickup_address || 'Origem', 
                    destination: activeOrder.delivery_address || 'Destino', 
                    price: activeOrder.total_price || 0, 
                    status: activeOrder.status, 
                    preparation_status: activeOrder.preparation_status || 'preparando',
                    customer: activeOrder.user_name || 'Cliente Izi' 
                };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                setActiveTab('active_mission');
                toastSuccess('Missão recuperada!');
                console.log('[SYNC] Missão restaurada do banco:', mission.realId);
            } else {
                console.log('[SYNC] Nenhuma missão ativa no banco para o motorista:', driverId);
                if (orders && orders.length > 0) {
                    console.log('[SYNC] Pedidos recentes encontrados mas nenhum ativo:', orders.map(o => o.status));
                }
                toastError('Nenhuma missão ativa encontrada no servidor.');
            }
        } catch (err: any) {
            console.error('[SYNC] Falha ao sincronizar missão:', err.message);
        }
    }, [driverId, isAuthenticated]);

    useEffect(() => {
        syncMissionWithDB();
    }, [driverId, isAuthenticated, syncMissionWithDB]);

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
            const today = new Date().toISOString();
            const { data } = await supabase
                .from('orders_delivery')
                .select('*, merchant_id')
                .not('scheduled_at', 'is', null)
                .or(`status.eq.pendente,status.eq.agendado,status.eq.a_caminho,status.eq.preparando,driver_id.eq.${driverId}`)
                .gte('scheduled_at', today)
                .order('scheduled_at', { ascending: true });

            if (data) setScheduledOrders(data);
        };

        fetchScheduled();

        // Realtime para agendamentos
        const scheduledChannel = supabase.channel('scheduled_orders_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_at) {
                    setScheduledOrders(prev => [...prev, o].sort((a, b) =>
                        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
                    ));
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_at) {
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
            const { data, error } = await supabase.from('orders_delivery').select('*').in('status', ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver']);
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
            setOrders(data.map((o: any) => ({ 
              ...o,
              id: o.id.slice(0, 8).toUpperCase(), 
              realId: o.id, 
              type: o.service_type as ServiceType, 
              origin: o.pickup_address, 
              destination: o.delivery_address, 
              price: o.total_price,
              pickup_lat: o.pickup_lat,
              pickup_lng: o.pickup_lng,
              delivery_lat: o.delivery_lat,
              delivery_lng: o.delivery_lng,
              status: o.status,
              preparation_status: o.preparation_status || 'preparando',
              customer: 'Cliente Izi' 
            })).filter((o: any) => !cleanDeclined[o.realId]));
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
                
                // Filtros de segurança e status
                if (!['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver'].includes(o.status)) return;
                if (Date.now() - (declinedMap[o.id] || 0) < 5000) return;
                
                // Ignorar transações financeiras (Izi Coin, Assinatura) que não são missões
                const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                if (financialTypes.includes(o.service_type)) return;

                // Restringir sons por categoria e status (Evitar barulho precoce em Food)
                const isMobility = ['mototaxi', 'car_ride', 'frete', 'motorista_particular', 'package'].includes(o.service_type);
                const isFoodReady = ['pronto', 'waiting_driver'].includes(o.status);
                
                // Só toca som se: (É Mobilidade e status inicial OK) OU (É Food e já está pronto)
                // E também semente se o pagamento já foi aprovado ou é em dinheiro
                const isPaidOrCash = o.payment_method === 'cash' || o.payment_status === 'paid' || o.payment_method === 'dinheiro';
                const shouldSound = (isMobility || isFoodReady) && isPaidOrCash;

                setOrders(prev => {
                    if (prev.find(x => x.realId === o.id)) return prev;
                    
                    // Só toca som se estiver online e passar no filtro de categoria
                    if (isOnline && shouldSound) {
                        playIziSound('driver');
                        if (Notification.permission === 'granted') {
                            new Notification('🚀 Nova Missão Izi!', { 
                                body: `Coleta: ${o.pickup_address}`, 
                                icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' 
                            });
                        }
                    }

                    const mapped = { 
                        id: o.id.slice(0, 8).toUpperCase(), 
                        realId: o.id, 
                        type: o.service_type, 
                        origin: o.pickup_address, 
                        destination: o.delivery_address, 
                        price: o.total_price, 
                        customer: 'Cliente Izi',
                        pickup_lat: o.pickup_lat,
                        pickup_lng: o.pickup_lng,
                        delivery_lat: o.delivery_lat,
                        delivery_lng: o.delivery_lng,
                        preparation_status: o.preparation_status
                    };
                    return [mapped, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                const currentMission = activeMissionRef.current;
                
                // Sincronização Global de Missão Ativa (Multi-dispositivos)
                const dId = String(driverId).trim();
                if (o.driver_id === dId) {
                    console.log('[REALTIME] Sincronizando mudança de status da minha missão:', o.status);
                    
                    // Lógica de Limpeza: Se o pedido foi cancelado ou concluído em outro dispositivo
                    if (['concluido', 'cancelado', 'finalizado', 'entregue'].includes(o.status)) {
                        console.log('[REALTIME] Missão finalizada detectada. Limpando estado local.');
                        setActiveMission(null);
                        localStorage.removeItem('Izi_active_mission');
                        if (activeTabRef.current === 'active_mission') setActiveTab('dashboard');
                        return;
                    }

                    if (!currentMission || o.id === currentMission.id) {
                        const wasPreparing = currentMission?.preparation_status !== 'pronto';
                        const isNowReady = o.preparation_status === 'pronto';

                        if (wasPreparing && isNowReady) {
                            playIziSound('driver');
                            toastSuccess('🔥 O Pedido está PRONTO para coleta!');
                            if (Notification.permission === 'granted') new Notification('📦 Pedido Pronto!', { body: 'O estabelecimento finalizou o preparo. Pode coletar!' });
                        }

                        // Sincronizar o status da missão ativa com o servidor
                        const mission: any = { 
                            ...o, 
                            realId: o.id, 
                            type: o.service_type || 'delivery', 
                            origin: o.pickup_address || 'Origem', 
                            destination: o.delivery_address || 'Destino', 
                            price: o.total_price || 0, 
                            customer: o.user_name || 'Cliente Izi' 
                        };
                        
                        setActiveMission(mission);
                        localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                        
                        // Se não estivermos na tela de missão, mudar para lá automaticamente
                        if (activeTabRef.current !== 'active_mission') {
                            setActiveTab('active_mission');
                        }
                        return;
                    }
                }

                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                if (['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver'].includes(o.status) && !(Date.now() - (declinedMap[o.id] || 0) < 5000)) {
                    setOrders(prev => {
                        const isNew = !prev.find(x => x.realId === o.id);
                        if (isNew) {
                            // Ignorar transações financeiras
                            const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                            if (financialTypes.includes(o.service_type)) return prev;

                            // Mesma lógica de filtro de som: Food só quando pronto, Mobilidade sempre que novo, e Pago/Dinheiro
                            const isMobility = ['mototaxi', 'car_ride', 'frete', 'motorista_particular', 'package'].includes(o.service_type);
                            const isFoodReady = ['pronto', 'waiting_driver'].includes(o.status);
                            const isPaidOrCash = o.payment_method === 'cash' || o.payment_status === 'paid' || o.payment_method === 'dinheiro';
                            const shouldSound = (isMobility || isFoodReady) && isPaidOrCash;

                            if (isOnline && shouldSound) {
                                playIziSound('driver');
                                if (Notification.permission === 'granted') {
                                    new Notification('📦 Pedido Disponível!', { 
                                        body: `Coleta: ${o.pickup_address}`, 
                                        icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' 
                                    });
                                }
                            }
                            return [{ ...o, id: o.id.slice(0, 8).toUpperCase(), realId: o.id, type: o.service_type, origin: o.pickup_address, destination: o.delivery_address, price: o.total_price, customer: 'Cliente Izi' }, ...prev];
                        }
                        return prev;
                    });
                } else if (!['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver'].includes(o.status) && (!currentMission || o.id !== currentMission.id)) {
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
            
            // 1. Buscar pedidos disponíveis
            const { data } = await supabase.from('orders_delivery').select('*').in('status', ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver']);
            if (data) {
                setOrders(data.map((o: any) => ({ 
                    ...o,
                    id: o.id.slice(0, 8).toUpperCase(), 
                    realId: o.id, 
                    type: o.service_type as ServiceType, 
                    origin: o.pickup_address, 
                    destination: o.delivery_address, 
                    price: o.total_price, 
                    customer: 'Cliente Izi',
                    pickup_lat: o.pickup_lat,
                    pickup_lng: o.pickup_lng,
                    delivery_lat: o.delivery_lat,
                    delivery_lng: o.delivery_lng,
                    preparation_status: o.preparation_status
                })));
            }

            // 2. Buscar Missão Ativa (Se o app perdeu o estado mas o banco ainda tem)
            if (driverId) {
                console.log('[SYNC] Verificando missões ativas no banco para driver:', driverId);
                const { data: myActive, error: syncError } = await supabase
                    .from('orders_delivery')
                    .select('*')
                    .eq('driver_id', driverId)
                    .not('status', 'in', '(concluido,cancelado,finalizado,entregue)')
                    .maybeSingle();
                
                if (syncError) console.error('[SYNC] Erro ao buscar missão ativa:', syncError);

                if (myActive) {
                    console.log('[SYNC] Missão ativa recuperada do banco:', myActive.id);
                    const mission = { 
                        ...myActive, 
                        realId: myActive.id, 
                        type: myActive.service_type, 
                        origin: myActive.pickup_address, 
                        destination: myActive.delivery_address, 
                        price: myActive.total_price,
                        customer: myActive.user_name || 'Cliente Izi'
                    };
                    setActiveMission(mission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                    setActiveTab('active_mission');
                    toastSuccess('Sincronizado! Missão ativa recuperada.');
                } else {
                    toastSuccess('Sincronizado! ' + (data?.length || 0) + ' pedidos encontrados.');
                }
            } else {
                toastSuccess('Sincronizado! ' + (data?.length || 0) + ' pedidos encontrados.');
            }
        } catch (err) { 
            console.error('[SYNC] Erro:', err);
            toastError('Erro ao sincronizar.'); 
        } finally { 
            setTimeout(() => setIsSyncing(false), 1000); 
        }
    };

    // Startup / Session Recovery: Buscar missão ativa no banco se o driverId estiver presente
    useEffect(() => {
        const recoverActiveMission = async () => {
            if (!driverId || activeMission) return;
            
            console.log('[RECOVERY] Buscando missão ativa no servidor...');
            const { data, error } = await supabase
                .from('orders_delivery')
                .select('*')
                .eq('driver_id', driverId)
                .not('status', 'in', ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'])
                .maybeSingle();

            if (error) console.error('[RECOVERY] Erro na query:', error);

            if (data && !error) {
                console.log('[RECOVERY] Missão encontrada:', data.id);
                const mission = { 
                    ...data, 
                    realId: data.id, 
                    type: data.service_type, 
                    origin: data.pickup_address, 
                    destination: data.delivery_address, 
                    price: data.total_price,
                    customer: data.user_name || 'Cliente Izi'
                };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
            }
        };
        recoverActiveMission();
    }, [driverId, isAuthenticated]);



    const getCategory = (rawType: string): string => {
        const type = normalizeServiceType(rawType);
        if (['restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy'].includes(type)) return 'motoboy';
        if (['car_ride', 'mototaxi'].includes(type)) return 'car_ride';
        if (['frete', 'van', 'utilitario'].includes(type)) return 'frete';
        if (type === 'motorista_particular') return 'motorista_particular';
        return 'all';
    };

    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter((o: any) => getCategory(o.type) === filter);
    }, [filter, orders, normalizeServiceType]);

    const handleAccept = async (order: Order) => {
        if (isAccepting) return;
        setIsAccepting(true);
        try {
            // Validar UUID — order.id é o ID curto (8 chars), order.realId é o UUID completo
            const targetId = order.realId ?? order.id;
            // Validação de ID mais flexível
            if (!targetId || String(targetId).length < 5) {
                console.error('[handleAccept] ID inválido:', targetId, '| order:', order);
                toastError('ID do pedido inválido. Tente sincronizar a lista.');
                setOrders(prev => prev.filter((o: any) => o.realId !== order.realId));
                return;
            }

            console.log('[handleAccept] Tentando aceitar:', targetId);
            const { data: realOrder, error: findError } = await supabase.from('orders_delivery').select('*').eq('id', targetId).single();
            
            if (findError || !realOrder) {
                console.error('[handleAccept] Pedido não encontrado no banco:', targetId, findError);
                toastError('Pedido não encontrado ou já aceito por outro.');
                setOrders(prev => prev.filter((o: any) => o.realId !== order.realId));
                return;
            }

            if (!['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'a_caminho_coleta'].includes(realOrder.status)) {
                toastError('Este pedido já foi processado ou cancelado.');
                setOrders(prev => prev.filter((o: any) => o.realId !== order.realId));
                return;
            }
            if (!driverId) { 
                console.error('[handleAccept] driverId is missing!');
                toastError('Sessão expirada. Faça login novamente.'); 
                return; 
            }

            console.log('[handleAccept] Salvando no banco:', { orderId: realOrder.id, driverId });
            const { error: updError } = await supabase.from('orders_delivery')
                .update({ status: 'a_caminho_coleta', driver_id: driverId })
                .eq('id', realOrder.id);
            
            if (updError) {
                console.error('[handleAccept] Erro no update do banco:', updError);
                throw updError;
            }
            playIziSound('success');
            const mission = { ...order, ...realOrder, id: realOrder.id, realId: realOrder.id, status: 'a_caminho_coleta' };
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
        setIsAccepting(true);
        try {
            const missionId = activeMission.realId || activeMission.id;
            
            // 1. Atualizar o pedido no banco de dados primeiro
            console.log('[STATUS UPDATE] Changing mission status:', { missionId, newStatus });
            const { error: statusError } = await supabase.from('orders_delivery')
                .update({ status: newStatus })
                .eq('id', missionId);
            
            if (statusError) {
                console.error('[STATUS UPDATE] DB update error:', statusError);
                throw statusError;
            }

            // 2. Se for um status de FINALIZAÇÃO (Sucesso)
            const finishStatus = ['concluido', 'entregue', 'finalizado', 'delivered'];
            if (finishStatus.includes(newStatus.toLowerCase())) {
                const netEarnings = getNetEarnings(activeMission);
                
                // Registrar ganho Financeiro (Líquido)
                console.log('[FINALIZE] Recording transaction for driver:', driverId, 'Amount:', netEarnings);
                
                if (!driverId) {
                    console.error('[FINALIZE] CRITICAL: driverId is missing during transaction recording!');
                    toastError('Erro: Sua ID de motorista não foi encontrada.');
                } else {
                    try {
                        const { error: wErr } = await supabase.from('wallet_transactions_delivery').insert({
                            user_id: driverId,
                            amount: netEarnings,
                            type: 'deposito',
                            description: `Ganhos: Missão #${missionId.slice(0, 8).toUpperCase()} (Líquido)`
                        });

                        if (wErr) {
                            console.error('[FINALIZE] Wallet insert error:', wErr);
                            toastError('Erro ao creditar saldo: ' + wErr.message);
                        } else {
                            console.log('[FINALIZE] Wallet transaction recorded successfully. Fetching finance updates...');
                            // Forçar atualização imediata do estado de finanças
                            await fetchFinanceData();
                        }
                    } catch (txErr: any) {
                        console.error('[FINALIZE] Transaction exception:', txErr);
                        toastError('Erro ao registrar transação.');
                    }
                }

                toastSuccess('Missão concluída com sucesso!');

                // Limpar missão ativa e atualizar histórico
                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
                fetchMissionHistory();
            } 
            // 3. Se for CANCELAMENTO
            else if (['cancelado'].includes(newStatus)) {
                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
                toastSuccess('Pedido cancelado.');
            }
            // 4. Status intermediário (A caminho, etc)
            else {
                const updatedMission = { ...activeMission, status: newStatus };
                setActiveMission(updatedMission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(updatedMission));
                toastSuccess('Status atualizado!');
            }
        } catch (e: any) {
            console.error('[STATUS] Erro ao atualizar:', e);
            toastError('Erro ao atualizar status: ' + (e.message || 'Tente novamente.'));
            
            // Se o erro for que o pedido não existe mais ou algo fatal, limpa a tela
            if (e.message?.includes('not found') || e.message?.includes('invalid input syntax')) {
                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
            }
        } finally {
            setIsAccepting(false);
        }
    };

    const fetchMissionHistory = async () => {
        if (!driverId) return;
        try {
            const { data, error } = await supabase
                .from('orders_delivery')
                .select('*')
                .eq('driver_id', driverId)
                .in('status', ['concluido', 'finalizado', 'entregue'])
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                const formatted = data.map(o => ({
                    ...o,
                    price: Number(o.total_price || 0),
                    type: o.service_type || 'package',
                    // Fallback para nomes de destino se estiver vazio
                    destination: o.delivery_address || o.destination || 'Destino ignorado',
                    // Formato estético para ID na lista
                    displayId: (o.id || "").slice(0, 8).toUpperCase()
                }));
                setHistory(formatted);
            }
        } catch (e) {
            console.error("History fetch error:", e);
        }
    };

    const fetchFinanceData = async () => {
        if (!driverId) return;
        setIsFinanceLoading(true);
        try {
            // Unidade de conta central: wallet_transactions_delivery
            const { data: txs } = await supabase
                .from('wallet_transactions_delivery')
                .select('*')
                .eq('user_id', driverId)
                .order('created_at', { ascending: false });

            if (txs) {
                const balance = txs.reduce((acc, t) => 
                    ['deposito', 'reembolso'].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 
                    0
                );
                
                const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
                const todaySum = txs
                    .filter(t => t.type === 'deposito' && new Date(t.created_at) >= startOfDay)
                    .reduce((acc, t) => acc + Number(t.amount), 0);
                
                const missionCount = txs.filter(t => t.type === 'deposito' && t.description?.includes('Missão')).length;

                setStats(prev => ({
                    ...prev,
                    balance: Math.max(0, balance),
                    today: todaySum,
                    count: missionCount,
                    level: Math.floor(missionCount / 10) + 1
                }));

                setEarningsHistory(txs.filter(t => t.type === 'deposito') as any);
                setWithdrawHistory(txs.filter(t => t.type === 'saque'));
            }
        } catch (e) {
            console.error("Finance fetch error:", e);
        } finally {
            setIsFinanceLoading(false);
        }
    };

    const handleWithdrawRequest = async () => {
        if (stats.balance < 10) return toastError('O saldo mínimo para saque é R$ 10,00');
        if (!pixKey) return toastError('Por favor, informe uma chave PIX antes de sacar.');

        if (!await showConfirm({ message: `Confirmar solicitação de saque de R$ ${stats.balance.toFixed(2)} para a chave PIX: ${pixKey}?` })) return;

        setIsFinanceLoading(true);
        try {
            // Registrar saída na carteira digital
            const { error } = await supabase.from('wallet_transactions_delivery').insert({
                user_id: driverId,
                amount: stats.balance,
                type: 'saque',
                description: `Saque solicitado via PIX: ${pixKey}`,
                status: 'pendente'
            });

            if (error) throw error;
            toastSuccess('Solicitação de transferência enviada! 🎉');
            fetchFinanceData();
        } catch (e: any) {
            toastError('Falha ao processar saque. Tente novamente.');
        } finally {
            setIsFinanceLoading(false);
        }
    };
    const handleLogout = async () => {
        try {
            // Tenta avisar o banco por 500ms no máximo
            if (driverId) {
                await Promise.race([
                    supabase.from('drivers_delivery').update({ is_online: false }).eq('id', driverId),
                    new Promise((resolve) => setTimeout(resolve, 500))
                ]);
            }
        } catch (e) {
            console.error('[LOGOUT] Erro BD:', e);
        }

        // Logout real no Supabase
        await supabase.auth.signOut().catch(() => {});

        // Limpar TUDO e forçar recarregamento para a raiz
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirecionamento forçado
        window.location.replace('/');
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
            <div className="flex flex-col items-end">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.5em] mb-0.5">Status Rede</span>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${isOnline ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'} transition-all`}>
                    <div className={`size-1.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest">{isOnline ? 'Ativo' : 'Inativo'}</span>
                </div>
            </div>
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
                            {[
                                { id: 'dashboard', label: 'Painel', icon: 'grid_view' },
                                { id: 'active_mission', label: 'Missão Ativa', icon: 'route', badge: activeMission ? 1 : 0 },
                                { id: 'dedicated', label: 'Vagas Dedicadas', icon: 'stars' },
                                { id: 'scheduled', label: 'Agendamentos', icon: 'event', badge: scheduledOrders.length },
                                { id: 'history', label: 'Histórico', icon: 'history' },
                                { id: 'earnings', label: 'Financeiro', icon: 'payments' },
                                { id: 'suporte', label: 'Suporte Izi', icon: 'support_agent', onClick: () => { setActiveTab('profile'); setIsMenuOpen(false); } },
                                { id: 'support', label: 'Suporte Izi', icon: 'support_agent', onClick: () => { window.open('https://wa.me/55...', '_blank'); setIsMenuOpen(false); } },
                                { id: 'profile', label: 'Meu Perfil', icon: 'person' }
                            ].map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={item.onClick || (() => { setActiveTab(item.id as any); setIsMenuOpen(false); })} 
                                    className={`w-full flex items-center gap-5 px-5 py-4.5 rounded-[22px] transition-all text-left group ${activeTab === item.id ? 'bg-primary text-slate-950 font-black shadow-lg shadow-primary/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                >
                                    <div className="relative">
                                        <Icon name={item.icon} size={22} />
                                        {item.badge > 0 && (
                                            <span className={`absolute -top-1.5 -right-1.5 size-5 ${item.id === 'active_mission' ? 'bg-emerald-500' : 'bg-blue-500'} text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#030712]`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-sm font-black uppercase tracking-[0.1em]">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                        <div className="pt-10 border-t border-white/5 space-y-6 mt-8">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Status Operacional</span>
                                <button onClick={handleToggleOnline} className={`h-8 w-14 rounded-full relative transition-all duration-500 ${isOnline ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : 'bg-white/10'}`}>
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
            {/* Card de Identidade e Nível */}
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shadow-lg shadow-primary/5">
                        <Icon name="person" size={28} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-0.5">Piloto Parceiro Izi</p>
                        <h3 className="text-xl font-black text-white tracking-tight">{driverName}</h3>
                    </div>
                </div>
                
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Nível Operacional</p>
                        <h3 className="text-xl font-black text-white tracking-tight">
                            {stats.level >= 10 ? 'Comandante' : stats.level >= 5 ? 'Veterano' : 'Soldado'}
                            <span className="text-xs text-primary ml-2 italic">Nív. {stats.level}</span>
                        </h3>
                        <div className="mt-3 h-1.5 w-40 bg-white/5 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.xp / stats.nextXp) * 100}%` }} className="h-full bg-gradient-to-r from-primary to-emerald-400 rounded-full" />
                        </div>
                        <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">{stats.xp}/{stats.nextXp} XP</p>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="flex items-center gap-3 justify-end">
                            <div><p className="text-[8px] text-white/20 uppercase tracking-widest">Hoje</p><p className="text-sm font-black text-white font-mono">R$ {stats.today.toFixed(0)}</p></div>
                            <div><p className="text-[8px] text-white/20 uppercase tracking-widest">Métricas</p><p className="text-sm font-black text-primary font-mono">{stats.count} ⚡</p></div>
                        </div>
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
                            const dt = new Date(order.scheduled_at);
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
                                                    {dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                    {` • ${dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-white truncate">{order.delivery_address}</p>
                                            <p className="text-[10px] text-white/30 truncate mt-0.5">{order.pickup_address}</p>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className="text-base font-black text-primary">R$ {getNetEarnings(order).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
                                                    time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                                    customer: 'Cliente Izi',
                                                    rating: 5.0,
                                                    scheduled_at: order.scheduled_at
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

            {/* Filtros de Categorias */}
            <div className="flex gap-4 overflow-x-auto no-scrollbar py-4 -mx-1 px-1">
                {[
                    { id: 'all', label: 'Todos', icon: 'grid_view', color: 'text-primary' },
                    { id: 'motoboy', label: 'Entregas', icon: 'package_2', color: 'text-emerald-400' },
                    { id: 'car_ride', label: 'Viagens', icon: 'directions_car', color: 'text-blue-400' },
                    { id: 'frete', label: 'Fretes', icon: 'local_shipping', color: 'text-orange-400' },
                    { id: 'motorista_particular', label: 'VIP', icon: 'military_tech', color: 'text-yellow-400' }
                ].map(item => {
                    const isActive = filter === item.id;
                    const count = item.id === 'all' 
                        ? orders.length 
                        : orders.filter(o => getCategory(o.type) === item.id).length;

                    return (
                        <button 
                            key={item.id} 
                            onClick={() => setFilter(item.id as any)} 
                            className={`flex flex-col items-start gap-5 p-6 rounded-[36px] min-w-[140px] transition-all shrink-0 border relative overflow-hidden ${
                                isActive 
                                    ? 'bg-primary border-primary shadow-2xl shadow-primary/30 text-slate-900 scale-105 z-10' 
                                    : 'bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06]'
                            }`}
                        >
                            {isActive && <div className="absolute top-0 right-0 p-4 opacity-10"><Icon name={item.icon} size={64} /></div>}
                            <div className={`size-12 rounded-[18px] flex items-center justify-center shadow-inner ${isActive ? 'bg-black/10' : 'bg-white/5 ' + item.color}`}>
                                <Icon name={item.icon} size={24} />
                            </div>
                            <div className="space-y-1 text-left">
                                <p className="text-[11px] font-black uppercase tracking-widest">{item.label}</p>
                                <p className={`text-[9px] font-black ${isActive ? 'text-slate-900/40' : 'text-white/10'} uppercase tracking-tight`}>
                                    {count} {count === 1 ? 'Job' : 'Jobs'}
                                </p>
                            </div>
                        </button>
                    );
                })}
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
                        <button onClick={handleToggleOnline} className="bg-primary text-slate-900 font-black px-8 py-3.5 rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all">Ficar Online</button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="py-16 bg-white/[0.02] border border-white/5 rounded-[32px] flex flex-col items-center gap-4 text-center">
                        <div className="size-16 rounded-[24px] bg-primary/5 border border-primary/10 flex items-center justify-center"><Icon name="radar" className="text-primary/40 text-3xl" /></div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Aguardando novas chamadas...</p>
                    </div>
                ) : filteredOrders.map((order: any, i: number) => {
                    const details = getTypeDetails(order.type);
                    // isMobility é determinado pelo label normalizado, não pelo tipo bruto
                    const isMobility = ['MotoTaxi', 'Carro', 'Motorista Particular', 'Motoboy'].includes(details.label);
                    return (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="bg-white/[0.03] border border-white/8 rounded-[32px] p-6 space-y-5">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`size-14 rounded-[20px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10`}><Icon name={details.icon} className="text-3xl" /></div>
                                    <div><p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${details.color}`}>{details.label}</p><h3 className="text-base font-black text-white">{isMobility ? 'Corrida de Passageiro' : (details.isFood ? 'Entrega de Refeição' : 'Entrega de Pacote')}</h3></div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Ganho Líquido</p>
                                    <p className="text-2xl font-black text-primary">R$ {getNetEarnings(order).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    {order.preparation_status === 'pronto' && (
                                        <div className="mt-2 flex items-center justify-end gap-1 text-emerald-400">
                                            <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                            <span className="text-[9px] font-black uppercase tracking-widest">Já está Pronto</span>
                                        </div>
                                    )}
                                </div>
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
                        const dateObj = new Date(order.created_at);
                        const formattedDate = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                        const formattedTime = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                        return (
                            <motion.div key={order.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white/[0.03] border border-white/5 rounded-[24px] p-5 flex items-center gap-4">
                                <div className={`size-12 rounded-[18px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10 shrink-0`}><Icon name={details.icon} className="text-2xl" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{order.destination.split(',')[0]}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[8px] font-black text-white/30 uppercase">{formattedDate} às {formattedTime}</span>
                                        <div className="size-1 rounded-full bg-emerald-400/30" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Concluída</span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-white">R$ {getNetEarnings(order).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                    <p className="text-[8px] font-black text-white/20 uppercase">#{order.displayId || order.id?.slice(0,8)}</p>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );

    const renderEarningsView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-24 pt-4">
            <div className="flex items-center justify-between">
                <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Financeiro</p><h2 className="text-3xl font-black text-white tracking-tight mt-1">Rendimentos</h2></div>
                <button onClick={fetchFinanceData} disabled={isFinanceLoading} className="size-10 bg-white/5 rounded-2xl flex items-center justify-center active:rotate-180 transition-all duration-500">
                    <Icon name="refresh" className={`text-white/40 ${isFinanceLoading ? 'animate-spin' : ''}`} />
                </button>
            </div>
            
            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-[40px] p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Icon name="account_balance_wallet" className="text-[120px] text-primary -rotate-12" /></div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">Saldo Disponível</p>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-primary opacity-50">R$</span>
                    <p className="text-5xl font-black text-white tracking-tight">{stats.balance.toFixed(2).replace('.', ',')}</p>
                </div>
                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={handleWithdrawRequest}
                        disabled={isFinanceLoading || stats.balance < 10}
                        className="flex-1 bg-primary text-slate-900 font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all py-4 disabled:opacity-50"
                    >
                        {isFinanceLoading ? 'Processando...' : 'Sacar via PIX'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Hoje', value: `R$ ${stats.today.toFixed(0)}`, icon: 'today', color: 'text-primary' }, { label: 'Total Ganhos', value: `R$ ${(stats.balance + withdrawHistory.filter(w => w.status === 'concluido').reduce((a,b) => a + b.amount, 0)).toFixed(0)}`, icon: 'account_balance', color: 'text-emerald-400' }, { label: 'Corridas', value: stats.count.toString(), icon: 'route', color: 'text-blue-400' }, { label: 'Nível', value: stats.level.toString(), icon: 'military_tech', color: 'text-yellow-400' }].map((stat, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/5 rounded-[24px] p-5 space-y-2">
                        <Icon name={stat.icon} className={`${stat.color} text-xl`} /><p className="text-[8px] font-black text-white/20 uppercase tracking-widest">{stat.label}</p><p className="text-xl font-black text-white">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Extrato Recente */}
            <div className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Extrato Recente</p>
                    <Icon name="history" className="text-white/10" size={16} />
                </div>
                <div className="space-y-4">
                    {[...earningsHistory.slice(0, 3), ...withdrawHistory.slice(0, 3)]
                        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item: any, i: number) => {
                            const isWithdraw = item.amount !== undefined && item.pix_key !== undefined;
                            return (
                                <div key={i} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${isWithdraw ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            <Icon name={isWithdraw ? 'arrow_outward' : 'add_circle'} size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">{isWithdraw ? 'Saque PIX' : (item.type === 'package' ? 'Entrega' : 'Corrida')}</p>
                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${isWithdraw ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {isWithdraw ? '-' : '+'} R$ {(item.price || item.amount || 0).toFixed(2)}
                                        </p>
                                        {isWithdraw && <p className={`text-[7px] font-black uppercase tracking-widest ${item.status === 'concluido' ? 'text-emerald-400' : 'text-yellow-400'}`}>{item.status}</p>}
                                    </div>
                                </div>
                            );
                        })
                    }
                    {earningsHistory.length === 0 && withdrawHistory.length === 0 && (
                        <p className="text-[10px] text-white/20 text-center py-4">Nenhuma transação registrada</p>
                    )}
                </div>
            </div>

            {/* Gestão de Chave PIX */}
            {!pixKey && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <Icon name="account_balance" className="text-emerald-400" />
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Configurar Saque</p>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed">Cadastre sua chave PIX para habilitar os saques automáticos de seus rendimentos.</p>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            placeholder="Sua chave PIX (CPF, E-mail ou Telefone)"
                            id="pix_input"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary outline-none"
                        />
                        <button 
                            onClick={() => {
                                const val = (document.getElementById('pix_input') as HTMLInputElement).value;
                                if (val) {
                                    setPixKey(val);
                                    const savePixKey = async () => {
                                        if (!driverId) return;
                                        try {
                                            // Salvar no banco para sincronizar entre aparelhos
                                            const { error } = await supabase
                                                .from('drivers_delivery')
                                                .update({ bank_info: { pix_key: val } })
                                                .eq('id', driverId);
                                            
                                            if (error) throw error;
                                            
                                            localStorage.setItem('izi_driver_pix', val);
                                            setShowPixModal(false);
                                        } catch (e: any) {
                                            alert('Erro ao salvar chave PIX: ' + e.message);
                                        }
                                    };
                                    savePixKey();
                                    toastSuccess('Chave PIX salva!');
                                }
                            }}
                            className="bg-primary text-slate-900 px-4 py-3 rounded-xl text-[10px] font-black uppercase"
                        >Salvar</button>
                    </div>
                </div>
            )}
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
                const dt = new Date(order.scheduled_at);
                const isPending = order.status === 'pendente' ||  order.status === 'agendado';
                const isAccepted = order.driver_id === driverId;
                const isMyAccepted = isAccepted;
                const statusColor = isMyAccepted ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : isPending ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-white/40 bg-white/5 border-white/10';
                const statusLabel = isMyAccepted ? '✓ Aceito por você' : isPending ? 'Disponível' : order.status;
                const isToday = dt.toDateString() === new Date().toDateString();
                const isTomorrow = dt.toDateString() === new Date(Date.now() + 86400000).toDateString();
                const dateLabel = isToday ? 'Hoje' : isTomorrow ? 'Amanhã' : dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

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
                                <p className="text-[10px] text-white/30">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + 'h'}</p>
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
                                    time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                    customer: 'Cliente Izi',
                                    rating: 5.0,
                                    scheduled_at: order.scheduled_at
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
                <div className="flex items-center gap-4 py-2 mt-4">
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"><Icon name="star" className="text-primary text-sm" /><span className="text-sm font-black text-white">4.98</span></div>
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"><Icon name="route" className="text-emerald-400 text-sm" /><span className="text-sm font-black text-white">{stats.count} corridas</span></div>
                </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-6 space-y-4">
                <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Zona de Recuperação</p>
                    <p className="text-[11px] text-white/40 leading-relaxed">Se o app estiver travado em uma missão antiga ou invisível, use os botões abaixo para sincronizar ou forçar limpeza.</p>
                </div>
                <div className="flex gap-2">
                  <button 
                      onClick={() => {
                          syncMissionWithDB();
                          toastSuccess('Sincronizando...');
                      }}
                      className="flex-1 h-12 bg-white/5 border border-white/10 text-white/70 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                  >
                      Sincronizar Missão
                  </button>
                  <button 
                      onClick={() => {
                          if (confirm('Deseja forçar a limpeza da missão atual do seu celular?')) {
                              setActiveMission(null);
                              localStorage.removeItem('Izi_active_mission');
                              setActiveTab('dashboard');
                              toastSuccess('Limpeza concluída!');
                          }
                      }}
                      className="flex-1 h-12 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                  >
                      Forçar Finalização
                  </button>
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
        
        // Helper para extrair itens se estiverem no endereço ou no JSON
        const getOrderItems = () => {
            if (activeMission.items && Array.isArray(activeMission.items)) return activeMission.items;
            const address = activeMission.delivery_address || activeMission.destination || '';
            if (address.includes('| ITENS:')) {
                return address.split('| ITENS:')[1].split(',').map(i => ({ name: i.trim() }));
            }
            return [];
        };

        const orderItems = getOrderItems();
        const addressOnly = (activeMission.delivery_address || activeMission.destination || '').split('| ITENS:')[0].trim();

        // Status Label & Color logic
        const getStatusDisplay = () => {
            switch(activeMission.status) {
                case 'saiu_para_coleta':
                case 'a_caminho_coleta': return { label: 'Indo retirar', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: 'navigation' };
                case 'no_local_coleta':
                case 'chegou_coleta': return { label: 'No local de coleta', color: 'text-amber-400', bg: 'bg-amber-400/10', icon: 'location_on' };
                case 'picked_up': return { label: 'Pedido coletado', color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: 'package_2' };
                case 'a_caminho': 
                case 'em_rota': return { label: 'Em rota de entrega', color: 'text-primary', bg: 'bg-primary/10', icon: 'moped' };
                case 'no_local': return { label: 'No destino final', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: 'person_pin_circle' };
                default: return { label: 'Em andamento', color: 'text-white/40', bg: 'bg-white/5', icon: 'radar' };
            }
        };

        const statusDisplay = getStatusDisplay();

        return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#020617] flex flex-col overflow-hidden">
                {/* Header Compacto */}
                {!isMapOnly && (
                    <div className="px-6 py-5 bg-[#020617]/90 backdrop-blur-3xl border-b border-white/10 flex items-center justify-between shrink-0 z-[110]">
                        <div className="flex items-center gap-4">
                            <button 
                                onClick={() => setActiveTab('dashboard')}
                                className="size-11 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40 active:scale-90 transition-all mr-1"
                                title="Minimizar para o Dashboard"
                            >
                                <span className="material-symbols-outlined text-xl">arrow_back</span>
                            </button>
                            <div className={`size-12 rounded-2xl ${statusDisplay.bg} ${statusDisplay.color} flex items-center justify-center border border-current/20 shadow-lg shadow-black/20`}>
                                <Icon name={statusDisplay.icon} size={24} className="animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.4em]">Missão Ativa</span>
                                    <div className="size-1 rounded-full bg-white/20" />
                                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em]">#{activeMission.realId?.slice(0,8).toUpperCase()}</span>
                                </div>
                                <h2 className="text-base font-black text-white tracking-tight uppercase mt-0.5">{statusDisplay.label}</h2>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* SOS Removido por solicitação */}
                        </div>
                    </div>
                )}

                <div className="flex-1 bg-[#030a1a] relative overflow-hidden">
                    <IziRealTimeMap 
                      driverCoords={driverCoords} 
                      destCoords={activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'a_caminho' || activeMission.status === 'saiu_para_entrega'
                        ? { lat: activeMission.delivery_lat, lng: activeMission.delivery_lng } 
                        : { lat: activeMission.pickup_lat, lng: activeMission.pickup_lng }
                      }
                      destAddress={activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'a_caminho' || activeMission.status === 'saiu_para_entrega'
                        ? addressOnly
                        : (activeMission.origin || activeMission.pickup_address)
                      }
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#020617]/40 via-transparent to-[#030712]/40" />
                    
                    {/* Botão flutuante para alternar modo mapa / painel completo */}
                    <button 
                        onClick={() => setIsMapOnly(!isMapOnly)}
                        className={`absolute bottom-6 left-6 z-50 h-14 px-6 rounded-2xl flex items-center justify-center gap-3 border shadow-2xl transition-all active:scale-90 ${isMapOnly ? 'bg-primary text-slate-950 border-primary/50 shadow-primary/30' : 'bg-slate-900/90 text-white border-white/10 backdrop-blur-xl shadow-black/50'}`}
                    >
                        <Icon name={isMapOnly ? 'expand_less' : 'expand_more'} size={20} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{isMapOnly ? 'Abrir Painel' : 'Recolher'}</span>
                    </button>

                    {/* Navegação Rápida no Mapa */}
                    <button 
                         onClick={() => {
                            const isDeliveryPhase = activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'a_caminho' || activeMission.status === 'saiu_para_entrega';
                            const lat = isDeliveryPhase ? activeMission.delivery_lat : activeMission.pickup_lat;
                            const lng = isDeliveryPhase ? activeMission.delivery_lng : activeMission.pickup_lng;
                            const addressText = isDeliveryPhase ? addressOnly : (activeMission.origin || activeMission.pickup_address);
                            let destination = '';
                            if (lat && lng) destination = `${lat},${lng}`;
                            else if (addressText) destination = encodeURIComponent(addressText);
                            if (destination) window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                        }}
                        className="absolute bottom-6 right-24 z-50 size-14 bg-blue-600/90 text-white rounded-2xl flex items-center justify-center border border-white/10 shadow-2xl active:scale-90 transition-all"
                    >
                        <Icon name="navigation" size={24} />
                    </button>
                </div>

                {/* Painel Inferior Expandido */}
                {!isMapOnly && (
                <div className="max-h-[60%] overflow-y-auto no-scrollbar bg-[#030712] border-t border-white/5 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] flex flex-col">
                    <div className="p-6 space-y-6">
                        {/* Seção 1: Cliente e Pagamento */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                                    <Icon name="person" size={24} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Cliente</p>
                                    <h3 className="text-base font-black text-white">{activeMission.user_name || activeMission.customer || 'Usuário Izi'}</h3>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] font-black text-primary uppercase tracking-widest">Valor Líquido a Receber</p>
                                <p className="text-2xl font-black text-primary">R$ {getNetEarnings(activeMission).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                <p className="text-[8px] text-white/30 uppercase font-black">{activeMission.payment_method === 'dinheiro' ? 'Dinheiro (Na Entrega)' : 'Pago pelo App'}</p>
                            </div>
                        </div>

                        {/* Seção 2: Itens do Pedido (se houver) */}
                        {orderItems.length > 0 && (
                            <div className="bg-white/[0.02] border border-white/5 rounded-[24px] p-5 space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <Icon name="package_2" className="text-white/20" size={14} />
                                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Itens do Pedido</p>
                                </div>
                                <div className="space-y-2">
                                    {orderItems.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-white/70">
                                            <span>{item.quantity ? `${item.quantity}x ` : ''}{item.name}</span>
                                            {item.price && <span className="text-white/30">R$ {item.price.toFixed(2)}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Seção 3: Endereços com Linha de Tempo */}
                        <div className="bg-white/[0.03] border border-white/8 rounded-[28px] p-6 space-y-5">
                            <div className="relative">
                                <div className="absolute left-[11px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-blue-500/20 via-primary/20 to-primary/40" />
                                
                                <div className="flex items-start gap-5 relative z-10">
                                    <div className={`mt-1.5 size-6 rounded-full flex items-center justify-center shrink-0 ${['a_caminho_coleta', 'chegou_coleta', 'saiu_para_coleta', 'no_local_coleta'].includes(activeMission.status || '') ? 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)] ring-4 ring-blue-500/20' : 'bg-white/10'}`}>
                                        <Icon name="hospital" size={12} className="text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Retirada: {activeMission.merchant_name || 'Estabelecimento'}</p>
                                        <p className="text-sm font-bold text-white/80 leading-tight">{activeMission.origin || activeMission.pickup_address}</p>
                                        
                                        {/* Status de Preparo do Lojista */}
                                        {activeMission.preparation_status && ['a_caminho_coleta', 'chegou_coleta', 'saiu_para_coleta', 'no_local_coleta'].includes(activeMission.status || '') && (
                                            <div className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border shadow-lg ${
                                                activeMission.preparation_status === 'pronto' 
                                                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400 shadow-emerald-500/10' 
                                                : 'bg-amber-500/20 border-amber-500/30 text-amber-400 shadow-amber-500/10'
                                            }`}>
                                                <Icon 
                                                    name={activeMission.preparation_status === 'pronto' ? 'check_circle' : 'restaurant'} 
                                                    size={16} 
                                                    className={activeMission.preparation_status === 'preparando' ? 'animate-pulse' : ''} 
                                                />
                                                <span className="text-[10px] font-black uppercase tracking-widest">
                                                    {activeMission.preparation_status === 'pronto' ? 'Pronto para Retirada' : 'Em Preparação...'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="h-8" />

                                <div className="flex items-start gap-5 relative z-10">
                                    <div className={`mt-1.5 size-6 rounded-full flex items-center justify-center shrink-0 ${['picked_up', 'a_caminho', 'em_rota', 'no_local'].includes(activeMission.status || '') ? 'bg-primary shadow-[0_0_12px_rgba(255,217,0,0.5)] ring-4 ring-primary/20' : 'bg-white/10'}`}>
                                        <Icon name="location_on" size={12} className="text-slate-900" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] mb-1">Entrega: {activeMission.user_name || activeMission.customer || 'Cliente'}</p>
                                        <p className="text-sm font-black text-white leading-tight">{addressOnly}</p>
                                        {activeMission.notes && <p className="mt-2 text-[10px] text-primary/60 border-l border-primary/20 pl-2 italic">Obs: {activeMission.notes}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Seção 4: Botões de Ação */}
                        <div className="pt-4 space-y-4">
                            {/* Aceite -> No Local de Coleta */}
                            {(['a_caminho_coleta', 'saiu_para_coleta', 'confirmado', 'preparando', 'aceito', 'atribuido'].includes(activeMission.status || '')) && (
                                <div className="space-y-4">
                                    <button 
                                        onClick={() => handleUpdateStatus('chegou_coleta')} 
                                        disabled={isAccepting}
                                        className="w-full h-18 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 text-white font-black text-base uppercase tracking-widest rounded-3xl shadow-2xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 border border-white/10"
                                    >
                                        <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                                            <Icon name="location_on" size={24} />
                                        </div>
                                        <span className="flex-1 text-center pr-10">Cheguei na Coleta</span>
                                    </button>

                                    <button 
                                        onClick={async () => {
                                            if (await showConfirm({ message: 'Deseja realmente cancelar esta missão?' })) {
                                                await handleUpdateStatus('cancelado');
                                            }
                                        }}
                                        className="w-full py-4 text-red-500/50 text-[10px] font-black uppercase tracking-[0.3em] hover:text-red-500 transition-all"
                                    >
                                        Cancelar Missão
                                    </button>
                                </div>
                            )}

                            {/* Chegou Coleta -> Coletado */}
                            {(['chegou_coleta', 'no_local_coleta', 'waiting_driver'].includes(activeMission.status || '') || activeMission.status === 'pronto') && (
                                <button 
                                    onClick={() => handleUpdateStatus('picked_up')} 
                                    disabled={isAccepting}
                                    className={`w-full h-18 font-black text-base uppercase tracking-widest rounded-3xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 border border-white/10 ${activeMission.status === 'pronto' ? 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-400 text-white shadow-emerald-500/30 animate-pulse' : 'bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 text-white shadow-emerald-500/20'}`}
                                >
                                    <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                                        <Icon name="package_2" size={24} />
                                    </div>
                                    <span className="flex-1 text-center pr-10">Confirmar Coleta</span>
                                </button>
                            )}

                            {/* Coletado -> A Caminho / Em Rota */}
                            {activeMission.status === 'picked_up' && (
                                <button 
                                    onClick={() => handleUpdateStatus('a_caminho')} 
                                    disabled={isAccepting}
                                    className="w-full h-18 bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-300 text-slate-950 font-black text-base uppercase tracking-widest rounded-3xl shadow-2xl shadow-yellow-500/40 active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 border border-white/20"
                                >
                                    <div className="size-10 bg-black/10 rounded-xl flex items-center justify-center shadow-inner">
                                        <Icon name="moped" size={24} />
                                    </div>
                                    <span className="flex-1 text-center pr-10">Iniciar Entrega</span>
                                </button>
                            )}

                            {/* In Entrega -> No Destino */}
                            {(activeMission.status === 'a_caminho' || activeMission.status === 'em_rota') && (
                                <button 
                                    onClick={() => handleUpdateStatus('no_local')} 
                                    disabled={isAccepting}
                                    className="w-full h-18 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white font-black text-base uppercase tracking-widest rounded-3xl shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 border border-white/10"
                                >
                                    <div className="size-10 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                                        <Icon name="person_pin_circle" size={24} />
                                    </div>
                                    <span className="flex-1 text-center pr-10">Tô no Destino</span>
                                </button>
                            )}

                            {/* No Destino / Finalização -> Concluído */}
                            {(activeMission.status === 'no_local' || activeMission.status === 'saiu_para_entrega') && (
                                <button 
                                    onClick={() => handleUpdateStatus('concluido')} 
                                    disabled={isAccepting}
                                    className="w-full h-20 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 text-white font-black text-lg uppercase tracking-tight rounded-3xl shadow-[0_20px_50px_rgba(16,185,129,0.3)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50 border-t border-white/30"
                                >
                                    <div className="size-12 bg-white/30 rounded-2xl flex items-center justify-center shadow-md">
                                        <Icon name="check_circle" size={28} />
                                    </div>
                                    <span className="flex-1 text-center pr-12">{isMobility ? 'Encerrar Corrida' : 'Finalizar Entrega'}</span>
                                </button>
                            )}
                        </div>
                    </div>
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
                        <AnimatePresence>{activeMission && activeTab === 'active_mission' && renderActiveMissionView()}</AnimatePresence>
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
                                <motion.button 
                                    initial={{ scale: 0, y: 50 }} 
                                    animate={{ scale: 1, y: 0 }} 
                                    whileTap={{ scale: 0.9 }} 
                                    onClick={handleToggleOnline} 
                                    className={`fixed bottom-8 right-6 h-16 px-8 rounded-[30px] flex items-center justify-center gap-4 z-[90] shadow-2xl transition-all duration-500 border-2 ${
                                        isOnline 
                                        ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-emerald-500/40' 
                                        : 'bg-slate-900/90 backdrop-blur-xl border-white/10 text-white shadow-black/60'
                                    }`}
                                >
                                    <div className={`size-10 rounded-2xl flex items-center justify-center ${isOnline ? 'bg-slate-900/10' : 'bg-white/5'}`}>
                                        <Icon name={isOnline ? 'wifi_tethering' : 'wifi_tethering_off'} size={24} className={isOnline ? 'animate-pulse' : ''} />
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] opacity-40`}>Modo Piloto</span>
                                        <span className="text-sm font-black uppercase tracking-widest">{isOnline ? 'Ficar Offline' : 'Ficar Online'}</span>
                                    </div>
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
