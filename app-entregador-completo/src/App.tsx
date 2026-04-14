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
    backgroundColor: '#111111',
    styles: [
        { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#888888" }] },
        { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
        { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
        { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#1a1a1a" }] },
        { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
        { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
        { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
        { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#FACD05" }, { "weight": 4 }] },
        { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] },
        { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#333333" }] },
        { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#282828" }] },
        { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
        { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0e1626" }] }
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
    'power_settings_new': BespokeIcons.Power,
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
    'volume_up': BespokeIcons.Notifications,
    'visibility': BespokeIcons.History,
    'arrow_back': BespokeIcons.ChevronLeft,
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
const isValidCoord = (c: any) => c && typeof c.lat === 'number' && Math.abs(c.lat) > 0.01;

function IziRealTimeMap({ driverCoords, pickupCoords, pickupAddress, pickupName, deliveryCoords, deliveryAddress, deliveryName, currentStatus }: any) {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({ id: GOOGLE_MAPS_ID, googleMapsApiKey: mapsKey, libraries: GOOGLE_MAPS_LIBRARIES, language: 'pt-BR', region: 'BR' });
  const [routeData, setRouteData] = useState<any>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const lastDestRef = useRef<string>('');

  const isDeliveryPhase = ['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega', 'no_local', 'completed'].includes(currentStatus || '');
  const targetAddress = isDeliveryPhase ? deliveryAddress : pickupAddress;
  const vDriver = isValidCoord(driverCoords) ? driverCoords : null;

  // Waze-Style: Ultra Minimalist Dark
  const mapOptions = {
    disableDefaultUI: true,
    styles: [
      { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#8c92a3" }] },
      { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
      { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
      { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#111827" }] },
      { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#020617" }] },
      { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
      { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e293b" }] },
      { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#1e293b" }, { "lightness": -20 }] },
      { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#334155" }] },
      { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
      { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] }
    ],
    gestureHandling: "greedy" as const
  };

  useEffect(() => {
    if (!isLoaded || !vDriver || !targetAddress) return;
    const calc = async () => {
      try {
        const origin = { location: { latLng: { latitude: vDriver.lat, longitude: vDriver.lng } } };
        const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
          method: 'POST',
          headers: { "Content-Type": "application/json", "X-Goog-Api-Key": mapsKey, "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline" },
          body: JSON.stringify({ 
            origin, 
            destination: { address: targetAddress }, 
            travelMode: 'DRIVE', 
            routingPreference: 'TRAFFIC_AWARE',
            units: 'METRIC' 
          })
        });
        const data = await res.json();
        if (data.routes?.[0]) {
          const r = data.routes[0];
          setRouteData({
            poly: r.polyline.encodedPolyline,
            dist: (r.distanceMeters / 1000).toFixed(1) + ' km',
            dur: Math.ceil(parseInt(r.duration) / 60) + ' min'
          });
        }
      } catch (e) { console.error('MAP_ERR:', e); }
    };
    if (targetAddress !== lastDestRef.current) { lastDestRef.current = targetAddress; calc(); }
    const inv = setInterval(calc, 45000);
    return () => clearInterval(inv);
  }, [isLoaded, vDriver, targetAddress]);

  useEffect(() => { if (map && vDriver) map.panTo(vDriver); }, [map, vDriver]);

  if (loadError || !isLoaded || !vDriver) return null;

  return (
    <div className="absolute inset-0 z-0 text-white">
      <GoogleMap 
        mapContainerStyle={{ width: '100%', height: '100%' }} 
        onLoad={setMap} 
        center={vDriver} 
        zoom={18} 
        options={mapOptions}
      >
        <OverlayView position={vDriver} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div className="relative flex items-center justify-center">
            <div className="absolute size-8 rounded-full bg-primary/20 animate-ping" />
            <div className="absolute size-5 rounded-full bg-primary/40 border border-white/5 animate-pulse" />
            <div className="size-3.5 rounded-full bg-primary border border-white shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
          </div>
        </OverlayView>
        
        {routeData?.poly && (
          <Polyline 
            path={window.google.maps.geometry.encoding.decodePath(routeData.poly)} 
            options={{ 
              strokeColor: '#FACD05', 
              strokeOpacity: 0.9, 
              strokeWeight: 6,
              lineCap: 'round',
              lineJoin: 'round'
            }} 
          />
        )}
      </GoogleMap>

      {/* Indicador de Rota Ultra Minimalista */}
      {routeData && (
        <div className="absolute top-[115px] left-6 z-[60] animate-in fade-in slide-in-from-left-4 duration-700">
           <div className="px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2">
              <span className="text-[10px] font-black text-primary uppercase">{routeData.dur}</span>
              <div className="w-[1px] h-3 bg-white/10" />
              <span className="text-[10px] font-bold text-white/50 uppercase">{routeData.dist}</span>
           </div>
        </div>
      )}
    </div>
  );
}

// Normaliza aliases variados de service_type que vêm do banco de dados para os tipos canónicos
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
    if (['van'].includes(t)) return 'van';
    if (['utilitario', 'utilitario leve', 'utility'].includes(t)) return 'utilitario';
    if (['logistica', 'logistics'].includes(t)) return 'logistica';
    if (['frete', 'carreto', 'freight', 'mudanca', 'mudança'].includes(t)) return 'frete';
    if (['motoboy', 'courier'].includes(t)) return 'motoboy';
    if (['package', 'pacote', 'encomenda', 'express', 'delivery'].includes(t)) return 'package';
    return t; // retorna o tipo original se não houver mapeamento
};

const getTypeDetails = (rawType: string) => {
    const type = normalizeServiceType(rawType);
    switch (type) {
        case 'package': return { icon: 'package_2', color: 'text-primary', bg: 'bg-primary/10', label: 'Envio Express', isFood: false };
        case 'mototaxi': return { icon: 'two_wheeler', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'MotoTaxi', isFood: false };
        case 'car_ride': return { icon: 'directions_car', color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Carro', isFood: false };
        case 'frete': return { icon: 'local_shipping', color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Frete/Carreto', isFood: false };
        case 'van': return { icon: 'local_shipping', color: 'text-sky-400', bg: 'bg-sky-400/10', label: 'Van', isFood: false };
        case 'utilitario': return { icon: 'local_shipping', color: 'text-indigo-400', bg: 'bg-indigo-400/10', label: 'Utilitario', isFood: false };
        case 'logistica': return { icon: 'local_shipping', color: 'text-orange-400', bg: 'bg-orange-400/10', label: 'Logistica', isFood: false };
        case 'restaurant': return { icon: 'package_2', color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Comida', isFood: true };
        case 'market': return { icon: 'package_2', color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Mercado', isFood: false };
        case 'pharmacy': return { icon: 'package_2', color: 'text-rose-400', bg: 'bg-rose-400/10', label: 'Farmacia', isFood: false };
        case 'beverages': return { icon: 'package_2', color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Bebidas', isFood: false };
        case 'motorista_particular': return { icon: 'military_tech', color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Motorista Particular', isFood: false };
        case 'motoboy': return { icon: 'moped', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Motoboy', isFood: false };
        default: return { icon: 'local_shipping', color: 'text-primary', bg: 'bg-primary/10', label: 'Servico Express', isFood: false };
    }
};

const normalizeLookupText = (value: unknown): string =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

const cleanAddressText = (value: string | undefined | null): string =>
    String(value || '').split('| OBS:')[0].trim();

const getAddressMeta = (value: string | undefined | null): string => {
    const raw = String(value || '');
    const parts = raw.split('| OBS:');
    return parts.length > 1 ? parts.slice(1).join('| OBS:').trim() : '';
};

const getServicePresentation = (order: any) => {
    const rawType = String(order?.service_type || order?.type || '');
    const normalizedType = normalizeServiceType(rawType);
    const merchantName = String(order?.merchant_name || '').trim();
    const notes = String(order?.notes || order?.order_notes || '').trim();
    const title = String(order?.title || '').trim();
    const pickupText = cleanAddressText(order?.pickup_address || order?.origin || '');
    const destinationText = cleanAddressText(order?.delivery_address || order?.destination || '');
    const addressMeta = getAddressMeta(order?.delivery_address || order?.destination || '');
    const itemNames = Array.isArray(order?.items)
        ? order.items.map((item: any) => String(item?.name || '').trim()).filter(Boolean)
        : [];
    const itemCount = itemNames.length;
    const lookupText = normalizeLookupText([
        rawType,
        merchantName,
        title,
        notes,
        addressMeta,
        pickupText,
        destinationText,
        itemNames.join(' ')
    ].join(' | '));

    const restaurantTerms = ['pizza', 'hamburg', 'burger', 'lanche', 'sushi', 'temaki', 'marmita', 'acai', 'restaurante', 'refeicao', 'pastel'];
    const marketTerms = ['mercado', 'supermercado', 'hortifruti', 'mercearia', 'atacadao', 'sacolao', 'feira'];
    const pharmacyTerms = ['farmacia', 'drogaria', 'medicamento', 'remedio', 'dipirona', 'paracetamol', 'receita', 'saude'];
    const beverageTerms = ['bebida', 'cerveja', 'refrigerante', 'agua', 'suco', 'whisky', 'vinho', 'adega', 'drink'];

    let detectedType = normalizedType;

    if (includesAny(lookupText, ['viagem:', 'passageiro'])) {
        if (includesAny(lookupText, ['mototaxi', 'moto taxi', 'moto'])) detectedType = 'mototaxi';
        else if (includesAny(lookupText, ['motorista particular', 'executivo', 'chauffeur'])) detectedType = 'motorista_particular';
        else detectedType = 'car_ride';
    } else if (includesAny(lookupText, ['frete:', 'carreto', 'mudanca', 'ajudante', 'escada']) || ['frete', 'logistica', 'van', 'utilitario'].includes(normalizedType)) {
        if (includesAny(lookupText, ['van']) || normalizedType === 'van') detectedType = 'van';
        else if (includesAny(lookupText, ['utilitario', 'fiorino', 'saveiro', 'strada']) || normalizedType === 'utilitario') detectedType = 'utilitario';
        else if (normalizedType === 'logistica') detectedType = 'logistica';
        else detectedType = 'frete';
    } else if (normalizedType === 'delivery' || normalizedType === 'package' || normalizedType === 'motoboy' || normalizedType === rawType || !rawType) {
        if (includesAny(lookupText, pharmacyTerms)) detectedType = 'pharmacy';
        else if (includesAny(lookupText, marketTerms)) detectedType = 'market';
        else if (includesAny(lookupText, beverageTerms)) detectedType = 'beverages';
        else if (includesAny(lookupText, restaurantTerms) || itemCount > 0) detectedType = 'restaurant';
        else if (includesAny(lookupText, ['envio:', 'documento', 'encomenda', 'objeto', 'pacote']) || normalizedType === 'motoboy') {
            detectedType = normalizedType === 'motoboy' ? 'motoboy' : 'package';
        }
    }

    if (['restaurant', 'market', 'pharmacy', 'beverages'].includes(normalizedType)) {
        detectedType = normalizedType;
    }

    const details = getTypeDetails(detectedType);
    const isMobility = ['mototaxi', 'car_ride', 'motorista_particular'].includes(detectedType);
    const isFreight = ['frete', 'van', 'utilitario', 'logistica'].includes(detectedType);

    let headline = 'Servico de entrega';
    if (detectedType === 'restaurant') {
        if (includesAny(lookupText, ['pizza', 'pizzaria'])) headline = 'Pedido de pizza';
        else if (includesAny(lookupText, ['hamburg', 'burger', 'lanche'])) headline = 'Pedido de lanche';
        else if (includesAny(lookupText, ['sushi', 'temaki', 'japa'])) headline = 'Pedido de sushi';
        else headline = 'Pedido de comida';
    } else if (detectedType === 'market') {
        headline = 'Compra de mercado';
    } else if (detectedType === 'pharmacy') {
        headline = 'Entrega de farmacia';
    } else if (detectedType === 'beverages') {
        headline = 'Entrega de bebidas';
    } else if (detectedType === 'mototaxi') {
        headline = 'Corrida de mototaxi';
    } else if (detectedType === 'car_ride') {
        headline = 'Corrida particular';
    } else if (detectedType === 'motorista_particular') {
        headline = 'Motorista particular';
    } else if (detectedType === 'van') {
        headline = 'Frete com van';
    } else if (detectedType === 'utilitario') {
        headline = 'Envio utilitario';
    } else if (detectedType === 'logistica' || detectedType === 'frete') {
        headline = 'Frete / carreto';
    } else if (detectedType === 'motoboy') {
        headline = 'Servico de motoboy';
    } else if (detectedType === 'package') {
        headline = 'Envio express';
    }

    const badges: string[] = [];
    if (merchantName && !isMobility) badges.push(merchantName);
    if (itemCount > 0) badges.push(`${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`);
    if (order?.preparation_status === 'pronto') badges.push('Pronto para coleta');
    if (includesAny(normalizeLookupText(addressMeta), ['recebedor'])) badges.push('Com recebedor');
    if (includesAny(normalizeLookupText(addressMeta), ['ajudante'])) badges.push('Com ajudantes');
    if (includesAny(normalizeLookupText(addressMeta), ['escada'])) badges.push('Possui escadas');

    let summary = '';
    if (itemCount > 0) {
        summary = itemNames.slice(0, 2).join(' ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ ');
        if (itemCount > 2) summary += ` +${itemCount - 2}`;
    } else if (addressMeta) {
        summary = addressMeta
            .replace(/^ENVIO:\s*/i, '')
            .replace(/^FRETE:\s*/i, '')
            .replace(/^VIAGEM:\s*/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    } else if (merchantName) {
        summary = `Coleta em ${merchantName}`;
    } else if (isMobility) {
        summary = 'Passageiro aguardando embarque';
    } else if (isFreight) {
        summary = 'Carga com coleta e entrega definidas';
    } else {
        summary = 'Entrega com retirada e destino confirmados';
    }

    return {
        details,
        isMobility,
        headline,
        summary,
        badges: badges.slice(0, 3),
        ctaLabel: isMobility ? 'Aceitar corrida' : isFreight ? 'Aceitar frete' : 'Aceitar entrega',
        pickupLabel: isMobility ? 'Embarque' : isFreight ? 'Origem' : 'Coleta',
        destinationLabel: isMobility ? 'Destino' : isFreight ? 'Descarga' : 'Entrega',
        pickupText,
        destinationText,
    };
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
    const [dynamicRates, setDynamicRates] = useState<any>(null);

    const fetchGlobalSettings = useCallback(async () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        try {
            // Busca configurações gerais
            const res = await fetch(`${supabaseUrl}/rest/v1/app_settings_delivery?select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data[0]) setAppSettings(data[0]);
            }

            // Busca taxas din¢micas (especialmente os valores base como food_min)
            const resRates = await fetch(`${supabaseUrl}/rest/v1/dynamic_rates_delivery?type=eq.base_values&select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (resRates.ok) {
                const dataRates = await resRates.json();
                if (dataRates && dataRates[0]) setDynamicRates(dataRates[0].metadata);
            }
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

    const [activeTab, setActiveTab] = useState<View>('dashboard');
    const [finishedMissionData, setFinishedMissionData] = useState<{
        show: boolean, 
        amount: number,
        grossAmount?: number,
        baseValue?: number,
        extraKmValue?: number,
        distance?: number
    } | null>(null);
    const [isOnline, setIsOnline] = useState(() => localStorage.getItem('Izi_online') === 'true');
    const isFirstRender = useRef(true);
    const hasLoadedOnlineStatus = useRef(false); // Impede que refreshes de token sobrescrevam o status
    const hasBootedRef = useRef(false); // Garante que syncMissionWithDB e restauração s³ ocorrem 1x por sessão
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [missionSheetState, setMissionSheetState] = useState<"collapsed" | "half" | "expanded">("half");

    const missionSheetVariants = {
        collapsed: { y: "85%", transition: { type: "spring", damping: 30, stiffness: 200 } },
        half: { y: "45%", transition: { type: "spring", damping: 30, stiffness: 200 } },
        expanded: { y: "0%", transition: { type: "spring", damping: 30, stiffness: 200 } }
    };

    const handleMissionDragEnd = (_: any, info: any) => {
        const threshold = 50;
        if (info.offset.y > threshold) {
            if (missionSheetState === "expanded") setMissionSheetState("half");
            else setMissionSheetState("collapsed");
        } else if (info.offset.y < -threshold) {
            if (missionSheetState === "collapsed") setMissionSheetState("half");
            else setMissionSheetState("expanded");
        }
    };
    const [isAccepting, setIsAccepting] = useState(false);
    const [filter, setFilter] = useState<ServiceType | 'all'>('all');
    const [orders, setOrders] = useState<Order[]>([]);
    const [dedicatedSlots, setDedicatedSlots] = useState<any[]>([]);
    const [myApplications, setMyApplications] = useState<any[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [applyingSlotId, setApplyingSlotId] = useState<string | null>(null);
    const [showSlotAppliedSuccess, setShowSlotAppliedSuccess] = useState(false);
    const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
    const [selectedScheduledOrder, setSelectedScheduledOrder] = useState<any | null>(null);
    const [history, setHistory] = useState<Order[]>([]);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);
    const [merchantCoords, setMerchantCoords] = useState<{lat: number, lng: number} | null>(null);
    const [stats, setStats] = useState({ balance: 0, today: 0, weekly: 0, totalEarnings: 0, count: 0, level: 1, xp: 0, nextXp: 100 });
    const [earningsHistory, setEarningsHistory] = useState<Order[]>([]);
    const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
    const [isFinanceLoading, setIsFinanceLoading] = useState(false);
    const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
    const [isSavingPix, setIsSavingPix] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [confirmPaymentState, setConfirmPaymentState] = useState<{
        show: boolean,
        resolve: (confirmed: boolean) => void,
        mission: any
    } | null>(null);

    const showConfirmPaymentMethod = (mission: any) => {
        return new Promise<boolean>((resolve) => {
            setConfirmPaymentState({ show: true, resolve, mission });
        });
    };
    const [pixKey, setPixKey] = useState(() => localStorage.getItem('izi_driver_pix') || '');
    const [isEditingPix, setIsEditingPix] = useState(false);

    const [activeMission, setActiveMission] = useState<Order | null>(() => {
        const saved = localStorage.getItem('Izi_active_mission');
        return saved ? JSON.parse(saved) : null;
    });
    const activeMissionRef = useRef(activeMission);
    useEffect(() => { activeMissionRef.current = activeMission; }, [activeMission]);
    
    const activeTabRef = useRef(activeTab);
    useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);

    const clearDriverSessionState = useCallback(() => {
        console.log('[AUTH] Executando limpeza de sessão (Logout)');
        setIsMenuOpen(false);
        setIsAuthenticated(false);
        setDriverId(null);
        setDriverCoords(null);
        setDriverName('Entregador');
        setIsOnline(false);
        setActiveMission(null);
        setActiveTab('dashboard');
        setOrders([]);
        setDedicatedSlots([]);
        setScheduledOrders([]);
        setHistory([]);
        setEarningsHistory([]);
        setWithdrawHistory([]);
        setPixKey('');
        setShowWithdrawModal(false);
        setAuthPassword('');
        setAuthError('');

        // Remove chaves críticas de sessão
        const keysToRemove = [
            'izi_driver_authenticated',
            'izi_driver_uid',
            'izi_driver_name',
            'izi_driver_pix',
            'Izi_active_mission',
            'Izi_declined_slots',
            'Izi_online' // Aqui sim limpamos o online
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
        sessionStorage.clear();
    }, []);

    // WATCHDOG DE STATUS ONLINE
    // Se o estado isOnline divergir do localStorage por qualquer motivo (race condition, re-render),
    // este efeito força a reconciliação com a intenção do motorista.
    useEffect(() => {
        const localIntent = localStorage.getItem('Izi_online') === 'true';
        if (localIntent && !isOnline) {
            console.warn('[WATCHDOG] Detectada divergência de status! Forçando ONLINE conforme localStorage.');
            setIsOnline(true);
        }
    }, [isOnline]);

    const getGrossEarnings = useCallback((order: any) => {
        if (!order) return 0;
        
        const rawType = order.service_type || order.type || 'generic';
        const type = normalizeServiceType(rawType);
        
        let minGuaranteed = 0;
        if (type === 'restaurant') {
            minGuaranteed = Number(dynamicRates?.food_min || appSettings?.baseFee || 7);
        } else if (type === 'market') {
            minGuaranteed = Number(dynamicRates?.market_min || dynamicRates?.food_min || appSettings?.baseFee || 7);
        } else if (type === 'pharmacy') {
            minGuaranteed = Number(dynamicRates?.pharmacy_min || dynamicRates?.food_min || appSettings?.baseFee || 7);
        } else if (type === 'beverages') {
            minGuaranteed = Number(dynamicRates?.beverages_min || dynamicRates?.food_min || appSettings?.baseFee || 7);
        } else if (type === 'mototaxi') {
            minGuaranteed = Number(dynamicRates?.mototaxi_min || 6);
        } else if (['car_ride', 'motorista_particular'].includes(type)) {
            minGuaranteed = Number(dynamicRates?.carro_min || 14);
        } else {
            minGuaranteed = Number(appSettings?.baseFee || 7);
        }

        const isMobility = ['mototaxi', 'car_ride', 'frete', 'logistica', 'motorista_particular', 'van', 'utilitario', 'motoboy'].includes(type);
        
        let base = 0;
        if (isMobility) {
            base = Number(order.delivery_fee || order.total_price || order.price || 0);
        } else {
            const deliveryFee = Number(order.delivery_fee || 0);
            base = Math.max(deliveryFee, minGuaranteed);
        }

        if (base <= 0) base = Number(appSettings?.baseFee || 7);
        return Number(base.toFixed(2));
    }, [appSettings, dynamicRates]);

    const getNetEarnings = useCallback((order: any) => {
        if (!order) return 0;
        
        const rawType = order.service_type || order.type || 'generic';
        const type = normalizeServiceType(rawType);
        
        const deliveryCommission = Number(appSettings?.driverFreightCommission ?? appSettings?.appCommission ?? 7);
        const privateDriverCommission = Number(appSettings?.privateDriverCommission ?? appSettings?.driverFreightCommission ?? appSettings?.appCommission ?? 7);
        const isPrivateDriver = ['car_ride', 'motorista_particular'].includes(type);
        
        const commission = isPrivateDriver ? privateDriverCommission : deliveryCommission;
        const driverBaseAmount = getGrossEarnings(order);
        const finalNet = driverBaseAmount * (1 - (commission / 100));

        return Number(finalNet.toFixed(2));
    }, [appSettings, dynamicRates, getGrossEarnings]);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        // Permite GPS se estiver ONLINE ou em uma MISSÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O ATIVA
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
            const { data } = await supabase.from('drivers_delivery').select('id, name, lat, lng, is_deleted, is_online').eq('id', userId).maybeSingle();
            
            // Se NÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O existe o ID no banco OU se o registro existe mas foi deletado, NÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O recriamos se o objetivo for deletar
            // Mas aqui, s³ criamos se for um usuário COMPLETAMENTE novo (sem registro nenhum)
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
                // Se o registro existe, não fazemos o upsert para não "ressuscitar"
                if (data.name) {
                    setDriverName(data.name);
                    localStorage.setItem('izi_driver_name', data.name);
                }
                // REMOVIDO: setIsOnline daqui. O controle de is_online agora
                // é feito exclusivamente pelo useEffect de restauração de sessão.
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
        }).catch(err => {
            console.error('[AUTH] Erro Session:', err);
        }).finally(() => {
            setAuthInitLoading(false);
        });

        // Timeout de segurança: garante que o app saia da tela de boot mesmo se houver erro de rede/supabase
        const authTimeout = setTimeout(() => setAuthInitLoading(false), 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user;
            if (user) {
                setDriverId(user.id);
                setIsAuthenticated(true);

                // BOOT ÃƒÂ¢Ã¢€¦áNICO: s³ executa restauração completa na primeira vez
                if (!hasBootedRef.current) {
                    hasBootedRef.current = true;
                    console.log('[AUTH] Primeiro boot detectado. Carregando perfil...');

                    // Buscar perfil apenas para nome e chave pix (NÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O tocar no is_online aqui)
                    const { data: profile } = await supabase
                        .from('drivers_delivery')
                        .select('name, bank_info')
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

                    refreshFinanceData();
                    
                    syncMissionWithDB();
                } else {
                    // Renovações de token (TOKEN_REFRESHED): NÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O alterar nenhum estado
                    console.log('[AUTH] Renovação de token. Ignorando reset de estado.');
                }
            } else {
                if (hasBootedRef.current) {
                    console.warn('[AUTH] SIGNED_OUT detectado. Limpando sessão...');
                    hasBootedRef.current = false;
                    setDriverId(null);
                    setIsAuthenticated(false);
                    setDriverName('Entregador');
                }
            }
            setAuthInitLoading(false);
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(authTimeout);
        };
    }, []);

    useEffect(() => {
        if (activeTab === 'earnings' || activeTab === 'history') {
            refreshFinanceData();
            
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





    // =====================================================================
    // RESTAURA¢ÃƒÆ’¢¬áÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O DE STATUS ONLINE: useEffect EXCLUSIVO e AUTORITATIVO
    // Este é o ÃƒÂ¢Ã¢€¦áNICO lugar onde o is_online é restaurado ap³s login/refresh.
    // Ele dispara quando driverId e isAuthenticated ficam disponíveis.
    // =====================================================================
    useEffect(() => {
        if (!driverId || !isAuthenticated) return;

        const localWantsOnline = localStorage.getItem('Izi_online') === 'true';
        console.log(`[ONLINE-RESTORE] Autenticado! localStorage diz online=${localWantsOnline}`);

        // Setar estado local imediatamente (sem depender do banco)
        setIsOnline(localWantsOnline);

        if (localWantsOnline) {
            // Sincronizar banco em background para garantir consistência
            supabase.from('drivers_delivery')
                .update({ is_online: true, last_seen_at: new Date().toISOString() })
                .eq('id', driverId)
                .then(({ error }) => {
                    if (error) console.error('[ONLINE-RESTORE] Erro ao sincronizar online no banco:', error.message);
                    else console.log('[ONLINE-RESTORE] Banco sincronizado: is_online=true');
                });
        }
    }, [driverId, isAuthenticated]);

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
                
                // Sincronização multi-dispositivo de perfil e financeira
                // REMOVIDO: Sincronização de is_online do banco para cá.
                // O localStorage é a autoridade absoluta sobre a intenção do motorista.
                // A única forma de ser ejetado é via is_active (Remote Eject) ou Logout manual.
                
                // Recarregar dados financeiros se o saldo mudou por outro dispositivo
                refreshFinanceData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [driverId, isAuthenticated]); // REMOVIDO isOnline das deps - evita re-subscrição que dispara snapshot do banco

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

        // SALVA NO LOCALSTORAGE IMEDIATAMENTE ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ÃƒÆ’¢¬ antes de qualquer chamada ao banco
        // Isso garante que F5 sempre restaura o status correto, independente de rede
        localStorage.setItem('Izi_online', nextState.toString());
        setIsOnline(nextState);
        
        if (driverId) {
            try {
                const updatePayload = nextState 
                    ? { is_online: true, last_seen_at: new Date().toISOString() }
                    : { is_online: false };
                await supabase.from('drivers_delivery').update(updatePayload).eq('id', driverId);
                console.log(`[STATUS] ${nextState ? 'ONLINE' : 'OFFLINE'} - banco e storage sincronizados`);
            } catch (e: any) {
                console.warn('[STATUS] Falha ao sincronizar banco (storage preservado):', e.message);
                // NÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O reverte ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ÃƒÆ’¢¬ o localStorage já salvou a intenção e o heartbeat sincronizará o banco
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
                    console.error('[EJECT] Sessão ejetada remotamente! Motivo: Motorista desativado no painel Admin.');
                    toastError('Sua conta foi desativada pelo administrador.');
                    handleLogout();
                }
                // Se o banco forçar is_online=false MAS o motorista quer estar online, 
                // o heartbeat (useEffect abaixo) vai corrigir o banco em 5 segundos.
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
                !financialTypes.includes(o.service_type) &&
                o.driver_id === dId // RIGOROSO: S³ é missão ativa se for MINHA
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
                console.log('[SYNC] Missão restaurada do banco:', mission.realId);
            } else {
                console.log('[SYNC] Nenhuma missão ativa no banco para o motorista:', driverId);

                // PROTE¢ÃƒÆ’¢¬áÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O: S³ apaga o cache local se a missão for ANTIGA (> 30 min)
                // Isso evita apagar uma missão que acabou de ser aceita mas ainda não propagou no banco
                const cachedMissionRaw = localStorage.getItem('Izi_active_mission');
                if (cachedMissionRaw) {
                    try {
                        const cachedMission = JSON.parse(cachedMissionRaw);
                        const createdAt = new Date(cachedMission.created_at || 0).getTime();
                        const ageMs = Date.now() - createdAt;
                        const thirtyMinutes = 30 * 60 * 1000;
                        if (ageMs > thirtyMinutes) {
                            console.log('[SYNC] Missão antiga no cache (> 30 min). Limpando...');
                            setActiveMission(null);
                            localStorage.removeItem('Izi_active_mission');
                        } else {
                            console.log('[SYNC] Missão recente no cache. Mantendo estado local por precaução.');
                        }
                    } catch {
                        setActiveMission(null);
                        localStorage.removeItem('Izi_active_mission');
                    }
                }
            }
        } catch (err: any) {
            console.error('[SYNC] Falha ao sincronizar missão:', err.message);
        }
    }, [driverId, isAuthenticated]);

    useEffect(() => {
        syncMissionWithDB();
    }, [driverId, isAuthenticated, syncMissionWithDB]);

    // Canal separado para vagas dedicadas ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ÃƒÆ’¢¬ funciona independente do status online
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchDedicatedSlotsRealtime = async () => {
            const { data } = await supabase.from('dedicated_slots_delivery').select('*, admin_users(store_name, store_logo, store_address, store_phone)').eq('is_active', true).order('created_at', { ascending: false });
            setDedicatedSlots(data || []);
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
    // Buscar candidaturas
    const fetchFromDB = useCallback(async (table: string, queryParams: string = '') => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        let token = supabaseKey;
        try {
            const ls = localStorage.getItem(`sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`);
            if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
        } catch(e) {}

        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?${queryParams}`, {
            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (!res.ok) throw new Error(`DB Error: ${res.status}`);
        return await res.json();
    }, []);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        const fetchApps = async () => {
            const { data } = await supabase.from('slot_applications').select('*').eq('driver_id', driverId);
            setMyApplications(data || []);
        };
        fetchApps();
        refreshFinanceData();
    }, [isAuthenticated, driverId]);

    // Buscar Agendamentos disponíveis e aceitos
    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        const fetchScheduled = async () => {
            const now = new Date();
            const referenceDate = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(); // 12h atrás para cobrir qualquer delay de confirmação
            
            try {
                const data = await fetchFromDB('orders_delivery', `scheduled_at=not.is.null&scheduled_at=gte.${referenceDate}&order=scheduled_at.asc`);
                
                if (data) {
                    const filtered = data.filter((o: any) => {
                        const isMine = o.driver_id && String(o.driver_id).trim() === String(driverId).trim();
                        const isAvailable = !o.driver_id || String(o.driver_id).trim() === '';
                        const openStatuses = ['pendente', 'agendado', 'novo', 'waiting_driver', 'waiting_merchant', 'preparando', 'pronto', 'a_caminho_coleta', 'a_caminho', 'confirmado', 'confirmed'];
                        const statusOk = openStatuses.includes(o.status);
                        return isMine || (isAvailable && statusOk);
                    });
                    setScheduledOrders(filtered);
                }
            } catch (error) {
                console.error('[SCHEDULED] Erro ao buscar agendamentos:', error);
            }
        };

        fetchScheduled();

        // Realtime para Agendamentos
        const scheduledChannel = supabase.channel('scheduled_orders_realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_at) {
                    if (isOnline) playIziSound('driver'); // Som unico para Agendamento
                    setScheduledOrders(prev => [...prev, o].sort((a, b) =>
                        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
                    ));
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_at) {
                    if (['concluido', 'cancelado', 'finalizado', 'delivered'].includes(o.status)) {
                        setScheduledOrders(prev => prev.filter(s => s.id !== o.id));
                    } else if (o.driver_id && String(o.driver_id).trim() !== String(driverId).trim()) {
                        // Se outro motorista aceitou, remove da minha lista
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
    }, [isAuthenticated, driverId, isOnline, fetchFromDB]);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        const fetchOrders = async () => {
            try {
                // Busca ampla incluindo dados vivos do lojista. Sintaxe corrigida para garantir o JOIN.
                const data = await fetchFromDB('orders_delivery', 'select=*,admin_users(store_name,store_address,latitude,longitude)&order=created_at.desc&limit=20');
                console.log('[POLL-DEBUG] Dados recebidos:', data?.length, 'primeiro item tem admin_users?', !!data?.[0]?.admin_users);
                
                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                const now = Date.now();
                const currentMission = activeMissionRef.current;

                // 1. Sincronizar Missão Ativa (Se o Admin me deu um pedido ou aceitei em outro lugar)
                const myAssignment = data.find((o: any) => 
                    o.driver_id && String(o.driver_id).trim() === String(driverId).trim() &&
                    !['concluido', 'cancelado', 'finalizado', 'entregue', 'confirmado', 'confirmed'].includes(o.status)
                );

                if (myAssignment && (!currentMission || currentMission.realId !== myAssignment.id)) {
                    const merchant = myAssignment.admin_users;
                    const mission = { 
                        ...myAssignment, 
                        realId: myAssignment.id, 
                        type: myAssignment.service_type, 
                        customer: myAssignment.user_name || 'Cliente Izi',
                        store_name: merchant?.store_name || myAssignment.store_name || 'Paladar Distribuidora',
                        pickup_address: merchant?.store_address || myAssignment.pickup_address,
                        origin: merchant?.store_address || myAssignment.pickup_address,
                        pickup_lat: merchant?.latitude || myAssignment.pickup_lat,
                        pickup_lng: merchant?.longitude || myAssignment.pickup_lng
                    };
                    console.log('[COLETA-DEBUG] Missão Ativa Sincronizada:', mission.pickup_address);
                    setActiveMission(mission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                    if (activeTabRef.current !== 'active_mission') setActiveTab('active_mission');
                }

                // 2. Disponíveis no Dashboard
                const available = data.filter((o: any) => {
                    const isMerchantOrder = !!o.merchant_id || !!o.admin_users;
                    const merchantAccepted = ['waiting_driver', 'preparando', 'pronto', 'accepted'].includes(o.status);
                    const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'].includes(o.status);
                    
                    const statusOk = isMerchantOrder ? merchantAccepted : p2pAllowed;
                    const notMyAssignment = !o.driver_id || String(o.driver_id).trim() === '';
                    const notDeclined = !(now - (declinedMap[o.id] || 0) < 5000);
                    const notFinancial = !['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'].includes(o.service_type);
                    const notScheduled = !o.scheduled_at || o.driver_id === driverId; // Se for agendado e sem motorista, cai na lista de Agendamentos, nao aqui
                    return statusOk && notMyAssignment && notDeclined && notFinancial && notScheduled;
                });

                setOrders(available.map((o: any) => {
                    const merchant = o.admin_users;
                    if (merchant) {
                        console.log(`[COLETA-DEBUG] Loja: ${merchant.store_name} | Endereço: ${merchant.store_address} | Coords: ${merchant.latitude},${merchant.longitude}`);
                    }
                    return {
                        ...o,
                        id: o.id.slice(0, 8).toUpperCase(), 
                        realId: o.id, 
                        type: o.service_type, 
                        origin: merchant?.store_address || o.pickup_address, 
                        destination: o.delivery_address, 
                        price: o.total_price,
                        status: o.status,
                        pickup_lat: merchant?.latitude || o.pickup_lat,
                        pickup_lng: merchant?.longitude || o.pickup_lng,
                        delivery_lat: o.delivery_lat,
                        delivery_lng: o.delivery_lng,
                        store_name: merchant?.store_name || o.store_name || 'Paladar Distribuidora',
                        customer: 'Izi' 
                    };
                }));
            } catch (err) {
                console.warn('[POLL] Falha na rede:', err);
            }
        };

        const fetchDedicatedSlots = async () => {
            try {
                const declinedIds = JSON.parse(localStorage.getItem('Izi_declined_slots') || '[]');
                const data = await fetchFromDB('dedicated_slots_delivery', 'select=*,admin_users(store_name,store_logo,store_address,store_phone)&is_active=eq.true&order=created_at.desc');
                setDedicatedSlots((data || []).filter((s: any) => !declinedIds.includes(s.id)));
            } catch (e) {}
        };
        fetchOrders(); fetchDedicatedSlots();

        // Polling a cada 5s para garantir que pedidos reapareçam ap³s rejeição
        const pollInterval = setInterval(fetchOrders, 5000);
        
        const channel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new;
                if (o.scheduled_at) return; // Ignorar agendados no dashboard de missoes imediatas
                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                
                // Filtros de segurança e status
                const isMerchantOrder = !!o.merchant_id;
                const merchantAccepted = ['waiting_driver', 'preparando', 'pronto', 'accepted'].includes(o.status);
                const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'].includes(o.status);
                
                if (isMerchantOrder) {
                    if (!merchantAccepted) return;
                } else {
                    if (!p2pAllowed) return;
                }
                if (Date.now() - (declinedMap[o.id] || 0) < 1800000) return;
                
                // Ignorar transações financeiras (Izi Coin, Assinatura) que não são missões
                const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                if (financialTypes.includes(o.service_type)) return;

                // Restringir sons por categoria e status (Evitar barulho precoce em Food)
                const availabilityType = normalizeServiceType(o.service_type);
                const isMobility = ['mototaxi', 'car_ride', 'frete', 'van', 'utilitario', 'logistica', 'motorista_particular', 'package', 'motoboy'].includes(availabilityType);
                // S³ toca som se: (¢ÃƒÆ’¢¬° Mobilidade) OU (¢ÃƒÆ’¢¬° Food e está em um status visível/acionável)
                // E também somente se o pagamento já foi aprovado ou é em dinheiro
                const actionableStatuses = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'accepted'];
                const isPaidOrCash = o.payment_method === 'cash' || o.payment_status === 'paid' || o.payment_method === 'dinheiro';
                const shouldSound = actionableStatuses.includes(o.status) && isPaidOrCash;
                const servicePreview = getServicePresentation(o);

                setOrders(prev => {
                    if (prev.find(x => x.realId === o.id)) return prev;
                    
                    // S³ toca som se estiver online e passar no filtro de categoria
                    if (isOnline && shouldSound) {
                        playIziSound('driver');
                        if (Notification.permission === 'granted') {
                            new Notification('°ÃƒÂ¢Ã¢€¦¸ÃƒÂ¢Ã¢€¦á¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬ Nova Missão Izi!', { 
                                body: `${servicePreview.headline} ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ ${servicePreview.pickupText || o.pickup_address}`, 
                                icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' 
                            });
                        }
                    }

                    const mapped = { 
                        ...o,
                        id: o.id.slice(0, 8).toUpperCase(), 
                        realId: o.id, 
                        type: o.service_type, 
                        origin: o.pickup_address, 
                        destination: o.delivery_address, 
                        price: o.total_price, 
                        customer: o.user_name || 'Cliente Izi',
                        pickup_lat: o.pickup_lat,
                        pickup_lng: o.pickup_lng,
                        delivery_lat: o.delivery_lat,
                        delivery_lng: o.delivery_lng,
                        preparation_status: o.preparation_status
                    };

                    // Se o pedido já veio atribuído a mim (ex: admin atribuiu), define como missão ativa na hora
                    if (o.driver_id && String(o.driver_id).trim() === String(driverId).trim()) {
                        setActiveMission(mapped);
                        localStorage.setItem('Izi_active_mission', JSON.stringify(mapped));
                        setActiveTab('active_mission');
                        return prev;
                    }

                    // Se o pedido tem motorista mas NÃƒÂ¢Ã¢€ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬ÃƒÂ¢Ã¢â‚¬Å¾¢O SOU EU, ignora (foi aceito por outro)
                    if (o.driver_id && String(o.driver_id).trim() !== '') {
                        return prev;
                    }

                    return [mapped, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_at) return; // Ignorar agendados no dashboard de missoes imediatas
                const currentMission = activeMissionRef.current;
                
                // Sincronização Global de Missão Ativa (Multi-dispositivos)
                const dId = String(driverId).trim();
                if (o.driver_id === dId) {
                    console.log('[REALTIME] Sincronizando mudança de status da minha missão:', o.status);
                    
                    // L³gica de Limpeza: Se o pedido foi cancelado ou concluído em outro dispositivo
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
                            toastSuccess('°ÃƒÂ¢Ã¢€¦¸¢ÃƒÆ’¢¬¥ O Pedido está PRONTO para coleta!');
                            if (Notification.permission === 'granted') new Notification('°ÃƒÂ¢Ã¢€¦¸¢ÃƒÆ’¢¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢€Ã…â€œ¦ Pedido Pronto!', { body: 'O estabelecimento finalizou o preparo. Pode coletar!' });
                        }

                        // Sincronizar o status da missão ativa com o servidor
                        // MANT¢ÃƒÆ’¢¬°M OS DADOS DO LOJISTA DE BRUMADINHO (Join admin_users) - Prioridade Total
                        const mission: any = { 
                            ...o, 
                            realId: o.id, 
                            type: o.service_type || 'delivery', 
                            origin: currentMission?.pickup_address || o.store_address || o.pickup_address, 
                            destination: o.delivery_address || 'Destino', 
                            price: o.total_price || 0, 
                            customer: o.user_name || 'Cliente Izi',
                            store_name: currentMission?.store_name || o.store_name || 'Paladar Distribuidora',
                            pickup_address: currentMission?.pickup_address || o.pickup_address,
                            pickup_lat: currentMission?.pickup_lat || o.pickup_lat,
                            pickup_lng: currentMission?.pickup_lng || o.pickup_lng,
                            delivery_lat: o.delivery_lat,
                            delivery_lng: o.delivery_lng
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
                const isMerchantOrder = !!o.merchant_id;
                const merchantAccepted = ['waiting_driver', 'preparando', 'pronto', 'accepted'].includes(o.status);
                const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'].includes(o.status);
                const statusOk = isMerchantOrder ? merchantAccepted : p2pAllowed;

                if (statusOk && !(Date.now() - (declinedMap[o.id] || 0) < 1800000)) {
                    setOrders(prev => {
                        const isNew = !prev.find(x => x.realId === o.id);
                        if (isNew) {
                            // Ignorar transações financeiras
                            const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                            if (financialTypes.includes(o.service_type)) return prev;

                            // Alerta para qualquer pedido novo disponível para o entregador (Mobilidade ou Food)
                            const actionableStatuses = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'accepted'];
                            const isPaidOrCash = o.payment_method === 'cash' || o.payment_status === 'paid' || o.payment_method === 'dinheiro';
                            const shouldSound = actionableStatuses.includes(o.status) && isPaidOrCash;
                            const servicePreview = getServicePresentation(o);

                            if (isOnline && shouldSound) {
                                playIziSound('driver');
                                if (Notification.permission === 'granted') {
                                    new Notification('ÃƒÃ‚ °ÃƒÂ¢Ã¢€¦¸¢ÃƒÆ’¢¬ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢€Ã…â€œ¦ Pedido DisponÃƒÃ‚ível!', { 
                                        body: `${servicePreview.headline}ÃƒÃ‚ ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ ${servicePreview.pickupText || o.pickup_address}`, 
                                        icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' 
                                    });
                                }
                            }
                            return [{ ...o, id: o.id.slice(0, 8).toUpperCase(), realId: o.id, type: o.service_type, origin: o.pickup_address, destination: o.delivery_address, price: o.total_price, customer: 'Cliente Izi' }, ...prev];
                        }
                        return prev;
                    });
                } else {
                    const isMerchantOrder = !!o.merchant_id;
                    const merchantAccepted = ['waiting_driver', 'preparando', 'pronto', 'accepted'].includes(o.status);
                    const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'].includes(o.status);
                    const statusOk = isMerchantOrder ? merchantAccepted : p2pAllowed;

                    if (!statusOk && (!currentMission || o.id !== currentMission.id)) {
                        setOrders(prev => prev.filter((order: any) => order.realId !== o.id));
                    }
                }
            })
            .subscribe();

        return () => { clearInterval(pollInterval); supabase.removeChannel(channel); };
    }, [isOnline, isAuthenticated, driverId]);

    // Alerta de som para novas chamadas (Apenas uma vez quando a lista aumenta e estÃƒÂá online)
    useEffect(() => {
        if (isOnline && orders.length > 0 && !activeMission) {
            playIziSound('driver');
        }
    }, [isOnline, orders.length > 0, !!activeMission]);

    const [isSyncing, setIsSyncing] = useState(false);
    const handleManualSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        console.group('[DEBUG-REST-SYNC]');
        console.log('1. Iniciando teste de conexão via REST DIRETO...');

        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            console.log('2. URL Alvo:', `${supabaseUrl}/rest/v1/orders_delivery?select=*&limit=5`);

            let token = supabaseKey;
            try {
                const ls = localStorage.getItem(`sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`);
                if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
            } catch(e) {}

            // Fazendo a busca manualmente sem usar a biblioteca Supabase para evitar hangs
            const response = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?select=*&order=created_at.desc&limit=10`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('3. Status da Resposta:', response.status, response.statusText);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erro na API: ${response.status} - ${errorText}`);
            }

            const allRecent = await response.json();
            console.log('4. Dados recebidos com SUCESSO via REST!', allRecent.length, 'itens');
            
            if (!allRecent || allRecent.length === 0) {
                toastError('O banco está vazio (vias REST).');
                return;
            }

            // Filtros de exibição
            const available = allRecent.filter((o: any) => 
                !o.driver_id && 
                !['concluido', 'cancelado', 'finalizado', 'entregue'].includes(o.status)
            );

            setOrders(available.map((o: any) => ({ 
                ...o,
                id: o.id.slice(0, 8).toUpperCase(), 
                realId: o.id, 
                type: o.service_type, 
                origin: o.pickup_address, 
                destination: o.delivery_address, 
                price: o.total_price, 
                customer: 'REST: ' + o.status
            })));

            const myActive = allRecent.find((o: any) => 
                o.driver_id && String(o.driver_id).trim() === String(driverId || '').trim() &&
                !['concluido', 'cancelado', 'finalizado', 'entregue'].includes(o.status)
            );

            if (myActive) {
                console.log('5. Missão ativa encontrada via REST:', myActive.id);
                const mission = { ...myActive, realId: myActive.id, type: myActive.service_type, customer: myActive.user_name || 'Cliente Izi' };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                setActiveTab('active_mission');
                toastSuccess('Conectado via REST! Missão recuperada.');
            } else {
                toastSuccess(`Conectado! ${available.length} chamadas via REST.`);
            }

        } catch (e: any) {
            console.error('ERRO CRTICO NO REST SYNC:', e);
            toastError('Falha na conexão rest: ' + e.message);
        } finally {
            console.groupEnd();
            setIsSyncing(false);
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

    // Gancho para buscar coordenadas reais do lojista se os campos pickup_lat/lng estiverem vazios no pedido
    useEffect(() => {
        const fetchMerchantCoords = async () => {
            if (activeMission?.merchant_id) {
                try {
                    const { data } = await supabase
                        .from('admin_users')
                        .select('latitude, longitude')
                        .eq('id', activeMission.merchant_id)
                        .single();
                    if (data?.latitude && data?.longitude) {
                        setMerchantCoords({ lat: Number(data.latitude), lng: Number(data.longitude) });
                    } else {
                        setMerchantCoords(null);
                    }
                } catch (e) {
                    console.error('[COORDS] Erro ao buscar coordenadas do lojista:', e);
                    setMerchantCoords(null);
                }
            } else {
                setMerchantCoords(null);
            }
        };
        fetchMerchantCoords();
    }, [activeMission?.merchant_id]);





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
        console.group('[handleAccept] Processando aceite de pedido');
        
        try {
            // Validar UUID ¢¢ÃƒÆ’¢ÃƒÂ¢Ã¢â‚¬Åá¬Ãƒâ€¦á¬¢ÃƒÆ’¢¬ order.id é o ID curto (8 chars), order.realId é o UUID completo
            const targetId = order.realId || order.id;
            console.log('Target ID Identificado:', targetId, { orderId: order.id, realId: order.realId });
            
            // Validação de segurança básica: Relaxada para suportar listagens que usam apenas ID curto
            if (!targetId) {
                 console.error('ID do pedido ausente na tentativa de aceite.');
                 toastError('Ocorreu um erro ao identificar o pedido.');
                 setIsAccepting(false);
                 return;
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let token = supabaseKey;
            try {
                const ls = localStorage.getItem(`sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`);
                if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
            } catch(e) {}

            console.log('1. Verificando integridade via REST...');
            const checkRes = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?id=eq.${targetId}&select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` }
            });
            
            const ordersList = await checkRes.json();
            const realOrder = ordersList[0];

            if (!realOrder) throw new Error('Pedido não encontrado.');
            
            // Verificar se ainda está disponível
            if (realOrder.driver_id && String(realOrder.driver_id).trim() !== '') {
                toastError('Este pedido já foi aceito por outro piloto.');
                setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
                return;
            }

            const isScheduled = !!order.scheduled_at;
            const newStatus = isScheduled ? 'confirmado' : 'a_caminho_coleta';

            console.log(`2. Gravando aceite via PATCH REST (${isScheduled ? 'AGENDADO' : 'IMEDIATO'})...`);
            const updateRes = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?id=eq.${targetId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    status: newStatus,
                    driver_id: driverId,
                    updated_at: new Date().toISOString()
                })
            });

            if (!updateRes.ok) throw new Error('Falha ao gravar aceite no banco.');

            console.log('3. Aceite confirmado!');
            playIziSound('success');

            const mission = { 
                ...order, 
                ...realOrder, 
                realId: targetId, 
                status: newStatus 
            };
            
            if (!isScheduled) {
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
                setActiveTab('active_mission');
                toastSuccess('Corrida aceita! Siga para a coleta.');
            } else {
                // Para agendamentos, apenas atualizamos a lista local
                setScheduledOrders(prev => prev.map(s => s.id === targetId || s.realId === targetId ? { ...s, ...mission } : s));
                toastSuccess('Agendamento confirmado com sucesso!');
            }

        } catch (e: any) {
            console.error('ERRO NO ACEITE:', e);
            toastError('Erro ao aceitar: ' + e.message);
        } finally {
            setIsAccepting(false);
            console.groupEnd();
        }
    };

    const handleDecline = (order: Order) => {
        const targetId = order.realId || order.id;
        console.log('[LOG-DRIVER] Recusando pedido:', targetId);
        
        // Salva no localStorage para ignorar este pedido por 30 minutos (ou até limpar cache)
        const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
        declinedMap[targetId] = Date.now();
        localStorage.setItem('Izi_declined_timed', JSON.stringify(declinedMap));
        
        // Remove da lista atual
        setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
        
        toastSuccess('Chamada descartada com sucesso.');
    };

        const refreshFinanceData = async () => {
        if (!driverId) return;
        setIsFinanceLoading(true);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            let token = supabaseKey;
            try {
                const lsKey = `sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`;
                const ls = localStorage.getItem(lsKey);
                if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
            } catch(e) {}

            const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` };
            const fetchWithTimeout = (url: string) => fetch(url, { headers, signal: AbortSignal.timeout(10000) });

            const txsRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/wallet_transactions_delivery?user_id=eq.${driverId}&order=created_at.desc`).catch(() => null);
            const txs = (txsRes && txsRes.ok) ? await txsRes.json() : null;

            const driverRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/drivers_delivery?id=eq.${driverId}&select=bank_info,name`).catch(() => null);
            const driverData = (driverRes && driverRes.ok) ? await driverRes.json() : null;
            
            if (driverData && driverData[0]) {
                const savedPix = driverData[0].bank_info?.pix_key || '';
                if (savedPix) { setPixKey(savedPix); localStorage.setItem('izi_driver_pix', savedPix); }
            }

            const ordersRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/orders_delivery?driver_id=eq.${driverId}&status=in.(concluido,entregue,finalizado)`).catch(() => null);
            const orders = (ordersRes && ordersRes.ok) ? await ordersRes.json() : null;

            let balance = 0;
            if (txs) {
                balance = txs.reduce((acc: number, t: any) => 
                    ['deposito', 'reembolso', 'venda', 'vaga_dedicada', 'bonus'].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 0);
                setEarningsHistory(txs.filter((t: any) => t.type !== 'saque'));
                setWithdrawHistory(txs.filter((t: any) => t.type === 'saque'));
            }

            let todaySum = 0; let weeklySum = 0; let totalGanhos = 0; let missionCount = 0;
            if (orders) { setHistory(orders);
                const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
                const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1); startOfWeek.setHours(0,0,0,0);
                missionCount = orders.length;
                orders.forEach((o: any) => {
                    const fee = getNetEarnings(o);
                    totalGanhos += fee;
                    if (new Date(o.created_at) >= startOfDay) todaySum += fee;
                    if (new Date(o.created_at) >= startOfWeek) weeklySum += fee;
                });
            }

            const totalXp = missionCount * 15;
            const currentLevel = Math.floor(totalXp / 100) + 1;
            setStats(prev => ({ 
                ...prev, 
                balance, 
                today: todaySum, 
                weekly: weeklySum, 
                totalEarnings: totalGanhos, 
                count: missionCount, 
                xp: totalXp,
                level: currentLevel,
                nextXp: currentLevel * 100
            }));

            const { data: sets } = await fetchWithTimeout(`${supabaseUrl}/rest/v1/admin_settings_delivery?limit=1`).then(r => r?.ok ? r.json() : {ok: false}).catch(() => { return { ok: false }; });
            if (sets && sets[0]) setAppSettings(sets[0]);
        } catch (e) {
            console.error("[FINANCE] Error:", e);
        } finally {
            setIsFinanceLoading(false);
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!activeMission || isAccepting) return;

        const isFinishing = ['concluido', 'entregue', 'finalizado', 'delivered'].includes(newStatus.toLowerCase());
        const isPaid = activeMission.payment_status === 'paid' || activeMission.payment_status === 'pago';
        
        if (isFinishing && !isPaid) {
             const confirmed = await showConfirmPaymentMethod(activeMission);
             if (!confirmed) return;
        }

        setIsAccepting(true);
        
        try {
            const missionId = activeMission.realId || activeMission.id;
            if (!missionId) throw new Error('Identificador da missão não encontrado.');
            
            const { error: updateError } = await supabase
                .from('orders_delivery')
                .update({ 
                    status: newStatus.toLowerCase(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', missionId);

            if (updateError) throw updateError;

            toastSuccess(`Status atualizado para: ${newStatus}`);
            
            if (isFinishing) {
                setFinishedMissionData({
                    amount: activeMission.price || 0,
                    bonus: 0,
                    extraKm: 0,
                    extraKmValue: 0,
                    xpGained: 15
                });
                setActiveMission(null);
                refreshFinanceData();
            } else {
                setActiveMission(prev => prev ? { ...prev, status: newStatus.toLowerCase() } : null);
            }
        } catch (e: any) {
            console.error("[UPDATE_STATUS] Error:", e);
            toastError("Erro ao atualizar status: " + e.message);
        } finally {
            setIsAccepting(false);
        }
    };

    const handleWithdrawRequest = () => {
        if (!pixKey || pixKey.trim().length < 3) { toastError('Cadastre uma chave PIX válida.'); setIsEditingPix(true); return; }
        if (stats.balance <= 0) { toastError('Sem saldo disponível.'); return; }
        const minAmount = Number(appSettings?.minwithdrawalamount ?? 0);
        if (stats.balance < minAmount) { toastError(`Saque mínimo: R$ ${minAmount.toFixed(2)}`); return; }
        setShowWithdrawModal(true);
    };

    const confirmWithdraw = async () => {
        if (isWithdrawLoading) return;
        setIsWithdrawLoading(true);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const uid = driverId || localStorage.getItem('izi_driver_uid');
            const feePercent = Number(appSettings?.withdrawalfeepercent ?? 0);
            const feeAmount = stats.balance * (feePercent / 100);

            const { error } = await supabase.from('wallet_transactions_delivery').insert({
                user_id: uid, amount: stats.balance, type: 'saque', status: 'pendente',
                description: `Saque PIX: ${pixKey}${feeAmount > 0 ? ` (Taxa IZI: R$ ${feeAmount.toFixed(2)})` : ''}`
            });

            if (error) throw error;
            setShowWithdrawModal(false); setShowSuccessOverlay(true);
            setTimeout(() => { setShowSuccessOverlay(false); refreshFinanceData(); }, 4000);
        } catch (err: any) {
            toastError("Erro ao processar saque.");
        } finally {
            setIsWithdrawLoading(false);
        }
    };

    const handleSavePix = async (val?: string) => {
        const keyToSave = (val || pixKey).trim();
        if (!keyToSave || !driverId) return;
        setIsSavingPix(true);
        try {
            const { error } = await supabase.from('drivers_delivery').update({ bank_info: { pix_key: keyToSave } }).eq('id', driverId);
            if (error) throw error;
            localStorage.setItem('izi_driver_pix', keyToSave); setPixKey(keyToSave); setIsEditingPix(false);
            toastSuccess('Chave PIX salva!');
        } catch (e: any) {
            toastError("Erro ao salvar PIX");
        } finally {
            setIsSavingPix(false);
        }
    };

    const handleLogout = useCallback(async () => {
        localStorage.removeItem('Izi_online');
        clearDriverSessionState();
        try { await supabase.auth.signOut(); } finally { window.location.href = '/'; }
    }, [clearDriverSessionState]);

    const renderHeader = () => (
        <header className="px-6 py-6 flex items-center justify-center sticky top-0 z-50 bg-transparent shrink-0">
            <h1 className="text-xl font-black text-white tracking-tighter uppercase leading-none">Izi Entregador</h1>
        </header>
    );

    
    const handleApplyToSlot = async (slot: any) => {
        if (!driverId) {
            toastError("Erro: ID do entregador não encontrado.");
            return;
        }

        setApplyingSlotId(slot.id);
        
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const payload = {
                slot_id: slot.id,
                driver_id: driverId,
                status: 'pending',
                merchant_id: slot.merchant_id
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/slot_applications`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Supabase API Error:", errorData);
                throw new Error(errorData.message || 'Erro ao enviar candidatura');
            }

            console.log("Candidatura enviada via REST!");
            setShowSlotAppliedSuccess(true);
            
            // Recarrega as vagas para atualizar a lista
            await fetchFromDB('slot_applications');
            
        } catch (err: any) {
            console.error('Erro detalhado:', err);
            toastError('Falha ao registrar candidatura. ' + (err.message || ''));
        } finally {
            setApplyingSlotId(null);
        }
    };

    const renderBottomNavigation = () => {
        const isSlotDetailActive = !!selectedSlot;

        return (
            <nav className="fixed bottom-0 left-0 right-0 z-[200] px-4 pb-6 pt-2 pointer-events-none">
                <motion.div 
                    layout
                    initial={false}
                    className="clay-card-dark rounded-[32px] p-2 flex items-center justify-between border-white/5 backdrop-blur-3xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {!isSlotDetailActive ? (
                            <motion.div 
                                key="nav-items"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="flex items-center justify-between w-full"
                            >
                                {[
                                    { id: 'dashboard', label: 'Início', icon: 'grid_view' },
                                    { id: 'active_mission', label: 'Missão', icon: 'route' },
                                    { id: 'scheduled', label: 'Agenda', icon: 'event', badge: scheduledOrders.length },
                                    { id: 'earnings', label: 'Financeiro', icon: 'payments' },
                                    { id: 'history', label: 'Histórico', icon: 'history' },
                                    { id: 'profile', label: 'Perfil', icon: 'person' }
                                ].map((item) => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id as any)}
                                            className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-3xl transition-all relative flex-1 ${
                                                isActive ? 'text-primary' : 'text-white/30'
                                            }`}
                                        >
                                            <div className={`size-10 rounded-2xl flex items-center justify-center transition-all ${
                                                isActive ? 'bg-primary/10 border border-primary/20 scale-110' : 'bg-transparent'
                                            }`}>
                                                <Icon name={item.icon} size={isActive ? 24 : 22} className={isActive ? 'text-primary' : 'text-white/20'} />
                                                {item.badge > 0 && (
                                                    <span className="absolute top-1 right-1 size-4 bg-primary text-slate-900 text-[8px] font-black rounded-full flex items-center justify-center border border-black shadow-lg">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-0'} transition-all text-center`}>
                                                {item.label}
                                            </span>
                                        </button>
                                    );
                                })}
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="action-button"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full flex items-center gap-3 p-1"
                            >
                                <button 
                                    onClick={() => setSelectedSlot(null)}
                                    className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all"
                                >
                                    <Icon name="close" size={24} />
                                </button>
                                
                                {(() => {
                                    const sClayDark: React.CSSProperties = {
                                        background: '#121212',
                                        borderRadius: '2.5rem',
                                        boxShadow: '8px 8px 16px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.02), inset -4px -4px 8px rgba(0,0,0,0.8)',
                                    };
                                    const sClayYellow: React.CSSProperties = {
                                        background: '#FACD05',
                                        borderRadius: '2.5rem',
                                        boxShadow: '0 10px 25px rgba(250,204,21,0.3), inset 6px 6px 12px rgba(255,255,255,0.6), inset -6px -6px 12px rgba(0,0,0,0.2)',
                                    };

                                    const hasApplied = myApplications.some((app: any) => app.slot_id === selectedSlot?.id);
                                    const application = myApplications.find((app: any) => app.slot_id === selectedSlot?.id);
                                    
                                    if (hasApplied) {
                                        return (
                                            <div
                                                className="flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase"
                                                style={{
                                                    ...(application?.status === 'accepted'
                                                        ? { background: '#10b981', boxShadow: '0 10px 25px rgba(16,185,129,0.3)' }
                                                        : { ...sClayDark, color: '#FFD700' }
                                                    ),
                                                    borderRadius: '1.2rem',
                                                    letterSpacing: '0.1em',
                                                    color: application?.status === 'accepted' ? '#fff' : '#FFD700',
                                                }}
                                            >
                                                <Icon name={application?.status === 'accepted' ? 'verified' : 'today'} size={18} />
                                                {application?.status === 'accepted' ? 'Candidatura Aprovada!' : 'Em Análise...'}
                                            </div>
                                        );
                                    }
                                    
                                    return (
                                        <button
                                            onClick={() => handleApplyToSlot(selectedSlot)}
                                            disabled={applyingSlotId === selectedSlot.id}
                                            className={`flex-1 flex items-center justify-center gap-3 h-14 font-black text-xs uppercase text-stone-950 active:scale-[0.98] transition-all ${applyingSlotId === selectedSlot.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            style={{ ...sClayYellow, borderRadius: '1.2rem', letterSpacing: '0.15em' }}
                                        >
                                            <Icon name={applyingSlotId === selectedSlot.id ? 'sync' : 'stars'} size={18} className={applyingSlotId === selectedSlot.id ? 'animate-spin' : ''} />
                                            {applyingSlotId === selectedSlot.id ? 'Enviando...' : 'Candidatar-se à Vaga'}
                                        </button>
                                    );
                                })()}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </nav>
        );
    };

const renderDashboard = () => (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-32">
            <main className="px-6 space-y-10 pt-6">
                {/* Refined Profile Card */}
                <header className="clay-profile-card rounded-[2.5rem] flex flex-col gap-8 relative overflow-hidden p-6">
                    <div className="flex items-center gap-6">
                        {/* 3D Claymorphic Profile Picture */}
                        <div className="w-24 h-24 rounded-full border-[8px] border-white/40 overflow-hidden clay-card-yellow shadow-2xl relative">
                            {localStorage.getItem('izi_driver_avatar') ? (
                                <img src={localStorage.getItem('izi_driver_avatar')!} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-stone-900/10">
                                    <Icon name="person" size={48} className="text-stone-950/40" />
                                </div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-4xl font-extrabold text-stone-950 tracking-tight leading-none">
                                {driverName.split(' ')[0] || 'Piloto'}
                            </h1>
                            <div className="flex items-center gap-1.5 bg-stone-950/15 px-3 py-1 rounded-full w-fit">
                                <Icon name="stars" size={14} className="text-stone-950" />
                                <span className="text-stone-900 text-[10px] font-black uppercase tracking-widest">
                                    {stats.level >= 10 ? 'Motorista Elite' : 'Piloto Pro'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Ganhos Hoje</p>
                            <p className="text-xl font-black text-stone-950 truncate italic leading-none">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-1 mt-1.5 opacity-60">
                                <span className="text-[7px] font-black uppercase text-stone-800 tracking-tighter">Na Semana:</span>
                                <span className="text-[9px] font-black text-stone-900">R$ {stats.weekly.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                        <div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em]">ExperiÃência</p>
                                <p className="text-stone-800 text-[8px] font-black uppercase tracking-tighter">Lv. {stats.level}</p>
                            </div>
                            <div className="flex items-baseline gap-1 leading-none">
                                <span className="text-xl font-black text-stone-950 italic">{stats.xp}</span>
                                <span className="text-[9px] font-bold text-stone-800/50 uppercase">XP</span>
                            </div>
                            <div className="w-full h-1.5 bg-stone-950/10 rounded-full mt-2 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(stats.xp % 100)}%` }}
                                    className="h-full bg-stone-950 rounded-full"
                                />
                            </div>
                        </div>
                    </div>
                </header>

                <section className="space-y-2">
                    <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">Disponível para entregas</p>
                    <h2 className="text-white text-4xl font-extrabold tracking-tight">Missões e <span className="text-yellow-400">Vagas</span></h2>
                </section>

                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Novos Pedidos</h3>
                        <div className="flex items-center gap-2 bg-yellow-400/5 px-3 py-1 rounded-full border border-yellow-400/10">
                            <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
                            <p className="text-yellow-400 font-bold text-[10px] uppercase tracking-widest">Radar Ativo</p>
                        </div>
                    </div>
                    <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar -mx-6 px-6">
                        {filteredOrders.length === 0 ? (
                            <div className="flex-shrink-0 w-72 h-56 clay-card-dark rounded-[32px] flex flex-col items-center justify-center gap-4 opacity-50 border-dashed border-white/10 text-center">
                                <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                                    <Icon name="radar" size={32} className="text-white/10 animate-spin-slow" />
                                </div>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Rastreando missões...</p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => {
                                const details = getTypeDetails(order.type);
                                return (
                                    <motion.div 
                                        key={order.id} 
                                        className="flex-shrink-0 w-72 clay-card-dark p-6 relative overflow-hidden group cursor-pointer"
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowOrderModal(true);
                                        }}
                                    >
                                        <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-500">
                                            <Icon name={details.icon} size={120} />
                                        </div>
                                        
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex justify-between items-start">
                                                <div className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{details.label}</div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-white/40 font-bold uppercase">Estimativa</p>
                                                    <p className="text-xl font-bold text-white italic">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-white truncate italic">{order.pickup_address?.split(',')[0]}</p>
                                                <div className="flex items-center gap-2">
                                                    <Icon name="near_me" size={12} className="text-yellow-400" />
                                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">--- kmâ€¢ --- min</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Seção de Vagas Dedicadas no Dashboard */}
                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Vagas Dedicadas</h3>
                        <button onClick={() => setActiveTab('dedicated')} className="text-yellow-400 text-[10px] font-black uppercase tracking-widest bg-yellow-400/10 px-4 py-2 rounded-full">Ver Todas</button>
                    </div>
                    <div className="grid gap-4">
                        {dedicatedSlots.length === 0 ? (
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest text-center py-4">Nenhuma vaga no momento</p>
                        ) : dedicatedSlots.slice(0, 2).map((slot: any) => (
                            <motion.button 
                                key={slot.id}
                                onClick={() => { setSelectedSlot(slot); setActiveTab('dedicated'); }}
                                className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-[0.98] transition-all border-l-4 border-yellow-400"
                            >
                                <div className="size-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0 overflow-hidden border border-yellow-400/20">
                                    {slot.admin_users?.store_logo ? (
                                        <img src={slot.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <Icon name="stars" className="text-yellow-400" size={32} />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">
                                        {slot.title.toLowerCase().includes((slot.admin_users?.store_name || '').toLowerCase()) ? 'Vaga Exclusiva' : (slot.admin_users?.store_name || 'Parceiro Izi')}
                                    </p>
                                    <h4 className="text-white font-black text-lg truncate italic leading-tight">{slot.title}</h4>
                                    <p className="text-[10px] text-white/70 font-bold italic">{slot.working_hours}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-2xl font-black text-yellow-400 italic">R$ {parseFloat(slot.fee_per_day || 0).toFixed(0)}</p>
                                    <p className="text-[8px] text-white/40 uppercase font-black">/dia</p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </section>

                {/* Seção de Agendamentos no Dashboard */}
                <section className="space-y-6">
                    <div className="flex justify-between items-end">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Agendamentos</h3>
                        <button onClick={() => setActiveTab('scheduled')} className="text-yellow-400 text-[10px] font-black uppercase tracking-widest bg-yellow-400/10 px-4 py-2 rounded-full">Ver Calendário</button>
                    </div>
                    {scheduledOrders.length > 0 ? (
                        <div className="space-y-4">
                            {scheduledOrders.slice(0, 2).map((order: any) => {
                                const dt = new Date(order.scheduled_at);
                                return (
                                    <div key={order.id} className="clay-card-dark p-6 flex items-center justify-between border-l-4 border-yellow-400">
                                        <div className="flex items-center gap-5">
                                            <div className="text-center bg-white/5 p-2 rounded-xl min-w-[50px]">
                                                <p className="text-[9px] font-black text-yellow-400 uppercase">{dt.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                                                <p className="text-lg font-black text-white italic">{dt.getDate()}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-white italic truncate w-32">{order.pickup_address?.split(',')[0]}</p>
                                                <p className="text-[10px] text-white/30 font-black uppercase">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-emerald-400 uppercase">Confirmado</p>
                                            <p className="text-base font-black text-white italic">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-10 rounded-[32px] border border-white/5 border-dashed flex flex-col items-center gap-3 text-center opacity-40">
                            <Icon name="calendar_month" size={32} />
                            <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma escala programada</p>
                        </div>
                    )}
                </section>
            </main>
        </motion.div>
    );

    const renderScheduledDetailView = () => {
        const order = selectedScheduledOrder;
        if (!order) return null;
        const dt = new Date(order.scheduled_at);
        
        const isMine = (order.driver_id && String(order.driver_id).trim() === String(driverId).trim());
        const isAccepted = isMine || ['confirmado', 'confirmed'].includes(order.status);
        const isPending = !isAccepted && !order.driver_id && !['cancelado', 'canceled', 'concluido', 'delivered', 'finalizado'].includes(order.status);

        return (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed inset-0 z-[1000] bg-black flex flex-col">
                <header className="fixed top-0 w-full z-50 bg-zinc-950/70 backdrop-blur-xl flex justify-between items-center px-6 py-4 shadow-xl shadow-black/40">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSelectedScheduledOrder(null)} className="text-yellow-400 p-2 rounded-full active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-3xl">arrow_back</span>
                        </button>
                        <h1 className="font-black text-yellow-400 text-xl tracking-tighter uppercase italic">Confirmar Agendamento</h1>
                    </div>
                </header>

                <main className="pt-24 px-6 space-y-8 overflow-y-auto pb-40 no-scrollbar">
                     <div className="clay-card-yellow p-8 text-black relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12">
                            <Icon name="local_shipping" size={160} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="bg-black/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Detalhes da Escala</div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black opacity-60 uppercase">Ganho Garantido</p>
                                    <p className="text-4xl font-black italic">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-center gap-5">
                                    <div className="size-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl">
                                        <Icon name="calendar_month" size={32} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-60 tracking-widest">Data Programada</p>
                                        <p className="text-xl font-black italic uppercase">{dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5">
                                    <div className="size-16 bg-black/5 border border-black/10 rounded-2xl flex items-center justify-center">
                                        <Icon name="schedule" size={32} className="text-black" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-60 tracking-widest">Janela de Horário</p>
                                        <p className="text-xl font-black italic uppercase">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} em diante</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-black/5 border border-black/10 rounded-[32px] space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Icon name="location_on" size={20} className="mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">Ponto de Partida</p>
                                            <p className="font-bold text-sm leading-tight italic">{order.pickup_address}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Icon name="explore" size={20} className="mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">Ãrea de Atuação</p>
                                            <p className="font-bold text-sm leading-tight italic">{order.delivery_address?.split(',')[0]} e região</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                     </div>
                     <div className="bg-zinc-900/50 p-6 rounded-[32px] border border-white/5 backdrop-blur-md">
                        <div className="flex items-center gap-3 mb-4">
                            <Icon name="info" size={20} className="text-yellow-400" />
                            <h4 className="text-[10px] font-black text-white uppercase tracking-widest">Regras do Agendamento</h4>
                        </div>
                        <ul className="space-y-3">
                            <li className="flex gap-3 text-xs text-white/50 font-bold"><span className="text-yellow-400">â€¢</span> Comparecer ao local com 15 min de antecedÃência.</li>
                            <li className="flex gap-3 text-xs text-white/50 font-bold"><span className="text-yellow-400">â€¢</span> Estar com bateria do celular acima de 80%.</li>
                            <li className="flex gap-3 text-xs text-white/50 font-bold"><span className="text-yellow-400">â€¢</span> Traje profissional e baú limpo.</li>
                        </ul>
                     </div>
                </main>

                <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black to-transparent z-[1020]">
                    {isPending ? (
                        <button 
                            onClick={() => {
                                handleAccept({
                                    id: order.id.slice(0, 8).toUpperCase(),
                                    realId: order.id,
                                    type: order.service_type,
                                    title: 'Agendamento',
                                    origin: order.pickup_address,
                                    destination: order.delivery_address,
                                    price: order.total_price,
                                    distance: '---',
                                    time: dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                                    customer: 'Cliente Izi',
                                    rating: 5.0,
                                    scheduled_at: order.scheduled_at
                                });
                                setSelectedScheduledOrder(null);
                            }}
                            className="w-full h-20 bg-yellow-400 text-black rounded-[28px] font-black text-xl uppercase tracking-tighter shadow-[0_20px_40px_rgba(250,204,21,0.3)] active:scale-95 transition-all"
                        >
                            Confirmar Escala Agora
                        </button>
                    ) : isAccepted ? (
                        <div className="w-full h-20 rounded-[28px] border-2 border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center gap-3 backdrop-blur-md">
                            <Icon name="verified" className="text-emerald-400" size={28} />
                            <span className="text-emerald-400 font-black uppercase tracking-widest">Já está na sua agenda</span>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setSelectedScheduledOrder(null)}
                            className="w-full h-18 bg-zinc-800 text-white font-black text-sm uppercase tracking-widest rounded-[24px]"
                        >
                            Voltar
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderScheduledView = () => {
        if (selectedScheduledOrder) return renderScheduledDetailView();
        
        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pb-32 px-4 max-w-2xl mx-auto space-y-8 pt-4">
                <section className="px-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-1">Próximas Entregas</p>
                            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">Agendamentos Disponíveis</h2>
                        </div>
                        <div className="bg-zinc-900/50 px-5 py-2.5 rounded-full border border-white/5 backdrop-blur-md">
                            <span className="text-yellow-400 font-black text-lg">{scheduledOrders.length}</span>
                            <span className="text-zinc-400 text-[10px] font-black uppercase tracking-widest ml-2">Ativos</span>
                        </div>
                    </div>
                </section>

                <div className="space-y-6">
                    {scheduledOrders.length === 0 ? (
                        <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[40px] flex flex-col items-center gap-4 text-center">
                            <Icon name="event_available" className="text-4xl text-white/10" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhum Agendamento disponível</p>
                        </div>
                    ) : (
                        scheduledOrders.map((order: any, i: number) => {
                            const dt = new Date(order.scheduled_at);
                            const isOdd = i % 2 !== 0; 
                            const cardClass = isOdd ? "clay-card-dark" : "clay-card-yellow";
                            const textColor = isOdd ? "text-white" : "text-black";
                            const iconBg = isOdd ? "bg-yellow-400 text-black" : "bg-black text-yellow-400";
                            const btnClass = isOdd 
                                ? "bg-yellow-400 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)]" 
                                : "bg-black text-yellow-400 shadow-lg";

                            return (
                                <motion.div 
                                    key={order.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className={`${cardClass} p-8 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all`}
                                    onClick={() => setSelectedScheduledOrder(order)}
                                >
                                    <div className={`absolute -right-4 -top-4 opacity-[0.08] transform rotate-12 group-hover:scale-110 transition-transform duration-500 ${isOdd ? 'text-yellow-400' : 'text-black'}`}>
                                        <Icon name={order.service_type === 'package' ? 'package_2' : 'local_shipping'} size={140} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`${isOdd ? 'bg-yellow-400 text-black' : 'bg-black/10 text-black'} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                                {order.service_type || 'Entrega Expressa'}
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[8px] font-black uppercase tracking-widest ${isOdd ? 'text-zinc-500' : 'opacity-60'}`}>Valor Estimado</p>
                                                <p className={`text-2xl font-black italic ${isOdd ? 'text-yellow-400' : 'text-black'}`}>R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-4 mb-6 ${textColor}`}>
                                            <div className={`${iconBg} size-12 rounded-2xl flex items-center justify-center shadow-lg`}>
                                                <Icon name="calendar_month" size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg leading-none italic uppercase tracking-tighter">
                                                    {dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '')}
                                                </p>
                                                <p className={`text-sm font-bold mt-1 ${isOdd ? 'text-zinc-400' : 'opacity-70'}`}>
                                                    {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`space-y-4 mb-8 ${textColor}`}>
                                            <div className="flex items-start gap-3">
                                                <Icon name="location_on" size={18} className={`${isOdd ? 'text-yellow-400/70' : 'opacity-60'}`} />
                                                <p className="font-bold text-sm leading-tight italic">{order.pickup_address?.split(',')[0]}â†’ {order.delivery_address?.split(',')[0]}</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button className={`flex-1 ${btnClass} font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-[22px] active:scale-95 transition-all`}>
                                                Ver Detalhes
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        );
    };


    const renderDedicatedView = () => {
        const slot = selectedSlot;
        
        if (!slot) {
            return (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-40 pt-4">
                    <header>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Exclusivo</p>
                        <h2 className="text-3xl font-black text-white tracking-tight mt-1 italic">Vagas Dedicadas</h2>
                        <p className="text-xs text-white/30 mt-1">Seja piloto exclusivo de um parceiro Izi.</p>
                    </header>

                    {dedicatedSlots.length === 0 ? (
                        <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[40px] flex flex-col items-center gap-4 text-center">
                            <Icon name="sentiment_dissatisfied" className="text-4xl text-white/10" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhuma vaga disponível</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dedicatedSlots.map((s: any, i: number) => {
                                const hasApplied = myApplications.some(app => app.slot_id === s.id);
                                const application = myApplications.find(app => app.slot_id === s.id);
                                
                                const sClayDark: React.CSSProperties = {
                                    background: '#121212',
                                    borderRadius: '2.5rem',
                                    boxShadow: '8px 8px 16px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.02), inset -4px -4px 8px rgba(0,0,0,0.8)',
                                };

                                return (
                                    <motion.button 
                                        key={s.id} 
                                        initial={{ opacity: 0, scale: 0.9 }} 
                                        animate={{ opacity: 1, scale: 1 }} 
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedSlot(s)}
                                        className="w-full transition-all p-6 flex items-center gap-5 group text-left relative overflow-hidden active:scale-[0.98]"
                                        style={sClayDark}
                                    >
                                        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                                            {s.admin_users?.store_logo
                                                ? <img src={s.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
                                                : <Icon name="stars" size={26} className="text-primary" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest">
                                                {s.title.toLowerCase().includes((s.admin_users?.store_name || '').toLowerCase()) ? 'Vaga Exclusiva' : (s.admin_users?.store_name || 'Parceiro Izi')}
                                            </p>
                                            <p className="text-base font-black text-white truncate italic">{s.title}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Icon name="schedule" size={10} className="text-white/20" />
                                                <p className="text-[10px] text-white/40 font-bold">{s.working_hours || 'Horário a combinar'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xl font-black text-primary italic">R$ {parseFloat(s.fee_per_day || 0).toFixed(0)}</p>
                                            <p className="text-[8px] text-white/20 uppercase tracking-widest">/dia</p>
                                            {hasApplied && (
                                                <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block ${application?.status === 'accepted' ? 'text-emerald-400' : 'text-primary/60'}`}>
                                                    {application?.status === 'accepted' ? '✓ Aprovado' : '⌛ Analise'}
                                                </span>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            );
        }
        
        const hasApplied = myApplications.some(app => app.slot_id === slot.id);
        const application = myApplications.find(app => app.slot_id === slot.id);
        
        const requirements = slot.metadata?.requirements || [
            { label: "CNH Categoria A Definitiva", detail: "Documentação em dia é obrigatória" },
            { label: "Baú ou Mochila Térmica", detail: "Equipamento próprio para entregas" }
        ];
        const customBenefits = slot.metadata?.custom_benefits || [];
        const neighborhoodExtras = slot.metadata?.neighborhood_extras || [];

        const sClayDark: React.CSSProperties = {
            background: '#121212',
            borderRadius: '2.5rem',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.02), inset -4px -4px 8px rgba(0,0,0,0.8)',
        };
        const sClayIcon: React.CSSProperties = {
            background: '#1A1A1A',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 4px rgba(0,0,0,0.4)',
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 30 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 30 }} 
                className="fixed inset-0 z-[150] bg-black overflow-y-auto no-scrollbar pb-48"
            >
                {/* Hero Header */}
                <header className="relative h-80 w-full shrink-0">
                    {slot.admin_users?.store_banner ? (
                        <img src={slot.admin_users.store_banner} className="w-full h-full object-cover" alt="" />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-stone-900 via-zinc-950 to-black" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                    
                    <button 
                        onClick={() => setSelectedSlot(null)}
                        className="absolute top-8 left-6 size-12 rounded-2xl bg-black/60 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all z-20"
                    >
                        <Icon name="arrow_back" size={24} />
                    </button>

                    <div className="absolute bottom-10 left-6 right-6">
                        <div className="flex items-end gap-5">
                            <div className="size-24 rounded-[32px] bg-yellow-400 p-1.5 shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden border-2 border-white/10 shrink-0">
                                {slot.admin_users?.store_logo ? (
                                    <img src={slot.admin_users.store_logo} className="w-full h-full object-cover rounded-[22px]" alt="" />
                                ) : (
                                    <Icon name="stars" className="text-black" size={48} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0 pb-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2.5 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/20 text-yellow-400 text-[8px] font-black uppercase tracking-widest">Verificado</span>
                                </div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter leading-none">{slot.title}</h2>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-6 space-y-10 py-10">
                    {/* Ganho Card */}
                    <div className="p-8 rounded-[40px] bg-yellow-400 text-stone-950 relative overflow-hidden shadow-[0_30px_60px_rgba(250,204,21,0.2)]">
                        <div className="relative z-10">
                            <p className="font-black uppercase opacity-40 text-[10px] tracking-[0.3em] mb-2">Diária Garantida</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black italic">R$</span>
                                <span className="text-7xl font-black tracking-tighter italic leading-none">{parseFloat(slot.fee_per_day || 0).toFixed(0)}</span>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-stone-950/5 w-fit px-4 py-2 rounded-full border border-stone-950/10">
                                <Icon name="event" size={14} className="text-stone-950" />
                                {slot.working_hours}
                            </div>
                        </div>
                        <Icon name="payments" size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    </div>

                    {/* Benefícios e Extras */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                            <div className="size-12 rounded-2xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="location_on" size={20} className="text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Cidade/Base</p>
                                <p className="text-sm font-black text-white truncate w-full italic">{slot.city || 'Sua Região'}</p>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                            <div className="size-12 rounded-2xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="analytics" size={20} className="text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Extra Entrega</p>
                                <p className="text-sm font-black text-white italic">R$ {parseFloat(slot.metadata?.fee_per_extra_delivery || 0).toFixed(2).replace('.', ',')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bonus Extra */}
                    {customBenefits.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                                <span className="size-2 rounded-full bg-primary" />
                                Bônus e Extras
                            </h3>
                            <div className="flex overflow-x-auto gap-4 -mx-6 px-6 no-scrollbar pb-2">
                                {customBenefits.map((ben: any, idx: number) => (
                                    <div key={idx} className="flex-shrink-0 w-40 p-6 flex flex-col gap-4 border border-white/5" style={sClayDark}>
                                        <div className="size-10 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                            <Icon name="star" className="text-primary" size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{ben.label || ben.title || 'Incentivo'}</p>
                                            <p className="text-lg font-black text-primary italic leading-none">+ R$ {parseFloat(ben.value || 0).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Descrição */}
                    {slot.description && (
                        <section className="space-y-6">
                             <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                                <span className="size-2 rounded-full bg-primary" />
                                Sobre a Vaga
                            </h3>
                            <div className="p-6 border border-white/5 leading-relaxed" style={sClayDark}>
                                <p className="text-sm font-medium text-white/60">{slot.description}</p>
                            </div>
                        </section>
                    )}

                    {/* Requisitos */}
                    <section className="space-y-6">
                        <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-3">
                            <span className="size-2 rounded-full bg-primary" />
                            Requisitos
                        </h3>
                        <div className="grid gap-4">
                            {requirements.map((req: any, idx: number) => (
                                <div key={idx} className="p-2 pr-6 flex items-center gap-5 border border-white/5" style={sClayDark}>
                                    <div className="size-12 rounded-[20px] flex items-center justify-center shrink-0" style={sClayIcon}>
                                        <Icon name="check" size={20} className="text-primary" />
                                    </div>
                                    <div className="flex-1 py-2">
                                        <p className="text-xs font-black text-white uppercase tracking-wide">{typeof req === 'string' ? req : req.label}</p>
                                        {req.detail && <p className="text-[10px] font-medium text-white/30 mt-0.5">{req.detail}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </motion.div>
        );
    };



    const renderHistoryView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-40 pt-4">
            <header>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Histórico</p>
                <h2 className="text-3xl font-black text-white tracking-tight mt-1">Sua Jornada</h2>
                <p className="text-xs text-white/30 mt-1">Confira o registro completo de suas corridas.</p>
            </header>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-4 text-center">
                        <Icon name="history" className="text-4xl text-white/10" />
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhuma corrida finalizada</p>
                    </div>
                ) : (
                    history.map((order: any, i: number) => (
                        <div key={order.id} className="bg-white/[0.03] border border-white/5 rounded-[32px] p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">#{order.id.slice(0, 8).toUpperCase()}</span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">Finalizado</span>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-white leading-tight">{order.delivery_address || order.destination}</p>
                                <p className="text-[10px] text-white/30">{new Date(order.created_at).toLocaleDateString('pt-BR')}às {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                <span className="text-[9px] font-black text-white/20 uppercase">{order.service_type || 'Entrega'}</span>
                                <span className="text-base font-black text-primary italic">R$ {parseFloat(order.total_price || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </motion.div>
    );

    const renderEarningsView = () => (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="px-5 space-y-8 pb-32 pt-6">
            <header className="flex flex-col gap-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Finanças</p>
                <h2 className="text-3xl font-black text-white tracking-tight italic">Seus Ganhos</h2>
            </header>

            {/* Claymorphic Balance Card */}
            <div className="clay-card-yellow rounded-[40px] p-8 relative overflow-hidden group">
                <div className="absolute -right-6 -top-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform duration-700">
                    <Icon name="account_balance_wallet" size={160} className="text-stone-900" />
                </div>
                
                <div className="relative z-10 space-y-8">
                    <div>
                        <p className="text-stone-800 text-[10px] font-black uppercase tracking-widest mb-1">Saldo Disponível</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-stone-900">R$</span>
                            <span className="text-6xl font-black text-stone-950 tracking-tighter italic">
                                {stats.balance.toFixed(2).replace('.', ',')}
                            </span>
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowWithdrawModal(true)}
                        className="w-full h-16 bg-stone-950 text-white rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                        <Icon name="payments" size={20} />
                        Sacar Ganhos
                    </button>
                </div>
            </div>

            {/* Secondary Stats Grid */}
            <div className="grid grid-cols-2 gap-5">
                <div className="clay-card-dark rounded-[32px] p-6 space-y-3">
                    <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Icon name="today" size={20} className="text-primary" />
                    </div>
                    <div>
                        <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-0.5">Hoje</p>
                        <p className="text-xl font-black text-white italic">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>
                <div className="clay-card-dark rounded-[32px] p-6 space-y-3">
                    <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center">
                        <Icon name="local_shipping" size={20} className="text-secondary" />
                    </div>
                    <div>
                        <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-0.5">Entregas</p>
                        <p className="text-xl font-black text-white italic">{stats.count}</p>
                    </div>
                </div>
            </div>

            {/* Performance Chart Placeholder / Future Feature */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-white/60 text-[10px] font-black uppercase tracking-widest">Desempenho Semanal</h3>
                    <Icon name="trending_up" size={16} className="text-emerald-400" />
                </div>
                <div className="h-32 flex items-end justify-between gap-3 px-2">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                            <motion.div 
                                initial={{ height: 0 }} 
                                animate={{ height: `${h}%` }} 
                                className={`w-full rounded-t-xl transition-all ${i === 3 ? 'bg-primary' : 'bg-white/10 group-hover:bg-white/20'}`}
                            />
                            <span className="text-[8px] font-black text-white/20 uppercase">{['S','T','Q','Q','S','S','D'][i]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-6 bg-primary/5 border border-primary/10 rounded-[28px] flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="info" className="text-primary" />
                </div>
                <p className="text-[10px] text-white/40 font-bold leading-relaxed italic">
                    Os pagamentos são processados via PIX e caem na sua conta em até 24h após a solicitação de saque.
                </p>
            </div>
        </motion.div>
    );

    const renderProfileView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-24 pt-4">
            <div className="flex flex-col items-center pt-8 pb-4">
                <div 
                    className="size-28 rounded-[40px] flex items-center justify-center mb-6 relative group"
                    style={{ background: '#1A1A1A', boxShadow: '12px 12px 24px rgba(0,0,0,0.5), -8px -8px 16px rgba(255,255,255,0.02)' }}
                >
                    <Icon name="person" size={48} className="text-primary group-hover:scale-110 transition-transform" />
                    <div className="absolute -bottom-1 -right-1 size-8 rounded-full bg-emerald-500 border-4 border-[#0a0a0a] flex items-center justify-center">
                        <Icon name="check" size={14} className="text-white" />
                    </div>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">{driverName}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">Piloto Iziâ€¢ Nível {stats.level}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-8">
                    <div className="flex flex-col items-center gap-1 bg-white/[0.02] border border-white/5 px-6 py-4 rounded-[28px] min-w-[100px]">
                        <Icon name="star" className="text-primary text-lg" />
                        <span className="text-lg font-black text-white">4.98</span>
                        <span className="text-[8px] font-black text-white/20 uppercase">Rating</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-white/[0.02] border border-white/5 px-6 py-4 rounded-[28px] min-w-[100px]">
                        <Icon name="route" className="text-emerald-400 text-lg" />
                        <span className="text-lg font-black text-white">{stats.count}</span>
                        <span className="text-[8px] font-black text-white/20 uppercase">Viagens</span>
                    </div>
                </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-8 space-y-5">
                <div>
                    <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <Icon name="admin_panel_settings" size={16} /> Zona de Segurança
                    </h3>
                    <p className="text-[11px] text-white/40 leading-relaxed mt-2">
                        Use estas ferramentas apenas em caso de erros no sistema ou se precisar resetar seu estado de disponibilidade.
                    </p>
                </div>
                <div className="flex gap-3 pt-2">
                    <button 
                        onClick={syncMissionWithDB}
                        className="flex-1 h-12 bg-white/5 border border-white/10 text-white/60 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                    >
                        Sincronizar
                    </button>
                    <button 
                        onClick={() => {
                            if (confirm('Deseja forçar a limpeza da missão atual?')) {
                                setActiveMission(null);
                                localStorage.removeItem('Izi_active_mission');
                                setActiveTab('dashboard');
                                toastSuccess('Limpeza concluída!');
                            }
                        }}
                        className="flex-1 h-12 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                    >
                        Resetar Estado
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {[
                    { label: 'Dados Bancários', icon: 'account_balance', color: 'text-emerald-400' },
                    { label: 'PreferÃências', icon: 'settings', color: 'text-primary' },
                    { label: 'Ajuda & Suporte', icon: 'support_agent', color: 'text-blue-400' }
                ].map((item, i) => (
                    <button key={i} className="w-full bg-white/[0.02] border border-white/5 rounded-[24px] p-6 flex items-center justify-between group hover:bg-white/[0.05] transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-4">
                            <div className={`size-12 rounded-[18px] bg-white/5 flex items-center justify-center border border-white/10 ${item.color}`}>
                                <Icon name={item.icon} className="text-xl" />
                            </div>
                            <span className="text-sm font-bold text-white/80">{item.label}</span>
                        </div>
                        <Icon name="chevron_right" className="text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                ))}
            </div>
            
            <button 
                onClick={handleLogout} 
                className="w-full py-6 border border-white/5 text-red-400/60 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] bg-red-500/[0.02] active:scale-95 transition-all mt-4"
            >
                Encerrar Sessão
            </button>
        </motion.div>
    );

    const [isMapOnly, setIsMapOnly] = useState(false);

    const renderActiveMissionView = () => {
        if (!activeMission) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 text-center">
                    <div className="size-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                        <Icon name="route" size={40} className="text-white/20" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sem Missão Ativa</h2>
                    <p className="text-sm text-white/40 leading-relaxed mb-8">Você não possui nenhuma corrida em andamento no momento. Vá ao Dashboard para aceitar novos pedidos.</p>
                    
                    <div className="flex flex-col gap-3 w-full max-w-xs">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className="h-14 bg-primary text-slate-900 font-black text-xs uppercase tracking-widest rounded-3xl w-full active:scale-95 transition-all shadow-lg shadow-primary/20"
                        >
                            Ir para o Dashboard
                        </button>
                        <button 
                            onClick={syncMissionWithDB}
                            className="h-14 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-widest rounded-3xl w-full active:scale-95 transition-all"
                        >
                            Verificar no Servidor
                        </button>
                    </div>
                </motion.div>
            );
        }

        const isMobility = activeMission.type === 'mototaxi' || activeMission.type === 'car_ride';
        
        const getOrderItems = () => {
            if (activeMission.items && Array.isArray(activeMission.items)) return activeMission.items;
            const address = activeMission.delivery_address || activeMission.destination || '';
            if (address.includes('| ITENS:')) {
                return address.split('| ITENS:')[1].split(',').map(i => ({ name: i.trim() }));
            }
            return [];
        };

        const orderItems = getOrderItems();
        const rawAddr = (activeMission.delivery_address || activeMission.destination || '');
        let addressOnly = rawAddr.split('| ITENS:')[0].trim();
        if (addressOnly && !addressOnly.toLowerCase().includes('brumadinho')) {
            addressOnly += ', Brumadinho - MG, Brasil';
        } else if (addressOnly && !addressOnly.toLowerCase().includes('brasil')) {
            addressOnly += ', Brasil';
        }

        let pickupOnly = (activeMission.origin || activeMission.pickup_address || '').split('| ITENS:')[0].trim();
        if (pickupOnly && !pickupOnly.toLowerCase().includes('brumadinho')) {
            pickupOnly += ', Brumadinho - MG, Brasil';
        } else if (pickupOnly && !pickupOnly.toLowerCase().includes('brasil')) {
            pickupOnly += ', Brasil';
        }

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
                <div className="absolute inset-0 z-0 bg-[#020617] flex flex-col items-center justify-center p-8">
                    <div className="relative mb-12">
                        <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                        <div className="size-32 rounded-[45px] bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
                            <Icon name="route" size={48} className="text-primary" />
                        </div>
                    </div>

                    <button 
                        onClick={() => {
                            const isDeliveryPhase = activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'a_caminho' || activeMission.status === 'saiu_para_entrega';
                            const lat = isDeliveryPhase ? activeMission.delivery_lat : activeMission.pickup_lat;
                            const lng = isDeliveryPhase ? activeMission.delivery_lng : activeMission.pickup_lng;
                            const addr = isDeliveryPhase ? addressOnly : pickupOnly;
                            const destination = (lat && lng) ? `${lat},${lng}` : encodeURIComponent(addr);
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                        }}
                        className="w-full max-w-xs h-20 bg-primary text-slate-900 rounded-[30px] flex items-center justify-center gap-4 shadow-2xl shadow-primary/20 active:scale-95 transition-all group"
                    >
                        <div className="size-10 rounded-2xl bg-slate-900/10 flex items-center justify-center group-hover:bg-slate-900/20">
                            <Icon name="navigation" size={20} />
                        </div>
                        <span className="text-base font-black uppercase tracking-widest">Ir para a Rota</span>
                    </button>
                    
                    <p className="mt-6 text-[10px] font-bold text-white/20 uppercase tracking-[0.3em] text-center max-w-[240px] leading-relaxed">
                        Toque no botão acima para abrir o seu GPS favorito e seguir a rota.
                    </p>

                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
                </div>

                <header className="relative z-50 flex items-center justify-between px-6 pt-10">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="size-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl"
                    >
                        <Icon name="arrow_back" />
                    </button>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">Missão Ativa</p>
                        <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1 shadow-sm">
                            #{activeMission.realId?.slice(0,8).toUpperCase()}
                        </h2>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                            <Icon name={statusDisplay.icon} size={10} className={`${statusDisplay.color} animate-pulse`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${statusDisplay.color}`}>{statusDisplay.label}</span>
                        </div>
                    </div>
                </header>

                <motion.div 
                    variants={missionSheetVariants}
                    initial="half"
                    animate={missionSheetState}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.1}
                    onDragEnd={handleMissionDragEnd}
                    className="relative z-40 mt-auto bg-[#030712] border-t-4 border-white/5 flex flex-col rounded-t-[60px] shadow-[-20px_-20px_60px_rgba(255,255,255,0.02),20px_20px_60px_rgba(0,0,0,0.8),inset_4px_4px_12px_rgba(255,255,255,0.05),inset_-4px_-4px_12px_rgba(0,0,0,0.3)] touch-none"
                    style={{ height: "100dvh" }}
                >
                    <div 
                        className="flex items-center justify-between px-8 pt-5 pb-3 cursor-grab active:cursor-grabbing border-b border-white/5"
                        onClick={() => {
                            if (missionSheetState === "collapsed") setMissionSheetState("half");
                            else if (missionSheetState === "half") setMissionSheetState("expanded");
                            else setMissionSheetState("collapsed");
                        }}
                    >
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveTab('dashboard');
                            }}
                            className="bg-zinc-800/50 border border-white/5 px-4 h-9 rounded-2xl flex items-center justify-center gap-2 active:scale-90 transition-all shadow-inner"
                        >
                            <span className="material-symbols-outlined text-white/50 text-[18px]">arrow_back</span>
                            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Minimizar</span>
                        </button>
                        
                        <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                        
                        <div className="size-8" />
                    </div>

                    <div className="p-8 pb-40 overflow-y-auto no-scrollbar flex-1 space-y-8">
                        {activeMission.preparation_status === 'pronto' && (
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} 
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 p-[1px] rounded-[35px] shadow-[0_20px_40px_rgba(16,185,129,0.2)]"
                            >
                                <div className="bg-[#030712]/90 backdrop-blur-xl rounded-[34px] p-6 flex items-center gap-5">
                                    <div className="size-14 rounded-[22px] bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center relative overflow-hidden">
                                        <motion.div 
                                            animate={{ x: [-40, 60] }}
                                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                            className="absolute inset-0 w-8 bg-white/20 skew-x-12 blur-md"
                                        />
                                        <Icon name="check" size={24} className="text-black font-black" />
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-emerald-400 uppercase tracking-tight">Pedido está Pronto!</h4>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pode retirar no estabelecimento</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        <div className="space-y-6">
                            <div className="bg-zinc-900 border-none rounded-[40px] p-8 shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(255,255,255,0.03),inset_-8px_-8px_16px_rgba(0,0,0,0.4)]">
                                <div className="space-y-8 relative">
                                    <div className="absolute left-[13px] top-8 bottom-8 w-[2px] bg-white/5" />
                                    
                                    <div className="flex gap-5">
                                        <div className="size-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center relative z-10"><div className="size-2 bg-blue-400 rounded-full" /></div>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Ponto de Coleta</p>
                                            <p className="text-xs font-bold text-white tracking-tight leading-relaxed">{pickupOnly}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-5">
                                        <div className="size-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center relative z-10"><div className="size-2 bg-emerald-400 rounded-full" /></div>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Destino Final</p>
                                            <p className="text-xs font-bold text-white tracking-tight leading-relaxed">{addressOnly}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-zinc-900 border-none rounded-[40px] p-8 shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(255,255,255,0.03),inset_-8px_-8px_16px_rgba(0,0,0,0.4)]">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-6">Valores da Missão</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter mb-1">Seu Ganho</p>
                                        <p className="text-xl font-black text-primary">R$ {parseFloat(activeMission.delivery_fee || '0').toFixed(2)}</p>
                                    </div>
                                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-3xl">
                                        <p className="text-[8px] font-black text-white/20 uppercase tracking-tighter mb-1">DistÃƒÆ’¢ncia</p>
                                        <p className="text-xl font-black text-white">{(parseFloat(activeMission.distance_km || '0')).toFixed(1)} km</p>
                                    </div>
                                </div>
                            </div>

                            {orderItems.length > 0 && (
                                <div className="bg-zinc-900 border-none rounded-[40px] p-8 shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(255,255,255,0.03),inset_-8px_-8px_16px_rgba(0,0,0,0.4)]">
                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Lista de Itens</p>
                                    <div className="space-y-3">
                                        {orderItems.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs font-bold text-white/60">
                                                <span>ÃƒÂ¢Ã¢€¢ {item.quantity ? `${item.quantity}x ` : ''}{item.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-[#030712] via-[#030712] to-transparent pt-20 pointer-events-none">
                        <div className="pointer-events-auto w-full space-y-3">
                            {(['a_caminho_coleta', 'saiu_para_coleta', 'confirmado', 'preparando', 'aceito', 'atribuido'].includes(activeMission.status || '')) && (
                                <button 
                                    onClick={() => handleUpdateStatus('chegou_coleta')} 
                                    className="w-full h-20 bg-blue-600 text-white font-black text-base uppercase tracking-widest rounded-[35px] shadow-[0_15px_30px_rgba(37,99,235,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                                >
                                    <Icon name="location_on" /> Cheguei na Coleta
                                </button>
                            )}

                            {(['chegou_coleta', 'no_local_coleta', 'waiting_driver'].includes(activeMission.status || '') || activeMission.status === 'pronto') && (
                                <button 
                                    onClick={() => handleUpdateStatus('picked_up')} 
                                    className="w-full h-20 bg-emerald-600 text-white font-black text-base uppercase tracking-widest rounded-[35px] shadow-[0_15px_30px_rgba(5,150,105,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                                >
                                    <Icon name="package_2" /> Confirmar Coleta
                                </button>
                            )}

                            {activeMission.status === 'picked_up' && (
                                <button 
                                    onClick={() => handleUpdateStatus('a_caminho')} 
                                    className="w-full h-20 bg-primary text-slate-950 font-black text-base uppercase tracking-widest rounded-[40px] shadow-[0_15px_35px_rgba(250,204,21,0.25),inset_4px_4px_10px_rgba(255,255,255,0.6),inset_-4px_-4px_10px_rgba(0,0,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                                >
                                    <Icon name="moped" /> Iniciar Entrega
                                </button>
                            )}

                            {(activeMission.status === 'a_caminho' || activeMission.status === 'em_rota') && (
                                <button 
                                    onClick={() => handleUpdateStatus('no_local')} 
                                    className="w-full h-20 bg-blue-600 text-white font-black text-base uppercase tracking-widest rounded-[35px] shadow-[0_15px_30px_rgba(37,99,235,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                                >
                                    <Icon name="person_pin_circle" /> TÃƒÆ’ó no Destino
                                </button>
                            )}

                            {(activeMission.status === 'no_local' || activeMission.status === 'saiu_para_entrega') && (
                                <button 
                                    onClick={() => handleUpdateStatus('concluido')} 
                                    className="w-full h-20 bg-emerald-600 text-white font-black text-base uppercase tracking-widest rounded-[35px] shadow-[0_15px_30px_rgba(5,150,105,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4),inset_-4px_-4px_8px_rgba(0,0,0,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 border-none"
                                >
                                    <Icon name="check_circle" /> {isMobility ? 'Encerrar Corrida' : 'Finalizar Entrega'}
                                </button>
                            )}

                            {['a_caminho_coleta', 'saiu_para_coleta', 'aceito'].includes(activeMission.status || '') && (
                                <button 
                                    onClick={async () => { if (await showConfirm({ message: 'Cancelar missão?' })) handleUpdateStatus('cancelado'); }}
                                    className="w-full py-2 text-red-500/40 text-[9px] font-black uppercase tracking-[0.4em]"
                                >
                                    Cancelar Missão
                                </button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    const renderSOS = () => (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[200] bg-red-950 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-28 clay-fab-sos rounded-full flex items-center justify-center mb-8 animate-pulse"><Icon name="emergency_share" className="text-6xl text-red-400" /></div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">SOS Ativado</h1>
            <p className="text-white/60 text-sm mb-10 max-w-xs leading-relaxed">Sua localização está sendo compartilhada com a central Izi.</p>
            <div className="w-full max-w-sm space-y-4">
                <button onClick={() => { window.open('tel:190'); setIsSOSActive(false); }} className="w-full h-16 bg-white text-red-600 rounded-[24px] flex items-center justify-center gap-4 font-black text-lg uppercase tracking-tight shadow-2xl active:scale-95 transition-all"><Icon name="local_police" className="text-3xl" />Ligar 190</button>
                <button onClick={() => { toastSuccess('Apoio mecÃƒÆ’¢nico acionado.'); setIsSOSActive(false); }} className="w-full h-16 bg-white/10 border border-white/20 text-white rounded-[24px] flex items-center justify-center gap-4 font-black text-base uppercase active:scale-95 transition-all"><Icon name="build" className="text-2xl" />Apoio MecÃƒÆ’¢nico</button>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen w-full flex flex-col items-center justify-center px-7 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,217,0,0.04)_0%,transparent_60%)]" />
                <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,217,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,217,0,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="text-center space-y-3">
                        <div className="inline-flex items-center justify-center size-16 bg-primary/10 border border-primary/20 rounded-[24px] mb-2"><Icon name="two_wheeler" className="text-primary text-3xl" /></div>
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase">Terminal <span className="text-primary">Izi</span></h1>
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">{authMode === 'login' ? 'AutenticaÃƒÆ’çÃƒÆ’ão do Entregador' : 'Cadastro de Novo Piloto'}</p>
                    </div>
                    {authError && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-3 text-red-400 text-xs font-bold text-center">{authError}</motion.div>}
                    <div className="space-y-4">
                        {authMode === 'register' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                                <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="badge" className="text-xl" /></div><input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Nome completo" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" /></div>
                                <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="phone" className="text-xl" /></div><input type="tel" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Telefone (WhatsApp)" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" /></div>
                                <div className="flex gap-2">
                                    {(['mototaxi', 'carro', 'bicicleta'] as const).map(v => (
                                        <button 
                                            key={v} 
                                            type="button" 
                                            onClick={() => setAuthVehicle(v)} 
                                            className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 border transition-all text-[9px] font-black uppercase tracking-widest ${authVehicle === v ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-white/[0.03] border-white/5 text-white/20'}`}
                                        >
                                            <Icon name={v === 'mototaxi' ? 'two_wheeler' : v === 'carro' ? 'directions_car' : 'pedal_bike'} size={18} />
                                            <span>{v}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                        <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="alternate_email" className="text-xl" /></div><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="E-mail" className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" /></div>
                        <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-white/20"><Icon name="lock" className="text-xl" /></div><input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Senha"  className="w-full h-14 pl-14 pr-5 bg-white/[0.03] border border-white/8 rounded-[20px] text-white font-bold placeholder:text-white/15 focus:outline-none focus:border-primary/30 transition-all text-sm" onKeyDown={e => e.key === 'Enter' && authMode === 'login' && handleAuthLogin()} /></div>
                    </div>
                    <div className="space-y-3">
                        <button onClick={authMode === 'login' ? handleAuthLogin : handleAuthRegister} disabled={authLoading} className="w-full h-14 bg-primary text-slate-900 font-black text-sm uppercase tracking-widest rounded-[20px] shadow-2xl shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                            {authLoading ? <div className="size-5 border-2 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" /> : <>{authMode === 'login' ? 'Entrar' : 'Criar Conta'}<Icon name="arrow_forward" className="text-xl" /></>}
                        </button>
                        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="w-full h-12 bg-white/[0.03] border border-white/5 text-white/30 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-white/50 hover:bg-white/[0.05] transition-all">{authMode === 'login' ? 'Criar nova conta' : 'JÃƒÆ’á tenho conta'}</button>
                    </div>
                </div>
                <p className="absolute bottom-8 text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Izi v5.0ÃƒÂ¢Ã¢€¢ ConexÃƒÆ’ão Segura</p>
            </motion.div>
        );
    };

    return (
        <div className="w-full h-[100dvh] bg-black font-sans overflow-hidden relative">
            <AnimatePresence mode="wait">
                {!isAuthenticated && authInitLoading && (
                    <div key="boot" className="h-full flex flex-col items-center justify-center bg-black">
                        <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center animate-pulse mb-4"><Icon name="bolt" className="text-primary text-4xl" /></div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em] animate-pulse">Inicializando Terminal...</p>
                    </div>
                )}
                {!isAuthenticated && !authInitLoading && <div key="login">{renderLoginView()}</div>}
                {isAuthenticated && (
                    <div key="app" className="flex flex-col h-full overflow-hidden">
                        <AnimatePresence>{isSOSActive && renderSOS()}</AnimatePresence>
                        <AnimatePresence>{activeTab === 'active_mission' && renderActiveMissionView()}
                {showSlotAppliedSuccess && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="size-28 rounded-[42px] bg-primary flex items-center justify-center shadow-[0_20px_40px_rgba(250,204,21,0.3)] mb-8"
                        >
                            <span className="material-symbols-outlined text-zinc-950 text-5xl font-black">stars</span>
                        </motion.div>
                        
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none mb-4">
                            Candidatura <br />
                            <span className="text-primary">Enviada!</span>
                        </h2>
                        
                        <p className="text-slate-400 font-bold text-sm tracking-wide mb-12 max-w-xs uppercase opacity-70">
                            Seu perfil está agora com o lojista parceiro. Você será notificado se for selecionado!
                        </p>

                        <button
                            onClick={() => {
                                setShowSlotAppliedSuccess(false);
                                setSelectedSlot(null);
                            }}
                            className="w-full max-w-xs h-16 rounded-[28px] bg-white text-zinc-950 font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all"
                        >
                            Voltar para Vagas
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
            {renderBottomNavigation()}

                        <div className="flex flex-col h-full overflow-hidden">
                             {activeTab !== 'dashboard' && renderHeader()}
                            <AnimatePresence>
                                {activeMission && activeTab !== 'active_mission' && (
                                    <motion.button key="mission-btn" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onClick={() => setActiveTab('active_mission')} className="fixed bottom-28 left-5 right-5 z-[60] bg-primary text-slate-900 rounded-[28px] h-18 flex items-center justify-between px-7 shadow-[0_20px_40px_rgba(250,204,21,0.3)] border-t border-white/40">
                                        <div className="flex items-center gap-4"><div className="size-3.5 bg-slate-950 rounded-full animate-ping" /><span className="font-black text-xs uppercase tracking-[0.2em] italic">Missão em Andamento</span></div>
                                        <div className="size-10 bg-slate-950/10 rounded-full flex items-center justify-center"><Icon name="arrow_forward" className="text-slate-950 text-xl font-black" /></div>
                                    </motion.button>
                                )}
                            </AnimatePresence>
                            {!activeMission && (
                                <div className="fixed bottom-32 right-6 z-[90] flex flex-col items-center gap-2">
                                    <motion.button 
                                        initial={{ scale: 0, y: 50 }} 
                                        animate={{ scale: 1, y: 0 }} 
                                        whileTap={{ scale: 0.9 }} 
                                        onClick={handleToggleOnline} 
                                        className={`size-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                                            isOnline ? 'clay-fab-online' : 'clay-fab-offline'
                                        }`}
                                    >
                                        <Icon 
                                            name={isOnline ? 'radar' : 'power_settings_new'} 
                                            size={40} 
                                            className="text-white" 
                                        />
                                    </motion.button>
                                    <div className="bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-lg">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white">
                                            {isOnline ? 'Online' : 'Offline'}
                                        </p>
                                    </div>
                                </div>
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

            <AnimatePresence>
                {showWithdrawModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm flex items-end justify-center"
                        onClick={() => setShowWithdrawModal(false)}
                    >
                        <motion.div
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-sm bg-black border border-white/10 rounded-t-[40px] p-8 space-y-6"
                        >
                            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto" />
                            <div className="text-center space-y-1">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Confirmar Saque PIX</p>
                                <p className="text-4xl font-black text-white tracking-tighter">R$ {stats.balance.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="bg-white/[0.04] border border-white/5 rounded-[24px] p-5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/40">Destino</span>
                                    <span className="text-xs font-black text-white truncate max-w-[180px]">{pixKey}</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                {Number(appSettings?.withdrawalfeepercent ?? 0) > 0 && (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-white/40">Taxa Administrativa ({appSettings?.withdrawalfeepercent}%)</span>
                                            <span className="text-xs font-black text-red-400">- R$ {(stats.balance * (Number(appSettings?.withdrawalfeepercent) / 100)).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                        <div className="h-px bg-white/5" />
                                    </>
                                )}
                                <div className="flex justify-between items-center text-primary font-black">
                                    <span className="text-xs uppercase tracking-widest">Líquido a Receber</span>
                                    <span className="text-sm">R$ {(stats.balance * (1 - (Number(appSettings?.withdrawalfeepercent ?? 0) / 100))).toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/40">Status</span>
                                    <span className="text-xs font-black text-amber-400">Aguarda aprovação admin</span>
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-center text-white/20 italic">Os saques são processados em até {appSettings?.withdrawal_period_h ?? 24}h.</p>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    disabled={isWithdrawLoading}
                                    className="flex-1 h-14 rounded-2xl bg-white/5 border border-white/10 text-white/60 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmWithdraw}
                                    disabled={isWithdrawLoading}
                                    className="flex-1 h-14 rounded-2xl bg-primary text-slate-900 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isWithdrawLoading ? (
                                        <>
                                            <div className="size-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                            <span>Processando...</span>
                                        </>
                                    ) : (
                                        'Confirmar'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSuccessOverlay && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
                    >
                        <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="size-32 rounded-[48px] bg-emerald-500 shadow-[0_20px_60px_rgba(16,185,129,0.4)] flex items-center justify-center mb-10"
                        >
                            <motion.span 
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                className="material-symbols-outlined text-black text-6xl font-black"
                            >
                                check
                            </motion.span>
                        </motion.div>
                        
                        <motion.h2 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-3xl font-black text-white uppercase tracking-tighter italic"
                        >
                            Saque Solicitado!
                        </motion.h2>
                        
                        <motion.p 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="text-slate-400 font-bold text-sm mt-4 max-w-xs leading-relaxed"
                        >
                            Sua solicitação de PIX foi enviada e já aparece no painel administrativo para aprovação.
                        </motion.p>
                        
                        <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "linear" }}
                            className="h-1 bg-primary/20 rounded-full mt-12 max-w-[200px] overflow-hidden"
                        >
                            <div className="h-full bg-primary" />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {confirmPaymentState?.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[300] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-sm bg-black border border-white/10 rounded-[40px] p-8 shadow-2xl"
                        >
                            <div className="size-16 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                                <span className="material-symbols-outlined text-amber-500 text-3xl">payments</span>
                            </div>

                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic">Atenção Piloto!</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                                Este pedido ainda <span className="text-rose-500 font-bold">não foi pago</span> via App. 
                                Confirme como vocÃê recebeu o valor de <span className="text-white font-black">R$ {Number(confirmPaymentState.mission.total_price || 0).toFixed(2).replace('.', ',')}</span>:
                            </p>

                            <div className="space-y-3">
                                <button 
                                    onClick={() => {
                                        confirmPaymentState.resolve(true);
                                        setConfirmPaymentState(null);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-white text-black font-black text-[11px] uppercase tracking-widest hover:bg-primary transition-all active:scale-95"
                                >
                                    Recebi em Dinheiro
                                </button>
                                <button 
                                    onClick={() => {
                                        confirmPaymentState.resolve(true);
                                        setConfirmPaymentState(null);
                                    }}
                                    className="w-full py-4 rounded-2xl bg-slate-800 text-white font-black text-[11px] uppercase tracking-widest border border-white/5 hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    Recebi via Pix / Cartão
                                </button>
                                <button 
                                    onClick={() => {
                                        confirmPaymentState.resolve(false);
                                        setConfirmPaymentState(null);
                                    }}
                                    className="w-full py-4 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Ainda não recebi
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {finishedMissionData?.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden"
                    >
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                           <div className="absolute top-1/4 left-1/4 size-64 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                           <div className="absolute bottom-1/4 right-1/4 size-64 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>

                        <motion.div 
                            initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 10, stiffness: 100 }}
                            className="size-36 rounded-[54px] bg-gradient-to-br from-primary to-yellow-500 shadow-[0_20px_80px_rgba(250,204,21,0.4)] flex items-center justify-center mb-10 relative"
                        >
                            <span className="material-symbols-outlined text-zinc-950 text-7xl font-black">celebration</span>
                            
                            <motion.div 
                                animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 border-4 border-primary rounded-[54px]"
                            />
                        </motion.div>
                        
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-4"
                        >
                            <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                                Parabéns! <br />
                                <span className="text-primary">Missão Concluída</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-sm tracking-wide uppercase opacity-60">Você acaba de faturar:</p>
                        </motion.div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="my-6 w-full max-w-sm px-6 py-8 bg-white/[0.03] border border-white/10 rounded-[40px] shadow-sm relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full" />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div>
                                    <span className="block text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 text-center">Valor Real da Corrida</span>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-2xl font-black text-white italic opacity-40 mt-3">R$</span>
                                        <span className="text-7xl font-black text-white tracking-tighter italic leading-none">
                                            {(finishedMissionData.grossAmount || 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Ganho Financeiro</span>
                                        <span className="text-lg font-black text-white italic">
                                            R$ {(finishedMissionData.amount || 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                        <span className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1">XP Ganhos</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-black text-primary italic">+{finishedMissionData.xpGained || 15}</span>
                                            <span className="text-[10px] font-black text-primary/50 italic">XP</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-2 pt-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Ganho Líquido</span>
                                    <span className="text-sm font-black text-primary italic">
                                        R$ {finishedMissionData.amount.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="space-y-8 w-full max-w-xs"
                        >
                            <p className="text-emerald-400 font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined text-xs">account_balance_wallet</span>
                                Já disponível na sua carteira
                            </p>

                            <button
                                onClick={() => setFinishedMissionData(null)}
                                className="w-full h-16 rounded-[28px] bg-white text-zinc-950 font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-primary"
                            >
                                Continuar Ganhando
                            </button>
                        </motion.div>

                        {/* Detalhe Estético Inferior */}
                        <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-30">
                            <div className="w-12 h-1.5 bg-white/10 rounded-full" />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

export default App;




