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

// Normaliza aliases variados de service_type que vÃªm do banco de dados para os tipos canÃ´nicos
const normalizeServiceType = (raw: string | undefined | null): string => {
    if (!raw) return 'delivery';
    const t = raw.toLowerCase().trim();
    // Tipos de comida / restaurante
    if (['restaurant', 'restaurante', 'food', 'hamburguer', 'hamburger', 'burger',
         'lanchonete', 'lanche', 'pizzaria', 'pizza', 'sushi', 'japanese',
         'churrasco', 'grill', 'culinaria', 'culinÃ¡ria', 'refeicao', 'refeiÃ§Ã£o'].includes(t)) return 'restaurant';
    // Mercado / supermercado
    if (['market', 'mercado', 'supermercado', 'hortifruti'].includes(t)) return 'market';
    // FarmÃ¡cia / saÃºde
    if (['pharmacy', 'farmacia', 'farmÃ¡cia', 'saude', 'saÃºde', 'health'].includes(t)) return 'pharmacy';
    // Bebidas
    if (['beverages', 'bebidas', 'drinks', 'bar'].includes(t)) return 'beverages';
    // Mobilidade
    if (['mototaxi', 'moto_taxi', 'motortaxi'].includes(t)) return 'mototaxi';
    if (['car_ride', 'carro', 'taxi', 'car', 'ride'].includes(t)) return 'car_ride';
    if (['motorista_particular', 'motorista particular', 'chauffeur'].includes(t)) return 'motorista_particular';
    // LogÃ­stica
    if (['van'].includes(t)) return 'van';
    if (['utilitario', 'utilitario leve', 'utility'].includes(t)) return 'utilitario';
    if (['logistica', 'logistics'].includes(t)) return 'logistica';
    if (['frete', 'carreto', 'freight', 'mudanca', 'mudanÃ§a'].includes(t)) return 'frete';
    if (['motoboy', 'courier'].includes(t)) return 'motoboy';
    if (['package', 'pacote', 'encomenda', 'express', 'delivery'].includes(t)) return 'package';
    return t; // retorna o tipo original se nÃ£o houver mapeamento
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
        summary = itemNames.slice(0, 2).join(' â€¢ ');
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
            // Busca configuraÃ§Ãµes gerais
            const res = await fetch(`${supabaseUrl}/rest/v1/app_settings_delivery?select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data[0]) setAppSettings(data[0]);
            }

            // Busca taxas dinÃ¢micas (especialmente os valores base como food_min)
            const resRates = await fetch(`${supabaseUrl}/rest/v1/dynamic_rates_delivery?type=eq.base_values&select=*`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` }
            });
            if (resRates.ok) {
                const dataRates = await resRates.json();
                if (dataRates && dataRates[0]) setDynamicRates(dataRates[0].metadata);
            }
        } catch (e) {
            console.error('[SETTINGS] Erro ao buscar configuraÃ§Ãµes:', e);
        }
    }, []);

    // Efeito para persistir dados bÃ¡sicos de autenticaÃ§Ã£o no localStorage
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
    const hasBootedRef = useRef(false); // Garante que syncMissionWithDB e restauraÃ§Ã£o sÃ³ ocorrem 1x por sessÃ£o
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
    const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
    const [history, setHistory] = useState<Order[]>([]);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);
    const [merchantCoords, setMerchantCoords] = useState<{lat: number, lng: number} | null>(null);
    const [stats, setStats] = useState({ balance: 0, today: 0, totalEarnings: 0, count: 0, level: 1, xp: 0, nextXp: 100 });
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
        console.log('[AUTH] Executando limpeza de sessÃ£o (Logout)');
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

        // Remove chaves crÃ­ticas de sessÃ£o
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
    // este efeito forÃ§a a reconciliaÃ§Ã£o com a intenÃ§Ã£o do motorista.
    useEffect(() => {
        const localIntent = localStorage.getItem('Izi_online') === 'true';
        if (localIntent && !isOnline) {
            console.warn('[WATCHDOG] Detectada divergÃªncia de status! ForÃ§ando ONLINE conforme localStorage.');
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
        // Permite GPS se estiver ONLINE ou em uma MISSÃƒO ATIVA
        if (!isOnline && !activeMission) return;
        
        const updateLocation = async (lat: number, lng: number) => {
          setDriverCoords({ lat, lng });
          await supabase.from('drivers_delivery').update({ lat, lng }).eq('id', driverId);
        };

        // Obter posiÃ§Ã£o IMEDIATA para agilizar o mapa
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
            // Nota: Se houver RLS impedindo a leitura de is_deleted=true, o data virÃ¡ null
            const { data } = await supabase.from('drivers_delivery').select('id, name, lat, lng, is_deleted, is_online').eq('id', userId).maybeSingle();
            
            // Se NÃƒO existe o ID no banco OU se o registro existe mas foi deletado, NÃƒO recriamos se o objetivo for deletar
            // Mas aqui, sÃ³ criamos se for um usuÃ¡rio COMPLETAMENTE novo (sem registro nenhum)
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
                // Se o registro existe, nÃ£o fazemos o upsert para nÃ£o "ressuscitar"
                if (data.name) {
                    setDriverName(data.name);
                    localStorage.setItem('izi_driver_name', data.name);
                }
                // REMOVIDO: setIsOnline daqui. O controle de is_online agora
                // Ã© feito exclusivamente pelo useEffect de restauraÃ§Ã£o de sessÃ£o.
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

        // Timeout de seguranÃ§a: garante que o app saia da tela de boot mesmo se houver erro de rede/supabase
        const authTimeout = setTimeout(() => setAuthInitLoading(false), 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const user = session?.user;
            if (user) {
                setDriverId(user.id);
                setIsAuthenticated(true);

                // BOOT ÃšNICO: sÃ³ executa restauraÃ§Ã£o completa na primeira vez
                if (!hasBootedRef.current) {
                    hasBootedRef.current = true;
                    console.log('[AUTH] Primeiro boot detectado. Carregando perfil...');

                    // Buscar perfil apenas para nome e chave pix (NÃƒO tocar no is_online aqui)
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

                    fetchFinanceData();
                    fetchMissionHistory();
                    syncMissionWithDB();
                } else {
                    // RenovaÃ§Ãµes de token (TOKEN_REFRESHED): NÃƒO alterar nenhum estado
                    console.log('[AUTH] RenovaÃ§Ã£o de token. Ignorando reset de estado.');
                }
            } else {
                if (hasBootedRef.current) {
                    console.warn('[AUTH] SIGNED_OUT detectado. Limpando sessÃ£o...');
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
        if (authPassword.length < 6) { setAuthError('A senha deve ter no mÃ­nimo 6 caracteres.'); setAuthLoading(false); return; }
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
            setAuthError(e.message?.includes('already registered') ? 'Este email jÃ¡ estÃ¡ cadastrado. FaÃ§a login.' : e.message);
        } finally { setAuthLoading(false); }
    };





    // =====================================================================
    // RESTAURAÃ‡ÃƒO DE STATUS ONLINE: useEffect EXCLUSIVO e AUTORITATIVO
    // Este Ã© o ÃšNICO lugar onde o is_online Ã© restaurado apÃ³s login/refresh.
    // Ele dispara quando driverId e isAuthenticated ficam disponÃ­veis.
    // =====================================================================
    useEffect(() => {
        if (!driverId || !isAuthenticated) return;

        const localWantsOnline = localStorage.getItem('Izi_online') === 'true';
        console.log(`[ONLINE-RESTORE] Autenticado! localStorage diz online=${localWantsOnline}`);

        // Setar estado local imediatamente (sem depender do banco)
        setIsOnline(localWantsOnline);

        if (localWantsOnline) {
            // Sincronizar banco em background para garantir consistÃªncia
            supabase.from('drivers_delivery')
                .update({ is_online: true, last_seen_at: new Date().toISOString() })
                .eq('id', driverId)
                .then(({ error }) => {
                    if (error) console.error('[ONLINE-RESTORE] Erro ao sincronizar online no banco:', error.message);
                    else console.log('[ONLINE-RESTORE] Banco sincronizado: is_online=true');
                });
        }
    }, [driverId, isAuthenticated]);

    // SincronizaÃ§Ã£o entre mÃºltiplos dispositivos (Online status, Carteira, Perfil)
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
                console.log('[REALTIME] SincronizaÃ§Ã£o multi-dispositivo:', updated);
                
                // SincronizaÃ§Ã£o multi-dispositivo de perfil e financeira
                // REMOVIDO: SincronizaÃ§Ã£o de is_online do banco para cÃ¡.
                // O localStorage Ã© a autoridade absoluta sobre a intenÃ§Ã£o do motorista.
                // A Ãºnica forma de ser ejetado Ã© via is_active (Remote Eject) ou Logout manual.
                
                // Recarregar dados financeiros se o saldo mudou por outro dispositivo
                fetchFinanceData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [driverId, isAuthenticated]); // REMOVIDO isOnline das deps - evita re-subscriÃ§Ã£o que dispara snapshot do banco

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

        // SALVA NO LOCALSTORAGE IMEDIATAMENTE â€” antes de qualquer chamada ao banco
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
                // NÃƒO reverte â€” o localStorage jÃ¡ salvou a intenÃ§Ã£o e o heartbeat sincronizarÃ¡ o banco
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
                    console.error('[EJECT] SessÃ£o ejetada remotamente! Motivo: Motorista desativado no painel Admin.');
                    toastError('Sua conta foi desativada pelo administrador.');
                    handleLogout();
                }
                // Se o banco forÃ§ar is_online=false MAS o motorista quer estar online, 
                // o heartbeat (useEffect abaixo) vai corrigir o banco em 5 segundos.
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [driverId, isAuthenticated]);

    const syncMissionWithDB = useCallback(async () => {
        if (!driverId || !isAuthenticated) return;
        try {
            console.log('[SYNC] Sincronizando missÃ£o ativa do banco...');
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
                o.driver_id === dId // RIGOROSO: SÃ³ Ã© missÃ£o ativa se for MINHA
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
                console.log('[SYNC] MissÃ£o restaurada do banco:', mission.realId);
            } else {
                console.log('[SYNC] Nenhuma missÃ£o ativa no banco para o motorista:', driverId);

                // PROTEÃ‡ÃƒO: SÃ³ apaga o cache local se a missÃ£o for ANTIGA (> 30 min)
                // Isso evita apagar uma missÃ£o que acabou de ser aceita mas ainda nÃ£o propagou no banco
                const cachedMissionRaw = localStorage.getItem('Izi_active_mission');
                if (cachedMissionRaw) {
                    try {
                        const cachedMission = JSON.parse(cachedMissionRaw);
                        const createdAt = new Date(cachedMission.created_at || 0).getTime();
                        const ageMs = Date.now() - createdAt;
                        const thirtyMinutes = 30 * 60 * 1000;
                        if (ageMs > thirtyMinutes) {
                            console.log('[SYNC] MissÃ£o antiga no cache (> 30 min). Limpando...');
                            setActiveMission(null);
                            localStorage.removeItem('Izi_active_mission');
                        } else {
                            console.log('[SYNC] MissÃ£o recente no cache. Mantendo estado local por precauÃ§Ã£o.');
                        }
                    } catch {
                        setActiveMission(null);
                        localStorage.removeItem('Izi_active_mission');
                    }
                }
            }
        } catch (err: any) {
            console.error('[SYNC] Falha ao sincronizar missÃ£o:', err.message);
        }
    }, [driverId, isAuthenticated]);

    useEffect(() => {
        syncMissionWithDB();
    }, [driverId, isAuthenticated, syncMissionWithDB]);

    // Canal separado para vagas dedicadas â€” funciona independente do status online
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
    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        const fetchApps = async () => {
            const { data } = await supabase.from('slot_applications').select('*').eq('driver_id', driverId);
            setMyApplications(data || []);
        };
        fetchApps();
    }, [isAuthenticated, driverId]);

    // Buscar agendamentos disponÃ­veis e aceitos
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

        const fetchFromDB = async (table: string, queryParams: string = '') => {
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
        };

        const fetchOrders = async () => {
            try {
                // Busca ampla incluindo dados vivos do lojista. Sintaxe corrigida para garantir o JOIN.
                const data = await fetchFromDB('orders_delivery', 'select=*,admin_users(store_name,store_address,latitude,longitude)&order=created_at.desc&limit=20');
                console.log('[POLL-DEBUG] Dados recebidos:', data?.length, 'primeiro item tem admin_users?', !!data?.[0]?.admin_users);
                
                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                const now = Date.now();
                const currentMission = activeMissionRef.current;

                // 1. Sincronizar MissÃ£o Ativa (Se o Admin me deu um pedido ou aceitei em outro lugar)
                const myAssignment = data.find((o: any) => 
                    o.driver_id && String(o.driver_id).trim() === String(driverId).trim() &&
                    !['concluido', 'cancelado', 'finalizado', 'entregue'].includes(o.status)
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
                    console.log('[COLETA-DEBUG] MissÃ£o Ativa Sincronizada:', mission.pickup_address);
                    setActiveMission(mission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                    if (activeTabRef.current !== 'active_mission') setActiveTab('active_mission');
                }

                // 2. DisponÃ­veis no Dashboard
                const available = data.filter((o: any) => {
                    const isMerchantOrder = !!o.merchant_id || !!o.admin_users;
                    const merchantAccepted = ['waiting_driver', 'preparando', 'pronto', 'accepted'].includes(o.status);
                    const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'].includes(o.status);
                    
                    const statusOk = isMerchantOrder ? merchantAccepted : p2pAllowed;
                    const notMyAssignment = !o.driver_id || String(o.driver_id).trim() === '';
                    const notDeclined = !(now - (declinedMap[o.id] || 0) < 5000);
                    const notFinancial = !['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'].includes(o.service_type);
                    return statusOk && notMyAssignment && notDeclined && notFinancial;
                });

                setOrders(available.map((o: any) => {
                    const merchant = o.admin_users;
                    if (merchant) {
                        console.log(`[COLETA-DEBUG] Loja: ${merchant.store_name} | EndereÃ§o: ${merchant.store_address} | Coords: ${merchant.latitude},${merchant.longitude}`);
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

        // Polling a cada 5s para garantir que pedidos reapareÃ§am apÃ³s rejeiÃ§Ã£o
        const pollInterval = setInterval(fetchOrders, 5000);
        
        const channel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new;
                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                
                // Filtros de seguranÃ§a e status
                const isMerchantOrder = !!o.merchant_id;
                const merchantAccepted = ['waiting_driver', 'preparando', 'pronto', 'accepted'].includes(o.status);
                const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'].includes(o.status);
                
                if (isMerchantOrder) {
                    if (!merchantAccepted) return;
                } else {
                    if (!p2pAllowed) return;
                }
                if (Date.now() - (declinedMap[o.id] || 0) < 1800000) return;
                
                // Ignorar transaÃ§Ãµes financeiras (Izi Coin, Assinatura) que nÃ£o sÃ£o missÃµes
                const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                if (financialTypes.includes(o.service_type)) return;

                // Restringir sons por categoria e status (Evitar barulho precoce em Food)
                const availabilityType = normalizeServiceType(o.service_type);
                const isMobility = ['mototaxi', 'car_ride', 'frete', 'van', 'utilitario', 'logistica', 'motorista_particular', 'package', 'motoboy'].includes(availabilityType);
                // SÃ³ toca som se: (Ã‰ Mobilidade) OU (Ã‰ Food e estÃ¡ em um status visÃ­vel/acionÃ¡vel)
                // E tambÃ©m somente se o pagamento jÃ¡ foi aprovado ou Ã© em dinheiro
                const actionableStatuses = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'accepted'];
                const isPaidOrCash = o.payment_method === 'cash' || o.payment_status === 'paid' || o.payment_method === 'dinheiro';
                const shouldSound = actionableStatuses.includes(o.status) && isPaidOrCash;
                const servicePreview = getServicePresentation(o);

                setOrders(prev => {
                    if (prev.find(x => x.realId === o.id)) return prev;
                    
                    // SÃ³ toca som se estiver online e passar no filtro de categoria
                    if (isOnline && shouldSound) {
                        playIziSound('driver');
                        if (Notification.permission === 'granted') {
                            new Notification('ðŸš€ Nova MissÃ£o Izi!', { 
                                body: `${servicePreview.headline} â€¢ ${servicePreview.pickupText || o.pickup_address}`, 
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

                    // Se o pedido jÃ¡ veio atribuÃ­do a mim (ex: admin atribuiu), define como missÃ£o ativa na hora
                    if (o.driver_id && String(o.driver_id).trim() === String(driverId).trim()) {
                        setActiveMission(mapped);
                        localStorage.setItem('Izi_active_mission', JSON.stringify(mapped));
                        setActiveTab('active_mission');
                        return prev;
                    }

                    // Se o pedido tem motorista mas NÃƒO SOU EU, ignora (foi aceito por outro)
                    if (o.driver_id && String(o.driver_id).trim() !== '') {
                        return prev;
                    }

                    return [mapped, ...prev];
                });
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                const currentMission = activeMissionRef.current;
                
                // SincronizaÃ§Ã£o Global de MissÃ£o Ativa (Multi-dispositivos)
                const dId = String(driverId).trim();
                if (o.driver_id === dId) {
                    console.log('[REALTIME] Sincronizando mudanÃ§a de status da minha missÃ£o:', o.status);
                    
                    // LÃ³gica de Limpeza: Se o pedido foi cancelado ou concluÃ­do em outro dispositivo
                    if (['concluido', 'cancelado', 'finalizado', 'entregue'].includes(o.status)) {
                        console.log('[REALTIME] MissÃ£o finalizada detectada. Limpando estado local.');
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
                            toastSuccess('ðŸ”¥ O Pedido estÃ¡ PRONTO para coleta!');
                            if (Notification.permission === 'granted') new Notification('ðŸ“¦ Pedido Pronto!', { body: 'O estabelecimento finalizou o preparo. Pode coletar!' });
                        }

                        // Sincronizar o status da missÃ£o ativa com o servidor
                        // MANTÃ‰M OS DADOS DO LOJISTA DE BRUMADINHO (Join admin_users) - Prioridade Total
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
                        
                        // Se nÃ£o estivermos na tela de missÃ£o, mudar para lÃ¡ automaticamente
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
                            // Ignorar transaÃ§Ãµes financeiras
                            const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                            if (financialTypes.includes(o.service_type)) return prev;

                            // Alerta para qualquer pedido novo disponÃ­vel para o entregador (Mobilidade ou Food)
                            const actionableStatuses = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'accepted'];
                            const isPaidOrCash = o.payment_method === 'cash' || o.payment_status === 'paid' || o.payment_method === 'dinheiro';
                            const shouldSound = actionableStatuses.includes(o.status) && isPaidOrCash;
                            const servicePreview = getServicePresentation(o);

                            if (isOnline && shouldSound) {
                                playIziSound('driver');
                                if (Notification.permission === 'granted') {
                                    new Notification('ðŸ“¦ Pedido DisponÃ­vel!', { 
                                        body: `${servicePreview.headline} â€¢ ${servicePreview.pickupText || o.pickup_address}`, 
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

    // Loop de som para novas chamadas (Looping at o entregador agir)
    useEffect(() => {
        let soundInterval: any;
        if (isOnline && orders.length > 0 && !activeMission) {
            // Toca imediatamente na deteco de novos pedidos
            playIziSound('driver');
            
            // Intervalo de 8s (3s de durao do som + 5s de pausa solicitada)
            soundInterval = setInterval(() => {
                if (isOnline && orders.length > 0 && !activeMission) {
                    playIziSound('driver');
                }
            }, 8000); 
        }
        return () => { if (soundInterval) clearInterval(soundInterval); };
    }, [isOnline, orders.length, !!activeMission]);

    const [isSyncing, setIsSyncing] = useState(false);
    const handleManualSync = async () => {
        if (isSyncing) return;
        setIsSyncing(true);
        console.group('[DEBUG-REST-SYNC]');
        console.log('1. Iniciando teste de conexÃ£o via REST DIRETO...');

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
                toastError('O banco estÃ¡ vazio (vias REST).');
                return;
            }

            // Filtros de exibiÃ§Ã£o
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
                console.log('5. MissÃ£o ativa encontrada via REST:', myActive.id);
                const mission = { ...myActive, realId: myActive.id, type: myActive.service_type, customer: myActive.user_name || 'Cliente Izi' };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                setActiveTab('active_mission');
                toastSuccess('Conectado via REST! MissÃ£o recuperada.');
            } else {
                toastSuccess(`Conectado! ${available.length} chamadas via REST.`);
            }

        } catch (e: any) {
            console.error('ERRO CRÃTICO NO REST SYNC:', e);
            toastError('Falha na conexÃ£o rest: ' + e.message);
        } finally {
            console.groupEnd();
            setIsSyncing(false);
        }
    };



    // Startup / Session Recovery: Buscar missÃ£o ativa no banco se o driverId estiver presente
    useEffect(() => {
        const recoverActiveMission = async () => {
            if (!driverId || activeMission) return;
            
            console.log('[RECOVERY] Buscando missÃ£o ativa no servidor...');
            const { data, error } = await supabase
                .from('orders_delivery')
                .select('*')
                .eq('driver_id', driverId)
                .not('status', 'in', ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'])
                .maybeSingle();

            if (error) console.error('[RECOVERY] Erro na query:', error);

            if (data && !error) {
                console.log('[RECOVERY] MissÃ£o encontrada:', data.id);
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
            // Validar UUID â€” order.id Ã© o ID curto (8 chars), order.realId Ã© o UUID completo
            const targetId = order.realId || order.id;
            console.log('Target ID Identificado:', targetId, { orderId: order.id, realId: order.realId });
            
            // ValidaÃ§Ã£o de seguranÃ§a bÃ¡sica: Relaxada para suportar listagens que usam apenas ID curto
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

            if (!realOrder) throw new Error('Pedido nÃ£o encontrado.');
            
            // Verificar se ainda estÃ¡ disponÃ­vel
            if (realOrder.driver_id && String(realOrder.driver_id).trim() !== '') {
                toastError('Este pedido jÃ¡ foi aceito por outro piloto.');
                setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
                return;
            }

            console.log('2. Gravando aceite via PATCH REST...');
            const updateRes = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?id=eq.${targetId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({
                    status: 'a_caminho_coleta',
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
                status: 'a_caminho_coleta' 
            };
            
            setActiveMission(mission);
            localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
            setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
            setActiveTab('active_mission');
            toastSuccess('Corrida aceita! Siga para a coleta.');

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
        
        // Salva no localStorage para ignorar este pedido por 30 minutos (ou atÃ© limpar cache)
        const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
        declinedMap[targetId] = Date.now();
        localStorage.setItem('Izi_declined_timed', JSON.stringify(declinedMap));
        
        // Remove da lista atual
        setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
        
        toastSuccess('Chamada descartada com sucesso.');
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (!activeMission || isAccepting) return;

        // ValidaÃ§Ã£o de pagamento se estiver finalizando
        const isFinishing = ['concluido', 'entregue', 'finalizado', 'delivered'].includes(newStatus.toLowerCase());
        const isPaid = activeMission.payment_status === 'paid' || activeMission.payment_status === 'pago';
        
        if (isFinishing && !isPaid) {
             const confirmed = await showConfirmPaymentMethod(activeMission);
             if (!confirmed) return;
        }

        setIsAccepting(true);
        
        try {
            const missionId = activeMission.realId || activeMission.id;
            if (!missionId) throw new Error('Identificador da missÃ£o nÃ£o encontrado.');
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            let token = supabaseKey;
            try {
                const ls = localStorage.getItem(`sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`);
                if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
            } catch(e) {}

            console.log('[STATUS] Atualizando status via REST para:', newStatus, 'MissionID:', missionId);
            const response = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?id=eq.${missionId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify({ status: newStatus, updated_at: new Date().toISOString() })
            });

            if (!response.ok) {
                const errBody = await response.text();
                console.error('[STATUS-ERROR] Detalhes:', response.status, errBody);
                let msg = `Erro ${response.status}: `;
                try {
                   const parsed = JSON.parse(errBody);
                   msg += parsed.message || parsed.error || errBody;
                } catch(e) { msg += errBody || 'Erro desconhecido'; }
                
                showToast(msg, 'error');
                throw new Error(msg);
            }
            
            const updatedData = await response.json();
            console.log('[STATUS] Sucesso:', updatedData);
            toastSuccess(`Status alterado para: ${newStatus}`);

            // LÃ³gica de FinalizaÃ§Ã£o
            const finishStatus = ['concluido', 'entregue', 'finalizado', 'delivered'];
            if (finishStatus.includes(newStatus.toLowerCase())) {
                try {
                    // 1. Ganho do Entregador
                    const netEarnings = getNetEarnings(activeMission);
                    
                    if (driverId && netEarnings > 0) {
                        await fetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
                            method: 'POST',
                            headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                user_id: driverId,
                                amount: netEarnings,
                                type: 'deposito',
                                description: `Ganhos: MissÃ£o #${missionId.slice(0, 8).toUpperCase()} (LÃ­quido)`
                            })
                        });
                    }

                    // 2. CrÃ©dito do Lojista (NOVO)
                    if (activeMission.merchant_id && (Number(activeMission.total_price) || 0) > 0) {
                        try {
                            // Buscar comissÃ£o do lojista
                            const commRes = await fetch(`${supabaseUrl}/rest/v1/admin_users?select=commission_percent&id=eq.${activeMission.merchant_id}&limit=1`, {
                                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
                            });
                            const commData = await commRes.json();
                            const mData = commData[0];
                            
                            const commRate = mData?.commission_percent ?? appSettings?.appCommission ?? 12;
                            const totalPrice = Number(activeMission.total_price) || 0;
                            const commValue = totalPrice * (Number(commRate) / 100);
                            const merchantNet = totalPrice - commValue;

                            if (merchantNet > 0) {
                                await fetch(`${supabaseUrl}/rest/v1/rpc/credit_wallet_transaction`, {
                                    method: 'POST',
                                    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        p_user_id: activeMission.merchant_id,
                                        p_amount: merchantNet,
                                        p_type: 'venda',
                                        p_description: `Venda Pedido #${missionId.slice(0, 8).toUpperCase()} (LÃ­quido)`,
                                        p_status: 'concluido'
                                    })
                                });
                            }
                        } catch (mErr) {
                            console.error('[FINALIZE] Erro ao creditar lojista:', mErr);
                        }
                    }

                    // Chamada REST manual tambÃ©m para evitar bloqueio no sync
                    fetchFinanceData(); // Sem await para nÃ£o bloquear a UI, deixa atualizar no fundo
                } catch (finalizeErr) {
                    console.error('[FINALIZE] Erro interno no processamento financeiro:', finalizeErr);
                }

                toastSuccess('MissÃ£o concluÃ­da com sucesso!');
                const grossEarnings = getGrossEarnings(activeMission);
                const netEarnings = getNetEarnings(activeMission);
                
                const rawType = activeMission.service_type || activeMission.type || 'generic';
                const type = normalizeServiceType(rawType);
                
                // CÃ¡lculo do breakdown do valor real
                const baseValue = Number(dynamicRates?.[`${type}_min`] || appSettings?.baseFee || 7);
                const distance = Number(activeMission.route_distance_km || 0);
                const kmRate = Number(dynamicRates?.[`${type}_km`] || 1);
                const extraKmValue = distance * kmRate;

                setFinishedMissionData({ 
                    show: true, 
                    amount: netEarnings,
                    grossAmount: grossEarnings,
                    baseValue: baseValue,
                    extraKmValue: extraKmValue,
                    distance: distance
                });
                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
                // Chamada nÃ£o bloqueante
                fetchMissionHistory();
            }  
            // 3. Se for CANCELAMENTO
            else if (['cancelado'].includes(newStatus)) {
                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
                toastSuccess('Pedido cancelado.');
            }
            // 4. Status intermediÃ¡rio (A caminho, etc)
            else {
                const updatedMission = { ...activeMission, status: newStatus };
                setActiveMission(updatedMission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(updatedMission));
                toastSuccess('Status atualizado!');
            }
        } catch (e: any) {
            console.error('[STATUS] Erro ao atualizar:', e);
            toastError('Erro ao atualizar status: ' + (e.message || 'Tente novamente.'));
            
            // Se o erro for que o pedido nÃ£o existe mais ou algo fatal, limpa a tela
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
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let token = supabaseKey;
            try {
                const ls = localStorage.getItem(`sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`);
                if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
            } catch(e) {}

            const res = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?driver_id=eq.${driverId}&status=in.(concluido,finalizado,entregue)&order=created_at.desc`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` }
            });

            if (!res.ok) throw new Error('Falha ao buscar histÃ³rico');
            const data = await res.json();

            if (data) {
                const formatted = data.map((o: any) => ({
                    ...o,
                    price: Number(o.total_price || 0),
                    type: o.service_type || 'package',
                    destination: o.delivery_address || o.destination || 'Destino ignorado',
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

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        let token = supabaseKey;
        try {
            const ls = localStorage.getItem(`sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`);
            if (ls) token = JSON.parse(ls)?.access_token || supabaseKey;
        } catch(e) {}

        const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` };

        try {
            // Timeout de 10 segundos para cada requisiÃ§Ã£o
            const fetchWithTimeout = (url: string) => 
                fetch(url, { headers, signal: AbortSignal.timeout(10000) });

            // Consulta de Carteira para Saldo e Extrato
            const txsRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/wallet_transactions_delivery?user_id=eq.${driverId}&order=created_at.desc`).catch(() => null);
            const txs = (txsRes && txsRes.ok) ? await txsRes.json() : null;

            // Busca InformaÃ§Ãµes do Motorista (Chave PIX no bank_info)
            const driverRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/drivers_delivery?id=eq.${driverId}&select=bank_info,name`).catch(() => null);
            const driverData = (driverRes && driverRes.ok) ? await driverRes.json() : null;
            
            if (driverData && driverData[0]) {
                const bankInfo = driverData[0].bank_info;
                // O bank_info Ã© um JSON que contÃ©m { pix_key: "..." }
                const savedPix = bankInfo?.pix_key || '';
                if (savedPix) {
                    setPixKey(savedPix);
                    localStorage.setItem('izi_driver_pix', savedPix);
                }
            }

            // Consulta de Pedidos para Ganhos Reais
            const ordersRes = await fetchWithTimeout(`${supabaseUrl}/rest/v1/orders_delivery?driver_id=eq.${driverId}&status=in.(concluido,entregue)`).catch(() => null);
            const orders = (ordersRes && ordersRes.ok) ? await ordersRes.json() : null;

            let balance = 0;
            if (txs) {
                balance = txs.reduce((acc, t) => 
                    ['deposito', 'reembolso', 'venda'].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount), 
                    0
                );
                
                setEarningsHistory(txs.filter(t => t.type !== 'saque') as any);
                setWithdrawHistory(txs.filter(t => t.type === 'saque'));
            }

            let todaySum = 0;
            let totalGanhos = 0;
            let missionCount = 0;

            if (orders) {
                const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);
                missionCount = orders.length;

                orders.forEach(o => {
                    const fee = getNetEarnings(o);
                    totalGanhos += fee;
                    if (new Date(o.created_at) >= startOfDay) {
                        todaySum += fee;
                    }
                });
            }

            setStats(prev => ({
                ...prev,
                balance: balance,
                today: todaySum,
                totalEarnings: totalGanhos,
                count: missionCount,
                level: Math.floor(missionCount / 10) + 1
            }));

            // Aproveitar e atualizar configuraÃ§Ãµes globais
            const { data: sets } = await fetchWithTimeout(`${supabaseUrl}/rest/v1/admin_settings_delivery?limit=1`).then(r => r?.ok ? r.json() : {ok: false}).catch(() => ({}));
            if (sets && sets[0]) {
                setAppSettings(sets[0]);
            }

        } catch (e) {
            console.error("[FINANCE] Fetch error:", e);
        } finally {
            setIsFinanceLoading(false);
        }
    };

    const handleWithdrawRequest = () => {
        if (isWithdrawLoading) return;
        
        // 1. Validar PIX
        if (!pixKey || pixKey.trim().length < 3) {
            toastError('Cadastre uma chave PIX vÃ¡lida antes de sacar.');
            setIsEditingPix(true);
            return;
        }

        // 2. Validar saldo
        if (stats.balance <= 0) {
            toastError('VocÃª nÃ£o possui saldo disponÃ­vel para saque.');
            return;
        }

        // 3. Validar Saque MÃ­nimo
        const minAmount = Number(appSettings?.minwithdrawalamount ?? 0);
        if (stats.balance < minAmount) {
            toastError(`O valor mÃ­nimo para saque Ã© de R$ ${minAmount.toFixed(2).replace('.', ',')}`);
            return;
        }

        // 4. Abrir modal de confirmaÃ§Ã£o
        setShowWithdrawModal(true);
    };

    const confirmWithdraw = async () => {
        if (isWithdrawLoading) return;
        
        console.log('>>> [WITHDRAW] Click Confirmar');
        setIsWithdrawLoading(true);
        
        try {
            console.log('>>> [WITHDRAW] Verificando dados...');
            
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            // 1. Obter ID do motorista (prioriza o que estÃ¡ no estado/localStorage)
            const uid = driverId || localStorage.getItem('izi_driver_uid');
            
            if (!uid) {
                throw new Error('IdentificaÃ§Ã£o do motorista ignorada (ID Vazio). Tente sair e entrar novamente.');
            }

            // 2. Obter Token (Manualmente para evitar travamentos do supabase-js)
            let token = supabaseKey;
            try {
                const lsKey = `sb-${(supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1])}-auth-token`;
                const ls = localStorage.getItem(lsKey);
                if (ls) {
                    const parsed = JSON.parse(ls);
                    token = parsed.access_token || token;
                }
            } catch(e) {
                console.warn('[WITHDRAW] Falha ao extrair token do LocalStorage');
            }

            console.log('>>> [WITHDRAW] Enviando requisiÃ§Ã£o para:', uid);

            // 3. Chamada REST com Timeout de 10s
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const feePercent = Number(appSettings?.withdrawalfeepercent ?? 0);
            const feeAmount = stats.balance * (feePercent / 100);

            const body = {
                user_id: uid,
                amount: stats.balance,
                type: 'saque',
                description: `Saque PIX: ${pixKey}${feeAmount > 0 ? ` (Taxa IZI: R$ ${feeAmount.toFixed(2)})` : ''}`,
                status: 'pendente'
            };

            const response = await fetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(body),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorDetail = await response.text();
                console.error('>>> [WITHDRAW] Erro API:', response.status, errorDetail);
                throw new Error(`Erro no servidor (${response.status}). Verifique seu saldo.`);
            }

            console.log('>>> [WITHDRAW] Pedido criado com sucesso!');

            // Sucesso - Feedback Visual
            setShowWithdrawModal(false);
            setTimeout(() => {
                setShowSuccessOverlay(true);
            }, 300);

            setTimeout(() => {
                setShowSuccessOverlay(false);
                fetchFinanceData();
            }, 4500);

        } catch (err: any) {
            console.error('>>> [WITHDRAW] FALHA CRÃTICA:', err);
            const msg = err.name === 'AbortError' 
                ? 'O servidor demorou muito para responder. Tente novamente.' 
                : (err.message || 'Erro desconhecido ao processar saque.');
            toastError(msg);
        } finally {
            console.log('>>> [WITHDRAW] Liberando travamento de UI');
            setIsWithdrawLoading(false);
        }
    };

    const handleSavePix = async (val?: string) => {

        const keyToSave = (val || pixKey).trim();
        if (!keyToSave) return toastError('Digite uma chave PIX vÃ¡lida');
        if (!driverId) return toastError('Entregador nÃ£o identificado');

        setIsSavingPix(true);
        try {
            console.log('[PIX_SAVE] Tentando salvar:', keyToSave);
            const { error } = await supabase
                .from('drivers_delivery')
                .update({ bank_info: { pix_key: keyToSave } })
                .eq('id', driverId);

            if (error) throw error;

            localStorage.setItem('izi_driver_pix', keyToSave);
            setPixKey(keyToSave);
            setIsEditingPix(false);
            toastSuccess('Chave PIX salva com sucesso!');
        } catch (e: any) {
            console.error('[PIX_SAVE] Error:', e);
            toastError("Erro ao salvar chave PIX: " + e.message);
        } finally {
            setIsSavingPix(false);
        }
    };

    const handleLogout = useCallback(async (reason = 'manual') => {
        const dId = driverId ? String(driverId).trim() : null;
        console.log(`[AUTH] handleLogout disparado. Motivo: ${reason}`);

        try {
            if (dId) {
                // Tenta avisar o banco que ficou offline
                supabase.from('drivers_delivery').update({ is_online: false }).eq('id', dId).then();
            }
        } catch (e) {
            console.error('[LOGOUT] Erro status:', e);
        }

        // Garante que o status online seja resetado NO STORAGE apenas em logout MANUAL
        localStorage.removeItem('Izi_online');

        // Limpa sessÃ£o completo
        clearDriverSessionState();

        try {
            await supabase.auth.signOut({ scope: 'local' });
        } catch (e) {
            console.error('[LOGOUT] Erro ao encerrar sessÃ£o:', e);
        } finally {
            console.log('[LOGOUT] Redirecionando...');
            window.location.href = '/';
        }
    }, [clearDriverSessionState, driverId]);




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
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setIsMenuOpen(false)} 
                        className="fixed inset-0 bg-slate-950/40 backdrop-blur-3xl z-[100]" 
                    />
                    <motion.div 
                        initial={{ x: '-100%' }} 
                        animate={{ x: 0 }} 
                        exit={{ x: '-100%' }} 
                        transition={{ type: 'spring', damping: 35, stiffness: 350 }} 
                        className="fixed top-0 left-0 bottom-0 w-[85%] max-w-[340px] bg-[#020617] border-r border-white/5 z-[101] flex flex-col p-8 overflow-y-auto no-scrollbar shadow-[20px_0_50px_rgba(0,0,0,0.8)]"
                    >
                        {/* Drawer Header - Clay Profile */}
                        <div className="clay-card p-6 mb-8 flex items-center gap-4 relative overflow-hidden group">
                            <div className="size-14 rounded-[20px] bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-[inset_2px_2px_4px_rgba(255,255,255,0.3),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]">
                                <Icon name="person" size={28} className="text-slate-900" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-base font-black text-white truncate italic tracking-tight">{driverName}</h3>
                                <div className="flex items-center gap-2 mt-1 bg-white/5 px-3 py-1 rounded-full border border-white/5 w-fit">
                                    <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-[8px] font-black text-white/40 uppercase tracking-widest">NÃ­vel {stats.level}</span>
                                </div>
                            </div>
                        </div>

                        {/* Balance Card - Clay Style */}
                        <div className="clay-card-dark p-6 mb-8 flex items-center justify-between border-white/[0.03]">
                            <div>
                                <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Saldo Izi</p>
                                <p className="text-2xl font-black text-white tracking-tighter font-mono italic">R$ {stats.balance.toFixed(2).replace('.', ',')}</p>
                            </div>
                            <div className="size-10 bg-primary/10 rounded-2xl flex items-center justify-center shadow-inner">
                                <Icon name="account_balance_wallet" size={20} className="text-primary" />
                            </div>
                        </div>

                        {/* Navigation Items */}
                        <nav className="flex-1 space-y-3">
                            <p className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] px-4 mb-4 italic">Menu do Piloto</p>
                            {[
                                { id: 'dashboard', label: 'Painel', icon: 'grid_view' },
                                { id: 'active_mission', label: 'MissÃ£o Ativa', icon: 'route', badge: activeMission ? 1 : 0 },
                                { id: 'dedicated', label: 'Vagas Dedicadas', icon: 'stars' },
                                { id: 'scheduled', label: 'Agendamentos', icon: 'event', badge: scheduledOrders.length },
                                { id: 'history', label: 'HistÃ³rico', icon: 'history' },
                                { id: 'earnings', label: 'Financeiro', icon: 'payments' },
                                { id: 'support', label: 'Suporte Izi', icon: 'support_agent', onClick: () => { window.open('https://wa.me/55...', '_blank'); setIsMenuOpen(false); } },
                                { id: 'profile', label: 'Meu Perfil', icon: 'person' }
                            ].map((item, i) => {
                                const isActive = activeTab === item.id;
                                return (
                                    <motion.button 
                                        key={item.id} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={item.onClick || (() => { 
                                            setActiveTab(item.id as any); 
                                            setIsMenuOpen(false); 
                                            if (item.id === 'active_mission') syncMissionWithDB();
                                        })} 
                                        className={`w-full flex items-center gap-4 px-5 py-4.5 rounded-[24px] transition-all text-left relative overflow-hidden ${
                                            isActive 
                                                ? 'bg-primary text-slate-900 font-black shadow-[inset_3px_3px_6px_rgba(255,255,255,0.4),8px_8px_16px_rgba(255,217,0,0.2)]' 
                                                : 'text-white/30 hover:bg-white/[0.03] border border-transparent hover:border-white/5'
                                        }`}
                                    >
                                        <div className="relative z-10">
                                            <Icon name={item.icon} size={20} className={isActive ? 'text-slate-900' : 'text-white/20'} />
                                            {item.badge > 0 && (
                                                <span className={`absolute -top-2 -right-2 size-5 ${item.id === 'active_mission' ? 'bg-emerald-500' : 'bg-blue-500'} text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#020617]`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[11px] font-black uppercase tracking-widest relative z-10 italic">{item.label}</span>
                                        {isActive && <motion.div layoutId="nav-glow" className="absolute left-1 top-1 bottom-1 w-1 bg-white/40 rounded-full" />}
                                    </motion.button>
                                );
                            })}
                        </nav>

                        {/* Footer - Status & Logout */}
                        <div className="pt-8 border-t border-white/5 space-y-6 mt-8">
                            <div className="flex items-center justify-between px-4">
                                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Status</span>
                                <button 
                                    onClick={handleToggleOnline} 
                                    className={`h-9 w-16 rounded-[20px] relative transition-all duration-700 shadow-inner ${
                                        isOnline ? 'bg-emerald-500/20 border border-emerald-500/20' : 'bg-white/5 border border-white/5'
                                    }`}
                                >
                                    <motion.div 
                                        animate={{ x: isOnline ? 32 : 4 }} 
                                        className={`absolute top-1 size-7 rounded-[14px] flex items-center justify-center shadow-lg transition-colors ${
                                            isOnline ? 'bg-emerald-400' : 'bg-white/10'
                                        }`}
                                    >
                                        <div className={`size-1.5 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-white/5'}`} />
                                    </motion.div>
                                </button>
                            </div>
                            <button 
                                onClick={handleLogout} 
                                className="w-full py-5 border border-red-500/10 text-red-500/40 rounded-[28px] text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-500/5 transition-all active:scale-95 shadow-inner"
                            >
                                Encerrar SessÃ£o
                            </button>
                            <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.6em] text-center italic">Izi Delivery v3.4</p>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );


    const renderDashboard = () => (
        <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="px-6 space-y-10 pb-32 pt-6"
        >
            {/* Header / Identity Card - Pure Claymorphism */}
            <div className="clay-card p-7 space-y-6 relative overflow-hidden group">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                    <Icon name="person" size={120} />
                </div>
                
                <div className="flex items-center gap-5 relative z-10">
                    <div className="size-16 rounded-[22px] bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-[inset_2px_2px_5px_rgba(255,255,255,0.4),inset_-2px_-2px_5px_rgba(0,0,0,0.2)]">
                        <Icon name="person" size={32} className="text-slate-900 font-black" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mb-1">Piloto Parceiro Izi</p>
                        <h3 className="text-2xl font-black text-white tracking-tight italic">{driverName}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">Verificado</span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 relative z-10">
                    <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5 shadow-inner">
                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">NÃ­vel {stats.level}</p>
                        <p className="text-sm font-black text-white uppercase italic">{stats.level >= 10 ? 'Comandante' : stats.level >= 5 ? 'Veterano' : 'Soldado'}</p>
                        <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${(stats.xp / stats.nextXp) * 100}%` }} 
                                className="h-full bg-primary" 
                            />
                        </div>
                    </div>
                    <div className="bg-white/[0.03] rounded-3xl p-4 border border-white/5 shadow-inner flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Hoje</p>
                            <p className="text-base font-black text-white font-mono">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon name="payments" size={16} className="text-primary" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Vagas Dedicadas - Lista Compacta */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon name="stars" className="text-primary text-sm font-black" />
                        </div>
                        <h2 className="text-base font-black text-white uppercase tracking-widest italic">Vagas Dedicadas</h2>
                        {dedicatedSlots.length > 0 && (
                            <span className="size-6 bg-primary text-slate-900 text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-lg shadow-primary/20">
                                {dedicatedSlots.length}
                            </span>
                        )}
                    </div>
                    {dedicatedSlots.length > 0 && (
                        <button onClick={() => setActiveTab('dedicated')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver todas</button>
                    )}
                </div>

                {dedicatedSlots.length === 0 ? (
                    <div className="clay-card p-10 flex flex-col items-center text-center gap-4 bg-white/[0.02]">
                        <div className="size-16 rounded-[24px] bg-white/5 flex items-center justify-center text-white/10 shadow-inner">
                            <Icon name="stars" size={32} />
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-white/30 uppercase tracking-widest">Nenhuma vaga ativa</p>
                            <p className="text-[10px] text-white/15 mt-1 max-w-[180px]">Estamos buscando parcerias exclusivas para vocÃª agora mesmo.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dedicatedSlots.slice(0, 3).map((slot: any) => {
                            const hasApplied = myApplications.some(app => app.slot_id === slot.id);
                            const application = myApplications.find(app => app.slot_id === slot.id);
                            return (
                                <motion.button
                                    key={slot.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => { setSelectedSlot(slot); setActiveTab('dedicated'); }}
                                    className="w-full text-left flex items-center gap-4 p-4 rounded-3xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03] transition-all group"
                                >
                                    <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                                        {slot.admin_users?.store_logo
                                            ? <img src={slot.admin_users.store_logo} className="w-full h-full object-contain" alt="" />
                                            : <Icon name="stars" size={22} className="text-primary" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest truncate">{slot.admin_users?.store_name || 'Loja Parceira'}</p>
                                        <p className="text-sm font-black text-white truncate leading-tight mt-0.5">{slot.title}</p>
                                        <p className="text-[10px] text-white/30 mt-0.5">{slot.working_hours || 'HorÃ¡rio a combinar'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-lg font-black text-primary">R$ {parseFloat(slot.fee_per_day || 0).toFixed(0)}</p>
                                        <p className="text-[8px] text-white/20 uppercase tracking-widest">/dia</p>
                                        {hasApplied && (
                                            <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block ${application?.status === 'accepted' ? 'text-emerald-400' : 'text-primary/60'}`}>
                                                {application?.status === 'accepted' ? 'âœ“ Aprovado' : 'â³ Em anÃ¡lise'}
                                            </span>
                                        )}
                                    </div>
                                    <Icon name="chevron_right" size={16} className="text-white/20 group-hover:text-primary/50 transition-colors shrink-0" />
                                </motion.button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Agendamentos - Secao Clay Premium */}
            <div className="space-y-5">
                <div className="flex items-center gap-3 px-2">
                    <div className="size-8 rounded-xl bg-blue-500/10 flex items-center justify-center">
                        <Icon name="event" className="text-blue-400 text-sm font-black" />
                    </div>
                    <h2 className="text-base font-black text-white uppercase tracking-widest italic">Agendamentos</h2>
                    {scheduledOrders.length > 0 && (
                        <span className="size-6 bg-blue-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20">
                            {scheduledOrders.length}
                        </span>
                    )}
                </div>

                {scheduledOrders.length === 0 ? (
                    <div className="clay-card-dark p-12 flex flex-col items-center justify-center gap-4 border-dashed border-white/5">
                        <Icon name="event_available" size={32} className="text-white/5" />
                        <p className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em]">Sem entregas futuras</p>
                    </div>
                ) : (
                    <div className="space-y-4 px-1">
                        {scheduledOrders.map((order: any) => {
                            const dt = new Date(order.scheduled_at);
                            const isAccepted = order.driver_id === driverId;
                            return (
                                <motion.div
                                    key={order.id}
                                    whileTap={{ scale: 0.98 }}
                                    className="clay-card-dark p-6 space-y-5 relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-6 opacity-[0.02] pointer-events-none group-hover:scale-125 transition-transform duration-700">
                                        <Icon name="event" size={80} />
                                    </div>

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2 bg-blue-500/10 w-fit px-3 py-1 rounded-full border border-blue-500/20">
                                                <Icon name="schedule" className="text-blue-400 text-[10px]" />
                                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                                                    {dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} Ã s {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                            <p className="text-base font-black text-white truncate italic tracking-tight">{order.delivery_address?.split(',')[0]}</p>
                                            <p className="text-[10px] font-bold text-white/30 truncate mt-1 flex items-center gap-2">
                                                <Icon name="location_on" size={12} className="text-primary/40" />
                                                {order.pickup_address?.split(',')[0]}
                                            </p>
                                        </div>
                                        <div className="text-right ml-4">
                                            <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-1">Ganho</p>
                                            <p className="text-xl font-black text-white italic tracking-tighter">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between relative z-10 pt-2">
                                        {isAccepted ? (
                                            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-2xl border border-emerald-400/20">
                                                <Icon name="verified" size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Confirmado</span>
                                            </div>
                                        ) : (
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
                                                className="w-full h-12 bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
                                            >
                                                <Icon name="check_circle" size={16} />
                                                Aceitar Agendamento
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Categorias e Chamadas */}
            <div className="space-y-6 pt-6">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                        <div className={`size-3 rounded-full ${isOnline ? 'bg-primary animate-ping' : 'bg-white/10'}`} />
                        {isOnline ? 'Painel de Chamadas' : 'Sistema Offline'}
                    </h2>
                    <div className="flex items-center gap-3">
                        <button onClick={handleManualSync} disabled={isSyncing} className="size-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-inner">
                            <Icon name="radar" size={18} className={`text-primary ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Categories Flow */}
                <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
                    {[
                        { id: 'all', label: 'Todos', icon: 'grid_view', color: 'bg-primary' },
                        { id: 'motoboy', label: 'Entregas', icon: 'package_2', color: 'bg-emerald-400' },
                        { id: 'car_ride', label: 'Viagens', icon: 'directions_car', color: 'bg-blue-400' },
                        { id: 'frete', label: 'Fretes', icon: 'local_shipping', color: 'bg-orange-400' },
                    ].map(item => {
                        const isActive = filter === item.id;
                        return (
                            <button 
                                key={item.id} 
                                onClick={() => setFilter(item.id as any)} 
                                className={`flex flex-col items-center gap-3 p-5 rounded-[28px] min-w-[100px] transition-all shrink-0 border relative overflow-hidden ${
                                    isActive 
                                        ? 'clay-card bg-primary text-slate-950 scale-105 z-10' 
                                        : 'bg-white/[0.03] border-white/5 text-white/40'
                                }`}
                            >
                                <div className={`size-12 rounded-2xl flex items-center justify-center shadow-inner ${isActive ? 'bg-black/10' : 'bg-white/5'}`}>
                                    <Icon name={item.icon} size={24} className={isActive ? 'text-slate-950' : ''} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {!isOnline ? (
                    <div className="clay-card p-16 flex flex-col items-center gap-6 text-center border-dashed border-white/10">
                        <div className="size-20 rounded-[30px] bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
                            <Icon name="power_off" size={40} className="text-red-400/40" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-base font-black text-white/30 uppercase tracking-[0.3em]">Scanner Desativado</h3>
                            <p className="text-xs text-white/15 font-bold">Fique online para comeÃ§ar a receber chamadas em tempo real.</p>
                        </div>
                        <button 
                            onClick={handleToggleOnline} 
                            className="w-full py-5 bg-primary text-slate-900 font-black rounded-3xl text-sm uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                        >
                            Ficar Online Agora
                        </button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="clay-card-dark p-16 flex flex-col items-center gap-4 text-center">
                        <div className="size-20 rounded-[35px] bg-primary/5 flex items-center justify-center relative">
                            <div className="absolute inset-0 bg-primary/20 rounded-[35px] animate-ping opacity-20" />
                            <Icon name="radar" size={40} className="text-primary/40" />
                        </div>
                        <p className="text-[11px] font-black text-white/20 uppercase tracking-[0.5em] italic">Rastreando novas rotas...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {filteredOrders.map((order: any, i: number) => {
                            const service = getServicePresentation(order);
                            return (
                                <motion.div 
                                    key={order.id} 
                                    initial={{ opacity: 0, scale: 0.9 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    transition={{ delay: i * 0.1 }} 
                                    className="clay-card p-8 space-y-7 relative overflow-hidden group"
                                >
                                    {/* Glass Decor background */}
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                                        <Icon name={service.details.icon} size={150} />
                                    </div>

                                    <div className="flex items-start justify-between relative z-10">
                                        <div className="flex items-center gap-5">
                                            <div className={`size-16 rounded-[24px] ${service.details.bg} ${service.details.color} flex items-center justify-center shadow-inner border border-white/10`}>
                                                <Icon name={service.details.icon} size={32} />
                                            </div>
                                            <div className="space-y-1">
                                                <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${service.details.color}`}>{service.details.label}</p>
                                                <h3 className="text-lg font-black text-white italic tracking-tight">{service.headline}</h3>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Ganho Net</p>
                                            <p className="text-3xl font-black text-white italic tracking-tighter">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>

                                    {/* Rota */}
                                    <div className="bg-black/40 rounded-[32px] p-6 border border-white/5 space-y-4 relative z-10 shadow-inner">
                                        <div className="flex items-start gap-4">
                                            <div className="size-2 rounded-full bg-white/20 mt-1.5 shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{service.pickupLabel}</p>
                                                <p className="text-xs font-bold text-white/70 truncate">{service.pickupText || order.origin}</p>
                                            </div>
                                        </div>
                                        <div className="ml-1 w-px h-6 bg-white/10 border-dashed border-l" />
                                        <div className="flex items-start gap-4">
                                            <div className="size-2 rounded-full bg-primary mt-1.5 shadow-[0_0_8px_rgba(255,217,0,0.6)]" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">{service.destinationLabel}</p>
                                                <p className="text-xs font-black text-white truncate">{service.destinationText || order.destination}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 relative z-10 pt-2">
                                        <button 
                                            onClick={() => handleAccept(order)} 
                                            disabled={isAccepting} 
                                            className="flex-[3] h-16 bg-primary text-slate-900 font-black text-xs uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <Icon name="check" size={20} />
                                            {service.ctaLabel}
                                        </button>
                                        <button 
                                            onClick={() => handleDecline(order)} 
                                            className="flex-1 h-16 bg-white/5 border border-white/5 text-red-500/60 rounded-[24px] flex items-center justify-center active:scale-95 transition-all shadow-inner"
                                        >
                                            <Icon name="close" size={20} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    );


    const renderHistoryView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">HistÃ³rico</p><h2 className="text-3xl font-black text-white tracking-tight mt-1">MissÃµes ConcluÃ­das</h2></div>
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
                            <motion.div onClick={() => setSelectedHistoryOrder(order)} key={order.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="clay-card rounded-[24px] p-5 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all">
                                <div className={`size-12 rounded-[18px] ${details.bg} ${details.color} flex items-center justify-center border border-current/10 shrink-0 shadow-[inset_2px_2px_4px_rgba(255,255,255,0.1),inset_-2px_-2px_4px_rgba(0,0,0,0.2)]`}><Icon name={details.icon} className="text-2xl" /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-white truncate">{order.destination?.split(',')[0] || 'Destino ignorado'}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[8px] font-black text-white/30 uppercase">{formattedDate} Ã s {formattedTime}</span>
                                        <div className="size-1 rounded-full bg-emerald-400/30" />
                                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">ConcluÃ­da</span>
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

            <AnimatePresence>
                {selectedHistoryOrder && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={() => setSelectedHistoryOrder(null)}
                        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-[8px] flex items-center justify-center p-5 cursor-pointer"
                    >
                       <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.9, opacity: 0, y: 20 }} 
                            onClick={e => e.stopPropagation()}
                            className="clay-card-dark p-7 w-full max-w-sm space-y-6 relative overflow-hidden cursor-default"
                        >
                           <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                               <Icon name={getTypeDetails(selectedHistoryOrder.type).icon} className="text-[140px] text-white -rotate-12" />
                           </div>
                           
                           <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHistoryOrder(null);
                                }} 
                                className="absolute top-6 right-6 text-white/40 hover:text-white hover:bg-white/10 bg-white/5 size-10 rounded-2xl flex items-center justify-center active:scale-90 transition-all z-20"
                            >
                                <Icon name="close" size={20} />
                            </button>
                           
                           <div className="relative">
                               <p className="text-[9px] font-black text-primary uppercase tracking-[0.4em]">Recibo da MissÃ£o</p>
                               <h3 className="text-2xl font-black text-white mt-1">#{selectedHistoryOrder.displayId || selectedHistoryOrder.id?.slice(0,8)}</h3>
                               <p className="text-xs font-bold text-white/40 mt-1">{new Date(selectedHistoryOrder.created_at).toLocaleDateString('pt-BR')} Ã s {new Date(selectedHistoryOrder.created_at).toLocaleTimeString('pt-BR')}</p>
                           </div>

                           <div className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-[24px] relative">
                               <div>
                                   <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1 shadow-sm">Local de Coleta</p>
                                   <p className="text-sm text-white font-semibold leading-relaxed">{selectedHistoryOrder.pickup_address || 'Ponto Inicial Omitido'}</p>
                               </div>
                               <div className="h-px bg-white/5" />
                               <div>
                                   <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1 shadow-sm">Destino do Cliente</p>
                                   <p className="text-sm text-white font-semibold leading-relaxed">{selectedHistoryOrder.destination || selectedHistoryOrder.delivery_address || 'Destino Omitido'}</p>
                               </div>
                           </div>

                           <div className="grid grid-cols-2 gap-3">
                               <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.02)]">
                                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">DistÃ¢ncia Percorrida</p>
                                   <div className="flex items-center gap-2">
                                       <Icon name="route" size={14} className="text-primary" />
                                       <span className="text-sm font-bold text-white">{selectedHistoryOrder.distance || '---'}</span>
                                   </div>
                               </div>
                               <div className="bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-3 shadow-[inset_1px_1px_4px_rgba(255,255,255,0.02)]">
                                   <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Meio de Pagamento</p>
                                   <div className="flex items-center gap-2">
                                       <Icon name={selectedHistoryOrder.payment_method === 'dinheiro' ? 'payments' : 'account_balance_wallet'} size={14} className="text-primary" />
                                       <span className="text-sm font-bold text-white capitalize">{selectedHistoryOrder.payment_method?.replace('_', ' ') || '---'}</span>
                                   </div>
                               </div>
                           </div>
                           
                           <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 space-y-4 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.02),inset_-2px_-2px_8px_rgba(0,0,0,0.2)]">
                               {(() => {
                                   const rawType = selectedHistoryOrder.service_type || selectedHistoryOrder.type || 'generic';
                                   const type = normalizeServiceType(rawType);
                                   const baseFee = Number(dynamicRates?.[`${type}_min`] || appSettings?.baseFee || 7);
                                   const distance = Number(selectedHistoryOrder.route_distance_km || selectedHistoryOrder.distance?.replace(' km','') || 0);
                                   const kmRate = Number(dynamicRates?.[`${type}_km`] || 1);
                                   const extraKm = distance * kmRate;
                                   const totalGross = getGrossEarnings(selectedHistoryOrder);
                                   
                                   return (
                                       <>
                                           <div className="flex justify-between items-center text-xs">
                                               <div className="flex items-center gap-2">
                                                   <div className="size-1.5 rounded-full bg-white/20" />
                                                   <span className="font-bold text-white/40 uppercase tracking-widest">Valor Base</span>
                                               </div>
                                               <span className="font-black text-white/80">R$ {baseFee.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                           </div>
                                           <div className="flex justify-between items-center text-xs">
                                               <div className="flex items-center gap-2">
                                                   <div className="size-1.5 rounded-full bg-emerald-500/20" />
                                                   <span className="font-bold text-white/40 uppercase tracking-widest">Adicional Km</span>
                                               </div>
                                               <span className="font-black text-emerald-400">R$ {extraKm.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                           </div>
                                           <div className="h-px bg-white/5 my-2" />
                                           <div className="flex justify-between items-center">
                                               <div className="flex items-center gap-2">
                                                   <div className="size-2 rounded-full bg-primary" />
                                                   <span className="font-black text-white uppercase tracking-[0.2em] text-[10px]">Valor Real da Corrida</span>
                                               </div>
                                               <span className="text-xl font-black text-white italic">R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                           </div>
                                           <div className="flex justify-between items-center pt-2 border-t border-white/5 mt-2">
                                               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Seu Ganho LÃ­quido</span>
                                               <span className="text-sm font-black text-primary italic">R$ {getNetEarnings(selectedHistoryOrder).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                           </div>
                                       </>
                                   );
                               })()}
                           </div>

                       </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );

    const renderEarningsView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-24 pt-4">
            <div className="flex items-center justify-between">
                <div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em] shadow-primary/20">Financeiro</p><h2 className="text-3xl font-black text-white tracking-tight mt-1">Rendimentos</h2></div>
                <button onClick={fetchFinanceData} disabled={isFinanceLoading} className="size-12 bg-slate-800 shadow-[inset_0_-4px_10px_rgba(0,0,0,0.4),_inset_0_4px_10px_rgba(255,255,255,0.05),_0_10px_20px_rgba(0,0,0,0.4)] border border-white/5 rounded-[20px] flex items-center justify-center active:rotate-180 transition-all duration-500">
                    <Icon name="refresh" className={`text-white/40 ${isFinanceLoading ? 'animate-spin text-primary' : ''}`} />
                </button>
            </div>
            
            <div className="bg-[#151c2c] border border-white/5 rounded-[40px] p-8 relative overflow-hidden shadow-[inset_0_-8px_24px_rgba(0,0,0,0.4),_inset_0_4px_12px_rgba(255,255,255,0.03),_0_20px_40px_rgba(0,0,0,0.8)]">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Icon name="account_balance_wallet" className="text-[140px] text-primary -rotate-12" /></div>
                
                <div className="relative z-10">
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em] mb-1">Saldo DisponÃ­vel</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-primary opacity-50">R$</span>
                        <p className="text-5xl font-black text-white tracking-tighter drop-shadow-lg">{stats.balance.toFixed(2).replace('.', ',')}</p>
                    </div>
                </div>

                <div className="flex gap-4 mt-8 relative z-10">
                    <button 
                        onClick={handleWithdrawRequest}
                        disabled={isWithdrawLoading}
                        className="flex-1 bg-primary text-slate-900 font-black rounded-3xl text-[11px] uppercase tracking-widest shadow-[inset_0_-4px_12px_rgba(0,0,0,0.3),_inset_0_4px_10px_rgba(255,255,255,0.6),_0_10px_25px_rgba(20,184,166,0.3)] active:scale-95 active:shadow-none transition-all py-5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale"
                    >
                        <Icon name="payments" className="text-xl opacity-80" />
                        {isWithdrawLoading ? 'Processando...' : 'Sacar via PIX'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {[{ label: 'Hoje', value: `R$ ${stats.today.toFixed(0)}`, icon: 'today', color: 'text-primary' }, { label: 'Total Ganhos', value: `R$ ${stats.totalEarnings.toFixed(0)}`, icon: 'account_balance', color: 'text-emerald-400' }, { label: 'Corridas', value: stats.count.toString(), icon: 'route', color: 'text-blue-400' }, { label: 'NÃ­vel', value: stats.level.toString(), icon: 'military_tech', color: 'text-yellow-400' }].map((stat, i) => (
                    <div key={i} className="bg-[#151c2c] border border-white/5 rounded-[32px] p-6 flex flex-col justify-between shadow-[inset_0_-4px_12px_rgba(0,0,0,0.3),_inset_0_2px_8px_rgba(255,255,255,0.03),_0_12px_24px_rgba(0,0,0,0.5)]">
                        <div className={`size-10 rounded-2xl bg-slate-900 shadow-[inset_0_-2px_6px_rgba(0,0,0,0.5),_inset_0_2px_4px_rgba(255,255,255,0.05)] flex items-center justify-center border border-white/5 mb-4`}>
                            <Icon name={stat.icon} className={`${stat.color} text-lg drop-shadow-md`} />
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className="text-2xl font-black text-white drop-shadow-md tracking-tight">{stat.value}</p>
                        </div>
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
                    {[...earningsHistory.slice(0, 5), ...withdrawHistory.slice(0, 5)]
                        .sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        .map((item: any, i: number) => {
                            const isWithdraw = item.type === 'saque';
                            const isRefund = item.type === 'reembolso';
                            const isDeposit = item.type === 'deposito' || item.type === 'venda';
                            
                            return (
                                <div key={i} className="flex items-center justify-between pb-4 border-b border-white/5 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-xl flex items-center justify-center ${isWithdraw ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            <Icon name={isWithdraw ? 'arrow_outward' : 'add_circle'} size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">{isWithdraw ? 'Saque' : (item.description || 'DepÃ³sito')}</p>
                                            <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{new Date(item.created_at).toLocaleDateString('pt-BR')}  {new Date(item.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-black ${isWithdraw ? 'text-red-400' : 'text-emerald-400'}`}>
                                            {isWithdraw ? '-' : '+'} R$ {(Number(item.amount) || 0).toFixed(2)}
                                        </p>
                                        <p className={`text-[7px] font-black uppercase tracking-widest ${item.status === 'concluido' ? 'text-emerald-400' : 'text-yellow-400'}`}>{item.status}</p>
                                    </div>
                                </div>
                            );
                        })
                    }
                    {earningsHistory.length === 0 && withdrawHistory.length === 0 && (
                        <p className="text-[10px] text-white/20 text-center py-4">Nenhuma transaÃ§Ã£o registrada</p>
                    )}
                </div>
            </div>

            {/* GestÃ£o de Chave PIX */}
            <div className="bg-[#151c2c] border border-white/5 rounded-[32px] p-6 space-y-4 shadow-[inset_0_-4px_12px_rgba(0,0,0,0.3),_0_10px_20px_rgba(0,0,0,0.4)]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                            <Icon name="account_balance" className="text-lg" />
                        </div>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Chave PIX para Saque</p>
                    </div>
                    {pixKey && !isEditingPix && (
                        <button 
                            onClick={() => setIsEditingPix(true)}
                            className="text-[9px] font-black text-primary uppercase tracking-widest"
                        >Alterar</button>
                    )}
                </div>

                {(!pixKey || isEditingPix) ? (
                    <div className="space-y-4">
                        <p className="text-[10px] text-white/30 leading-relaxed">
                            {pixKey ? 'Informe a nova chave para atualizar seu cadastro.' : 'Cadastre sua chave PIX para habilitar os saques de seus rendimentos.'}
                        </p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="CPF, E-mail ou Telefone"
                                id="pix_input_main"
                                defaultValue={pixKey}
                                className="flex-1 bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-primary outline-none transition-all"
                            />
                            <button 
                                onClick={() => {
                                    const input = document.getElementById('pix_input_main') as HTMLInputElement;
                                    handleSavePix(input.value);
                                }}
                                disabled={isSavingPix}
                                className="bg-primary text-slate-900 px-6 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {isSavingPix ? '...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-slate-900/40 rounded-2xl p-4 border border-white/5 flex items-center justify-between">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Chave Atual</span>
                            <p className="text-sm font-black text-white tracking-widest">{pixKey}</p>
                        </div>
                        <Icon name="check_circle" className="text-emerald-500 text-xl opacity-50" />
                    </div>
                )}
            </div>
        </motion.div>
    );

    const renderScheduledView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div>
                <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.5em]">CalendÃ¡rio</p>
                <h2 className="text-3xl font-black text-white tracking-tight mt-1">Agendamentos</h2>
                <p className="text-xs text-white/30 mt-1">Pedidos agendados disponÃ­veis e aceitos.</p>
            </div>

            {scheduledOrders.length === 0 ? (
                <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-4 text-center">
                    <Icon name="event_available" className="text-4xl text-white/10" />
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhum agendamento disponÃ­vel</p>
                    <p className="text-[10px] text-white/10 mt-1">Novos agendamentos aparecem aqui em tempo real</p>
                </div>
            ) : scheduledOrders.map((order: any, i: number) => {
                const dt = new Date(order.scheduled_at);
                const isPending = order.status === 'pendente' ||  order.status === 'agendado';
                const isAccepted = order.driver_id === driverId;
                const isMyAccepted = isAccepted;
                const statusColor = isMyAccepted ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : isPending ? 'text-blue-400 bg-blue-400/10 border-blue-400/20' : 'text-white/40 bg-white/5 border-white/10';
                const statusLabel = isMyAccepted ? 'âœ“ Aceito por vocÃª' : isPending ? 'DisponÃ­vel' : order.status;
                const isToday = dt.toDateString() === new Date().toDateString();
                const isTomorrow = dt.toDateString() === new Date(Date.now() + 86400000).toDateString();
                const dateLabel = isToday ? 'Hoje' : isTomorrow ? 'AmanhÃ£' : dt.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });

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

                        {/* EndereÃ§os */}
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
                            <span className="text-lg font-black text-primary">R$ {getNetEarnings(order).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                                <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">VocÃª aceitou esta corrida</span>
                            </div>
                        )}
                    </motion.div>
                );
            })}
        </motion.div>
    );

    const renderDedicatedView = () => {
        // Se nenhum slot selecionado: mostra lista de vagas
        if (!selectedSlot) {
            return (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
                    <div>
                        <p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Exclusivo</p>
                        <h2 className="text-3xl font-black text-white tracking-tight mt-1">Vagas Dedicadas</h2>
                        <p className="text-xs text-white/30 mt-1">Seja piloto exclusivo de um parceiro Izi.</p>
                    </div>
                    {dedicatedSlots.length === 0 ? (
                        <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[32px] flex flex-col items-center gap-4 text-center">
                            <Icon name="sentiment_dissatisfied" className="text-4xl text-white/10" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhuma vaga disponÃ­vel</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {dedicatedSlots.map((slot: any, i: number) => {
                                const hasApplied = myApplications.some(app => app.slot_id === slot.id);
                                const application = myApplications.find(app => app.slot_id === slot.id);
                                return (
                                    <motion.button
                                        key={slot.id}
                                        whileTap={{ scale: 0.97 }}
                                        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                                        onClick={() => setSelectedSlot(slot)}
                                        className="w-full text-left flex items-center gap-4 p-5 rounded-3xl border border-white/[0.06] bg-white/[0.02] hover:border-primary/20 hover:bg-primary/[0.03] transition-all group"
                                    >
                                        <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                                            {slot.admin_users?.store_logo
                                                ? <img src={slot.admin_users.store_logo} className="w-full h-full object-contain" alt="" />
                                                : <Icon name="stars" size={26} className="text-primary" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[9px] font-black text-primary/70 uppercase tracking-widest">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>
                                            <p className="text-base font-black text-white truncate">{slot.title}</p>
                                            <p className="text-[10px] text-white/30 mt-0.5">{slot.working_hours || 'HorÃ¡rio a combinar'}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xl font-black text-primary">R$ {parseFloat(slot.fee_per_day || 0).toFixed(0)}</p>
                                            <p className="text-[8px] text-white/20 uppercase tracking-widest">/dia</p>
                                            {hasApplied && (
                                                <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block ${application?.status === 'accepted' ? 'text-emerald-400' : 'text-primary/60'}`}>
                                                    {application?.status === 'accepted' ? 'âœ“ Aprovado' : 'â³ AnÃ¡lise'}
                                                </span>
                                            )}
                                        </div>
                                        <Icon name="chevron_right" size={16} className="text-white/20 group-hover:text-primary/50 transition-colors shrink-0" />
                                    </motion.button>
                                );
                            })}
                        </div>
                    )}
                </motion.div>
            );
        }

        // =========== TELA DE DETALHES DA VAGA ===========
        const slot = selectedSlot;
        const customBenefits: any[] = slot.metadata?.custom_benefits || [];
        const neighborhoodExtras: any[] = slot.metadata?.neighborhood_extras || [];
        const requirements: any[] = slot.metadata?.requirements || [
            { label: 'CNH Categoria A Definitiva', detail: 'DocumentaÃ§Ã£o em dia Ã© obrigatÃ³ria' },
            { label: 'BaÃº ou Mochila TÃ©rmica', detail: 'Equipamento prÃ³prio para entregas' },
        ];
        const hasApplied = myApplications.some(app => app.slot_id === slot.id);
        const application = myApplications.find(app => app.slot_id === slot.id);

        // â”€â”€ Estilos Clay â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const sClayDark: React.CSSProperties = {
            background: '#1A1A1A',
            borderRadius: '2.5rem',
            boxShadow: '8px 8px 16px rgba(0,0,0,0.4), inset 4px 4px 8px rgba(255,255,255,0.05), inset -4px -4px 8px rgba(0,0,0,0.5)',
        };
        const sClayYellow: React.CSSProperties = {
            background: '#FFD700',
            borderRadius: '2.5rem',
            boxShadow: '0 10px 25px rgba(255,215,0,0.3), inset 6px 6px 12px rgba(255,255,255,0.6), inset -6px -6px 12px rgba(0,0,0,0.2)',
        };
        const sClayIcon: React.CSSProperties = {
            background: '#1A1A1A',
            boxShadow: '4px 4px 8px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.05), inset -2px -2px 4px rgba(0,0,0,0.4)',
        };

        return (
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="pb-32" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", backgroundColor: '#000', color: '#fff', minHeight: '100vh' }}>

                {/* â”€â”€ Header fixo â”€â”€ */}
                <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }} className="flex items-center px-6 h-16">
                    <button
                        onClick={() => setSelectedSlot(null)}
                        className="active:scale-90 transition-transform flex items-center justify-center w-10 h-10 rounded-full"
                        style={sClayIcon}
                    >
                        <Icon name="arrow_back" size={20} className="text-primary" />
                    </button>
                    <h1 className="ml-4 text-lg font-bold tracking-tight text-white">Detalhes da Vaga</h1>
                </div>

                {/* â”€â”€ ConteÃºdo principal â”€â”€ */}
                <div className="pt-6 pb-12 space-y-10">

                    {/* Profile Header */}
                    <section className="flex flex-col items-center text-center space-y-4 px-6">
                        <div className="relative">
                            <div className="w-28 h-28 p-1.5 flex items-center justify-center overflow-hidden" style={{ ...sClayDark, borderRadius: '9999px' }}>
                                {slot.admin_users?.store_logo
                                    ? <img src={slot.admin_users.store_logo} className="w-full h-full rounded-full object-cover grayscale brightness-110" alt="Logo" />
                                    : <Icon name="stars" size={44} className="text-primary" />}
                            </div>
                            <div
                                className="absolute -bottom-1 -right-1 w-8 h-8 flex items-center justify-center text-black"
                                style={{ ...sClayYellow, borderRadius: '9999px' }}
                            >
                                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1", fontSize: '18px' }}>verified</span>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight text-white">{slot.admin_users?.store_name || 'Parceiro Izi'}</h2>
                            <p className="font-bold tracking-widest uppercase mt-1 opacity-90" style={{ color: '#FFD700', fontSize: '10px' }}>{slot.title}</p>
                        </div>
                    </section>

                    {/* Main Financial Card */}
                    <div className="px-6">
                        <div className="p-8 text-black relative overflow-hidden" style={sClayYellow}>
                            <div className="relative z-10">
                                <p className="font-black uppercase opacity-60" style={{ fontSize: '10px', letterSpacing: '0.2em' }}>Ganho Garantido</p>
                                <div className="flex items-baseline gap-1 mt-1">
                                    <span className="text-xl font-bold">R$</span>
                                    <span className="text-6xl font-black tracking-tighter">{parseFloat(slot.fee_per_day || 0).toFixed(0)}</span>
                                    <span className="text-lg font-bold opacity-80">/diÃ¡ria</span>
                                </div>
                            </div>
                            <span className="material-symbols-outlined absolute -right-6 -bottom-6 opacity-10 pointer-events-none" style={{ fontSize: '120px', fontVariationSettings: "'FILL' 1" }}>payments</span>
                        </div>
                    </div>

                    {/* Turno e Meta Extra */}
                    <div className="grid grid-cols-2 gap-4 px-6">
                        {/* Turno */}
                        <div className="p-6 flex flex-col items-center text-center" style={sClayDark}>
                            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={sClayIcon}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>schedule</span>
                            </div>
                            <p className="font-bold uppercase mb-1" style={{ fontSize: '10px', color: '#A0A0A0', letterSpacing: '0.1em' }}>Turno</p>
                            <p className="text-lg font-extrabold text-white">{slot.working_hours || 'A combinar'}</p>
                        </div>
                        {/* Meta Extra ou Local */}
                        {slot.metadata?.base_deliveries && slot.metadata?.fee_per_extra_delivery ? (
                            <div className="p-6 flex flex-col items-center text-center" style={sClayDark}>
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={sClayIcon}>
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px', fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
                                </div>
                                <p className="font-bold uppercase mb-1" style={{ fontSize: '10px', color: '#A0A0A0', letterSpacing: '0.1em' }}>Meta Extra</p>
                                <p className="text-lg font-extrabold" style={{ color: '#FFD700' }}>R$ {parseFloat(slot.metadata.fee_per_extra_delivery).toFixed(2)}</p>
                                <p className="mt-1" style={{ fontSize: '9px', color: '#A0A0A0' }}>ApÃ³s {slot.metadata.base_deliveries} entregas</p>
                            </div>
                        ) : (
                            <div className="p-6 flex flex-col items-center text-center" style={sClayDark}>
                                <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={sClayIcon}>
                                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>location_on</span>
                                </div>
                                <p className="font-bold uppercase mb-1" style={{ fontSize: '10px', color: '#A0A0A0', letterSpacing: '0.1em' }}>Local</p>
                                <p className="text-base font-extrabold text-white leading-tight">{slot.admin_users?.store_address?.split(',')[0] || 'Ver detalhes'}</p>
                            </div>
                        )}
                    </div>

                    {/* â”€â”€ BÃ´nus extras â”€â”€ */}
                    {customBenefits.length > 0 && (
                        <section className="space-y-4 pt-4">
                            <div className="flex items-center justify-between px-6">
                                <h3 className="text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full" style={{ background: '#FFD700' }}></span>
                                    BÃ´nus extras
                                </h3>
                                <span className="px-3 py-1 font-black uppercase" style={{ ...sClayDark, fontSize: '9px', color: '#FFD700', letterSpacing: '0.1em', borderRadius: '9999px' }}>
                                    {customBenefits.length} {customBenefits.length === 1 ? 'Item' : 'Itens'}
                                </span>
                            </div>
                            <div className="overflow-x-auto flex gap-4 px-6 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
                                {customBenefits.map((ben: any, idx: number) => (
                                    <div key={idx} className="flex-shrink-0 w-32 p-5 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>stars</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-bold uppercase" style={{ fontSize: '9px', color: '#A0A0A0' }}>{ben.label || ben.title || ben}</p>
                                            <p className="text-sm font-black" style={{ color: '#FFD700' }}>+ R$ {parseFloat(ben.value || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* â”€â”€ Bairros extras â”€â”€ */}
                    <section className="px-6 space-y-5">
                        <h4 className="font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>location_on</span>
                            </span>
                            Bairros extras
                        </h4>
                        {neighborhoodExtras.length > 0 ? (
                            <div className="overflow-x-auto flex gap-4 pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
                                {neighborhoodExtras.map((nb: any, idx: number) => (
                                    <div key={idx} className="flex-shrink-0 w-32 p-5 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>map</span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="font-bold uppercase" style={{ fontSize: '9px', color: '#A0A0A0' }}>{nb.label || nb.name || nb}</p>
                                            <p className="text-sm font-black" style={{ color: '#FFD700' }}>+ R$ {parseFloat(nb.value || 0).toFixed(2)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 flex items-center gap-3" style={{ ...sClayDark, borderRadius: '1.5rem' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={sClayIcon}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#FFD700', opacity: 0.5 }}>map</span>
                                </div>
                                <p className="text-sm" style={{ color: '#A0A0A0' }}>Sem bairros com taxa adicional</p>
                            </div>
                        )}
                    </section>

                    {/* â”€â”€ Requisitos â”€â”€ */}
                    <section className="px-6 space-y-6">
                        <h4 className="font-bold text-white flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>verified_user</span>
                            </span>
                            Requisitos NecessÃ¡rios
                        </h4>
                        <div className="space-y-4">
                            {requirements.map((req: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-4 p-4" style={sClayDark}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={sClayIcon}>
                                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>check</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">{typeof req === 'string' ? req : req.label}</p>
                                        {req.detail && <p className="mt-0.5" style={{ fontSize: '11px', color: '#A0A0A0' }}>{req.detail}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* DescriÃ§Ã£o (se houver) */}
                    {slot.description && (
                        <section className="px-6">
                            <div className="p-4" style={{ ...sClayDark, borderRadius: '1.5rem', borderLeft: '3px solid rgba(255,215,0,0.4)' }}>
                                <p className="text-xs leading-relaxed" style={{ color: '#A0A0A0' }}>{slot.description}</p>
                            </div>
                        </section>
                    )}
                </div>

                {/* â”€â”€ Sticky Bottom â”€â”€ */}
                <nav
                    className="fixed bottom-0 left-0 w-full flex flex-col items-center z-50"
                    style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(24px)', borderTop: '1px solid rgba(255,255,255,0.05)' }}
                >
                    <div className="w-full pt-5 pb-8 px-6">
                        {hasApplied ? (
                            <div
                                className="flex items-center justify-center gap-3 py-5 px-8 w-full font-black text-sm uppercase"
                                style={{
                                    ...(application?.status === 'accepted'
                                        ? { background: '#10b981', boxShadow: '0 10px 25px rgba(16,185,129,0.3), inset 6px 6px 12px rgba(255,255,255,0.2), inset -6px -6px 12px rgba(0,0,0,0.2)' }
                                        : { ...sClayDark, color: '#FFD700' }
                                    ),
                                    borderRadius: '2.5rem',
                                    letterSpacing: '0.15em',
                                    color: application?.status === 'accepted' ? '#fff' : '#FFD700',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                    {application?.status === 'accepted' ? 'verified' : 'schedule'}
                                </span>
                                {application?.status === 'accepted' ? 'Candidatura Aprovada!' : 'Em AnÃ¡lise...'}
                            </div>
                        ) : (
                            <button
                                onClick={async () => {
                                    try {
                                        const { error } = await supabase.from('slot_applications').insert({
                                            slot_id: slot.id,
                                            driver_id: driverId,
                                            status: 'pending',
                                            created_at: new Date().toISOString()
                                        });
                                        if (error && error.code !== '42P01') throw error;
                                        toastSuccess('Candidatura enviada!');
                                        setSelectedSlot(null);
                                        setActiveTab('dashboard');
                                    } catch { toastError('Erro ao candidatar. Tente pelo WhatsApp.'); }
                                }}
                                className="flex items-center justify-center gap-3 py-5 px-8 w-full font-black text-sm uppercase text-black active:scale-[0.97] transition-all"
                                style={{ ...sClayYellow, letterSpacing: '0.15em' }}
                            >
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assignment_turned_in</span>
                                Candidatar-se Agora
                            </button>
                        )}
                        {slot.admin_users?.store_phone && (
                            <button
                                onClick={() => window.open(`https://wa.me/55${slot.admin_users.store_phone.replace(/\D/g, '')}`, '_blank')}
                                className="w-full mt-3 flex items-center justify-center gap-2 py-3 font-black text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                                style={{ ...sClayDark, color: '#4ade80', borderRadius: '1.5rem' }}
                            >
                                <Icon name="chat" size={14} />WhatsApp
                            </button>
                        )}
                    </div>
                </nav>
            </motion.div>
        );
    };


    const renderProfileView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-10 pt-4">
            <div className="flex flex-col items-center pt-4 pb-2">
                <div className="size-24 rounded-[32px] bg-gradient-to-br from-primary/30 to-primary/5 border border-primary/20 flex items-center justify-center mb-4"><Icon name="person" className="text-primary text-5xl" /></div>
                <h2 className="text-2xl font-black text-white tracking-tight">{driverName}</h2>
                <div className="flex items-center gap-2 mt-1.5"><Icon name="verified" className="text-primary text-sm" /><span className="text-[10px] font-black text-primary uppercase tracking-widest">Piloto Izi â€¢ NÃ­vel {stats.level}</span></div>
                <div className="flex items-center gap-4 py-2 mt-4">
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"><Icon name="star" className="text-primary text-sm" /><span className="text-sm font-black text-white">4.98</span></div>
                    <div className="flex items-center gap-1.5 bg-white/5 px-4 py-2 rounded-2xl border border-white/5"><Icon name="route" className="text-emerald-400 text-sm" /><span className="text-sm font-black text-white">{stats.count} corridas</span></div>
                </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-6 space-y-4">
                <div>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Zona de RecuperaÃ§Ã£o</p>
                    <p className="text-[11px] text-white/40 leading-relaxed">Se o app estiver travado em uma missÃ£o antiga ou invisÃ­vel, use os botÃµes abaixo para sincronizar ou forÃ§ar limpeza.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button 
                        onClick={() => {
                            syncMissionWithDB();
                            toastSuccess('Sincronizando...');
                        }}
                        className="flex-1 h-12 bg-white/5 border border-white/10 text-white/70 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                    >
                        Sincronizar MissÃ£o
                    </button>
                    <button 
                        onClick={() => {
                            if (confirm('Deseja forÃ§ar a limpeza da missÃ£o atual do seu celular?')) {
                                setActiveMission(null);
                                localStorage.removeItem('Izi_active_mission');
                                setActiveTab('dashboard');
                                toastSuccess('Limpeza concluÃ­da!');
                            }
                        }}
                        className="flex-1 h-12 bg-red-500/10 border border-red-500/20 text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                    >
                        ForÃ§ar FinalizaÃ§Ã£o
                    </button>
                  </div>
                  <button 
                      onClick={() => {
                          playIziSound('driver');
                          toastSuccess('Testando som de chamada...');
                      }}
                      className="w-full h-12 bg-primary/10 border border-primary/20 text-primary font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                      <Icon name="volume_up" size={16} /> Testar Som de Chamada
                  </button>
                </div>
            </div>

            <div className="space-y-3">
                {[{ label: 'Dados do VeÃ­culo', icon: 'directions_car', color: 'text-primary' }, { label: 'Documentos e CNH', icon: 'badge', color: 'text-blue-400' }, { label: 'Suporte Izi', icon: 'support_agent', color: 'text-emerald-400' }, { label: 'ConfiguraÃ§Ãµes', icon: 'settings', color: 'text-white/40' }].map((item, i) => (
                    <button key={i} className="w-full bg-white/[0.03] border border-white/5 rounded-[24px] p-5 flex items-center justify-between group hover:bg-white/[0.06] transition-all active:scale-[0.98]">
                        <div className="flex items-center gap-4"><div className={`size-11 rounded-[16px] bg-white/5 flex items-center justify-center border border-white/10 ${item.color}`}><Icon name={item.icon} className="text-xl" /></div><span className="text-sm font-black text-white">{item.label}</span></div>
                        <Icon name="chevron_right" className="text-white/20 group-hover:text-white/40 transition-colors" />
                    </button>
                ))}
            </div>
            <button onClick={handleLogout} className="w-full py-5 border border-red-500/20 text-red-400 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-red-500/5 transition-all active:scale-[0.98] mt-4">Sair</button>
        </motion.div>
    );

    const [isMapOnly, setIsMapOnly] = useState(false);

    const renderActiveMissionView = () => {
        if (!activeMission) {
            return (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-[#030712] flex flex-col items-center justify-center p-10 text-center">
                    <div className="size-24 rounded-[40px] bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                        <Icon name="route" size={40} className="text-white/20" />
                    </div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight mb-2">Sem MissÃ£o Ativa</h2>
                    <p className="text-sm text-white/40 leading-relaxed mb-8">VocÃª nÃ£o possui nenhuma corrida em andamento no momento. VÃ¡ ao Dashboard para aceitar novos pedidos.</p>
                    
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
                {/* BACKGROUND SEM MAPA - BOTÃƒO DE NAVEGAÃ‡ÃƒO CENTRAL */}
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
                        Toque no botÃ£o acima para abrir o seu GPS favorito e seguir a rota.
                    </p>

                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />
                </div>

                {/* Header Flutuante */}
                <header className="relative z-50 flex items-center justify-between px-6 pt-10">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className="size-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl"
                    >
                        <Icon name="arrow_back" />
                    </button>
                    <div className="text-right">
                        <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.4em] mb-1">MissÃ£o Ativa</p>
                        <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1 shadow-sm">
                            #{activeMission.realId?.slice(0,8).toUpperCase()}
                        </h2>
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-primary/10 border border-primary/20">
                            <Icon name={statusDisplay.icon} size={10} className={`${statusDisplay.color} animate-pulse`} />
                            <span className={`text-[8px] font-black uppercase tracking-widest ${statusDisplay.color}`}>{statusDisplay.label}</span>
                        </div>
                    </div>
                </header>

                {/* BOTTOM SHEET DESLIZANTE */}
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
                        
                        <div className="size-8" /> {/* Spacer para manter o handle no centro */}
                    </div>

                    <div className="p-8 pb-40 overflow-y-auto no-scrollbar flex-1 space-y-8">
                        {/* Status de Preparo - Banner Visual de "PRONTO" */}
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
                                        <h4 className="text-base font-black text-emerald-400 uppercase tracking-tight">Pedido estÃ¡ Pronto!</h4>
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Pode retirar no estabelecimento</p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Resumo Financeiro e Cliente - CLAY CARD */}
                        <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-[40px] p-8 space-y-6 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="size-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                                        <Icon name="person" size={28} />
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-white/20 uppercase tracking-widest">Cliente</p>
                                        <h3 className="text-lg font-black text-white">{activeMission.user_name || activeMission.customer || 'UsuÃ¡rio Izi'}</h3>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-primary uppercase tracking-widest">Ganho LÃ­quido</p>
                                    <p className="text-2xl font-black text-white italic">R$ {getNetEarnings(activeMission).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                            </div>

                            <div className={`p-6 rounded-[30px] border border-white/5 shadow-inner ${
                                activeMission.payment_method === 'dinheiro' || activeMission.payment_method === 'cartao_maquininha' 
                                ? 'bg-amber-500/10' 
                                : 'bg-emerald-500/10'
                            }`}>
                                <div className="flex items-start gap-4">
                                    <div className={`size-10 rounded-xl flex items-center justify-center ${activeMission.payment_method === 'dinheiro' || activeMission.payment_method === 'cartao_maquininha' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                        <Icon name={activeMission.payment_method === 'dinheiro' ? 'payments' : 'account_balance_wallet'} size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Fluxo de CobranÃ§a</p>
                                        <h4 className="text-sm font-black text-white mt-1 uppercase italic tracking-tight">
                                            {activeMission.payment_method === 'dinheiro' 
                                                ? <><span className="text-amber-400">Receber R$ {activeMission.total_price?.toFixed(2)}</span> em DINHEIRO</>
                                                : activeMission.payment_method === 'cartao_maquininha'
                                                ? <><span className="text-amber-400">Passar R$ {activeMission.total_price?.toFixed(2)}</span> NA MAQUININHA</>
                                                : 'Pagamento Digital Confirmado'}
                                        </h4>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Rota Detalhada - GLASS CARD PREMIUM */}
                        <div className="bg-white/[0.03] border border-white/10 backdrop-blur-xl rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                                <Icon name="explore" size={120} className="text-primary -rotate-12" />
                            </div>

                            <div className="relative">
                                <div className="absolute left-[13px] top-8 bottom-8 w-[2px] bg-gradient-to-b from-blue-500/20 via-primary/20 to-primary/40 dashed" />
                                
                                <div className="flex items-start gap-6 relative z-10">
                                    <div className={`mt-1 size-7 rounded-2xl flex items-center justify-center shrink-0 ${['a_caminho_coleta', 'chegou_coleta', 'saiu_para_coleta', 'no_local_coleta'].includes(activeMission.status || '') ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-white/10'}`}>
                                        <Icon name="storefront" size={16} className="text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
                                            <span className="size-1 rounded-full bg-blue-400" />
                                            Coleta: {activeMission.merchant_name || 'Estabelecimento'}
                                        </p>
                                        <p className="text-sm font-black text-white leading-relaxed italic pr-4">{pickupOnly}</p>
                                    </div>
                                </div>

                                <div className="h-10" />

                                <div className="flex items-start gap-6 relative z-10">
                                    <div className={`mt-1 size-7 rounded-2xl flex items-center justify-center shrink-0 ${['picked_up', 'a_caminho', 'em_rota', 'no_local'].includes(activeMission.status || '') ? 'bg-primary shadow-[0_0_15px_rgba(255,217,0,0.4)]' : 'bg-white/10'}`}>
                                        <Icon name="location_on" size={16} className="text-slate-950" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] mb-1.5 flex items-center gap-2">
                                            <span className="size-1 rounded-full bg-primary" />
                                            Entrega: {activeMission.user_name || activeMission.customer || 'Cliente'}
                                        </p>
                                        <p className="text-sm font-black text-white leading-relaxed italic pr-4">{addressOnly}</p>
                                    </div>
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
                                className="w-full py-6 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-[30px] flex items-center justify-center gap-4 text-white active:scale-95 transition-all group shadow-xl"
                            >
                                <div className="size-10 rounded-2xl bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-all">
                                    <Icon name="near_me" size={20} className="text-primary" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-white/80 group-hover:text-white">Abrir GPS Externo</span>
                            </button>
                        </div>

                        {/* Itens */}
                        {orderItems.length > 0 && (
                            <div className="bg-zinc-900 border-none rounded-[40px] p-8 shadow-[12px_12px_24px_rgba(0,0,0,0.4),-12px_-12px_24px_rgba(255,255,255,0.02),inset_8px_8px_16px_rgba(255,255,255,0.03),inset_-8px_-8px_16px_rgba(0,0,0,0.4)]">
                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-4">Lista de Itens</p>
                                <div className="space-y-3">
                                    {orderItems.map((item: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs font-bold text-white/60">
                                            <span>â€¢ {item.quantity ? `${item.quantity}x ` : ''}{item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer com BotÃ£o de AÃ§Ã£o */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-[#030712] via-[#030712] to-transparent pt-20 pointer-events-none">
                        <div className="pointer-events-auto w-full space-y-3">
                            {/* BOTOES DE ACAO CENTRALIZADOS */}
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
                                    <Icon name="person_pin_circle" /> TÃ´ no Destino
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

                            {/* CANCELAR SEMPRE DISCRETO */}
                            {['a_caminho_coleta', 'saiu_para_coleta', 'aceito'].includes(activeMission.status || '') && (
                                <button 
                                    onClick={async () => { if (await showConfirm({ message: 'Cancelar missÃ£o?' })) handleUpdateStatus('cancelado'); }}
                                    className="w-full py-2 text-red-500/40 text-[9px] font-black uppercase tracking-[0.4em]"
                                >
                                    Cancelar MissÃ£o
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
            <div className="size-28 bg-red-500/20 border border-red-500/30 rounded-full flex items-center justify-center mb-8 animate-pulse"><Icon name="emergency_share" className="text-6xl text-red-400" /></div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tight mb-3">SOS Ativado</h1>
            <p className="text-white/60 text-sm mb-10 max-w-xs leading-relaxed">Sua localizaÃ§Ã£o estÃ¡ sendo compartilhada com a central Izi.</p>
            <div className="w-full max-w-sm space-y-4">
                <button onClick={() => { window.open('tel:190'); setIsSOSActive(false); }} className="w-full h-16 bg-white text-red-600 rounded-[24px] flex items-center justify-center gap-4 font-black text-lg uppercase tracking-tight shadow-2xl active:scale-95 transition-all"><Icon name="local_police" className="text-3xl" />Ligar 190</button>
                <button onClick={() => { toastSuccess('Apoio mecÃ¢nico acionado.'); setIsSOSActive(false); }} className="w-full h-16 bg-white/10 border border-white/20 text-white rounded-[24px] flex items-center justify-center gap-4 font-black text-base uppercase active:scale-95 transition-all"><Icon name="build" className="text-2xl" />Apoio MecÃ¢nico</button>
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
                        <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.5em]">{authMode === 'login' ? 'AutenticaÃ§Ã£o do Entregador' : 'Cadastro de Novo Piloto'}</p>
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
                        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="w-full h-12 bg-white/[0.03] border border-white/5 text-white/30 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-white/50 hover:bg-white/[0.05] transition-all">{authMode === 'login' ? 'Criar nova conta' : 'JÃ¡ tenho conta'}</button>
                    </div>
                </div>
                <p className="absolute bottom-8 text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Izi v5.0 â€¢ ConexÃ£o Segura</p>
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
                        <AnimatePresence>{activeTab === 'active_mission' && renderActiveMissionView()}</AnimatePresence>
                        {renderNavigationDrawer()}
                        <div className="flex flex-col h-full overflow-hidden">
                            {renderHeader()}
                            <AnimatePresence>
                                {activeMission && activeTab !== 'active_mission' && (
                                    <motion.button key="mission-btn" initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} onClick={() => setActiveTab('active_mission')} className="fixed bottom-8 left-5 right-5 z-[60] bg-primary text-slate-900 rounded-[24px] h-16 flex items-center justify-between px-6 shadow-2xl shadow-primary/30">
                                        <div className="flex items-center gap-3"><div className="size-3 bg-slate-900 rounded-full animate-pulse" /><span className="font-black text-sm uppercase tracking-widest">MissÃ£o em Andamento</span></div>
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
                                    className={`fixed bottom-8 right-6 size-16 rounded-full flex items-center justify-center z-[90] shadow-2xl transition-all duration-500 border-2 ${
                                        isOnline 
                                        ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-[0_10px_20px_rgba(16,185,129,0.3)]' 
                                        : 'bg-slate-700/80 backdrop-blur-xl border-slate-500/50 text-white shadow-[0_10px_20px_rgba(0,0,0,0.5)]'
                                    }`}
                                >
                                    <Icon name="power_settings_new" size={28} className={isOnline ? 'animate-pulse' : 'opacity-70'} />
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

            {/* Modal de ConfirmaÃ§Ã£o de Saque */}
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
                            className="w-full max-w-sm bg-[#0f172a] border border-white/10 rounded-t-[40px] p-8 space-y-6"
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
                                    <span className="text-xs uppercase tracking-widest">LÃ­quido a Receber</span>
                                    <span className="text-sm">R$ {(stats.balance * (1 - (Number(appSettings?.withdrawalfeepercent ?? 0) / 100))).toFixed(2).replace('.', ',')}</span>
                                </div>
                                <div className="h-px bg-white/5" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-white/40">Status</span>
                                    <span className="text-xs font-black text-amber-400">Aguarda aprovaÃ§Ã£o admin</span>
                                </div>
                            </div>
                            
                            <p className="text-[10px] text-center text-white/20 italic">Os saques sÃ£o processados em atÃ© {appSettings?.withdrawal_period_h ?? 24}h.</p>
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

            {/* Overlay de Sucesso de Saque - Premium */}

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
                            Sua solicitaÃ§Ã£o de PIX foi enviada e jÃ¡ aparece no painel administrativo para aprovaÃ§Ã£o.
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

            {/* Modal de ConfirmaÃ§Ã£o de Pagamento Pendente */}
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
                            className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[40px] p-8 shadow-2xl"
                        >
                            <div className="size-16 rounded-3xl bg-amber-500/10 flex items-center justify-center mb-6 border border-amber-500/20">
                                <span className="material-symbols-outlined text-amber-500 text-3xl">payments</span>
                            </div>

                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2 italic">AtenÃ§Ã£o Piloto!</h3>
                            <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                                Este pedido ainda <span className="text-rose-500 font-bold">nÃ£o foi pago</span> via App. 
                                Confirme como vocÃª recebeu o valor de <span className="text-white font-black">R$ {Number(confirmPaymentState.mission.total_price || 0).toFixed(2).replace('.', ',')}</span>:
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
                                    Recebi via Pix / CartÃ£o
                                </button>
                                <button 
                                    onClick={() => {
                                        confirmPaymentState.resolve(false);
                                        setConfirmPaymentState(null);
                                    }}
                                    className="w-full py-4 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest"
                                >
                                    Ainda nÃ£o recebi
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Feedback Visual de ConclusÃ£o de MissÃ£o (Ganhos) */}
            <AnimatePresence>
                {finishedMissionData?.show && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[250] bg-slate-950/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden"
                    >
                        {/* PartÃ­culas de Brilho ao Fundo */}
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
                            
                            {/* AnÃ©is de Pulso */}
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
                                ParabÃ©ns! <br />
                                <span className="text-primary">MissÃ£o ConcluÃ­da</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-sm tracking-wide uppercase opacity-60">VocÃª acaba de faturar:</p>
                        </motion.div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="my-6 w-full max-w-sm px-6 py-8 bg-white/[0.03] border border-white/10 rounded-[40px] shadow-sm relative overflow-hidden"
                        >
                            {/* Bg Shine */}
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

                                {/* Breakdown Breakdown */}
                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Base</span>
                                        <span className="text-lg font-black text-white italic">
                                            R$ {(finishedMissionData.baseValue || 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <div className="bg-white/5 p-3 rounded-2xl border border-white/5">
                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Adicional Km</span>
                                        <span className="text-lg font-black text-emerald-400 italic">
                                            + R$ {(finishedMissionData.extraKmValue || 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-2 pt-2">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Ganho LÃ­quido</span>
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
                                JÃ¡ disponÃ­vel na sua carteira
                            </p>

                            <button
                                onClick={() => setFinishedMissionData(null)}
                                className="w-full h-16 rounded-[28px] bg-white text-zinc-950 font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all hover:bg-primary"
                            >
                                Continuar Ganhando
                            </button>
                        </motion.div>

                        {/* Detalhe EstÃ©tico Inferior */}
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
