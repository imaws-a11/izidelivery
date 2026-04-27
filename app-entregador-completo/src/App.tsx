import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, supabaseUrl } from './lib/supabase';
import { playIziSound, stopIziSounds } from './lib/iziSounds';
import { toast, toastSuccess, toastError, showConfirm } from './lib/useToast';
import { BespokeIcons } from './lib/BespokeIcons';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, OverlayView, Polyline, DirectionsService } from '@react-google-maps/api';
import SplashScreen from './components/common/SplashScreen';
import { IziBottomSheet } from './components/common/IziBottomSheet';

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
    'arrow_forward': BespokeIcons.ChevronRight,
    'sync': BespokeIcons.History,
    'cloud_sync': BespokeIcons.History,
    'qr_code_scanner': BespokeIcons.Bolt,
    'home': BespokeIcons.Home,
    'storefront': BespokeIcons.Bag,
    'my_location': BespokeIcons.Pin,
    'directions': BespokeIcons.Map,
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
    customer_lat?: number;
    customer_lng?: number;
    merchant_lat?: number;
    merchant_lng?: number;
    latitude?: number;
    longitude?: number;
    user_id?: string;
    merchant_id?: string;
    merchant_phone?: string;
    merchant_address?: string;
    payment_status?: string;
    change_for?: number;
    customer_phone?: string;
    phone?: string;
    store_name?: string;
    distance_km?: number;
    observations?: string;
    order_notes?: string;
    service_type?: string;
}
const isValidCoord = (c: any) => c && typeof c.lat === 'number' && Math.abs(c.lat) > 0.01;

function MissionRouteMap({ pickup, delivery, pickupAddress, deliveryAddress, driverCoords, missionPhase = 'to_pickup', onRouteInfo }: { pickup: any, delivery: any, pickupAddress?: string, deliveryAddress?: string, driverCoords?: any, missionPhase?: 'to_pickup' | 'to_delivery', onRouteInfo?: (info: any) => void }) {
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({ 
    id: GOOGLE_MAPS_ID, 
    googleMapsApiKey: mapsKey, 
    libraries: GOOGLE_MAPS_LIBRARIES, 
    language: 'pt-BR', 
    region: 'BR' 
  });
  const [routePolyline, setRoutePolyline] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{start: any, end: any} | null>(null);

  const vPickup = isValidCoord(pickup) ? pickup : null;
  const vDelivery = isValidCoord(delivery) ? delivery : null;

  useEffect(() => {
    if (isLoaded && (vPickup || pickupAddress) && (vDelivery || deliveryAddress)) {
      const fetchRoute = async () => {
        try {
          const isDelivery = missionPhase === 'to_delivery';
          let originVal, destVal;
          
          if (!isDelivery) {
            // Fase 1: Trajeto do Motoboy até a Loja (Coleta)
            if (driverCoords && isValidCoord(driverCoords)) {
              originVal = { location: { latLng: { latitude: driverCoords.lat, longitude: driverCoords.lng } } };
            } else {
              originVal = vPickup 
                ? { location: { latLng: { latitude: vPickup.lat, longitude: vPickup.lng } } } 
                : { address: (pickupAddress && !pickupAddress.toLowerCase().includes('brumadinho') ? `${pickupAddress}, Brumadinho - MG` : pickupAddress) };
            }
            
            destVal = vPickup 
              ? { location: { latLng: { latitude: vPickup.lat, longitude: vPickup.lng } } } 
              : { address: (pickupAddress && !pickupAddress.toLowerCase().includes('brumadinho') ? `${pickupAddress}, Brumadinho - MG` : pickupAddress) };
          } else {
            // Fase 2: Trajeto do Motoboy/Loja até o Cliente (Entrega)
            if (driverCoords && isValidCoord(driverCoords)) {
              originVal = { location: { latLng: { latitude: driverCoords.lat, longitude: driverCoords.lng } } };
            } else {
              originVal = vPickup 
                ? { location: { latLng: { latitude: vPickup.lat, longitude: vPickup.lng } } } 
                : { address: (pickupAddress && !pickupAddress.toLowerCase().includes('brumadinho') ? `${pickupAddress}, Brumadinho - MG` : pickupAddress) };
            }
            
            destVal = vDelivery 
              ? { location: { latLng: { latitude: vDelivery.lat, longitude: vDelivery.lng } } } 
              : { address: (deliveryAddress && !deliveryAddress.toLowerCase().includes('brumadinho') ? `${deliveryAddress}, Brumadinho - MG` : deliveryAddress) };
          }

          const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': mapsKey,
              'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs'
            },
            body: JSON.stringify({
              origin: originVal,
              destination: destVal,
              travelMode: 'DRIVE',
              routingPreference: 'TRAFFIC_AWARE',
              units: 'METRIC',
              languageCode: 'pt-BR'
            })
          });

          const data = await res.json();
          if (data.routes?.[0]) {
            const route = data.routes[0];
            setRoutePolyline(route.polyline.encodedPolyline);
            
            const leg = route.legs[0];
            const startLoc = { lat: leg.startLocation.latLng.latitude, lng: leg.startLocation.latLng.longitude };
            const endLoc = { lat: leg.endLocation.latLng.latitude, lng: leg.endLocation.latLng.longitude };
            setRouteInfo({ start: startLoc, end: endLoc });

            if (onRouteInfo) {
              onRouteInfo({
                distanceText: (route.distanceMeters / 1000).toFixed(1) + ' km',
                distanceValue: route.distanceMeters / 1000,
                durationText: Math.ceil(parseInt(route.duration) / 60) + ' min'
              });
            }
          }
        } catch (e) {
          console.error('MissionRouteMap Error:', e);
        }
      };
      fetchRoute();
    }
  }, [isLoaded, vPickup?.lat, vPickup?.lng, vDelivery?.lat, vDelivery?.lng, pickupAddress, deliveryAddress, missionPhase]);

  const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
    { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }, { "weight": 3 }] },
    { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#94a3b8" }, { "visibility": "on" }, { "weight": 1.5 }] },
    { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#cbd5e1" }, { "visibility": "on" }, { "weight": 2 }] },
    { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#94a3b8" }, { "visibility": "on" }, { "weight": 2.5 }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#7dd3fc" }] }
  ];

  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (map && isLoaded && routePolyline) {
      const bounds = new window.google.maps.LatLngBounds();
      let extended = false;
      if (driverCoords && isValidCoord(driverCoords)) { bounds.extend(driverCoords); extended = true; }
      if (vPickup) { bounds.extend(vPickup); extended = true; }
      if (vDelivery) { bounds.extend(vDelivery); extended = true; }
      
      if (extended) {
        const paddingBottom = typeof window !== 'undefined' ? window.innerHeight * 0.45 : 400;
        map.fitBounds(bounds, { top: 100, bottom: paddingBottom, left: 50, right: 50 });
      }
    }
  }, [map, isLoaded, routePolyline, vPickup?.lat, vDelivery?.lat]);

  if (!isLoaded) return <div className="w-full h-full bg-black animate-pulse" />;

  const mapCenter = routeInfo?.start || vPickup || vDelivery || { lat: -19.9167, lng: -43.9345 };

  return (
    <div className="w-full h-full relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={routePolyline ? 15 : 14}
        onLoad={setMap}
        options={{
          disableDefaultUI: true,
          styles: mapStyle,
          backgroundColor: '#f8fafc',
          gestureHandling: 'greedy',
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false
        }}
      >
      {routePolyline && (
        <Polyline 
          path={window.google.maps.geometry.encoding.decodePath(routePolyline)} 
          options={{ 
            strokeColor: '#3b82f6',
            strokeOpacity: 1.0,
            strokeWeight: 6,
          }} 
        />
      )}

      {/* Marcador do Entregador (Piloto) */}
      {driverCoords && isValidCoord(driverCoords) && (
        <OverlayView position={driverCoords} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div className="relative flex items-center justify-center">
            <div className="absolute size-14 rounded-full bg-yellow-400/10 animate-ping duration-[2000ms]" />
            <div className="size-11 rounded-3xl bg-white/80 backdrop-blur-md border border-neutral-200 shadow-xl flex items-center justify-center">
              <div className="size-8 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-inner">
                <Icon name="two_wheeler" size={16} className="text-black" />
              </div>
            </div>
          </div>
        </OverlayView>
      )}

      {/* Marcador de Coleta (Loja) - mostrar sempre */}
      {vPickup && (
        <OverlayView position={vPickup} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
          <div className="relative flex items-center justify-center">
            <div className="size-11 rounded-3xl bg-white/80 backdrop-blur-md border border-neutral-200 shadow-xl flex items-center justify-center">
              <div className="size-8 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-inner">
                <Icon name="storefront" size={16} className="text-black" />
              </div>
            </div>
          </div>
        </OverlayView>
      )}

      {/* Marcador de Destino (Cliente) - usa routeInfo.end como fallback quando delivery_lat está vazio */}
      {(() => {
        const clientPos = (vDelivery && isValidCoord(vDelivery)) ? vDelivery : routeInfo?.end;
        if (!clientPos) return null;
        return (
          <OverlayView position={clientPos} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative flex items-center justify-center">
              <div className="absolute size-14 rounded-full bg-blue-400/20 animate-pulse" />
              <div className="size-11 rounded-3xl bg-white/80 backdrop-blur-md border border-neutral-200 shadow-xl flex items-center justify-center">
                <div className="size-8 rounded-2xl bg-blue-600 flex items-center justify-center shadow-inner">
                  <Icon name="home" size={16} className="text-white" />
                </div>
              </div>
            </div>
          </OverlayView>
        );
      })()}
    </GoogleMap>
    
    {/* Botão de Localização Atual (Centraliza no Motorista) */}
    <motion.button 
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={() => {
        if (map) {
          map.panTo((driverCoords && isValidCoord(driverCoords)) ? driverCoords : mapCenter);
          map.setZoom(17);
        }
      }}
      className="absolute bottom-[38vh] right-6 size-14 bg-yellow-400 rounded-[20px] flex items-center justify-center shadow-2xl active:scale-90 transition-all z-[120]"
    >
      <Icon name="my_location" size={28} className="text-black" />
    </motion.button>
    </div>
  );
}

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
      { "elementType": "geometry", "stylers": [{ "color": "#e2e8f0" }] },
      { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
      { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
      { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }, { "weight": 3 }] },
      { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
      { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
      { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
      { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#94a3b8" }, { "visibility": "on" }, { "weight": 1.5 }] },
      { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
      { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#fcd34d" }, { "visibility": "on" }, { "weight": 2 }] },
      { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#fde047" }] },
      { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#eab308" }, { "visibility": "on" }, { "weight": 2.5 }] },
      { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#7dd3fc" }] }
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
            <div className="absolute size-14 rounded-full bg-yellow-400/10 animate-ping duration-[2000ms]" />
            <div className="size-11 rounded-3xl bg-white/80 backdrop-blur-md border border-neutral-200 shadow-xl flex items-center justify-center">
              <div className="size-8 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-inner">
                <Icon name="two_wheeler" size={16} className="text-black" />
              </div>
            </div>
          </div>
        </OverlayView>
        
        {routeData?.poly && (
          <Polyline 
            path={window.google.maps.geometry.encoding.decodePath(routeData.poly)} 
            options={{ 
              strokeColor: '#FACD05', 
              strokeOpacity: 0.9, 
              strokeWeight: 6,
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
    if (['motoboy', 'courier', 'moto', 'motoboy_express'].includes(t)) return 'motoboy';
    if (['package', 'pacote', 'encomenda', 'express', 'delivery'].includes(t)) return 'package';
    return t; // retorna o tipo original se não houver mapeamento
};

const getTypeDetails = (rawType: string) => {
    const type = normalizeServiceType(rawType);
    switch (type) {
        case 'package': return { icon: 'package_2', color: 'text-primary', bg: 'bg-primary/10', label: 'Envio Express', isFood: false };
        case 'mototaxi': return { icon: 'motorcycle', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'MotoTaxi', isFood: false };
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
        case 'motoboy': return { icon: 'motorcycle', color: 'text-emerald-400', bg: 'bg-emerald-400/10', label: 'Motoboy', isFood: false };
        default: return { icon: 'motorcycle', color: 'text-primary', bg: 'bg-primary/10', label: 'Servico Express', isFood: false };
    }
};

const normalizeLookupText = (value: unknown): string =>
    String(value ?? '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));

const cleanAddressText = (value: string | undefined | null): string => {
    let raw = String(value || '').trim();
    if (raw.startsWith('{')) {
        try {
            const parsed = JSON.parse(raw);
            if (parsed.address) raw = parsed.address;
        } catch (e) {}
    }
    return raw.split('|')[0].trim();
};

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
        if (includesAny(lookupText, ['moto', 'motoboy'])) detectedType = 'motoboy';
        else if (includesAny(lookupText, ['van']) || normalizedType === 'van') detectedType = 'van';
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
        summary = itemNames.slice(0, 2).join(' Â¢Â¢ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’ââ‚¬Â¦áÂ¬Â¢ ');
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
        title: headline,
    };
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

if (!GOOGLE_MAPS_API_KEY) {
  console.error("ðŸš¨ [CONFIG] VITE_GOOGLE_MAPS_API_KEY is missing in .env file!");
} else {
  console.log("âœ… [CONFIG] Google Maps API Key loaded successfully for Entregador.");
}

function App() {
    const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    const { isLoaded } = useJsApiLoader({ id: GOOGLE_MAPS_ID, googleMapsApiKey: mapsKey, libraries: GOOGLE_MAPS_LIBRARIES, language: 'pt-BR', region: 'BR' });

    const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('izi_driver_authenticated') === 'true');
    const [driverId, setDriverId] = useState<string | null>(() => localStorage.getItem('izi_driver_uid'));
    const [driverCoords, setDriverCoords] = useState<{lat: number, lng: number} | null>(null);
    const [driverName, setDriverName] = useState(() => localStorage.getItem('izi_driver_name') || 'Entregador');
    const [driverAvatar, setDriverAvatar] = useState<string | null>(() => localStorage.getItem('izi_driver_avatar') || null);
    const [driverPlate, setDriverPlate] = useState(() => localStorage.getItem('izi_driver_plate') || '');
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authName, setAuthName] = useState('');
    const [authVehicle, setAuthVehicle] = useState<'mototaxi' | 'carro' | 'bicicleta'>('mototaxi');
    const [authPhone, setAuthPhone] = useState('');
    const [driverVehicle, setDriverVehicle] = useState<string>(() => localStorage.getItem('izi_driver_vehicle') || 'mototaxi');
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState('');
    const [authInitLoading, setAuthInitLoading] = useState(true);
    const [appSettings, setAppSettings] = useState<any>(null);
    const [dynamicRates, setDynamicRates] = useState<any>(null);
    const [realTimeRoute, setRealTimeRoute] = useState<{distanceText: string, distanceValue: number, durationText: string} | null>(null);
    const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
    const [showSplash, setShowSplash] = useState(true);

    const ensureDriverRecord = useCallback(async (userId: string, email: string, name: string) => {
        const { data } = await supabase.from('drivers_delivery').select('id, name, lat, lng, is_deleted, is_online, vehicle_type, preferences, avatar_url').eq('id', userId).maybeSingle();
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
            if (data.name) {
                setDriverName(data.name);
                if (data.vehicle_type) {
                    setDriverVehicle(data.vehicle_type);
                    localStorage.setItem('izi_driver_vehicle', data.vehicle_type);
                }
                localStorage.setItem('izi_driver_name', data.name);
            }
            if (data.avatar_url) {
                setDriverAvatar(data.avatar_url);
                localStorage.setItem('izi_driver_avatar', data.avatar_url);
            }
            if (data.preferences) {
                const p = data.preferences as any;
                if (p.pref_sound !== undefined) setPrefSoundEnabled(p.pref_sound);
                if (p.pref_vibration !== undefined) setPrefVibrationEnabled(p.pref_vibration);
                if (p.pref_nav_app !== undefined) setPrefNavApp(p.pref_nav_app);
                if (p.pref_max_radius !== undefined) setPrefMaxRadius(p.pref_max_radius);
                if (p.pref_vehicle) setPrefVehicleTypes(p.pref_vehicle);
                if (p.pref_services) setPrefServiceTypes(p.pref_services);
            }
            const lat = Number(data.lat);
            const lng = Number(data.lng);
            if (isFinite(lat) && isFinite(lng) && lat !== 0 && lng !== 0) setDriverCoords({ lat, lng });
        }
    }, []);

    useEffect(() => {
        const safetyTimer = setTimeout(() => {
            setShowSplash(false);
        }, 5000);
        return () => clearTimeout(safetyTimer);
    }, []);

    // Solicitar permissão de sobreposição de apps (Draw over other apps) no Android
    useEffect(() => {
        const requestOverlayPermission = async () => {
            if (Capacitor.getPlatform() !== 'android') return;
            try {
                const { granted } = await ForegroundService.checkManageOverlayPermission();
                setOverlayBlocked(!granted);
                if (granted) {
                    setOverlayBannerDismissed(false);
                    return;
                }

                console.log('[OVERLAY] Solicitando permissão de sobreposição...');
                setOverlayBannerDismissed(false);

                const result = await ForegroundService.requestManageOverlayPermission();
                setOverlayBlocked(result?.granted !== true);
            } catch (e) {
                setOverlayBlocked(true);
                setOverlayBannerDismissed(false);
                console.warn('[OVERLAY] Permissão de sobreposição não disponível:', e);
            }
        };
        // Aguarda splash antes de solicitar
        const timer = setTimeout(requestOverlayPermission, 3000);
        return () => clearTimeout(timer);
    }, []);

    const fetchGlobalSettings = useCallback(async () => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token || supabaseKey;
            const authHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` };
            
            // Busca configurações gerais
            const res = await fetch(`${supabaseUrl}/rest/v1/app_settings_delivery?select=*`, {
                headers: authHeaders
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data[0]) setAppSettings(data[0]);
            }

            // Busca taxas dinâmicas
            const resRates = await fetch(`${supabaseUrl}/rest/v1/dynamic_rates_delivery?type=eq.base_values&select=*`, {
                headers: authHeaders
            });
            if (resRates.ok) {
                const dataRates = await resRates.json();
                if (dataRates && dataRates[0]) setDynamicRates(dataRates[0].metadata);
            }
        } catch (e) {
            console.error('[SETTINGS] Erro ao buscar configurações:', e);
        }
    }, []);

    const [orders, setOrders] = useState<Order[]>([]);
    const [activeMission, setActiveMission] = useState<Order | null>(() => {
        const saved = localStorage.getItem('Izi_active_mission');
        return saved ? JSON.parse(saved) : null;
    });

    // Parar sons se houver missão ativa ou se mudar
    useEffect(() => {
        if (activeMission) stopIziSounds();
    }, [activeMission]);
    const activeMissionRef = useRef(activeMission);
    useEffect(() => { activeMissionRef.current = activeMission; }, [activeMission]);

    // Efeito para persistir dados básicos de autenticação no localStorage
    useEffect(() => {
        if (isLoggingOutRef.current) return;
        if (isAuthenticated && driverId) {
            localStorage.setItem('izi_driver_authenticated', 'true');
            localStorage.setItem('izi_driver_uid', driverId);
            localStorage.setItem('izi_driver_name', driverName);
            localStorage.setItem('izi_driver_vehicle', driverVehicle);
            fetchGlobalSettings();
        } else if (!authInitLoading) {
            localStorage.removeItem('izi_driver_authenticated');
            localStorage.removeItem('izi_driver_uid');
            localStorage.removeItem('izi_driver_name');
            localStorage.removeItem('izi_driver_vehicle');
        }
    }, [isAuthenticated, driverId, driverName, driverVehicle, authInitLoading]);

    const refreshMyApplications = useCallback(async () => {
        if (!driverId) return;
        try {
            const { data, error } = await supabase
                .from('slot_applications')
                .select('*')
                .eq('driver_id', driverId);
            
            if (!error && data) {
                setMyApplications(data);
                localStorage.setItem(`izi_apps_${driverId}`, JSON.stringify(data));
            }
        } catch (err) {
            console.error("Erro ao carregar candidaturas:", err);
        }
    }, [driverId]);

    /**
     * @CRITICAL_LOGIC - BUSCA DIRETA (BYPASS) DE VAGAS DEDICADAS
     * @AUTHOR Antigravity (Senior AI Dev)
     * @WARNING NÃƒO ALTERAR PARA SUPABASE-JS LIBRARY. 
     * Este método via fetch nativo foi implementado para contornar travamentos persistentes 
     * na biblioteca cliente. Qualquer mudança para o método tradicional resultará em 
     * falha de carregamento das vagas na tela do entregador.
     */
    const fetchDedicatedSlotsRealtime = useCallback(async () => {
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let token = await getSecureToken();

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            // Busca principal de vagas ativas
            const response = await fetch(`${supabaseUrl}/rest/v1/dedicated_slots_delivery?select=*&is_active=eq.true&order=created_at.desc`, {
                headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const slots = await response.json();

            if (!slots || slots.length === 0) {
                setDedicatedSlots([]);
                return;
            }

            // Busca de metadados dos lojistas vinculados
            const merchantIds = [...new Set(slots.map((s: any) => s.merchant_id).filter(Boolean))];
            let merchants: any[] = [];

            if (merchantIds.length > 0) {
                const merchantsRes = await fetch(`${supabaseUrl}/rest/v1/admin_users?select=id,store_name,store_logo,store_address,store_phone&id=in.(${merchantIds.join(',')})`, {
                    headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` }
                });
                if (merchantsRes.ok) merchants = await merchantsRes.json();
            }

            // Assemble final do estado com compatibilidade de legados
            const mergedData = slots.map((slot: any) => ({
                ...slot,
                admin_users: merchants?.find(m => m.id === slot.merchant_id) || { store_name: 'Parceiro Izi' }
            }));

            setDedicatedSlots(mergedData);
        } catch (err: any) {
            console.error("[CRITICAL] Falha na sincronização de vagas:", err.message);
            // Mantém o estado anterior em caso de erro de rede momentâneo
        }
    }, []);

    const [activeTab, setActiveTab] = useState<View>(() => (localStorage.getItem('izi_driver_active_tab') as View) || 'dashboard');
    const activeTabRef = useRef(activeTab);
    useEffect(() => { 
        activeTabRef.current = activeTab; 
        localStorage.setItem('izi_driver_active_tab', activeTab);
    }, [activeTab]);

    const isOnlineRef = useRef(false);
    const [isOnline, setIsOnline] = useState(() => {
        const val = localStorage.getItem('izi_driver_online') === 'true';
        isOnlineRef.current = val;
        return val;
    });
    useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

    // Vigilante de Som (Padrão Lojista - Alta Confiabilidade)
    const heardOrderIds = useRef<Set<string>>(new Set());
    const isFirstLoad = useRef(true);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Se a lista estiver vazia, apenas desativamos a flag de primeiro carregamento
        // Isso garante que quando a PRIMEIRA missão chegar, ela toque o som.
        if (orders.length === 0) {
            if (isFirstLoad.current) {
                isFirstLoad.current = false;
                console.log('[SOM-WATCHER] Vigilante pronto. Lista inicial vazia.');
            }
            return;
        }

        // Se for o primeiro carregamento e já houver pedidos (ex: refresh com pedidos na tela)
        // apenas absorvemos os IDs para não tocar som de pedidos "velhos"
        if (isFirstLoad.current) {
            orders.forEach(o => heardOrderIds.current.add(o.realId || o.id));
            isFirstLoad.current = false;
            console.log(`[SOM-WATCHER] Vigilante inicializado com ${heardOrderIds.current.size} missões conhecidas.`);
            return;
        }

        // Filtrar apenas o que ainda não ouvimos
        const newOrders = orders.filter(o => !heardOrderIds.current.has(o.realId || o.id));
        
        if (newOrders.length > 0) {
            console.log(`[SOM-WATCHER] ðŸ”Š ${newOrders.length} novas missões detectadas.`);
            
            // Marcar como conhecidas imediatamente
            newOrders.forEach(o => heardOrderIds.current.add(o.realId || o.id));

            // Tocar som se estiver online e disponível
            if (isOnlineRef.current && !activeMissionRef.current) {
                playIziSound('driver');
                
                if (window.Notification && Notification.permission === 'granted') {
                    new Notification('ðŸš€ Nova Missão Izi!', {
                        body: `R$ ${newOrders[0].price?.toFixed(2) || '0,00'} â€¢ ${newOrders[0].origin || 'Entrega nova'}`,
                        icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png'
                    });
                }
            }
        }
    }, [orders, isAuthenticated]);

    const [finishedMissionData, setFinishedMissionData] = useState<{
        show: boolean, 
        amount: number,
        grossAmount?: number,
        baseValue?: number,
        extraKmValue?: number,
        distance?: number,
        cashDiscount?: number,
        xpGained?: number
    } | null>(null);

    const driverIdRef = useRef(driverId);
    useEffect(() => { driverIdRef.current = driverId; }, [driverId]);

    const isFirstRender = useRef(true);
    const hasLoadedOnlineStatus = useRef(false); // Impede que refreshes de token sobrescrevam o status
    const hasBootedRef = useRef(false);
    const isLoggingOutRef = useRef(false); // Garante que syncMissionWithDB e restauração sÂ³ ocorrem 1x por sessão
    const lastLocationUpdateRef = useRef<number>(0); // Throttle de update de GPS no banco
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);
    const [filter, setFilter] = useState<ServiceType | 'all'>('all');
    const [dedicatedSlots, setDedicatedSlots] = useState<any[]>([]);
    const [audioBlocked, setAudioBlocked] = useState(false);
    const [overlayBlocked, setOverlayBlocked] = useState(false);
    const [overlayBannerDismissed, setOverlayBannerDismissed] = useState(false);

    // Verificar periodicamente se a permissão de sobreposição foi concedida
    useEffect(() => {
        if (Capacitor.getPlatform() !== 'android') return;
        const checkOverlay = async () => {
            try {
                // Se o plugin não existir, usa o estado padrão (precisa verificar via Native)
                // Fallback: se não foi granted ainda, mostra banner
                const granted = (await ForegroundService.checkManageOverlayPermission()).granted;
                setOverlayBlocked(!granted);
                if (granted) {
                    setOverlayBannerDismissed(false);
                }
            } catch {
                // Sem plugin nativo â€” verifica via flag no localStorage
                setOverlayBlocked(true);
            }
        };
        checkOverlay();
        const interval = setInterval(checkOverlay, 5000);
        return () => clearInterval(interval);
    }, []);

    const openOverlaySettings = async () => {
        if (Capacitor.getPlatform() !== 'android') {
            toastError("Recurso disponível apenas em dispositivos Android.");
            return;
        }

        try {
            // Abre diretamente a tela de configurações de overlay via Capacitor App
            const { granted } = await ForegroundService.checkManageOverlayPermission();
            if (granted) {
                setOverlayBlocked(false);
                setOverlayBannerDismissed(false);
                toastSuccess("A permissão de sobreposição já está ativa!");
                return;
            }
            setOverlayBannerDismissed(false);
            const result = await ForegroundService.requestManageOverlayPermission();
            const grantedAfterRequest = result?.granted === true;
            setOverlayBlocked(!grantedAfterRequest);
            if (grantedAfterRequest) {
                toastSuccess("Permissão de sobreposição ativada com sucesso!");
            }
        } catch (e) {
            console.warn('[OVERLAY] Não foi possível abrir configurações:', e);
            toastError("Não foi possível abrir as configurações de sobreposição.");
        }
    };

    // Efeito para checar se o áudio está bloqueado
    useEffect(() => {
        const checkAudio = () => {
            if (typeof window !== 'undefined') {
                const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext);
                if (AudioContextClass) {
                    const ctx = new AudioContextClass();
                    
                    // No web normal, suspended é o gatilho. No APK, as vezes o estado inicia como running 
                    // mas requer interação. Forçamos a exibição se for nativo e não houver flag de desbloqueio.
                    const isNative = Capacitor.isNativePlatform();
                    const hasUnlocked = localStorage.getItem('izi_audio_unlocked') === 'true';

                    if (ctx.state === 'suspended' || (isNative && !hasUnlocked)) {
                        setAudioBlocked(true);
                    }
                    ctx.close();
                }
            }
        };
        checkAudio();
    }, []);

    const enableAudioManually = () => {
        playIziSound('success');
        setAudioBlocked(false);
        localStorage.setItem('izi_audio_unlocked', 'true');
        toastSuccess('Notificações sonoras ativas!');
    };

    const [myApplications, setMyApplications] = useState<any[]>(() => {
        const uid = localStorage.getItem('izi_driver_uid');
        if (!uid) return [];
        const cached = localStorage.getItem(`izi_apps_${uid}`);
        try { return cached ? JSON.parse(cached) : []; } catch { return []; }
    });
    const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
    const [applyingSlotId, setApplyingSlotId] = useState<string | null>(null);
    const [showSlotAppliedSuccess, setShowSlotAppliedSuccess] = useState(false);
    const [showApprovedSlotModal, setShowApprovedSlotModal] = useState(false);
    const [approvedSlotData, setApprovedSlotData] = useState<any>(null);
    const [scheduledOrders, setScheduledOrders] = useState<any[]>([]);
    const [subTabScheduled, setSubTabScheduled] = useState<'available' | 'confirmed'>('confirmed');
    const [selectedScheduledOrder, setSelectedScheduledOrder] = useState<any | null>(null);
    const [history, setHistory] = useState<Order[]>([]);
    const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);
    const [calculatedDistance, setCalculatedDistance] = useState<string | null>(null);
    const [modalRoutePolyline, setModalRoutePolyline] = useState<string | null>(null);
    const [modalRouteInfo, setModalRouteInfo] = useState<{start: any, end: any} | null>(null);
    const [merchantCoords, setMerchantCoords] = useState<{lat: number, lng: number} | null>(null);
    const [stats, setStats] = useState({ balance: 0, today: 0, weekly: 0, totalEarnings: 0, count: 0, level: 1, xp: 0, nextXp: 100, performance: [0, 0, 0, 0, 0, 0, 0] });
    const [earningsHistory, setEarningsHistory] = useState<Order[]>([]);
    const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
    const [isFinanceLoading, setIsFinanceLoading] = useState(false);
    const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
    const [isSavingPix, setIsSavingPix] = useState(false);
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showWithdrawHistory, setShowWithdrawHistory] = useState(false);
    const [showWithdrawDetail, setShowWithdrawDetail] = useState(false);
    const [selectedWithdraw, setSelectedWithdraw] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [confirmPaymentState, setConfirmPaymentState] = useState<{
        show: boolean,
        resolve: (method: string | false) => void,
        mission: any,
        isCashWarning?: boolean
    } | null>(null);

    const showConfirmPaymentMethod = (mission: any) => {
        return new Promise<string | false>((resolve) => {
            setConfirmPaymentState({ show: true, resolve, mission });
        });
    };
    const [pixKey, setPixKey] = useState(() => localStorage.getItem('izi_driver_pix') || '');
    const [bankName, setBankName] = useState(() => localStorage.getItem('izi_driver_bank_name') || '');
    const [isEditingPix, setIsEditingPix] = useState(false);
    const [showBankDetails, setShowBankDetails] = useState(false);
    const [showPlateModal, setShowPlateModal] = useState(false);
    const [isEditingPlate, setIsEditingPlate] = useState(false);
    const [isSavingPlate, setIsSavingPlate] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);

    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedReceiptUrl, setSelectedReceiptUrl] = useState('');

    // Preferências do entregador
    const [prefSoundEnabled, setPrefSoundEnabled] = useState(() => localStorage.getItem('pref_sound') !== 'false');
    const [prefVibrationEnabled, setPrefVibrationEnabled] = useState(() => localStorage.getItem('pref_vibration') !== 'false');
    const [prefNavApp, setPrefNavApp] = useState<'google' | 'waze' | 'apple'>(() => (localStorage.getItem('pref_nav_app') as any) || 'google');
    const [prefVehicleTypes, setPrefVehicleTypes] = useState<string[]>(() => {
        try { return JSON.parse(localStorage.getItem('pref_vehicle') || '["moto"]'); } catch { return ['moto']; }
    });
    const prefVehicleTypesRef = useRef(prefVehicleTypes);
    useEffect(() => { prefVehicleTypesRef.current = prefVehicleTypes; }, [prefVehicleTypes]);

    const [prefServiceTypes, setPrefServiceTypes] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('pref_services');
            if (saved) return JSON.parse(saved);
            const def = ['all_services'];
            localStorage.setItem('pref_services', JSON.stringify(def));
            return def;
        } catch { return ['all_services']; }
    });
    const prefServiceTypesRef = useRef(prefServiceTypes);
    useEffect(() => { prefServiceTypesRef.current = prefServiceTypes; }, [prefServiceTypes]);
    const [prefMaxRadius, setPrefMaxRadius] = useState<number>(() => Number(localStorage.getItem('pref_max_radius') || 10));

    


    const clearDriverSessionState = useCallback(() => {
        // Captura o ID atual antes de limpar para remover o cache específico
        const currentUid = driverId || localStorage.getItem('izi_driver_uid');

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
        setShowReceipt(false);
        setSelectedReceiptUrl('');

        // Remove chaves críticas de sessão
        const keysToRemove = [
            'izi_driver_authenticated',
            'izi_driver_uid',
            'izi_driver_name',
            'izi_driver_pix',
            'izi_driver_avatar',
            'izi_driver_vehicle',
            'izi_driver_active_tab',
            'Izi_active_mission',
            'Izi_declined_slots',
            'Izi_declined_timed',
            'Izi_online',
            'izi_audio_unlocked'
        ];

        if (currentUid) {
            keysToRemove.push(`izi_apps_${currentUid}`);
        }

        // Limpa chaves do Supabase para o projeto atual
        const project = (supabaseUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1]);
        if (project) {
            keysToRemove.push(`sb-${project}-auth-token`);
        }

        keysToRemove.forEach(k => localStorage.removeItem(k));
        
        // Limpeza agressiva de qualquer chave remanescente do Supabase (opcional mas recomendado)
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
                localStorage.removeItem(key);
            }
        });
        sessionStorage.clear();
    }, [driverId, supabaseUrl]);

    const handleScanQR = async () => {
        try {
            await BarcodeScanner.requestPermissions();
            document.querySelector('body')?.classList.add('barcode-scanner-active');
            setIsScanning(true);
            const { barcodes } = await BarcodeScanner.scan();
            document.querySelector('body')?.classList.remove('barcode-scanner-active');
            setIsScanning(false);
            if (barcodes.length > 0) {
                const scannedContent = barcodes[0].rawValue;
                toastSuccess(`QR Code Lido: ${scannedContent}`);
                // Lógica customizada de verificação de pacote caso necessário
            }
        } catch (e) {
            console.error("Erro no Scanner:", e);
            document.querySelector('body')?.classList.remove('barcode-scanner-active');
            setIsScanning(false);
            toastError("Erro ao iniciar a câmera nativa");
        }
    };

    const stopScan = async () => {
        setIsScanning(false);
        document.querySelector('body')?.classList.remove('barcode-scanner-active');
        await BarcodeScanner.stopScan();
    };

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

    // Sincronizar detalhe da vaga aberta com o Realtime
    useEffect(() => {
        if (selectedSlot) {
            const fresh = dedicatedSlots.find(s => s.id === selectedSlot.id);
            if (fresh) {
                // Só atualiza se houver mudança real para evitar re-renders infinitos
                if (JSON.stringify(fresh.slot_applications) !== JSON.stringify(selectedSlot.slot_applications)) {
                    setSelectedSlot(fresh);
                }
            }
        }
    }, [dedicatedSlots]);
    
    // Efeito para calcular distância e rota quando um pedido é selecionado
    useEffect(() => {
        if (!selectedOrder || !showOrderModal) {
            setCalculatedDistance(null);
            setModalRoutePolyline(null);
            setModalRouteInfo(null);
            return;
        }

        const fetchDistanceAndRoute = async () => {
            try {
                if (!window.google || !driverCoords) return;
                
                // Pontos de interesse - Fallback robusto para lat/lng
                const isAtDelivery = ['picked_up', 'em_rota', 'saiu_para_entrega'].includes(selectedOrder.status || '');
                
                const targetLat = isAtDelivery 
                    ? (selectedOrder.customer_lat || selectedOrder.delivery_lat || selectedOrder.latitude) 
                    : (selectedOrder.merchant_lat || selectedOrder.pickup_lat || selectedOrder.latitude);
                
                const targetLng = isAtDelivery 
                    ? (selectedOrder.customer_lng || selectedOrder.delivery_lng || selectedOrder.longitude) 
                    : (selectedOrder.merchant_lng || selectedOrder.pickup_lng || selectedOrder.longitude);
                
                if (!targetLat || !targetLng || isNaN(Number(targetLat))) {
                    console.warn('[DISTANCE] Coordenadas de destino inválidas:', { targetLat, targetLng });
                    return;
                }
                
                const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Goog-Api-Key': mapsKey,
                      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline,routes.legs'
                    },
                    body: JSON.stringify({
                      origin: { location: { latLng: { latitude: driverCoords.lat, longitude: driverCoords.lng } } },
                      destination: { location: { latLng: { latitude: Number(targetLat), longitude: Number(targetLng) } } },
                      travelMode: 'DRIVE',
                      routingPreference: 'TRAFFIC_AWARE',
                      units: 'METRIC',
                      languageCode: 'pt-BR'
                    })
                });

                const data = await res.json();
                if (data.routes?.[0]) {
                    const route = data.routes[0];
                    if (route.polyline?.encodedPolyline) {
                        setModalRoutePolyline(route.polyline.encodedPolyline);
                    }
                    
                    if (route.legs?.[0]) {
                        const leg = route.legs[0];
                        setModalRouteInfo({
                            start: { lat: leg.startLocation.latLng.latitude, lng: leg.startLocation.latLng.longitude },
                            end: { lat: leg.endLocation.latLng.latitude, lng: leg.endLocation.latLng.longitude }
                        });
                    }

                    if (route.distanceMeters !== undefined) {
                        setCalculatedDistance((route.distanceMeters / 1000).toFixed(1) + ' km');
                    }
                } else {
                    console.warn('[DISTANCE] Nenhuma rota encontrada');
                    setCalculatedDistance(selectedOrder.distance || 'Distância indisponível');
                }
            } catch (err) {
                console.error('[DISTANCE] Erro ao calcular:', err);
            }
        };

        fetchDistanceAndRoute();
    }, [selectedOrder, showOrderModal, driverCoords]);

    // Limpar modal ao trocar de aba ou sair
    useEffect(() => {
        if (activeTab !== 'dashboard') {
            setShowOrderModal(false);
            setSelectedOrder(null);
        }
    }, [activeTab]);

    const getPaymentLabel = (order: any) => {
        if (!order) return 'Não informado';
        if (order.payment_method === 'online') return 'Pagamento Online';
        
        // Mapeamento comum
        const map: Record<string, string> = {
            'dinheiro': 'Dinheiro (Local)',
            'pix': 'PIX (Local)',
            'cartao_credito': 'Cartão de Crédito',
            'cartao_debito': 'Cartão de Débito',
            'maquininha': 'Cartão (Maquininha)',
            'wallet': 'Carteira Izi',
            'not_required': 'Não requerido'
        };
        
        return map[order.payment_method] || order.payment_method_label || (order.payment_method ? order.payment_method.charAt(0).toUpperCase() + order.payment_method.slice(1).replace('_', ' ') : 'Local');
    };

    const getGrossEarnings = useCallback((order: any) => {
        if (!order) return 0;
        
        const rawType = order.service_type || order.type || 'generic';
        const type = normalizeServiceType(rawType);
        
        let minGuaranteed = 0;
        if (type === 'restaurant') {
            minGuaranteed = Number(dynamicRates?.food_min || appSettings?.base_fee || 7);
        } else if (type === 'market') {
            minGuaranteed = Number(dynamicRates?.market_min || dynamicRates?.food_min || appSettings?.base_fee || 7);
        } else if (type === 'pharmacy') {
            minGuaranteed = Number(dynamicRates?.pharmacy_min || dynamicRates?.food_min || appSettings?.base_fee || 7);
        } else if (type === 'beverages') {
            minGuaranteed = Number(dynamicRates?.beverages_min || dynamicRates?.food_min || appSettings?.base_fee || 7);
        } else if (type === 'mototaxi') {
            minGuaranteed = Number(dynamicRates?.mototaxi_min || 6);
        } else if (['car_ride', 'motorista_particular'].includes(type)) {
            minGuaranteed = Number(dynamicRates?.carro_min || 14);
        } else {
            minGuaranteed = Number(appSettings?.base_fee || 7);
        }

        const isMobility = ['mototaxi', 'car_ride', 'frete', 'logistica', 'motorista_particular', 'van', 'utilitario', 'motoboy'].includes(type);
        
        let base = 0;
        if (isMobility) {
            base = Number(order.delivery_fee || order.total_price || order.price || 0);
        } else {
            const deliveryFee = Number(order.delivery_fee || 0);
            base = Math.max(deliveryFee, minGuaranteed);
        }

        if (base <= 0) base = Number(appSettings?.base_fee || 7);
        return Number(base.toFixed(2));
    }, [appSettings, dynamicRates]);

    const getNetEarnings = useCallback((order: any) => {
        if (!order) return 0;
        
        const rawType = order.service_type || order.type || 'generic';
        const type = normalizeServiceType(rawType);
        
        // Verificação de pagamento em dinheiro
        const driverBaseAmount = getGrossEarnings(order);
        const deliveryCommission = Number(appSettings?.driver_freight_commission ?? appSettings?.app_commission ?? 7);
        const privateDriverCommission = Number(appSettings?.private_driver_commission ?? appSettings?.driver_freight_commission ?? appSettings?.app_commission ?? 7);
        const isPrivateDriver = ['car_ride', 'motorista_particular'].includes(type);
        
        const commission = isPrivateDriver ? privateDriverCommission : deliveryCommission;
        const finalNet = driverBaseAmount * (1 - (commission / 100));

        return Number(finalNet.toFixed(2));
    }, [appSettings, dynamicRates, getGrossEarnings]);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        
        const registerPush = async () => {
             if (!Capacitor.isNativePlatform()) {
                 console.log('[PUSH] Pulando registro: ambiente WEB detectado.');
                 return;
             }
             try {
                 // Verificamos permissões antes
                 let permStatus = await PushNotifications.checkPermissions();
                 if (permStatus.receive === 'prompt') {
                     permStatus = await PushNotifications.requestPermissions();
                 }

                 if (permStatus.receive !== 'granted') {
                      console.warn('Permissão de Push Notification negada.');
                      return;
                  }

                  if (Capacitor.getPlatform() === 'android') {
                      await PushNotifications.createChannel({
                          id: 'mission_calls',
                          name: 'Chamadas de Missão',
                          description: 'Canal para alertas de novos pedidos e missões',
                          sound: 'notification',
                          importance: 5,
                          visibility: 1,
                          vibration: true
                      });
                  }

                  await PushNotifications.register();

                 // Listeners do registro nativo
                 PushNotifications.addListener('registration', async (token) => {
                     console.log('Firebase Cloud Messaging Token:', token.value);
                     // Atualiza a coluna no supabase
                     await supabase.from('drivers_delivery').update({ push_token: token.value }).eq('id', driverId);
                 });

                 PushNotifications.addListener('registrationError', (error) => {
                     console.error('Erro no registro do Push Notification:', error);
                 });

                 PushNotifications.addListener('pushNotificationReceived', async (notification) => {
                     console.log('Push recebida via Firebase', notification);
                     playIziSound('driver');
                     
                     // Se receber notificação de novo pedido ou chamada, trazer o app para o primeiro plano (Pop-up)
                     if (notification.data?.type === 'new_order' || notification.title?.toLowerCase().includes('chamada') || notification.body?.toLowerCase().includes('chamada')) {
                         if (Capacitor.getPlatform() === 'android') {
                             try {
                                 // Tenta trazer o app para frente
                                 await ForegroundService.moveToForeground();
                                 console.log('[PUSH] App trazido para o primeiro plano com sucesso.');
                                 
                                 // Garante que o som toque mesmo que o sistema de notificações demore
                                 const audio = new Audio('/sounds/notification.mp3');
                                 audio.play().catch(e => console.warn('Erro ao tocar som manual:', e));
                             } catch (err) {
                                 console.warn('[PUSH] Falha ao trazer para o primeiro plano. Talvez falte permissão de sobreposição:', err);
                             }
                         }

                         setOrders(prev => {
                            // lógica para adicionar o pedido se não estiver na lista ou disparar refresh
                            return prev;
                         });
                     }
                     toastSuccess(`Nova Chamada: ${notification.title || ''}`);
                 });

                 PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
                     console.log('Usuário clicou na notificação', notification);
                     // Se o usuário clicar, trazer para o dashboard ou aba ativa
                     setActiveTab('dashboard');
                 });

             } catch (err) {
                 console.error("Falha ao configurar Push Notifications:", err);
             }
        };
        
        const checkOverlayPermission = async () => {
            if (Capacitor.getPlatform() === 'android') {
                console.log("Verificando permissão de sobreposição...");
                // Lembrete visual para o motorista sobre a importância da sobreposição para receber chamadas
                setTimeout(() => {
                    if (isOnline) {
                        toast('Dica: Ative a "Sobreposição a outros apps" nas configurações do Android para não perder nenhuma chamada!', 'info');
                    }
                }, 5000);
            }
        };

        registerPush();
        checkOverlayPermission();

        return () => {
             if (Capacitor.isNativePlatform()) {
                 PushNotifications.removeAllListeners();
             }
        };
    }, [isAuthenticated, driverId]);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        // Permite GPS se estiver ONLINE ou em uma MISSÃƒÆ’Ã‚Â¢ÃƒÂ¢â‚¬ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…Â¾Â¢O ATIVA
        if (!isOnline && !activeMission) return;
        
        const updateLocation = (lat: number, lng: number) => {
          setDriverCoords({ lat, lng });
          // Throttle: atualiza o banco no máximo a cada 15 segundos para não saturar HTTP
          const now = Date.now();
          if (now - lastLocationUpdateRef.current > 15000) {
              lastLocationUpdateRef.current = now;
              supabase.from('drivers_delivery').update({ lat, lng }).eq('id', driverId);
          }
        };

        let watchId: string | undefined;
        let webWatchId: number | undefined;

        const startNativeTracking = async () => {
            // ── AMBIENTE NATIVO (APK Android/iOS) ──
            if (Capacitor.isNativePlatform()) {
                try {
                    const permissions = await Geolocation.checkPermissions();
                    if (permissions.location !== 'granted') {
                        await Geolocation.requestPermissions();
                    }

                    // Posição imediata para agilizar a primeira abertura do mapa
                    const pos = await Geolocation.getCurrentPosition({ 
                        enableHighAccuracy: true,
                        timeout: 20000,
                        maximumAge: 10000
                    }).catch(() => Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 10000 }));
                    
                    if (pos) await updateLocation(pos.coords.latitude, pos.coords.longitude);

                    // Watch contínuo
                    watchId = await Geolocation.watchPosition(
                        { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 },
                        (position) => {
                            if (position) {
                                updateLocation(position.coords.latitude, position.coords.longitude);
                            }
                        }
                    );
                } catch (err) {
                    console.error("GPS Tracking Error (Native):", err);
                }
                return;
            }

            // ── AMBIENTE WEB (browser) ─ usa API nativa do browser ──
            if (!navigator.geolocation) {
                console.warn('[GPS] navigator.geolocation não disponível neste browser.');
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
                (err) => console.warn('[GPS-WEB] Erro ao obter posição inicial:', err.message),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );

            webWatchId = navigator.geolocation.watchPosition(
                (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
                (err) => console.warn('[GPS-WEB] Erro no watchPosition:', err.message),
                { enableHighAccuracy: true, maximumAge: 15000, timeout: 30000 }
            );
        };

        startNativeTracking();
        
        return () => {
             if (watchId && Capacitor.isNativePlatform()) {
                 Geolocation.clearWatch({ id: watchId });
             }
             if (webWatchId !== undefined) {
                 navigator.geolocation.clearWatch(webWatchId);
             }
        };
    }, [isAuthenticated, driverId, isOnline, activeMission]);


    useEffect(() => {

        // O listener de transmissões foi movido para um useEffect dedicado abaixo.


        // Check initial Supabase session
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.error('[AUTH] Erro ao verificar sessão inicial:', error.message);
                    if (error.message.includes("Refresh Token Not Found") || error.message.includes("invalid_refresh_token")) {
                        console.warn("[AUTH] Refresh token inválido detectado no boot. Limpando...");
                        clearDriverSessionState();
                        return;
                    }
                }
                const user = session?.user;
                if (user) {
                    setDriverId(user.id);
                    setIsAuthenticated(true);
                    const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Entregador';
                    setDriverName(name);
                    ensureDriverRecord(user.id, user.email || '', name);
                } else {
                    // Se não tem sessão no Supabase, garantimos que o driverId do estado esteja nulo
                    // Mas NÃO limpamos o localStorage aqui para não interferir com o handleLogout
                    setDriverId(null);
                    setIsAuthenticated(false);
                }
            } catch (e: any) {
                console.error('[AUTH] Erro ao verificar sessão inicial:', e);
                if (e.message?.includes("Refresh Token Not Found")) {
                    clearDriverSessionState();
                }
            } finally {
                setAuthInitLoading(false);
            }
        };

        checkSession();

        const authTimeout = setTimeout(() => setAuthInitLoading(false), 5000);

        return () => {
            clearTimeout(authTimeout);
        };
    }, []);

    // Effect dedicado para Transmissões Administrativas (Popups)
    useEffect(() => {
        if (!driverId) return;

        const initBroadcasts = async () => {
            const { data } = await supabase
                .from('broadcast_notifications')
                .select('*')
                .eq('status', 'sent')
                .in('type', ['popup', 'both'])
                .in('target_type', ['all', 'drivers'])
                .order('created_at', { ascending: false })
                .limit(1);
            
            if (data && data[0]) {
                const lastSeen = localStorage.getItem('last_izi_broadcast_driver');
                if (lastSeen !== data[0].id) {
                    setActiveBroadcast(data[0]);
                }
            }
        };

        initBroadcasts();

        const broadcastSub = supabase
            .channel(`broadcast-notifs-${driverId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'broadcast_notifications' 
            }, (payload) => {
                const notif = payload.new;
                if ((notif.type === 'popup' || notif.type === 'both') && 
                    (notif.target_type === 'all' || notif.target_type === 'drivers')) {
                    setActiveBroadcast(notif);
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(broadcastSub);
        };
    }, [driverId]);

    useEffect(() => {
        // Timeout de segurança: garante que o app saia da tela de boot mesmo se houver erro de rede/supabase
        const authTimeout = setTimeout(() => setAuthInitLoading(false), 5000);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("[AUTH] Evento Entregador:", event);
            
            if (event === 'SIGNED_OUT' || (event === 'TOKEN_REFRESHED' && !session)) {
                setIsAuthenticated(false);
                setDriverId(null);
                setAuthInitLoading(false);
                return;
            }

            const user = session?.user;
            if (user) {
                setDriverId(user.id);
                setIsAuthenticated(true);

                // BOOT ÃƒÆ’Ã‚Â¢ÃƒÂ¢â‚¬Â¦áNICO: sÂ³ executa restauração completa na primeira vez
                if (!hasBootedRef.current) {
                    hasBootedRef.current = true;
                    console.log('[AUTH] Primeiro boot detectado. Carregando perfil...');

                    // Buscar perfil apenas para nome e chave pix (NÃO tocar no is_online aqui)
                    const { data: profile } = await supabase
                        .from('drivers_delivery')
                        .select('name, bank_info, avatar_url, license_plate, preferences')
                        .eq('id', user.id)
                        .single();

                    if (profile) {
                        setDriverName(profile.name || 'Entregador');
                        setPixKey(profile.bank_info?.pix_key || '');
                        setDriverPlate(profile.license_plate || '');
                        if (profile.license_plate) localStorage.setItem('izi_driver_plate', profile.license_plate);
                        setDriverAvatar(profile.avatar_url || null);
                        if (profile.avatar_url) localStorage.setItem('izi_driver_avatar', profile.avatar_url);
                        else localStorage.removeItem('izi_driver_avatar');

                        if (profile.preferences) {
                            const p = profile.preferences as any;
                            if (p.pref_sound !== undefined) {
                                setPrefSoundEnabled(p.pref_sound);
                                localStorage.setItem('pref_sound', String(p.pref_sound));
                            }
                            if (p.pref_vibration !== undefined) {
                                setPrefVibrationEnabled(p.pref_vibration);
                                localStorage.setItem('pref_vibration', String(p.pref_vibration));
                            }
                            if (p.pref_nav_app !== undefined) {
                                setPrefNavApp(p.pref_nav_app);
                                localStorage.setItem('pref_nav_app', p.pref_nav_app);
                            }
                            if (p.pref_max_radius !== undefined) {
                                setPrefMaxRadius(p.pref_max_radius);
                                localStorage.setItem('pref_max_radius', String(p.pref_max_radius));
                            }
                            if (p.pref_vehicle) {
                                setPrefVehicleTypes(p.pref_vehicle);
                                localStorage.setItem('pref_vehicle', JSON.stringify(p.pref_vehicle));
                            }
                            if (p.pref_services) {
                                setPrefServiceTypes(p.pref_services);
                                localStorage.setItem('pref_services', JSON.stringify(p.pref_services));
                            }
                        }
                    } else {
                        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Entregador';
                        setDriverName(name);
                        ensureDriverRecord(user.id, user.email || '', name);
                    }

                    refreshFinanceData();
                    
                    syncMissionWithDB();
                } else {
                    // Renovações de token (TOKEN_REFRESHED): NÃƒÆ’Ã‚Â¢ÃƒÂ¢â‚¬ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…Â¾Â¢O alterar nenhum estado
                    console.log('[AUTH] Renovação de token. Ignorando reset de estado.');
                }
            } else {
                if (hasBootedRef.current) {
                    console.warn('[AUTH] SIGNED_OUT detectado. Limpando sessão...');
                    hasBootedRef.current = false;
                    setDriverId(null);
                    setIsAuthenticated(false);
                    setDriverName('Entregador');
                    setDriverAvatar(null);
                    localStorage.removeItem('izi_driver_avatar');
                    localStorage.removeItem('izi_driver_uid');
                    localStorage.removeItem('izi_driver_authenticated');
                    localStorage.removeItem('izi_driver_name');
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
                setDriverVehicle(authVehicle);
            }
        } catch (e: any) {
            setAuthError(e.message?.includes('already registered') ? 'Este email já está cadastrado. Faça login.' : e.message);
        } finally { setAuthLoading(false); }
    };





    // =====================================================================
    // RESTAURAÂ¢ÃƒÆ’Ã†â€™Â¢Â¬áÃƒÆ’Ã‚Â¢ÃƒÂ¢â‚¬ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…Â¾Â¢O DE STATUS ONLINE: useEffect EXCLUSIVO e AUTORITATIVO
    // Este é o ÃƒÆ’Ã‚Â¢ÃƒÂ¢â‚¬Â¦áNICO lugar onde o is_online é restaurado apÂ³s login/refresh.
    // Ele dispara quando driverId e isAuthenticated ficam disponíveis.
    // =====================================================================
    useEffect(() => {
        if (!driverId || !isAuthenticated) return;

        const localWantsOnline = localStorage.getItem('Izi_online') === 'true';
        console.log(`[ONLINE-RESTORE] Autenticado! localStorage diz online=${localWantsOnline}`);

        // Setar estado local imediatamente (sem depender do banco)
        setIsOnline(localWantsOnline);

        // Restaurar Foreground Service se estiver online
        if (Capacitor.getPlatform() === 'android' && localWantsOnline) {
             ForegroundService.startForegroundService({
                id: 1001,
                title: "Izi Pilot: Online",
                body: "Buscando novas chamadas em tempo real..."
            }).catch(e => console.error("Erro ao restaurar FS:", e));
        }

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

        // SALVA NO LOCALSTORAGE IMEDIATAMENTE Â¢Â¢ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’ââ‚¬Â¦áÂ¬Â¢ÃƒÆ’Ã†â€™Â¢Â¬ antes de qualquer chamada ao banco
        // Isso garante que F5 sempre restaura o status correto, independente de rede
        localStorage.setItem('Izi_online', nextState.toString());
        setIsOnline(nextState);
        if (!nextState) setOrders([]);
        
        if (driverId) {
            try {
                const updatePayload = nextState 
                    ? { is_online: true, last_seen_at: new Date().toISOString() }
                    : { is_online: false };
                await supabase.from('drivers_delivery').update(updatePayload).eq('id', driverId);
                console.log(`[STATUS] ${nextState ? 'ONLINE' : 'OFFLINE'} - banco e storage sincronizados`);

                // Gerenciar Foreground Service para o Moto-entregador
                if (Capacitor.getPlatform() === 'android') {
                    try {
                        if (nextState) {
                            await ForegroundService.startForegroundService({
                                id: 1001,
                                title: "Izi Pilot: Online",
                                body: "Buscando novas chamadas em tempo real..."
                            });
                        } else {
                            await ForegroundService.stopForegroundService();
                        }
                    } catch (fsErr) {
                        console.error("Erro ao gerenciar Foreground Service:", fsErr);
                    }
                }
            } catch (e: any) {
                console.warn('[STATUS] Falha ao sincronizar banco (storage preservado):', e.message);
                // NÃƒÆ’Ã‚Â¢ÃƒÂ¢â‚¬ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…Â¾Â¢O reverte Â¢Â¢ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’ââ‚¬Â¦áÂ¬Â¢ÃƒÆ’Ã†â€™Â¢Â¬ o localStorage já salvou a intenção e o heartbeat sincronizará o banco
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
        setIsSyncingMission(true);
        setIsSyncing(true); // Ativa o spinner global de sincronização
        toast('Sincronizando dados com o servidor...', 'info');
        try {
            // 0. Recarregar Pedidos Disponíveis e Dados Financeiros
            await Promise.all([
                fetchOrders(),
                refreshFinanceData()
            ]);

            console.log('[SYNC] Sincronizando missão ativa do banco...');
            const dId = String(driverId).trim();
            const orders = await fetchFromDB('orders_delivery', `driver_id=eq.${dId}&order=created_at.desc&limit=10`);

            const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
            const activeOrder = orders?.find((o: any) => 
                !['concluido', 'cancelado', 'pendente_pagamento', 'finalizado', 'entregue', 'delivered'].includes(o.status.toLowerCase()) &&
                !financialTypes.includes(o.service_type) &&
                o.driver_id === dId // RIGOROSO: SÂ³ é missão ativa se for MINHA
            );

            if (activeOrder) {
                // NOVO: Buscar endereço oficial e atualizado do Lojista no banco de dados
                let officialPickupAddress = activeOrder.pickup_address || 'Origem';
                let officialPickupLat = activeOrder.pickup_lat;
                let officialPickupLng = activeOrder.pickup_lng;

                if (activeOrder.merchant_id || activeOrder.merchant_name) {
                    try {
                        let mData = null;
                        
                        // 1. Tentar por ID (Mais preciso)
                        if (activeOrder.merchant_id) {
                            const data = await fetchFromDB('admin_users', `select=store_address,latitude,longitude,store_name&id=eq.${activeOrder.merchant_id}&limit=1`);
                            mData = data && data.length > 0 ? data[0] : null;
                        }
                        
                        // 2. Tentar por Nome (Fallback caso ID falhe ou mude)
                        if (!mData && activeOrder.merchant_name) {
                            const encName = encodeURIComponent(`%${activeOrder.merchant_name}%`);
                            const data = await fetchFromDB('admin_users', `select=store_address,latitude,longitude,store_name&store_name=ilike.${encName}&limit=1`);
                            mData = data && data.length > 0 ? data[0] : null;
                        }
                        
                        if (mData) {
                            if (mData.store_address) officialPickupAddress = mData.store_address;
                            if (mData.latitude && mData.longitude) {
                                officialPickupLat = Number(mData.latitude);
                                officialPickupLng = Number(mData.longitude);
                                console.log('[SYNC] Coordenadas oficiais encontradas:', officialPickupLat, officialPickupLng);
                            }
                        }

                        // 3. Fallback Crítico para "Paladar" (Segurança contra redirecionamento RS)
                        if (!officialPickupLat || Math.abs(Number(officialPickupLat)) < 0.1) {
                            const nameLower = (activeOrder.merchant_name || activeOrder.pickup_address || "").toLowerCase();
                            if (nameLower.includes('paladar')) {
                                console.log('[SYNC] Aplicando hard-fallback para Paladar Brumadinho');
                                officialPickupLat = -20.1435361;
                                officialPickupLng = -44.2169737;
                                officialPickupAddress = "R. Henri Karam, 640 - Presidente Barroca, Brumadinho - MG";
                            }
                        }
                    } catch (mErr) {
                        console.warn('[SYNC] Falha ao buscar endereço atualizado do lojista:', mErr);
                    }
                }

                const mission: any = { 
                    ...activeOrder, 
                    realId: activeOrder.id, 
                    type: activeOrder.service_type || 'delivery', 
                    origin: officialPickupAddress, 
                    pickup_address: officialPickupAddress,
                    pickup_lat: officialPickupLat,
                    pickup_lng: officialPickupLng,
                    destination: activeOrder.delivery_address || 'Destino', 

                    price: activeOrder.total_price || 0, 
                    status: activeOrder.status, 
                    preparation_status: activeOrder.preparation_status || 'preparando',
                    customer: activeOrder.user_name || 'Cliente Izi' 
                };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                setActiveTab('active_mission');
                toastSuccess('Missão sincronizada!');
                console.log('[SYNC] Missão restaurada do banco:', mission.realId);
            } else {
                console.log('[SYNC] Nenhuma missão ativa no banco para o motorista:', driverId);
                
                const cachedMissionRaw = localStorage.getItem('Izi_active_mission');
                if (cachedMissionRaw) {
                    try {
                        const cachedMission = JSON.parse(cachedMissionRaw);
                        const s = (cachedMission.status || '').toLowerCase();
                        const isTerminal = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'].includes(s);
                        
                        if (isTerminal) {
                            console.log('[SYNC] Missão no cache já está finalizada. Limpando...');
                            setActiveMission(null);
                            localStorage.removeItem('Izi_active_mission');
                            return;
                        }

                        const createdAt = new Date(cachedMission.created_at || 0).getTime();
                        const ageMs = Date.now() - createdAt;
                        
                        // Se a missão não é terminal e é muito recente (< 15s), mantemos por precaução contra delay de propagação
                        if (ageMs > 15000) {
                            console.log('[SYNC] Limpando missão local (não ativa no servidor e tempo de proteção expirado).');
                            setActiveMission(null);
                            localStorage.removeItem('Izi_active_mission');
                        }
                    } catch {
                        setActiveMission(null);
                        localStorage.removeItem('Izi_active_mission');
                    }
                } else {
                    setActiveMission(null);
                }
            }
        } catch (err: any) {
            toastError('Erro ao sincronizar missão.');
            console.error('[SYNC] Falha ao sincronizar missão:', err.message);
        } finally {
            setIsSyncingMission(false);
            setIsSyncing(false);
        }
    }, [driverId, isAuthenticated]);

    useEffect(() => {
        syncMissionWithDB();
    }, [driverId, isAuthenticated, syncMissionWithDB]);

    const fetchDedicatedSlotsRealtimeRef = useRef(fetchDedicatedSlotsRealtime);
    fetchDedicatedSlotsRealtimeRef.current = fetchDedicatedSlotsRealtime;
    const refreshMyApplicationsRef = useRef(refreshMyApplications);
    refreshMyApplicationsRef.current = refreshMyApplications;

    // Canal separado para vagas dedicadas - funciona independente do status online
    useEffect(() => {
        if (!isAuthenticated) return;
        
        const fetchDeep = () => fetchDedicatedSlotsRealtimeRef.current();
        fetchDeep();

        const slotsChannel = supabase.channel('driver_dedicated_slots_stream')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dedicated_slots_delivery' }, async (payload) => {
                console.log('[DEDICATED] Nova vaga detectada!');
                await fetchDedicatedSlotsRealtimeRef.current();
                playIziSound('driver');
                toastSuccess('Nova vaga dedicada disponível!');
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dedicated_slots_delivery' }, async (payload) => {
                console.log('[DEDICATED] Atualização de vaga detectada!');
                await fetchDedicatedSlotsRealtimeRef.current();
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'dedicated_slots_delivery' }, (payload) => {
                const deletedId = (payload.old as any).id;
                setDedicatedSlots(prev => prev.filter((s: any) => s.id !== deletedId));
                stopIziSounds();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_applications' }, (payload) => {
                console.log('âš¡ MUDANÃ‡A EM CANDIDATURAS (Realtime):', payload);
                fetchDeep();
                refreshMyApplicationsRef.current();

                // Notificação de aprovação
                const data = payload.new as any;
                if (payload.eventType === 'UPDATE' && data.status === 'accepted' && String(data.driver_id) === String(driverId)) {
                    playIziSound('success');
                    toastSuccess('Parabéns! Sua vaga foi confirmada!');
                }
            })
            .subscribe((status) => {
                console.log('[REALTIME-STATUS] Vagas Dedicadas:', status);
            });

        return () => { supabase.removeChannel(slotsChannel); };
    }, [isAuthenticated, driverId]);
    
    // Auxiliar centralizado para obter token de auth seguro (com refresh se necessÃ¡rio)
    const getSecureToken = useCallback(async () => {
        const sUrl = import.meta.env.VITE_SUPABASE_URL;
        const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
            const { data: { session }, error: sessionErr } = await Promise.race([sessionPromise, timeoutPromise]) as any;
            
            if (sessionErr) {
                console.error('[AUTH] Erro ao obter sessão em getSecureToken:', sessionErr.message);
                if (sessionErr.message.includes("Refresh Token Not Found") || sessionErr.message.includes("invalid_refresh_token")) {
                    console.warn("[AUTH] Token inválido detectado em getSecureToken.");
                    // Não forçamos logout aqui para não sermos disruptivos em chamadas de background, 
                    // mas retornamos a anon key como fallback.
                    return sKey;
                }
            }

            if (session?.access_token) {
                // Se expira em menos de 1 minuto, forcar refresh
                const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
                if (expiresAt > 0 && expiresAt < Date.now() + 60000) {
                    try {
                        const { data: { session: refreshed }, error: refreshErr } = await supabase.auth.refreshSession();
                        if (refreshErr) {
                            console.error('[AUTH] Erro ao renovar sessão:', refreshErr.message);
                            return session.access_token; // Retorna o atual mesmo quase expirado se o refresh falhar
                        }
                        if (refreshed?.access_token) return refreshed.access_token;
                    } catch (e) {
                        return session.access_token;
                    }
                }
                return session.access_token;
            }
        } catch(e) {}
        
        try {
            const project = (sUrl.match(/(?:https:\/\/)?(.*?)\.supabase\.co/)?.[1]);
            const ls = localStorage.getItem(`sb-${project}-auth-token`);
            if (ls) {
                const parsed = JSON.parse(ls);
                const expiresAt = parsed?.expires_at ? parsed.expires_at * 1000 : 0;
                // Só usa o localstorage token se ele for válido
                if (parsed?.access_token && (expiresAt === 0 || expiresAt > Date.now() + 60000)) {
                    return parsed.access_token;
                }
            }
        } catch(e) {}
        return sKey;
    }, []);
    const fetchFromDB = useCallback(async (table: string, queryParams: string = '') => {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const token = await getSecureToken();

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // Aumentado para 12s

        try {
            const url = `${supabaseUrl}/rest/v1/${table}?${queryParams}`;
            const res = await fetch(url, {
                headers: { 
                    'apikey': supabaseKey, 
                    'Authorization': `Bearer ${token}`, 
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.status === 401) {
                console.error('[AUTH] Token expirado ou inválido (401).');
                // Opcional: Se estiver autenticado e der 401, pode ser necessário forçar logout ou refresh
                if (isAuthenticated) {
                    console.log('[AUTH] Tentando recuperar sessão para resolver 401...');
                    await supabase.auth.refreshSession();
                }
                throw new Error('Sessão expirada. Por favor, reinicie o aplicativo.');
            }

            if (!res.ok) {
                const errText = await res.text();
                console.error(`[DB-ERROR] ${res.status}:`, errText);
                throw new Error(`DB Error: ${res.status}`);
            }

            return await res.json();
        } catch (error: any) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') throw new Error('Timeout na conexão com o banco');
            throw error;
        }
    }, [isAuthenticated]);

    // Monitorar aprovação de vagas dedicadas em tempo real
    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        console.log('[REALTIME] Iniciando canal de escuta autoritativo para candidaturas...');
        
        const channel = supabase
            .channel(`all_applications_sync`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'slot_applications'
                },
                (payload) => {
                    const { new: updatedApp } = payload;
                    
                    // Filtragem manual no cliente (Mais robusto)
                    if (String(updatedApp.driver_id) !== String(driverId)) return;

                    const status = updatedApp.status;
                    console.log(`[REALTIME] Mudança de status detectada para você: ${status}`);

                    if (status === 'accepted') {
                        playIziSound('driver');
                        
                        const slotId = updatedApp.slot_id;
                        const targetSlot = dedicatedSlots.find(s => String(s.id) === String(slotId));
                        
                        setApprovedSlotData(targetSlot || { 
                            id: slotId, 
                            title: 'Vaga Dedicada',
                            fee_per_day: '80',
                            admin_users: { store_name: 'Parceiro Izi' }
                        });
                        
                        setShowApprovedSlotModal(true);

                        toastSuccess("ðŸ VAGA CONFIRMADA! Clique para ver os detalhes.");
                    }
                    
                    // Sincroniza estados após qualquer atualização minha
                    refreshMyApplications();
                    fetchFromDB('dedicated_slots_delivery', 'select=*,admin_users(store_name,store_logo,store_address,store_phone)&is_active=eq.true&order=created_at.desc');
                }
            )
            .subscribe((status) => {
                console.log('[REALTIME] Status da inscrição do canal:', status);
            });

        return () => {
            console.log('[REALTIME] Encerrando canal de candidaturas.');
            supabase.removeChannel(channel);
        };
    }, [isAuthenticated, driverId, fetchFromDB, dedicatedSlots, refreshMyApplications]);



    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        
        // Tenta carregar do cache primeiro para evitar flicker da trava sumindo
        // Já carregado no estado inicial via initializer, mas atualizamos se o ID mudar
        const cached = localStorage.getItem(`izi_apps_${driverId}`);
        if (cached) {
            try { 
                const parsed = JSON.parse(cached);
                if (JSON.stringify(parsed) !== JSON.stringify(myApplications)) {
                    setMyApplications(parsed);
                }
            } catch(e) {}
        }

        refreshMyApplications();
        refreshFinanceData();
    }, [isAuthenticated, driverId, refreshMyApplications]);

    // Buscar Agendamentos disponíveis e aceitos
    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        const fetchScheduled = async () => {
            const now = new Date();
            const referenceDate = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(); // 12h atrás para cobrir qualquer delay de confirmação
            
            try {
                const data = await fetchFromDB('orders_delivery', `scheduled_at=gte.${referenceDate}&order=scheduled_at.asc`);
                
                if (data) {
                    const filtered = data.filter((o: any) => {
                        const isMine = o.driver_id && String(o.driver_id).trim() === String(driverId).trim();
                        const isAvailable = !o.driver_id || String(o.driver_id).trim() === '';
                        const openStatuses = ['pendente', 'agendado', 'novo', 'waiting_driver', 'waiting_merchant', 'preparando', 'pronto', 'a_caminho_coleta', 'a_caminho', 'confirmado', 'confirmed'];
                        const statusOk = openStatuses.includes(o.status.toLowerCase());
                        
                        return (isMine || isAvailable) && statusOk;
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
                if (!isOnlineRef.current) return;
                const o = payload.new as any;
                if (o.scheduled_at) {
                    if (isOnlineRef.current) playIziSound('driver'); // Som unico para Agendamento
                    setScheduledOrders(prev => [...prev, o].sort((a, b) =>
                        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
                    ));
                }
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders_delivery' }, (payload) => {
                const o = payload.new as any;
                if (o.scheduled_at) {
                    const s = (o.status || '').toLowerCase();
                    if (['concluido', 'cancelado', 'finalizado', 'delivered', 'entregue'].includes(s)) {
                        setScheduledOrders(prev => prev.filter(s => s.id !== o.id));
                    } else if (o.driver_id && String(o.driver_id).trim() !== String(driverIdRef.current || '').trim()) {
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
    }, [isAuthenticated, fetchFromDB]);

    const handleDeclineOrder = (orderId: string) => {
        try {
            const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
            declinedMap[orderId] = Date.now();
            localStorage.setItem('Izi_declined_timed', JSON.stringify(declinedMap));
            
            // Remove do estado local imediatamente para feedback instantâneo
            setOrders(prev => prev.filter(o => (o.realId || o.id) !== orderId));
            
            // Parar o som ao recusar
            stopIziSounds();
            
            toastSuccess('Missão ocultada com sucesso.');
        } catch (e) {
            console.error('Erro ao recusar pedido:', e);
        }
    };

    const fetchOrders = useCallback(async () => {
        if (!isOnlineRef.current) {
            setOrders([]);
            return;
        }
        setIsSyncing(true);
        try {
            const [data] = await Promise.all([
                fetchFromDB('orders_delivery', 'select=*&status=not.in.(concluido,cancelado)&order=created_at.desc&limit=20'),
                new Promise(resolve => setTimeout(resolve, 600)) // Atraso artificial mínimo para feedback visual fluido (Girar o ícone)
            ]);
            
            const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
            const now = Date.now();
            const currentMission = activeMissionRef.current;

            const myAssignment = data.find((o: any) => 
                o.driver_id && String(o.driver_id).trim() === String(driverId).trim() &&
                !['concluido', 'cancelado', 'finalizado', 'entregue'].includes(o.status)
            );

            if (myAssignment && (!currentMission || currentMission.realId !== myAssignment.id)) {
                const mission = { 
                    ...myAssignment, 
                    realId: myAssignment.id, 
                    type: myAssignment.service_type, 
                    customer: myAssignment.user_name || 'Cliente Izi',
                    store_name: myAssignment.merchant_name || myAssignment.store_name || 'Loja Parceira',
                    pickup_address: myAssignment.pickup_address,
                    pickup_lat: myAssignment.pickup_lat,
                    pickup_lng: myAssignment.pickup_lng
                };
                setActiveMission(mission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
            }

            const available = data.filter((o: any) => {
                const isMerchantOrder = !!o.merchant_id;
                // Atualizado para incluir novo e pendente, conforme regra do painel lojista solicitada
                const merchantAccepted = ['novo', 'pendente', 'waiting_driver', 'preparando', 'pronto', 'accepted', 'confirmado', 'confirmed'].includes(o.status);
                const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'confirmado', 'confirmed'].includes(o.status);
                const statusOk = isMerchantOrder ? merchantAccepted : p2pAllowed;
                const notMyAssignment = !o.driver_id || String(o.driver_id).trim() === '';
                const notDeclined = !(now - (declinedMap[o.id] || 0) < 5000);
                const notFinancial = !['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'].includes(o.service_type);
                const notScheduled = !o.scheduled_at || o.driver_id === driverId;
                return statusOk && notMyAssignment && notDeclined && notFinancial && notScheduled;
            });

            const newAvailable = available.map((o: any) => ({
                ...o,
                id: o.id.slice(0, 8).toUpperCase(), 
                realId: o.id, 
                type: o.service_type, 
                origin: o.pickup_address, 
                destination: o.delivery_address, 
                price: o.total_price,
                pickup_lat: o.pickup_lat,
                pickup_lng: o.pickup_lng,
                delivery_lat: o.delivery_lat,
                delivery_lng: o.delivery_lng,
                store_name: o.merchant_name || o.store_name || 'Loja Parceira',
                customer: 'Cliente Izi'
            }));

            setOrders(prev => {
                const hasNew = newAvailable.some(no => !prev.find(po => po.realId === no.realId));
                if (hasNew && isOnlineRef.current && !activeMissionRef.current && localStorage.getItem('pref_sound') !== 'false') {
                    playIziSound('driver');
                }
                return newAvailable;
            });
        } catch (err) {
            console.warn('[POLL-ERROR]', err);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, driverId, fetchFromDB]);

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;
        fetchOrders();
        const interval = setInterval(fetchOrders, 30000);
        return () => clearInterval(interval);
    }, [isAuthenticated, driverId, fetchOrders]);


        
                                

    useEffect(() => {
        if (!isAuthenticated || !driverId) return;

        const channel = supabase.channel('realtime_orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_delivery' }, (payload) => {
                if (!isOnlineRef.current) return;
                
                const eventType = payload.eventType;
                if (eventType === 'DELETE') {
                    setOrders(prev => prev.filter(x => x.realId !== payload.old.id));
                    return;
                }

                const o = payload.new;
                const dId = String(driverIdRef.current || '').trim();
                const currentMission = activeMissionRef.current;
                const isMyOrder = o.driver_id && String(o.driver_id).trim() === dId && dId !== '';

                // 1. GESTÃƒO DA MISSÃƒO ATIVA DESTE MOTORISTA
                if (isMyOrder) {
                    if (['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'].includes(o.status.toLowerCase())) {
                        setActiveMission(null);
                        localStorage.removeItem('Izi_active_mission');
                        if (activeTabRef.current === 'active_mission') setActiveTab('dashboard');
                        return;
                    }

                    const wasPreparing = currentMission?.preparation_status !== 'pronto';
                    const isNowReady = o.preparation_status === 'pronto';
                    if (wasPreparing && isNowReady) {
                        playIziSound('driver');
                        toastSuccess('ðŸ”” O Pedido está PRONTO para coleta!');
                    }

                    const mission = { 
                        ...o, 
                        realId: o.id, 
                        type: o.service_type || 'delivery', 
                        origin: o.pickup_address, 
                        destination: o.delivery_address, 
                        price: o.total_price || 0, 
                        customer: o.user_name || 'Cliente Izi',
                        store_name: o.store_name || 'Parceiro Izi'
                    };
                    setActiveMission(mission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                    
                    if (activeTabRef.current !== 'active_mission') {
                        setActiveTab('active_mission');
                    }
                    return;
                }

                // 2. GESTÃƒO DO RADAR (Pedidos disponíveis)
                if (o.scheduled_at) return;
                
                const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
                const isMerchantOrder = !!o.merchant_id;
                const merchantAccepted = ['novo', 'pendente', 'waiting_driver', 'preparando', 'pronto', 'accepted', 'confirmado', 'confirmed'].includes(o.status);
                const p2pAllowed = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'confirmado', 'confirmed'].includes(o.status);
                
                const isAcceptable = isMerchantOrder ? merchantAccepted : p2pAllowed;
                if (!isAcceptable || (o.driver_id && String(o.driver_id).trim() !== dId)) {
                    setOrders(prev => {
                        const newOrders = prev.filter(x => x.realId !== o.id);
                        if (newOrders.length === 0) stopIziSounds();
                        return newOrders;
                    });
                    return;
                }

                if (Date.now() - (declinedMap[o.id] || 0) < 1800000) return;
                
                const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
                if (financialTypes.includes(o.service_type)) return;

                // 2.1 FILTRAGEM POR PREFERÃŠNCIAS E VEÃCULOS
                const isCompatible = () => {
                    const type = normalizeServiceType(o.service_type);
                    const pServices = prefServiceTypesRef.current;
                    const pVehicles = prefVehicleTypesRef.current;
                    
                    if (pVehicles.length === 0) return false;

                    const allServicesEnabled = pServices.includes('all_services');
                    const isDelivery = ['restaurant', 'market', 'pharmacy', 'beverages', 'package', 'motoboy'].includes(type);
                    const isMobility = ['mototaxi', 'car_ride', 'motorista_particular', 'frete', 'van', 'utilitario'].includes(type);

                    // Filtro de ServiÃ§os
                    if (isDelivery && !allServicesEnabled) return false;
                    if (isMobility) {
                        const mapping: Record<string, string> = {
                            'mototaxi': 'mototaxi', 'car_ride': 'motorista', 'motorista_particular': 'motorista',
                            'frete': 'frete', 'van': 'frete', 'utilitario': 'frete'
                        };
                        const prefKey = mapping[type];
                        if (prefKey && !pServices.includes(prefKey)) return false;
                    }

                    // Filtro de VeÃ­culos
                    const canDoMoto = pVehicles.includes('moto');
                    const canDoBike = pVehicles.includes('bike');
                    const canDoCar = pVehicles.includes('carro');
                    const canDoLarge = pVehicles.some(v => ['fiorino', 'caminhonete', 'van', 'vuc', 'bau_p', 'bau_m', 'bau_g'].includes(v));

                    if (isDelivery) return canDoMoto || canDoBike || canDoCar;
                    if (type === 'mototaxi') return canDoMoto;
                    if (type === 'car_ride' || type === 'motorista_particular') return canDoCar;
                    if (type === 'frete' || type === 'van' || type === 'utilitario') return canDoLarge || canDoCar;

                    return true;
                };

                if (!isCompatible()) return;

                const actionableStatuses = ['novo', 'pendente', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant', 'accepted'];
                const pStatus = String(o.payment_status || '').toLowerCase();
                const pMethod = String(o.payment_method || '').toLowerCase();
                const isPaidOrCash = ['cash', 'dinheiro'].includes(pMethod) || ['paid', 'pago', 'approved', 'aprovado'].includes(pStatus);
                const shouldSound = actionableStatuses.includes(o.status) && isPaidOrCash;
                const servicePreview = getServicePresentation(o);

                const mappedOrder = {
                    ...o,
                    id: o.id.slice(0, 8).toUpperCase(), 
                    realId: o.id, 
                    type: o.service_type, 
                    origin: o.pickup_address, 
                    destination: o.delivery_address, 
                    price: o.total_price,
                    store_name: o.store_name || 'Loja Parceira',
                    customer: o.user_name || 'Cliente Izi'
                };

                setOrders(prev => {
                    const exists = prev.find(x => x.realId === o.id);
                    if (exists) {
                        return prev.map(x => x.realId === o.id ? mappedOrder : x);
                    }
                    
                    if (isOnlineRef.current && shouldSound && !activeMissionRef.current) {
                        playIziSound('driver');
                        if (Notification.permission === 'granted') {
                            new Notification('ðŸš€ Nova Missão Izi!', { 
                                body: `${servicePreview.headline} â€¢ ${servicePreview.pickupText || o.pickup_address}`, 
                                icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' 
                            });
                        }
                    }
                    return [mappedOrder, ...prev].slice(0, 20);
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [isAuthenticated, driverId, getServicePresentation]);

    // O som agora é disparado DIRETAMENTE pelo listener Realtime (acima)
    // para maior precisão e evitar disparos duplicados ou atrasados.




    // Startup / Session Recovery: Buscar missão ativa no banco se o driverId estiver presente
    useEffect(() => {
        const recoverActiveMission = async () => {
            if (!driverId || activeMission) return;
            
            console.log('[RECOVERY] Buscando missão ativa no servidor...');
            const { data, error } = await supabase
                .from('orders_delivery')
                .select('*')
                .eq('driver_id', driverId)
                .not('status', 'in', '(concluido,cancelado,finalizado,entregue,delivered)')
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
            // Validar UUID Â¢Â¢ÃƒÆ’Ã†â€™Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢ââ€šÂ¬Ã…áÂ¬ÃƒÆ’ââ‚¬Â¦áÂ¬Â¢ÃƒÆ’Ã†â€™Â¢Â¬ order.id é o ID curto (8 chars), order.realId é o UUID completo
            const targetId = order.realId || order.id;
            console.log('Target ID Identificado:', targetId, { orderId: order.id, realId: order.realId });
            
            // Validação de segurança básica: Relaxada para suportar listagens que usam apenas ID curto
            if (!targetId) {
                 console.error('ID do pedido ausente na tentativa de aceite.');
                 toastError('Ocorreu um erro ao identificar o pedido.');
                 setIsAccepting(false);
                 return;
            }

            console.log('1. Verificando integridade via REST...');
            
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            let token = await getSecureToken();

            const authHeaders = { 
                'apikey': supabaseKey, 
                'Authorization': `Bearer ${token}` 
            };
            
            const checkRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders_delivery?id=eq.${targetId}&select=*`, {
                headers: authHeaders
            });
            
            const ordersListArr = await checkRes.json();
            const realOrder = ordersListArr?.[0];

            if (!realOrder) throw new Error('Pedido não encontrado.');
            
            if (realOrder.driver_id && String(realOrder.driver_id).trim() !== '') {
                toastError('Este pedido já foi aceito por outro piloto.');
                setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
                setIsAccepting(false);
                return;
            }

            const isScheduled = !!order.scheduled_at;
            const newStatus = isScheduled ? 'confirmado' : 'a_caminho_coleta';

            console.log(`2. Gravando aceite via PATCH REST...`);
            const updateRes = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders_delivery?id=eq.${targetId}`, {
                method: 'PATCH',
                headers: { ...authHeaders, 'Content-Type': 'application/json' },
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
            const sUrl = import.meta.env.VITE_SUPABASE_URL;
            const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const token = await getSecureToken();

            const headers = { 'apikey': sKey, 'Authorization': `Bearer ${token}` };
            const apiRequest = (path: string, method = 'GET', body?: any) => 
                fetch(`${sUrl}/rest/v1/${path}`, { 
                    method, 
                    headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
                    body: body ? JSON.stringify(body) : undefined,
                    signal: AbortSignal.timeout(10000) 
                });

            // 1. Coleta de dados em paralelo para maior performance
            const [txsRes, drvRes, ordsRes, setsRes] = await Promise.all([
                apiRequest(`wallet_transactions_delivery?user_id=eq.${driverId}&order=created_at.desc`),
                apiRequest(`drivers_delivery?id=eq.${driverId}&select=bank_info,name`),
                apiRequest(`orders_delivery?driver_id=eq.${driverId}&status=in.(concluido,entregue,finalizado,delivered)&order=updated_at.desc`),
                apiRequest(`app_settings_delivery?limit=1`)
            ]).catch(() => [null, null, null, null]);

            const [txs, drvData, orders, sets] = await Promise.all([
                txsRes?.ok ? txsRes.json() : null,
                drvRes?.ok ? drvRes.json() : null,
                ordsRes?.ok ? ordsRes.json() : null,
                setsRes?.ok ? setsRes.json() : null
            ]);

            if (drvData?.[0]) {
                const d = drvData[0];
                if (d.bank_info?.pix_key) { setPixKey(d.bank_info.pix_key); localStorage.setItem('izi_driver_pix', d.bank_info.pix_key); }
                setDriverName(d.name || 'Entregador');
            }
            if (sets?.[0]) setAppSettings(sets[0]);
            if (orders) setHistory(orders);

            // 2. Processamento financeiro unificado
            let balance = 0, todaySum = 0, weeklySum = 0, totalGanhos = 0;
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const startOfWeek = new Date(); 
            const diffDays = (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1);
            startOfWeek.setDate(startOfWeek.getDate() - diffDays);
            startOfWeek.setHours(0, 0, 0, 0);

            if (txs) {
                setEarningsHistory(txs.filter((t: any) => t.type !== 'saque'));
                setWithdrawHistory(txs.filter((t: any) => t.type === 'saque'));

                txs.forEach((t: any) => {
                    // 'pagamento' é débito de cliente — nunca deve afetar saldo do entregador
                    if (t.type === 'pagamento') return;

                    const amount = Number(t.amount);
                    const isCredit = ['venda', 'vaga_dedicada', 'bonus', 'deposito', 'reembolso', 'cashback'].includes(t.type);
                    balance = isCredit ? balance + amount : balance - amount;

                    // Apenas ganhos reais de trabalho entram nos totais
                    const isEarning = ['venda', 'vaga_dedicada', 'bonus', 'deposito'].includes(t.type);
                    if (isEarning) {
                        const tDate = new Date(t.created_at);
                        totalGanhos += amount;

                        if (tDate >= startOfDay) todaySum += amount;
                        if (tDate >= startOfWeek) weeklySum += amount;
                    }
                });
            }

            // 3. Cálculo de Performance Semanal (últimos 7 dias)
            const performance = [0, 0, 0, 0, 0, 0, 0]; // S, T, Q, Q, S, S, D
            const now = new Date();
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            sevenDaysAgo.setHours(0,0,0,0);

            if (orders) {
                orders.forEach(o => {
                    const oDate = new Date(o.updated_at);
                    if (oDate >= sevenDaysAgo) {
                        const day = oDate.getDay(); // 0=Dom, 1=Seg...
                        const idx = day === 0 ? 6 : day - 1; // Mapear para S, T, Q, Q, S, S, D
                        performance[idx]++;
                    }
                });
            }

            setStats(prev => ({ 
                ...prev, balance, today: todaySum, weekly: weeklySum, totalEarnings: totalGanhos, 
                count: orders?.length || 0, xp: (orders?.length || 0) * 15,
                level: Math.floor(((orders?.length || 0) * 15) / 100) + 1,
                performance
            }));

            console.log(`[FINANCE] Sincronização concluída. Saldo: ${balance}, Hoje: ${todaySum}`);
            if (txs) {
                const todayTxs = txs.filter((t: any) => {
                    const d = new Date(t.created_at);
                    return d >= startOfDay;
                });
                console.log('[FINANCE] Transações de Hoje:', todayTxs.map((t: any) => `${t.type}: ${t.amount}`));
            }
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
        
        let paymentConfirmedMode: string | false = false;
        if (isFinishing && !isPaid) {
             paymentConfirmedMode = await showConfirmPaymentMethod(activeMission);
             if (!paymentConfirmedMode) return;
        }

        setIsAccepting(true);
        
        try {
            const missionId = activeMission.realId || activeMission.id;
            if (!missionId) throw new Error('Identificador da missão não encontrado.');
            
            // Atualização Otimista
            const updatedMission = { ...activeMission, status: newStatus.toLowerCase(), updated_at: new Date().toISOString() };
            if (!isFinishing) {
                setActiveMission(updatedMission);
                localStorage.setItem('Izi_active_mission', JSON.stringify(updatedMission));
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            const token = await getSecureToken();

            const payload: any = {
                status: newStatus.toLowerCase(),
                updated_at: new Date().toISOString()
            };
            if (paymentConfirmedMode === 'dinheiro') {
                payload.payment_method = 'dinheiro';
                payload.payment_status = 'paid';
            } else if (paymentConfirmedMode === 'pix_cartao') {
                payload.payment_status = 'paid';
            }


            const response = await fetch(`${supabaseUrl}/rest/v1/orders_delivery?id=eq.${missionId}`, {
                method: 'PATCH',
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("[UPDATE_STATUS] Server responded with error:", errorText);
                
                // Rollback otimista se falhar
                if (!isFinishing) {
                    setActiveMission(activeMission);
                    localStorage.setItem('Izi_active_mission', JSON.stringify(activeMission));
                }
                setIsAccepting(false);
                toastError(`Erro ao atualizar status: ${errorText}`);
                return;
            }

            toastSuccess(`Status atualizado: ${newStatus === 'chegou_coleta' ? 'Chegada na Coleta' : newStatus}`);
            
            if (isFinishing) {
                // Atualizamos o objeto local para o cálculo de ganhos refletir o método de pagamento escolhido
                const missionForCalc = { ...activeMission };
                if (paymentConfirmedMode === 'dinheiro') missionForCalc.payment_method = 'dinheiro';
                else if (paymentConfirmedMode === 'pix_cartao') missionForCalc.payment_method = 'pix';

                const netEarned = getNetEarnings(missionForCalc);
                const ordShortId = missionId.slice(0,8).toUpperCase();

                console.log(`[WALLET] Finalizando missão ${ordShortId}. Ganho líquido: R$ ${netEarned}`);

                // Inserir transação financeira via fetch manual para garantir sucesso no mobile
                await fetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
                    method: 'POST',
                    headers: {
                        'apikey': supabaseKey,
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: driverId,
                        amount: netEarned,
                        type: 'deposito',
                        status: 'completed',
                        description: `Ganhos: Missão #${ordShortId} (Líquido)`
                    }),
                    signal: AbortSignal.timeout(10000)
                }).catch(err => console.error('[WALLET] Erro ao registrar ganho:', err));

                // 2. INSERIR DÃ‰BITO SE FOI PAGO EM DINHEIRO (o motorista ficou com o dinheiro do cliente)
                let cashDiscountAmount = 0;
                if (paymentConfirmedMode === 'dinheiro') {
                    const totalOrderPrice = Number(activeMission.total_price || activeMission.price || 0);
                    if (totalOrderPrice > 0) {
                        cashDiscountAmount = totalOrderPrice;
                        await fetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
                            method: 'POST',
                            headers: {
                                'apikey': supabaseKey,
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                user_id: driverId,
                                amount: totalOrderPrice,
                                type: 'debit',
                                status: 'completed',
                                description: `Desconto de pagamento em Dinheiro. (Pedido ${ordShortId})`
                            }),
                            signal: AbortSignal.timeout(10000)
                        }).catch(err => console.error('[CASH] Erro ao debitar pagamento:', err));
                    }
                }

                setFinishedMissionData({
                    show: true,
                    amount: netEarned,
                    grossAmount: activeMission.price || 0,
                    bonus: 0,
                    extraKm: 0,
                    extraKmValue: 0,
                    xpGained: 15,
                    cashDiscount: cashDiscountAmount > 0 ? cashDiscountAmount : undefined
                });

                setActiveMission(null);
                localStorage.removeItem('Izi_active_mission');
                setActiveTab('dashboard');
                setTimeout(() => refreshFinanceData(), 2000); // 2s para garantir propagação no DB
            } else {
                setTimeout(() => syncMissionWithDB(), 2000);
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
        const minAmount = Number(appSettings?.min_withdrawal_amount ?? 0);
        if (stats.balance < minAmount) { toastError(`Saque mínimo: R$ ${minAmount.toFixed(2)}`); return; }
        setShowWithdrawModal(true);
    };

    const confirmWithdraw = async () => {
        if (isWithdrawLoading) return;
        
        if (!stats.balance || stats.balance <= 0) {
            toastError("Você não possui saldo para sacar.");
            setShowWithdrawModal(false);
            return;
        }

        setIsWithdrawLoading(true);

        const feeAmount = stats.balance * (Number(appSettings?.withdrawal_fee_percent ?? 0) / 100);
        try {
            const uid = driverId || localStorage.getItem('izi_driver_uid');
            if (!uid) throw new Error("Sessão inválida. Faça login novamente.");

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            let token = await getSecureToken();

            console.log('[WITHDRAW] Solicitando saque via REST...', { uid, amount: stats.balance });

            const res = await fetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: uid, 
                    amount: stats.balance, 
                    type: 'saque', 
                    status: 'pendente',
                    description: `Saque PIX: ${pixKey}${feeAmount > 0 ? ` (Taxa IZI: R$ ${feeAmount.toFixed(2)})` : ''}`
                })
            });

            if (!res.ok) throw new Error(`Falha no servidor: ${res.status}`);

            console.log('[WITHDRAW] Sucesso!');

            setShowWithdrawModal(false); 
            setShowSuccessOverlay(true);
            
            setTimeout(() => { 
                setShowSuccessOverlay(false); 
                refreshFinanceData(); 
            }, 4000);

        } catch (err: any) {
            console.error('[WITHDRAW] Exceção capturada ao solicitar saque:', err);
            toastError(err.message || "Erro ao processar saque.");
        } finally { 
            setIsWithdrawLoading(false); 
        }
    };

    const handleSavePix = async (val?: string, bankVal?: string) => {
        const keyToSave = (val || pixKey).trim();
        const bankToSave = (bankVal || bankName).trim();

        if (!keyToSave) { toastError('Informe a chave PIX'); return; }
        if (!driverId) { toastError('Sessão expirada. Faça login novamente.'); return; }

        setIsSavingPix(true);
        try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            
            let token = await getSecureToken();

            console.log('[PIX] Salvando dados via REST...', { driverId, keyToSave });

            const res = await fetch(`${supabaseUrl}/rest/v1/drivers_delivery?id=eq.${driverId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ bank_info: { pix_key: keyToSave, bank_name: bankToSave } })
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            localStorage.setItem('izi_driver_pix', keyToSave);
            localStorage.setItem('izi_driver_bank_name', bankToSave);
            setPixKey(keyToSave);
            setBankName(bankToSave);
            setIsEditingPix(false);
            toastSuccess('Dados Bancários salvos!');
        } catch (e: any) {
            console.error('[PIX] ERRO:', e);
            toastError('Erro ao salvar: ' + (e?.message || 'Desconhecido'));
        } finally {
            setIsSavingPix(false);
        }
    };

    const handleSavePlate = async (plateVal: string) => {
        const val = plateVal.trim().toUpperCase();
        if (!val) { toastError('Informe a placa do veículo'); return; }
        if (!driverId) return;

        setIsSavingPlate(true);
        try {
            const { error } = await supabase
                .from('drivers_delivery')
                .update({ license_plate: val })
                .eq('id', driverId);

            if (error) throw error;

            setDriverPlate(val);
            localStorage.setItem('izi_driver_plate', val);
            setIsEditingPlate(false);
            toastSuccess('Placa atualizada!');
        } catch (e: any) {
            console.error('[PLATE] ERRO:', e);
            toastError('Erro ao salvar placa');
        } finally {
            setIsSavingPlate(false);
        }
    };

    const handleLogout = useCallback(() => {
        console.log('[AUTH] Iniciando processo de logout...');
        isLoggingOutRef.current = true;
        
        // 1. Deslogar do Supabase em background (sem travar a interface)
        supabase.auth.signOut().catch(err => console.warn('[AUTH] Erro no signOut remoto:', err));
        
        // 2. Limpar o estado local e LocalStorage (limpa dados de UI imediatamente)
        clearDriverSessionState();
        
        // 3. Forçar recarregamento para limpar estados residuais de memória
        window.location.href = '/';
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

        // --- TRAVA DE SEGURANÃ‡A: Verificação de duplicados ---
        const alreadyApplied = myApplications.some(app => String(app.slot_id) === String(slot.id) && app.status !== 'rejected');
        
        if (alreadyApplied) {
            toastError("Você já possui uma candidatura ativa para esta vaga!");
            return;
        }
        // ---------------------------------------------------

        console.log("Iniciando candidatura para o slot:", slot.id, "Motorista:", driverId);
        setApplyingSlotId(slot.id);
        
        try {
            console.log("Enviando para o Supabase (bypass cliente)...");
            
            // Tentativa de obter o token diretamente para evitar travamento do getSession()
            const projectRef = import.meta.env.VITE_SUPABASE_URL?.match(/\/\/(.*?)\./)?.[1];
            const sessionKey = `sb-${projectRef}-auth-token`;
            let token = import.meta.env.VITE_SUPABASE_ANON_KEY; // Fallback
            
            try {
                const storedSession = localStorage.getItem(sessionKey);
                if (storedSession) {
                    const parsed = JSON.parse(storedSession);
                    if (parsed && parsed.access_token) {
                        token = parsed.access_token;
                    }
                }
            } catch (e) {
                console.warn("Aviso: não foi possível ler o token do localStorage.");
            }

            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

            const payload = {
                slot_id: slot.id,
                driver_id: driverId,
                status: 'pending',
                merchant_id: slot.merchant_id
            };

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

            const response = await fetch(`${supabaseUrl}/rest/v1/slot_applications`, {
                method: 'POST',
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                let errorDetails = '';
                try {
                    const errorJson = await response.json();
                    errorDetails = JSON.stringify(errorJson);
                } catch(e) {
                    errorDetails = await response.text();
                }
                console.error("Erro Supabase detalhado:", errorDetails);
                
                if (response.status === 401 || response.status === 403) {
                    throw new Error('Sessão expirada. Por favor, deslogue e logue novamente.');
                }
                if (response.status === 409 || errorDetails.includes('duplicate key')) {
                    throw new Error('Você já se candidatou a esta vaga.');
                }
                throw new Error(`Erro na API (${response.status})`);
            }

            const responseData = await response.json();
            console.log("Candidatura enviada com sucesso!", responseData);
            setShowSlotAppliedSuccess(true);
            
            // --- ATUALIZAÇÃO OTIMISTA ---
            const newApp = {
                slot_id: slot.id,
                driver_id: driverId,
                status: 'pending',
                created_at: new Date().toISOString()
            };
            
            const currentApps = Array.isArray(myApplications) ? myApplications : [];
            const updatedApps = [...currentApps, newApp];
            setMyApplications(updatedApps);
            localStorage.setItem(`izi_apps_${driverId}`, JSON.stringify(updatedApps));

            refreshMyApplications();
            
        } catch (err: any) {
            console.error('Erro ao processar candidatura:', err);
            toastError(err.message || 'Falha ao registrar candidatura');
        } finally {
            console.log("Limpando estado de carregamento.");
            setApplyingSlotId(null);
        }
    };

    const renderBottomNavigation = () => {
        if (activeTab === 'active_mission') return null;
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
                                    { id: 'scheduled', label: 'Agendamentos', icon: 'event', badge: scheduledOrders.length },
                                    { id: 'dedicated', label: 'Vagas', icon: 'military_tech', badge: dedicatedSlots.filter(s => s.is_active && !myApplications.some(app => String(app.slot_id) === String(s.id))).length },
                                    { id: 'earnings', label: 'Izi Pay', icon: 'payments' },
                                    { id: 'history', label: 'Histórico', icon: 'history' },
                                    { id: 'profile', label: 'Perfil', icon: 'person' }
                                ].filter(item => {
                                    if (item.id === 'scheduled' || item.id === 'active_mission') {
                                        return isOnline || !!activeMission;
                                    }
                                    return true;
                                }).map((item) => {
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveTab(item.id as any)}
                                            className={`flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-[20px] transition-all relative flex-1 min-w-0 ${
                                                isActive ? 'text-primary' : 'text-white/30'
                                            }`}
                                        >
                                            <div className={`size-10 sm:size-12 rounded-[16px] sm:rounded-[20px] flex items-center justify-center transition-all duration-300 ${
                                                isActive 
                                                    ? 'bg-primary shadow-[inset_2px_2px_6px_rgba(255,255,255,0.6),_inset_-3px_-3px_8px_rgba(0,0,0,0.2),_0_8px_20px_rgba(250,204,21,0.4)] scale-105 border border-yellow-300' 
                                                    : 'bg-transparent'
                                            }`}>
                                                <Icon 
                                                    name={item.icon} 
                                                    size={isActive ? 22 : 20} 
                                                    className={isActive ? 'text-zinc-950 drop-shadow-sm' : 'text-white/30'} 
                                                />
                                                {item.badge > 0 && (
                                                    <span className="absolute top-0 right-0 size-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-[inset_1px_1px_3px_rgba(255,255,255,0.4)]">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest transition-all text-center pb-1 ${
                                                isActive ? 'opacity-100 drop-shadow-[0_2px_8px_rgba(250,204,21,0.5)]' : 'opacity-0 h-0 hidden'
                                            }`}>
                                                {item.label}
                                            </span>
                                            {isActive && <div className="absolute -bottom-1 size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(250,204,21,0.8)]" />}
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
                                    onClick={() => { setSelectedSlot(null); stopIziSounds(); }}
                                    className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all font-black"
                                >
                                    <Icon name="close" size={24} />
                                </button>
                                
                                {(() => {
                                    const hasApplied = myApplications.some((app: any) => String(app.slot_id) === String(selectedSlot?.id));
                                    const application = myApplications.find((app: any) => app.slot_id === selectedSlot?.id);
                                    
                                    if (hasApplied) {
                                        const isAccepted = application?.status === 'accepted';
                                        return (
                                            <div
                                                className={`flex-1 flex items-center justify-center gap-4 h-15 rounded-[22px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl relative overflow-hidden transition-all duration-500 ${
                                                    isAccepted 
                                                        ? 'bg-gradient-to-r from-emerald-500/80 to-teal-600/80 text-white border border-emerald-400/30 backdrop-blur-md' 
                                                        : 'bg-white/5 text-white border border-white/10 backdrop-blur-2xl'
                                                }`}
                                            >
                                                {/* Efeito de brilho Superior */}
                                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                                                
                                                <div className={`size-9 rounded-xl flex items-center justify-center shadow-inner ${
                                                    isAccepted ? 'bg-white/20' : 'bg-primary/10 border border-primary/20'
                                                }`}>
                                                    <Icon 
                                                        name={isAccepted ? 'verified' : 'history'} 
                                                        size={22} 
                                                        className={!isAccepted ? 'text-primary animate-pulse' : 'text-white'} 
                                                    />
                                                </div>
                                                <div className="flex flex-col items-start leading-none gap-1.5">
                                                    <span className={`text-[10px] font-black tracking-[0.1em] ${isAccepted ? 'text-white' : 'text-primary'}`}>
                                                        {isAccepted ? 'Vaga Confirmada' : 'Aguardando Lojista'}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {!isAccepted && <div className="size-1 rounded-full bg-primary animate-ping" />}
                                                        <span className={`text-[8px] font-bold uppercase ${isAccepted ? 'opacity-70' : 'text-slate-400'}`}>
                                                            {isAccepted ? 'VOCÃŠ Ã‰ EXCLUSIVO' : 'EM ANÁLISE PELO PARCEIRO'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Raio de luz decorativo para o modo aguardando */}
                                                {!isAccepted && (
                                                    <div className="absolute -inset-x-20 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent blur-sm opacity-50" />
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <button 
                                            disabled={!!applyingSlotId || hasApplied}
                                            onClick={() => selectedSlot && handleApplyToSlot(selectedSlot)}
                                            className="flex-1 h-15 clay-card-exclusive overflow-hidden relative group active:scale-95 transition-all flex items-center justify-center gap-3 border border-primary/20 disabled:opacity-50"
                                        >
                                            <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-10 transition-opacity" />
                                            {applyingSlotId ? (
                                                <div className="size-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <>
                                                    <div className="size-8 rounded-xl bg-primary/20 flex items-center justify-center">
                                                        <Icon name="touch_app" size={20} className="text-primary" />
                                                    </div>
                                                    <span className="text-sm font-black text-primary uppercase tracking-[0.2em]">Candidatar Agora</span>
                                                </>
                                            )}
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

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSyncingMission, setIsSyncingMission] = useState(false);
    const [pullY, setPullY] = useState(0);
    const touchStartY = useRef(0);

    const onRefresh = async () => {
        setIsRefreshing(true);
        try {
            await Promise.all([
                refreshFinanceData(),
                fetchOrders()
            ]);
        } catch (e) {}
        setIsRefreshing(false);
        setPullY(0);
    };

    const renderDashboard = () => (
        <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* Pull to Refresh Indicator */}
            <motion.div 
                style={{ y: pullY - 60 }}
                className="absolute top-0 left-0 right-0 flex justify-center z-50 pointer-events-none"
            >
                <div className="bg-yellow-400 size-10 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20">
                    <Icon name="sync" className={`text-zinc-900 ${isRefreshing ? 'animate-spin' : ''}`} size={20} />
                </div>
            </motion.div>

            <div 
                className="flex-1 overflow-y-auto w-full no-scrollbar pt-6 pb-40"
                onTouchStart={(e) => {
                    if (e.currentTarget.scrollTop <= 0) {
                        touchStartY.current = e.touches[0].clientY;
                    } else {
                        touchStartY.current = 0;
                    }
                }}
                onTouchMove={(e) => {
                    if (touchStartY.current === 0 || isRefreshing) return;
                    const diff = e.touches[0].clientY - touchStartY.current;
                    if (diff > 0 && e.currentTarget.scrollTop <= 0) {
                        setPullY(Math.min(diff * 0.4, 100));
                    }
                }}
                onTouchEnd={() => {
                    if (pullY > 60 && !isRefreshing) {
                        onRefresh();
                    } else {
                        setPullY(0);
                    }
                    touchStartY.current = 0;
                }}
            >
                <div className="px-6 space-y-10">
                 {/* ─── HEADER CARD — NOVO DESIGN ─── */}
                <header className="clay-profile-card rounded-[2.5rem] overflow-hidden relative p-6 flex flex-col gap-4 shadow-[20px_20px_40px_rgba(0,0,0,0.4),inset_4px_4px_12px_rgba(255,255,255,0.4),inset_-4px_-4px_12px_rgba(0,0,0,0.1)]">
                    {/* Glow decorativo */}
                    <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/30 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-stone-950/15 rounded-full blur-2xl pointer-events-none" />

                    {/* ── Linha Superior: Perfil e Ganhos Semanais ── */}
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-14 h-14 shrink-0 rounded-2xl border-[3px] border-white/80 overflow-hidden shadow-lg clay-profile-inner bg-stone-100">
                                {driverAvatar ? (
                                    <img src={driverAvatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Icon name="person" size={32} className="text-stone-950/20" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-stone-950 tracking-tighter leading-none uppercase italic">
                                    {driverName.split(' ')[0] || 'Piloto'}
                                </h1>
                                <div className="mt-1 flex items-center gap-1.5 bg-stone-950/10 px-2 py-0.5 rounded-lg border border-black/5">
                                    <Icon name="military_tech" size={10} className="text-stone-950" />
                                    <span className="text-stone-950 text-[9px] font-black uppercase tracking-widest">
                                        Nível {stats.level}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black uppercase text-stone-950/40 tracking-[0.3em]">Esta Semana</p>
                            <div className="flex items-baseline leading-none">
                                <span className="text-xs font-black text-stone-950/40 mr-0.5">R$</span>
                                <span className="text-3xl font-black text-stone-950 tracking-tighter italic">
                                    {stats.weekly.toFixed(0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* ── Bloco Central: Ganhos de Hoje (Mais Compacto e Impactante) ── */}
                    <div className="bg-stone-950/5 rounded-3xl p-5 border border-black/5 relative z-10">
                        <div className="flex justify-between items-center mb-2">
                             <p className="text-[10px] font-black uppercase text-stone-950/50 tracking-[0.4em]">Ganhos de Hoje</p>
                             <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        </div>
                        <div className="flex items-start leading-none">
                            <span className="text-3xl font-black text-stone-950/20 mt-2 mr-1 italic">R$</span>
                            <span className="text-[5.5rem] font-black text-stone-950 tracking-tighter leading-none" style={{ textShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
                                {stats.today.toFixed(2).replace('.', ',').split(',')[0]}
                            </span>
                            <div className="flex flex-col mt-auto mb-3 ml-1">
                                <span className="text-3xl font-black text-stone-950/30 leading-none">,{stats.today.toFixed(2).split('.')[1]}</span>
                            </div>
                        </div>
                    </div>

                    {/* ── Barra XP Neon Solta (Sem fundo de card, apenas a barra) ── */}
                    <div className="px-1 relative z-10">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-stone-950 leading-none">{stats.xp}</span>
                                <span className="text-[10px] font-black text-stone-950/40 uppercase tracking-widest">XP Total</span>
                            </div>
                            <p className="text-[9px] font-black text-stone-950/40 uppercase tracking-widest italic">Próximo Nível: {stats.level + 1}</p>
                        </div>
                        
                        <div className="relative h-2 w-full bg-stone-950/10 rounded-full overflow-visible">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((stats.xp % 100), 98)}%` }}
                                transition={{ duration: 1.5, ease: "circOut" }}
                                className="h-full rounded-full relative bg-stone-950"
                                style={{
                                    boxShadow: '0 0 15px 2px rgba(0,0,0,0.3), 0 0 5px rgba(255,255,255,0.2)'
                                }}
                            >
                                {/* Brilho Neon na ponta */}
                                <div 
                                    className="absolute right-0 top-1/2 -translate-y-1/2 size-4 rounded-full bg-yellow-400"
                                    style={{ 
                                        boxShadow: '0 0 15px 5px rgba(250,204,21,0.8), 0 0 30px 10px rgba(250,204,21,0.4)' 
                                    }}
                                />
                                {/* Rastro de luz */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-white/20 rounded-full" />
                            </motion.div>
                        </div>
                        
                        <div className="flex justify-between mt-2">
                            <span className="text-[8px] font-black text-stone-950/30 uppercase tracking-[0.2em]">Evolução</span>
                            <span className="text-[8px] font-black text-stone-950/30 uppercase tracking-[0.2em]">{100 - (stats.xp % 100)} XP faltantes</span>
                        </div>
                    </div>
                </header>


                <section className="space-y-2">
                    <p className="text-stone-400 font-medium uppercase tracking-widest text-xs">Disponível para entregas</p>
                    <h2 className="text-white text-4xl font-extrabold tracking-tight text-center uppercase">Missões e <span className="text-yellow-400">Vagas</span></h2>
                </section>

                <section className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                                                    <h3 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-sm text-center">Novos Pedidos</h3>
                            <button 
                                onClick={() => fetchOrders()}
                                disabled={isSyncing || !isOnline}
                                className={`size-10 flex items-center justify-center rounded-xl transition-all ${
                                    isOnline 
                                        ? isSyncing 
                                            ? 'bg-yellow-400 text-black shadow-[inset_2px_2px_6px_rgba(255,255,255,0.5),inset_-2px_-2px_6px_rgba(0,0,0,0.2)]' 
                                            : 'bg-neutral-800 text-neutral-400 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] hover:bg-neutral-700/80' 
                                        : 'bg-neutral-900/50 text-neutral-700 cursor-not-allowed opacity-50'
                                } border border-white/5 active:scale-90`}
                            >
                                <motion.div
                                    animate={isSyncing ? { rotate: 360 } : { rotate: 0 }}
                                    transition={isSyncing ? { repeat: Infinity, duration: 1.2, ease: "linear" } : { duration: 0.3 }}
                                >
                                    <Icon name="sync" size={20} />
                                </motion.div>
                            </button>
                        </div>
                        <div className="flex items-center gap-2 clay-card-dark px-5 py-2.5 rounded-full border border-white/5 shadow-inner">
                            <div className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                            <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.3em] drop-shadow-sm">Radar Ativo</p>
                        </div>
                    </div>
                    <div className="flex overflow-x-auto pb-4 gap-6 no-scrollbar -mx-6 px-6">
                        {filteredOrders.map((order) => {
                                const presentation = getServicePresentation(order);
                                const isAcceptingThis = isAccepting && (selectedOrder?.realId === (order.realId || order.id) || selectedOrder?.id === order.id);
                                
                                return (
                                    <motion.div 
                                        key={order.id} 
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="flex-shrink-0 w-[90vw] max-w-[420px] relative pt-14 pb-4"
                                    >
                                        <div className="bg-[#1e1e1e] rounded-[3rem] p-8 relative flex flex-col items-center text-center border border-white/5"
                                             style={{
                                                 boxShadow: 'inset 8px 8px 16px rgba(255, 255, 255, 0.02), inset -8px -8px 16px rgba(0, 0, 0, 0.4), 0 30px 60px rgba(0,0,0,0.6)'
                                             }}
                                        >
                                            {/* Floating 3D Icon Overlay — Design Claymorphic Gold */}
                                            <div className="absolute -top-14 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 w-28 h-28 rounded-[2.5rem] flex items-center justify-center shadow-[0_20px_40px_rgba(234,179,8,0.3),inset_4px_4px_12px_rgba(255,255,255,0.6),inset_-4px_-4px_12px_rgba(0,0,0,0.2)] transition-all transform hover:rotate-6 active:scale-95"
                                            >
                                                <Icon name={presentation.details.icon} className="text-black text-[56px] drop-shadow-lg" />
                                            </div>

                                            <div className="mt-8 w-full">
                                                <div className={`inline-block px-4 py-1.5 rounded-full ${presentation.details.bg} ${presentation.details.color} text-[10px] font-bold uppercase tracking-widest mb-2`}>
                                                    NOVA OPORTUNIDADE
                                                </div>

                                                {/* NOVO: Feedback de Preparo */}
                                                {(order.preparation_status || order.status) && (
                                                    <div className="flex justify-center mb-4">
                                                        <div className={`px-3 py-1 rounded-lg flex items-center gap-2 border ${
                                                            (order.preparation_status === 'pronto' || order.status === 'pronto')
                                                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                                                                : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                                                        }`}>
                                                            <div className={`size-1.5 rounded-full animate-pulse ${
                                                                (order.preparation_status === 'pronto' || order.status === 'pronto') ? 'bg-emerald-400' : 'bg-orange-400'
                                                            }`} />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">
                                                                {(order.preparation_status === 'pronto' || order.status === 'pronto') ? 'Pronto para Coleta' : 'Em Preparo'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}

                                                <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight tracking-tight mb-2">
                                                    Nova Entrega Disponível
                                                </h1>
                                                <p className="text-white/50 text-[10px] sm:text-[11px] mb-6 sm:mb-8 px-2 leading-relaxed">
                                                    Uma missão de entrega de alta prioridade foi atribuída disponível.
                                                </p>

                                                {/* Payment Highlight Box */}
                                                <div className="bg-[#121212] rounded-2xl p-4 sm:p-6 border border-white/5 mb-6 sm:mb-8 shadow-inner">
                                                    <p className="text-white/30 text-[9px] sm:text-[10px] uppercase tracking-widest font-bold mb-2">Você ganha</p>
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className="text-yellow-400 text-3xl sm:text-4xl font-black drop-shadow-xl">
                                                            R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}
                                                        </span>
                                                        <Icon name="local_fire_department" className="text-yellow-400 text-2xl sm:text-3xl" />
                                                    </div>
                                                    <p className="text-white/20 text-[8px] sm:text-[9px] mt-2">+ Gorjeta do cliente (se houver)</p>
                                                </div>

                                                {/* Delivery Details Grid */}
                                                <div className="grid grid-cols-2 gap-3 sm:gap-4 text-left w-full mb-6 sm:mb-8">
                                                    <div className="flex flex-col bg-white/[0.02] p-3 rounded-xl border border-white/5 col-span-2">
                                                        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-yellow-400/80 tracking-widest mb-1">{presentation.pickupLabel}</span>
                                                        <span className="text-yellow-400 text-xs sm:text-sm font-black leading-tight uppercase mb-1 truncate" title={order.store_name || order.merchant_name}>
                                                            {order.store_name || order.merchant_name || 'Estabelecimento Parceiro'}
                                                        </span>
                                                        <span className="text-white/90 text-[11px] sm:text-xs font-medium leading-relaxed drop-shadow-md break-words">
                                                            {cleanAddressText(order.origin || order.pickup_address) || presentation.pickupText || 'Endereço de coleta não informado'}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-col bg-white/[0.02] p-3 rounded-xl border border-white/5 col-span-2 relative pb-8">
                                                        <span className="text-[8px] sm:text-[9px] uppercase font-bold text-white/30 tracking-widest mb-1">Destino Final</span>
                                                        <span className="text-white/90 text-[11px] sm:text-xs font-medium leading-relaxed drop-shadow-md break-words pr-12">
                                                            {cleanAddressText(order.destination || order.delivery_address) || presentation.destinationText || 'Destino não informado'}
                                                        </span>
                                                        
                                                        {/* Floating Distance Badge */}
                                                        <div className="absolute bottom-2 right-2 bg-yellow-400 text-black px-2 py-1 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-tight shadow-md">
                                                            {order.distance_km ? `${parseFloat(order.distance_km).toFixed(1)} km` : (order.distance ? `${order.distance}` : '')}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex flex-col gap-2 sm:gap-3 w-full">
                                                    <button 
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            handleAccept(order);
                                                        }}
                                                        disabled={isAccepting}
                                                        className="w-full py-4 sm:py-5 rounded-2xl bg-yellow-400 hover:bg-yellow-500 text-black font-black uppercase text-xs sm:text-[13px] tracking-widest flex items-center justify-center gap-2 active:scale-[0.97] transition-all shadow-[0_10px_30px_rgba(250,204,21,0.2)] disabled:opacity-50"
                                                        style={{
                                                            boxShadow: 'inset 4px 4px 8px rgba(255, 255, 255, 0.4), inset -4px -4px 8px rgba(0, 0, 0, 0.2)'
                                                        }}
                                                    >
                                                        {isAcceptingThis ? (
                                                            <div className="size-5 border-4 border-black/20 border-t-black rounded-full animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Icon name="check" className="text-lg" />
                                                                {presentation.ctaLabel}
                                                            </>
                                                        )}
                                                    </button>
                                                    
                                                    <div className="flex gap-2 w-full mt-1">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedOrder(order);
                                                                setShowOrderModal(true);
                                                            }}
                                                            className="flex-1 py-3 rounded-xl text-white/50 font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all hover:text-white hover:bg-white/5"
                                                        >
                                                            Detalhes
                                                        </button>
                                                        <button 
                                                            onClick={() => {
                                                                if(window.confirm('Recusar remove esta entrega da sua lista temporariamente. Tem certeza?')) {
                                                                    handleDeclineOrder(order.realId || order.id);
                                                                }
                                                            }}
                                                            className="flex-[0.5] py-3 rounded-xl text-red-500/50 font-bold uppercase text-[9px] tracking-widest active:scale-95 transition-all hover:text-red-400 hover:bg-red-500/10"
                                                        >
                                                            Recusar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        }
                    </div>
                </section>

                {/* Seção de Vagas Dedicadas no Dashboard */}
                <section className="space-y-6">
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                                                <h3 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-sm text-center">Vagas Dedicadas</h3>
                                          <button 
                    onClick={() => setActiveTab('dedicated')} 
                    className="clay-card-dark flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 shadow-inner drop-shadow-sm group active:scale-95 transition-all"
                  >
                    <div className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                    <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.3em] drop-shadow-sm">Ver Todas</p>
                  </button>
                    </div>
                    <div className="grid gap-4">
                        {dedicatedSlots.length === 0 ? (
                            <p className="text-[10px] text-white/30 font-black uppercase tracking-widest text-center py-4">Nenhuma vaga no momento</p>
                        ) : (
                            dedicatedSlots.slice(0, 2).map((slot: any) => {
                                const application = myApplications.find(app => String(app.slot_id) === String(slot.id));
                                const hasApplied = !!application;
                                const isAccepted = application?.status === 'accepted';
                                const maxDeliveries = (slot.metadata?.base_deliveries || slot.max_deliveries || 0);
                                
                                // Oculta o card do dashboard 1 hora após o lojista aceitar o entregador
                                if (isAccepted && application?.updated_at) {
                                    const acceptedAt = new Date(application.updated_at).getTime();
                                    const oneHourMs = 60 * 60 * 1000;
                                    if (Date.now() - acceptedAt > oneHourMs) return null;
                                }
                                
                                return (
                                    <motion.button 
                                        key={slot.id}
                                        onClick={() => { setSelectedSlot(slot); setActiveTab('dedicated'); }}
                                        className={`relative w-full rounded-[48px] overflow-hidden p-8 flex flex-col gap-6 text-left active:scale-[0.97] transition-all group shadow-[30px_30px_60px_rgba(0,0,0,0.9),inset_10px_10px_25px_rgba(255,255,255,0.03),inset_-10px_-10px_25px_rgba(0,0,0,0.7)] ${isAccepted ? 'border-2 border-emerald-500/40' : 'border border-white/5'}`}
                                        style={{
                                            background: isAccepted 
                                                ? "linear-gradient(145deg, #062016, #0a0a0c)" 
                                                : "linear-gradient(145deg, #1a1a1d, #121214)",
                                        }}
                                    >
                                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] pointer-events-none group-hover:scale-110 transition-all duration-1000 ${isAccepted ? 'bg-emerald-500/10' : 'bg-yellow-400/5'}`} />

                                        <div className="relative z-10 flex items-start justify-between">
                                            <div className="flex gap-5 items-center flex-1 min-w-0 pr-4">
                                                <div className={`size-16 rounded-[24px] bg-zinc-900 border flex items-center justify-center shrink-0 shadow-inner overflow-hidden relative ${isAccepted ? 'border-emerald-500/20' : 'border-white/5'}`}>
                                                    {slot.admin_users?.store_logo ? (
                                                        <img src={slot.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <div className={`size-full flex items-center justify-center ${isAccepted ? 'bg-emerald-500/10' : 'bg-yellow-400/10'}`}>
                                                            <Icon name="military_tech" className={isAccepted ? 'text-emerald-400' : 'text-yellow-400'} size={32} />
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <div className={`size-4 rounded-full flex items-center justify-center border ${isAccepted ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-blue-500/20 border-blue-500/30'}`}>
                                                            <Icon name="verified" className={isAccepted ? 'text-emerald-400' : 'text-blue-400'} size={10} />
                                                        </div>
                                                        <p className={`text-[10px] font-black uppercase tracking-[0.2em] truncate ${isAccepted ? 'text-emerald-400' : 'text-blue-400'}`}>
                                                            {slot.admin_users?.store_name || 'Parceiro Izi'}
                                                        </p>
                                                    </div>
                                                    <h4 className={`text-lg font-black tracking-tight truncate leading-tight mb-1 ${isAccepted ? 'text-emerald-400' : 'text-white'}`}>{slot.title}</h4>
                                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                        <Icon name="location_on" className="text-zinc-600" size={10} />
                                                        <span className="truncate">{slot.admin_users?.store_address || 'Unidade Local'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="text-right shrink-0 bg-black/20 p-4 rounded-[28px] border border-white/5 shadow-inner">
                                                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 opacity-70">VALOR DIÁRIA</p>
                                                <div className="flex flex-col items-end">
                                                    <p className={`text-2xl font-black leading-none ${isAccepted ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                                        <span className="text-xs mr-0.5 not-italic font-bold opacity-60">R$</span>
                                                        {parseFloat(slot.fee_per_day || 0).toFixed(0)}
                                                    </p>
                                                    <div className={`mt-2 py-1 px-3 ${isAccepted ? 'bg-emerald-500' : 'bg-yellow-400'} text-black rounded-full shadow-lg`}>
                                                        <p className="text-[8px] font-black uppercase tracking-tight">Até {maxDeliveries} Entregas</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {hasApplied && (
                                            <div className={`relative z-10 mx-6 mt-2 px-6 py-3 rounded-2xl flex items-center justify-between border bg-black/40 backdrop-blur-md ${isAccepted ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-yellow-500/10'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`size-2 rounded-full animate-pulse ${isAccepted ? 'bg-emerald-400' : 'bg-yellow-400'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isAccepted ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                                        {isAccepted ? 'VAGA CONQUISTADA' : 'AGUARDANDO LOJISTA'}
                                                    </span>
                                                </div>
                                                <Icon name={isAccepted ? 'verified' : 'hourglass_empty'} size={16} className={isAccepted ? 'text-emerald-400' : 'text-yellow-400'} />
                                            </div>
                                        )}

                                        <div className="relative z-10 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                        <div className="relative z-10 flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <div className={`size-8 rounded-xl flex items-center justify-center border shrink-0 ${isAccepted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-yellow-400/10 border-yellow-400/20'}`}>
                                                    <Icon name="schedule" className={isAccepted ? 'text-emerald-400' : 'text-yellow-400'} size={14} />
                                                </div>
                                                <p className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">{slot.working_hours}</p>
                                            </div>
                                            <div className={`flex items-center gap-2 font-black uppercase text-[10px] tracking-widest ${isAccepted ? 'text-emerald-400' : 'text-yellow-400'}`}>
                                                {isAccepted ? 'Ver Posto de Trabalho' : 'Ver Detalhes'} <Icon name="arrow_forward" size={14} />
                                            </div>
                                        </div>
                                    </motion.button>
                                );
                            })
                        )}
                    </div>
                </section>

                {/* Seção de Agendamentos no Dashboard - Filtrado para mostrar APENAS os disponíveis conforme solicitação */}
                {(isOnline || scheduledOrders.some(o => !o.driver_id)) && (
                    <section className="space-y-6">
                        <div className="flex flex-col items-center justify-center gap-4 text-center">
                                                        <h3 className="text-2xl font-black text-white tracking-tighter uppercase drop-shadow-sm text-center">Agendamentos</h3>
                                                        <button 
                                onClick={() => setActiveTab('scheduled')} 
                                className="clay-card-dark flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/5 shadow-inner drop-shadow-sm group active:scale-95 transition-all"
                            >
                                <div className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                                <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.3em] drop-shadow-sm">Ver Calendário</p>
                            </button>
                        </div>
                        {scheduledOrders.filter(o => !o.driver_id).length > 0 ? (
                            <div className="space-y-4">
                                {scheduledOrders.filter(o => !o.driver_id).slice(0, 3).map((order: any) => {
                                    const dt = new Date(order.scheduled_at);
                                    return (
                                        <motion.button 
                                            key={order.id}
                                            onClick={() => { setSelectedScheduledOrder(order); setActiveTab('scheduled'); }}
                                            className="relative w-full rounded-[48px] overflow-hidden p-8 flex flex-col gap-6 text-left active:scale-[0.97] transition-all group shadow-[30px_30px_60px_rgba(0,0,0,0.9),inset_10px_10px_25px_rgba(255,255,255,0.03),inset_-10px_-10px_25px_rgba(0,0,0,0.7)]"
                                            style={{
                                                background: "linear-gradient(145deg, #1a1a1d, #121214)",
                                                border: "1px solid rgba(250,204,21,0.12)"
                                            }}
                                        >
                                            {/* PREMIUM EFFECTS */}
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-yellow-400/10 transition-all duration-1000" />
                                            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />
                                            
                                            <div className="relative z-10 flex items-start justify-between">
                                                <div className="flex gap-5 items-center flex-1 min-w-0 pr-4">
                                                    <div className="size-16 rounded-[24px] bg-zinc-900 border border-white/5 flex items-center justify-center shrink-0 shadow-[10px_10px_25px_rgba(0,0,0,0.6),inset_2px_2px_4px_rgba(255,255,255,0.05)] overflow-hidden relative">
                                                        <div className="size-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 flex flex-col items-center justify-center">
                                                            <p className="text-[10px] font-black text-yellow-500 uppercase">{dt.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.','')}</p>
                                                            <p className="text-xl font-black text-yellow-400 leading-none">{dt.getDate()}</p>
                                                        </div>
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none" />
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1.5">
                                                            <div className="size-4 rounded-full bg-yellow-400/20 flex items-center justify-center border border-yellow-400/30">
                                                                <Icon name="schedule" className="text-yellow-400" size={10} />
                                                            </div>
                                                            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] drop-shadow-[0_0_12px_rgba(250,204,21,0.5)] truncate">
                                                                {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h
                                                            </p>
                                                        </div>
                                                        <h4 className="text-lg font-black text-white tracking-tight truncate leading-tight mb-1">{order.store_name || order.merchant_name || 'Agendamento Izi'}</h4>
                                                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                            <Icon name="location_on" className="text-zinc-600" size={10} />
                                                            <span className="truncate">{order.pickup_address || 'Endereço Indisponível'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right shrink-0 bg-black/20 p-4 rounded-[28px] border border-white/5 shadow-[inset_2px_2px_8px_rgba(0,0,0,0.4)]">
                                                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 opacity-70">LÃQUIDO</p>
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-xl font-black text-emerald-400 leading-none">
                                                            <span className="text-[10px] mr-0.5 not-italic text-emerald-400/60 font-bold">R$</span>
                                                            {getNetEarnings(order).toFixed(2).replace('.', ',')}
                                                        </p>
                                                        <div className="mt-2 py-1 px-3 bg-emerald-500 text-white rounded-full shadow-[2px_2px_8px_rgba(16,185,129,0.2)]">
                                                            <p className="text-[9px] font-black uppercase tracking-tight">
                                                                ESCALA
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative z-10 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                                            <div className="relative z-10 flex items-center justify-between w-full">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20 shrink-0">
                                                        <Icon name="info" className="text-yellow-400" size={14} />
                                                    </div>
                                                    <p className="text-[11px] text-zinc-300 font-bold uppercase tracking-wider">Detalhes da Entrega</p>
                                                </div>
                                                
                                                <div className="flex items-center gap-2 text-yellow-400 font-black uppercase text-[10px] tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.3)]">
                                                    Aceitar <Icon name="chevron_right" size={14} />
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-10 rounded-[32px] border border-white/5 border-dashed flex flex-col items-center gap-3 text-center opacity-40">
                                <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma escala disponível</p>
                            </div>
                        )}
                    </section>
                )}
                </div>
            </div>
        </div>
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
                        <h1 className="font-black text-yellow-400 text-xl tracking-tighter uppercase">
                            {isMine ? 'Detalhes do Agendamento' : 'Aceitar Agendamento'}
                        </h1>
                    </div>
                </header>
                
                {/* Estilos Claymorphism */}
                {(() => {
                    const sClayDark: React.CSSProperties = {
                        background: '#121212',
                        borderRadius: '2.5rem',
                        boxShadow: '8px 8px 16px rgba(0,0,0,0.6), inset 4px 4px 8px rgba(255,255,255,0.02), inset -4px -4px 8px rgba(0,0,0,0.8)',
                    };
                    const sClayIcon: React.CSSProperties = {
                        background: '#1A1A1A',
                        boxShadow: '4px 4px 8px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.02)',
                    };
                
                    return (
                        <>
                <main className="pt-24 px-6 space-y-8 overflow-y-auto pb-40 no-scrollbar">
                     <div className="clay-card-yellow p-8 text-black relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 opacity-10 transform rotate-12">
                            <Icon name="local_shipping" size={160} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="bg-black/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Detalhes da Escala</div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black opacity-60 uppercase">Ganho Líquido</p>
                                    <p className="text-4xl font-black">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex flex-col items-center gap-4 w-full text-center">
                                    <div className="size-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl">
                                        <Icon name="calendar_month" size={32} className="text-yellow-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-60 tracking-widest">Data Programada</p>
                                        <p className="text-xl font-black uppercase">{dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-center gap-4 w-full text-center">
                                    <div className="size-16 bg-black/5 border border-black/10 rounded-2xl flex items-center justify-center">
                                        <Icon name="schedule" size={32} className="text-black" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black uppercase opacity-60 tracking-widest">Horário de Início</p>
                                        <p className="text-xl font-black uppercase">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-black/5 border border-black/10 rounded-[32px] space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Icon name="location_on" size={20} className="mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">Ponto de Partida</p>
                                            <p className="font-bold text-sm leading-tight">{cleanAddressText(order.pickup_address)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Icon name="flag" size={20} className="mt-1" />
                                        <div>
                                            <p className="text-[10px] font-black uppercase opacity-40 mb-1">Endereço de Entrega</p>
                                            <p className="font-bold text-sm leading-tight">
                                                {cleanAddressText(order.delivery_address || 'Destino não informado')}
                                            </p>
                                        </div>
                                    </div>
                                    {(() => {
                                        const embeddedObs = order.delivery_address?.includes('|') 
                                            ? order.delivery_address.split('|')[1]?.replace(/^\s*OBS:\s*/i, '').trim() 
                                            : null;
                                        const obsText = order.notes || embeddedObs;
                                        if (!obsText) return null;
                                        return (
                                            <>
                                                <div className="w-full h-px bg-black/10 my-2" />
                                                <div className="flex items-start gap-3">
                                                    <Icon name="chat_bubble" size={20} className="mt-1" />
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase opacity-40 mb-1">Observações do Cliente</p>
                                                        <p className="font-bold text-sm leading-snug text-stone-800">{obsText}</p>
                                                    </div>
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                     </div>
                     <div className="p-8 border border-white/5 backdrop-blur-md" style={sClayDark}>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-10 rounded-xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="info" size={18} className="text-yellow-400" />
                            </div>
                            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Regras do Agendamento</h4>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex gap-4 text-xs text-white/50 font-bold items-start line-clamp-2 leading-relaxed font-italic uppercase tracking-tight">
                                <span className="text-yellow-400 font-black">â€¢</span> 
                                Comparecer ao local com 15 min de antecedência.
                            </li>
                            <li className="flex gap-4 text-xs text-white/50 font-bold items-start line-clamp-2 leading-relaxed font-italic uppercase tracking-tight">
                                <span className="text-yellow-400 font-black">â€¢</span> 
                                Estar com bateria do celular acima de 80%.
                            </li>
                            <li className="flex gap-4 text-xs text-white/50 font-bold items-start line-clamp-2 leading-relaxed font-italic uppercase tracking-tight">
                                <span className="text-yellow-400 font-black">â€¢</span> 
                                Traje profissional e baú limpo.
                            </li>
                            <li className="flex gap-4 text-xs text-yellow-400/70 font-black items-start leading-relaxed uppercase tracking-tight">
                                <span className="text-yellow-400 font-black">â€¢</span> 
                                O início da missão só é liberado no horário exato.
                            </li>
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
                            Aceitar
                        </button>
                    ) : isMine ? (
                        (() => {
                            const now = new Date();
                            const scheduledDate = new Date(order.scheduled_at);
                            // Permite iniciar a partir do horário exato do agendamento
                            const canStartVisible = now.getTime() >= scheduledDate.getTime();
                            
                            if (!canStartVisible) {
                                return (
                                    <div className="w-full h-20 border border-white/5 flex flex-col items-center justify-center gap-1 backdrop-blur-md opacity-70" style={sClayDark}>
                                        <div className="flex items-center gap-2">
                                            <Icon name="schedule" className="text-yellow-400" size={18} />
                                            <span className="text-yellow-400 font-bold uppercase tracking-widest text-[11px]">Início Bloqueado</span>
                                        </div>
                                        <p className="text-[10px] font-black text-white/50 uppercase tracking-tighter">
                                            Disponível em {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h do dia {scheduledDate.getDate()}/{scheduledDate.getMonth()+1}
                                        </p>
                                    </div>
                                );
                            }

                             if (['concluido', 'cancelado', 'finalizado', 'delivered', 'entregue'].includes((order.status || '').toLowerCase())) {
                                return (
                                    <button 
                                        onClick={() => {
                                            setSelectedScheduledOrder(null);
                                            setScheduledOrders(prev => prev.filter(s => s.id !== order.id));
                                            setActiveMission(null);
                                            localStorage.removeItem('Izi_active_mission');
                                            setActiveTab('dashboard');
                                        }}
                                        className="w-full h-20 bg-zinc-900 text-white rounded-[28px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10"
                                    >
                                        <Icon name="check_circle" className="text-emerald-400" />
                                        Missão Concluída â€¢ Fechar
                                    </button>
                                );
                            }

                            return (
                                <button 
                                    onClick={() => {
                                        // Ao iniciar um agendamento, ele se torna a missão ativa
                                        const mission = { 
                                            ...order, 
                                            realId: order.id,
                                            type: order.service_type || 'generic',
                                            customer: 'Cliente Izi'
                                        };
                                        setActiveMission(mission);
                                        localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
                                        setSelectedScheduledOrder(null);
                                        setActiveTab('active_mission');
                                    }}
                                    className="w-full h-20 bg-emerald-500 text-white rounded-[28px] font-black text-xl uppercase tracking-tighter shadow-[0_20px_40px_rgba(16,185,129,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Icon name="play_arrow" size={32} />
                                    Iniciar Missão
                                </button>
                            );
                        })()
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
                        </>
                    );
                })()}
            </motion.div>
        );
    };

    const renderScheduledView = () => {
        if (selectedScheduledOrder) return renderScheduledDetailView();
        
        const myAgenda = scheduledOrders.filter((o: any) => o.driver_id && String(o.driver_id).trim() === String(driverId).trim());
        const availableAgenda = scheduledOrders.filter((o: any) => !o.driver_id || String(o.driver_id).trim() === '');
        
        const terminalStatuses = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'];
        const currentList = (subTabScheduled === 'confirmed' ? myAgenda : availableAgenda).filter(o => 
            !terminalStatuses.includes((o.status || '').toLowerCase())
        );

        return (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="pb-32 px-4 max-w-2xl mx-auto space-y-6 pt-4">
                <section className="px-2">
                    <div className="flex flex-col gap-4">
                        <div>
                            <p className="text-zinc-500 font-bold uppercase tracking-[0.4em] text-[10px] mb-1">Planejamento</p>
                            <h2 className="text-3xl font-black text-white tracking-tighter uppercase text-center">Agenda de Entregas</h2>
                        </div>
                        
                        {/* Tab Selector */}
                        <div className="flex bg-black/40 backdrop-blur-xl p-1.5 rounded-[24px] border border-white/5 shadow-inner">
                            <button 
                                onClick={() => setSubTabScheduled('confirmed')}
                                className={`flex-1 h-12 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                    subTabScheduled === 'confirmed' 
                                    ? 'bg-yellow-400 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)]' 
                                    : 'text-zinc-500 hover:text-zinc-400'
                                }`}
                            >
                                <Icon name="event_available" size={16} />
                                Minha Agenda
                                {myAgenda.length > 0 && (
                                    <span className={`size-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                        subTabScheduled === 'confirmed' ? 'bg-black text-yellow-400' : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                        {myAgenda.length}
                                    </span>
                                )}
                            </button>
                            <button 
                                onClick={() => setSubTabScheduled('available')}
                                className={`flex-1 h-12 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
                                    subTabScheduled === 'available' 
                                    ? 'bg-yellow-400 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)]' 
                                    : 'text-zinc-500 hover:text-zinc-400'
                                }`}
                            >
                                <Icon name="explore" size={16} />
                                Disponíveis
                                {availableAgenda.length > 0 && (
                                    <span className={`size-5 rounded-full flex items-center justify-center text-[9px] font-black ${
                                        subTabScheduled === 'available' ? 'bg-black text-yellow-400' : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                        {availableAgenda.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </section>

                <div className="space-y-6">
                    {currentList.length === 0 ? (
                        <div className="py-24 bg-white/[0.02] border border-white/5 border-dashed rounded-[40px] flex flex-col items-center gap-6 text-center px-8">
                            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
                                <Icon name={subTabScheduled === 'confirmed' ? 'calendar_today' : 'search'} className="text-4xl text-white/20" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                                    {subTabScheduled === 'confirmed' ? 'Sua agenda está vazia' : 'Nenhum agendamento aberto'}
                                </p>
                                <p className="text-xs text-white/20 px-6 leading-relaxed">
                                    {subTabScheduled === 'confirmed' 
                                        ? 'Confirme entregas agendadas na aba Disponíveis para organizar seu dia.' 
                                        : 'Fique de olho! Novos agendamentos podem aparecer a qualquer momento.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        currentList.map((order: any, i: number) => {
                            const dt = new Date(order.scheduled_at);
                            const isConfirmed = !!order.driver_id;
                            const isOdd = i % 2 !== 0; 
                            const cardClass = isConfirmed ? "clay-card-yellow" : (isOdd ? "clay-card-dark" : "clay-card-yellow");
                            const textColor = isConfirmed ? "text-black" : (isOdd ? "text-white" : "text-black");
                            const iconBg = isConfirmed ? "bg-black text-yellow-400" : (isOdd ? "bg-yellow-400 text-black" : "bg-black text-yellow-400");
                            const btnClass = isConfirmed 
                                ? "bg-black text-yellow-400 shadow-lg"
                                : (isOdd ? "bg-yellow-400 text-black shadow-[0_4px_15px_rgba(250,204,21,0.3)]" : "bg-black text-yellow-400 shadow-lg");

                            return (
                                <motion.div 
                                    key={order.id}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`${cardClass} p-8 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all`}
                                    onClick={() => setSelectedScheduledOrder(order)}
                                >
                                    <div className={`absolute -right-4 -top-4 opacity-[0.08] transform rotate-12 group-hover:scale-110 transition-transform duration-500 ${textColor}`}>
                                        <Icon name={order.service_type === 'package' ? 'package_2' : 'local_shipping'} size={140} />
                                    </div>

                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`${isConfirmed || !isOdd ? 'bg-black/10 text-black' : 'bg-yellow-400 text-black'} px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2`}>
                                                <div className={`size-1.5 rounded-full ${isConfirmed ? 'bg-green-600 animate-pulse' : 'bg-yellow-500'}`} />
                                                {order.service_type || 'Entrega Expressa'}
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-[8px] font-black uppercase tracking-widest opacity-60`}>Valor Líquido</p>
                                                <p className={`text-2xl font-black`}>R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-4 mb-6 ${textColor}`}>
                                            <div className={`${iconBg} size-12 rounded-2xl flex items-center justify-center shadow-lg`}>
                                                <Icon name="calendar_month" size={24} />
                                            </div>
                                            <div>
                                                <p className="font-black text-lg leading-none uppercase tracking-tighter">
                                                    {dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' }).replace('.', '')}
                                                </p>
                                                <p className={`text-sm font-bold mt-1 opacity-70`}>
                                                    {dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className={`space-y-4 mb-8 ${textColor}`}>
                                            <div className="flex items-start gap-3">
                                                <Icon name="location_on" size={18} className="opacity-60" />
                                                <div className="space-y-1">
                                                    <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Rotas de Coleta/Entrega</p>
                                                    <p className="font-bold text-sm leading-tight">{cleanAddressText(order.pickup_address).split(',')[0]} â†’ {cleanAddressText(order.delivery_address).split(',')[0]}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button className={`flex-1 ${btnClass} font-black text-[10px] uppercase tracking-[0.2em] py-4 rounded-[22px] active:scale-95 transition-all flex items-center justify-center gap-3`}>
                                                {isConfirmed ? (
                                                    <><Icon name="task_alt" size={18} /> Ver Minha Agenda</>
                                                ) : (
                                                    <><Icon name="arrow_forward" size={18} /> Avaliar Oferta</>
                                                )}
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
                        <h2 className="text-3xl font-black text-white tracking-tight mt-1 text-center uppercase">Vagas Dedicadas</h2>
                        <p className="text-xs text-white/30 mt-1">Seja piloto exclusivo de um parceiro Izi.</p>
                    </header>

                    {dedicatedSlots.length === 0 ? (
                        <div className="py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-[40px] flex flex-col items-center gap-4 text-center">
                            <Icon name="sentiment_dissatisfied" className="text-4xl text-white/10" />
                            <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhuma vaga disponível</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {[...dedicatedSlots]
                                .filter(s => {
                                    // Regra de ouro: Vaga confirmada (por mim ou por qualquer um via is_active) SAI DA TELA
                                    const myApp = myApplications.find(app => String(app.slot_id) === String(s.id));
                                    if (myApp?.status === 'accepted') return false;
                                    return s.is_active;
                                })
                                .sort((a, b) => {
                                const appA = myApplications.find(app => String(app.slot_id) === String(a.id));
                                const appB = myApplications.find(app => String(app.slot_id) === String(b.id));
                                if (appA?.status === 'accepted' && appB?.status !== 'accepted') return -1;
                                if (appB?.status === 'accepted' && appA?.status !== 'accepted') return 1;
                                return 0;
                            }).map((s: any, i: number) => {
                                const hasApplied = myApplications.some(app => String(app.slot_id) === String(s.id));
                                const application = myApplications.find(app => String(app.slot_id) === String(s.id));
                                const isAccepted = application?.status === 'accepted';
                                
                                return (
                                    <motion.button 
                                        key={s.id} 
                                        initial={{ opacity: 0, scale: 0.9, y: 10 }} 
                                        animate={{ opacity: 1, scale: 1, y: 0 }} 
                                        transition={{ delay: i * 0.05 }}
                                        onClick={() => setSelectedSlot(s)}
                                        className={`w-full transition-all p-8 flex items-center gap-6 group text-left relative overflow-hidden active:scale-[0.98] ${
                                            isAccepted 
                                            ? 'clay-card-dark border-2 border-emerald-500/30' 
                                            : 'clay-card-exclusive border border-white/5'
                                        }`}
                                    >
                                        {/* Efeito de brilho para vagas aprovadas */}
                                        {isAccepted && (
                                            <div className="absolute inset-0 bg-emerald-500/[0.03] pointer-events-none" />
                                        )}

                                        <div className="size-16 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-center shrink-0 overflow-hidden shadow-inner group-hover:scale-105 transition-transform duration-500">
                                            {s.admin_users?.store_logo
                                                ? <img src={s.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
                                                : <div className="bg-primary/10 size-full flex items-center justify-center"><Icon name="stars" size={28} className="text-primary" /></div>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`size-1.5 rounded-full ${isAccepted ? 'bg-emerald-400' : 'bg-primary animate-pulse'} shadow-[0_0_8px_${isAccepted ? '#10b881' : '#ffd900'}]`}></span>
                                                <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] truncate">
                                                    {s.admin_users?.store_name || 'Parceiro Exclusivo'}
                                                </p>
                                            </div>
                                            <p className={`text-lg font-black tracking-tight leading-tight group-hover:text-primary transition-colors ${isAccepted ? 'text-emerald-400' : 'text-white'}`}>{s.title}</p>
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1.5 bg-white/[0.05] px-3 py-1 rounded-full border border-white/5">
                                                    <Icon name="schedule" size={12} className="text-primary/60" />
                                                    <p className="text-[9px] text-white/50 font-black uppercase tracking-wider">{s.working_hours || 'A combinar'}</p>
                                                </div>
                                                <div className="flex items-center gap-1.5 bg-white/[0.05] px-3 py-1 rounded-full border border-white/5">
                                                    <Icon name="local_shipping" size={12} className="text-primary/60" />
                                                    <p className="text-[9px] text-white/50 font-black uppercase tracking-wider">Dedicado</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                                            <div className={`${isAccepted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-primary/10 border-primary/20'} border px-4 py-2 rounded-2xl shadow-xl transition-all`}>
                                                <p className={`text-xl font-black leading-none ${isAccepted ? 'text-emerald-400' : 'text-primary'}`}>R$ {parseFloat(s.fee_per_day || 0).toFixed(0)}</p>
                                                <p className={`text-[7px] font-black uppercase tracking-tighter text-center ${isAccepted ? 'text-emerald-400/60' : 'text-primary/60'}`}>p/ dia</p>
                                            </div>
                                            {hasApplied && (
                                                <div className="flex flex-col items-end gap-1.5 mt-2 transition-all">
                                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isAccepted ? 'bg-emerald-500 text-black shadow-[0_5px_15px_rgba(16,185,129,0.3)]' : 'bg-white/10 text-white/40 border border-white/5 shadow-inner'}`}>
                                                        {isAccepted ? (
                                                            <><Icon name="verified" size={10} /> Vaga Confirmada</>
                                                        ) : (
                                                            'Em Análise'
                                                        )}
                                                        {application?.status === 'pending' && <div className="size-1 bg-yellow-400 rounded-full animate-ping" />}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Background glow effect */}
                                        <div className={`absolute -right-10 -bottom-10 size-40 blur-[80px] rounded-full transition-all duration-700 ${isAccepted ? 'bg-emerald-500/10' : 'bg-primary/5 group-hover:bg-primary/10'}`}></div>
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
        
        const customBenefits = slot.metadata?.custom_benefits || [];
        const neighborhoodExtras = slot.metadata?.bairros_extras || slot.metadata?.neighborhood_extras || [];
        const requirements: string[] = slot.metadata?.custom_specialties || [];

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
                                <h2 className="text-4xl font-black text-white tracking-tighter leading-none text-center uppercase">{slot.title}</h2>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="px-6 space-y-12 py-12">
                    {/* Ganho Card em Claymorphism */}
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="p-10 clay-card-yellow text-zinc-950 relative overflow-hidden group"
                    >
                        <div className="absolute -right-10 -bottom-10 size-40 bg-white/20 blur-[60px] rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-6">
                                <p className="font-black uppercase opacity-60 text-[10px] tracking-[0.34em]">Diária Garantida</p>
                                <div className="size-10 rounded-xl bg-black/10 flex items-center justify-center">
                                    <Icon name="paid" size={22} className="text-zinc-900" />
                                </div>
                            </div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-3xl font-black opacity-40">R$</span>
                                <span className="text-8xl font-black tracking-tighter leading-none drop-shadow-sm">{parseFloat(slot.fee_per_day || 0).toFixed(0)}</span>
                            </div>
                            <div className="mt-8 flex items-center gap-3 bg-white/20 w-fit px-6 py-3 rounded-full border border-white/20 backdrop-blur-md shadow-inner">
                                <Icon name="schedule" size={16} className="text-zinc-900" />
                                <p className="text-[11px] font-black uppercase tracking-widest">{slot.working_hours}</p>
                            </div>
                        </div>
                        <Icon name="payments" size={160} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
                    </motion.div>

                    {/* Benefícios e Extras */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                            <div className="size-12 rounded-2xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="location_on" size={20} className="text-primary" />
                            </div>
                            <div className="space-y-1 w-full overflow-hidden px-2">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Endereço Base</p>
                                <p className="text-xs font-black text-white break-words line-clamp-2 w-full leading-tight uppercase tracking-tight" title={slot.admin_users?.store_address || slot.city}>
                                    {slot.admin_users?.store_address || slot.city || 'Sua Região'}
                                </p>
                            </div>
                        </div>
                        <div className="p-6 flex flex-col items-center text-center space-y-3" style={sClayDark}>
                            <div className="size-12 rounded-2xl flex items-center justify-center border border-white/5" style={sClayIcon}>
                                <Icon name="analytics" size={20} className="text-primary" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Após {slot.metadata?.base_deliveries || 0} saídas</p>
                                <p className="text-sm font-black text-white">R$ {parseFloat(slot.metadata?.fee_per_extra_delivery || 0).toFixed(2).replace('.', ',')} extra</p>
                            </div>
                        </div>
                    </div>

                    {/* Bonus Extra */}
                    {customBenefits.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
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
                                            <p className="text-lg font-black text-primary leading-none">+ R$ {parseFloat(ben.value || 0).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    
                    {/* Regiões Extras */}
                    {neighborhoodExtras.length > 0 && (
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <span className="size-2 rounded-full bg-primary" />
                                Taxas por Região
                            </h3>
                            <div className="flex overflow-x-auto gap-4 -mx-6 px-6 no-scrollbar pb-2">
                                {neighborhoodExtras.map((item: any, idx: number) => (
                                    <div key={idx} className="flex-shrink-0 w-40 p-6 flex flex-col gap-4 border border-white/5" style={sClayDark}>
                                        <div className="size-10 rounded-xl flex items-center justify-center" style={sClayIcon}>
                                            <Icon name="location_on" className="text-primary" size={20} />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">{item.label}</p>
                                            <p className="text-lg font-black text-primary leading-none">+ R$ {parseFloat(item.fee || item.value || 0).toFixed(2).replace('.', ',')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Descrição */}
                    {slot.description && (
                        <section className="space-y-6">
                             <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
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
                        <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                            <span className="size-2 rounded-full bg-primary" />
                            Requisitos
                        </h3>
                        {requirements.length === 0 ? (
                            <div className="p-5 border border-white/5 rounded-[2rem] flex items-center gap-4 opacity-40" style={sClayDark}>
                                <Icon name="check_circle" size={20} className="text-primary shrink-0" />
                                <p className="text-xs font-bold text-white/50 uppercase tracking-wide">Nenhum requisito específico cadastrado</p>
                            </div>
                        ) : (
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
                        )}
                    </section>
                </div>
            </motion.div>
        );
    };



    const renderHistoryView = () => {
        const serviceTypeLabel = (type: string) => {
            const t = (type || 'entrega').toLowerCase();
            if (['restaurant', 'restaurante', 'food'].includes(t)) return 'Restaurante';
            if (['market', 'mercado'].includes(t)) return 'Mercado';
            if (['pharmacy', 'farmacia'].includes(t)) return 'Farmácia';
            if (['mototaxi', 'moto_taxi'].includes(t)) return 'Mototaxi';
            if (['car_ride'].includes(t)) return 'Corrida Carro';
            if (['motorista_particular'].includes(t)) return 'Motorista Particular';
            if (['van'].includes(t)) return 'Van';
            if (['utilitario'].includes(t)) return 'Utilitário';
            if (['frete', 'carreto', 'logistica'].includes(t)) return 'Frete';
            if (['beverages', 'bebidas'].includes(t)) return 'Bebidas';
            return 'Entrega';
        };

        return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-40 pt-4">
            <header className="flex flex-col items-center text-center gap-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Histórico</p>
                <h2 className="text-3xl font-black text-white tracking-tight text-center uppercase">Sua Jornada</h2>
                <p className="text-xs text-white/40 mt-1">Registro consolidado de suas corridas e ganhos.</p>
            </header>

            <div className="space-y-4">
                {history.length === 0 ? (
                    <div className="py-24 clay-card-dark rounded-[40px] flex flex-col items-center gap-6 text-center shadow-2xl relative overflow-hidden">
                        <div className="size-20 rounded-full bg-[#1A1616] border border-white/5 flex items-center justify-center shadow-[inset_3px_3px_10px_rgba(0,0,0,0.4)]">
                            <Icon name="history_toggle_off" className="text-4xl text-primary/50" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white uppercase tracking-widest mb-1">Nenhuma Jornada</p>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Você ainda não completou corridas</p>
                        </div>
                    </div>
                ) : (
                    history.map((order: any, i: number) => {
                        let netEarnings = getNetEarnings(order);
                        const completedAt = order.updated_at || order.created_at;
                        
                        const isCashPaid = order.payment_method === 'dinheiro' || order.payment_method === 'cash';
                        const totalOrderPrice = Number(order.total_price || order.price || 0);

                        let netEarningsLabel = `R$ ${netEarnings.toFixed(2).replace('.', ',')}`;
                        let isNegative = false;

                        if (isCashPaid && totalOrderPrice > 0) {
                            netEarnings = netEarnings - totalOrderPrice;
                            isNegative = netEarnings < 0;
                            netEarningsLabel = `${isNegative ? '-' : ''} R$ ${Math.abs(netEarnings).toFixed(2).replace('.', ',')}`;
                        }

                        return (
                        <div 
                            key={order.id} 
                            onClick={() => {
                                setSelectedOrder(order);
                                setShowOrderModal(true);
                            }}
                            className="clay-card-dark rounded-[32px] p-6 space-y-5 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full transition-opacity group-hover:bg-primary/20" />
                            
                            <div className="flex items-center justify-between relative z-10">
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] bg-black/20 px-3 py-1 rounded-full shadow-inner">
                                    #{order.id.slice(0, 8).toUpperCase()}
                                </span>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]">
                                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                    Finalizado
                                </span>
                            </div>

                            <div className="bg-[#120F0F] rounded-3xl p-5 border border-white/5 shadow-[inset_2px_2px_8px_rgba(0,0,0,0.5)] relative z-10">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex flex-col items-center gap-1 mt-1">
                                            <div className="size-2 rounded-full border-2 border-primary bg-[#120F0F]" />
                                            <div className="w-[1px] h-6 border-l border-dashed border-white/10" />
                                            <div className="size-2 rounded-full border-2 border-white/20 bg-[#120F0F]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-0.5">{serviceTypeLabel(order.service_type)}</p>
                                            <p className="text-sm font-black text-white leading-tight">{cleanAddressText(order.delivery_address || order.destination || 'Endereço Indisponível')}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 pt-3 mt-3 border-t border-white/5">
                                        <Icon name="event" size={14} className="text-white/20" />
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                                            {new Date(completedAt).toLocaleDateString('pt-BR')} <span className="mx-1 opacity-40">â€¢</span> {new Date(completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <div className="bg-[#120F0F] p-4 rounded-[20px] border border-white/5 shadow-[inset_2px_2px_8px_rgba(0,0,0,0.4)] flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] line-clamp-1 mt-0.5">Lucro Líquido</p>
                                        <span className={`text-[7px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${isCashPaid ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'}`}>
                                            {isCashPaid ? 'Dinheiro' : 'Online'}
                                        </span>
                                    </div>
                                    <span className={`text-xl font-black tracking-tighter ${isNegative ? 'text-rose-400 drop-shadow-[0_2px_10px_rgba(251,113,133,0.3)]' : 'text-primary drop-shadow-[0_2px_10px_rgba(250,204,21,0.3)]'}`}>
                                        {netEarningsLabel}
                                    </span>
                                </div>
                                <div className="bg-white/5 p-4 rounded-[20px] border border-white/10 text-right flex flex-col justify-center shadow-lg">
                                    <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Total Pedido</p>
                                    <span className="text-sm font-black text-white opacity-80">R$ {parseFloat(order.total_price || 0).toFixed(2).replace('.', ',')}</span>
                                </div>
                            </div>
                        </div>
                    )}))
                }
            </div>
        </motion.div>
    );
    };

    const renderEarningsView = () => {
        const sClayDark: React.CSSProperties = {
            borderRadius: '35px',
            background: '#18181b',
            boxShadow: '12px 12px 24px #09090b, -8px -8px 16px rgba(255,255,255,0.02), inset 4px 4px 8px rgba(255,255,255,0.03)',
        };
        const sClayIcon: React.CSSProperties = {
            background: 'rgba(255,217,0,0.05)',
            boxShadow: 'inset 2px 22px 4px rgba(255,255,255,0.05), inset -2px -2px 4px rgba(0,0,0,0.3)',
        };
        const sClayYellow: React.CSSProperties = {
            borderRadius: '45px',
            background: '#facd07',
            boxShadow: '15px 15px 35px rgba(0,0,0,0.4), inset 6px 6px 12px rgba(255,255,255,0.6), inset -6px -6px 12px rgba(0,0,0,0.1)',
        };

        return (
            <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="px-5 space-y-8 pb-48 pt-6 overflow-y-auto no-scrollbar"
            >
                {/* Visual Marker for Debugging */}
                <div className="h-1 w-20 bg-primary mx-auto rounded-full opacity-50 mb-4" />

                <header className="flex flex-col items-center text-center gap-1 px-2">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] opacity-70">Izi Pay ðŸš€</p>
                    <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg uppercase text-center">Seus Resultados</h2>
                </header>

                {/* Claymorphic Balance Card Premium */}
                <div 
                    onClick={handleWithdrawRequest}
                    className="rounded-[45px] p-8 relative overflow-hidden group border-t-4 border-white/40 cursor-pointer active:scale-[0.98] transition-all" 
                    style={sClayYellow}
                >
                    <div className="absolute -right-6 -top-6 opacity-20 rotate-12 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
                        <Icon name="account_balance_wallet" size={160} className="text-stone-900" />
                    </div>
                    
                    <div className="relative z-10 space-y-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-stone-800 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Saldo Disponível</p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-stone-900 opacity-60">R$</span>
                                    <span className="text-6xl font-black text-stone-950 tracking-tighter leading-none">
                                        {stats.balance.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); setShowWithdrawHistory(true); }}
                                    className="size-12 rounded-2xl bg-stone-950/10 flex items-center justify-center border border-stone-950/20 shadow-inner"
                                >
                                    <Icon name="history" className="text-stone-950" size={20} />
                                </motion.button>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); setShowBankDetails(true); }}
                                    className="size-12 rounded-2xl bg-stone-950/10 flex items-center justify-center border border-stone-950/20 shadow-inner"
                                >
                                    <Icon name="account_balance" className="text-stone-950" size={20} />
                                </motion.button>
                            </div>
                        </div>

                        <motion.button 
                            whileTap={{ scale: 0.96 }}
                            onClick={handleWithdrawRequest}
                            className="w-full h-18 bg-stone-950 text-white rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(0,0,0,0.3)] active:shadow-none transition-all flex items-center justify-center gap-4 group"
                        >
                            <div className="size-10 rounded-xl bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                                <Icon name="payments" size={20} />
                            </div>
                            Sacar Ganhos
                        </motion.button>
                    </div>
                </div>

                {/* Premium Stats Grid */}
                <div className="grid grid-cols-2 gap-5 px-1">
                    <div className="rounded-[35px] p-6 space-y-4 border border-white/5 relative overflow-hidden" style={sClayDark}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 blur-2xl rounded-full" />
                        <div className="size-12 rounded-2xl flex items-center justify-center border border-primary/20" style={sClayIcon}>
                            <Icon name="today" size={24} className="text-primary drop-shadow-[0_0_8px_rgba(255,217,0,0.5)]" />
                        </div>
                        <div>
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Ganhos hoje</p>
                            <p className="text-2xl font-black text-white tracking-tighter">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </div>
                    
                    <div className="rounded-[35px] p-6 space-y-4 border border-white/5 relative overflow-hidden" style={sClayDark}>
                        <div className="absolute top-0 right-0 w-16 h-16 bg-secondary/5 blur-2xl rounded-full" />
                        <div className="size-12 rounded-2xl flex items-center justify-center border border-secondary/20" style={sClayIcon}>
                            <Icon name="local_shipping" size={24} className="text-secondary drop-shadow-[0_0_8px_rgba(100,100,255,0.5)]" />
                        </div>
                        <div>
                            <p className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Total Entregas</p>
                            <p className="text-2xl font-black text-white tracking-tighter">{stats.count}</p>
                        </div>
                    </div>
                </div>

                {/* Performance Chart - CANDLESTICKS */}
                <div className="rounded-[40px] p-8 space-y-8 border border-white/5 relative overflow-hidden" style={sClayDark}>
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-white font-black text-[10px] uppercase tracking-[0.3em]">Performance Alpha</h3>
                            <p className="text-[9px] text-white/20 font-bold uppercase">Meta de Trading: 92%</p>
                        </div>
                        <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <Icon name="monitoring" size={18} className="text-emerald-400" />
                        </div>
                    </div>
                    
                    <div className="h-44 flex items-end justify-between gap-2 px-1 pt-6 relative">
                        {/* Grade de fundo do gráfico */}
                        <div className="absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
                            <div className="h-px bg-white w-full" />
                            <div className="h-px bg-white w-full" />
                            <div className="h-px bg-white w-full" />
                            <div className="h-px bg-white w-full" />
                        </div>

                        {stats.performance.map((val, i) => {
                            const maxVal = Math.max(...stats.performance, 10);
                            const baseHeight = (val / maxVal) * 100;
                            
                            // Simulação de Candlestick (Abertura, Fechamento, Máxima, Mínima)
                            const isUp = i % 2 === 0 || i === 6; // Simula tendência
                            const open = isUp ? baseHeight * 0.7 : baseHeight * 0.9;
                            const close = isUp ? baseHeight : baseHeight * 0.6;
                            const high = Math.max(open, close) * 1.15;
                            const low = Math.min(open, close) * 0.85;
                            
                            const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                            const candleColor = isUp ? '#10b981' : '#f43f5e';

                            return (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group relative h-full justify-end">
                                    <div className="w-full flex flex-col items-center relative h-full justify-end pb-1">
                                        {/* Pavio (Wick) */}
                                        <motion.div 
                                            initial={{ scaleY: 0 }}
                                            animate={{ scaleY: 1 }}
                                            style={{ 
                                                height: `${Math.max(high - low, 10)}%`,
                                                bottom: `${low}%`,
                                                backgroundColor: candleColor,
                                                width: '1px',
                                                opacity: 0.4
                                            }}
                                            className="absolute left-1/2 -translate-x-1/2"
                                        />
                                        
                                        {/* Corpo da Vela */}
                                        <motion.div 
                                            initial={{ height: 0 }} 
                                            animate={{ height: `${Math.max(Math.abs(close - open), 4)}%` }} 
                                            style={{ 
                                                bottom: `${Math.min(open, close)}%`,
                                                backgroundColor: candleColor,
                                                boxShadow: isToday ? `0 0 15px ${candleColor}66` : 'none'
                                            }}
                                            className={`w-full max-w-[10px] rounded-sm transition-all duration-700 relative z-10 ${
                                                isToday ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                                            }`}
                                        />

                                        {isToday && (
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-lg z-20 whitespace-nowrap">
                                                LIVE âš¡
                                            </div>
                                        )}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${isToday ? 'text-primary' : 'text-white/20'}`}>
                                        {['S','T','Q','Q','S','S','D'][i]}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Info Message Claymorphic - PAGAMENTO SEGURO */}
                <div className="rounded-[32px] p-6 flex items-center gap-5 border border-white/5 relative overflow-hidden" style={sClayDark}>
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                    <div className="size-14 rounded-2xl flex items-center justify-center shrink-0 border border-primary/20 shadow-lg" style={sClayIcon}>
                        <Icon name="verified_user" className="text-primary" size={24} />
                    </div>
                    <div className="space-y-1 relative z-10">
                        <p className="text-[10px] text-white font-black uppercase tracking-widest leading-none">Pagamento Seguro Auditado</p>
                        <p className="text-[9px] text-white/30 font-bold leading-relaxed">
                            Suas transferências PIX são protegidas por <span className="text-primary/60">criptografia Izi</span> e liberadas em até 24h.
                        </p>
                    </div>
                </div>

                {/* Placeholder for spacer to ensure visibility */}
                <div className="h-10" />
            </motion.div>
        );
    };

    const renderWithdrawHistoryView = () => (
        <motion.div 
            key="withdraw-history-modal"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[100] bg-black no-scrollbar overflow-y-auto"
        >
            <div className="min-h-screen px-5 pt-8 pb-32 space-y-8">
                <header className="flex items-center justify-between px-2">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] opacity-70">Saques ðŸ’°</p>
                        <h2 className="text-4xl font-black text-white tracking-tighter drop-shadow-lg uppercase text-center">Histórico</h2>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowWithdrawHistory(false)}
                        className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"
                    >
                        <Icon name="close" className="text-white" size={24} />
                    </motion.button>
                </header>

                <div className="space-y-4 pb-20">
                    {withdrawHistory.length === 0 ? (
                        <div className="clay-card-dark rounded-[40px] p-12 flex flex-col items-center justify-center text-center gap-6 border border-white/5 mt-10">
                            <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
                                <Icon name="history_edu" size={40} className="text-white/20" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-white font-black uppercase text-[10px] tracking-widest">Nada por aqui</p>
                                <p className="text-white/30 text-[9px] font-bold">Você ainda não realizou nenhum saque.</p>
                            </div>
                        </div>
                    ) : (
                        withdrawHistory.map((tx, i) => (
                            <motion.div 
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => { setSelectedWithdraw(tx); setShowWithdrawDetail(true); }}
                                className="clay-card-dark rounded-[30px] p-6 border border-white/5 flex items-center gap-5 relative overflow-hidden transition-all active:scale-95 cursor-pointer hover:border-primary/30"
                            >
                                <div className={`size-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                                    tx.status === 'concluido' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                                    tx.status === 'recusado' ? 'bg-rose-500/10 border-rose-500/20' :
                                    'bg-primary/10 border-primary/20'
                                }`}>
                                    <Icon 
                                        name={tx.status === 'concluido' ? 'verified' : tx.status === 'recusado' ? 'close' : 'sync'} 
                                        size={24} 
                                        className={tx.status === 'concluido' ? 'text-emerald-400' : tx.status === 'recusado' ? 'text-rose-400' : 'text-primary'} 
                                    />
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-white font-black text-xl tracking-tighter">R$ {Number(tx.amount).toFixed(2).replace('.', ',')}</p>
                                        <div className="flex items-center gap-2">
                                            {tx.receipt_url && (
                                                <div className="bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                                                    <Icon name="image" size={10} />
                                                    RECIBO
                                                </div>
                                            )}
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md ${
                                                tx.status === 'concluido' ? 'bg-emerald-500/20 text-emerald-400' : 
                                                tx.status === 'recusado' ? 'bg-rose-500/20 text-rose-400' :
                                                'bg-primary/20 text-primary'
                                            }`}>
                                                {tx.status || 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-white/30 font-bold uppercase truncate max-w-[150px]">
                                        {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-[8px] text-white/20 font-medium line-clamp-1">{tx.description}</p>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/[0.01] blur-3xl -z-10 rounded-full" />
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Receipt Viewer Modal */}
                <AnimatePresence>
                    {showReceipt && (
                        <motion.div 
                            key="receipt-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-black/95 flex flex-col p-6 items-center justify-center gap-8"
                        >
                            <div className="w-full flex justify-between items-center px-2">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] opacity-70">Transação ðŸ§¾</p>
                                    <h2 className="text-3xl font-black text-white tracking-tighter drop-shadow-lg uppercase text-center">Comprovante</h2>
                                </div>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setShowReceipt(false)}
                                    className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10"
                                >
                                    <Icon name="close" className="text-white" size={24} />
                                </motion.button>
                            </div>

                            <div className="flex-1 w-full max-w-md bg-white/5 rounded-[40px] border border-white/10 overflow-hidden relative shadow-2xl">
                                <img 
                                    src={selectedReceiptUrl} 
                                    alt="Comprovante de Pagamento" 
                                    className="w-full h-full object-contain"
                                />
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-8 text-center">
                                    <p className="text-[10px] text-white/40 font-bold">
                                        Este documento foi emitido pelo sistema IziDelivery e serve como prova de transferência.
                                    </p>
                                </div>
                            </div>

                            <motion.button 
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowReceipt(false)}
                                className="w-full h-16 bg-white text-black rounded-[24px] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3"
                            >
                                <Icon name="check" size={20} />
                                Entendido
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );

    const renderWithdrawDetailView = () => {
        if (!selectedWithdraw) return null;
        
        const tx = selectedWithdraw;
        const feePercent = Number(appSettings?.withdrawal_fee_percent ?? 0);
        const grossAmount = Number(tx.amount);
        const feeAmount = grossAmount * (feePercent / 100);
        const netAmount = grossAmount - feeAmount;

        return (
            <motion.div 
                key="withdraw-detail-modal"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col p-6 overflow-y-auto"
            >
                <header className="flex items-center justify-between mb-8">
                    <button onClick={() => setShowWithdrawDetail(false)} className="size-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center active:scale-90 transition-all">
                        <Icon name="arrow_back" className="text-white" />
                    </button>
                    <div className="text-center">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Detalhamento</p>
                        <h2 className="text-xl font-black text-white">Fluxo de Saque</h2>
                    </div>
                    <div className="size-12" />
                </header>

                <div className="space-y-6">
                    {/* Main Clay Card */}
                    <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full -mr-16 -mt-16" />
                        
                        <div className="flex flex-col items-center text-center space-y-4 mb-8">
                            <div className={`size-20 rounded-[30px] flex items-center justify-center border shadow-2xl ${
                                tx.status === 'concluido' ? 'bg-emerald-500/10 border-emerald-500/20' : 
                                tx.status === 'recusado' ? 'bg-rose-500/10 border-rose-500/20' :
                                'bg-primary/10 border-primary/20'
                            }`}>
                                <Icon 
                                    name={tx.status === 'concluido' ? 'verified' : tx.status === 'recusado' ? 'close' : 'sync'} 
                                    size={36} 
                                    className={tx.status === 'concluido' ? 'text-emerald-400' : tx.status === 'recusado' ? 'text-rose-400' : 'text-primary'} 
                                />
                            </div>
                            <div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
                                    tx.status === 'concluido' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' : 
                                    tx.status === 'recusado' ? 'text-rose-400 bg-rose-400/10 border-rose-400/20' :
                                    'text-primary bg-primary/10 border-primary/20'
                                }`}>
                                    {tx.status === 'concluido' ? 'Pago com Sucesso' : tx.status === 'recusado' ? 'Saque Recusado' : 'Aguardando Processamento'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 bg-black/20 rounded-[32px] p-6 border border-white/5 shadow-inner">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">ID Transação</span>
                                <span className="text-[10px] font-mono text-white/60">#{tx.id.slice(0, 12).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Data e Hora</span>
                                <span className="text-[10px] font-bold text-white/60 uppercase">
                                    {new Date(tx.created_at).toLocaleDateString('pt-BR')} às {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Método</span>
                                <span className="text-[10px] font-bold text-white/60 uppercase">PIX</span>
                            </div>
                            <div className="w-full h-[1px] bg-white/5" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Chave PIX Utilizada</span>
                                <span className="text-xs font-black text-white truncate">{pixKey || 'Chave não registrada'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Breakdown Card */}
                    <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 space-y-6">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                            <Icon name="analytics" size={16} className="text-primary" />
                            Valores e Taxas
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Valor Bruto</span>
                                <span className="text-sm font-black text-white">R$ {grossAmount.toFixed(2).replace('.', ',')}</span>
                            </div>
                            
                            {feeAmount > 0 && (
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Taxa de Saque</span>
                                        <span className="text-[8px] font-black text-rose-500/50 border border-rose-500/20 px-2 py-0.5 rounded-full">{feePercent}%</span>
                                    </div>
                                    <span className="text-sm font-black text-rose-500">- R$ {feeAmount.toFixed(2).replace('.', ',')}</span>
                                </div>
                            )}

                            <div className="w-full h-[1px] bg-white/5" />

                            <div className="flex justify-between items-end pt-2">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Valor Líquido</span>
                                <span className="text-3xl font-black text-primary drop-shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                    R$ {netAmount.toFixed(2).replace('.', ',')}
                                </span>
                            </div>
                        </div>

                        {tx.status !== 'concluido' && (
                            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                                <p className="text-[9px] text-primary/70 leading-relaxed font-medium uppercase tracking-wider text-center">
                                    Prazo de compensação: até {appSettings?.withdrawal_period_h ?? 24}h úteis
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Receipt Button */}
                    {tx.receipt_url && (
                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setSelectedReceiptUrl(tx.receipt_url);
                                setShowReceipt(true);
                            }}
                            className="w-full py-6 rounded-[30px] bg-white text-black font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 shadow-2xl active:bg-neutral-200 transition-colors"
                        >
                            <Icon name="description" size={20} />
                            Ver Comprovante Oficial
                        </motion.button>
                    )}
                </div>

                <p className="mt-8 text-center text-[9px] font-bold text-white/20 uppercase tracking-widest">
                    Izi Delivery Financial Security
                </p>
            </motion.div>
        );
    };

    const handleAvatarUpload = async (file: File) => {
        if (!driverId || !file) return;
        setIsUploadingAvatar(true);
        try {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const path = `drivers/${driverId}/avatar.${ext}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(path, file, { upsert: true, contentType: file.type });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache-bust

            // Salvar no banco e no estado local
            await supabase.from('drivers_delivery').update({ avatar_url: publicUrl }).eq('id', driverId);
            setDriverAvatar(publicUrl);
            localStorage.setItem('izi_driver_avatar', publicUrl);
            toastSuccess('Foto de perfil atualizada!');
        } catch (err: any) {
            console.error('[AVATAR] Erro:', err);
            toastError('Erro ao enviar foto. Tente novamente.');
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const renderProfileView = () => (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-24 pt-4">
            <div className="flex flex-col items-center pt-8 pb-4">
                {/* Avatar clicável com upload */}
                <label
                    htmlFor="avatar-upload"
                    className="size-28 rounded-[40px] flex items-center justify-center mb-6 relative group cursor-pointer select-none"
                    style={{ background: '#1A1A1A', boxShadow: '12px 12px 24px rgba(0,0,0,0.5), -8px -8px 16px rgba(255,255,255,0.02)' }}
                >
                    {driverAvatar ? (
                        <img
                            src={driverAvatar}
                            alt="Foto de Perfil"
                            className="w-full h-full object-cover rounded-[40px]"
                        />
                    ) : (
                        <Icon name="person" size={48} className="text-primary group-hover:scale-105 transition-transform" />
                    )}

                    {/* Overlay ao hover */}
                    <div className="absolute inset-0 rounded-[40px] bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        {isUploadingAvatar ? (
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <Icon name="photo_camera" size={28} className="text-white" />
                        )}
                    </div>

                    {/* Badge de câmera */}
                    <div className="absolute -bottom-1 -right-1 size-9 rounded-full bg-primary border-4 border-[#0a0a0a] flex items-center justify-center shadow-lg">
                        <Icon name="photo_camera" size={14} className="text-slate-900" />
                    </div>

                    <input
                        id="avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAvatarUpload(f);
                            e.target.value = ''; // reset
                        }}
                    />
                </label>
                <h2 className="text-2xl font-black text-white tracking-tight">{driverName}</h2>
                <div className="flex items-center gap-2 mt-2">
                    <span className="text-[9px] font-black text-primary uppercase tracking-[0.3em] bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">Piloto Izi â€¢ Nível {stats.level}</span>
                </div>
                
                <div className="flex items-center gap-4 mt-8">
                    <div className="flex flex-col items-center gap-1 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] px-6 py-4 rounded-[28px] min-w-[100px] border-none">
                        <Icon name="star" className="text-primary text-lg" />
                        <span className="text-lg font-black text-white">4.98</span>
                        <span className="text-[8px] font-black text-white/20 uppercase">Rating</span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] px-6 py-4 rounded-[28px] min-w-[100px] border-none">
                        <Icon name="route" className="text-emerald-400 text-lg" />
                        <span className="text-lg font-black text-white">{stats.count}</span>
                        <span className="text-[8px] font-black text-white/20 uppercase">Viagens</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {[
                    { label: 'Dados Bancários', icon: 'account_balance', color: 'text-emerald-400' },
                    { label: 'Veículo & Placa', icon: 'directions_car', color: 'text-yellow-400' },
                    { label: 'Preferências', icon: 'settings', color: 'text-primary' },
                    { label: 'Ajuda & Suporte', icon: 'support_agent', color: 'text-blue-400' }
                ].map((item, i) => (
                    <button 
                        key={i} 
                        onClick={() => {
                            if (item.label === 'Dados Bancários') setShowBankDetails(true);
                            if (item.label === 'Veículo & Placa') setShowPlateModal(true);
                            if (item.label === 'Preferências') setShowPreferences(true);
                        }}
                        className="w-full bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] border-none rounded-[24px] p-6 flex items-center justify-between group active:scale-[0.98]"
                    >
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
            
            <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] rounded-[32px] p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-[18px] bg-primary/10 flex items-center justify-center text-primary border border-primary/10">
                            <Icon name="layers" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-white">Sobreposição</span>
                            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Ver chamadas sobre outros apps</span>
                        </div>
                    </div>
                    <button 
                        onClick={async () => {
                            await openOverlaySettings();
                        }}
                        className="px-5 py-3 bg-primary text-black rounded-2xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all"
                    >
                        Configurar
                    </button>
                </div>
            </div>

            <button 
                onClick={handleLogout} 
                className="w-full py-6 mt-4 rounded-[32px] font-black text-[11px] uppercase tracking-[0.2em] bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] border-none text-red-500 active:scale-95 transition-all"
            >
                Encerrar Sessão
            </button>

            <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] rounded-[32px] p-8 space-y-5 mt-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <h3 className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                        <Icon name="admin_panel_settings" size={16} /> Zona de Segurança
                    </h3>
                    <p className="text-[11px] text-white/40 leading-relaxed mt-2">
                        Use estas ferramentas apenas em caso de erros no sistema ou se precisar resetar seu estado de disponibilidade.
                    </p>
                </div>
                <div className="flex gap-3 pt-2 relative z-10">
                    <button 
                        onClick={syncMissionWithDB}
                        className="flex-1 h-12 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] text-white/60 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
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
                        className="flex-1 h-12 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] text-red-500 font-black text-[10px] uppercase tracking-widest rounded-2xl active:scale-[0.98] transition-all"
                    >
                        Resetar Estado
                    </button>
                </div>
            </div>
        </motion.div>
    );

    const renderPlateEditView = () => {
        return (
            <motion.div
                key="plate-edit-modal"
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                className="fixed inset-0 z-[250] bg-[#0A0A0A] flex flex-col no-scrollbar overflow-y-auto"
            >
                <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl px-5 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
                    <button 
                        onClick={() => {
                            setShowPlateModal(false);
                            setDriverPlate(localStorage.getItem('izi_driver_plate') || '');
                            setIsEditingPlate(false);
                        }}
                        className="size-12 rounded-[20px] bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] flex items-center justify-center active:scale-95 transition-transform border border-white/5"
                    >
                        <Icon name="arrow_back" className="text-white" />
                    </button>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em]">Izi Pilot</p>
                        <h2 className="text-lg font-black text-white">Veículo</h2>
                    </div>
                </header>

                <div className="px-5 pt-8 pb-32 space-y-8">
                    <div className="clay-card-dark rounded-[40px] p-8 relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 group-hover:rotate-45 transition-transform duration-700">
                            <Icon name="directions_car" size={180} className="text-white" />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />
                        
                        <div className="relative z-10 space-y-4">
                            <div className="size-14 rounded-[20px] bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center mb-6 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.1)]">
                                <Icon name="badge" className="text-yellow-400 text-[28px] drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter">Placa do Veículo</h3>
                                <p className="text-[11px] text-white/40 leading-relaxed font-bold max-w-[240px] mt-2">
                                    Mantenha sua placa atualizada para que lojistas e clientes identifiquem seu veículo facilmente.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-2 block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">
                            <Icon name="tag" size={14} className="text-white/20" /> Placa (Ex: ABC1234 ou ABC1D23)
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={driverPlate}
                                onChange={(e) => {
                                    setDriverPlate(e.target.value.toUpperCase());
                                    setIsEditingPlate(true);
                                }}
                                placeholder="ABC1234"
                                className="w-full h-16 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_8px_rgba(255,255,255,0.02)] border-none rounded-[28px] px-6 text-white font-bold md:text-sm text-base placeholder:text-white/20 focus:ring-2 focus:ring-yellow-400/30 transition-all outline-none"
                            />
                            {isEditingPlate && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={() => handleSavePlate(driverPlate)}
                            disabled={driverPlate.length < 7 || isSavingPlate}
                            className={`w-full h-[68px] rounded-[32px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                                (driverPlate.length >= 7)
                                    ? 'bg-primary text-black shadow-[inset_2px_2px_6px_rgba(255,255,255,0.8),inset_-3px_-3px_10px_rgba(0,0,0,0.2),0_10px_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] active:scale-95 border border-yellow-300' 
                                    : 'bg-[#121212] text-white/20 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] opacity-50 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            {isSavingPlate ? (
                                <Icon name="sync" className="animate-spin" />
                            ) : (
                                <Icon name="task_alt" size={20} />
                            )}
                            {isSavingPlate ? 'Salvando...' : 'Atualizar Placa'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderBankDetailsView = () => {
        return (
            <motion.div
                key="bank-details-modal"
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                className="fixed inset-0 z-[250] bg-[#0A0A0A] flex flex-col no-scrollbar overflow-y-auto"
            >
                <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl px-5 pt-8 pb-4 flex items-center justify-between border-b border-white/5">
                    <button 
                        onClick={() => {
                            setShowBankDetails(false);
                            // reverter as alterações se a chave não for salva
                            setPixKey(localStorage.getItem('izi_driver_pix') || '');
                            setBankName(localStorage.getItem('izi_driver_bank_name') || '');
                            setIsEditingPix(false);
                        }}
                        className="size-12 rounded-[20px] bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] flex items-center justify-center active:scale-95 transition-transform border border-white/5"
                    >
                        <Icon name="arrow_back" className="text-white" />
                    </button>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Izi Pay</p>
                        <h2 className="text-lg font-black text-white">Dados Bancários</h2>
                    </div>
                </header>

                <div className="px-5 pt-8 pb-32 space-y-8">
                    {/* Header Card */}
                    <div className="clay-card-dark rounded-[40px] p-8 relative overflow-hidden group">
                        <div className="absolute -right-8 -bottom-8 opacity-[0.03] rotate-12 group-hover:rotate-45 transition-transform duration-700">
                            <Icon name="account_balance" size={180} className="text-white" />
                        </div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />
                        
                        <div className="relative z-10 space-y-4">
                            <div className="size-14 rounded-[20px] bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mb-6 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.1)]">
                                <Icon name="pix" className="text-emerald-400 text-[28px] drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-white tracking-tighter">Receba via PIX</h3>
                                <p className="text-[11px] text-white/40 leading-relaxed font-bold max-w-[240px] mt-2">
                                    Cadastre a sua chave abaixo. Os seus ganhos serão transferidos automaticamente mediante solicitação de saque.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-4">
                        <label className="flex items-center gap-2 block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2">
                            <Icon name="account_balance" size={14} className="text-white/20" /> Nome do Banco
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={bankName}
                                onChange={(e) => {
                                    setBankName(e.target.value);
                                    setIsEditingPix(true);
                                }}
                                placeholder="Itaú, Nubank, Inter..."
                                className="w-full h-16 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_8px_rgba(255,255,255,0.02)] border-none rounded-[28px] px-6 text-white font-bold md:text-sm text-base placeholder:text-white/20 focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                            />
                        </div>

                        <label className="flex items-center gap-2 block text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-2 mt-4">
                            <Icon name="key" size={14} className="text-white/20" /> Sua Chave Principal
                        </label>
                        <div className="relative">
                            <input 
                                type="text"
                                value={pixKey}
                                onChange={(e) => {
                                    setPixKey(e.target.value);
                                    setIsEditingPix(true);
                                }}
                                placeholder="CPF, Celular, E-mail..."
                                className="w-full h-16 bg-[#121212] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_8px_rgba(255,255,255,0.02)] border-none rounded-[28px] px-6 text-white font-bold md:text-sm text-base placeholder:text-white/20 focus:ring-2 focus:ring-primary/30 transition-all outline-none"
                            />
                            {isEditingPix && pixKey.length > 4 && (
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                    <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest hidden sm:block">Não Salvo</span>
                                    <div className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
                                </div>
                            )}
                        </div>
                        <div className="bg-[#121212] rounded-[24px] p-5 flex gap-4 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.02),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] mt-4">
                            <div className="mt-0.5"><Icon name="shield" size={16} className="text-white/20" /></div>
                            <p className="text-[9px] font-bold text-white/30 flex-1">
                                A chave fornecida será vinculada de forma definitiva ao seu CPF/CNPJ via nossa integradora financeira de segurança. Revise antes de salvar.
                            </p>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button 
                            onClick={async () => {
                                await handleSavePix(pixKey, bankName);
                                setShowBankDetails(false);
                            }}
                            disabled={pixKey.length < 5 || bankName.length < 2 || isSavingPix}
                            className={`w-full h-[68px] rounded-[32px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                                (pixKey.length >= 5 && bankName.length >= 2)
                                    ? 'bg-primary text-black shadow-[inset_2px_2px_6px_rgba(255,255,255,0.8),inset_-3px_-3px_10px_rgba(0,0,0,0.2),0_10px_30px_rgba(250,204,21,0.4)] hover:scale-[1.02] active:scale-95 border border-yellow-300' 
                                    : 'bg-[#121212] text-white/20 shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] opacity-50 cursor-not-allowed border border-white/5'
                            }`}
                        >
                            {isSavingPix ? (
                                <Icon name="sync" className="animate-spin" />
                            ) : (
                                <Icon name="task_alt" size={20} />
                            )}
                            {isSavingPix ? 'Autenticando...' : 'Salvar Dados Bancários'}
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    };

    const renderPreferencesView = () => {
        const ClayToggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
            <button
                onClick={onToggle}
                className={`relative w-14 h-8 rounded-full transition-all duration-300 flex-shrink-0 ${
                    enabled 
                        ? 'bg-primary shadow-[inset_2px_2px_6px_rgba(255,255,255,0.6),inset_-2px_-2px_6px_rgba(0,0,0,0.3),0_4px_12px_rgba(250,204,21,0.4)]'
                        : 'bg-[#1a1a1a] shadow-[inset_2px_2px_8px_rgba(0,0,0,0.6),inset_-2px_-2px_6px_rgba(255,255,255,0.03)]'
                }`}
            >
                <div className={`absolute top-1 size-6 rounded-full transition-all duration-300 shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${
                    enabled 
                        ? 'left-7 bg-black' 
                        : 'left-1 bg-white/30'
                }`} />
            </button>
        );

        const syncPreferencesToDB = async (updatedPrefs?: any) => {
            if (!driverId) return;
            const currentPrefs = {
                pref_sound: prefSoundEnabled,
                pref_vibration: prefVibrationEnabled,
                pref_nav_app: prefNavApp,
                pref_vehicle: prefVehicleTypes,
                pref_services: prefServiceTypes,
                pref_max_radius: prefMaxRadius,
                ...updatedPrefs
            };
            try {
                await supabase.from('drivers_delivery').update({ preferences: currentPrefs }).eq('id', driverId);
            } catch (e) {
                console.error('[PREFS] Erro ao sincronizar com DB:', e);
            }
        };

        const savePreference = (key: string, value: string) => {
            localStorage.setItem(key, value);
            // Sincroniza campos simples
            if (key === 'pref_sound') syncPreferencesToDB({ pref_sound: value === 'true' });
            if (key === 'pref_vibration') syncPreferencesToDB({ pref_vibration: value === 'true' });
            if (key === 'pref_nav_app') syncPreferencesToDB({ pref_nav_app: value });
            if (key === 'pref_max_radius') syncPreferencesToDB({ pref_max_radius: Number(value) });
        };

        const mobilityOptions = [
            { key: 'mototaxi', label: 'Mototaxi', icon: 'two_wheeler', sub: 'Transporte de passageiros em moto' },
            { key: 'frete', label: 'Fretes', icon: 'local_shipping', sub: 'Transporte de cargas e volumes' },
            { key: 'mudanca', label: 'Mudanças', icon: 'move_up', sub: 'Ajuda com pequenas mudanças' },
            { key: 'motorista', label: 'Motorista Particular', icon: 'directions_car', sub: 'Transporte privado de passageiros' },
        ];

        const allServicesEnabled = prefServiceTypes.includes('all_services');
        const toggleAllServices = () => {
            const updated = allServicesEnabled
                ? prefServiceTypes.filter(s => s !== 'all_services')
                : [...prefServiceTypes.filter(s => s !== 'all_services'), 'all_services'];
            setPrefServiceTypes(updated);
            localStorage.setItem('pref_services', JSON.stringify(updated));
            syncPreferencesToDB({ pref_services: updated });
        };

        const toggleMobility = (key: string) => {
            const compatibilityMap: Record<string, string[]> = {
                'mototaxi': ['mototaxi'],
                'carro': ['frete', 'mudanca', 'motorista'],
                'bicicleta': []
            };
            if (!(compatibilityMap[driverVehicle] || []).includes(key)) {
                toastError("Este serviço não está disponível para sua categoria de veículo");
                return;
            }
            const updated = prefServiceTypes.includes(key)
                ? prefServiceTypes.filter(s => s !== key)
                : [...prefServiceTypes, key];
            setPrefServiceTypes(updated);
            localStorage.setItem('pref_services', JSON.stringify(updated));
            syncPreferencesToDB({ pref_services: updated });
        };

        return (
            <motion.div
                key="preferences-modal"
                initial={{ opacity: 0, x: 50, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.95 }}
                className="fixed inset-0 z-[250] bg-[#0A0A0A] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-xl px-5 pt-8 pb-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
                    <button
                        onClick={() => setShowPreferences(false)}
                        className="size-12 rounded-[20px] bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)] flex items-center justify-center active:scale-95 transition-transform border border-white/5"
                    >
                        <Icon name="arrow_back" className="text-white" />
                    </button>
                    <div className="flex flex-col items-end">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Configurações</p>
                        <h2 className="text-lg font-black text-white">Preferências</h2>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-6 pb-32 space-y-6">

                    {/* Notificações */}
                    <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.04),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
                        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5">
                            <div className="size-8 rounded-[12px] bg-primary/10 flex items-center justify-center">
                                <Icon name="notifications" size={16} className="text-primary" />
                            </div>
                            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Notificações</h3>
                        </div>
                        <div className="divide-y divide-white/5">
                            <div className="flex items-center justify-between px-6 py-5">
                                <div>
                                    <p className="text-sm font-bold text-white/90">Sons de Pedidos</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">Alerta sonoro ao receber novas missões</p>
                                </div>
                                <ClayToggle enabled={prefSoundEnabled} onToggle={() => {
                                    const v = !prefSoundEnabled;
                                    setPrefSoundEnabled(v);
                                    savePreference('pref_sound', String(v));
                                }} />
                            </div>
                            <div className="flex items-center justify-between px-6 py-5">
                                <div>
                                    <p className="text-sm font-bold text-white/90">Vibração</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">Vibrar ao receber pedido ou atualização</p>
                                </div>
                                <ClayToggle enabled={prefVibrationEnabled} onToggle={() => {
                                    const v = !prefVibrationEnabled;
                                    setPrefVibrationEnabled(v);
                                    savePreference('pref_vibration', String(v));
                                }} />
                            </div>
                        </div>
                    </div>

                    {/* Navegação */}
                    <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.04),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
                        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5">
                            <div className="size-8 rounded-[12px] bg-blue-500/10 flex items-center justify-center">
                                <Icon name="navigation" size={16} className="text-blue-400" />
                            </div>
                            <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">App de Navegação</h3>
                        </div>
                        <div className="p-4 flex flex-col gap-3">
                            {[
                                { key: 'google', label: 'Google Maps', sub: 'Recomendado', color: 'text-green-400', bg: 'bg-green-400/10 border-green-400/20' },
                                { key: 'waze', label: 'Waze', sub: 'Trânsito em tempo real', color: 'text-blue-400', bg: 'bg-blue-400/10 border-blue-400/20' },
                                { key: 'apple', label: 'Apple Maps', sub: 'Apenas iOS', color: 'text-white/60', bg: 'bg-white/5 border-white/10' },
                            ].map(nav => (
                                <button
                                    key={nav.key}
                                    onClick={() => { setPrefNavApp(nav.key as any); savePreference('pref_nav_app', nav.key); }}
                                    className={`w-full flex items-center justify-between p-4 rounded-[22px] transition-all border ${
                                        prefNavApp === nav.key
                                            ? `${nav.bg} shadow-[inset_2px_2px_6px_rgba(255,255,255,0.08)] active:scale-[0.98]`
                                            : 'bg-transparent border-transparent active:scale-[0.98]'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon name="map" size={18} className={nav.color} />
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-white/90">{nav.label}</p>
                                            <p className="text-[9px] text-white/30">{nav.sub}</p>
                                        </div>
                                    </div>
                                    {prefNavApp === nav.key && (
                                        <div className="size-5 rounded-full bg-primary flex items-center justify-center shadow-[0_0_12px_rgba(250,204,21,0.5)]">
                                            <Icon name="check" size={12} className="text-black" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Serviços de Entrega */}
                    <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.04),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-[18px] bg-emerald-400/10 border border-emerald-400/10 flex items-center justify-center shadow-[inset_2px_2px_6px_rgba(255,255,255,0.06)]">
                                    <Icon name="local_shipping" size={22} className="text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white/90">Serviços de Entrega</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">Restaurantes, Mercados, Farmácias e mais</p>
                                </div>
                            </div>
                            <ClayToggle enabled={allServicesEnabled} onToggle={toggleAllServices} />
                        </div>
                        {allServicesEnabled && (
                            <div className="px-6 pb-5">
                                <div className="bg-emerald-400/5 border border-emerald-400/10 rounded-[20px] p-4 flex items-center gap-3">
                                    <Icon name="check_circle" size={16} className="text-emerald-400 flex-shrink-0" />
                                    <p className="text-[10px] text-emerald-400/80 font-bold">Você aceitará todos os tipos de entrega: restaurantes, mercados, farmácias, pet shops e mais.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mobilidade */}
                    <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.04),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
                        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5">
                            <div className="size-8 rounded-[12px] bg-blue-500/10 flex items-center justify-center">
                                <Icon name="route" size={16} className="text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.25em]">Mobilidade</h3>
                                <p className="text-[9px] text-white/30 mt-0.5">Selecione os serviços de transporte que aceita</p>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {mobilityOptions.map(mob => {
                                const active = prefServiceTypes.includes(mob.key);
                                return (
                                    <div key={mob.key} className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-[14px] flex items-center justify-center transition-all ${
                                                active ? 'bg-blue-500/15 border border-blue-400/20' : 'bg-white/3 border border-white/5'
                                            }`}>
                                                <Icon name={mob.icon} size={18} className={active ? 'text-blue-400' : 'text-white/20'} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white/90">{mob.label}</p>
                                                <p className="text-[9px] text-white/30 mt-0.5">{mob.sub}</p>
                                            </div>
                                        </div>
                                        <ClayToggle enabled={active} onToggle={() => toggleMobility(mob.key)} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Veículo */}
                    <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.04),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] rounded-[32px] overflow-hidden">
                        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5">
                            <div className="size-8 rounded-[12px] bg-orange-400/10 flex items-center justify-center">
                                <Icon name="local_shipping" size={16} className="text-orange-400" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-orange-400 uppercase tracking-[0.25em]">Meus Veículos</h3>
                                <p className="text-[9px] text-white/30 mt-0.5">Selecione todos os veículos que você possui</p>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {[
                                { key: 'moto',       label: 'Moto',              icon: 'two_wheeler',    sub: 'Motocicleta de qualquer cilindrada' },
                                { key: 'bike',       label: 'Bicicleta',         icon: 'pedal_bike',     sub: 'Bike convencional ou elétrica' },
                                { key: 'carro',      label: 'Carro',             icon: 'directions_car', sub: 'Passeio, sedan ou hatch' },
                                { key: 'fiorino',    label: 'Fiorino',           icon: 'airport_shuttle',sub: 'Furgoneta de pequeno porte' },
                                { key: 'caminhonete',label: 'Caminhonete',       icon: 'rv_hookup',      sub: 'Pickup ou caminhonete' },
                                { key: 'van',        label: 'Van',               icon: 'directions_bus', sub: 'Van de carga ou passageiros' },
                                { key: 'vuc',        label: 'VUC',               icon: 'local_shipping', sub: 'Veículo Urbano de Carga' },
                                { key: 'bau_p',      label: 'Baú P',             icon: 'inventory_2',    sub: 'Caminhão baú pequeno' },
                                { key: 'bau_m',      label: 'Baú M',             icon: 'inventory_2',    sub: 'Caminhão baú médio' },
                                { key: 'bau_g',      label: 'Baú G',             icon: 'inventory_2',    sub: 'Caminhão baú grande' },
                            ].map(v => {
                                const active = prefVehicleTypes.includes(v.key);
                                return (
                                    <div key={v.key} className="flex items-center justify-between px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`size-10 rounded-[14px] flex items-center justify-center transition-all ${
                                                active ? 'bg-orange-400/15 border border-orange-400/20' : 'bg-white/3 border border-white/5'
                                            }`}>
                                                <Icon name={v.icon} size={18} className={active ? 'text-orange-400' : 'text-white/20'} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white/90">{v.label}</p>
                                                <p className="text-[9px] text-white/30 mt-0.5">{v.sub}</p>
                                            </div>
                                        </div>
                                        <ClayToggle enabled={active} onToggle={() => {
                                            const updated = active
                                                ? prefVehicleTypes.filter(x => x !== v.key)
                                                : [...prefVehicleTypes, v.key];
                                            setPrefVehicleTypes(updated);
                                            localStorage.setItem('pref_vehicle', JSON.stringify(updated));
                                            syncPreferencesToDB({ pref_vehicle: updated });
                                        }} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Raio Máximo */}
                    <div className="bg-[#121212] shadow-[inset_2px_2px_8px_rgba(255,255,255,0.04),inset_-2px_-2px_8px_rgba(0,0,0,0.5)] rounded-[32px] p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="size-8 rounded-[12px] bg-purple-500/10 flex items-center justify-center">
                                <Icon name="radar" size={16} className="text-purple-400" />
                            </div>
                            <div>
                                <h3 className="text-[10px] font-black text-purple-400 uppercase tracking-[0.25em]">Raio de Atuação</h3>
                                <p className="text-[9px] text-white/30 mt-0.5">Distância máxima para aceitar pedidos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex-1 h-2 bg-[#0a0a0a] rounded-full shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)] relative">
                                <div
                                    className="absolute top-0 left-0 h-2 rounded-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.5)]"
                                    style={{ width: `${(prefMaxRadius / 30) * 100}%` }}
                                />
                                <input
                                    type="range"
                                    min={1}
                                    max={30}
                                    value={prefMaxRadius}
                                    onChange={e => { const v = Number(e.target.value); setPrefMaxRadius(v); savePreference('pref_max_radius', String(v)); }}
                                    className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                                />
                            </div>
                            <div className="bg-[#0a0a0a] shadow-[inset_2px_2px_6px_rgba(0,0,0,0.8)] rounded-[16px] px-4 py-2 min-w-[72px] text-center">
                                <span className="text-lg font-black text-white">{prefMaxRadius}</span>
                                <span className="text-[9px] font-black text-white/30 ml-0.5">km</span>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            {[1, 5, 10, 20, 30].map(km => (
                                <button
                                    key={km}
                                    onClick={() => { setPrefMaxRadius(km); savePreference('pref_max_radius', String(km)); }}
                                    className={`text-[9px] font-black px-2 py-1 rounded-full transition-all ${
                                        prefMaxRadius === km ? 'text-purple-400 bg-purple-400/10' : 'text-white/20'
                                    }`}
                                >{km}km</button>
                            ))}
                        </div>
                    </div>

                </div>
            </motion.div>
        );
    };

    const renderActiveMissionView = () => { // UPDATED
        if (!activeMission) {
            return (
                <motion.div key="active-mission-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-10 text-center font-['Plus_Jakarta_Sans']">
                    <div className="size-28 rounded-[45px] bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-[20px_20px_40px_rgba(0,0,0,0.6),inset_8px_8px_16px_rgba(255,255,255,0.02)]">
                        <Icon name="route" size={48} className="text-white/20" />
                    </div>
                    <h2 className="text-2xl font-black text-white tracking-tighter uppercase mb-2">Sem Missões Ativas</h2>
                    <p className="text-sm text-white/40 leading-relaxed mb-10 max-w-xs font-medium">Você não possui nenhuma corrida em andamento. Vá ao Dashboard para aceitar novos desafios e lucrar.</p>
                    
                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        <button 
                            onClick={() => setActiveTab('dashboard')}
                            className="h-18 bg-yellow-400 text-black font-black text-[11px] uppercase tracking-[0.25em] rounded-[30px] w-full active:scale-95 transition-all shadow-[0_20px_40px_rgba(250,204,21,0.25),inset_6px_6px_12px_rgba(255,255,255,0.4),inset_-6px_-6px_12px_rgba(0,0,0,0.1)] border border-yellow-300/30 flex items-center justify-center gap-3 py-5"
                        >
                            <Icon name="grid_view" size={18} />
                            Ir para Dashboard
                        </button>
                        <button 
                            onClick={() => { syncMissionWithDB(); toastSuccess("Sincronizando com o servidor..."); }}
                            disabled={isSyncingMission}
                            className="h-16 bg-zinc-900 border border-white/5 text-white/60 font-black text-[10px] uppercase tracking-[0.2em] rounded-[28px] w-full active:scale-95 transition-all flex items-center justify-center gap-3 shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.02)]"
                        >
                            {isSyncingMission ? <Icon name="sync" className="animate-spin text-yellow-400" /> : <Icon name="cloud_sync" />}
                            {isSyncingMission ? 'Sincronizando...' : 'Verificar Servidor'}
                        </button>
                    </div>
                </motion.div>
            );
        }

        const isMobility = ['mototaxi', 'car_ride', 'motorista_particular'].includes(activeMission.type || '');
        const getOrderItems = () => {
            if (activeMission.items && Array.isArray(activeMission.items)) return activeMission.items;
            const address = activeMission.delivery_address || activeMission.destination || '';
            if (address.includes('| ITENS:')) {
                return address.split('| ITENS:')[1].split(',').map(i => ({ name: i.trim() }));
            }
            return [];
        };

        const getStatusDisplay = () => {
            switch(activeMission.status) {
                case 'saiu_para_coleta':
                case 'a_caminho_coleta': return { label: 'Indo retirar', color: 'text-blue-400', bg: 'bg-blue-400/15', icon: 'navigation', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]' };
                case 'no_local_coleta':
                case 'chegou_coleta': return { label: 'No local de coleta', color: 'text-amber-400', bg: 'bg-amber-400/15', icon: 'location_on', glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]' };
                case 'preparando':
                case 'no_preparo': return { label: 'Em preparação', color: 'text-purple-400', bg: 'bg-purple-400/15', icon: 'soup_kitchen', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.3)]' };
                case 'pronto': return { label: 'Pronto para retirada', color: 'text-emerald-400', bg: 'bg-emerald-400/15', icon: 'check_circle', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]' };
                case 'picked_up': return { label: 'Pedido coletado', color: 'text-emerald-400', bg: 'bg-emerald-400/15', icon: 'package_2', glow: 'shadow-[0_0_20px_rgba(52,211,153,0.3)]' };
                case 'a_caminho': 
                case 'em_rota': return { label: 'Em rota de entrega', color: 'text-yellow-400', bg: 'bg-yellow-400/15', icon: 'moped', glow: 'shadow-[0_0_20px_rgba(250,204,21,0.3)]' };
                case 'no_local': return { label: 'No destino final', color: 'text-blue-400', bg: 'bg-blue-400/15', icon: 'person_pin_circle', glow: 'shadow-[0_0_20px_rgba(96,165,250,0.3)]' };
                default: return { label: 'Em andamento', color: 'text-white/50', bg: 'bg-white/5', icon: 'radar', glow: '' };
            }
        };

        const statusDisplay = getStatusDisplay();
        const orderItems = getOrderItems();
        const rawAddr = (activeMission.delivery_address || activeMission.destination || '');
        let addressOnly = cleanAddressText(rawAddr);
        if (addressOnly && !addressOnly.toLowerCase().includes('brumadinho')) { addressOnly += ', Brumadinho - MG'; }

        let pickupOnly = cleanAddressText(activeMission.origin || activeMission.pickup_address || '');
        if (pickupOnly && !pickupOnly.toLowerCase().includes('brumadinho')) { pickupOnly += ', Brumadinho - MG'; }

        const getMainBtnData = () => {
            const s = (activeMission.status || '').toLowerCase().trim();
            console.log('[DEBUG] Mission Status:', s);

            // CASO TERMINAL: Se a missão já acabou mas ainda está na tela, o botão serve para fechar.
            if (['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'].includes(s)) {
                return { 
                    label: 'Concluído â€¢ Fechar', 
                    action: () => {
                        setActiveMission(null);
                        localStorage.removeItem('Izi_active_mission');
                        setActiveTab('dashboard');
                    }, 
                    icon: 'check_circle' 
                };
            }

            const isStartable = [
                'scheduled', 'agendado', 'agendamento', 'a_caminho_coleta', 
                'saiu_para_coleta', 'confirmado', 'preparando', 'aceito', 
                'atribuido', 'accepted', 'waiting_driver', 'pending', 'novo'
            ].includes(s);
            
            if (isStartable) 
                return { label: (s === 'scheduled' || s === 'agendado' || s === 'agendamento') ? 'Iniciar Missão' : 'Cheguei na Coleta', action: () => handleUpdateStatus('chegou_coleta'), icon: 'location_on' };
            if (['chegou_coleta', 'no_local_coleta'].includes(s) || s === 'pronto') 
                return { label: 'Confirmar Coleta', action: () => handleUpdateStatus('picked_up'), icon: 'inventory_2' };
            if (s === 'picked_up') 
                return { label: 'Iniciar Entrega', action: () => handleUpdateStatus('a_caminho'), icon: 'moped' };
            if (s === 'a_caminho' || s === 'em_rota') 
                return { label: 'Cheguei no Destino', action: () => handleUpdateStatus('no_local'), icon: 'push_pin' };
            if (s === 'no_local' || s === 'saiu_para_entrega') 
                return { label: isMobility ? 'Encerrar Corrida' : 'Finalizar Entrega', action: () => handleUpdateStatus('concluido'), icon: 'task_alt' };
            
            return { label: 'Prosseguir', action: () => syncMissionWithDB(), icon: 'arrow_forward' };
        };

        const btn = getMainBtnData();
        const driverEarnings = getNetEarnings(activeMission);

        const sClayDark: React.CSSProperties = {
            background: 'linear-gradient(145deg, #1c1c1e, #121214)',
            boxShadow: '15px 15px 35px rgba(0,0,0,0.6), inset 5px 5px 12px rgba(255,255,255,0.02), inset -5px -5px 12px rgba(0,0,0,0.8)',
            borderRadius: '32px'
        };
        const sClayYellow: React.CSSProperties = {
            background: 'linear-gradient(145deg, #facc15, #eab308)',
            boxShadow: '0 20px 45px rgba(250,204,21,0.25), inset 8px 8px 16px rgba(255,255,255,0.5), inset -8px -8px 16px rgba(0,0,0,0.15)',
            borderRadius: '32px'
        };

        return (
            <motion.div 
                key="active-mission-populated"
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="fixed inset-0 z-[100] bg-[#0c0f10] flex flex-col overflow-hidden text-[#f5f6f7] font-['Plus_Jakarta_Sans']"
            >
                
                {/* 1. MAP SECTION (Full Height) */}
                <div className="absolute top-0 left-0 w-full h-[100dvh] z-0">
                    <MissionRouteMap 
                        pickup={{ lat: Number(activeMission.pickup_lat), lng: Number(activeMission.pickup_lng) }}
                        delivery={{ lat: Number(activeMission.delivery_lat), lng: Number(activeMission.delivery_lng) }}
                        pickupAddress={pickupOnly}
                        deliveryAddress={addressOnly}
                        driverCoords={driverCoords}
                        missionPhase={['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega'].includes(activeMission.status) ? 'to_delivery' : 'to_pickup'}
                        onRouteInfo={(info) => setRealTimeRoute(info)}
                    />
                </div>

                {/* 2. OVERLAY HEADER */}
                <header className="fixed top-0 w-full z-[300] flex justify-between items-center px-6 py-6 safe-area-top pointer-events-none">
                    <motion.button 
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            const terminalStatuses = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'];
                            const currentStatus = (activeMission?.status || '').toLowerCase().trim();
                            if (terminalStatuses.includes(currentStatus)) {
                                // Missão em estado terminal: limpar antes de voltar
                                setActiveMission(null);
                                localStorage.removeItem('Izi_active_mission');
                            }
                            setActiveTab('dashboard');
                        }} 
                        className="pointer-events-auto size-12 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                        <Icon name="arrow_back" className="text-yellow-400" size={20} />
                    </motion.button>
                    
                    <div className="pointer-events-auto px-5 py-2 bg-black/60 backdrop-blur-xl rounded-full border border-white/10 shadow-lg flex items-center gap-2">
                        <div className={`size-2 rounded-full animate-pulse ${statusDisplay.color.replace('text-', 'bg-')}`} />
                        <span className="text-white font-black tracking-widest text-[9px] uppercase leading-none">{statusDisplay.label}</span>
                    </div>

                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            const isDeliveryPhase = activeMission.status === 'picked_up' || activeMission.status === 'em_rota' || activeMission.status === 'a_caminho' || activeMission.status === 'saiu_para_entrega';
                            let lat = Number(isDeliveryPhase ? activeMission.delivery_lat : activeMission.pickup_lat);
                            let lng = Number(isDeliveryPhase ? activeMission.delivery_lng : activeMission.pickup_lng);
                            let addr = isDeliveryPhase ? addressOnly : pickupOnly;
                            if (!isDeliveryPhase) {
                                const pickupName = (activeMission.merchant_name || activeMission.pickup_address || "").toLowerCase();
                                if (pickupName.includes('paladar')) {
                                    if (isNaN(lat) || Math.abs(lat) < 0.1) { lat = -20.1435361; lng = -44.2169737; addr = "R. Henri Karam, 640 - Presidente Barroca, Brumadinho - MG"; }
                                }
                            }
                            const hasValidCoords = !isNaN(lat) && !isNaN(lng) && Math.abs(lat) > 0.01;
                            const destination = hasValidCoords ? `${lat},${lng}` : encodeURIComponent(String(addr || "Destino").split("| ITENS:")[0].trim());
                            window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`, '_blank');
                        }}
                        className="pointer-events-auto size-12 bg-white rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden"
                    >
                        <Icon name="map" className="text-blue-600" size={22} />
                    </motion.button>
                </header>

                {/* 3. IZI BOTTOM SHEET */}
                <IziBottomSheet snapPoints={["35vh", "65vh", "92vh"]} initialSnap={0}>
                    <div className="px-6 space-y-6 pt-2 pb-8">
                        
                        {/* Status Imersivo - Clay Card */}
                        <section className="bg-zinc-900 border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
                            <div className="flex flex-col items-center gap-4 w-full text-center">
                                <div className="size-16 rounded-[24px] overflow-hidden border border-white/10 bg-zinc-800 flex items-center justify-center relative">
                                    {driverAvatar ? (
                                        <img src={driverAvatar} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <Icon name="person" size={32} className="text-white/20" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-black text-white truncate tracking-tighter leading-tight">{driverName.split(' ')[0]}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                                            <div className="size-1.5 rounded-full bg-emerald-400" />
                                            <span className="text-emerald-400 font-black text-[8px] uppercase tracking-widest">{stats.level >= 10 ? 'Elite' : `Piloto`}</span>
                                        </div>
                                        <div className="bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20 flex items-center gap-1">
                                            <Icon name="route" size={10} className="text-yellow-400" />
                                            <span className="text-yellow-400 font-black text-[8px] uppercase tracking-widest">
                                                {realTimeRoute ? realTimeRoute.distanceText : `${(parseFloat(activeMission.distance_km || '0')).toFixed(1)} KM`}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-zinc-600 text-[8px] uppercase tracking-[0.3em] font-black mb-1">XP HOJE</p>
                                    <p className="text-xl font-black text-yellow-400 tracking-tighter">+{Math.floor(driverEarnings)} pts</p>
                                </div>
                            </div>
                            
                            <div className="h-px bg-white/5 w-full" />
                            
                            <div className="flex justify-between items-center bg-black/40 p-5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl bg-white/5 ${statusDisplay.color} ${statusDisplay.glow}`}>
                                        <Icon name={statusDisplay.icon} size={20} />
                                    </div>
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">{statusDisplay.label}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-yellow-400 font-black text-xs">{realTimeRoute?.durationText || '-- min'}</span>
                                    <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Estimado</span>
                                </div>
                            </div>
                        </section>

                        {/* Detalhes da Carga/Passageiro */}
                        <section className="space-y-4">
                            <div className="flex justify-between items-end px-2">
                                <h2 className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.4em]">Detalhes da Missão</h2>
                                <span className={isMobility ? "text-cyan-400 font-black text-[9px] uppercase tracking-widest" : "text-yellow-400 font-black text-[9px] uppercase tracking-widest"}>
                                    {isMobility ? 'Mobilidade' : 'Logística'}
                                </span>
                            </div>
                            
                            <div className="grid gap-4">
                                {orderItems.length > 0 ? (
                                    orderItems.map((item: any, idx: number) => (
                                        <motion.div 
                                            key={idx} 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="bg-zinc-900 rounded-2xl p-5 flex items-center gap-5 border border-white/5"
                                        >
                                            <div className="size-14 bg-black rounded-[20px] flex items-center justify-center border border-white/5 shrink-0 relative">
                                                <Icon name={isMobility ? 'person' : 'package_2'} className="text-yellow-400/40" size={28} />
                                                <div className="absolute -top-1 -right-1 size-6 bg-yellow-400 rounded-lg flex items-center justify-center">
                                                    <span className="text-black font-black text-[10px]">{item.quantity || 1}x</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-black text-xs uppercase tracking-tight truncate">{item.name}</h3>
                                                {item.options && <p className="text-zinc-500 text-[10px] font-bold truncate mt-1">{item.options}</p>}
                                                <div className="flex items-center gap-2 mt-2">
                                                     <div className="size-1.5 rounded-full bg-yellow-400/30" />
                                                     <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Verificado no sistema</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="bg-zinc-900 rounded-[28px] p-6 flex flex-col items-center justify-center gap-3 border border-white/5 border-dashed opacity-50">
                                        <Icon name="info" className="text-white/20" size={24} />
                                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Sem notas adicionais</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Izi Pay Premium Section */}
                        <section className="space-y-4 pb-4">
                             <h2 className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.4em] px-2">Izi Pay â€¢ Rendimento</h2>
                             <div className="bg-zinc-900 border border-white/5 p-6 rounded-3xl relative overflow-hidden">
                                 
                                 <div className="flex justify-between items-center relative z-10">
                                     <div className="flex items-center gap-4">
                                         <div className="size-14 rounded-[20px] bg-yellow-400 flex items-center justify-center">
                                             <Icon name="payments" size={28} className="text-black" />
                                         </div>
                                         <div>
                                             <span className="text-white font-black text-[11px] uppercase tracking-widest block leading-none">Lucro Real</span>
                                             <span className="text-yellow-400/40 text-[9px] font-black uppercase tracking-[0.2em] mt-1 block">Líquido Creditado</span>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <span className="text-yellow-400 text-3xl font-black tracking-tighter">
                                             R$ {driverEarnings.toFixed(2).replace('.', ',')}
                                         </span>
                                     </div>
                                 </div>
                                 
                                 <div className="h-px bg-white/5 w-full my-6" />

                                 <div className="space-y-5">
                                     <div className="flex justify-between items-center bg-black/30 p-4 rounded-2xl border border-white/5">
                                         <div className="flex flex-col">
                                            <span className="text-zinc-500 font-black text-[8px] uppercase tracking-widest mb-1">Método</span>
                                            <span className="text-white font-black text-[10px] uppercase">{activeMission.payment_method === 'online' ? 'Liquidado Online' : 'Pagar no Destino'}</span>
                                         </div>
                                         <div className="bg-yellow-400/10 px-4 py-2 rounded-xl border border-yellow-400/20 flex items-center gap-2">
                                             <Icon name={activeMission.payment_method === 'online' ? 'verified_user' : 'monetization_on'} size={14} className="text-yellow-400" />
                                             <span className="text-yellow-400 font-black text-[10px] uppercase">{getPaymentLabel(activeMission)}</span>
                                         </div>
                                     </div>

                                     {!(activeMission.payment_status === 'paid' || activeMission.payment_status === 'pago') && activeMission.payment_method !== 'online' ? (
                                         <div className="bg-zinc-800/50 p-6 rounded-[28px] border border-white/5 flex flex-col gap-3 shadow-inner">
                                             <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                                                 <span>Subtotal Carga</span>
                                                 <span className="text-white/60">R$ {(Number(activeMission.total_price || 0) - Number(activeMission.delivery_fee || 0)).toFixed(2).replace('.', ',')}</span>
                                             </div>
                                             <div className="flex justify-between items-end pt-2 border-t border-white/5">
                                                 <span className="text-white font-black text-xs uppercase tracking-widest">Coleta em Dinheiro</span>
                                                 <span className="text-yellow-400 text-2xl font-black tracking-tighter drop-shadow-lg">R$ {Number(activeMission.total_price || 0).toFixed(2).replace('.', ',')}</span>
                                             </div>
                                             {activeMission.change_for > 0 && (
                                                 <div className="mt-2 bg-yellow-400 p-2 rounded-lg flex items-center justify-between shadow-lg">
                                                     <span className="text-black font-black text-[9px] uppercase tracking-tighter">Troco Para</span>
                                                     <span className="text-black font-black text-sm">R$ {Number(activeMission.change_for || 0).toFixed(2).replace('.', ',')}</span>
                                                 </div>
                                             )}
                                         </div>
                                     ) : (
                                         <motion.div 
                                            initial={{ scale: 0.95 }}
                                            animate={{ scale: 1 }}
                                            className="bg-emerald-500/5 p-5 rounded-[22px] border border-emerald-500/10 flex items-center gap-4"
                                         >
                                             <div className="size-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                                 <Icon name="check" className="text-black" size={20} />
                                             </div>
                                             <div>
                                                 <p className="text-emerald-400 font-black text-[10px] uppercase tracking-widest">Pagamento Confirmado</p>
                                                 <p className="text-emerald-400/40 text-[8px] font-bold uppercase mt-0.5">Liberado para entrega imediata</p>
                                             </div>
                                         </motion.div>
                                     )}

                                     {activeMission.observations && (
                                         <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 flex items-start gap-3">
                                             <Icon name="warning" className="text-orange-400 mt-0.5" size={16} />
                                             <p className="text-orange-400/70 text-[9px] leading-relaxed font-black uppercase tracking-tight line-clamp-3">
                                                 "{activeMission.observations}"
                                             </p>
                                         </div>
                                     )}
                                 </div>
                             </div>
                        </section>
                    </div>
                </IziBottomSheet>

                {/* PREMIUM ACTION DOCK (Fixed at Bottom) */}
                <div className="fixed bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-black via-black/95 to-transparent z-[200] flex flex-col gap-4">
                    {(() => {
                        // Para status terminal (concluído/cancelado), o botão nunca deve ser bloqueado por isAccepting
                        const terminalStatuses = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'];
                        const isTerminal = terminalStatuses.includes((activeMission.status || '').toLowerCase().trim());
                        const isDisabled = isTerminal ? false : isAccepting;
                        return (
                            <motion.button 
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.96 }}
                                onClick={btn.action}
                                disabled={isDisabled}
                                className="w-full h-16 bg-yellow-400 rounded-2xl flex items-center justify-center disabled:opacity-50 relative overflow-hidden group" 
                            >
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <div className="flex items-center gap-3">
                                    {(isAccepting && !isTerminal) ? (
                                        <div className="size-6 border-[3px] border-black/20 border-t-black rounded-full animate-spin" />
                                    ) : (
                                        <Icon name={btn.icon} size={24} className="text-black group-hover:scale-110 transition-transform" />
                                    )}
                                    <span className="text-black font-black text-lg uppercase tracking-tighter">
                                        {(isAccepting && !isTerminal) ? 'Sincronizando...' : btn.label}
                                    </span>
                                </div>
                            </motion.button>
                        );
                    })()}
                    
                    {['a_caminho_coleta', 'saiu_para_coleta', 'aceito', 'confirmado'].includes(activeMission.status || '') && (
                        <button 
                            onClick={async () => { if (await showConfirm({ message: 'Deseja realmente cancelar esta missão?' })) handleUpdateStatus('cancelado'); }}
                            className="w-full py-4 text-red-500/50 text-[10px] font-black uppercase tracking-[0.4em] hover:text-red-500 transition-all hover:scale-105 active:scale-95"
                        >
                            Cancelar Missão
                        </button>
                    )}
                </div>
            </motion.div>
        );
    };

    const renderSOS = () => (
        <motion.div key="sos-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[200] bg-red-950 flex flex-col items-center justify-center p-8 text-center">
            <div className="size-28 clay-fab-sos rounded-full flex items-center justify-center mb-8 animate-pulse"><Icon name="emergency_share" className="text-6xl text-red-400" /></div>
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
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen w-full flex flex-col items-center justify-center px-7 relative overflow-hidden bg-black">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,217,0,0.04)_0%,transparent_60%)]" />
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
                        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="w-full h-12 bg-white/[0.03] border border-white/5 text-white/30 font-black text-[10px] uppercase tracking-widest rounded-[18px] hover:text-white/50 hover:bg-white/[0.05] transition-all">{authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}</button>
                    </div>
                </div>
                <p className="absolute bottom-8 text-[8px] font-black text-white/10 uppercase tracking-[0.4em]">Izi v5.0 â€¢ Conexão Segura</p>
            </motion.div>
        );
    };

    const renderOrderDetailsModal = () => {
        if (!selectedOrder || !showOrderModal) return null;

        const presentation = getServicePresentation(selectedOrder);
        const grossEarnings = getGrossEarnings(selectedOrder);
        const netEarnings = getNetEarnings(selectedOrder);
        const displayDistance = calculatedDistance || selectedOrder.distance || 'Calculando...';

        const isPaid = selectedOrder.payment_status === 'paid' || selectedOrder.payment_status === 'pago';
        const paymentLabel = getPaymentLabel(selectedOrder);
        const needsChange = !isPaid && selectedOrder.change_for > 0;

        // Estilos Claymorphic via classes Tailwind inline para garantir consistência
        const clayCard = "shadow-[inset_2px_2px_8px_rgba(255,255,255,0.05),inset_-2px_-2px_8px_rgba(0,0,0,0.4)]";
        const clayCardDark = "shadow-[inset_4px_4px_12px_rgba(255,255,255,0.1),inset_-4px_-4px_12px_rgba(0,0,0,0.4)]";
        const clayYellow = "shadow-[inset_4px_4px_10px_rgba(255,255,255,0.4),inset_-4px_-4px_10px_rgba(0,0,0,0.1)]";

        return (
            <motion.div 
                key="order-details-modal"
                initial={{ opacity: 0, y: 100 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, y: 100 }}
                className="fixed inset-0 z-[300] bg-[#0c0f10] flex flex-col overflow-y-auto no-scrollbar pb-40"
            >
                {/* TopAppBar */}
                <header className="bg-neutral-950/70 backdrop-blur-xl fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4">
                    <button 
                        onClick={() => setShowOrderModal(false)}
                        className="active:scale-95 transition-transform duration-200 hover:bg-neutral-800/50 p-2 rounded-full flex items-center justify-center"
                    >
                        <Icon name="arrow_back" className="text-yellow-400" />
                    </button>
                    <h1 className="text-yellow-400 font-bold tracking-tight text-xl">Detalhes do Pedido</h1>
                    <button className="active:scale-95 transition-transform duration-200 hover:bg-neutral-800/50 p-2 rounded-full flex items-center justify-center">
                        <Icon name="more_vert" className="text-yellow-400" />
                    </button>
                </header>

                <main className="pt-24 px-4 space-y-6">
                    {/* Status & Identity */}
                    <section className={`bg-neutral-900 ${clayCard} rounded-xl p-6 flex items-center gap-4 border border-neutral-800/50`}>
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                                {driverAvatar ? (
                                    <img src={driverAvatar} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-stone-900/5">
                                        <Icon name="person" size={40} className="text-stone-950/30" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase">VIP</div>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white tracking-tight truncate max-w-[120px]">{driverName.split(' ')[0] || 'Piloto'}</h2>
                            <p className="text-yellow-400/80 font-semibold text-sm flex items-center gap-1">
                                <Icon name="star" className="text-sm" fill />
                                Nível {stats.level}
                            </p>
                        </div>
                        <div className="ml-auto text-right">
                            <p className="text-neutral-500 text-xs uppercase tracking-widest font-bold">Ganhos</p>
                            <p className="text-2xl font-black text-yellow-400">R$ {netEarnings.toFixed(2).replace('.', ',')}</p>
                        </div>
                    </section>


                    {/* Itens do Pedido */}
                    <section className="space-y-3">
                        <div className="flex justify-between items-end px-2">
                            <h2 className="text-neutral-400 font-bold text-sm uppercase tracking-widest">Itens do Pedido</h2>
                            <span className="text-yellow-400 text-xs font-bold uppercase">
                                {(() => {
                                    const items = Array.isArray(selectedOrder.items) ? selectedOrder.items : 
                                                 (typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items || '[]') : []);
                                    return items.length;
                                })()} Itens
                            </span>
                        </div>
                        <div className="flex flex-col gap-4">
                            {(() => {
                                let items = [];
                                try {
                                    items = Array.isArray(selectedOrder.items) ? selectedOrder.items : 
                                            (typeof selectedOrder.items === 'string' ? JSON.parse(selectedOrder.items || '[]') : []);
                                } catch (e) { items = []; }

                                if (items.length === 0) {
                                    return (
                                        <div className={`bg-neutral-900 ${clayCardDark} rounded-xl p-5 flex items-center gap-4 border border-neutral-800/50`}>
                                            <div className="w-14 h-14 rounded-full bg-yellow-400/10 flex items-center justify-center">
                                                <Icon name="package" className="text-yellow-400" />
                                            </div>
                                            <div>
                                                <span className="text-white font-bold text-sm block">{presentation.title}</span>
                                                <span className="text-neutral-500 text-xs">Verificar detalhes na coleta</span>
                                            </div>
                                        </div>
                                    );
                                }

                                return items.map((item: any, idx: number) => (
                                    <div key={idx} className={`bg-neutral-900 ${clayCardDark} rounded-xl p-4 flex items-center gap-4 border border-neutral-800/50`}>
                                        <div className="w-14 h-14 relative flex-shrink-0">
                                            <img 
                                                src={item.image || item.photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAuk8p52HQWwpR_wuk3TNwin3lv0PgotwugDnu2096J4W2od0SpPmzQR04uYsHnHyefMPAbu_LxocDYNFSBypC7KBNA68zy6PJZmKdz5Lbo3kL_9DQHae86xPcDGo9FVpI3NoQWjiQW_Cu30pemF5m_2jZMYH2BsJx1XCnixxIHyADJ4XuLpFblXF_Hb0GSi2pX2NRBVwcXb25TelTJBsy7IJzwkxpYvbzqs9rzQPXF_N2K2rqKtlFsXMFMbj8D1KlMTpW9UuiCvm8"} 
                                                className="w-full h-full object-cover rounded-full shadow-2xl" 
                                                alt={item.name} 
                                            />
                                            <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center shadow-lg">
                                                {item.quantity}x
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-white font-bold text-sm block">{item.name || item.product_name}</span>
                                            {item.observation && <span className="text-neutral-500 text-xs line-clamp-1">{item.observation}</span>}
                                        </div>
                                        <div className="text-right">
                                            <span className="text-yellow-400/60 text-[10px] font-bold block uppercase">Preço</span>
                                            <span className="text-white font-black text-xs">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </section>

                    {/* Pagamento Section */}
                    <section className="space-y-3">
                        <h2 className="text-neutral-400 font-bold text-sm uppercase tracking-widest px-2">Pagamento e Operação</h2>
                        
                        <div className={`bg-neutral-900 ${clayCardDark} rounded-xl p-6 border-l-4 border-yellow-400 space-y-4`}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <Icon name="stars" className="text-yellow-400" />
                                    <span className="text-white font-black text-xs uppercase tracking-tight">Seu Lucro Estimado</span>
                                </div>
                                <span className="text-yellow-400 text-2xl font-black">
                                    R$ {netEarnings.toFixed(2).replace('.', ',')}
                                </span>
                            </div>

                            <div className="h-px bg-white/5 w-full" />

                            <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                    <span className="text-neutral-500 font-bold text-xs">Forma de Pagamento</span>
                                    <span className="text-white font-black text-[10px] uppercase tracking-widest bg-white/5 px-2 py-1 rounded-md">{paymentLabel}</span>
                                </div>
                                
                                <div className="mt-4">
                                    {isPaid || selectedOrder.payment_method === 'online' ? (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
                                            <Icon name="verified" className="text-emerald-400" />
                                            <p className="text-emerald-400 text-[10px] font-black uppercase tracking-tight">Pedido já pago. Não cobrar no local.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-black/30 rounded-xl p-4 space-y-2 border border-white/5">
                                            <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-tighter">
                                                <span>Subtotal Itens:</span>
                                                <span className="text-neutral-300">R$ {(Number(selectedOrder.total_price || 0) - Number(selectedOrder.delivery_fee || 0)).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-tighter pb-2 border-b border-white/5">
                                                <span>Taxa de Entrega:</span>
                                                <span className="text-neutral-300">R$ {Number(selectedOrder.delivery_fee || 0).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            <div className="flex justify-between items-end pt-1">
                                                <span className="text-white font-black text-xs uppercase">Total a Cobrar</span>
                                                <span className="text-yellow-400 text-xl font-black">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {needsChange && (
                                <div className="bg-neutral-950/50 rounded-xl p-4 flex items-center gap-3 border border-yellow-400/20">
                                    <Icon name="account_balance_wallet" className="text-yellow-400" />
                                    <p className="text-neutral-300 text-[11px] font-bold">
                                        Troco para <span className="font-black text-white bg-yellow-400/20 px-1.5 py-0.5 rounded">R$ {Number(selectedOrder.change_for || 0).toFixed(2).replace('.', ',')}</span>
                                    </p>
                                </div>
                            )}

                            {/* ── Breakdown financeiro: Desconto da plataforma ── */}
                            {(() => {
                                const isCash = ['cash', 'dinheiro', 'money'].includes(
                                    (selectedOrder.payment_method || '').toLowerCase()
                                );
                                const discount = grossEarnings - netEarnings;
                                const hasDiscount = discount > 0.01;
                                if (!isCash && !hasDiscount) return null;
                                return (
                                    <div className="space-y-2">
                                        <div className="bg-black/40 rounded-xl p-4 space-y-2 border border-white/5">
                                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-3">Breakdown Financeiro</p>
                                            <div className="flex justify-between text-[11px] font-bold text-neutral-400">
                                                <span>💵 Valor recebido do cliente</span>
                                                <span className="text-neutral-200">R$ {grossEarnings.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                            {hasDiscount && (
                                                <div className="flex justify-between text-[11px] font-bold text-red-400">
                                                    <span>🏪 Taxa da plataforma</span>
                                                    <span>- R$ {discount.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            )}
                                            <div className="h-px bg-white/5 w-full my-1" />
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-black text-white uppercase tracking-tight">💰 Seu lucro líquido</span>
                                                <span className="text-emerald-400 font-black text-base">R$ {netEarnings.toFixed(2).replace('.', ',')}</span>
                                            </div>
                                        </div>

                                        {/* Aviso de débito no saldo — só quando dinheiro + desconto */}
                                        {isCash && hasDiscount && (
                                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3">
                                                <p className="text-amber-400 text-[9px] font-black uppercase tracking-[0.3em]">
                                                    💳 Impacto no seu Saldo Izi
                                                </p>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-neutral-400">Recebido em dinheiro</span>
                                                        <span className="text-white">+ R$ {grossEarnings.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[11px] font-bold">
                                                        <span className="text-neutral-400">Lucro líquido da missão</span>
                                                        <span className="text-emerald-400">R$ {netEarnings.toFixed(2).replace('.', ',')}</span>
                                                    </div>
                                                    <div className="h-px bg-amber-500/20 w-full" />
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-amber-400 text-[11px] font-black uppercase tracking-tight">Saldo desta missão</span>
                                                        <span className="text-red-400 font-black text-base">
                                                            R$ {(netEarnings - grossEarnings).toFixed(2).replace('.', ',')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-neutral-400 text-[10px] leading-relaxed border-t border-amber-500/20 pt-2">
                                                    O valor de{' '}
                                                    <span className="text-amber-400 font-black">R$ {discount.toFixed(2).replace('.', ',')}</span>
                                                    {' '}foi debitado automaticamente do seu saldo Izi.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </section>

                    {/* Observações e Ações Group */}
                    <section className={`bg-neutral-900 ${clayCard} rounded-[28px] border border-neutral-800/50 overflow-hidden`}>
                        <div className="p-6 space-y-5">
                            <h3 className="text-neutral-500 text-[9px] font-black uppercase tracking-[0.3em] mb-2 px-1">Notas da Missão</h3>
                            
                            {/* Observations */}
                            <div className="flex items-start gap-4 p-5 bg-neutral-950/50 rounded-2xl border border-neutral-800/30">
                                <div className="bg-yellow-400/10 p-2.5 rounded-xl">
                                    <Icon name="description" className="text-yellow-400" />
                                </div>
                                <div className="flex-1">
                                    <span className="text-white font-black text-[11px] uppercase tracking-widest opacity-60">Instruções</span>
                                    <p className="text-neutral-300 text-sm mt-1 leading-relaxed">"{selectedOrder.notes || 'Sem observações especiais dos produtos.'}"</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 border-t border-neutral-800/50">
                            <button className="py-5 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-neutral-800/50 active:scale-95 transition-all">
                                <Icon name="chat" className="text-yellow-400" />
                                Chat
                            </button>
                            <button 
                                onClick={() => window.open(`tel:${selectedOrder.customer_phone || selectedOrder.phone || ''}`)}
                                className="py-5 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 border-l border-neutral-800/50 hover:bg-neutral-800/50 active:scale-95 transition-all"
                            >
                                <Icon name="call" className="text-yellow-400" />
                                Central
                            </button>
                        </div>
                    </section>
                </main>

                {/* Bottom Fixed Action Button Container */}
                {activeTab !== 'history' && !['entregue', 'completed', 'finalizado', 'concluido', 'concluído', 'delivered', 'cancelado', 'cancelled'].includes(selectedOrder.status?.toLowerCase()) && (
                    <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-neutral-950 via-neutral-950/95 to-transparent z-50">
                        <button 
                            onClick={() => {
                                setShowOrderModal(false);
                                handleAccept(selectedOrder);
                            }}
                            disabled={isAccepting}
                            className={`w-full bg-yellow-400 ${clayYellow} py-6 rounded-full flex items-center justify-center gap-3 active:scale-[0.97] transition-transform shadow-[0_10px_40px_rgba(250,204,21,0.25)] disabled:opacity-50`}
                        >
                            <span className="text-black font-black text-lg tracking-tighter uppercase">
                                {isAccepting ? 'Confirmando...' : 'Ir Para a Coleta'}
                            </span>
                            <Icon name="arrow_forward" className="text-black font-bold" />
                        </button>
                    </div>
                )}
            </motion.div>
        );
    };

    const renderBroadcastPopup = () => {
        if (!activeBroadcast) return null;
        return (
          <motion.div 
            key="broadcast-popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border-4 border-white/50 dark:border-slate-800/50"
             >
                {activeBroadcast.image_url && (
                  <div className="w-full h-48 relative overflow-hidden">
                     <img src={activeBroadcast.image_url} alt="Broadcast" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                )}
                
                <div className="p-8 space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {activeBroadcast.title}
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                        {activeBroadcast.message}
                      </p>
                   </div>
                   
                   <motion.button 
                     whileTap={{ scale: 0.95 }}
                     onClick={() => {
                        localStorage.setItem('last_izi_broadcast_driver', activeBroadcast.id);
                        setActiveBroadcast(null);
                     }}
                     className="w-full bg-primary text-black font-black py-5 rounded-[22px] shadow-xl shadow-primary/10 uppercase tracking-widest text-[10px]"
                   >
                     Aproveitar
                   </motion.button>
                </div>
             </motion.div>
          </motion.div>
        );
    };

    return (
        <div className="w-full h-[100dvh] bg-black font-sans overflow-hidden relative">
            {/* Banner de Ativação de Áudio */}
            {audioBlocked && (
                <motion.div 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={enableAudioManually}
                    className="fixed top-20 left-4 right-4 z-[9999] bg-amber-500/95 backdrop-blur-xl p-4 rounded-2xl border border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.4)] flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="flex items-center gap-4">
                        <div className="size-10 rounded-full bg-white/20 flex items-center justify-center">
                            <Icon name="volume_up" size={24} className="text-white animate-pulse" />
                        </div>
                        <div>
                            <p className="text-white text-sm font-black leading-tight">ATIVAR ALERTAS SONOROS</p>
                            <p className="text-white/80 text-[10px] uppercase font-bold tracking-widest mt-0.5">Clique aqui para não perder novas vagas!</p>
                        </div>
                    </div>
                    <div className="size-8 rounded-full bg-black/20 flex items-center justify-center">
                        <Icon name="chevron_right" size={20} className="text-white" />
                    </div>
                </motion.div>
            )}
            {/* Banner de Permissão de Sobreposição */}
            {overlayBlocked && !overlayBannerDismissed && Capacitor.getPlatform() === 'android' && (
                <motion.div 
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    onClick={openOverlaySettings}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-orange-500/95 backdrop-blur-xl px-4 py-3 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform shadow-[0_8px_30px_rgba(0,0,0,0.4)]"
                    style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
                >
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                            <Icon name="visibility" size={18} className="text-white" />
                        </div>
                        <div>
                            <p className="text-white text-[11px] font-black leading-tight uppercase tracking-wide">âš ï¸ Ative: Sobrepor a outros apps</p>
                            <p className="text-white/80 text-[9px] font-bold mt-0.5">Toque aqui â†’ ative o toggle â†’ volte ao app</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-white text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-1 rounded-full">Ativar</span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); setOverlayBannerDismissed(true); }}
                            className="size-6 rounded-full bg-white/10 flex items-center justify-center"
                        >
                            <Icon name="close" size={12} className="text-white/60" />
                        </button>
                    </div>
                </motion.div>
            )}
            <AnimatePresence mode="wait">
                {!isAuthenticated && (
                    <div key="auth-container" className="h-full">
                        {renderLoginView()}
                    </div>
                )}
                {isAuthenticated && (
                    <div key="app" className="flex flex-col h-full overflow-hidden bg-black">
                        <AnimatePresence>{isSOSActive && renderSOS()}</AnimatePresence>
                        <AnimatePresence>{showOrderModal && renderOrderDetailsModal()}</AnimatePresence>
                        <AnimatePresence>{activeTab === 'active_mission' && renderActiveMissionView()}</AnimatePresence>
                        <AnimatePresence>{showBankDetails && renderBankDetailsView()}</AnimatePresence>
                        <AnimatePresence>{showPlateModal && renderPlateEditView()}</AnimatePresence>
                        <AnimatePresence>{showPreferences && renderPreferencesView()}</AnimatePresence>

                        {showSlotAppliedSuccess && (
                            <motion.div 
                                initial={{ opacity: 0 }} 
                                animate={{ opacity: 1 }} 
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[300] bg-black flex flex-col items-center justify-center p-8 text-center"
                            >
                                <motion.div 
                                    initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                    transition={{ type: "spring", damping: 12 }}
                                    className="size-32 rounded-[48px] bg-yellow-400 flex items-center justify-center mb-10 relative"
                                    style={{
                                        boxShadow: '0 20px 50px rgba(250,204,21,0.25), inset 8px 8px 16px rgba(255,255,255,0.7), inset -8px -8px 16px rgba(0,0,0,0.15)'
                                    }}
                                >
                                    <Icon name="verified" size={56} className="text-zinc-950" />
                                    <motion.div 
                                        animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 border-4 border-yellow-400/50 rounded-[48px]"
                                    />
                                </motion.div>
                                
                                <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none mb-4 text-center">
                                    Candidatura <br />
                                    <span className="text-yellow-400">Enviada com Sucesso!</span>
                                </h2>
                                
                                <p className="text-white/40 font-bold text-[10px] sm:text-xs tracking-[0.2em] mb-12 max-w-xs uppercase leading-relaxed">
                                    Seu perfil premium foi enviado para análise. Fique atento às suas notificações!
                                </p>

                                <button
                                    onClick={() => {
                                        setShowSlotAppliedSuccess(false);
                                        setSelectedSlot(null);
                                    }}
                                    className="w-full max-w-xs h-18 rounded-[2.5rem] bg-white text-zinc-950 font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.15)] border-t border-zinc-200"
                                    style={{
                                        boxShadow: '0 15px 35px rgba(255,255,255,0.1), inset 6px 6px 12px rgba(255,255,255,1), inset -6px -6px 12px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    Voltar para Vagas
                                </button>
                                
                                <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-10">
                                    <div className="w-16 h-1.5 bg-white/20 rounded-full" />
                                </div>
                            </motion.div>
                        )}

                        <div className="flex flex-col h-full overflow-hidden">
                            {activeTab !== 'dashboard' && renderHeader()}
                            
                            <main className="flex-1 overflow-y-auto no-scrollbar relative">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'dashboard' && <div key="dash">{renderDashboard()}</div>}
                                    {activeTab === 'history' && <div key="hist">{renderHistoryView()}</div>}
                                    {activeTab === 'earnings' && <div key="earn">{renderEarningsView()}</div>}
                                    {activeTab === 'profile' && <div key="prof">{renderProfileView()}</div>}
                                    {activeTab === 'dedicated' && <div key="dedi">{renderDedicatedView()}</div>}
                                    {activeTab === 'scheduled' && <div key="sched">{renderScheduledView()}</div>}
                                </AnimatePresence>

                                <AnimatePresence>
                                    {activeMission && activeTab !== 'active_mission' && (
                                        <motion.button 
                                            key="mission-btn" 
                                            initial={{ y: 80, opacity: 0 }} 
                                            animate={{ y: 0, opacity: 1 }} 
                                            exit={{ y: 80, opacity: 0 }} 
                                            onClick={() => setActiveTab('active_mission')} 
                                            className="fixed bottom-28 left-5 right-5 z-[60] clay-profile-inner bg-yellow-400 text-slate-900 rounded-[2.5rem] h-20 flex items-center justify-between px-8 shadow-[0_25px_50px_rgba(250,204,21,0.4)] border-t border-white/60"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="size-4 bg-slate-950 rounded-full animate-ping" />
                                                <div className="flex flex-col items-start">
                                                    <span className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-950/60 leading-none mb-1">Missão Ativa</span>
                                                    <span className="font-black text-xs uppercase tracking-[0.1em] text-slate-950">Continuar Entrega</span>
                                                </div>
                                            </div>
                                            <div className="size-12 bg-slate-950/10 rounded-2xl flex items-center justify-center shadow-inner">
                                                <Icon name="arrow_forward" className="text-slate-950 text-2xl font-black" />
                                            </div>
                                        </motion.button>
                                    )}
                                </AnimatePresence>

                                {!activeMission && (
                                    <motion.button 
                                        initial={{ scale: 0, y: 50 }} 
                                        animate={{ scale: 1, y: 0 }} 
                                        whileTap={{ scale: 0.9 }} 
                                        onClick={handleToggleOnline} 
                                        className={`fixed bottom-40 right-6 z-[90] size-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                                            isOnline ? 'clay-fab-online' : 'clay-fab-offline'
                                        }`}
                                    >
                                        <Icon 
                                            name="power_settings_new" 
                                            size={32} 
                                            className="text-white" 
                                        />
                                    </motion.button>
                                )}
                            </main>
                            {renderBottomNavigation()}
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
                        className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md flex items-end justify-center"
                        onClick={() => setShowWithdrawModal(false)}
                    >
                        <motion.div
                            drag="y"
                            dragConstraints={{ top: 0, bottom: 0 }}
                            dragElastic={0.7}
                            onDragEnd={(_, info) => {
                                if (info.offset.y > 100) setShowWithdrawModal(false);
                            }}
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={e => e.stopPropagation()}
                            className="w-full max-w-lg clay-card-exclusive rounded-t-[50px] p-8 pb-36 space-y-6 relative border-t border-white/10"
                            style={{ 
                                background: 'linear-gradient(180deg, #111111 0%, #000000 100%)',
                                boxShadow: '0 -20px 60px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.1)'
                            }}
                        >
                            {/* Drag Handle Improvements */}
                            <div className="flex flex-col items-center gap-1.5 mb-2">
                                <div className="w-12 h-1.5 bg-white/20 rounded-full shadow-inner" />
                                <div className="w-8 h-1 bg-white/10 rounded-full" />
                            </div>

                            <div className="text-center space-y-1 py-2">
                                <p className="text-[10px] font-black text-primary uppercase tracking-[0.5em] mb-2 opacity-70">Resgate de Saldo</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-2xl font-black text-white/10">R$</span>
                                    <span className="text-6xl font-black text-white tracking-tighter leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
                                        {stats.balance.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </div>

                            <div className="clay-card-dark border border-white/5 rounded-[40px] p-6 space-y-5 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />
                                
                                <div className="flex justify-between items-center clay-profile-inner p-5 rounded-[24px] border border-white/5 shadow-inner">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Chave PIX Ativa</span>
                                        <span className="text-xs font-black text-white truncate max-w-[180px] tracking-tight">{pixKey}</span>
                                    </div>
                                    <div className="size-12 rounded-2xl bg-black/20 flex items-center justify-center border border-white/5 shadow-lg">
                                        <Icon name="qr_code_2" size={24} className="text-primary drop-shadow-[0_0_8px_rgba(255,217,0,0.5)]" />
                                    </div>
                                </div>

                                <div className="space-y-4 px-2">
                                    {Number(appSettings?.withdrawal_fee_percent ?? 0) > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
                                                Taxa Admin
                                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[8px] text-white/30 capitalize">{appSettings?.withdrawal_fee_percent}%</span>
                                            </span>
                                            <span className="text-xs font-black text-rose-500">- R$ {(stats.balance * (Number(appSettings?.withdrawal_fee_percent) / 100)).toFixed(2).replace('.', ',')}</span>
                                        </div>
                                    )}
                                    
                                    <div className="h-px bg-white/5 mx-2" />

                                    <div className="flex justify-between items-center py-2">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-primary uppercase tracking-widest">Valor Líquido</span>
                                            <span className="text-[8px] font-medium text-white/20 uppercase tracking-wider">Depósito imediato via PIX</span>
                                        </div>
                                        <span className="text-3xl font-black text-primary drop-shadow-[0_0_20px_rgba(255,217,0,0.4)]">
                                            R$ {(stats.balance * (1 - (Number(appSettings?.withdrawal_fee_percent ?? 0) / 100))).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 clay-profile-inner p-5 rounded-[28px] border border-primary/10 overflow-hidden relative shadow-inner">
                                <div className="absolute inset-0 bg-primary/5 opacity-50 blur-2xl"></div>
                                <div className="size-10 rounded-xl bg-black/20 flex items-center justify-center border border-white/5 shrink-0 shadow-lg">
                                    <Icon name="bolt" className="text-primary" size={20} />
                                </div>
                                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest leading-relaxed relative z-10">
                                    Pagamentos processados em até <span className="text-white">{appSettings?.withdrawal_period_h ?? 24}h</span> úteis.
                                </p>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowWithdrawModal(false)}
                                    disabled={isWithdrawLoading}
                                    className="flex-1 h-18 rounded-[30px] bg-white/[0.03] border border-white/10 text-white/40 font-black text-[10px] uppercase tracking-[0.2em] active:bg-white/[0.05] shadow-xl transition-all disabled:opacity-30"
                                >
                                    Voltar
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={confirmWithdraw}
                                    disabled={isWithdrawLoading}
                                    className="flex-[1.8] h-18 rounded-[30px] bg-primary text-black font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,217,0,0.2)] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3 border-t border-white/40"
                                >
                                    {isWithdrawLoading ? (
                                        <>
                                            <div className="size-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                                            <span>Processando</span>
                                        </>
                                    ) : (
                                        <>
                                            <Icon name="check_circle" size={22} />
                                            <span>Solicitar Saque</span>
                                        </>
                                    )}
                                </motion.button>
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
                            className="text-3xl font-black text-white uppercase tracking-tighter"
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
                        className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="w-full max-w-sm bg-[#121212] border border-white/5 rounded-[48px] p-10 relative overflow-hidden"
                            style={{
                                boxShadow: '0 40px 100px rgba(0,0,0,0.8), inset 4px 4px 12px rgba(255,255,255,0.03), inset -4px -4px 12px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />

                            <div className="size-20 rounded-[32px] bg-amber-500/10 flex items-center justify-center mb-8 border border-white/5 shadow-inner">
                                <span className="material-symbols-outlined text-primary text-4xl animate-pulse">payments</span>
                            </div>

                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-3">Atenção Piloto!</h3>
                            <p className="text-neutral-400 font-bold text-sm leading-relaxed mb-10">
                                Este pedido ainda <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-4">não foi pago</span> via App. 
                                <br />Confirme o recebimento de:
                                <span className="block text-white text-3xl font-black mt-2 tracking-tighter">
                                    R$ {Number(confirmPaymentState.mission.total_price || 0).toFixed(2).replace('.', ',')}
                                </span>
                            </p>

                            <div className="space-y-4">
                                {confirmPaymentState.isCashWarning ? (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-[#1a1414] border border-rose-500/20 p-6 rounded-3xl"
                                        style={{ boxShadow: 'inset 0 4px 20px rgba(244,63,94,0.1)' }}
                                    >
                                        <div className="flex items-start gap-4 mb-6">
                                            <div className="p-2 bg-rose-500/10 rounded-full border border-rose-500/20 shrink-0">
                                                <span className="material-symbols-outlined text-rose-500">warning</span>
                                            </div>
                                            <p className="text-rose-200 text-xs leading-relaxed font-medium">
                                                Ao confirmar o recebimento em <strong className="text-rose-400 uppercase">Dinheiro</strong>, esse valor será <strong className="text-white">descontado do seu saldo</strong> de repasses. Deseja confirmar?
                                            </p>
                                        </div>
                                        <div className="flex gap-3">
                                            <button 
                                                onClick={() => setConfirmPaymentState(prev => prev ? { ...prev, isCashWarning: false } : prev)}
                                                className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                                            >
                                                Voltar
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    confirmPaymentState.resolve('dinheiro');
                                                    setConfirmPaymentState(null);
                                                }}
                                                className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest shadow-[0_5px_20px_rgba(244,63,94,0.3),inset_2px_2px_8px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                                            >
                                                Confirmar
                                            </button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => setConfirmPaymentState(prev => prev ? { ...prev, isCashWarning: true } : prev)}
                                            className="w-full py-5 rounded-[24px] bg-primary text-slate-950 font-black text-sm uppercase tracking-widest shadow-[0_10px_30px_rgba(250,204,21,0.2),inset_4px_4px_10px_rgba(255,255,255,0.4)] active:scale-95 transition-all"
                                        >
                                            Recebi em Dinheiro
                                        </button>
                                        <button 
                                            onClick={() => {
                                                confirmPaymentState.resolve('pix_cartao');
                                                setConfirmPaymentState(null);
                                            }}
                                            className="w-full py-5 rounded-[24px] bg-white/[0.05] border border-white/5 text-white font-black text-sm uppercase tracking-widest hover:bg-white/[0.08] transition-all active:scale-95 shadow-inner"
                                        >
                                            Recebi via Pix / Cartão
                                        </button>
                                        <button 
                                            onClick={() => {
                                                confirmPaymentState.resolve(false);
                                                setConfirmPaymentState(null);
                                            }}
                                            className="w-full py-4 text-rose-500/40 hover:text-rose-500 font-bold text-[10px] uppercase tracking-[0.3em] transition-colors mt-2"
                                        >
                                            Ainda não recebi
                                        </button>
                                    </>
                                )}
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
                        className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center overflow-hidden"
                    >
                        <div className="absolute inset-0 pointer-events-none opacity-20">
                           <div className="absolute top-1/4 left-1/4 size-64 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                           <div className="absolute bottom-1/4 right-1/4 size-64 bg-emerald-500/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
                        </div>

                        <motion.div 
                            initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
                            animate={{ scale: 1, opacity: 1, rotate: 0 }}
                            transition={{ type: "spring", damping: 10, stiffness: 100 }}
                            className="size-36 rounded-[54px] flex items-center justify-center mb-10 relative"
                            style={{
                              background: 'linear-gradient(145deg, #4ade80, #16a34a)',
                              boxShadow: '0 20px 80px rgba(74,222,128,0.4), inset 6px 6px 16px rgba(255,255,255,0.3), inset -6px -6px 16px rgba(0,0,0,0.2)'
                            }}
                        >
                            {/* Check SVG claymorphism */}
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path 
                                d="M12 32L26 46L52 18" 
                                stroke="#052e16" 
                                strokeWidth="8" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                              />
                            </svg>
                            
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
                            <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none text-center">
                                Parabéns! <br />
                                <span className="text-primary">Missão Concluída</span>
                            </h2>
                            <p className="text-slate-400 font-bold text-sm tracking-wide uppercase opacity-60">Você acaba de faturar:</p>
                        </motion.div>

                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.4, type: "spring" }}
                            className="my-6 w-full max-w-sm px-6 py-8 bg-[#120F0F] border border-white/5 rounded-[48px] shadow-[0_30px_60px_rgba(0,0,0,0.9),inset_4px_4px_12px_rgba(255,255,255,0.03),inset_-4px_-4px_12px_rgba(0,0,0,0.8)] relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16 rounded-full" />

                            <div className="relative z-10 flex flex-col gap-6">
                                <div>
                                    <span className="block text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2 text-center">Ganho Líquido (Frete)</span>
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="text-2xl font-black text-white opacity-40 mt-3">R$</span>
                                        <span className="text-7xl font-black text-white tracking-tighter leading-none" style={{ textShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                                            {(finishedMissionData.amount || 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-6 border-t border-white/5">
                                    <div className="bg-[#1A1616] p-3 rounded-[24px] border border-white/5 flex flex-col items-center justify-center shadow-[inset_3px_3px_10px_rgba(0,0,0,0.4)]">
                                        <span className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Total do Pedido</span>
                                        <span className="text-lg font-black text-slate-300">
                                            R$ {(finishedMissionData.grossAmount || 0).toFixed(2).replace('.', ',')}
                                        </span>
                                    </div>
                                    <div className="bg-[#1A1616] p-3 rounded-[24px] border border-white/5 flex flex-col items-center justify-center shadow-[inset_3px_3px_10px_rgba(0,0,0,0.4)]">
                                        <span className="block text-[8px] font-black text-primary uppercase tracking-widest mb-1">XP Ganhos</span>
                                        <div className="flex items-center gap-1">
                                            <span className="text-lg font-black text-primary">+{finishedMissionData.xpGained || 15}</span>
                                            <span className="text-[10px] font-black text-primary/50">XP</span>
                                        </div>
                                    </div>
                                </div>
                                {finishedMissionData.cashDiscount && finishedMissionData.cashDiscount > 0 && (
                                    <div className="mt-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-[24px] flex items-center justify-center gap-3">
                                        <div className="size-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-rose-500 text-sm font-black">payments</span>
                                        </div>
                                        <div className="text-left flex-1">
                                            <span className="block text-[9px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Dinheiro Retido</span>
                                            <span className="text-sm font-black text-rose-300">
                                                - R$ {finishedMissionData.cashDiscount.toFixed(2).replace('.', ',')}
                                            </span>
                                        </div>
                                    </div>
                                )}
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

            <AnimatePresence>
                {showApprovedSlotModal && approvedSlotData && (
                    <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 sm:p-10">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
                            onClick={() => {
                                setShowApprovedSlotModal(false);
                                stopIziSounds();
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.8, y: 50, opacity: 0 }}
                            className="relative w-full max-w-sm clay-card-exclusive bg-black/95 p-8 flex flex-col items-center gap-8 overflow-hidden border border-white/10"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl -mr-16 -mt-16 rounded-full" />
                            
                            <div className="size-24 rounded-[32px] bg-primary flex items-center justify-center shadow-[0_20px_40px_rgba(250,204,21,0.3)]">
                                <Icon name="verified" size={48} className="text-black" />
                            </div>

                            <div className="text-center space-y-3">
                                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Parabéns!</h2>
                                <h3 className="text-3xl font-black text-white tracking-tighter leading-none">VAGA CONFIRMADA</h3>
                                <p className="text-xs text-white/40 leading-relaxed font-bold px-4">
                                    Você foi selecionado para a vaga de <span className="text-white">{approvedSlotData.title}</span> em <span className="text-white">{approvedSlotData.admin_users?.store_name || 'um novo parceiro'}</span>.
                                </p>
                            </div>

                            <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                            <div className="w-full flex flex-col gap-4">
                                <div className="flex justify-between items-center px-4 py-3 bg-white/5 rounded-[24px]">
                                    <div className="flex flex-col">
                                        <p className="text-[8px] font-black text-white/30 uppercase tracking-widest">Garantido</p>
                                        <p className="text-xl font-black text-primary leading-none">R$ {parseFloat(approvedSlotData.fee_per_day || 0).toFixed(0)} <span className="text-[10px] not-italic text-white/20">/ dia</span></p>
                                    </div>
                                    <Icon name="payments" className="text-white/10" size={32} />
                                </div>
                            </div>

                            <button 
                                onClick={() => {
                                    setShowApprovedSlotModal(false);
                                    stopIziSounds();
                                    setActiveTab('dedicated');
                                    setSelectedSlot(approvedSlotData);
                                }}
                                className="w-full h-20 bg-primary text-black rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-[0_15px_30px_rgba(250,204,21,0.2)] active:scale-95 transition-all flex items-center justify-center gap-4 border-t border-white/40"
                            >
                                VER DETALHES <Icon name="chevron_right" />
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSplash && (
                    <SplashScreen finishLoading={() => setShowSplash(false)} />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showWithdrawHistory && renderWithdrawHistoryView()}
                {showWithdrawDetail && renderWithdrawDetailView()}
            </AnimatePresence>

            {/* In-App Broadcast Popups */}
            <AnimatePresence>
              {renderBroadcastPopup()}
            </AnimatePresence>
        </div>
    );
}

export default App;



