import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase, supabaseUrl } from './lib/supabase';
import { playIziSound, stopIziSounds } from './lib/iziSounds';
import { toast, toastSuccess, toastError, showConfirm } from './lib/useToast';
import { BespokeIcons } from './lib/BespokeIcons';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service';

import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer, OverlayView, Polyline, DirectionsService } from '@react-google-maps/api';
import SplashScreen from './components/common/SplashScreen';
import { IziBottomSheet } from './components/common/IziBottomSheet';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LocalErrorBoundary } from './components/common/LocalErrorBoundary';
import { OnboardingView } from './components/features/OnboardingView';
import { MissionsView } from './components/features/MissionsView';
import NotificationsCenterView from './components/features/NotificationsCenterView';
import Icon from './components/common/Icon';
import { incrementMissionProgress } from './lib/gamification';
import HistoryView from './components/features/HistoryView';
import { DashboardView } from './components/features/DashboardView';
import EarningsView from './components/features/EarningsView';
import ProfileView from './components/features/ProfileView';
import ScheduledView from './components/features/ScheduledView';
import WithdrawHistoryView from './components/features/WithdrawHistoryView';
import { normalizeServiceType, cleanAddressText, formatCurrency } from './lib/utils';
import { iziFetch } from './lib/iziFetch';
import PersonalDataModal from './components/features/PersonalDataModal';
import BankDetailsModal from './components/features/BankDetailsModal';

const GOOGLE_MAPS_LIBRARIES: ('places' | 'geometry')[] = ['places', 'geometry'];
const GOOGLE_MAPS_ID = 'izi-pilot-map';

const sClayLight: React.CSSProperties = {
 background: 'linear-gradient(145deg, #ffffff, #f4f4f5)',
 boxShadow: '15px 15px 35px rgba(0,0,0,0.05), inset 5px 5px 12px rgba(255,255,255,0.8)',
 borderRadius: '32px'
};

const sClayDark: React.CSSProperties = {
 background: 'linear-gradient(145deg, #18181b, #09090b)',
 boxShadow: '15px 15px 35px rgba(0,0,0,0.4), inset 5px 5px 12px rgba(255,255,255,0.05)',
 borderRadius: '32px'
};

const sClayYellow: React.CSSProperties = {
 background: 'linear-gradient(145deg, #facc15, #eab308)',
 boxShadow: '0 20px 45px rgba(250,204,21,0.25), inset 8px 8px 16px rgba(255,255,255,0.5), inset -8px -8px 16px rgba(0,0,0,0.15)',
 borderRadius: '32px'
};

const sClayIcon: React.CSSProperties = {
 background: '#f8fafc',
 border: '1px solid rgba(0,0,0,0.05)',
 borderRadius: '20px'
};

const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = {
 disableDefaultUI: true,
 zoomControl: false,
 gestureHandling: 'greedy',
 backgroundColor: '#ffffff',
 styles: [
 { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
 { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
 { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
 { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#f8fafc" }] },
 { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
 { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
 { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#fde047" }] },
 { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#eab308" }, { "visibility": "on" }, { "weight": 1 }] },
 { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
 { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "color": "#e2e8f0" }, { "visibility": "on" }] },
 { "featureType": "road.local", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
 { "featureType": "transit", "elementType": "all", "stylers": [{ "visibility": "off" }] },
 { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#bae6fd" }] }
 ]
};
type View = 'dashboard' | 'history' | 'earnings' | 'profile' | 'active_mission' | 'dedicated' | 'scheduled' | 'sos' | 'missions' | 'notifications';
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
const validateCPF = (cpf: string) => {
 cpf = cpf.replace(/[^\d]+/g, '');
 if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
 let soma = 0, resto;
 for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
 resto = (soma * 10) % 11;
 if (resto === 10 || resto === 11) resto = 0;
 if (resto !== parseInt(cpf.substring(9, 10))) return false;
 soma = 0;
 for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
 resto = (soma * 10) % 11;
 if (resto === 10 || resto === 11) resto = 0;
 return resto === parseInt(cpf.substring(10, 11));
};

const isValidCoord = (c: any) => c && typeof c.lat === 'number' && Math.abs(c.lat) > 0.01;

const MISSION_MAP_STYLE = [
 { "elementType": "geometry", "stylers": [{ "color": "#f1f5f9" }] },
 { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
 { "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
 { "elementType": "labels.text.stroke", "stylers": [{ "color": "#ffffff" }, { "weight": 3 }] },
 { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
 { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
 { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
 { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#cbd5e1" }, { "visibility": "on" }, { "weight": 1 }] },
 { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
 { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#fef08a" }] },
 { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#facc15" }, { "visibility": "on" }] },
 { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#bae6fd" }] }
] as const;

const VEHICLE_COMPATIBILITY: Record<string, string[]> = {
 'moto': ['mototaxi', 'restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'mototaxi': ['mototaxi', 'restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'carro': ['frete', 'mudanca', 'motorista', 'restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'bike': ['restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'bicicleta': ['restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'fiorino': ['frete', 'mudanca', 'restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'caminhonete': ['frete', 'mudanca', 'restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'van': ['frete', 'mudanca', 'motorista', 'restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'],
 'vuc': ['frete', 'mudanca'],
 'bau_p': ['frete', 'mudanca'],
 'bau_m': ['frete', 'mudanca'],
 'bau_g': ['frete', 'mudanca']
};

function MissionRouteMap({ pickup, delivery, pickupAddress, deliveryAddress, driverCoords, missionPhase = 'to_pickup', onRouteInfo, isLoaded = false }: { pickup: any, delivery: any, pickupAddress?: string, deliveryAddress?: string, driverCoords?: any, missionPhase?: 'to_pickup' | 'to_delivery', onRouteInfo?: (info: any) => void, isLoaded?: boolean }) {
 const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
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
 }, [isLoaded, vPickup?.lat, vPickup?.lng, vDelivery?.lat, vDelivery?.lng, pickupAddress, deliveryAddress, missionPhase, driverCoords?.lat, driverCoords?.lng]);

 // mapStyle movido para constante MISSION_MAP_STYLE fora do componente (performance)

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
 map.fitBounds(bounds, { top: 100, bottom: paddingBottom, left: 80, right: 80 });
 
 // Garantir zoom de helicóptero (máximo 14) mesmo se os pontos estiverem próximos
 const listener = google.maps.event.addListener(map, 'idle', () => {
 if (map.getZoom()! > 14) {
 map.setZoom(14);
 }
 google.maps.event.removeListener(listener);
 });
 }
 }
 }, [map, isLoaded, routePolyline, vPickup?.lat, vDelivery?.lat]);

 if (!isLoaded) return <div className="w-full h-full bg-white animate-pulse" />;

 const mapCenter = useMemo(() => routeInfo?.start || vPickup || vDelivery || { lat: -19.9167, lng: -43.9345 }, [routeInfo?.start?.lat, routeInfo?.start?.lng, vPickup?.lat, vPickup?.lng, vDelivery?.lat, vDelivery?.lng]);

 const mapOpts = useMemo(() => ({
 disableDefaultUI: true,
 styles: MISSION_MAP_STYLE as any,
 backgroundColor: '#ffffff',
 gestureHandling: 'greedy' as const,
 zoomControl: false,
 streetViewControl: false,
 mapTypeControl: false,
 fullscreenControl: false
 }), []);

 const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);

 // Memoizar decodificação de polyline (operação pesada)
 const decodedPath = useMemo(() => {
 if (!routePolyline || !window.google?.maps?.geometry?.encoding) return [];
 return window.google.maps.geometry.encoding.decodePath(routePolyline);
 }, [routePolyline]);

 return (
 <div className="w-full h-full relative">
 <GoogleMap
 mapContainerStyle={containerStyle}
 center={mapCenter}
 zoom={routePolyline ? 14 : 13}
 onLoad={setMap}
 options={mapOpts}
 >
 {routePolyline && (
 <Polyline 
 path={decodedPath} 
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
 <div className="relative -translate-x-1/2 -translate-y-1/2">
 <div className="relative flex items-center justify-center">
 <div className="absolute size-10 bg-blue-500/30 rounded-full animate-ping" />
 <div className="absolute size-6 bg-blue-500/20 rounded-full animate-pulse" />
 <div className="relative size-4 bg-blue-600 rounded-full border-2 border-white " />
 </div>
 </div>
 </OverlayView>
 )}

 {/* Marcador de Coleta (Loja) - mostrar sempre */}
 {vPickup && (
 <OverlayView position={vPickup} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
 <div className="relative flex items-center justify-center">
 <div className="size-11 rounded-3xl bg-white border border-neutral-200 flex items-center justify-center">
 <div className="size-8 rounded-2xl bg-yellow-400 flex items-center justify-center ">
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
 <div className="relative -translate-x-1/2 -translate-y-1/2">
 <div className="relative flex items-center justify-center">
 <div className="absolute size-10 bg-green-500/30 rounded-full animate-ping" />
 <div className="absolute size-6 bg-green-500/20 rounded-full animate-pulse" />
 <div className="relative size-4 bg-green-600 rounded-full border-2 border-white " />
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
 className="absolute bottom-[38vh] right-6 size-14 bg-yellow-400 rounded-xl flex items-center justify-center active:scale-90 transition-all z-[120]"
 >
 <Icon name="my_location" size={28} className="text-black" />
 </motion.button>
 </div>
 );
}



const getTypeDetails = (rawType: string) => {
 const type = normalizeServiceType(rawType);
 switch (type) {
 case 'package': return { icon: 'package_2', color: 'text-primary', hex: '#facc15', bg: 'bg-primary/10', label: 'Envio Express', isFood: false };
 case 'mototaxi': return { icon: 'motorcycle', color: 'text-emerald-400', hex: '#10b981', bg: 'bg-emerald-400/10', label: 'MotoTaxi', isFood: false };
 case 'car_ride': return { icon: 'directions_car', color: 'text-blue-400', hex: '#60a5fa', bg: 'bg-blue-400/10', label: 'Carro', isFood: false };
 case 'frete': return { icon: 'local_shipping', color: 'text-orange-400', hex: '#fb923c', bg: 'bg-orange-400/10', label: 'Frete/Carreto', isFood: false };
 case 'van': return { icon: 'local_shipping', color: 'text-sky-400', hex: '#38bdf8', bg: 'bg-sky-400/10', label: 'Van', isFood: false };
 case 'utilitario': return { icon: 'local_shipping', color: 'text-indigo-400', hex: '#818cf8', bg: 'bg-indigo-400/10', label: 'Utilitario', isFood: false };
 case 'logistica': return { icon: 'local_shipping', color: 'text-orange-400', hex: '#fb923c', bg: 'bg-orange-400/10', label: 'Logistica', isFood: false };
 case 'restaurant': return { icon: 'package_2', color: 'text-yellow-400', hex: '#facc15', bg: 'bg-yellow-400/10', label: 'Comida', isFood: true };
 case 'market': return { icon: 'package_2', color: 'text-blue-400', hex: '#60a5fa', bg: 'bg-blue-400/10', label: 'Mercado', isFood: false };
 case 'pharmacy': return { icon: 'package_2', color: 'text-rose-400', hex: '#fb7185', bg: 'bg-rose-400/10', label: 'Farmacia', isFood: false };
 case 'beverages': return { icon: 'package_2', color: 'text-zinc-950 font-black', hex: '#09090b', bg: 'bg-zinc-50', label: 'Bebidas', isFood: false };
 case 'motorista_particular': return { icon: 'military_tech', color: 'text-yellow-400', hex: '#facc15', bg: 'bg-yellow-400/10', label: 'Motorista Particular', isFood: false };
 case 'motoboy': return { icon: 'motorcycle', color: 'text-emerald-400', hex: '#10b981', bg: 'bg-emerald-400/10', label: 'Motoboy', isFood: false };
 default: return { icon: 'motorcycle', color: 'text-primary', hex: '#facc15', bg: 'bg-primary/10', label: 'Servico Express', isFood: false };
 }
};

const normalizeLookupText = (value: unknown): string =>
 String(value ?? '')
 .normalize('NFD')
 .replace(/[\u0300-\u036f]/g, '')
 .toLowerCase()
 .trim();

const includesAny = (text: string, terms: string[]) => terms.some(term => text.includes(term));



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
 headline = rawType === 'entrega_avulsa' ? 'Entrega Avulsa' : 'Servico de motoboy';
 } else if (detectedType === 'package') {
 headline = 'Envio express';
 }

 let icon = 'package';
 if (detectedType === 'restaurant' || detectedType === 'food') icon = 'restaurant';
 else if (detectedType === 'market') icon = 'shopping_cart';
 else if (detectedType === 'pharmacy') icon = 'local_pharmacy';
 else if (detectedType === 'beverage') icon = 'local_bar';
 else if (isMobility) icon = 'directions_car';
 else if (isFreight) icon = 'local_shipping';

 const badges: string[] = [];
 if (merchantName && !isMobility) badges.push(merchantName);
 if (itemCount > 0) badges.push(`${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`);
 if (order?.preparation_status === 'pronto') badges.push('Pronto para coleta');
 if (includesAny(normalizeLookupText(addressMeta), ['recebedor'])) badges.push('Com recebedor');
 if (includesAny(normalizeLookupText(addressMeta), ['ajudante'])) badges.push('Com ajudantes');
 if (includesAny(normalizeLookupText(addressMeta), ['escada'])) badges.push('Possui escadas');

 let summary = '';
 if (itemCount > 0) {
 summary = itemNames.slice(0, 2).join(' ââ‚¬¢ ');
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
 icon,
 color: details.hex || '#facc15',
 };
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function MainApp() {
 const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
 const { isLoaded } = useJsApiLoader({ id: GOOGLE_MAPS_ID, googleMapsApiKey: mapsKey, libraries: GOOGLE_MAPS_LIBRARIES, language: 'pt-BR', region: 'BR' });

 const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('izi_driver_id') !== null);
 const [driverId, setDriverId] = useState<string | null>(() => localStorage.getItem('izi_driver_id'));
 const [driverCoords, setDriverCoords] = useState<{lat: number, lng: number} | null>(null);
 const [driverName, setDriverName] = useState(() => localStorage.getItem('izi_driver_name') || 'Entregador');
 const [driverAvatar, setDriverAvatar] = useState<string | null>(() => localStorage.getItem('izi_driver_avatar') || null);
 const [driverPlate, setDriverPlate] = useState(() => localStorage.getItem('izi_driver_plate') || '');
 const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
 const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
 const [isApproved, setIsApproved] = useState(() => localStorage.getItem('izi_driver_approved') === 'true');
 const [isProfileLoaded, setIsProfileLoaded] = useState(() => localStorage.getItem('izi_driver_approved') !== null);
 const [isCardExpanded, setIsCardExpanded] = useState(false);
 const [authEmail, setAuthEmail] = useState(() => localStorage.getItem('izi_driver_email') || '');
 const [authPassword, setAuthPassword] = useState('');
 const [showAuthPassword, setShowAuthPassword] = useState(false);
 const [rememberLogin, setRememberLogin] = useState(() => localStorage.getItem('izi_driver_remember') === 'true');
 const [authError, setAuthError] = useState('');
 const [authName, setAuthName] = useState(() => localStorage.getItem('izi_driver_name') || '');
 const [authCpf, setAuthCpf] = useState(() => localStorage.getItem('izi_driver_cpf') || '');
 const [authVehicle, setAuthVehicle] = useState<string>('mototaxi');
 const [authPhone, setAuthPhone] = useState(() => localStorage.getItem('izi_driver_phone') || '');
 const [driverVehicle, setDriverVehicle] = useState<string>(() => localStorage.getItem('izi_driver_vehicle') || 'mototaxi');

 // compatibilityMap movido para constante VEHICLE_COMPATIBILITY fora do componente (performance)
 const [authLoading, setAuthLoading] = useState(false);
 const [authInitLoading, setAuthInitLoading] = useState(true);

 const checkApprovalStatus = useCallback(async (uid: string) => {
 const { data } = await supabase.from('drivers_delivery').select('is_active').eq('id', uid).maybeSingle();
 setIsApproved(!!data?.is_active);
 }, []);
 const [appSettings, setAppSettings] = useState<any>(null);
 const [globalSettings, setGlobalSettings] = useState<any>(null);
 const [exclusiveMerchantIds, setExclusiveMerchantIds] = useState<string[]>([]);
 const exclusiveMerchantIdsRef = useRef<string[]>([]);
 useEffect(() => { exclusiveMerchantIdsRef.current = exclusiveMerchantIds; }, [exclusiveMerchantIds]);
 const [dynamicRates, setDynamicRates] = useState<any>(null);
 const [realTimeRoute, setRealTimeRoute] = useState<{distanceText: string, distanceValue: number, durationText: string} | null>(null);
 const [activeBroadcast, setActiveBroadcast] = useState<any>(null);
 const [showSplash, setShowSplash] = useState(true);

 const ensureDriverRecord = useCallback(async (userId: string, email: string, name: string) => {
 const { data } = await supabase.from('drivers_delivery').select('id, name, lat, lng, is_deleted, is_online, vehicle_type, preferences, avatar_url, merchant_id').eq('id', userId).maybeSingle();
 if (!data) {
 await supabase.from('drivers_delivery').upsert({
 id: userId, 
 name: name || 'Entregador Izi',
 email: email, 
 is_online: false, 
 is_active: false, 
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
 if (data.merchant_id) {
 localStorage.setItem('izi_driver_merchant_id', String(data.merchant_id));
 } else {
 localStorage.removeItem('izi_driver_merchant_id');
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

 // --- SINCRONIZAÇÁO E BOOTSTRAP ---
 useEffect(() => {
 let isMounted = true;

 const bootstrap = async () => {
 try {
 const { data: { session } } = await supabase.auth.getSession();
 if (session?.user && isMounted) {
 setDriverId(session.user.id);
 setIsAuthenticated(true);
 
 // Sincroniza dados do Auth para os estados locais para evitar campos vazios no refresh
 const userEmail = session.user.email || '';
 const name = session.user.user_metadata?.name || userEmail.split('@')[0] || 'Entregador';
 
 if (!authEmail) setAuthEmail(userEmail);
 if (!authName) setAuthName(name);

 await loadProfileAndEnforceOnboarding(session.user.id, userEmail, name);
 } else if (isMounted) {
 setIsAuthenticated(false);
 setIsProfileLoaded(true);
 }
 } catch (e) {
 console.error('[BOOTSTRAP] Erro:', e);
 if (isMounted) setIsProfileLoaded(true);
 } finally {
 if (isMounted) setAuthInitLoading(false);
 }
 };

 bootstrap();

 const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
 if (!isMounted) return;

 if (event === 'SIGNED_OUT') {
 setIsAuthenticated(false);
 setDriverId(null);
 localStorage.removeItem('izi_driver_id');
 return;
 }

 // Sincroniza sessão para SIGNED_IN, TOKEN_REFRESHED e USER_UPDATED
 if (session?.user) {
 setDriverId(session.user.id);
 setIsAuthenticated(true);
 
 const userEmail = session.user.email || '';
 const name = session.user.user_metadata?.name || userEmail.split('@')[0] || 'Entregador';
 
 if (!authEmail) setAuthEmail(userEmail);
 if (!authName) setAuthName(name);

 // Só recarrega perfil completo em SIGNED_IN (evita re-fetch desnecessário)
 if (event === 'SIGNED_IN') {
  await loadProfileAndEnforceOnboarding(session.user.id, userEmail, name);
 }
 }
 });

 // Timer de segurança para o Splash
 const safetyTimer = setTimeout(() => {
 if (isMounted) setShowSplash(false);
 }, 3500);

 return () => {
 isMounted = false;
 if (subscription) subscription.unsubscribe();
 clearTimeout(safetyTimer);
 };
 }, []);



 const fetchGlobalSettings = useCallback(async () => {
 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 try {
 const { data: { session } } = await supabase.auth.getSession();
 const token = session?.access_token || supabaseKey;
 const authHeaders = { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}` };
 
 // Busca cérebro global (Fonte da Verdade)
 const resGlobal = await fetch(`${supabaseUrl}/rest/v1/admin_settings_delivery?key=eq.global&select=*`, {
 headers: authHeaders
 });
 if (resGlobal.ok) {
 const dataGlobal = await resGlobal.json();
 if (dataGlobal && dataGlobal[0]?.value) setGlobalSettings(dataGlobal[0].value);
 }

 // Busca configurações locais (retrocompatibilidade)
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

 // Busca lojas exclusivas
 const resExclusive = await fetch(`${supabaseUrl}/rest/v1/admin_users?select=id&dispatch_priority=eq.exclusive`, {
 headers: authHeaders
 });
 if (resExclusive.ok) {
 const dataExclusive = await resExclusive.json();
 if (dataExclusive) {
 setExclusiveMerchantIds(dataExclusive.map((m: any) => m.id));
 }
 }
 } catch (e) {
 console.error('[SETTINGS] Erro ao buscar configurações:', e);
 }
 }, []);

 const [orders, setOrders] = useState<Order[]>([]);
 
 // Estatísticas de rejeição para lógica de loop inteligente (2x = cooldown 30s, 4x = bloqueio permanente)
 const [declinedStats, setDeclinedStats] = useState<Record<string, { count: number, lastDecline: number, isPermanent: boolean }>>({});

 // Sincronizar stats com localStorage
 useEffect(() => {
 localStorage.setItem('Izi_declined_stats', JSON.stringify(declinedStats));
 }, [declinedStats]);

 const [activeMission, setActiveMission] = useState<Order | null>(() => {
 const saved = localStorage.getItem('Izi_active_mission');
 return saved ? JSON.parse(saved) : null;
 });

 // Lista de TODAS as missões ativas do entregador (multi-missão)
 const [activeMissions, setActiveMissions] = useState<Order[]>([]);

 // Sons não são mais bloqueados por missão ativa — o entregador precisa ouvir novas chamadas sempre
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

 const handleUpdateProfile = async () => {
 console.log('[DEBUG] handleUpdateProfile iniciado. DriverId:', driverId);
 if (!driverId) {
 toastError('Erro: Sessão não encontrada.');
 return;
 }

 if (editProfileData.cpf && !validateCPF(editProfileData.cpf)) {
 toastError('O CPF informado é inválido.');
 return;
 }
 
 setIsSavingProfile(true);
 try {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 const token = await getSecureToken();
 
 console.log('[DEBUG] Enviando update para drivers_delivery:', {
 id: driverId,
 payload: {
 name: editProfileData.name,
 phone: editProfileData.phone,
 email: editProfileData.email,
 document_number: editProfileData.cpf,
 address: editProfileData.address
 }
 });

 const response = await iziFetch(`${sUrl}/rest/v1/drivers_delivery?id=eq.${driverId}`, {
 method: 'PATCH',
 headers: {
 'apikey': sKey,
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json',
 'Prefer': 'return=minimal'
 },
 body: JSON.stringify({
 name: editProfileData.name,
 phone: editProfileData.phone,
 email: editProfileData.email,
 document_number: editProfileData.cpf,
 address: editProfileData.address
 })
 });

 if (!response.ok) {
 const errText = await response.text();
 console.error('[DEBUG] Falha no update (fetch):', errText);
 throw new Error(`Erro na API (${response.status}): ${errText}`);
 }

 console.log('[DEBUG] Perfil atualizado com sucesso no banco!');
 
 // Atualiza estados locais e cache persistente
 setDriverName(editProfileData.name);
 setAuthName(editProfileData.name);
 setAuthPhone(editProfileData.phone);
 setAuthEmail(editProfileData.email);
 setAuthCpf(editProfileData.cpf);
 
 localStorage.setItem('izi_driver_name', editProfileData.name);
 localStorage.setItem('izi_driver_phone', editProfileData.phone);
 localStorage.setItem('izi_driver_email', editProfileData.email);
 localStorage.setItem('izi_driver_cpf', editProfileData.cpf);
 localStorage.setItem('izi_driver_address', editProfileData.address);
 
 showSystemPopup(
 'Perfil Atualizado!', 
 'Seus dados pessoais foram salvos com sucesso no sistema.',
 'success'
 );
 setShowPersonalDataModal(false);
 
 // Sincronização completa final
 await loadProfileAndEnforceOnboarding(driverId, editProfileData.email, editProfileData.name);

 } catch (err: any) {
 console.error('[DEBUG] Erro em handleUpdateProfile:', err);
 toastError('Erro ao salvar: ' + (err.message || 'Falha na conexão'));
 } finally {
 setIsSavingProfile(false);
 }
 };

 /**
 * @CRITICAL_LOGIC - BUSCA DIRETA (BYPASS) DE VAGAS DEDICADAS
 * @AUTHOR Antigravity (Senior AI Dev)
 * @WARNING NÁO ALTERAR PARA SUPABASE-JS LIBRARY. 
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

 // Busca principal de vagas ativas + Vagas Aceitas (Agenda)
 const today = new Date().toLocaleDateString('en-CA');
 
 // Pega IDs de vagas onde o entregador já foi aceito para garantir que elas apareçam mesmo se o lojista as "desativar" no mercado
 const cachedAppsRaw = localStorage.getItem(`izi_apps_${driverId}`);
 const acceptedSlotIds = cachedAppsRaw 
 ? JSON.parse(cachedAppsRaw)
 .filter((app: any) => app.status === 'accepted')
 .map((app: any) => app.slot_id)
 .filter(Boolean)
 : [];

 // Busca simplificada: Pega todas as ativas e as aceitas do cache
 const queryParams = `select=*&or=(is_active.eq.true${acceptedSlotIds.length > 0 ? `,id.in.(${acceptedSlotIds.join(',')})` : ''})&order=created_at.desc`;

 const response = await fetch(`${supabaseUrl}/rest/v1/dedicated_slots_delivery?${queryParams}`, {
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
 }, [driverId]);

 const [systemNotification, setSystemNotification] = useState<{ title: string; message: string; image_url?: string } | null>(null);
 const [view, setView] = useState<View>('dashboard');
 const [activeTab, setActiveTab] = useState<View>(() => {
 const saved = localStorage.getItem('izi_driver_active_tab') as View;
 // Abas que são overlays (fixos full-screen) ou dependem de estado dinâmico
 // NÁO devem ser restauradas no refresh para evitar telas vazias/sobrepostas
 const overlaytabs: View[] = ['profile', 'notifications', 'active_mission'];
 const validTabs: View[] = ['dashboard', 'history', 'earnings', 'missions', 'dedicated', 'scheduled'];
 if (overlaytabs.includes(saved)) return 'dashboard';
 return validTabs.includes(saved) ? saved : 'dashboard';
 });
 const [unreadNotifsCount, setUnreadNotifsCount] = useState(0);

 useEffect(() => {
 if (!driverId) return;

 const syncUnreadCount = async () => {
 try {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 const token = await getSecureToken();
 
 // Usando Prefer: count=exact e limit=0 para obter apenas o total sem dados
 const response = await fetch(`${sUrl}/rest/v1/notifications_delivery?user_id=eq.${driverId}&app_type=eq.driver&status=eq.pending&select=id`, {
 headers: {
 'apikey': sKey,
 'Authorization': `Bearer ${token}`,
 'Range': '0-0',
 'Prefer': 'count=exact'
 }
 });
 
 if (response.ok) {
 const contentRange = response.headers.get('Content-Range');
 if (contentRange) {
 const total = contentRange.split('/')[1];
 setUnreadNotifsCount(parseInt(total || '0'));
 } else {
 // Fallback se não vier Content-Range
 const data = await response.json();
 setUnreadNotifsCount(data.length);
 }
 }
 } catch (err) {
 console.error("[NOTIFS] Erro ao sincronizar contagem:", err);
 }
 };

 syncUnreadCount();

 const channel = supabase
 .channel(`unread-notifs-${driverId}`)
 .on('postgres_changes', {
 event: '*',
 schema: 'public',
 table: 'notifications_delivery',
 filter: `user_id=eq.${driverId}&app_type=eq.driver`
 }, () => {
 syncUnreadCount();
 })
 .subscribe();

 return () => {
 supabase.removeChannel(channel);
 };
 }, [driverId]);

 const activeTabRef = useRef(activeTab);
 useEffect(() => { 
 activeTabRef.current = activeTab; 
 }, [activeTab]);

 const [isOnline, setIsOnline] = useState(() => localStorage.getItem('izi_driver_online') === 'true');
 const isOnlineRef = useRef(localStorage.getItem('izi_driver_online') === 'true');
 useEffect(() => { isOnlineRef.current = isOnline; }, [isOnline]);

 // Vigilante de Som (Padrão Lojista - Alta Confiabilidade)
 const heardOrderIds = useRef<Set<string>>(new Set());
 const isFirstLoad = useRef(true);

 // Timer de now removido (performance: causava re-render completo a cada 10s sem utilidade)
 // visibleOrders simplificado: referência direta sem useMemo desnecessário
 const visibleOrders = orders;

 const announcedOrderIds = useRef<Set<string>>(new Set());

 const handleAcceptRef = useRef<any>(null);
 useEffect(() => {
 if (Capacitor.isNativePlatform()) {
 try {
 ForegroundService.addListener('notificationActionClicked', async (data) => {
 const { actionId, notification } = data;
 console.log('[DEBUG] Action Clicked:', actionId);

 if (actionId === 'accept_order' && notification.extra?.fullOrder) {
 if (handleAcceptRef.current) {
 await handleAcceptRef.current(notification.extra.fullOrder);
 }
 } else if (actionId === 'view_radar') {
 setActiveTab('dashboard');
 }
 });
 } catch (e) {}
 }
 }, []);



 useEffect(() => {
 if (!isAuthenticated || !isOnline) return;

 // Se a lista estiver vazia, desativamos o primeiro load e PARAMOS qualquer som residual
 if (visibleOrders.length === 0) {
 if (isFirstLoad.current) isFirstLoad.current = false;
 stopIziSounds(); 
 return;
 }

 // FIX BUG 5: Marcar primeiro carregamento como concluído quando há pedidos
 // Isso evita som/anúncio de pedidos já existentes ao entrar online
 if (isFirstLoad.current) {
 isFirstLoad.current = false;
 // Apenas silenciosamente marcar todos os pedidos atuais como já "vistos"
 visibleOrders.forEach(o => announcedOrderIds.current.add(o.realId || o.id));
 return;
 }

 // Detectar ordens que ainda não foram anunciadas (som + popup + foreground)
 const newOrders = visibleOrders.filter(o => !announcedOrderIds.current.has(o.realId || o.id));
 
 if (newOrders.length > 0) {
 const latest = newOrders[0];
 const id = latest.realId || latest.id;
 
 // Marcar como anunciado
 newOrders.forEach(o => announcedOrderIds.current.add(o.realId || o.id));

 // 1. Som (se permitido)
 if (localStorage.getItem('pref_sound') !== 'false') {
 playIziSound('driver', true);
 }

 // 2. Notificação Web Push (Apenas se disponível)
 const servicePreview = getServicePresentation(latest);
 if (!Capacitor.isNativePlatform() && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
 new Notification('🚀 Nova Missão Izi!', { 
 body: `${servicePreview.headline} ââ‚¬¢ ${servicePreview.pickupText || latest.pickup_address}`, 
 icon: 'https://cdn-icons-png.flaticon.com/512/3063/3063822.png' 
 });
 }

 // 3. Overlay nativo removido temporariamente a pedido do usuário
 // A permissão continua existindo, mas o popup nativo não será mais desenhado.
 }
 }, [visibleOrders, isAuthenticated, isOnline]);

 // Loop de reforço de áudio e vibração (Android Foreground)
 // Garante que o som continue tocando e vibrando enquanto houver missões visíveis
 useEffect(() => {
 const hasOrders = visibleOrders.length > 0 && !activeMission;
 
 if (!isAuthenticated || !isOnline || !hasOrders) {
 stopIziSounds();
 return;
 }

 // Disparo imediato se não houver som ativo
 if (localStorage.getItem('pref_sound') !== 'false') {
 playIziSound('driver', true);
 }

 const interval = setInterval(() => {
 if (localStorage.getItem('pref_sound') !== 'false') {
 playIziSound('driver', true);
 }
 if (localStorage.getItem('pref_vibration') !== 'false' && 'vibrate' in navigator) {
 navigator.vibrate([1000, 500, 1000]);
 }
 }, 8000);

 return () => {
 clearInterval(interval);
 // Se a lista ficou vazia, paramos o som no cleanup
 if (visibleOrders.length === 0) stopIziSounds();
 };
 }, [visibleOrders.length, isAuthenticated, isOnline, !!activeMission]);

 // Limpar IDs antigos do announcedOrderIds
 useEffect(() => {
 if (visibleOrders.length === 0) {
 announcedOrderIds.current.clear();
 return;
 }
 const currentIds = new Set(visibleOrders.map(o => o.realId || o.id));
 announcedOrderIds.current.forEach(id => {
 if (!currentIds.has(id)) announcedOrderIds.current.delete(id);
 });
 }, [visibleOrders]);

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
 const isLoggingOutRef = useRef(false); // Garante que syncMissionWithDB e restauração só ocorrem 1x por sessão
 const lastLocationUpdateRef = useRef<number>(0); // Throttle de update de GPS no banco
 const [isMenuOpen, setIsMenuOpen] = useState(false);
 const [isSOSActive, setIsSOSActive] = useState(false);
 const [isScanning, setIsScanning] = useState(false);
 const [isAccepting, setIsAccepting] = useState(false);
 const [isNetworkConnected, setIsNetworkConnected] = useState(window.navigator.onLine);

 useEffect(() => {
 const handleOnline = () => setIsNetworkConnected(true);
 const handleOffline = () => setIsNetworkConnected(false);
 window.addEventListener('online', handleOnline);
 window.addEventListener('offline', handleOffline);
 return () => {
 window.removeEventListener('online', handleOnline);
 window.removeEventListener('offline', handleOffline);
 };
 }, []);
 const [filter, setFilter] = useState<ServiceType | 'all'>('all');
 const [dedicatedSlots, setDedicatedSlots] = useState<any[]>([]);
 const [audioBlocked, setAudioBlocked] = useState(false);


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
 const [establishmentTypes, setEstablishmentTypes] = useState<any[]>([]);

 const serviceTypeLabel = useCallback((type: string) => {
 const t = (type || 'entrega').toLowerCase();
 const dynamicType = establishmentTypes.find((et: any) => et.value === t || et.id === t);
 if (dynamicType && dynamicType.name) return dynamicType.name;

 if (['restaurant', 'restaurante', 'food', 'bakery'].includes(t)) return 'Restaurante';
 if (['market', 'mercado', 'fruit'].includes(t)) return 'Mercado';
 if (['pharmacy', 'farmacia'].includes(t)) return 'Farmácia';
 if (['mototaxi', 'moto_taxi'].includes(t)) return 'Mototaxi';
 if (['car_ride'].includes(t)) return 'Corrida Carro';
 if (['motorista_particular'].includes(t)) return 'Motorista Particular';
 if (['van'].includes(t)) return 'Van';
 if (['utilitario'].includes(t)) return 'Utilitário';
 if (['frete', 'carreto', 'logistica'].includes(t)) return 'Frete';
 if (['beverages', 'bebidas'].includes(t)) return 'Bebidas';
 if (['petshop', 'pets'].includes(t)) return 'Petshop';
 return 'Entrega';
 }, [establishmentTypes]);
 const [calculatedDistance, setCalculatedDistance] = useState<string | null>(null);
 const [modalRoutePolyline, setModalRoutePolyline] = useState<string | null>(null);
 const [modalRouteInfo, setModalRouteInfo] = useState<{start: any, end: any} | null>(null);
 const [merchantCoords, setMerchantCoords] = useState<{lat: number, lng: number} | null>(null);
 const [stats, setStats] = useState({ 
 balance: 0, 
 today: 0, 
 weekly: 0, 
 monthly: 0,
 yearly: 0,
 totalEarnings: 0, 
 count: 0, 
 level: 1, 
 xp: 0, 
 nextXp: 100, 
 performance: [0, 0, 0, 0, 0, 0, 0],
 weeklyEarnings: [0, 0, 0, 0, 0, 0, 0],
 monthlyPerformance: Array(12).fill(0),
 growth: 0
 });
 const [earningsViewTab, setEarningsViewTab] = useState<'week' | 'month' | 'year'>('week');
 const [earningsHistory, setEarningsHistory] = useState<Order[]>([]);
 const [withdrawHistory, setWithdrawHistory] = useState<any[]>([]);
 const [isFinanceLoading, setIsFinanceLoading] = useState(false);
 const [isWithdrawLoading, setIsWithdrawLoading] = useState(false);
 const [isSavingPix, setIsSavingPix] = useState(false);
 const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
 const [showPersonalDataModal, setShowPersonalDataModal] = useState(false);
 const [showOnboarding, setShowOnboarding] = useState(false);
 const [isProfileNotFound, setIsProfileNotFound] = useState(false);
 const [editProfileData, setEditProfileData] = useState({
 name: localStorage.getItem('izi_driver_name') || '',
 phone: localStorage.getItem('izi_driver_phone') || '',
 email: localStorage.getItem('izi_driver_email') || '',
 vehicle_type: localStorage.getItem('izi_driver_vehicle') || '',
 plate: localStorage.getItem('izi_driver_plate') || '',
 cpf: localStorage.getItem('izi_driver_cpf') || '',
 address: localStorage.getItem('izi_driver_address') || '',
 vehicle_model: localStorage.getItem('izi_driver_vehicle_model') || ''
 });
 const [isSavingProfile, setIsSavingProfile] = useState(false);

 // O formulário de edição (editProfileData) é alimentado via loadProfileAndEnforceOnboarding
 // garantindo que apenas dados frescos do banco de dados sejam exibidos.

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
 // Estados para cadastro de novo veículo
 const [showNewVehicleForm, setShowNewVehicleForm] = useState(false);
 const [newVehicleType, setNewVehicleType] = useState('');
 const [newVehiclePlate, setNewVehiclePlate] = useState('');
 const [newVehicleModel, setNewVehicleModel] = useState('');
 const [newVehicleColor, setNewVehicleColor] = useState('');
 const [isSavingNewVehicle, setIsSavingNewVehicle] = useState(false);
 const [myVehicles, setMyVehicles] = useState<any[]>([]);
 const [myVehicleRequests, setMyVehicleRequests] = useState<any[]>([]);
 const [systemPopup, setSystemPopup] = useState<{
 title: string;
 message: string;
 type: 'success' | 'error' | 'info';
 onClose?: () => void;
 } | null>(null);
 const [showPreferences, setShowPreferences] = useState(false);
 const [showHelpModal, setShowHelpModal] = useState(false);
 const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);

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

 const driverVehicleRef = useRef(driverVehicle);
 useEffect(() => { driverVehicleRef.current = driverVehicle; }, [driverVehicle]);

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
 setIsProfileNotFound(false);

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

 // Remove chaves críticas de sessão e perfil
 const keysToRemove = [
 'izi_driver_authenticated',
 'izi_driver_uid',
 'izi_driver_name',
 'izi_driver_phone',
 'izi_driver_email',
 'izi_driver_vehicle',
 'izi_driver_plate',
 'izi_driver_cpf',
 'izi_driver_pix',
 'izi_driver_bank_name',
 'izi_driver_avatar',
 'izi_driver_active_tab',
 'Izi_active_mission',
 'Izi_declined_slots',
 'Izi_declined_timed',
 'izi_driver_online',
 'izi_driver_approved',
 'izi_driver_address',
 'izi_driver_vehicle_model',
 'izi_audio_unlocked',
 'last_izi_broadcast_driver'
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
 
 // Limpeza agressiva de qualquer chave remanescente do Supabase
 Object.keys(localStorage).forEach(key => {
 if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
 localStorage.removeItem(key);
 }
 });
 sessionStorage.clear();
 }, [driverId, supabaseUrl]);

 const handleScanQR = async () => {
 };

 const stopScan = async () => {
 setIsScanning(false);
 document.querySelector('body')?.classList.remove('barcode-scanner-active');
 };


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
 setCalculatedDistance(selectedOrder.distance || 'Distância indisponível');
 }
 } catch (err) {
 }
 };

 fetchDistanceAndRoute();
 }, [selectedOrder, showOrderModal, driverCoords]);

 // Limpar modal ao trocar de aba ou sair
 const prevTabRef = useRef<string>(activeTab);
 useEffect(() => {
 if (activeTab !== prevTabRef.current) {
 setShowOrderModal(false);
 setSelectedOrder(null);
 setSelectedScheduledOrder(null);
 
 // Só limpa o slot selecionado se NÁO estiver indo para a aba de vagas
 // Isso permite que o dashboard abra o detalhe da vaga
 if (activeTab !== 'dedicated') {
 setSelectedSlot(null);
 }
 }
 prevTabRef.current = activeTab;
 }, [activeTab]);

 const getPaymentLabel = (order: any) => {
 if (!order) return 'Não informado';
 if (order.payment_method === 'online') return 'Pagamento Online';
 
 // Mapeamento comum
 const map: Record<string, string> = {
 'dinheiro': 'Dinheiro (Local)',
 'pix': 'Pix',
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
 
 const openOverlaySettings = () => {
 if (Capacitor.isNativePlatform()) {
 try {
 if (typeof NativeOrderOverlay !== 'undefined') {
 NativeOrderOverlay.openOverlaySettings();
 } else {
 toast('Sobreposição não disponível nesta versão.', 'info');
 }
 } catch (e) {}
 } else {
 toast('Sobreposição disponível apenas no APK.', 'info');
 }
 };

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

 return;
 }
 try {
 // Verificamos permissões antes
 let permStatus = await PushNotifications.checkPermissions();
 if (permStatus.receive === 'prompt') {
 permStatus = await PushNotifications.requestPermissions();
 }

 if (permStatus.receive !== 'granted') {
 return;
 }

 if (Capacitor.getPlatform() === 'android') {
 await PushNotifications.createChannel({
 id: 'izi_notifications',
 name: 'Notificações IZI',
 description: 'Canal principal de notificações do IZI Delivery',
 sound: 'mission_call',
 importance: 5,
 visibility: 1,
 vibration: true
 });
 }

 await PushNotifications.register();

 // Listeners do registro nativo
 PushNotifications.addListener('registration', async (token) => {
 // Atualiza a coluna no supabase
 const { error } = await supabase.from('drivers_delivery').update({ push_token: token.value }).eq('id', driverId);
 });

 PushNotifications.addListener('registrationError', (error) => {
 });

 PushNotifications.addListener('pushNotificationReceived', async (notification) => {
 
 // Toca o som apenas uma vez (false para loop)
 playIziSound('driver', false);
 
 if (notification.data?.type === 'new_order' || notification.title?.toLowerCase().includes('chamada') || notification.body?.toLowerCase().includes('chamada')) {
 fetchOrders();
 }
 toastSuccess(`Nova Chamada: ${notification.title || ''}`);
 });

 PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
 
 // Se o usuário clicar, trazer para o dashboard ou aba ativa
 setActiveTab('dashboard');
 });

 } catch (err) {
 }
 };
 
 registerPush();

 return () => {
 if (Capacitor.isNativePlatform()) {
 PushNotifications.removeAllListeners();
 }
 };
 }, [isAuthenticated, driverId]);

 useEffect(() => {
 if (!isAuthenticated || !driverId) return;
 // Permite GPS se estiver ONLINE ou em uma MISSÁO ATIVA
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
 // ââ€â‚¬ââ€â‚¬ AMBIENTE NATIVO (APK Android/iOS) ââ€â‚¬ââ€â‚¬
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
 }
 return;
 }

 // ââ€â‚¬ââ€â‚¬ AMBIENTE WEB (browser) ââ€â‚¬ usa API nativa do browser ââ€â‚¬ââ€â‚¬
 if (!navigator.geolocation) {
 return;
 }

 navigator.geolocation.getCurrentPosition(
 (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
 (err) => {},
 { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
 );

 webWatchId = navigator.geolocation.watchPosition(
 (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
 (err) => {},
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



 // Função centralizada de carregamento de perfil — usada no boot, no resume e no auth change
 const loadProfileAndEnforceOnboarding = async (userId: string, userEmail: string, userName: string) => {
 if (!userId) return;

 try {
 const { data: profile, error: profileError } = await supabase
 .from('drivers_delivery')
 .select('name, phone, email, vehicle_type, vehicle_model, license_plate, document_number, bank_info, avatar_url, preferences, is_active, merchant_id')
 .eq('id', userId)
 .maybeSingle();

 if (profileError) {
 console.error('Erro ao carregar perfil:', profileError);
 // Mesmo com erro, tentamos inicializar o formulário com o que temos do Auth
 setEditProfileData(prev => ({
 ...prev,
 name: userName || prev.name,
 email: userEmail || prev.email
 }));
 return;
 }

 if (!profile) {
 setIsProfileNotFound(true);
 setIsApproved(false);
 setIsOnline(false);
 localStorage.setItem('izi_driver_online', 'false');
 setShowOnboarding(true);
 // Aguarda a criação do registro para garantir consistência
 await ensureDriverRecord(userId, userEmail, userName);
 
 // Se acabou de criar, inicializa o editProfileData com o que temos
 setEditProfileData({
 name: userName || '',
 phone: '',
 email: userEmail || '',
 vehicle_type: 'mototaxi',
 plate: '',
 cpf: ''
 });
 return;
 }

 // --- SINCRONIZAÇÁO AUTORITATIVA (DB -> STATE -> LOCALSTORAGE) ---
 
 // 1. Nome e Avatar
 const currentName = profile.name || userName || 'Entregador Izi';
 setDriverName(currentName);
 localStorage.setItem('izi_driver_name', currentName);
 
 if (profile.avatar_url) {
 setDriverAvatar(profile.avatar_url);
 localStorage.setItem('izi_driver_avatar', profile.avatar_url);
 }

 // 2. Veículo e Placa
 if (profile.vehicle_type) {
 setDriverVehicle(profile.vehicle_type);
 localStorage.setItem('izi_driver_vehicle', profile.vehicle_type);
 }
 if (profile.license_plate) {
 setDriverPlate(profile.license_plate);
 localStorage.setItem('izi_driver_plate', profile.license_plate);
 }

 // 3. Documentos e Contato
 if (profile.phone) localStorage.setItem('izi_driver_phone', profile.phone);
 if (profile.email) localStorage.setItem('izi_driver_email', profile.email);
 if (profile.document_number) localStorage.setItem('izi_driver_cpf', profile.document_number);
 if (profile.address) localStorage.setItem('izi_driver_address', profile.address);
 if (profile.vehicle_model) localStorage.setItem('izi_driver_vehicle_model', profile.vehicle_model);
 
 // 4. Dados Bancários e Vínculos
 if (profile.merchant_id) {
 localStorage.setItem('izi_driver_merchant_id', profile.merchant_id);
 } else {
 localStorage.removeItem('izi_driver_merchant_id');
 }

 // 5. Sincroniza o buffer de edição (editProfileData) para evitar dados incorretos nos modais
 setEditProfileData({
 name: profile.name || userName || '',
 phone: profile.phone || '',
 email: profile.email || userEmail || '',
 vehicle_type: profile.vehicle_type || 'mototaxi',
 plate: profile.license_plate || '',
 cpf: profile.document_number || '',
 address: profile.address || '',
 vehicle_model: profile.vehicle_model || ''
 });

 if (profile.bank_info?.pix_key) {
 setPixKey(profile.bank_info.pix_key);
 localStorage.setItem('izi_driver_pix', profile.bank_info.pix_key);
 }

 // 6. Preferências
 if (profile.preferences) {
 const p = profile.preferences as any;
 if (p.pref_sound !== undefined) {
 setPrefSoundEnabled(p.pref_sound);
 localStorage.setItem('pref_sound', p.pref_sound.toString());
 }
 if (p.pref_vibration !== undefined) {
 setPrefVibrationEnabled(p.pref_vibration);
 localStorage.setItem('pref_vibration', p.pref_vibration.toString());
 }
 if (p.pref_nav_app !== undefined) {
 setPrefNavApp(p.pref_nav_app);
 localStorage.setItem('pref_nav_app', p.pref_nav_app);
 }
 }

 // 7. Status de Aprovação e Vínculo
 const active = !!profile.is_active;
 setIsApproved(active);
 
 // Sincroniza Status Online: RESPEITA o LocalStorage primeiro para não derrubar o radar no refresh
 const localWantsOnline = localStorage.getItem('izi_driver_online') === 'true';
 
 // Se o motorista não for ativo, forçamos offline
 if (!active) {
 setIsOnline(false);
 isOnlineRef.current = false;
 localStorage.setItem('izi_driver_online', 'false');
 } else {
 // Se tem missão ativa em cache, FORÇAR online para não perder acesso
 const hasCachedMission = !!localStorage.getItem('Izi_active_mission');
 const shouldBeOnline = localWantsOnline || hasCachedMission;
 
 setIsOnline(shouldBeOnline);
 isOnlineRef.current = shouldBeOnline;
 localStorage.setItem('izi_driver_online', shouldBeOnline.toString());
 
 // Se forçamos online por causa de missão ativa, atualiza o DB também
 if (hasCachedMission && !localWantsOnline) {
 supabase.from('drivers_delivery').update({ is_online: true }).eq('id', userId).then(() => {
 console.log('[BOOT] Motorista forçado online por missão ativa em andamento.');
 });
 }
 }

 localStorage.setItem('izi_driver_approved', active.toString());

 refreshFinanceData();
 syncMissionWithDB();
 } catch (e: any) {
 } finally {
 setIsProfileLoaded(true);
 }
 };

 useEffect(() => {

 // Listener de visibilidade: quando o app volta do background (web/PWA/APK)
 const handleVisibilityChange = async () => {
 if (document.visibilityState !== 'visible') return;
 const { data: { session } } = await supabase.auth.getSession();
 const user = session?.user;
 if (!user) return;
 const name = user.user_metadata?.name || user.email?.split('@')[0] || 'Entregador';
 await loadProfileAndEnforceOnboarding(user.id, user.email || '', name);
 };
 document.addEventListener('visibilitychange', handleVisibilityChange);

 const authTimeout = setTimeout(() => setAuthInitLoading(false), 5000);

 return () => {
 clearTimeout(authTimeout);
 document.removeEventListener('visibilitychange', handleVisibilityChange);
 };
 }, []);

 // Salva a aba ativa para persistência no F5
 // Overlays não são salvos para evitar tela branca no reload
 useEffect(() => {
 const overlaytabs: View[] = ['profile', 'notifications', 'active_mission'];
 if (!overlaytabs.includes(activeTab)) {
 localStorage.setItem('izi_driver_active_tab', activeTab);
 }
 }, [activeTab]);

 // SINCRONIZAÇÁO MULTIDISPOSITIVO (Perfil, Status e Vínculo)
 useEffect(() => {
 if (!isAuthenticated || !driverId) return;

 const channel = supabase.channel(`driver_profile_${driverId}`)
 .on('postgres_changes', { 
 event: '*', 
 schema: 'public', 
 table: 'drivers_delivery',
 filter: `id=eq.${driverId}`
 }, (payload) => {
 if (payload.eventType === 'DELETE') {
 console.log('[REALTIME] Conta do entregador foi excluída!');
 handleLogout();
 return;
 }

 if (payload.eventType === 'UPDATE') {
 const updated = payload.new as any;
 
 // Sincroniza Status Online
 if (updated.is_online !== undefined) {
 setIsOnline(!!updated.is_online);
 localStorage.setItem('izi_driver_online', String(updated.is_online));
 }
 
 // Sincroniza Vínculo de Lojista
 if (updated.merchant_id !== undefined) {
 if (updated.merchant_id) {
 localStorage.setItem('izi_driver_merchant_id', String(updated.merchant_id));
 } else {
 localStorage.removeItem('izi_driver_merchant_id');
 }
 }
 }
 })
 .subscribe();

 return () => { supabase.removeChannel(channel); };
 }, [isAuthenticated, driverId]);

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
 event: '*', 
 schema: 'public', 
 table: 'broadcast_notifications' 
 }, (payload) => {
 const notif = payload.new as any;
 if (!notif) return;

 // Só dispara se for um novo insert 'sent' ou um update que mudou para 'sent'
 const isSent = notif.status === 'sent';
 const isNewSent = payload.eventType === 'INSERT' && isSent;
 const isUpdateSent = payload.eventType === 'UPDATE' && isSent && (payload.old as any)?.status !== 'sent';
 const isRelevant = notif.target_type === 'all' || notif.target_type === 'drivers';

 if ((isNewSent || isUpdateSent) && isRelevant) {
 
 // 1. Som de alerta para qualquer tipo de broadcast
 playIziSound('success');

 // 2. Web Push Notification (apenas web)
 if (!Capacitor.isNativePlatform() && 'Notification' in window && Notification.permission === 'granted') {
 new Notification(notif.title || 'Izi Delivery', { 
 body: notif.message || '', 
 icon: notif.image_url || '/Favicon.png.png' 
 });
 }

 // 3. System Toast (banner flutuante para tipo 'push' puro — não popup fullscreen)
 if (notif.type === 'push') {
 setSystemNotification({
 title: notif.title,
 message: notif.message,
 image_url: notif.image_url
 });
 setTimeout(() => setSystemNotification(null), 8000);
 }

 // 4. Popup Premium Fullscreen (apenas tipo 'popup' ou 'both')
 if (notif.type === 'popup' || notif.type === 'both') {
 setActiveBroadcast(null);
 setTimeout(() => {
 setActiveBroadcast(notif);
 }, 100);
 }
 }
 })
 .subscribe();

 return () => {
 supabase.removeChannel(broadcastSub);
 };
 }, [driverId]);

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
 if (!authCpf.trim()) { setAuthError('Informe seu CPF.'); setAuthLoading(false); return; }
 if (!validateCPF(authCpf)) { setAuthError('O CPF informado é inválido.'); setAuthLoading(false); return; }
 if (authPassword.length < 6) { setAuthError('A senha deve ter no mínimo 6 caracteres.'); setAuthLoading(false); return; }
 try {
 const { data, error } = await supabase.auth.signUp({
 email: authEmail,
 password: authPassword,
 options: {
 data: {
 name: authName.trim(),
 phone: authPhone.trim(),
 role: 'driver',
 user_type: 'driver'
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
 document_number: authCpf.trim(),
 rating: 5.0, 
 is_active: false 
 });
 setDriverName(authName.trim());
 setDriverVehicle(authVehicle);
 }
 } catch (e: any) {
 setAuthError(e.message?.includes('already registered') ? 'Este email já está cadastrado. Faça login.' : e.message);
 } finally { setAuthLoading(false); }
 };





 // =====================================================================
 // RESTAURAÇÁO DE STATUS ONLINE: useEffect EXCLUSIVO e AUTORITATIVO
 // =====================================================================
 useEffect(() => {
 if (!driverId || !isAuthenticated || !isProfileLoaded) return;

 // SE O PERFIL ESTÁ EXPLICITAMENTE DESATIVADO, FORÇA OFFLINE.
 if (isApproved === false) {
 setIsOnline(false);
 localStorage.setItem('izi_driver_online', 'false');
 stopIziSounds();
 return;
 }

 const localWantsOnline = localStorage.getItem('izi_driver_online') === 'true';

 // Setar estado local imediatamente (sem depender do banco)
 setIsOnline(localWantsOnline);

 // Restaurar Foreground Service se estiver online
 if (Capacitor.getPlatform() === 'android' && localWantsOnline) {
 try {
 if (typeof ForegroundService !== 'undefined') {
 ForegroundService.startForegroundService({
 id: 1001,
 title: "Izi Entregador: Online âÅ“â€¦",
 body: "Buscando novas chamadas em tempo real...",
 importance: 5,
 icon: 'notification_icon'
 }).catch(e => {});
 }
 } catch (e) {}
 }

 if (localWantsOnline) {
 // Sincronizar banco em background para garantir consistência
 supabase.from('drivers_delivery')
 .update({ is_online: true, last_seen_at: new Date().toISOString() })
 .eq('id', driverId);
 }
 }, [driverId, isAuthenticated, isProfileLoaded]);

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
 
 if (updated.is_active !== undefined) {
 setIsApproved(!!updated.is_active);
 if (!updated.is_active) setIsOnline(false);
 }
 
 refreshFinanceData();
 })
 .subscribe();

 return () => { supabase.removeChannel(channel); };
 }, [driverId, isAuthenticated]);

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
 
 // Bloqueio: Não permite ficar offline se houver missão ativa
 if (!nextState && (activeMission || localStorage.getItem('Izi_active_mission'))) {
 toastError("Você não pode ficar offline enquanto tiver uma missão em andamento!");
 return;
 }

 if (nextState && isApproved === false && isProfileLoaded) {
 setShowPendingApprovalModal(true);
 return;
 }

 localStorage.setItem('izi_driver_online', nextState.toString());
 setIsOnline(nextState);

 // Gerenciar Foreground Service com segurança máxima
 if (Capacitor.isNativePlatform()) {
 try {
 if (typeof ForegroundService !== 'undefined') {
 if (nextState && !activeMission) {
 await ForegroundService.startForegroundService({
 id: 1001,
 title: "Izi Entregador: Online âÅ“â€¦",
 body: "Buscando novas chamadas em tempo real...",
 importance: 5,
 icon: 'notification_icon'
 });
 } else {
 await ForegroundService.stopForegroundService();
 }
 }
 } catch (fsErr) {
 }
 }

 if (!nextState) setOrders([]);
 
 if (driverId) {
 try {
 const updatePayload = nextState 
 ? { is_online: true, last_seen_at: new Date().toISOString() }
 : { is_online: false };
 await supabase.from('drivers_delivery').update(updatePayload).eq('id', driverId);
 
 // Se ficou online, força um sync imediato para recuperar missões
 if (nextState) {
 syncMissionWithDB();
 }
 } catch (e: any) {
 }
 }
 };


 // Remote Eject Listener (Kill Switch)
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
 if (payload.new && payload.new.is_active === false) {
 handleLogout();
 }
 })
 .subscribe();

 return () => { supabase.removeChannel(channel); };
 }, [driverId, isAuthenticated]);



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
 await fetchDedicatedSlotsRealtimeRef.current();
 playIziSound('driver', false);
 toastSuccess('Nova vaga dedicada disponível!');
 })
 .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dedicated_slots_delivery' }, async (payload) => {
 await fetchDedicatedSlotsRealtimeRef.current();
 })
 .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'dedicated_slots_delivery' }, (payload) => {
 const deletedId = (payload.old as any).id;
 setDedicatedSlots(prev => prev.filter((s: any) => s.id !== deletedId));
 stopIziSounds();
 })
 .on('postgres_changes', { event: '*', schema: 'public', table: 'slot_applications' }, (payload) => {
 fetchDeep();
 refreshMyApplicationsRef.current();

 // Notificação de aprovação
 const data = payload.new as any;
 if (payload.eventType === 'UPDATE' && data.status === 'accepted' && String(data.driver_id) === String(driverId)) {
 playIziSound('success');
 toastSuccess('Parabéns! Sua vaga foi confirmada!');
 }
 })
 .subscribe();

 return () => { supabase.removeChannel(slotsChannel); };
 }, [isAuthenticated, driverId]);
 
 // Auxiliar centralizado para obter token de auth seguro (com refresh se necessário)
 const getSecureToken = useCallback(async () => {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 try {
 const sessionPromise = supabase.auth.getSession();
 const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 8000));
 const { data: { session }, error: sessionErr } = await Promise.race([sessionPromise, timeoutPromise]) as any;
 
 if (sessionErr) {
 if (sessionErr.message.includes("Refresh Token Not Found") || sessionErr.message.includes("invalid_refresh_token")) {
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
 const loadVehicleRequests = useCallback(async (dId: string) => {
 if (!dId) return;
 try {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const token = await getSecureToken();
 const response = await fetch(`${sUrl}/rest/v1/driver_vehicle_requests?driver_id=eq.${dId}&order=created_at.desc`, {
 headers: {
 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
 'Authorization': `Bearer ${token}`
 }
 });
 if (response.ok) {
 const data = await response.json();
 setMyVehicleRequests(data);
 }
 } catch (e) {
 console.error('[VEHICLE_REQ] Erro ao carregar:', e);
 }
 }, [getSecureToken]);

 const showSystemPopup = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'success', onClose?: () => void) => {
 setSystemPopup({ title, message, type, onClose });
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
 if (isAuthenticated) {
 await supabase.auth.refreshSession();
 }
 throw new Error('Sessão expirada. Por favor, reinicie o aplicativo.');
 }

 if (!res.ok) {
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

 if (status === 'accepted') {
 playIziSound('driver', false);
 
 const slotId = updatedApp.slot_id;
 const targetSlot = dedicatedSlots.find(s => String(s.id) === String(slotId));
 
 setApprovedSlotData(targetSlot || { 
 id: slotId, 
 title: 'Vaga Dedicada',
 fee_per_day: '80',
 admin_users: { store_name: 'Parceiro Izi' }
 });
 
 setShowApprovedSlotModal(true);

 toastSuccess("🚀 VAGA CONFIRMADA! Clique para ver os detalhes.");
 }
 
 // Sincroniza estados após qualquer atualização minha
 refreshMyApplications();
 fetchFromDB('dedicated_slots_delivery', 'select=*,admin_users(store_name,store_logo,store_address,store_phone)&is_active=eq.true&order=created_at.desc');
 }
 )
 .subscribe();

 return () => {

 supabase.removeChannel(channel);
 };
 }, [isAuthenticated, driverId, fetchFromDB, dedicatedSlots, refreshMyApplications]);



 useEffect(() => {
 if (!isAuthenticated || !driverId) return;
 
 // Tenta carregar do cache primeiro para evitar flicker da trava sumindo
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
 }
 };

 fetchScheduled();

 // Realtime para Agendamentos
 const scheduledChannel = supabase.channel('scheduled_orders_realtime')
 .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders_delivery' }, (payload) => {
 if (!isOnlineRef.current) return;
 const o = payload.new as any;
 if (o.scheduled_at) {
 if (isOnlineRef.current) playIziSound('driver', false); // Som unico para Agendamento
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

 // Configuração de Push Nativo (Android)
 if (Capacitor.isNativePlatform()) {
 PushNotifications.addListener('pushNotificationReceived', (notification) => {
 // No Android, isso garante que o banner apareça se o canal estiver configurado
 });

 PushNotifications.createChannel({
 id: 'izi_notifications',
 name: 'Notificações IZI',
 description: 'Canal principal de notificações do IZI Delivery',
 importance: 5, // Max importance para banner
 visibility: 1,
 sound: 'mission_call',
 vibration: true
 }).catch(err => {});
 }

 return () => { 
 supabase.removeChannel(scheduledChannel); 
 };
 }, [isAuthenticated, fetchFromDB]);

 const handleDeclineOrder = (orderId: string) => {
 // Agora unificamos com o handleDecline que tem cooldown e inteligência
 const orderToDecline = orders.find(o => (o.realId || o.id) === orderId);
 if (orderToDecline) {
 handleDecline(orderToDecline);
 } else {
 // Fallback caso o objeto do pedido não seja encontrado (id puro)
 setOrders(prev => prev.filter(o => (o.realId || o.id) !== orderId));
 stopIziSounds();
 }
 };

 const fetchOrders = useCallback(async () => {
 if (!driverId || !isAuthenticated) {
 setOrders([]);
 return;
 }
 if (!isOnlineRef.current) {
 setOrders([]);
 return;
 }
 setIsSyncing(true);
 try {
 
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 const token = await getSecureToken();

 // Usando Promise.all com Fetch Nativo para máxima performance e zero travamento
 const [ordersRes, exclusiveRes] = await Promise.all([
 iziFetch(`${sUrl}/rest/v1/orders_delivery?status=not.in.(concluido,cancelado,finalizado,entregue)&select=*&order=created_at.desc&limit=50`, {
 headers: { 'apikey': sKey, 'Authorization': `Bearer ${token}` }
 }),
 iziFetch(`${sUrl}/rest/v1/admin_users?dispatch_priority=eq.exclusive&select=id`, {
 headers: { 'apikey': sKey, 'Authorization': `Bearer ${token}` }
 })
 ]);

 const data = await ordersRes.json();
 const exclusiveData = await exclusiveRes.json();
 const exclusiveIds = exclusiveData.map((m: any) => m.id);
 
 exclusiveMerchantIdsRef.current = exclusiveIds;
 setExclusiveMerchantIds(exclusiveIds);
 
 const now = Date.now();
 const currentMission = activeMissionRef.current;

 const myAssignment = data.find((o: any) => 
 o.driver_id && String(o.driver_id).trim() === String(driverId).trim() &&
 !['concluido', 'cancelado', 'finalizado', 'entregue'].includes(String(o.status || '').toLowerCase())
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
 localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
 setActiveMission(mission);
 if (activeTab === 'dashboard') setActiveTab('active_mission');
 }
 const available = (data || []).filter((o: any) => {
 const rawStatus = String(o.status || '').toLowerCase();
 const isClosed = ['concluido', 'cancelado', 'finalizado', 'entregue'].includes(rawStatus);
 if (isClosed) return false;

 const isFinancial = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'].includes(o.service_type);
 if (isFinancial) return false;

 // Se o pedido já está confirmado/aceito, ele não está mais disponível no radar global
 const isAlreadyTaken = ['confirmado', 'confirmed', 'accepted', 'a_caminho_coleta', 'picking_up', 'delivering'].includes(rawStatus);
 if (isAlreadyTaken) return false;

 // Se for agendado, não entra no radar normal
 if (rawStatus === 'agendado') return false;

 const hasDriver = o.driver_id && String(o.driver_id).trim() !== '' && String(o.driver_id).trim() !== String(driverId).trim();
 if (hasDriver) return false;

 // FILTRO DE COMPATIBILIDADE DE VEÍCULO
 // Evita que motos vejam fretes, etc.
 const myV = driverVehicle?.toLowerCase() || 'moto';
 const allowedForVehicle = VEHICLE_COMPATIBILITY[myV] || [];
 const orderType = normalizeServiceType(o.service_type);
 
 if (!allowedForVehicle.includes(orderType)) {
 // Se não estiver explicitamente no mapa, permitimos apenas se for entrega básica (restaurant, etc)
 // Mas o mapa acima já cobre as entregas básicas para todos.
 return false;
 }

 return true;
 });


 if (!available) {
 return;
 }

 const newAvailable = (available || []).map((o: any) => {
 try {
 const safeId = String(o?.id || '');
 if (!safeId) return null;
 return {
 ...o,
 id: safeId.slice(0, 8).toUpperCase(), 
 realId: safeId, 
 type: o.service_type || 'delivery', 
 origin: o.pickup_address || o.origin || '', 
 destination: o.delivery_address || o.destination || '', 
 price: Number(o.total_price || 0),
 pickup_lat: Number(o.pickup_lat || 0),
 pickup_lng: Number(o.pickup_lng || 0),
 delivery_lat: Number(o.delivery_lat || 0),
 delivery_lng: Number(o.delivery_lng || 0),
 store_name: String(o.merchant_name || o.store_name || 'Loja Parceira'),
 customer: 'Cliente Izi'
 };
 } catch (e) {
 return null;
 }
 }).filter(Boolean);

 setOrders(prev => {
 return newAvailable;
 });
 } catch (err) {
 } finally {
 setIsSyncing(false);
 }
 }, [driverId]);

 const fetchOrdersRef = useRef(fetchOrders);
 useEffect(() => { fetchOrdersRef.current = fetchOrders; }, [fetchOrders]);

 // Fetch inicial único — o canal Realtime (linha ~2901) já cuida de atualizações contínuas.
 // O polling de 5s foi removido para economizar ~12 re-renders/min e bateria.
 useEffect(() => {
 if (!isAuthenticated || !driverId) return;
 fetchOrdersRef.current();
 }, [isAuthenticated, driverId]);


 
 

 useEffect(() => {
 if (!isAuthenticated || !driverId) return;

 const channel = supabase.channel('realtime_orders')
 .on('postgres_changes', { event: '*', schema: 'public', table: 'orders_delivery' }, (payload) => {
 if (!isOnlineRef.current) return;
 
 const eventType = payload.eventType;
 if (eventType === 'DELETE') {
 setOrders(prev => {
 const newOrders = prev.filter(x => x.realId !== payload.old.id);
 if (newOrders.length === 0) {
 stopIziSounds();
 if (Capacitor.isNativePlatform()) {
 try { ForegroundService.stopForegroundService(); } catch (e) {}
 }
 }
 return newOrders;
 });
 return;
 }

 const o = payload.new as any;
 if (!o || !o.id) return;

 const dId = String(driverIdRef.current || '').trim();
 const currentMission = activeMissionRef.current;
 const isMyOrder = o.driver_id && String(o.driver_id).trim() === dId && dId !== '';

 // 1. GESTÁO DA MISSÁO ATIVA DESTE MOTORISTA
 if (isMyOrder) {
 const status = String(o.status || '').toLowerCase().trim();
 const terminalStatuses = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered', 'rejected', 'recusado'];
 
 if (terminalStatuses.includes(status)) {
 // Limpa a missão selecionada se for esta
 if (currentMission && (currentMission.realId === o.id || currentMission.id === o.id)) {
 setActiveMission(null);
 localStorage.removeItem('Izi_active_mission');
 if (activeTabRef.current === 'active_mission') setActiveTab('dashboard');
 }
 // Remove do array de missões múltiplas
 setActiveMissions(prev => prev.filter(m => m.realId !== o.id && m.id !== o.id));
 return;
 }

 const wasPreparing = currentMission?.preparation_status !== 'pronto';
 const isNowReady = o.preparation_status === 'pronto';
 if (wasPreparing && isNowReady) {
 playIziSound('driver', true);
 toastSuccess('â€â€ O Pedido está PRONTO para coleta!');
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
 localStorage.setItem('Izi_active_mission', JSON.stringify(mission));

 // Atualizar a missão na lista multi-missão
 setActiveMissions(prev => {
 const exists = prev.find(m => m.realId === o.id || m.id === o.id);
 if (exists) return prev.map(m => (m.realId === o.id || m.id === o.id) ? mission : m);
 return [...prev, mission];
 });

 // Só atualiza activeMission se o usuário já estiver vendo ESTA missão específica
 if (currentMission && (currentMission.realId === o.id || currentMission.id === o.id)) {
 setActiveMission(mission);
 }
 return;
 }

 // 2. GESTÁO DO RADAR (Pedidos disponíveis)
 // Removemos 'confirmado' e 'accepted' dos actionableStatuses pois eles indicam que alguém já pegou
  const actionableStatuses = ['novo', 'pendente', 'pending', 'paid', 'pago', 'preparando', 'pronto', 'waiting_driver', 'waiting_merchant'];
  let isAcceptable = o.status && actionableStatuses.includes(o.status);

  if (isAcceptable) {
    const rawStatus = String(o.status || '').toLowerCase();
    const isWaitingMerchant = ['waiting_merchant', 'novo', 'paid', 'pago', 'pendente_pagamento', 'pendente', 'pending'].includes(rawStatus);
    if (isWaitingMerchant) {
      const isStoreDelivery = ['restaurant', 'market', 'pharmacy', 'water_gas', 'petshop'].includes(o.service_type) || o.merchant_id;
      if (isStoreDelivery) isAcceptable = false;
    }
  }

 if (!isAcceptable || (o.driver_id && String(o.driver_id).trim() !== dId)) {
 setOrders(prev => {
 const newOrders = prev.filter(x => x.realId !== o.id);
 if (newOrders.length === 0) {
 stopIziSounds();
 if (Capacitor.isNativePlatform()) {
 try { ForegroundService.stopForegroundService(); } catch (e) {}
 }
 }
 return newOrders;
 });
 return;
 }

 // --- REGRA DE EXCLUSIVIDADE (Realtime) ---
 // Pedido de lojista EXCLUSIVO ââ€ â€™ só o entregador vinculado a esse lojista pode ver
 // Pedido de lojista GLOBAL ââ€ â€™ TODOS os entregadores podem ver
 const myMerchantId = localStorage.getItem('izi_driver_merchant_id');
 const orderMerchantId = o.merchant_id ? String(o.merchant_id) : null;
 const isOrderFromExclusiveMerchant = orderMerchantId && (exclusiveMerchantIdsRef.current || []).includes(orderMerchantId);

 if (isOrderFromExclusiveMerchant) {
 // Pedido exclusivo: bloqueia quem não é o entregador deste lojista
 if (!myMerchantId || myMerchantId !== orderMerchantId) {
 setOrders(prev => prev.filter(x => x.realId !== o.id));
 return;
 }
 }

 const declinedMap: Record<string, number> = JSON.parse(localStorage.getItem('Izi_declined_timed') || '{}');
 if (Date.now() - (declinedMap[o.id] || 0) < 1800000) return;
 
 const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
 if (financialTypes.includes(o.service_type)) return;

 // Som de novo pedido
 if (localStorage.getItem('pref_sound') !== 'false') {
 playIziSound('driver', true);
 }

 const mappedOrder = (() => {
 try {
 const safeId = String(o?.id || '');
 if (!safeId) return null;
 return {
 ...o,
 id: safeId.slice(0, 8).toUpperCase(), 
 realId: safeId, 
 type: o.service_type || 'delivery', 
 origin: o.pickup_address, 
 destination: o.delivery_address, 
 price: o.total_price || 0, 
 customer: o.user_name || 'Cliente Izi',
 store_name: o.store_name || 'Parceiro Izi'
 };
 } catch (e) { return null; }
 })();

 if (!mappedOrder) return;

 // PLANO 2 e 4: Alerta Agressivo no Foreground Service
 if (Capacitor.isNativePlatform()) {
 try {
 ForegroundService.startForegroundService({
 id: 1001,
 title: "🚀 NOVA ENTREGA DISPONÍVEL!",
 body: `R$ ${Number(o.total_price || 0).toFixed(2)} â€¢ ${o.pickup_address?.split(',')[0]}`,
 importance: 5, // Importância máxima para aparecer no topo (Heads-up)
 icon: 'notification_icon',
 buttons: [
 { id: 'accept_order', title: 'âœ… ACEITAR AGORA' },
 { id: 'view_radar', title: 'ðŸ‘€ VER DETALHES' }
 ],
 extra: {
 orderId: o.id,
 fullOrder: mappedOrder
 }
 });
 } catch (fsErr) {}
 }

 setOrders(prev => {
 const exists = prev.find(x => x.realId === o.id);
 if (exists) {
 return prev.map(x => x.realId === o.id ? mappedOrder : x);
 }
 return [mappedOrder, ...prev].slice(0, 20);
 });
 })
 .subscribe();

 return () => { supabase.removeChannel(channel); };
 }, [isAuthenticated, driverId, getServicePresentation]);

 // Startup / Session Recovery: Buscar missão ativa no banco se o driverId estiver presente
 useEffect(() => {
 const recoverActiveMission = async () => {
 if (!driverId || activeMission) return;
 
 const { data, error } = await supabase
 .from('orders_delivery')
 .select('*')
 .eq('driver_id', driverId)
 .not('status', 'in', '(concluido,cancelado,finalizado,entregue,delivered)')
 .maybeSingle();

 if (data && !error) {
 const mission = { 
 ...data, 
 realId: data.id, 
 type: data.service_type, 
 origin: data.pickup_address, 
 destination: data.delivery_address, 
 price: data.total_price,
 customer: data.user_name || 'Cliente Izi'
 };
 localStorage.setItem('Izi_active_mission', JSON.stringify(mission));
 }
 };
 recoverActiveMission();
 }, [driverId, isAuthenticated]);

 // Carregar solicitações de veículo do entregador
 useEffect(() => {
 if (!driverId || !isAuthenticated) return;
 loadVehicleRequests(driverId);
 }, [driverId, isAuthenticated, loadVehicleRequests]);

 // Gancho para buscar coordenadas reais do lojista se os campos pickup_lat/lng estiverem vazios no pedido
 useEffect(() => {
 const fetchMerchantCoords = async () => {
 if (activeMission?.merchant_id) {
 try {
 const { data } = await supabase
 .from('admin_users')
 .select('latitude, longitude')
 .eq('id', activeMission.merchant_id)
 .maybeSingle();
 if (data?.latitude && data?.longitude) {
 setMerchantCoords({ lat: Number(data.latitude), lng: Number(data.longitude) });
 } else {
 setMerchantCoords(null);
 }
 } catch (e) {
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
 if (['restaurant', 'package', 'market', 'pharmacy', 'beverages', 'motoboy', 'entrega_avulsa'].includes(type)) return 'motoboy';
 if (['car_ride', 'mototaxi'].includes(type)) return 'car_ride';
 if (['frete', 'van', 'utilitario'].includes(type)) return 'frete';
 if (type === 'motorista_particular') return 'motorista_particular';
 return 'all';
 };

 const filteredOrders = useMemo(() => {
 if (filter === 'all') return visibleOrders;
 return visibleOrders.filter((o: any) => getCategory(o.type) === filter);
 }, [filter, visibleOrders, normalizeServiceType]);



 const handleAccept = async (order: Order) => {
 if (isAccepting) return;
 
 const targetId = order.realId || order.id;
 if (!targetId) return;

 // 1. ATUALIZAÇÁO OTIMISTA: Feedback Imediato
 const isScheduled = !!order.scheduled_at;
 const newStatus = isScheduled ? 'confirmado' : 'a_caminho_coleta';
 const optimisticMission = { 
 ...order, 
 realId: targetId, 
 status: newStatus,
 driver_id: driverId,
 updated_at: new Date().toISOString()
 };

 const previousOrders = [...orders];
 const previousActiveMission = activeMission;
 const previousActiveMissions = [...activeMissions];
 const previousActiveTab = activeTab;

 if (!isScheduled) {
 setActiveMission(optimisticMission);
 // Atualizar também a lista de múltiplas missões
 setActiveMissions(prev => {
 const exists = prev.find(m => (m.realId || m.id) === targetId);
 if (exists) return prev.map(m => (m.realId || m.id) === targetId ? optimisticMission : m);
 return [...prev, optimisticMission];
 });
 localStorage.setItem('Izi_active_mission', JSON.stringify(optimisticMission));
 setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
 setActiveTab('active_mission');
 stopIziSounds();
 playIziSound('success');
 toastSuccess('Corrida aceita! Siga para a coleta.');
 } else {
 setScheduledOrders(prev => prev.map(s => s.id === targetId || s.realId === targetId ? { ...s, ...optimisticMission } : s));
 toastSuccess('Agendamento confirmado!');
 }

 setIsAccepting(true);
 
  try {
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  let token = await getSecureToken();

  const authHeaders = { 
  'apikey': supabaseKey, 
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
  };
  
  // RPC atômica — SELECT FOR UPDATE SKIP LOCKED impede race condition
  const rpcRes = await iziFetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/claim_order`, {
  method: 'POST',
  headers: authHeaders,
  body: JSON.stringify({
  p_order_id: targetId,
  p_driver_id: driverId,
  p_new_status: newStatus
  })
  });

  if (!rpcRes.ok) throw new Error('Falha na comunicação com o servidor.');

  const result = await rpcRes.json();
  
  if (!result?.success) {
  stopIziSounds();
  const errorMsg = result?.error === 'ALREADY_CLAIMED'
  ? 'Este pedido já foi aceito por outro entregador!'
  : result?.error === 'ORDER_LOCKED'
  ? 'Pedido em processamento. Tente outro.'
  : result?.message || 'Pedido indisponível.';
  toastError(errorMsg);
  setOrders(previousOrders);
  setActiveMission(previousActiveMission);
  setActiveMissions(previousActiveMissions);
  setActiveTab(previousActiveTab);
  if (!previousActiveMission) localStorage.removeItem('Izi_active_mission');
  if (result?.error === 'ALREADY_CLAIMED') {
  setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
  }
  setIsAccepting(false);
  return;
  }

  const realOrder = result.order;
  const finalMission = { ...optimisticMission, ...realOrder };
  
  if (!isScheduled) {
  setActiveMission(finalMission);
  localStorage.setItem('Izi_active_mission', JSON.stringify(finalMission));
  } else {
  setScheduledOrders(prev => prev.map(s => s.id === targetId || s.realId === targetId ? { ...s, ...finalMission } : s));
  }

 } catch (e: any) {
 toastError('Erro ao confirmar: ' + e.message);
 setOrders(previousOrders);
 setActiveMission(previousActiveMission);
 setActiveMissions(previousActiveMissions);
 setActiveTab(previousActiveTab);
 } finally {
 setIsAccepting(false);
 }
 };
 
 // Atualiza a ref para o overlay nativo sempre ter a versão mais recente
 useEffect(() => {
 handleAcceptRef.current = handleAccept;
 }, [handleAccept]);

 const handleDecline = (order: Order) => {
 const targetId = order.realId || order.id;
 
 // Parar o som imediatamente ao recusar
 stopIziSounds();

 // Lógica de loop inteligente: 2 rejeições = 30s cooldown, 4 rejeições = permanente
 setDeclinedStats(prev => {
 const current = prev[targetId] || { count: 0, lastDecline: 0, isPermanent: false };
 const newCount = current.count + 1;
 
 const newStats = {
 count: newCount,
 lastDecline: Date.now(),
 isPermanent: newCount >= 4
 };

 if (newCount === 2) {
 heardOrderIds.current.delete(targetId);
 }

 return { ...prev, [targetId]: newStats };
 });
 
 // Remove da lista atual para feedback visual imediato
 setOrders(prev => prev.filter(o => (o.realId || o.id) !== targetId));
 
 toastSuccess(declinedStats[targetId]?.count === 1 ? 'Pedido silenciado por 30s.' : 'Chamada descartada com sucesso.');
 };

 const refreshFinanceData = useCallback(async () => {
 if (!driverId) return;
 setIsFinanceLoading(true);
 try {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const sKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 
 const token = await getSecureToken();

 const headers = { 'apikey': sKey, 'Authorization': `Bearer ${token}` };
 const apiRequest = (path: string, method = 'GET', body?: any) => 
 iziFetch(`${sUrl}/rest/v1/${path}`, { 
 method, 
 headers: { ...headers, ...(body ? { 'Content-Type': 'application/json' } : {}) },
 body: body ? JSON.stringify(body) : undefined,
 timeoutMs: 10000 
 });

 // 1. Coleta de dados em paralelo para maior performance
 const [txsRes, drvRes, ordsRes, setsRes, estRes] = await Promise.all([
 apiRequest(`wallet_transactions_delivery?user_id=eq.${driverId}&order=created_at.desc`),
 apiRequest(`drivers_delivery?id=eq.${driverId}&select=bank_info,name`),
 apiRequest(`orders_delivery?driver_id=eq.${driverId}&status=in.(concluido,entregue,finalizado,delivered)&order=updated_at.desc`),
 apiRequest(`app_settings_delivery?limit=1`),
 apiRequest(`establishment_types?is_active=eq.true`)
 ]).catch(() => [null, null, null, null, null]);

 const [txs, drvData, orders, sets, estTypes] = await Promise.all([
 txsRes?.ok ? txsRes.json() : null,
 drvRes?.ok ? drvRes.json() : null,
 ordsRes?.ok ? ordsRes.json() : null,
 setsRes?.ok ? setsRes.json() : null,
 estRes?.ok ? estRes.json() : null
 ]);

 if (drvData?.[0]) {
 const d = drvData[0];
 if (d.bank_info?.pix_key) { setPixKey(d.bank_info.pix_key); localStorage.setItem('izi_driver_pix', d.bank_info.pix_key); }
 setDriverName(d.name || 'Entregador');
 }
 if (sets?.[0]) setAppSettings(sets[0]);
 if (orders) setHistory(orders);
 if (estTypes) setEstablishmentTypes(estTypes);

 // 2. Processamento financeiro unificado
 let balance = 0, todaySum = 0, weeklySum = 0, monthlySum = 0, yearlySum = 0, totalGanhos = 0, previousWeeklySum = 0;
 const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
 const startOfWeek = new Date(); 
 const diffDays = (startOfWeek.getDay() === 0 ? 6 : startOfWeek.getDay() - 1);
 startOfWeek.setDate(startOfWeek.getDate() - diffDays);
 startOfWeek.setHours(0, 0, 0, 0);

 const startOfPreviousWeek = new Date(startOfWeek);
 startOfPreviousWeek.setDate(startOfPreviousWeek.getDate() - 7);
 
 const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
 const startOfYear = new Date(); startOfYear.setMonth(0, 1); startOfYear.setHours(0, 0, 0, 0);

 const weeklyEarnings = [0, 0, 0, 0, 0, 0, 0];
 const monthlyPerformance = Array(12).fill(0);

 if (txs) {
 setEarningsHistory(txs.filter((t: any) => t.type !== 'saque'));
 setWithdrawHistory(txs.filter((t: any) => t.type === 'saque'));

 txs.forEach((t: any) => {
 if (t.type === 'pagamento') return;
 const amount = Number(t.amount);
 const isCredit = ['venda', 'vaga_dedicada', 'bonus', 'deposito', 'reembolso', 'cashback', 'loan_deposit', 'credit'].includes(t.type);
 balance = isCredit ? balance + amount : balance - amount;

 const isEarning = ['venda', 'vaga_dedicada', 'bonus', 'deposito'].includes(t.type);
 if (isEarning) {
 const tDate = new Date(t.created_at);
 totalGanhos += amount;

 if (tDate >= startOfDay) todaySum += amount;
 if (tDate >= startOfWeek) {
 weeklySum += amount;
 const day = tDate.getDay();
 const idx = day === 0 ? 6 : day - 1;
 weeklyEarnings[idx] += amount;
 } else if (tDate >= startOfPreviousWeek) {
 previousWeeklySum += amount;
 }

 if (tDate >= startOfMonth) monthlySum += amount;
 if (tDate >= startOfYear) {
 yearlySum += amount;
 const month = tDate.getMonth();
 monthlyPerformance[month] += amount;
 }
 }
 });
 }

 const growth = previousWeeklySum > 0 
 ? ((weeklySum - previousWeeklySum) / previousWeeklySum) * 100 
 : (weeklySum > 0 ? 100 : 0);

 // 3. Cálculo de Performance (Contagem de entregas últimos 7 dias)
 const performance = [0, 0, 0, 0, 0, 0, 0]; 
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

 const totalXp = (orders?.length || 0) * 15;
 const levels = [
 { lvl: 1, xp: 0 },
 { lvl: 2, xp: 100 },
 { lvl: 3, xp: 300 },
 { lvl: 4, xp: 600 },
 { lvl: 5, xp: 1000 },
 { lvl: 6, xp: 1500 },
 { lvl: 7, xp: 2200 },
 { lvl: 8, xp: 3000 },
 { lvl: 9, xp: 4000 },
 { lvl: 10, xp: 6000 }
 ];

 let currentLvl = 1;
 let nextLvlXp = 100;
 for (let i = 0; i < levels.length; i++) {
 if (totalXp >= levels[i].xp) {
 currentLvl = levels[i].lvl;
 nextLvlXp = levels[i+1] ? levels[i+1].xp : levels[i].xp + 1000;
 } else {
 break;
 }
 }

 setStats(prev => ({ 
 ...prev, 
 balance: Number(balance.toFixed(2)), 
 today: Number(todaySum.toFixed(2)), 
 weekly: Number(weeklySum.toFixed(2)), 
 monthly: Number(monthlySum.toFixed(2)),
 yearly: Number(yearlySum.toFixed(2)),
 totalEarnings: Number(totalGanhos.toFixed(2)), 
 count: orders?.length || 0, 
 xp: totalXp,
 level: currentLvl,
 nextXp: nextLvlXp,
 performance,
 weeklyEarnings,
 monthlyPerformance
 }));

 if (txs) {
 const todayTxs = txs.filter((t: any) => {
 const d = new Date(t.created_at);
 return d >= startOfDay;
 });
 }
 } catch (e) {
 } finally {
 setIsFinanceLoading(false);
 }
 }, [driverId]);

 const syncMissionWithDB = useCallback(async () => {
 if (!driverId || !isAuthenticated) return;
 setIsSyncingMission(true);

 try {
 await Promise.all([
 fetchOrdersRef.current(),
 refreshFinanceData()
 ]);

 const dId = String(driverId).trim();
 const orders = await fetchFromDB('orders_delivery', `driver_id=eq.${dId}&order=created_at.desc&limit=50`);

 const financialTypes = ['izi_coin_recharge', 'vip_subscription', 'izi_coin', 'subscription'];
 const allActiveOrders = (orders || []).filter((o: any) => {
 const status = (o.status || '').toLowerCase().trim();
 const terminalStatuses = ['concluido', 'cancelado', 'rejected', 'recusado'];
 const isTerminal = terminalStatuses.includes(status);
 const isFinancial = financialTypes.includes(o.service_type);
 const isMine = String(o.driver_id).trim() === dId;
 
 return !isTerminal && !isFinancial && isMine;
 });


 // Helper local para formatar missões
 const formatMission = async (ao: any) => {
 let pickup = ao.pickup_address || 'Origem';
 let pLat = ao.pickup_lat;
 let pLng = ao.pickup_lng;
 
 if (ao.merchant_id) {
 try {
 const md = await fetchFromDB('admin_users', `select=store_address,latitude,longitude&id=eq.${ao.merchant_id}&limit=1`);
 if (md?.[0]) {
 if (md[0].store_address) pickup = md[0].store_address;
 if (md[0].latitude) { pLat = Number(md[0].latitude); pLng = Number(md[0].longitude); }
 }
 } catch {}
 }

 if (!pLat || Math.abs(Number(pLat)) < 0.1) {
 const nameLower = (ao.merchant_name || ao.pickup_address || "").toLowerCase();
 if (nameLower.includes('paladar')) {
 pLat = -20.1435361; pLng = -44.2169737;
 pickup = "R. Henri Karam, 640 - Presidente Barroca, Brumadinho - MG";
 }
 }

 return {
 ...ao,
 realId: ao.id,
 type: ao.service_type || 'delivery',
 origin: pickup,
 pickup_address: pickup,
 pickup_lat: pLat,
 pickup_lng: pLng,
 destination: ao.delivery_address || 'Destino',
 price: ao.total_price || 0,
 status: ao.status,
 preparation_status: ao.preparation_status || 'preparando',
 customer: ao.user_name || 'Cliente Izi'
 };
 };

 // Formatar TODAS as missões ativas
 const formattedMissions = await Promise.all(allActiveOrders.map(o => formatMission(o)));
 setActiveMissions(formattedMissions);

 const currentActiveId = activeMissionRef.current?.realId || activeMissionRef.current?.id;
 const updatedSelectedMission = formattedMissions.find((o: any) => (o.id === currentActiveId || o.realId === currentActiveId));

 if (updatedSelectedMission) {
 setActiveMission(updatedSelectedMission);
 localStorage.setItem('Izi_active_mission', JSON.stringify(updatedSelectedMission));
 if (activeTabRef.current === 'dashboard' || activeTabRef.current === 'missions') {
 setActiveTab('active_mission');
 }
 } else if (formattedMissions.length === 1 && !currentActiveId) {
 // Auto-seleciona se houver apenas uma missão e nada selecionado
 setActiveMission(formattedMissions[0]);
 localStorage.setItem('Izi_active_mission', JSON.stringify(formattedMissions[0]));
 if (activeTabRef.current === 'dashboard' || activeTabRef.current === 'missions') {
 setActiveTab('active_mission');
 }
 } else if (currentActiveId && !updatedSelectedMission) {
 // Se a missão selecionada não está mais ativa, limpa a seleção
 setActiveMission(null);
 localStorage.removeItem('Izi_active_mission');
 } else if (formattedMissions.length > 1 && !currentActiveId) {
 // Se houver múltiplas e nenhuma selecionada, garante que mostre a lista
 setActiveMission(null);
 localStorage.removeItem('Izi_active_mission');
 } else if (formattedMissions.length === 0) {
 setActiveMission(null);
 localStorage.removeItem('Izi_active_mission');
 }

 // Toast removido para evitar spam infinito durante syncs automáticos

 } catch (err: any) {
 console.error("[SYNC-MISSION] Erro:", err);
 // Fallback para cache se der erro de rede
 const cached = localStorage.getItem('Izi_active_mission');
 if (cached && !activeMissionRef.current) {
 try { setActiveMission(JSON.parse(cached)); } catch {}
 }
 } finally {
 setIsSyncingMission(false);
 setIsSyncing(false);
 }
 }, [driverId, isAuthenticated, fetchFromDB]);

 const hasSyncedMissionOnce = useRef(false);
 useEffect(() => {
 if (!driverId || !isAuthenticated) return;
 if (hasSyncedMissionOnce.current) return;
 hasSyncedMissionOnce.current = true;
 syncMissionWithDB();
  }, [driverId, isAuthenticated]);

const handleUpdateStatus = async (newStatus: string) => {
 if (!activeMission) return;

 let missionId = activeMission.realId || activeMission.id;
  
 // Se o ID está truncado (display ID de 8 chars), recuperar o UUID completo
 if (missionId && missionId.length < 36) {
   const fullMission = activeMissions.find(m => 
     m.realId?.toUpperCase().startsWith(missionId.toUpperCase()) || 
     m.id?.toUpperCase().startsWith(missionId.toUpperCase())
   );
   if (fullMission?.realId) {
     missionId = fullMission.realId;
   } else {
     toastError("Sincronizando dados da missão...");
     syncMissionWithDB();
     return;
   }
 }

 if (!missionId) return;

 const isFinishing = ['concluido', 'entregue', 'finalizado', 'delivered'].includes(newStatus.toLowerCase());
 const isPaid = activeMission.payment_status === 'paid' || activeMission.payment_status === 'pago' || activeMission.service_type === 'entrega_avulsa';
 
 let paymentConfirmedMode: string | false = false;
 if (isFinishing && !isPaid) {
 paymentConfirmedMode = await showConfirmPaymentMethod(activeMission);
 if (!paymentConfirmedMode) return;
 }

 // 1. ATUALIZAÇÁO OTIMISTA: Feedback Imediato
 const updatedMission = { 
 ...activeMission, 
 status: newStatus.toLowerCase(), 
 updated_at: new Date().toISOString() 
 };

 if (isFinishing) {
 // Se for finalizar, limpamos a missão ativa IMEDIATAMENTE para liberar o driver
 setActiveMission(null);
 setActiveMissions(prev => prev.filter(m => (m.realId || m.id) !== missionId));
 localStorage.removeItem('Izi_active_mission');
 setActiveTab('dashboard');
 
 // ... (rest of finishing logic)
 const missionForCalc = { ...activeMission };
 if (paymentConfirmedMode === 'dinheiro') missionForCalc.payment_method = 'dinheiro';
 else if (paymentConfirmedMode === 'pix_cartao') missionForCalc.payment_method = 'pix';

 const netEarned = getNetEarnings(missionForCalc);
 const totalOrderPrice = Number(activeMission.total_price || activeMission.price || 0);

 setFinishedMissionData({
 show: true,
 amount: netEarned,
 grossAmount: activeMission.price || 0,
 bonus: 0,
 extraKm: 0,
 extraKmValue: 0,
 xpGained: 15,
 cashDiscount: paymentConfirmedMode === 'dinheiro' ? totalOrderPrice : undefined
 });
 } else {
 // Status intermediário: atualiza UI na hora
 setActiveMission(updatedMission);
 setActiveMissions(prev => prev.map(m => (m.realId || m.id) === missionId ? updatedMission : m));
 localStorage.setItem('Izi_active_mission', JSON.stringify(updatedMission));
 toastSuccess(`Status: ${newStatus === 'chegou_coleta' ? 'Na Coleta' : newStatus === 'saiu_para_entrega' ? 'Em Rota' : newStatus}`);
 }

 // 2. SINCRONIZAÇÁO EM BACKGROUND
 const syncStatus = async () => {
 try {
 const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 const token = await getSecureToken();

 const payload: any = {
 status: newStatus.toLowerCase(),
 driver_id: driverId, // Adicionado para satisfazer a política with_check do RLS
 updated_at: new Date().toISOString()
 };
 if (paymentConfirmedMode === 'dinheiro') {
 payload.payment_method = 'dinheiro';
 payload.payment_status = 'paid';
 } else if (paymentConfirmedMode === 'pix_cartao') {
 payload.payment_status = 'paid';
 }

 await iziFetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/orders_delivery?id=eq.${missionId}`, {
 method: 'PATCH',
 headers: {
 'apikey': supabaseKey,
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json',
 'Prefer': 'return=minimal'
 },
 body: JSON.stringify(payload)
 });

 if (isFinishing) {
 const ordShortId = missionId.slice(0,8).toUpperCase();
 const netEarned = getNetEarnings(updatedMission);

 // Registrar Transações Financeiras
 const financialTasks = [];

 // Ganho do motorista
 financialTasks.push(
 iziFetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
 method: 'POST',
 headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({
 user_id: driverId,
 amount: netEarned,
 type: 'deposito',
 status: 'completed',
 description: `Ganhos: Missão #${ordShortId}`
 })
 })
 );

 // Débito se pago em dinheiro
 if (paymentConfirmedMode === 'dinheiro') {
 const totalOrderPrice = Number(activeMission.total_price || activeMission.price || 0);
 financialTasks.push(
 iziFetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
 method: 'POST',
 headers: { 'apikey': supabaseKey, 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
 body: JSON.stringify({
 user_id: driverId,
 amount: totalOrderPrice,
 type: 'debit',
 status: 'completed',
 description: `Recebido em Dinheiro (#${ordShortId})`
 })
 })
 );
 }

 await Promise.all(financialTasks);
 
 // Gamificação
 if (driverId) {
 incrementMissionProgress({ driverId, missionKey: 'complete_delivery', token })
 .then(results => {
 const completedMission = results.find(r => r.isCompleted);
 if (completedMission) {
 toastSuccess(`Parabéns! Missão Concluída: ${completedMission.title}`);
 window.dispatchEvent(new CustomEvent('izi:mission_completed', {
 detail: { missionId: completedMission.missionId }
 }));
 }
 });
 }
 
 refreshFinanceData();
 } else {
 // Sincroniza missão após atualização de status intermediário
 setTimeout(() => syncMissionWithDB(), 1000);
 }
 } catch (e) {
 console.error("[STATUS_SYNC] Erro em background:", e);
 }
 };

 syncStatus();
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



 const res = await iziFetch(`${supabaseUrl}/rest/v1/wallet_transactions_delivery`, {
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



 const res = await iziFetch(`${supabaseUrl}/rest/v1/drivers_delivery?id=eq.${driverId}`, {
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
 showSystemPopup(
 'Dados Salvos!',
 'Suas informações bancárias e chave PIX foram atualizadas.',
 'success'
 );
 } catch (e: any) {
 console.error('[PIX] ERRO:', e);
 toastError('Erro ao salvar: ' + (e?.message || 'Desconhecido'));
 } finally {
 setIsSavingPix(false);
 }
 };

 const handleSavePlate = async (val: string, vehicleVal: string) => {
 if (!driverId) return;
 setIsSavingPlate(true);
 try {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const token = await getSecureToken();
 
 const payload = {
 driver_id: driverId,
 vehicle_type: vehicleVal,
 plate: val.trim().toUpperCase(),
 model: editProfileData.vehicle_model,
 status: 'pending'
 };

 const response = await iziFetch(`${sUrl}/rest/v1/driver_vehicle_requests`, {
 method: 'POST',
 headers: {
 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json',
 'Prefer': 'return=minimal'
 },
 body: JSON.stringify(payload)
 });

 if (!response.ok) {
 const errText = await response.text();
 throw new Error(errText || 'Falha ao salvar no banco');
 }

 showSystemPopup(
 'Solicitação de Alteração!',
 'Sua solicitação de alteração de veículo foi enviada com sucesso e será analisada pelo administrador.',
 'success'
 );
 await loadVehicleRequests(driverId);
 setIsEditingPlate(false);
 setShowPlateModal(false);
 } catch (e: any) {
 console.error('[PLATE] Erro ao solicitar alteração:', e);
 toastError('Erro ao enviar solicitação: ' + (e.message || 'Tente novamente'));
 } finally {
 setIsSavingPlate(false);
 }
 };

 const handleSubmitNewVehicle = async () => {
 if (!newVehicleType) { toastError('Selecione o tipo de veículo'); return; }
 const needsPlate = newVehicleType !== 'bicicleta';
 if (needsPlate && newVehiclePlate.trim().length < 7) { toastError('Informe a placa (mín. 7 caracteres)'); return; }
 if (!newVehicleModel.trim()) { toastError('Informe o modelo do veículo'); return; }
 if (!driverId) { toastError('Sessão inválida. Por favor, faça login novamente.'); return; }

 setIsSavingNewVehicle(true);

 try {
 const sUrl = import.meta.env.VITE_SUPABASE_URL;
 const token = await getSecureToken();
 
 const payload = {
 driver_id: driverId,
 vehicle_type: newVehicleType,
 plate: needsPlate ? newVehiclePlate.trim().toUpperCase() : null,
 model: newVehicleModel.trim(),
 color: newVehicleColor.trim(),
 status: 'pending'
 };

 const response = await iziFetch(`${sUrl}/rest/v1/driver_vehicle_requests`, {
 method: 'POST',
 headers: {
 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
 'Authorization': `Bearer ${token}`,
 'Content-Type': 'application/json',
 'Prefer': 'return=minimal'
 },
 body: JSON.stringify(payload)
 });

 if (!response.ok) {
 const errText = await response.text();
 throw new Error(errText || 'Falha ao salvar no banco');
 }

 showSystemPopup(
 'Solicitação Enviada!', 
 'Seu novo veículo foi cadastrado com sucesso e está aguardando a aprovação do administrador.',
 'success'
 );
 
 setShowNewVehicleForm(false);
 setNewVehicleType('');
 setNewVehiclePlate('');
 setNewVehicleModel('');
 setNewVehicleColor('');
 
 await loadVehicleRequests(driverId);
 } catch (e: any) {
 console.error('[NEW_VEHICLE] Erro:', e);
 toastError('Erro ao enviar solicitação: ' + (e.message || 'Tente novamente'));
 } finally {
 setIsSavingNewVehicle(false);
 }
 };


 const handleLogout = useCallback(() => {
 setIsProfileNotFound(false);
 isLoggingOutRef.current = true;

 
 // 1. Deslogar do Supabase em background (sem travar a interface)
 supabase.auth.signOut().catch(err => console.warn('[AUTH] Erro no signOut remoto:', err));
 
 // 2. Limpar o estado local e LocalStorage (limpa dados de UI imediatamente)
 clearDriverSessionState();
 
 // 3. Forçar recarregamento para limpar estados residuais de memória
 window.location.href = '/';
 }, [clearDriverSessionState]);

 const renderHeader = () => (
 <header className="px-6 py-6 flex items-center justify-between sticky top-0 z-50 shrink-0">
 {/* Perfil Icon (Left) */}
 <motion.button
 whileTap={{ scale: 0.9 }}
 onClick={() => setActiveTab('profile')}
 className="size-12 flex items-center justify-center overflow-hidden relative"
 >
 {driverAvatar ? (
 <div className="size-10 rounded-xl overflow-hidden border border-zinc-100 ">
 <img src={driverAvatar} alt="Profile" className="w-full h-full object-cover" />
 </div>
 ) : (
 <Icon name="person" size={28} className="text-zinc-900" />
 )}
 </motion.button>

 {/* Logo/Spacer or minimalist title removal */}
 <div />

 {/* Notifications Icon (Right) */}
 <motion.button
 whileTap={{ scale: 0.9 }}
 onClick={() => setActiveTab('notifications')}
 className="size-12 flex items-center justify-center relative"
 >
 <Icon name="notifications" size={28} className={unreadNotifsCount > 0 ? 'text-yellow-600' : 'text-zinc-900'} />
 {unreadNotifsCount > 0 && (
 <span className="absolute top-2 right-2 size-2.5 bg-rose-500 rounded-full border-2 border-white" />
 )}
 </motion.button>
 </header>
 );

 
 const handleApplyToSlot = async (slot: any) => {
 if (!driverId) {
 toastError("Erro: ID do entregador não encontrado.");
 return;
 }

 // --- TRAVA DE SEGURANÇA: Verificação de duplicados ---
 const alreadyApplied = myApplications.some(app => String(app.slot_id) === String(slot.id) && app.status !== 'rejected');
 
 if (alreadyApplied) {
 toastError("Você já possui uma candidatura ativa para esta vaga!");
 return;
 }
 // ---------------------------------------------------


 setApplyingSlotId(slot.id);
 
 try {

 
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

 const response = await iziFetch(`${supabaseUrl}/rest/v1/slot_applications`, {
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

 setShowSlotAppliedSuccess(true);
 
 // --- ATUALIZAÇÁO OTIMISTA ---
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

 setApplyingSlotId(null);
 }
 };

 const renderBottomNavigation = () => {
 if (activeTab === 'active_mission' && activeMission) return null; // Esconde navbar apenas quando está na tela de mapa de uma missão específica
 const isSlotDetailActive = !!selectedSlot;

 return (
 <nav className="fixed bottom-0 left-0 right-0 z-[200] px-4 pb-6 pt-2 pointer-events-none">
 <motion.div 
 layout
 initial={false}
 className=" rounded-xl p-2 flex items-center justify-between border-zinc-100 bg-white pointer-events-auto overflow-hidden"
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
 { id: 'missions', label: 'Bônus', icon: 'stars' },
 { id: 'active_mission', label: 'Entrega', icon: 'route', badge: activeMissions.length },
 { id: 'history', label: 'Histórico', icon: 'history' },
 { id: 'scheduled', label: 'Agendamentos', icon: 'event', badge: scheduledOrders.length },
 { id: 'dedicated', label: 'Vagas', icon: 'military_tech', badge: dedicatedSlots.filter(s => s.is_active && !myApplications.some(app => String(app.slot_id) === String(s.id))).length },
 { id: 'earnings', label: 'Ganhos', icon: 'payments' }
 ].filter(item => {
 if (item.id === 'scheduled' || item.id === 'active_mission') {
 return isOnline || !!activeMission;
 }
 return true;
 }).map((item) => {
 const isActive = activeTab === item.id;
 const hasPendingOrders = item.id === 'active_mission' && orders.length > 0 && !activeMission;

 return (
 <button
 key={item.id}
 onClick={() => {
 // Limpeza de Modais ao trocar de aba para evitar fluxos errados
 setShowOrderModal(false);
 setShowBankDetails(false);
 setShowPlateModal(false);
 setShowPreferences(false);
 setShowWithdrawModal(false);
 setShowWithdrawHistory(false);
 setShowWithdrawDetail(false);
 
 // Removemos o reset do selectedSlot aqui para permitir navegação direta do Dashboard
 
 if (item.id === 'active_mission') {
 // Ao clicar em "Missão" na navbar, limpa a seleção para mostrar a lista
 setActiveMission(null);
 syncMissionWithDB();
 }
 setActiveTab(item.id as any);
 }}
 className={`flex flex-col items-center gap-1 py-1.5 px-0.5 rounded-xl transition-all relative flex-1 min-w-0 ${
 isActive ? 'text-yellow-600' : 'text-zinc-400'
 }`}
 >
 <div className={`size-10 sm:size-12 rounded-xl sm:rounded-xl flex items-center justify-center transition-all duration-300 ${
 isActive 
 ? 'bg-yellow-400 scale-105 border border-yellow-300' 
 : 'bg-transparent'
 }`}>
 <Icon 
 name={item.icon} 
 size={isActive ? 22 : 20} 
 className={isActive ? 'text-zinc-900 drop-' : 'text-zinc-400'} 
 />
 
 {/* Indicador de Pedidos Disponíveis */}
 {hasPendingOrders && (
 <span className="absolute -top-1 -right-1 flex h-4 w-4">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white flex items-center justify-center">
 <span className="text-[7px] text-zinc-900 font-black">{orders.length}</span>
 </span>
 </span>
 )}

 {item.badge > 0 && (
 <span className="absolute top-0 right-0 size-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center ">
 {item.badge}
 </span>
 )}
 </div>
 <span className={`text-[8px] font-black uppercase tracking-widest transition-all text-center pb-1 ${
 isActive ? 'opacity-100 text-zinc-900' : 'opacity-0 h-0 hidden'
 }`}>
 {item.label}
 </span>
 {isActive && <div className="absolute -bottom-1 size-1.5 rounded-full bg-yellow-500" />}
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
 className="size-14 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-900 active:scale-90 transition-all font-black"
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
 className={`flex-1 flex items-center justify-center gap-4 h-15 rounded-[22px] font-black text-xs uppercase tracking-[0.3em] relative overflow-hidden transition-all duration-500 ${
 isAccepted 
 ? 'bg-emerald-500 text-white border border-emerald-400/30' 
 : 'bg-zinc-100 text-zinc-900 border border-zinc-200'
 }`}
 >
 <div className={`size-9 rounded-xl flex items-center justify-center ${
 isAccepted ? 'bg-white/20' : 'bg-yellow-400/20 border border-yellow-400/20'
 }`}>
 <Icon 
 name={isAccepted ? 'verified' : 'history'} 
 size={22} 
 className={!isAccepted ? 'text-yellow-600 animate-pulse' : 'text-white'} 
 />
 </div>
 <div className="flex flex-col items-start leading-none gap-1.5">
 <span className={`text-[10px] font-black tracking-[0.1em] ${isAccepted ? 'text-white' : 'text-yellow-600'}`}>
 {isAccepted ? 'Vaga Confirmada' : 'Aguardando Lojista'}
 </span>
 <div className="flex items-center gap-1.5">
 {!isAccepted && <div className="size-1 rounded-full bg-yellow-500 animate-ping" />}
 <span className={`text-[8px] font-bold uppercase ${isAccepted ? 'opacity-70' : 'text-zinc-400'}`}>
 {isAccepted ? 'VOCÊ É EXCLUSIVO' : 'EM ANÁLISE PELO PARCEIRO'}
 </span>
 </div>
 </div>
 </div>
 );
 }

 return (
 <button 
 disabled={!!applyingSlotId || hasApplied}
 onClick={() => selectedSlot && handleApplyToSlot(selectedSlot)}
 className="flex-1 h-15 bg-white border border-yellow-400/20 rounded-[22px] relative group active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
 >
 <div className="absolute inset-0 bg-yellow-400 opacity-10 group-hover:opacity-20 transition-opacity" />
 {applyingSlotId ? (
 <div className="size-6 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
 ) : (
 <>
 <div className="size-8 rounded-xl bg-yellow-400/20 flex items-center justify-center">
 <Icon name="touch_app" size={20} className="text-yellow-600" />
 </div>
 <span className="text-sm font-black text-yellow-600 uppercase tracking-[0.2em]">Candidatar Agora</span>
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
 fetchOrders(),
 syncMissionWithDB()
 ]);
 } catch (e) {}
 setIsRefreshing(false);
 setPullY(0);
 };

 const renderDashboard = () => (
 <DashboardView 
 driverName={driverName}
 stats={stats}
 activeMissions={activeMissions}
 filteredOrders={filteredOrders}
 dedicatedSlots={dedicatedSlots}
 myApplications={myApplications}
 isProfileLoaded={isProfileLoaded}
 isApproved={isApproved}
 driverId={driverId}
 selectedOrder={selectedOrder}
 isAccepting={isAccepting}
 onRefresh={fetchOrders}
 isRefreshing={isRefreshing}
 setActiveTab={setActiveTab}
 setActiveMission={setActiveMission}
 setSelectedOrder={setSelectedOrder}
 handleAccept={handleAccept}
 handleDeclineOrder={handleDeclineOrder}
 setSelectedSlot={setSelectedSlot}
 setShowOnboarding={setShowOnboarding}
 setShowOrderModal={setShowOrderModal}
 getServicePresentation={getServicePresentation}
 getNetEarnings={getNetEarnings}
 />
 );

 const renderScheduledDetailView = () => {
 const order = selectedScheduledOrder;
 if (!order) return null;
 const dt = new Date(order.scheduled_at);
 
 const isMine = (order.driver_id && String(order.driver_id).trim() === String(driverId).trim());
 const isAccepted = isMine || ['confirmado', 'confirmed'].includes(order.status);
 const isPending = !isAccepted && !order.driver_id && !['cancelado', 'canceled', 'concluido', 'delivered', 'finalizado'].includes(order.status);

 return (
 <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="fixed inset-0 z-[1000] bg-white flex flex-col">
 <header className="fixed top-0 w-full z-50 bg-white flex justify-between items-center px-6 py-4 border-b border-zinc-100">
 <div className="flex items-center gap-4">
 <button onClick={() => setSelectedScheduledOrder(null)} className="text-zinc-900 p-2 hover:bg-zinc-50 transition-all">
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
 </button>
 <h1 className="font-bold text-zinc-900 text-lg tracking-tight uppercase">
 {isMine ? 'Detalhes do Agendamento' : 'Aceitar Agendamento'}
 </h1>
 </div>
 </header>
 
 <main className="pt-24 px-6 space-y-6 overflow-y-auto pb-40 no-scrollbar">
 <div className="bg-transparent text-zinc-900 relative">
 <div className="relative z-10 border-b border-zinc-100 pb-6">
 <div className="flex justify-between items-start mb-6">
 <div className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Detalhes da Escala</div>
 <div className="text-right">
 <p className="text-[10px] font-bold text-zinc-400 uppercase">Ganho Líquido</p>
 <p className="text-3xl font-bold">R$ {getNetEarnings(order).toFixed(2).replace('.', ',')}</p>
 </div>
 </div>
 <div className="space-y-6">
 <div className="flex items-center gap-4 w-full">
 <div className="text-yellow-600">
 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
 </div>
 <div>
 <p className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Data Programada</p>
 <p className="text-lg font-bold uppercase">{dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
 </div>
 </div>
 <div className="flex items-center gap-4 w-full">
 <div className="text-zinc-900">
 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
 </div>
 <div>
 <p className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Horário de Início</p>
 <p className="text-lg font-bold uppercase">{dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h</p>
 </div>
 </div>
 <div className="pt-4 border-t border-zinc-100 space-y-4">
 <div className="flex items-start gap-3">
 <div className="text-zinc-400 mt-1">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Ponto de Partida</p>
 <p className="font-semibold text-sm leading-tight">{cleanAddressText(order.pickup_address)}</p>
 </div>
 </div>
 <div className="flex items-start gap-3">
 <div className="text-zinc-400 mt-1">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Endereço de Entrega</p>
 <p className="font-semibold text-sm leading-tight">
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
 <div className="w-full h-px bg-zinc-100 my-2" />
 <div className="flex items-start gap-3">
 <div className="text-zinc-400 mt-1">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
 </div>
 <div>
 <p className="text-[10px] font-bold uppercase text-zinc-400 mb-1">Observações do Cliente</p>
 <p className="font-semibold text-sm leading-snug">{obsText}</p>
 </div>
 </div>
 </>
 );
 })()}
 </div>
 </div>
 </div>
 </div>
 <div className="py-4 bg-transparent border-t border-zinc-100 mt-4">
 <div className="flex items-center gap-4 mb-4">
 <div className="text-yellow-600">
 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
 </div>
 <h4 className="text-[10px] font-bold text-zinc-900 uppercase tracking-[0.2em]">Regras do Agendamento</h4>
 </div>
 <ul className="space-y-3 pl-2">
 <li className="flex gap-3 text-xs text-zinc-600 font-semibold items-start leading-relaxed uppercase tracking-tight">
 <span className="text-yellow-500 font-bold">ââ‚¬¢</span> 
 Comparecer ao local com 15 min de antecedência.
 </li>
 <li className="flex gap-3 text-xs text-zinc-600 font-semibold items-start leading-relaxed uppercase tracking-tight">
 <span className="text-yellow-500 font-bold">ââ‚¬¢</span> 
 Estar com bateria do celular acima de 80%.
 </li>
 <li className="flex gap-3 text-xs text-zinc-600 font-semibold items-start leading-relaxed uppercase tracking-tight">
 <span className="text-yellow-500 font-bold">ââ‚¬¢</span> 
 Traje profissional e baú limpo.
 </li>
 <li className="flex gap-3 text-xs text-yellow-600 font-bold items-start leading-relaxed uppercase tracking-tight">
 <span className="text-yellow-500 font-bold">ââ‚¬¢</span> 
 O início da missão é liberado 1 hora antes do horário agendado.
 </li>
 </ul>
 </div>
 </main>

 <div className="fixed bottom-0 left-0 w-full p-8 bg-gradient-to-t from-white via-white to-transparent z-[1020]">
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
 className="w-full h-16 bg-yellow-400 text-zinc-900 rounded-lg font-bold text-lg uppercase tracking-tight hover:bg-yellow-500 transition-colors"
 >
 Aceitar
 </button>
 ) : isMine ? (
 (() => {
 const now = new Date();
 const scheduledDate = new Date(order.scheduled_at);
  const oneHourBefore = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
  const canStartVisible = now.getTime() >= oneHourBefore.getTime();
 
 if (!canStartVisible) {
 return (
 <div className="w-full h-16 border border-zinc-200 flex flex-col items-center justify-center gap-1 bg-white rounded-lg">
 <div className="flex items-center gap-2">
 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
 <span className="text-yellow-600 font-bold uppercase tracking-widest text-[11px]">Início Bloqueado</span>
 </div>
 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
  {(() => { const dMs = oneHourBefore.getTime() - now.getTime(); const dH = Math.floor(dMs / 3600000); const dM = Math.ceil((dMs % 3600000) / 60000); return dH > 0 ? `Liberado 1h antes — faltam ${dH}h ${dM}min` : `Liberado 1h antes — faltam ${dM} min`; })()}
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
 className="w-full h-16 bg-zinc-900 text-white rounded-lg font-bold text-sm uppercase tracking-widest transition-colors flex items-center justify-center gap-3 hover:bg-zinc-800"
 >
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
 Missão Concluída ââ‚¬¢ Fechar
 </button>
 );
 }

 return (
 <button 
 onClick={() => {
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
 className="w-full h-16 bg-emerald-500 text-white rounded-lg font-bold text-lg uppercase tracking-tight transition-colors flex items-center justify-center gap-3 hover:bg-emerald-600"
 >
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
 Iniciar Missão
 </button>
 );
 })()
 ) : isAccepted ? (
 <div className="w-full h-16 rounded-lg border border-emerald-500 bg-emerald-50 flex items-center justify-center gap-3">
 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
 <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Já está na sua agenda</span>
 </div>
 ) : (
 <button 
 onClick={() => setSelectedScheduledOrder(null)}
 className="w-full h-16 bg-zinc-100 text-zinc-900 font-bold text-sm uppercase tracking-widest rounded-lg hover:bg-zinc-200 transition-colors"
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
 <ScheduledView 
 scheduledOrders={scheduledOrders}
 driverId={driverId}
 subTabScheduled={subTabScheduled}
 setSubTabScheduled={setSubTabScheduled}
 setSelectedScheduledOrder={setSelectedScheduledOrder}
 getNetEarnings={getNetEarnings}
 serviceTypeLabel={serviceTypeLabel}
 />
 );
 };


 const renderDedicatedView = () => {
 return (
 <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="px-5 space-y-6 pb-40 pt-4">
 <header className="text-center">
 <p className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.5em]">Exclusivo</p>
 <h2 className="text-3xl font-black text-zinc-900 tracking-tight mt-1 uppercase">Vagas Dedicadas</h2>
 <p className="text-xs text-zinc-400 mt-1 font-bold">Seja piloto exclusivo de um parceiro Izi.</p>
 </header>

 {dedicatedSlots.length === 0 ? (
 <div className="py-20 bg-zinc-900 border border-zinc-800 border-dashed rounded-xl flex flex-col items-center gap-4 text-center">
 <Icon name="sentiment_dissatisfied" className="text-4xl text-zinc-200" />
 <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Nenhuma vaga disponível</p>
 </div>
 ) : (
 <div className="space-y-4">
 {[...dedicatedSlots]
 .filter(s => {
 const d = new Date();
 const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
 const todayDateNum = d.getDate();
 const daysEng = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
 const currentDayEng = daysEng[d.getDay()];
 const meta = s.metadata || {};

 if (s.slot_date) {
 let cleanDateStr = String(s.slot_date).split('T')[0];
 if (cleanDateStr.includes('/')) {
 const parts = cleanDateStr.split('/');
 if (parts.length === 3) {
 if (parts[2].length === 4) cleanDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
 else if (parts[0].length === 4) cleanDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
 }
 }
 const slotDateObj = new Date(cleanDateStr + 'T12:00:00');
 const todayObj = new Date();
 todayObj.setHours(0,0,0,0);
 slotDateObj.setHours(0,0,0,0);
 
 if (isNaN(slotDateObj.getTime()) || slotDateObj.getTime() < todayObj.getTime()) return false;
 }

 if (meta.expires_at) {
 let cleanExpStr = String(meta.expires_at).split('T')[0];
 const expDateObj = new Date(cleanExpStr + 'T12:00:00');
 const todayObj = new Date();
 todayObj.setHours(0,0,0,0);
 expDateObj.setHours(0,0,0,0);
 if (!isNaN(expDateObj.getTime()) && expDateObj.getTime() < todayObj.getTime()) return false;
 }
 
 let isToday = false;
 if (s.slot_date) {
 let cleanDateStr = String(s.slot_date).split('T')[0];
 if (cleanDateStr.includes('/')) {
 const parts = cleanDateStr.split('/');
 if (parts.length === 3 && parts[2].length === 4) cleanDateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
 else if (parts.length === 3 && parts[0].length === 4) cleanDateStr = `${parts[0]}-${parts[1]}-${parts[2]}`;
 }
 if (cleanDateStr === todayStr) isToday = true;
 } else {
 if (meta.days_of_month && Array.isArray(meta.days_of_month) && meta.days_of_month.includes(todayDateNum)) isToday = true;
 else if (s.day_of_week === 'Daily') isToday = true;
 else if (s.day_of_week?.split(',').includes(currentDayEng)) isToday = true;
 }
 
 if (isToday && s.working_hours) {
 const match = s.working_hours.match(/(?:as|às|ate|até|-)\s*(\d{1,2})(?:[:h]\d{2})?/i);
 if (match) {
 let endHour = parseInt(match[1], 10);
 if (endHour <= 4) endHour += 24;
 const currentHour = new Date().getHours();
 if (currentHour >= endHour + 1) return false;
 }
 }

 const myApp = myApplications.find(app => String(app.slot_id) === String(s.id));
 return s.is_active || myApp?.status === 'accepted';
 })
 .sort((a, b) => {
 const appA = myApplications.find(app => String(app.slot_id) === String(a.id));
 const appB = myApplications.find(app => String(app.slot_id) === String(b.id));
 if (appA?.status === 'accepted' && appB?.status !== 'accepted') return -1;
 if (appB?.status === 'accepted' && appA?.status !== 'accepted') return 1;
 return 0;
 }).map((s: any, i: number) => {
 const application = myApplications.find(app => String(app.slot_id) === String(s.id));
 const isAccepted = application?.status === 'accepted';
 const hasApplied = !!application;
 
 return (
 <motion.button 
 key={s.id} 
 initial={{ opacity: 0, scale: 0.9, y: 10 }} 
 animate={{ opacity: 1, scale: 1, y: 0 }} 
 transition={{ delay: i * 0.05 }}
 onClick={async () => {
 if (Capacitor.isNativePlatform()) {
 await Haptics.impact({ style: ImpactStyle.Light });
 }
 setSelectedSlot(s);
 }}
 className={`w-full transition-all p-8 flex items-center gap-6 group text-left relative overflow-hidden active:scale-[0.98] ${
 isAccepted 
 ? 'bg-emerald-50 border-2 border-emerald-500 rounded-xl shadow-emerald-500/10' 
 : 'bg-white border border-zinc-100 rounded-xl '
 }`}
 >
 {isAccepted && <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />}
 
 {/* Selo removido para evitar sobreposição */}

 <div className={`size-16 rounded-xl border flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-500 ${
 isAccepted ? 'bg-emerald-100 border-emerald-200' : 'bg-zinc-50 border-zinc-100'
 }`}>
 {s.admin_users?.store_logo
 ? <img src={s.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
 : <div className={`size-full flex items-center justify-center ${isAccepted ? 'bg-emerald-200' : 'bg-yellow-50'}`}>
 <Icon name={isAccepted ? 'military_tech' : 'stars'} size={28} className={isAccepted ? 'text-emerald-600' : 'text-yellow-500'} />
 </div>}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <div className="relative">
 <span className={`size-2 rounded-full block ${isAccepted ? 'bg-emerald-500' : 'bg-yellow-500'} ${isAccepted ? '' : 'animate-pulse'}`}></span>
 {isAccepted && <span className="absolute inset-0 size-2 rounded-full bg-emerald-500 animate-ping opacity-50"></span>}
 </div>
 <p className={`text-[10px] font-black uppercase tracking-[0.2em] truncate ${isAccepted ? 'text-emerald-600' : 'text-zinc-400'}`}>
 {s.admin_users?.store_name || 'Parceiro Exclusivo'}
 </p>
 </div>
 <p className={`text-xl font-black tracking-tight leading-tight transition-colors ${
 isAccepted ? 'text-emerald-800' : 'text-zinc-900 group-hover:text-yellow-600'
 }`}>{s.title}</p>
 <div className="flex items-center gap-3 mt-3">
 <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
 isAccepted ? 'bg-emerald-100/50 border-emerald-200' : 'bg-zinc-50 border-zinc-100'
 }`}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isAccepted ? 'text-emerald-600' : 'text-yellow-600'}>
 <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
 </svg>
 <p className={`text-[9px] font-black uppercase tracking-wider ${isAccepted ? 'text-emerald-600' : 'text-zinc-500'}`}>{s.working_hours || 'A combinar'}</p>
 </div>
 </div>
 </div>
 <div className="text-right shrink-0 flex flex-col items-end gap-1">
 <div className={`${isAccepted ? 'bg-emerald-500 text-white' : 'bg-yellow-400 text-zinc-900'} px-5 py-3 rounded-2xl transition-all flex flex-col items-center min-w-[80px]`}>
 <p className={`text-xl font-black leading-none`}>R$ {parseFloat(s.fee_per_day || 0).toFixed(0)}</p>
 <p className={`text-[8px] font-black uppercase tracking-tighter opacity-70`}>diária</p>
 </div>
 {hasApplied && (
 <div className="mt-2">
 <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
 isAccepted 
 ? 'bg-white text-emerald-600 border border-emerald-200' 
 : application?.status === 'rejected'
 ? 'bg-rose-50 text-rose-600 border border-rose-100'
 : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
 }`}>
 {isAccepted ? (
 <><Icon name="verified" size={12} /> Confirmada</>
 ) : application?.status === 'rejected' ? (
 <><Icon name="cancel" size={12} /> Não Selecionado</>
 ) : (
 <><Icon name="hourglass_empty" size={12} className="animate-spin-slow" /> Em Análise</>
 )}
 </div>
 </div>
 )}
 </div>
 </motion.button>
 );
 })}
 </div>
 )}
 </motion.div>
 );
 };

 const renderSlotDetailsBottomSheet = () => {
 if (!selectedSlot) return null;
 
 const slot = selectedSlot;
 const application = myApplications.find(app => String(app.slot_id) === String(slot.id));
 const isAccepted = application?.status === 'accepted';
 const hasApplied = !!application;
 const customBenefits = slot.metadata?.custom_benefits || [];
 const neighborhoodExtras = slot.metadata?.bairros_extras || slot.metadata?.neighborhood_extras || [];
 const requirements: string[] = slot.metadata?.custom_specialties || [];

 return (
 <div className="fixed inset-0 z-[125] flex items-end justify-center">
 {/* Backdrop */}
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="absolute inset-0 bg-zinc-900/40 "
 onClick={() => setSelectedSlot(null)}
 />
 
 <IziBottomSheet snapPoints={["85vh", "95vh"]} initialSnap={0} onClose={() => setSelectedSlot(null)}>
 <div className="px-6 pb-20 space-y-8">
 {/* Header do Slot */}
 <div className="flex items-start gap-5">
 <div className={`size-20 rounded-[28px] border flex items-center justify-center shrink-0 overflow-hidden ${
 isAccepted ? 'bg-emerald-50 border-emerald-200' : 'bg-yellow-50 border-yellow-100'
 }`}>
 {slot.admin_users?.store_logo ? (
 <img src={slot.admin_users.store_logo} className="w-full h-full object-cover" alt="" />
 ) : (
 <Icon name={isAccepted ? 'verified' : 'stars'} size={32} className={isAccepted ? 'text-emerald-600' : 'text-yellow-600'} />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>
 <h2 className="text-2xl font-black text-zinc-900 tracking-tight leading-tight uppercase">{slot.title}</h2>
 <div className="flex items-center gap-2 mt-2">
 <Icon name="location_on" size={12} className="text-zinc-300" />
 <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider truncate">{slot.admin_users?.store_address || 'Unidade Local'}</span>
 </div>
 </div>
 </div>

 {/* Status Card / Recibo Style */}
 {hasApplied ? (
 <div className={`rounded-xl border-2 overflow-hidden ${
 isAccepted ? 'border-emerald-500/20 bg-emerald-50/30' : 'border-yellow-500/20 bg-yellow-50/30'
 }`}>
 <div className={`px-6 py-3 flex justify-between items-center text-white ${isAccepted ? 'bg-emerald-500' : 'bg-yellow-500'}`}>
 <div className="flex items-center gap-2">
 <Icon name={isAccepted ? 'verified' : 'history'} size={16} />
 <span className="text-[10px] font-black uppercase tracking-widest">{isAccepted ? 'Comprovante Oficial' : 'Candidatura Enviada'}</span>
 </div>
 <span className="text-[8px] font-black opacity-60">ID: {slot.id.slice(0,8).toUpperCase()}</span>
 </div>
 <div className="p-6 space-y-4">
 <div className="flex justify-between items-end">
 <div>
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Garantido por Dia</p>
 <p className="text-3xl font-black text-zinc-900 leading-none">
 <span className="text-sm font-bold opacity-30 mr-1 text-emerald-600">R$</span>
 {parseFloat(slot.fee_per_day || 0).toFixed(0)}
 </p>
 </div>
 <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
 isAccepted ? 'bg-emerald-500 text-white' : 'bg-white border border-yellow-400 text-yellow-600'
 }`}>
 {isAccepted ? 'Piloto Exclusivo' : 'Em Análise'}
 </div>
 </div>
 <div className="h-px bg-zinc-200 border-dashed border-t" />
 <div className="grid grid-cols-2 gap-4">
 <div>
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Horário</p>
 <p className="text-xs font-black text-zinc-800 uppercase tracking-tight">{slot.working_hours}</p>
 </div>
 <div>
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Início</p>
 <p className="text-xs font-black text-zinc-800 uppercase tracking-tight">
 {slot.slot_date ? new Date(slot.slot_date + 'T12:00:00').toLocaleDateString('pt-BR') : 'Imediato'}
 </p>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="bg-zinc-900 rounded-xl p-8 text-white relative overflow-hidden ">
 <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl -mr-16 -mt-16 rounded-full" />
 <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 opacity-50">Diária Garantida</p>
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-black text-yellow-400">R$</span>
 <span className="text-7xl font-black tracking-tighter leading-none">{parseFloat(slot.fee_per_day || 0).toFixed(0)}</span>
 </div>
 <div className="mt-6 flex items-center gap-3 bg-white/10 w-fit px-4 py-2 rounded-2xl border border-white/10 ">
 <Icon name="schedule" size={16} className="text-yellow-400" />
 <p className="text-[10px] font-black uppercase tracking-widest">{slot.working_hours}</p>
 </div>
 </div>
 )}

 {/* Detalhes e Benefícios */}
 <div className="space-y-8">
 <section className="space-y-4">
 <h3 className="text-lg font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
 <div className="size-1.5 rounded-full bg-yellow-400" /> Detalhes da Vaga
 </h3>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-2">
 <Icon name="local_shipping" size={20} className="text-zinc-400" />
 <div className="space-y-1">
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Extra p/ entrega</p>
 <p className="text-xs font-black text-zinc-900">R$ {parseFloat(slot.metadata?.fee_per_extra_delivery || 0).toFixed(2).replace('.', ',')}</p>
 </div>
 </div>
 <div className="bg-zinc-50 p-5 rounded-xl border border-zinc-100 flex flex-col items-center text-center gap-2">
 <Icon name="inventory_2" size={20} className="text-zinc-400" />
 <div className="space-y-1">
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Incluso na diária</p>
 <p className="text-xs font-black text-zinc-900">{slot.metadata?.base_deliveries || 0} entregas</p>
 </div>
 </div>
 </div>
 </section>

 {customBenefits.length > 0 && (
 <section className="space-y-4">
 <h3 className="text-lg font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
 <div className="size-1.5 rounded-full bg-yellow-400" /> Bônus Adicionais
 </h3>
 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
 {customBenefits.map((ben: any, idx: number) => (
 <div key={idx} className="shrink-0 bg-white border border-zinc-100 p-4 rounded-2xl flex flex-col items-center text-center gap-2 min-w-[120px]">
 <Icon name="star" size={16} className="text-yellow-600" />
 <div className="space-y-0.5">
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{ben.label || 'Incentivo'}</p>
 <p className="text-xs font-black text-yellow-600">+ R$ {parseFloat(ben.value || 0).toFixed(2).replace('.', ',')}</p>
 </div>
 </div>
 ))}
 </div>
 </section>
 )}

 {requirements.length > 0 && (
 <section className="space-y-4">
 <h3 className="text-lg font-black text-zinc-900 tracking-tight uppercase flex items-center gap-2">
 <div className="size-1.5 rounded-full bg-yellow-400" /> Requisitos
 </h3>
 <div className="grid gap-3">
 {requirements.map((req: any, idx: number) => (
 <div key={idx} className="bg-zinc-50/50 p-4 rounded-2xl border border-zinc-100 flex items-center gap-4">
 <div className="size-8 rounded-lg bg-white flex items-center justify-center border border-zinc-100 ">
 <Icon name="check" size={16} className="text-emerald-500" />
 </div>
 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{typeof req === 'string' ? req : req.label}</p>
 </div>
 ))}
 </div>
 </section>
 )}
 </div>
 </div>

 {/* Botão de Ação Fixo no Bottom Sheet */}
 <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
 {!hasApplied ? (
 <button 
 onClick={async () => {
 if (Capacitor.isNativePlatform()) {
 await Haptics.impact({ style: ImpactStyle.Heavy });
 }
 handleApplyToSlot(slot);
 }}
 disabled={applyingSlotId === slot.id}
 className="w-full h-18 bg-yellow-400 text-zinc-950 rounded-[28px] font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all pointer-events-auto flex items-center justify-center gap-3"
 >
 {applyingSlotId === slot.id ? (
 <div className="size-6 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
 ) : (
 <>
 <Icon name="touch_app" size={24} />
 Candidatar Agora
 </>
 )}
 </button>
 ) : (
 <button 
 onClick={async () => {
 if (Capacitor.isNativePlatform()) {
 await Haptics.impact({ style: ImpactStyle.Light });
 }
 setSelectedSlot(null);
 }}
 className="w-full h-18 bg-zinc-900 text-white rounded-[28px] font-black text-sm uppercase tracking-[0.2em] active:scale-95 transition-all pointer-events-auto"
 >
 Fechar Detalhes
 </button>
 )}
 </div>
 </IziBottomSheet>
 </div>
 );
 };



 // renderHistoryView extraído para componente HistoryView.tsx (performance: React.memo)

 // renderEarningsView extraído para componente EarningsView.tsx (performance: React.memo)

 const renderWithdrawHistoryView = () => (
 <WithdrawHistoryView 
 withdrawHistory={withdrawHistory}
 setShowWithdrawHistory={setShowWithdrawHistory}
 setSelectedWithdraw={setSelectedWithdraw}
 setShowWithdrawDetail={setShowWithdrawDetail}
 />
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
 className="fixed inset-0 z-[100] bg-zinc-50 flex flex-col p-6 overflow-y-auto"
 >
 <header className="flex items-center justify-between mb-8">
 <button onClick={() => setShowWithdrawDetail(false)} className="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center active:scale-90 transition-all">
 <Icon name="arrow_back" className="text-zinc-900" />
 </button>
 <div className="text-center">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em]">Detalhamento</p>
 <h2 className="text-xl font-black text-zinc-900">Fluxo de Saque</h2>
 </div>
 <div className="size-12" />
 </header>

 <div className="space-y-6">
 {/* Main Clay Card */}
 <div className="bg-white rounded-xl p-8 border border-zinc-100 relative overflow-hidden group " >
 <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-3xl -mr-16 -mt-16 rounded-full" />
 
 <div className="flex flex-col items-center text-center space-y-4 mb-8">
 <div className={`size-20 rounded-[30px] flex items-center justify-center border ${
 tx.status === 'concluido' ? 'bg-emerald-50 border-emerald-100' : 
 tx.status === 'recusado' ? 'bg-rose-50 border-rose-100' :
 'bg-yellow-50 border-yellow-100'
 }`}>
 <Icon 
 name={tx.status === 'concluido' ? 'verified' : tx.status === 'recusado' ? 'close' : 'sync'} 
 size={36} 
 className={tx.status === 'concluido' ? 'text-emerald-500' : tx.status === 'recusado' ? 'text-rose-500' : 'text-yellow-600'} 
 />
 </div>
 <div>
 <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${
 tx.status === 'concluido' ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 
 tx.status === 'recusado' ? 'text-rose-600 bg-rose-50 border-rose-100' :
 'text-yellow-700 bg-yellow-50 border-yellow-100'
 }`}>
 {tx.status === 'concluido' ? 'Pago com Sucesso' : tx.status === 'recusado' ? 'Saque Recusado' : 'Aguardando Processamento'}
 </span>
 </div>
 </div>

 <div className="space-y-4 bg-zinc-100/50 rounded-xl p-6 border border-zinc-100 ">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">ID Transação</span>
 <span className="text-[10px] font-mono text-zinc-900">#{tx.id.slice(0, 12).toUpperCase()}</span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Data e Hora</span>
 <span className="text-[10px] font-bold text-zinc-900 uppercase">
 {new Date(tx.created_at).toLocaleDateString('pt-BR')} às {new Date(tx.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
 </span>
 </div>
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Método</span>
 <span className="text-[10px] font-bold text-zinc-900 uppercase">PIX</span>
 </div>
 <div className="w-full h-[1px] bg-zinc-200" />
 <div className="flex flex-col gap-1">
 <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Chave PIX Utilizada</span>
 <span className="text-xs font-black text-zinc-900 truncate">{pixKey || 'Chave não registrada'}</span>
 </div>
 </div>
 </div>

 {/* Breakdown Card */}
 <div className="bg-white rounded-xl p-8 border border-zinc-100 space-y-6">
 <h3 className="text-sm font-black text-zinc-900 uppercase tracking-widest flex items-center gap-2">
 <Icon name="analytics" size={16} className="text-primary" />
 Valores e Taxas
 </h3>

 <div className="space-y-4">
 <div className="flex justify-between items-center">
 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Valor Bruto</span>
 <span className="text-sm font-black text-zinc-900">R$ {grossAmount.toFixed(2).replace('.', ',')}</span>
 </div>
 
 {feeAmount > 0 && (
 <div className="flex justify-between items-center">
 <div className="flex items-center gap-2">
 <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Taxa de Saque</span>
 <span className="text-[8px] font-black text-rose-500/50 border border-rose-500/20 px-2 py-0.5 rounded-full">{feePercent}%</span>
 </div>
 <span className="text-sm font-black text-rose-500">- R$ {feeAmount.toFixed(2).replace('.', ',')}</span>
 </div>
 )}

 <div className="w-full h-[1px] bg-zinc-200" />

 <div className="flex justify-between items-end pt-2">
 <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Valor Líquido</span>
 <span className="text-3xl font-black text-primary drop-">
 R$ {netAmount.toFixed(2).replace('.', ',')}
 </span>
 </div>
 </div>
 </div>

 {/* Receipt Button */}
 {tx.receipt_url && (
 <motion.button 
 whileTap={{ scale: 0.95 }}
 onClick={() => {
 setSelectedReceiptUrl(tx.receipt_url);
 setShowReceipt(true);
 }}
 className="w-full py-6 rounded-[30px] bg-zinc-900 text-white font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 transition-colors"
 >
 <Icon name="description" size={20} />
 Ver Comprovante Oficial
 </motion.button>
 )}
 </div>

 <p className="mt-8 text-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
 Izi Delivery Financial Security
 </p>
 </motion.div>
 );
 };

 const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
 const file = event.target.files?.[0];
 if (!file) return;

 const driverId = localStorage.getItem('izi_driver_uid');
 if (!driverId) {
 console.error('[AVATAR] DriverId não encontrado');
 toastError('Erro de autenticação. Tente deslogar e logar novamente.');
 return;
 }

 // Limite de 5MB
 if (file.size > 5 * 1024 * 1024) {
 toastError('A imagem deve ter no máximo 5MB.');
 return;
 }

 setIsUploadingAvatar(true);
 console.log('[AVATAR] Preparando upload...', { name: file.name, size: file.size, type: file.type });

 try {
 // Conversão de arquivo para ArrayBuffer/Blob
 let arrayBuffer: ArrayBuffer;
 if (typeof file.arrayBuffer === 'function') {
 try {
 arrayBuffer = await file.arrayBuffer();
 } catch (e) {
 arrayBuffer = await new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result as ArrayBuffer);
 reader.onerror = reject;
 reader.readAsArrayBuffer(file);
 });
 }
 } else {
 arrayBuffer = await new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result as ArrayBuffer);
 reader.onerror = reject;
 reader.readAsArrayBuffer(file);
 });
 }

 const blob = new Blob([arrayBuffer], { type: file.type });
 const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
 const fileName = `${Date.now()}-avatar.${ext}`;
 const path = `drivers/${driverId}/${fileName}`;

 const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
 const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
 
 // Recuperar JWT para autenticação manual via fetch
 let authToken = supabaseKey;
 try {
 for (let i = 0; i < localStorage.length; i++) {
 const k = localStorage.key(i);
 if (k && k.includes('auth-token')) {
 const d = JSON.parse(localStorage.getItem(k) || '{}');
 if (d.access_token) authToken = d.access_token;
 }
 }
 } catch (e) {}

 const uploadUrl = `${supabaseUrl}/storage/v1/object/avatars/${path}`;

 // 1. Upload do Arquivo (Timeout estendido para 45s para fotos)
 const res = await iziFetch(uploadUrl, {
 method: 'POST',
 headers: {
 'apikey': supabaseKey,
 'Authorization': `Bearer ${authToken}`,
 'Content-Type': file.type,
 'x-upsert': 'true'
 },
 body: blob,
 timeoutMs: 45000
 });
 
 if (!res.ok) {
 const errorJson = await res.json().catch(() => ({ message: 'Erro no servidor de storage' }));
 throw new Error(errorJson.message || 'Falha no upload do arquivo');
 }
 
 const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
 const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`; 

 // 2. Atualização do Perfil no Banco
 const dbUrl = `${supabaseUrl}/rest/v1/drivers_delivery?id=eq.${driverId}`;
 const dbRes = await iziFetch(dbUrl, {
 method: 'PATCH',
 headers: {
 'apikey': supabaseKey,
 'Authorization': `Bearer ${authToken}`,
 'Content-Type': 'application/json',
 'Prefer': 'return=minimal'
 },
 body: JSON.stringify({ avatar_url: publicUrl })
 });

 if (!dbRes.ok) throw new Error('Falha ao atualizar perfil no banco de dados');

 // 3. Atualização do Estado Local
 setDriverAvatar(publicUrl);
 localStorage.setItem('izi_driver_avatar', publicUrl);
 toastSuccess('Foto de perfil atualizada!');
 } catch (err: any) {
 console.error('[AVATAR] Erro:', err);
 toastError(`Erro ao enviar foto: ${err.message || 'Tente novamente.'}`);
 } finally {
 setIsUploadingAvatar(false);
 if (event.target) event.target.value = '';
 }
 };

 // renderProfileView extraído para componente ProfileView.tsx (performance: React.memo)

 const renderPlateEditView = () => {
 const nvVehicleOptions = [
 { id: 'mototaxi', icon: 'two_wheeler', label: 'Moto' },
 { id: 'carro', icon: 'directions_car', label: 'Carro' },
 { id: 'bicicleta', icon: 'pedal_bike', label: 'Bike' },
 { id: 'fiorino', icon: 'airport_shuttle',label: 'Fiorino' },
 { id: 'caminhonete', icon: 'rv_hookup', label: 'Pickup' },
 { id: 'van', icon: 'directions_bus', label: 'Van' },
 { id: 'vuc', icon: 'local_shipping', label: 'VUC' },
 { id: 'bau_p', icon: 'inventory_2', label: 'Baú P' },
 { id: 'bau_m', icon: 'inventory_2', label: 'Baú M' },
 { id: 'bau_g', icon: 'inventory_2', label: 'Baú G' },
 ];
 const nvNeedsPlate = newVehicleType !== 'bicicleta';
 const nvCanSubmit = !!newVehicleType && !!newVehicleModel.trim() && (!nvNeedsPlate || newVehiclePlate.trim().length >= 7);
 
 return (
 <>
 <motion.div
 key="plate-edit-modal"
 initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
 className="fixed inset-0 z-[400] bg-zinc-50 flex flex-col no-scrollbar overflow-y-auto font-['Plus_Jakarta_Sans']"
 >
 <header className="sticky top-0 z-50 bg-white px-6 pt-12 pb-6 flex items-center justify-between border-b border-zinc-100 ">
 <button 
 onClick={() => setShowPlateModal(false)}
 className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-transform"
 >
 <Icon name="arrow_back" className="text-white" size={24} />
 </button>
 <div className="flex flex-col items-end">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Gestão</p>
 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Meus Veículos</h2>
 </div>
 </header>

 <div className="px-6 pt-8 pb-32 space-y-8">
 {/* SEÇÁO 1: VEÍCULO ATIVO */}
 <div className="space-y-4">
 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Veículo em Uso</h3>
 <div className="bg-zinc-900 rounded-xl p-6 text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-white/10 transition-all" />
 <div className="flex items-start justify-between relative z-10">
 <div className="space-y-4">
 <div className="size-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
 <Icon name={
 driverVehicle === 'mototaxi' ? 'two_wheeler' : 
 driverVehicle === 'carro' ? 'directions_car' : 
 driverVehicle === 'bicicleta' ? 'pedal_bike' : 'local_shipping'
 } size={28} className="text-white" />
 </div>
 <div>
 <h4 className="text-2xl font-black tracking-tighter leading-none">{driverVehicle === 'mototaxi' ? 'Moto' : driverVehicle === 'carro' ? 'Carro' : driverVehicle === 'bicicleta' ? 'Bike' : driverVehicle?.toUpperCase()}</h4>
 <p className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-1">{editProfileData.vehicle_model || 'Modelo não informado'}</p>
 </div>
 </div>
 <div className="bg-yellow-400 text-zinc-900 px-4 py-2 rounded-xl font-black text-xs tracking-tighter ">
 {driverPlate || 'SEM PLACA'}
 </div>
 </div>
 </div>
 </div>

 {/* SEÇÁO 2: OUTROS VEÍCULOS APROVADOS */}
 {myVehicles.filter(v => !v.is_active).length > 0 && (
 <div className="space-y-4">
 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Veículos Aprovados</h3>
 <div className="grid grid-cols-1 gap-3">
 {myVehicles.filter(v => !v.is_active).map(v => (
 <button 
 key={v.id}
 onClick={() => setActiveVehicle(v.id)}
 className="w-full bg-white border border-zinc-100 rounded-xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all hover:border-zinc-300"
 >
 <div className="flex items-center gap-4">
 <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
 <Icon name={v.vehicle_type === 'mototaxi' ? 'two_wheeler' : 'directions_car'} size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-black text-zinc-900 leading-none capitalize">{v.vehicle_type} ââ‚¬¢ {v.plate}</p>
 <p className="text-[10px] font-bold text-zinc-400 mt-1">{v.model}</p>
 </div>
 </div>
 <div className="px-3 py-1.5 bg-zinc-50 rounded-lg text-[9px] font-black text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all uppercase tracking-tighter">
 Ativar
 </div>
 </button>
 ))}
 </div>
 </div>
 )}

 {/* SEÇÁO 3: SOLICITAÇÕES PENDENTES */}
 {myVehicleRequests.length > 0 && (
 <div className="space-y-4">
 <h3 className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Em Análise</h3>
 <div className="grid grid-cols-1 gap-3">
 {myVehicleRequests.map(req => (
 <div key={req.id} className="w-full bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="size-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
 <Icon name="history" size={20} />
 </div>
 <div className="text-left">
 <p className="text-sm font-black text-amber-900 leading-none capitalize">{req.vehicle_type} ââ‚¬¢ {req.plate || 'Bike'}</p>
 <p className="text-[10px] font-bold text-amber-600/70 mt-1">{req.model}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
 <span className="text-[9px] font-black text-amber-600 uppercase tracking-tighter">Pendente</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* BOTÁO NOVO VEÍCULO */}
 <div className="pt-4">
 <button 
 onClick={() => setShowNewVehicleForm(true)}
 className="w-full h-20 bg-white border-2 border-dashed border-zinc-200 rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-zinc-100 group"
 >
 <div className="size-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white group-hover:scale-110 transition-transform">
 <Icon name="add" size={24} />
 </div>
 <span className="text-sm font-black text-zinc-900 uppercase tracking-widest">Novo Veículo</span>
 </button>
 </div>
 </div>
 </motion.div>

 {/* MODAL: Formulario de Novo Veiculo */}
 <AnimatePresence>
 {showNewVehicleForm && (
 <motion.div
 key="new-vehicle-modal"
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 className="fixed inset-0 z-[400] bg-black/50 flex items-end justify-center"
 onClick={() => setShowNewVehicleForm(false)}
 >
 <motion.div
 initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
 transition={{ type: 'spring', damping: 26, stiffness: 300 }}
 className="w-full max-w-lg bg-white rounded-t-[40px] p-6 space-y-5 max-h-[90vh] overflow-y-auto"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto" />
 <div className="flex items-center justify-between">
 <div>
 <p className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.3em]">Cadastro</p>
 <h3 className="text-xl font-black text-zinc-900 tracking-tighter">Novo Veículo</h3>
 </div>
 <button onClick={() => setShowNewVehicleForm(false)} className="size-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center active:scale-95">
 <Icon name="close" className="text-zinc-400" />
 </button>
 </div>
 <p className="text-[10px] text-zinc-400 font-bold leading-relaxed bg-blue-50 border border-blue-100 rounded-xl p-4">
 <span className="text-blue-600">ℹ️</span> Após o envio, o Admin irá avaliar seu veículo. Quando aprovado, você poderá ativá-lo para receber chamadas compatíveis.
 </p>
 <div className="space-y-3">
 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
 <Icon name="directions_car" size={13} className="text-zinc-300" /> Tipo de Veículo
 </label>
 <div className="grid grid-cols-5 gap-2">
 {nvVehicleOptions.map((v) => (
 <button key={v.id} onClick={() => setNewVehicleType(v.id)}
 className={`h-20 rounded-xl flex flex-col items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-wide transition-all border ${
 newVehicleType === v.id
 ? 'bg-yellow-400 text-zinc-900 border-yellow-300 scale-105 '
 : 'bg-zinc-50 text-zinc-400 border-zinc-100 hover:bg-zinc-100'
 }`}>
 <Icon name={v.icon} size={20} className={newVehicleType === v.id ? 'text-zinc-900' : 'text-zinc-300'} />
 {v.label}
 </button>
 ))}
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
 <Icon name="drive_eta" size={13} className="text-zinc-300" /> Modelo
 </label>
 <input type="text" value={newVehicleModel} onChange={(e) => setNewVehicleModel(e.target.value)}
 placeholder="Ex: Honda CG 160, VW Gol, Ford Transit..."
 className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-xl px-5 text-zinc-900 font-bold text-sm placeholder:text-zinc-300 focus:ring-2 focus:ring-yellow-400/30 outline-none transition-all" />
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
 <Icon name="palette" size={13} className="text-zinc-300" /> Cor
 </label>
 <input type="text" value={newVehicleColor} onChange={(e) => setNewVehicleColor(e.target.value)}
 placeholder="Ex: Preto, Branco, Prata..."
 className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-xl px-5 text-zinc-900 font-bold text-sm placeholder:text-zinc-300 focus:ring-2 focus:ring-yellow-400/30 outline-none transition-all" />
 </div>
 {nvNeedsPlate && (
 <div className="space-y-2">
 <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-2">
 <Icon name="tag" size={13} className="text-zinc-300" /> Placa
 </label>
 <input type="text" value={newVehiclePlate}
 onChange={(e) => setNewVehiclePlate(e.target.value.toUpperCase())}
 placeholder="ABC1234 ou ABC1D23" maxLength={8}
 className="w-full h-14 bg-zinc-50 border border-zinc-100 rounded-xl px-5 text-zinc-900 font-bold text-sm placeholder:text-zinc-300 focus:ring-2 focus:ring-yellow-400/30 outline-none transition-all uppercase" />
 </div>
 )}
 <button onClick={handleSubmitNewVehicle} disabled={!nvCanSubmit || isSavingNewVehicle}
 className={`w-full h-16 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${
 nvCanSubmit && !isSavingNewVehicle
 ? 'bg-yellow-400 text-zinc-900 hover:scale-[1.02] active:scale-95'
 : 'bg-zinc-100 text-zinc-300 cursor-not-allowed'
 }`}>
 {isSavingNewVehicle ? <Icon name="sync" className="animate-spin" size={18} /> : <Icon name="send" size={18} />}
 {isSavingNewVehicle ? 'Enviando...' : 'Enviar para Avaliação'}
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 );
 };

 const renderProfileNotFoundView = () => {
 return (
 <motion.div 
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-white px-8 text-center"
 >
 <div className="size-32 rounded-xl bg-rose-50 flex items-center justify-center mb-8 ">
 <Icon name="person_off" size={64} className="text-rose-500" />
 </div>
 
 <h2 className="text-3xl font-black text-zinc-900 tracking-tighter uppercase leading-tight mb-4">
 Acesso <span className="text-rose-500">Restrito</span>
 </h2>
 
 <p className="text-zinc-400 font-bold text-sm leading-relaxed mb-10 max-w-xs">
 Não encontramos um perfil de entregador ativo para o e-mail <span className="text-zinc-900 font-black">{localStorage.getItem('izi_auth_email') || 'vinculado'}</span>. 
 <br /><br />
 Se você já enviou seus documentos, aguarde a aprovação. Caso contrário, cadastre-se no app principal.
 </p>

 <div className="w-full space-y-4">
 <button 
 onClick={() => {
 setIsProfileNotFound(false);
 setShowOnboarding(true);
 }}
 className="w-full h-16 rounded-[28px] bg-yellow-400 text-zinc-900 font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
 >
 <Icon name="verified" /> Concluir Cadastro
 </button>

 <button 
 onClick={() => window.open('https://wa.me/5531995610728', '_blank')}
 className="w-full h-16 rounded-[28px] bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
 >
 <Icon name="support_agent" /> Falar com Suporte
 </button>
 
 <button 
 onClick={async () => {
 if (await showConfirm({ 
 title: 'Sair da Conta', 
 message: 'Deseja realmente encerrar sua sessão?',
 confirmLabel: 'Sair Agora',
 danger: true
 })) {
 handleLogout();
 }
 }}
 className="w-full h-16 rounded-[28px] bg-white border border-zinc-100 text-zinc-400 font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all flex items-center justify-center gap-3"
 >
 <Icon name="logout" /> Sair da Conta
 </button>
 </div>
 </motion.div>
 );
 };

 const renderSystemPopup = () => (
 <AnimatePresence>
 {systemPopup && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[1000] bg-zinc-900/60 flex items-center justify-center p-6"
 onClick={() => {
 if (systemPopup.onClose) systemPopup.onClose();
 setSystemPopup(null);
 }}
 >
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-sm bg-white rounded-xl p-10 flex flex-col items-center text-center relative overflow-hidden"
 onClick={e => e.stopPropagation()}
 >
 {/* Background Decor */}
 <div className={`absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full -mr-16 -mt-16 ${
 systemPopup.type === 'success' ? 'bg-emerald-500/10' : 
 systemPopup.type === 'error' ? 'bg-red-500/10' : 'bg-yellow-400/10'
 }`} />
 
 <div className={`size-24 rounded-xl flex items-center justify-center mb-8 relative ${
 systemPopup.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/20' : 
 systemPopup.type === 'error' ? 'bg-red-500 shadow-red-500/20' : 'bg-yellow-400 shadow-yellow-400/20'
 }`}>
 <motion.span 
 initial={{ scale: 0 }}
 animate={{ scale: 1 }}
 transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.2 }}
 className="material-symbols-outlined text-5xl text-white"
 >
 {systemPopup.type === 'success' ? 'check_circle' : 
 systemPopup.type === 'error' ? 'cancel' : 'info'}
 </motion.span>
 </div>

 <h2 className="text-2xl font-black text-zinc-900 leading-tight mb-4 uppercase tracking-tighter">
 {systemPopup.title}
 </h2>
 
 <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-10">
 {systemPopup.message}
 </p>

 <button
 onClick={() => {
 if (systemPopup.onClose) systemPopup.onClose();
 setSystemPopup(null);
 }}
 className={`w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all ${
 systemPopup.type === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/30' : 
 systemPopup.type === 'error' ? 'bg-red-500 text-white shadow-red-500/30' : 
 'bg-yellow-400 text-black shadow-yellow-400/30'
 }`}
 >
 Entendido
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );
 // renderPersonalDataModal extraído para componente PersonalDataModal.tsx
 // renderBankDetailsView extraído para componente BankDetailsModal.tsx

 const renderPendingApprovalModal = () => (
 <AnimatePresence>
 {showPendingApprovalModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[180] bg-zinc-900/60 flex items-center justify-center p-6"
 onClick={() => setShowPendingApprovalModal(false)}
 >
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-sm bg-white rounded-xl p-10 flex flex-col items-center text-center relative overflow-hidden"
 onClick={e => e.stopPropagation()}
 >
 {/* Background Decor */}
 <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl rounded-full -mr-16 -mt-16" />
 
 <div className="size-24 rounded-xl bg-yellow-400 flex items-center justify-center mb-8 shadow-yellow-400/20 relative">
 <motion.span 
 animate={{ rotate: [0, 10, -10, 0] }}
 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
 className="material-symbols-outlined text-5xl text-black"
 >
 hourglass_empty
 </motion.span>
 <div className="absolute -bottom-2 -right-2 size-10 rounded-2xl bg-white flex items-center justify-center border border-zinc-100">
 <span className="material-symbols-outlined text-zinc-900 text-xl font-black">verified_user</span>
 </div>
 </div>

 <h2 className="text-2xl font-black text-zinc-900 leading-tight mb-4 uppercase tracking-tighter">
 Cadastro em Análise
 </h2>
 
 <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-10">
 Sua conta está sendo verificada pela nossa equipe. Você receberá uma notificação assim que for aprovado para realizar entregas.
 </p>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 );

 const renderHelpModal = () => {
 const supportPhone = '5531995610728';
 const activeCustomerPhone = activeMission?.customer_phone || activeMission?.phone;
 const activeCustomerName = activeMission?.user_name || activeMission?.customer || 'Cliente';

 return (
 <motion.div 
 key="help-modal"
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 className="fixed inset-0 z-[400] bg-white flex flex-col no-scrollbar overflow-y-auto font-['Plus_Jakarta_Sans']"
 >
 <div className="sticky top-0 z-50 bg-white px-6 pt-12 pb-6 flex items-center justify-between border-b border-zinc-100">
 <button 
 onClick={() => setShowHelpModal(false)}
 className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-transform"
 >
 <Icon name="arrow_back" className="text-white" size={24} />
 </button>
 <div className="flex flex-col items-end">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Suporte</p>
 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Ajuda</h2>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto px-6 py-10 space-y-12 no-scrollbar">
 <div className="space-y-2">
 <h3 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">Central de Ajuda</h3>
 <p className="text-[11px] text-zinc-400 font-bold leading-relaxed max-w-xs">
 Estamos aqui para ajudar você com qualquer problema.
 </p>
 </div>

 {/* Suporte Izi */}
 <div className="space-y-8">
 <div className="space-y-6">
 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Suporte Izi</h4>
 <button 
 onClick={() => window.open(`https://wa.me/${supportPhone}`, '_blank')}
 className="w-full flex items-center justify-between py-6 border-b border-zinc-50 active:opacity-60 transition-opacity"
 >
 <div className="flex items-center gap-5">
 <div className="size-14 rounded-2xl bg-zinc-900 flex items-center justify-center ">
 <Icon name="support_agent" className="text-white text-2xl" />
 </div>
 <div className="text-left">
 <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Administração Izi</p>
 <p className="text-[10px] font-bold text-zinc-400 mt-1">Falar via WhatsApp</p>
 </div>
 </div>
 <Icon name="chevron_right" className="text-zinc-200" />
 </button>
 </div>
 </div>

 {/* Contato com Usuários */}
 <div className="space-y-8">
 <div className="space-y-6">
 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Contatos da Missão</h4>
 {activeMission ? (
 <div className="divide-y divide-zinc-50">
 {activeCustomerPhone && (
 <button 
 onClick={() => {
 const cleanPhone = String(activeCustomerPhone).replace(/\D/g, '');
 const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
 window.open(`https://wa.me/${finalPhone}`, '_blank');
 }}
 className="w-full flex items-center justify-between py-6 active:opacity-60 transition-opacity"
 >
 <div className="flex items-center gap-5">
 <div className="size-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
 <Icon name="chat" className="text-zinc-900 text-2xl" />
 </div>
 <div className="text-left">
 <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Chat com Cliente</p>
 <p className="text-[10px] font-bold text-zinc-400 mt-1">{activeCustomerName}</p>
 </div>
 </div>
 <Icon name="chevron_right" className="text-zinc-200" />
 </button>
 )}
 {activeMission.merchant_phone && (
 <button 
 onClick={() => {
 const cleanPhone = String(activeMission.merchant_phone).replace(/\D/g, '');
 const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
 window.open(`https://wa.me/${finalPhone}`, '_blank');
 }}
 className="w-full flex items-center justify-between py-6 active:opacity-60 transition-opacity"
 >
 <div className="flex items-center gap-5">
 <div className="size-14 rounded-2xl bg-zinc-100 flex items-center justify-center">
 <Icon name="storefront" className="text-zinc-900 text-2xl" />
 </div>
 <div className="text-left">
 <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">Suporte do Parceiro</p>
 <p className="text-[10px] font-bold text-zinc-400 mt-1">{activeMission.merchant_name || 'Loja Parceira'}</p>
 </div>
 </div>
 <Icon name="chevron_right" className="text-zinc-200" />
 </button>
 )}
 </div>
 ) : (
 <div className="py-10 text-center space-y-4">
 <div className="size-16 rounded-xl bg-zinc-50 flex items-center justify-center mx-auto border border-zinc-100">
 <Icon name="history" className="text-zinc-200" size={32} />
 </div>
 <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] px-4 leading-relaxed">
 Nenhuma missão ativa.<br />Contatos aparecem aqui nas entregas.
 </p>
 </div>
 )}
 </div>
 </div>

 {/* FAQ */}
 <div className="space-y-8 pb-10">
 <div className="space-y-6">
 <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Perguntas Frequentes</h4>
 <div className="divide-y divide-zinc-50">
 {[
 { q: 'Como recebo meus ganhos?', a: 'Os ganhos são creditados na sua conta Izi e podem ser sacados via PIX instantaneamente após a conclusão.' },
 { q: 'Problemas na entrega?', a: 'Se não conseguir localizar o cliente ou encontrar o endereço, entre em contato com o suporte imediatamente.' },
 { q: 'Mudança de veículo?', a: 'Para trocar de veículo, acesse "Veículo & Placa" e envie a solicitação de alteração.' }
 ].map((faq, i) => (
 <div key={i} className="py-6 space-y-2">
 <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">{faq.q}</p>
 <p className="text-[11px] text-zinc-400 leading-relaxed font-bold">{faq.a}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </motion.div>
 );
 };

 const renderPreferencesView = () => {
 const MinimalToggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
 <button
 onClick={onToggle}
 className={`relative w-12 h-6 rounded-full transition-all duration-300 flex-shrink-0 ${
 enabled ? 'bg-zinc-900' : 'bg-zinc-200'
 }`}
 >
 <div className={`absolute top-1 size-4 rounded-full transition-all duration-300 ${
 enabled ? 'left-7 bg-white' : 'left-1 bg-white'
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
 const myVehicle = driverVehicle?.toLowerCase() || 'moto';
 const allowedServices = VEHICLE_COMPATIBILITY[myVehicle] || [];

 if (!allowedServices.includes(key)) {
 toastError("Este serviço não está disponível para suas categorias de veículos selecionadas");
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
 initial={{ x: '100%' }}
 animate={{ x: 0 }}
 exit={{ x: '100%' }}
 className="fixed inset-0 z-[400] bg-white flex flex-col overflow-hidden font-['Plus_Jakarta_Sans']"
 >
 <header className="sticky top-0 z-50 bg-white px-6 pt-12 pb-6 flex items-center justify-between border-b border-zinc-100 flex-shrink-0">
 <button
 onClick={() => setShowPreferences(false)}
 className="size-11 rounded-2xl bg-zinc-900 flex items-center justify-center active:scale-90 transition-transform"
 >
 <Icon name="arrow_back" className="text-white" size={24} />
 </button>
 <div className="flex flex-col items-end">
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Ajustes</p>
 <h2 className="text-lg font-black text-zinc-900 uppercase tracking-tighter">Preferências</h2>
 </div>
 </header>

 <div className="flex-1 overflow-y-auto no-scrollbar px-6 pt-10 pb-32 space-y-12">
 <div className="space-y-2">
 <h3 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">Minhas Preferências</h3>
 <p className="text-[11px] text-zinc-400 font-bold leading-relaxed max-w-xs">
 Personalize sua experiência de trabalho.
 </p>
 </div>

 {/* Notificações */}
 <div className="space-y-8">
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Notificações</h3>
 <div className="flex items-center justify-between py-2">
 <div>
 <p className="text-sm font-bold text-zinc-900">Sons de Pedidos</p>
 <p className="text-[10px] text-zinc-400 mt-0.5">Alerta sonoro ao receber novas missões</p>
 </div>
 <MinimalToggle enabled={prefSoundEnabled} onToggle={() => {
 const v = !prefSoundEnabled;
 setPrefSoundEnabled(v);
 savePreference('pref_sound', String(v));
 }} />
 </div>
 <div className="flex items-center justify-between px-6 py-5">
 <div>
 <p className="text-sm font-bold text-zinc-900">Vibração</p>
 <p className="text-[10px] text-zinc-400 mt-0.5">Vibrar ao receber pedido ou atualização</p>
 </div>
 <MinimalToggle enabled={prefVibrationEnabled} onToggle={() => {
 const v = !prefVibrationEnabled;
 setPrefVibrationEnabled(v);
 savePreference('pref_vibration', String(v));
 }} />
 </div>
 </div>
 </div>

 {/* Navegação */}
 <div className="space-y-8">
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">App de Navegação</h3>
 <div className="grid grid-cols-1 gap-3">
 {[
 { key: 'google', label: 'Google Maps', sub: 'Recomendado' },
 { key: 'waze', label: 'Waze', sub: 'Trânsito em tempo real' },
 { key: 'apple', label: 'Apple Maps', sub: 'Apenas iOS' },
 ].map(nav => (
 <button
 key={nav.key}
 onClick={() => { setPrefNavApp(nav.key as any); savePreference('pref_nav_app', nav.key); }}
 className={`w-full flex items-center justify-between p-5 rounded-3xl transition-all border-2 ${
 prefNavApp === nav.key
 ? 'bg-zinc-900 border-zinc-900 text-white scale-[1.02]'
 : 'bg-white border-zinc-100 text-zinc-400 hover:border-zinc-200'
 }`}
 >
 <div className="flex flex-col items-start text-left">
 <span className="text-sm font-bold">{nav.label}</span>
 <span className="text-[10px] opacity-60 font-medium">{nav.sub}</span>
 </div>
 {prefNavApp === nav.key && <Icon name="check_circle" size={20} className="text-white" />}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Serviços de Entrega */}
 <div className="space-y-8">
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Serviços</h3>
 <div className="flex items-center justify-between py-2">
 <div>
 <p className="text-sm font-bold text-zinc-900">Aceitar Todos os Serviços</p>
 <p className="text-[10px] text-zinc-400 mt-0.5">Restaurantes, Mercados, Farmácias...</p>
 </div>
 <MinimalToggle enabled={allServicesEnabled} onToggle={toggleAllServices} />
 </div>
 </div>
 </div>

 {/* Mobilidade */}
 <div className="space-y-8">
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Mobilidade</h3>
 <div className="divide-y divide-zinc-50">
 {mobilityOptions
 .filter(mob => (VEHICLE_COMPATIBILITY[driverVehicle?.toLowerCase() || 'moto'] || []).includes(mob.key))
 .map(mob => {
 const active = prefServiceTypes.includes(mob.key);
 return (
 <div key={mob.key} className="flex items-center justify-between py-5">
 <div>
 <p className="text-sm font-bold text-zinc-900">{mob.label}</p>
 <p className="text-[10px] text-zinc-400">{mob.sub}</p>
 </div>
 <MinimalToggle enabled={active} onToggle={() => toggleMobility(mob.key)} />
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Raio Máximo */}
 <div className="space-y-8 pb-10">
 <div className="space-y-6">
 <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Raio de Atuação</h3>
 <div className="space-y-6">
 <div className="flex items-end justify-between">
 <p className="text-4xl font-black text-zinc-900 tracking-tighter">{prefMaxRadius}km</p>
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Distância Máxima</p>
 </div>
 <input
 type="range"
 min="1"
 max="30"
 step="1"
 value={prefMaxRadius}
 onChange={(e) => {
 const v = e.target.value;
 setPrefMaxRadius(Number(v));
 savePreference('pref_max_radius', v);
 }}
 className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
 />
 </div>
 </div>
 </div>

 </div>
 </motion.div>
 );
 };

 const getStatusLabel = (status: string) => {
 switch(status?.toLowerCase()) {
 case 'saiu_para_coleta': case 'a_caminho_coleta': return { label: 'Indo retirar', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'navigation' };
 case 'no_local_coleta': case 'chegou_coleta': return { label: 'No local', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'location_on' };
 case 'preparando': case 'no_preparo': return { label: 'Em preparo', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: 'soup_kitchen' };
 case 'pronto': return { label: 'Pronto!', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'check_circle' };
 case 'picked_up': return { label: 'Coletado', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'package_2' };
 case 'a_caminho': case 'em_rota': return { label: 'Em rota', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: 'moped' };
 case 'no_local': return { label: 'No destino', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'person_pin_circle' };
 default: return { label: 'Em andamento', color: 'text-zinc-400', bg: 'bg-zinc-100', icon: 'radar' };
 }
 };

 const renderActiveMissionView = () => {
 // TELA DE SELEÇÁO: Se não tem missão selecionada, mostra a lista de missões ativas
 if (!activeMission) {
 // Se tem missões ativas no array, mostra os cards de seleção
 if (activeMissions.length > 0) {
 return (
 <motion.div key="mission-selector" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col bg-zinc-50 pt-14 pb-36 px-4 font-['Plus_Jakarta_Sans'] overflow-y-auto">
 <div className="flex items-center gap-3 mb-6">
 <button onClick={() => setActiveTab('dashboard')} className="size-10 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center">
 <Icon name="arrow_back" size={20} className="text-zinc-400" />
 </button>
 <div>
 <h2 className="text-lg font-black text-zinc-900 tracking-tight">Missões Ativas</h2>
 <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">{activeMissions.length} missão(ões) em andamento</p>
 </div>
 </div>

 <div className="space-y-3">
 {activeMissions.map((m, idx) => {
 const st = getStatusLabel(m.status || '');
 const storeName = (m as any).merchant_name || (m as any).store_name || 'Loja Parceira';
 const pickupAddr = cleanAddressText((m as any).pickup_address || (m as any).origin || '');
 return (
 <motion.button
 key={m.realId || m.id}
 whileTap={{ scale: 0.97 }}
 onClick={() => {
 setActiveMission(m);
 localStorage.setItem('Izi_active_mission', JSON.stringify(m));
 }}
 className="w-full p-5 rounded-[28px] bg-white border border-zinc-100 text-left flex items-start gap-4 transition-all active:bg-zinc-50"
 >
 {/* Ícone de status */}
 <div className={`size-14 rounded-2xl ${st.bg} flex items-center justify-center shrink-0`}>
 <Icon name={st.icon} size={28} className={st.color} />
 </div>
 
 {/* Info */}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-1">
 <span className={`text-[9px] font-black uppercase tracking-widest ${st.color}`}>{st.label}</span>
 <span className="text-[9px] text-zinc-200">ââ‚¬¢</span>
 <span className="text-[9px] text-zinc-400 font-bold">#{(m.realId || m.id || '').slice(0,6)}</span>
 </div>
 <p className="text-sm font-black text-zinc-950 truncate">{storeName}</p>
 <p className="text-[11px] text-zinc-950 font-black truncate mt-0.5">{pickupAddr || 'Endereço da Loja'}</p>
 <div className="flex items-center gap-3 mt-2">
 <span className="text-sm font-black text-yellow-600">R$ {Number((m as any).price || (m as any).total_price || 0).toFixed(2)}</span>
 <span className="text-[9px] text-zinc-950 uppercase font-black">{serviceTypeLabel((m as any).service_type || (m as any).type)}</span>
 </div>
 </div>

 {/* Seta */}
 <div className="size-10 rounded-xl bg-yellow-400 flex items-center justify-center shrink-0 self-center">
 <Icon name="arrow_forward" size={20} className="text-zinc-950" />
 </div>
 </motion.button>
 );
 })}
 </div>

 <button 
 onClick={() => { syncMissionWithDB(); toastSuccess("Sincronizando..."); }}
 disabled={isSyncingMission}
 className="mt-6 h-14 bg-white border border-zinc-100 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-xl w-full active:scale-95 transition-all flex items-center justify-center gap-3"
 >
 {isSyncingMission ? <Icon name="sync" className="animate-spin text-yellow-600" size={18} /> : <Icon name="cloud_sync" size={18} />}
 {isSyncingMission ? 'Sincronizando...' : 'Atualizar Lista'}
 </button>
 </motion.div>
 );
 }

 // Sem missões — tela vazia
 return (
 <motion.div key="active-mission-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center p-10 text-center font-['Plus_Jakarta_Sans'] bg-zinc-50">
 <div className="size-28 rounded-[45px] bg-white border border-zinc-100 flex items-center justify-center mb-8 ">
 <Icon name="route" size={48} className="text-zinc-300" />
 </div>
 <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase mb-2">Sem Missões Ativas</h2>
 <p className="text-sm text-zinc-500 leading-relaxed mb-10 max-w-xs font-medium">Você não possui nenhuma corrida em andamento. Vá ao Dashboard para aceitar novos desafios e lucrar.</p>
 
 <div className="flex flex-col gap-4 w-full max-w-xs">
 <button 
 onClick={() => setActiveTab('dashboard')}
 className="h-18 bg-yellow-400 text-zinc-950 font-black text-[11px] uppercase tracking-[0.25em] rounded-[30px] w-full active:scale-95 transition-all flex items-center justify-center gap-3 py-5"
 >
 <Icon name="grid_view" size={18} />
 Ir para Dashboard
 </button>
 <button 
 onClick={() => { syncMissionWithDB(); toastSuccess("Sincronizando com o servidor..."); }}
 disabled={isSyncingMission}
 className="h-16 bg-white border border-zinc-100 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] rounded-[28px] w-full active:scale-95 transition-all flex items-center justify-center gap-3"
 >
 {isSyncingMission ? <Icon name="sync" className="animate-spin text-yellow-600" /> : <Icon name="cloud_sync" />}
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
 case 'a_caminho_coleta': return { label: 'Indo retirar', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'navigation', glow: '' };
 case 'no_local_coleta':
 case 'chegou_coleta': return { label: 'No local de coleta', color: 'text-amber-500', bg: 'bg-amber-500/10', icon: 'location_on', glow: '' };
 case 'preparando':
 case 'no_preparo': return { label: 'Em preparação', color: 'text-purple-500', bg: 'bg-purple-500/10', icon: 'soup_kitchen', glow: '' };
 case 'pronto': return { label: 'Pronto para retirada', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'check_circle', glow: '' };
 case 'picked_up': return { label: 'Pedido coletado', color: 'text-emerald-500', bg: 'bg-emerald-500/10', icon: 'package_2', glow: '' };
 case 'a_caminho': 
 case 'em_rota': return { label: 'Em rota de entrega', color: 'text-yellow-500', bg: 'bg-yellow-500/10', icon: 'moped', glow: '' };
 case 'no_local': return { label: 'No destino final', color: 'text-blue-500', bg: 'bg-blue-500/10', icon: 'person_pin_circle', glow: '' };
 default: return { label: 'Em andamento', color: 'text-zinc-400', bg: 'bg-zinc-100', icon: 'radar', glow: '' };
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


 // CASO TERMINAL: Se a missão já acabou mas ainda está na tela, o botão serve para fechar.
 if (['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'].includes(s)) {
 return { 
 label: 'Concluído ââ‚¬¢ Fechar', 
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
 
  if (isStartable) {
  // Para agendamentos, verificar se falta menos de 1h
  if (s === 'scheduled' || s === 'agendado' || s === 'agendamento') {
    const scheduledAt = activeMission.scheduled_at;
    if (scheduledAt) {
      const now = new Date();
      const scheduledDate = new Date(scheduledAt);
      const oneHourBefore = new Date(scheduledDate.getTime() - 60 * 60 * 1000);
      if (now.getTime() < oneHourBefore.getTime()) {
        const diffMs = oneHourBefore.getTime() - now.getTime();
        const diffH = Math.floor(diffMs / (1000 * 60 * 60));
        const diffM = Math.ceil((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const timeStr = diffH > 0 ? `${diffH}h ${diffM}min` : `${diffM} min`;
        return { label: `Bloqueado — faltam ${timeStr}`, action: () => toastError(`Início liberado 1h antes do agendamento (${scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}h)`), icon: 'schedule', disabled: true };
      }
    }
    return { label: 'Iniciar Missão', action: () => handleUpdateStatus('chegou_coleta'), icon: 'location_on' };
  }
  return { label: 'Cheguei na Coleta', action: () => handleUpdateStatus('chegou_coleta'), icon: 'location_on' };
  }
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

 return (
 <motion.div 
 key="active-mission-populated"
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 className="h-full flex flex-col overflow-hidden text-zinc-950 font-['Plus_Jakarta_Sans'] relative"
 >
 
 {/* 1. MAP SECTION (Fill available space) */}
 <div className="absolute inset-0 z-0">
 <MissionRouteMap 
 pickup={{ lat: Number(activeMission.pickup_lat), lng: Number(activeMission.pickup_lng) }}
 delivery={{ lat: Number(activeMission.delivery_lat), lng: Number(activeMission.delivery_lng) }}
 pickupAddress={pickupOnly}
 deliveryAddress={addressOnly}
 driverCoords={driverCoords}
 missionPhase={['picked_up', 'em_rota', 'a_caminho', 'saiu_para_entrega', 'no_local'].includes(activeMission.status) ? 'to_delivery' : 'to_pickup'}
 onRouteInfo={(info) => setRealTimeRoute(info)}
 isLoaded={isLoaded}
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
 localStorage.removeItem('Izi_active_mission');
 setActiveMission(null);
 }
 // Volta para o dashboard (minimiza a missão)
 setActiveTab('dashboard');
 }} 
 className="pointer-events-auto size-12 bg-white border border-zinc-200 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
 >
 <Icon name="arrow_back" className="text-yellow-600" size={20} />
 </motion.button>
 
 <div className="pointer-events-auto px-5 py-2 bg-white/60 rounded-full border border-white/50 flex items-center gap-2">
 <div className={`size-2 rounded-full animate-pulse ${statusDisplay.color.replace('text-', 'bg-')}`} />
 <span className="text-zinc-950 font-black tracking-widest text-[9px] uppercase leading-none">{statusDisplay.label}</span>
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
 className="pointer-events-auto size-12 bg-zinc-900 rounded-2xl flex items-center justify-center relative overflow-hidden"
 >
 <Icon name="map" className="text-yellow-400" size={22} />
 </motion.button>
 </header>

 {/* 3. IZI BOTTOM SHEET */}
 <IziBottomSheet snapPoints={["35vh", "65vh", "92vh"]} initialSnap={0}>
 <div className="px-6 space-y-6 pt-2 pb-8">
 
 {/* Status Imersivo - Clay Card */}
 <section className="bg-white border border-zinc-100 rounded-3xl p-6 flex flex-col gap-6 ">
 <div className="flex flex-col items-center gap-4 w-full text-center">
 <div className="size-16 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 flex items-center justify-center relative">
 {driverAvatar ? (
 <img src={driverAvatar} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <Icon name="person" size={32} className="text-zinc-200" />
 )}
 <div className="absolute inset-0 bg-gradient-to-t from-zinc-100/60 via-transparent to-transparent" />
 </div>
 <div className="flex-1 min-w-0">
 <h2 className="text-xl font-black text-zinc-950 truncate tracking-tighter leading-tight">{driverName.split(' ')[0]}</h2>
 <div className="flex items-center gap-2 mt-1">
 <div className="bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
 <div className="size-1.5 rounded-full bg-emerald-500" />
 <span className="text-emerald-600 font-black text-[8px] uppercase tracking-widest">{stats.level >= 10 ? 'Elite' : `Piloto`}</span>
 </div>
 <div className="bg-yellow-400/10 px-2 py-0.5 rounded-md border border-yellow-400/20 flex items-center gap-1">
 <Icon name="route" size={10} className="text-yellow-600" />
 <span className="text-yellow-600 font-black text-[8px] uppercase tracking-widest">
 {realTimeRoute ? realTimeRoute.distanceText : `${(parseFloat(activeMission.distance_km || '0')).toFixed(1)} KM`}
 </span>
 </div>
 </div>
 </div>
 <div className="text-right">
 <p className="text-zinc-950 text-[8px] uppercase tracking-[0.3em] font-black mb-1">XP HOJE</p>
 <p className="text-xl font-black text-yellow-600 tracking-tighter">+{Math.floor(driverEarnings)} pts</p>
 </div>
 </div>
 
 <div className="h-px bg-zinc-100 w-full" />
 
 <div className="flex justify-between items-center bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
 <div className="flex items-center gap-3">
 <div className={`p-2 rounded-xl bg-white ${statusDisplay.color} ${statusDisplay.glow}`}>
 <Icon name={statusDisplay.icon} size={20} />
 </div>
 <span className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.2em]">{statusDisplay.label}</span>
 </div>
 <div className="flex flex-col items-end">
 <span className="text-yellow-600 font-black text-xs">{realTimeRoute?.durationText || '-- min'}</span>
 <span className="text-[8px] font-black text-zinc-950 uppercase tracking-widest">Estimado</span>
 </div>
 </div>
 </section>

 {/* === ENDEREÇOS DE COLETA E ENTREGA === */}
 <section className="bg-white border border-zinc-100 rounded-3xl overflow-hidden ">
 <div className="px-5 py-3 border-b border-zinc-100 flex items-center justify-between">
 <h2 className="text-zinc-950 font-black text-[10px] uppercase tracking-[0.4em]">Rota da Missão</h2>
 <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{realTimeRoute?.distanceText || (activeMission.distance_km ? `${parseFloat(activeMission.distance_km).toFixed(1)} km` : '-- km')}</span>
 </div>

 {/* Ponto de Coleta */}
 <div className="flex items-start gap-4 px-5 py-4 border-b border-zinc-100">
 <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
 <div className="size-8 rounded-xl bg-yellow-400 flex items-center justify-center ">
 <Icon name="storefront" size={16} className="text-zinc-950" />
 </div>
 <div className="w-0.5 h-6 bg-zinc-200 rounded-full" />
 </div>
 <div className="flex-1 min-w-0 pb-1">
 <span className="text-[9px] font-black text-yellow-600 uppercase tracking-[0.3em] block mb-0.5">
 {isMobility ? 'Embarque' : 'Ponto de Coleta'}
 </span>
 {(activeMission.merchant_name || activeMission.store_name) && (
 <p className="text-zinc-950 font-black text-xs uppercase tracking-tight truncate mb-0.5">
 {activeMission.merchant_name || activeMission.store_name}
 </p>
 )}
 <p className="text-zinc-600 font-semibold text-[11px] leading-snug break-words">
 {pickupOnly || 'Endereço de coleta não informado'}
 </p>
 </div>
 </div>

 {/* Paradas intermediárias (se houver) */}
 {(() => {
 let stopsArr = [];
 try {
 if (activeMission.stops) {
 stopsArr = typeof activeMission.stops === 'string' 
 ? JSON.parse(activeMission.stops) 
 : activeMission.stops;
 }
 } catch (e) {
 console.warn("Erro ao parsear paradas:", e);
 }
 
 if (!Array.isArray(stopsArr) || stopsArr.length === 0) return null;

 return stopsArr.map((stop: any, i: number) => (
 <div key={i} className="flex items-start gap-4 px-5 py-3 border-b border-zinc-100 bg-zinc-50/50">
 <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
 <div className="size-8 rounded-xl bg-zinc-200 flex items-center justify-center">
 <Icon name="add_location" size={14} className="text-zinc-600" />
 </div>
 <div className="w-0.5 h-6 bg-zinc-200 rounded-full" />
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-0.5">Parada {i + 1}</span>
 <p className="text-zinc-100 font-semibold text-[11px] leading-snug break-words">
 {typeof stop === 'string' ? stop : (stop.address || stop.formatted_address || JSON.stringify(stop))}
 </p>
 </div>
 </div>
 ));
 })()}

 {/* Destino Final */}
 <div className="flex items-start gap-4 px-5 py-4">
 <div className="flex flex-col items-center shrink-0 pt-1">
 <div className="size-8 rounded-xl bg-zinc-900 flex items-center justify-center ">
 <Icon name="location_on" size={16} className="text-yellow-400" />
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] block mb-0.5">
 {isMobility ? 'Destino' : 'Endereço de Entrega'}
 </span>
 {(activeMission.receiver_name || activeMission.recipient_name) && (
 <p className="text-zinc-950 font-black text-xs uppercase tracking-tight truncate mb-0.5">
 {activeMission.receiver_name || activeMission.recipient_name}
 </p>
 )}
 <p className="text-zinc-600 font-semibold text-[11px] leading-snug break-words">
 {addressOnly || 'Endereço de entrega não informado'}
 </p>
 </div>
 </div>
 </section>

 {/* Detalhes da Carga/Passageiro */}
 <section className="space-y-4">
 <div className="flex justify-between items-end px-2">
 <h2 className="text-zinc-950 font-black text-[10px] uppercase tracking-[0.4em]">Detalhes da Missão</h2>
 <span className={isMobility ? "text-cyan-600 font-black text-[9px] uppercase tracking-widest" : "text-yellow-600 font-black text-[9px] uppercase tracking-widest"}>
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
 className="bg-white rounded-2xl p-5 flex items-center gap-5 border border-zinc-100 "
 >
 <div className="size-14 bg-zinc-50 rounded-xl flex items-center justify-center border border-zinc-100 shrink-0 relative">
 <Icon name={isMobility ? 'person' : 'package_2'} className="text-yellow-600/40" size={28} />
 <div className="absolute -top-1 -right-1 size-6 bg-yellow-400 rounded-lg flex items-center justify-center">
 <span className="text-zinc-950 font-black text-[10px]">{item.quantity || 1}x</span>
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-zinc-950 font-black text-xs uppercase tracking-tight truncate">{item.name}</h3>
 {item.options && <p className="text-zinc-950 text-[10px] font-black truncate mt-1">{item.options}</p>}
 <div className="flex items-center gap-2 mt-2">
 <div className="size-1.5 rounded-full bg-yellow-400" />
 <span className="text-[8px] font-black text-zinc-950 uppercase tracking-widest">Verificado no sistema</span>
 </div>
 </div>
 </motion.div>
 ))
 ) : (
 <div className="bg-white rounded-[28px] p-6 flex flex-col items-center justify-center gap-3 border border-zinc-100 border-dashed opacity-50">
 <Icon name="info" className="text-zinc-300" size={24} />
 <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Sem notas adicionais</p>
 </div>
 )}
 </div>
 </section>

 {/* Izi Pay Premium Section */}
 <section className="space-y-4 pb-4">
 <h2 className="text-zinc-950 font-black text-[10px] uppercase tracking-[0.4em] px-2">Izi Pay ââ‚¬¢ Rendimento</h2>
 <div className="bg-white border border-zinc-100 p-6 rounded-3xl relative overflow-hidden ">
 
 <div className="flex justify-between items-center relative z-10">
 <div className="flex items-center gap-4">
 <div className="size-14 rounded-xl bg-yellow-400 flex items-center justify-center">
 <Icon name="payments" size={28} className="text-zinc-950" />
 </div>
 <div>
 <span className="text-zinc-950 font-black text-[11px] uppercase tracking-widest block leading-none">Lucro Real</span>
 <span className="text-zinc-950 text-[9px] font-black uppercase tracking-[0.2em] mt-1 block">Líquido Creditado</span>
 </div>
 </div>
 <div className="text-right">
 <span className="text-yellow-600 text-3xl font-black tracking-tighter">
 R$ {driverEarnings.toFixed(2).replace('.', ',')}
 </span>
 </div>
 </div>
 
 <div className="h-px bg-zinc-100 w-full my-6" />

 <div className="space-y-5">
 <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
 <div className="flex flex-col">
 <span className="text-zinc-950 font-black text-[8px] uppercase tracking-widest mb-1">Método</span>
 <span className="text-zinc-950 font-black text-[10px] uppercase">{activeMission.payment_method === 'online' ? 'Liquidado Online' : 'Pagar no Destino'}</span>
 </div>
 <div className="bg-yellow-400/10 px-4 py-2 rounded-xl border border-yellow-400/20 flex items-center gap-2">
 <Icon name={activeMission.payment_method === 'online' ? 'verified_user' : 'monetization_on'} size={14} className="text-yellow-600" />
 <span className="text-yellow-600 font-black text-[10px] uppercase">{getPaymentLabel(activeMission)}</span>
 </div>
 </div>

 {!(activeMission.payment_status === 'paid' || activeMission.payment_status === 'pago' || activeMission.service_type === 'entrega_avulsa') && activeMission.payment_method !== 'online' ? (
 <div className="bg-zinc-100/50 p-6 rounded-[28px] border border-zinc-200 flex flex-col gap-3 ">
 <div className="flex justify-between items-center text-[9px] font-black text-zinc-950 uppercase tracking-[0.2em]">
 <span>Subtotal Carga</span>
 <span className="text-zinc-950">R$ {(Number(activeMission.total_price || 0) - Number(activeMission.delivery_fee || 0)).toFixed(2).replace('.', ',')}</span>
 </div>
 <div className="flex justify-between items-end pt-2 border-t border-zinc-200">
 <span className="text-zinc-950 font-black text-xs uppercase tracking-widest">Coleta em Dinheiro</span>
 <span className="text-yellow-600 text-2xl font-black tracking-tighter drop-">R$ {Number(activeMission.total_price || 0).toFixed(2).replace('.', ',')}</span>
 </div>
 {activeMission.change_for > 0 && (
 <div className="mt-2 bg-yellow-400 p-2 rounded-lg flex items-center justify-between ">
 <span className="text-zinc-950 font-black text-[9px] uppercase tracking-tighter">Troco Para</span>
 <span className="text-zinc-950 font-black text-sm">R$ {Number(activeMission.change_for || 0).toFixed(2).replace('.', ',')}</span>
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
 <Icon name="check" className="text-white" size={20} />
 </div>
 <div>
 <p className="text-emerald-600 font-black text-[10px] uppercase tracking-widest">Pagamento Confirmado</p>
 <p className="text-emerald-500/40 text-[8px] font-bold uppercase mt-0.5">Liberado para entrega imediata</p>
 </div>
 </motion.div>
 )}

 {activeMission.observations && (
 <div className="bg-orange-500/5 p-4 rounded-xl border border-orange-500/10 flex items-start gap-3">
 <Icon name="warning" className="text-orange-500 mt-0.5" size={16} />
 <p className="text-zinc-950 text-[9px] leading-relaxed font-black uppercase tracking-tight line-clamp-3">
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
 <div className="fixed bottom-0 left-0 w-full p-6 pb-8 bg-gradient-to-t from-zinc-50 via-zinc-50/95 to-transparent z-[200] flex flex-col gap-4">
 {(() => {
 // Para status terminal (concluído/cancelado), o botão nunca deve ser bloqueado por isAccepting
 const terminalStatuses = ['concluido', 'cancelado', 'finalizado', 'entregue', 'delivered'];
 const isTerminal = terminalStatuses.includes((activeMission.status || '').toLowerCase().trim());
 const isDisabled = isTerminal ? false : (isAccepting || btn.disabled);
 return (
 <motion.button 
 whileHover={{ scale: 1.02 }}
 whileTap={{ scale: 0.96 }}
 onClick={btn.action}
 disabled={isDisabled}
 className="w-full h-16 bg-yellow-400 rounded-2xl flex items-center justify-center disabled:opacity-50 relative overflow-hidden group " 
 >
 <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
 <div className="flex items-center gap-3">
 {(isAccepting && !isTerminal) ? (
 <div className="size-6 border-[3px] border-zinc-950/20 border-t-zinc-950 rounded-full animate-spin" />
 ) : (
 <Icon name={btn.icon} size={24} className="text-zinc-950 group-hover:scale-110 transition-transform" />
 )}
 <span className="text-zinc-950 font-black text-lg uppercase tracking-tighter">
 {(isAccepting && !isTerminal) ? 'Sincronizando...' : btn.label}
 </span>
 </div>
 </motion.button>
 );
 })()}
 
 {['a_caminho_coleta', 'saiu_para_coleta', 'aceito', 'confirmado'].includes(activeMission.status || '') && (
 <button 
 onClick={async () => { if (await showConfirm({ message: 'Deseja realmente cancelar esta missão?' })) handleUpdateStatus('cancelado'); }}
 className="w-full h-14 border-2 border-rose-100 bg-rose-50/50 text-rose-500 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2"
 >
 <Icon name="close" size={18} />
 Cancelar Missão
 </button>
 )}
 </div>
 </motion.div>
 );
 };

 const renderSOS = () => (
 <motion.div key="sos-modal" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="fixed inset-0 z-[200] bg-rose-50 flex flex-col items-center justify-center p-8 text-center">
 <div className="size-28 clay-fab-sos rounded-full flex items-center justify-center mb-8 animate-pulse bg-rose-500"><Icon name="emergency_share" className="text-6xl text-white" /></div>
 <h1 className="text-4xl font-black text-zinc-900 uppercase tracking-tight mb-3">SOS Ativado</h1>
 <p className="text-zinc-500 text-sm mb-10 max-w-xs leading-relaxed">Sua localização está sendo compartilhada com a central Izi.</p>
 <div className="w-full max-w-sm space-y-4">
 <button onClick={() => { window.open('tel:190'); setIsSOSActive(false); }} className="w-full h-16 bg-rose-500 text-white rounded-xl flex items-center justify-center gap-4 font-black text-lg uppercase tracking-tight active:scale-95 transition-all"><Icon name="local_police" className="text-3xl" />Ligar 190</button>
 <button onClick={() => { toastSuccess('Apoio mecânico acionado.'); setIsSOSActive(false); }} className="w-full h-16 bg-white border border-zinc-100 text-zinc-900 rounded-xl flex items-center justify-center gap-4 font-black text-base uppercase active:scale-95 transition-all"><Icon name="build" className="text-2xl" />Apoio Mecânico</button>
 <button onClick={() => setIsSOSActive(false)} className="text-zinc-400 font-black uppercase tracking-widest text-sm mt-4">Cancelar</button>
 </div>
 </motion.div>
 );

 const renderLoginView = () => {
 if (authInitLoading) return (
 <div className="h-screen flex items-center justify-center bg-zinc-50">
 <div className="flex flex-col items-center gap-4"><div className="size-16 bg-primary/10 rounded-full flex items-center justify-center animate-pulse"><Icon name="bolt" className="text-primary text-3xl" /></div><p className="text-[9px] font-black text-primary uppercase tracking-[0.5em]">Inicializando...</p></div>
 </div>
 );
 return (
 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-screen w-full flex flex-col items-center justify-center px-7 relative overflow-hidden bg-[#FAFAFA]">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,0,0,0.05)_0%,transparent_60%)]" />
 <div className="w-full max-w-md space-y-8 relative z-10">
 <div className="text-center space-y-3">
 <div className="inline-flex items-center justify-center size-20 bg-black rounded-xl mb-2 shadow-black/20">
 <Icon name="moped" className="text-primary text-5xl" />
 </div>
 <h1 className="text-4xl font-black text-black tracking-tight uppercase">Izi <span className="text-primary">Entregador</span></h1>
 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em]">{authMode === 'login' ? 'Autenticação do Entregador' : 'Cadastro de Novo Piloto'}</p>
 </div>
 {authError && <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50 border border-rose-100 rounded-2xl px-5 py-3 text-rose-500 text-xs font-black text-center uppercase tracking-widest">{authError}</motion.div>}
 <div className="space-y-4">
 {authMode === 'register' && (
 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
 <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-zinc-400"><Icon name="badge" className="text-xl" /></div><input type="text" value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Nome completo" className="w-full h-14 pl-14 pr-5 bg-white border border-zinc-200 rounded-xl text-black font-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm " /></div>
 <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-zinc-400"><Icon name="pin" className="text-xl" /></div><input type="text" value={authCpf} onChange={e => setAuthCpf(e.target.value)} placeholder="CPF" className="w-full h-14 pl-14 pr-5 bg-white border border-zinc-200 rounded-xl text-black font-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm " /></div>
 <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-zinc-400"><Icon name="phone" className="text-xl" /></div><input type="tel" value={authPhone} onChange={e => setAuthPhone(e.target.value)} placeholder="Telefone (WhatsApp)" className="w-full h-14 pl-14 pr-5 bg-white border border-zinc-200 rounded-xl text-black font-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm " /></div>
 <div className="flex gap-2">
 {(['mototaxi', 'carro', 'fiorino'] as const).map(v => (
 <button 
 key={v} 
 type="button" 
 onClick={() => setAuthVehicle(v)} 
 className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 border-2 transition-all text-[9px] font-black uppercase tracking-widest ${authVehicle === v ? 'bg-black border-black text-primary ' : 'bg-white border-zinc-200 text-zinc-400'}`}
 >
 <Icon name={v === 'mototaxi' ? 'two_wheeler' : v === 'carro' ? 'directions_car' : 'local_shipping'} size={18} />
 <span>{v === 'mototaxi' ? 'Moto' : v === 'carro' ? 'Carro' : 'Fiorino'}</span>
 </button>
 ))}
 </div>
 </motion.div>
 )}
 <div className="relative"><div className="absolute inset-y-0 left-5 flex items-center text-zinc-400"><Icon name="alternate_email" className="text-xl" /></div><input type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="E-mail" className="w-full h-14 pl-14 pr-5 bg-white border border-zinc-200 rounded-xl text-black font-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm " /></div>
 <div className="relative">
 <div className="absolute inset-y-0 left-5 flex items-center text-zinc-400">
 <Icon name="lock" className="text-xl" />
 </div>
 <input 
 type={showAuthPassword ? "text" : "password"} 
 value={authPassword} 
 onChange={e => setAuthPassword(e.target.value)} 
 placeholder="Senha" 
 className="w-full h-14 pl-14 pr-14 bg-white border border-zinc-200 rounded-xl text-black font-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm " 
 onKeyDown={e => e.key === 'Enter' && authMode === 'login' && handleAuthLogin()} 
 />
 <button 
 type="button"
 onClick={() => setShowAuthPassword(!showAuthPassword)}
 className="absolute inset-y-0 right-5 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors"
 >
 <Icon name={showAuthPassword ? "visibility_off" : "visibility"} size={20} />
 </button>
 </div>
 </div>

 <div className="flex items-center justify-between px-2">
 <button 
 type="button"
 onClick={() => {
 const newVal = !rememberLogin;
 setRememberLogin(newVal);
 localStorage.setItem('izi_driver_remember', String(newVal));
 }}
 className="flex items-center gap-2"
 >
 <div className={`size-5 rounded-lg border-2 flex items-center justify-center transition-all ${rememberLogin ? 'bg-primary border-primary' : 'border-zinc-200 bg-white'}`}>
 {rememberLogin && <Icon name="check" size={14} className="text-zinc-900" />}
 </div>
 <span className="text-[11px] font-black text-zinc-400 uppercase tracking-wider">Manter conectado</span>
 </button>
 
 {authMode === 'login' && (
 <a 
 href="https://wa.me/5511999999999?text=Ol%C3%A1%21%20Sou%20entregador%20Izi%20e%20esqueci%20minha%20senha.%20Pode%20me%20ajudar%3F" 
 target="_blank" 
 rel="noopener noreferrer"
 className="text-[11px] font-black text-primary uppercase tracking-wider"
 >
 Esqueci a senha
 </a>
 )}
 </div>

 <div className="space-y-3">
 <button onClick={authMode === 'login' ? handleAuthLogin : handleAuthRegister} disabled={authLoading} className="w-full h-14 bg-black text-white font-black text-sm uppercase tracking-widest rounded-xl shadow-black/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
 {authLoading ? <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <>{authMode === 'login' ? 'Entrar' : 'Criar Conta'}<Icon name="arrow_forward" className="text-xl" /></>}
 </button>
 <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setAuthError(''); }} className="w-full h-12 bg-white border border-zinc-200 text-zinc-500 font-black text-[10px] uppercase tracking-widest rounded-xl hover:text-black transition-all ">{authMode === 'login' ? 'Criar nova conta' : 'Já tenho conta'}</button>
 </div>
 </div>
 <p className="absolute bottom-8 text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em]">Izi v5.0 ââ‚¬¢ Conexão Segura</p>
 </motion.div>
 );
 };



 const renderOrderDetailsModal = () => {

 if (!selectedOrder || !showOrderModal) return null;

 const presentation = getServicePresentation(selectedOrder);
 const grossEarnings = getGrossEarnings(selectedOrder);
 const netEarnings = getNetEarnings(selectedOrder);
 const displayDistance = calculatedDistance || selectedOrder.distance || 'Calculando...';

 const isPaid = selectedOrder.payment_status === 'paid' || selectedOrder.payment_status === 'pago' || selectedOrder.service_type === 'entrega_avulsa';
 const paymentLabel = getPaymentLabel(selectedOrder);
 const needsChange = !isPaid && selectedOrder.change_for > 0;

 // Estilos Claymorphic via classes Tailwind inline para garantir consistência
 // Estilos Claymorphic Premium para o Tema Claro
 const clayCard = "";
 const clayCardDark = "";
 const clayYellow = "";

 return (
 <motion.div 
 key="order-details-modal"
 initial={{ opacity: 0, y: 100 }} 
 animate={{ opacity: 1, y: 0 }} 
 exit={{ opacity: 0, y: 100 }}
 className="fixed inset-0 z-[400] bg-white flex flex-col overflow-y-auto no-scrollbar pb-40"
 >
 {/* TopAppBar */}
 <header className="bg-white fixed top-0 w-full z-50 flex justify-between items-center px-6 py-4">
 <button 
 onClick={() => setShowOrderModal(false)}
 className="active:scale-95 transition-transform duration-200 hover:bg-zinc-100 p-2 rounded-full flex items-center justify-center"
 >
 <Icon name="arrow_back" className="text-zinc-900" />
 </button>
 <h1 className="text-zinc-900 font-bold tracking-tight text-xl">Detalhes do Pedido</h1>
 <div className="size-10" />
 </header>

 <main className="pt-24 px-4 space-y-6">
 {/* Status & Identity */}
 <section className={`bg-white ${clayCard} rounded-xl p-6 flex items-center gap-5 border border-zinc-100`}>
 <div className="relative group">
 <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-yellow-400 bg-zinc-50 shadow-yellow-400/10 transition-transform group-hover:scale-105 duration-300">
 {driverAvatar ? (
 <img src={driverAvatar} alt="Profile" className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100">
 <Icon name="person" size={32} className="text-zinc-300" />
 </div>
 )}
 </div>
 <div className="absolute -bottom-2 -right-2 bg-zinc-900 border-2 border-white size-8 rounded-full flex items-center justify-center ">
 <Icon name="verified" size={16} className="text-yellow-400" fill />
 </div>
 </div>
 <div className="space-y-1">
 <h2 className="text-2xl font-black text-zinc-900 tracking-tighter leading-none">{driverName.split(' ')[0] || 'Piloto'}</h2>
 <div className="flex items-center gap-2">
 <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-0.5 rounded-lg border border-yellow-400/20">
 <Icon name="star" size={12} className="text-yellow-600" fill />
 <span className="text-[10px] font-black text-yellow-700 uppercase">Nível {stats.level}</span>
 </div>
 <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Premium</span>
 </div>
 </div>
 <div className="ml-auto text-right">
 <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Ganhos</p>
 <p className="text-2xl font-black text-zinc-900">R$ {netEarnings.toFixed(2).replace('.', ',')}</p>
 </div>
 </section>


 {/* Itens do Pedido */}
 <section className="space-y-3">
 <div className="flex justify-between items-end px-2">
 <h2 className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Itens do Pedido</h2>
 <span className="text-yellow-600 text-xs font-bold uppercase">
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
 <div className={`bg-white ${clayCardDark} rounded-xl p-5 flex items-center gap-4 border border-zinc-100`}>
 <div className="w-14 h-14 rounded-full bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
 <Icon name={presentation.icon} className="text-yellow-600" size={24} />
 </div>
 <div>
 <span className="text-zinc-900 font-bold text-sm block">{presentation.title}</span>
 <span className="text-zinc-400 text-xs">Verificar detalhes na coleta</span>
 </div>
 </div>
 );
 }

 return items.map((item: any, idx: number) => (
 <div key={idx} className={`bg-white ${clayCardDark} rounded-xl p-4 flex items-center gap-4 border border-zinc-100`}>
 <div className="w-14 h-14 relative flex-shrink-0">
 <img 
 src={item.image || item.photo_url || "https://lh3.googleusercontent.com/aida-public/AB6AXuAuk8p52HQWwpR_wuk3TNwin3lv0PgotwugDnu2096J4W2od0SpPmzQR04uYsHnHyefMPAbu_LxocDYNFSBypC7KBNA68zy6PJZmKdz5Lbo3kL_9DQHae86xPcDGo9FVpI3NoQWjiQW_Cu30pemF5m_2jZMYH2BsJx1XCnixxIHyADJ4XuLpFblXF_Hb0GSi2pX2NRBVwcXb25TelTJBsy7IJzwkxpYvbzqs9rzQPXF_N2K2rqKtlFsXMFMbj8D1KlMTpW9UuiCvm8"} 
 className="w-full h-full object-cover rounded-full " 
 alt={item.name} 
 />
 <span className="absolute -top-1 -right-1 bg-yellow-400 text-zinc-950 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center ">
 {item.quantity}x
 </span>
 </div>
 <div className="flex-1">
 <span className="text-zinc-900 font-bold text-sm block">{item.name || item.product_name}</span>
 {item.observation && <span className="text-zinc-400 text-xs line-clamp-1">{item.observation}</span>}
 </div>
 <div className="text-right">
 <span className="text-zinc-400/60 text-[10px] font-bold block uppercase">Preço</span>
 <span className="text-zinc-900 font-black text-xs">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2).replace('.', ',')}</span>
 </div>
 </div>
 ));
 })()}
 </div>
 </section>
 
 {/* Resumo Financeiro e Operação Consolidados */}
 <section className="space-y-4">
 <div className="flex justify-between items-center px-2">
 <h2 className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Resumo da Missão</h2>
 <span className="text-yellow-600 font-black text-[10px] uppercase tracking-widest bg-yellow-400/10 px-3 py-1 rounded-full border border-yellow-400/20">
 {paymentLabel}
 </span>
 </div>
 
 <div className={`bg-white ${clayCardDark} rounded-xl p-6 border border-zinc-100 space-y-6 relative overflow-hidden`}>
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -mr-16 -mt-16 rounded-full" />
 
 {/* Saldo da Missão Principal */}
 <div className="flex justify-between items-center relative z-10 bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
 <div className="flex flex-col">
 <span className="text-zinc-900 font-black text-xs uppercase tracking-tight">Saldo da Missão</span>
 </div>
 <div className="text-right">
 {(() => {
 const isCash = selectedOrder.payment_method === 'dinheiro' || selectedOrder.payment_method === 'cash';
 const cashVal = isCash ? Number(selectedOrder.total_price || 0) : 0;
 const mBalance = netEarnings - cashVal;
 return (
 <span className={`text-2xl font-black tracking-tighter ${mBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
 {mBalance < 0 ? '-' : '+'} R$ {Math.abs(mBalance).toFixed(2).replace('.', ',')}
 </span>
 );
 })()}
 </div>
 </div>

 {/* Detalhes Financeiros Detalhados */}
 <div className="space-y-4 relative z-10 px-2 py-2">
 <div className="flex justify-between items-center text-[10px] font-black">
 <span className="text-zinc-400 uppercase tracking-[0.2em]">Valor Total Pedido</span>
 <span className="text-zinc-900">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-black">
 <span className="text-zinc-400 uppercase tracking-[0.2em]">Seu Ganho Bruto</span>
 <span className="text-emerald-500">R$ {grossEarnings.toFixed(2).replace('.', ',')}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-black">
 <span className="text-zinc-400 uppercase tracking-[0.2em]">Taxa Izi (Desconto)</span>
 <span className="text-rose-400">- R$ {(grossEarnings - netEarnings).toFixed(2).replace('.', ',')}</span>
 </div>
 
 {(() => {
 const isCash = selectedOrder.payment_method === 'dinheiro' || selectedOrder.payment_method === 'cash';
 if (!isCash) return null;
 return (
 <div className="flex justify-between items-center text-[10px] font-black pt-3 border-t border-zinc-100">
 <div className="flex items-center gap-2">
 <div className="size-2 rounded-full bg-amber-400 animate-pulse" />
 <span className="text-amber-500 uppercase tracking-[0.2em]">Recebido em Dinheiro</span>
 </div>
 <span className="text-amber-500">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</span>
 </div>
 );
 })()}
 </div>

 {/* Alertas Operacionais */}
 <div className="relative z-10">
 {isPaid || selectedOrder.payment_method === 'online' ? (
 <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 flex items-center gap-3">
 <Icon name="verified" className="text-emerald-500" />
 <p className="text-emerald-600 text-[10px] font-black uppercase tracking-tight">Pedido Pago via App. Não cobrar nada.</p>
 </div>
 ) : selectedOrder.payment_method === 'pix' ? (
 <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex items-center justify-between group">
 <div className="flex items-center gap-4">
 <div className="size-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-blue-500/20 group-hover:scale-110 transition-transform">
 <Icon name="qr_code_scanner" className="text-white" size={24} />
 </div>
 <div>
 <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] leading-none">Receber via Pix</p>
 <p className="text-zinc-900 font-black text-lg mt-1 tracking-tighter">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</p>
 </div>
 </div>
 <div className="bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
 <span className="text-[9px] font-black text-blue-600 uppercase">Aguardando</span>
 </div>
 </div>
 ) : (
 <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center gap-3 ">
 <Icon name="payments" className="text-rose-500" />
 <div>
 <p className="text-rose-500 text-[10px] font-black uppercase tracking-tight leading-none">Receber do Cliente</p>
 <p className="text-zinc-900 font-black text-sm mt-1">R$ {Number(selectedOrder.total_price || 0).toFixed(2).replace('.', ',')}</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </section>


 {/* Logística e Rota */}
 <section className="space-y-4">
 <div className="flex justify-between items-center px-2">
 <h2 className="text-zinc-400 font-bold text-sm uppercase tracking-widest">Rota do Pedido</h2>
 </div>
 <div className={`bg-white ${clayCardDark} rounded-xl p-6 border border-zinc-100 space-y-6 `}>
 <div className="flex gap-4">
 <div className="flex flex-col items-center gap-1">
 <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
 <Icon name="store" className="text-blue-500" size={16} />
 </div>
 <div className="w-0.5 h-10 bg-gradient-to-b from-blue-500/50 to-emerald-500/50" />
 <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
 <Icon name="location_on" className="text-emerald-500" size={16} />
 </div>
 </div>
 <div className="flex-1 space-y-8">
 <div>
 <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Coleta em</p>
 <p className="text-zinc-900 font-bold text-sm mt-1">{selectedOrder.merchant_name || 'Parceiro Izi'}</p>
 <p className="text-zinc-500 text-xs mt-0.5">{selectedOrder.pickup_address || 'Endereço de coleta disponível na missão'}</p>
 </div>
 <div>
 <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">Entregar para</p>
 <p className="text-zinc-900 font-bold text-sm mt-1">{selectedOrder.user_name || 'Cliente Izi'}</p>
 <p className="text-zinc-500 text-xs mt-0.5">{selectedOrder.delivery_address || 'Endereço de entrega'}</p>
 </div>
 </div>
 </div>
 </div>
 </section>

 {/* Observações e Ações Group */}
 <section className={`bg-white ${clayCard} rounded-[28px] border border-zinc-100 overflow-hidden`}>
 <div className="p-6 space-y-5">
 <h3 className="text-zinc-400 text-[9px] font-black uppercase tracking-[0.3em] mb-2 px-1">Notas da Missão</h3>
 
 {/* Observations */}
 <div className="flex items-start gap-4 p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
 <div className="bg-yellow-400/10 p-2.5 rounded-xl">
 <Icon name="description" className="text-yellow-600" />
 </div>
 <div className="flex-1">
 <span className="text-zinc-900 font-black text-[11px] uppercase tracking-widest opacity-60">Instruções</span>
 {(() => {
 const itemNotes = selectedOrder.items
 ?.filter((item: any) => item.observation)
 .map((item: any) => `ââ‚¬¢ ${item.name || item.product_name}:\n "${item.observation}"`)
 .join('\n\n');
 
 const notesList = [];
 if (selectedOrder.notes) notesList.push(`ââ‚¬¢ Geral:\n "${selectedOrder.notes}"`);
 if (itemNotes) notesList.push(itemNotes);
 
 const displayNotes = notesList.length > 0 ? notesList.join('\n\n') : 'Sem observações especiais dos produtos.';
 
 return (
 <p className="text-zinc-600 text-sm mt-1.5 leading-relaxed whitespace-pre-line">
 {displayNotes}
 </p>
 );
 })()}
 </div>
 </div>
 </div>

 {/* Quick Actions */}
 <div className="border-t border-zinc-100">
 <button 
 onClick={() => { setShowOrderModal(false); setShowHelpModal(true); }}
 className="w-full py-5 text-zinc-900 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-zinc-50 active:scale-95 transition-all"
 >
 <Icon name="chat" className="text-yellow-600" />
 Chat com o Cliente
 </button>
 </div>
 </section>
 </main>

 {/* Bottom Fixed Action Button Container */}
 {activeTab !== 'history' && !['entregue', 'completed', 'finalizado', 'concluido', 'concluído', 'delivered', 'cancelado', 'cancelled'].includes(selectedOrder.status?.toLowerCase()) && (
 <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white/95 to-transparent z-50">
 <button 
 onClick={() => {
 setShowOrderModal(false);
 handleAccept(selectedOrder);
 }}
 disabled={isAccepting}
 className={`w-full bg-yellow-400 ${clayYellow} py-6 rounded-full flex items-center justify-center gap-3 active:scale-[0.97] transition-transform disabled:opacity-50`}
 >
 <span className="text-zinc-950 font-black text-lg tracking-tighter uppercase">
 {isAccepting ? 'Confirmando...' : 'Ir Para a Coleta'}
 </span>
 <Icon name="arrow_forward" className="text-zinc-950 font-bold" />
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
 key={`broadcast-${activeBroadcast.id}`}
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-zinc-900/60 "
 >
 <motion.div 
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 className="w-full max-w-sm bg-white rounded-xl overflow-hidden border border-zinc-100"
 >
 {activeBroadcast.image_url && (
 <div className="w-full h-48 relative overflow-hidden">
 <img src={activeBroadcast.image_url} alt="Broadcast" className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
 </div>
 )}
 
 <div className="p-8 space-y-6">
 <div className="space-y-2">
 <h3 className="text-2xl font-black text-zinc-900 leading-tight">
 {activeBroadcast.title}
 </h3>
 <p className="text-zinc-500 font-bold leading-relaxed">
 {activeBroadcast.message}
 </p>
 </div>
 
 <motion.button 
 whileTap={{ scale: 0.95 }}
 onClick={() => {
 localStorage.setItem('last_izi_broadcast_driver', activeBroadcast.id);
 setActiveBroadcast(null);
 }}
 className="w-full bg-primary text-zinc-950 font-black py-5 rounded-[22px] uppercase tracking-widest text-[10px]"
 >
 Aproveitar
 </motion.button>
 </div>
 </motion.div>
 </motion.div>
 );
 };

 return (
 <div className="w-full h-[100dvh] bg-zinc-50 font-sans overflow-hidden relative">
 {/* Banner de Ativação de Áudio */}
 {audioBlocked && (
 <motion.div 
 initial={{ y: -100, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 onClick={enableAudioManually}
 className="fixed top-20 left-4 right-4 z-[200] bg-amber-400/95 p-4 rounded-2xl border border-white flex items-center justify-between cursor-pointer active:scale-95 transition-transform"
 >
 <div className="flex items-center gap-4">
 <div className="size-10 rounded-full bg-white/40 flex items-center justify-center">
 <Icon name="volume_up" size={24} className="text-zinc-950 animate-pulse" />
 </div>
 <div>
 <p className="text-zinc-950 text-sm font-black leading-tight">ATIVAR ALERTAS SONOROS</p>
 <p className="text-zinc-900/80 text-[10px] uppercase font-bold tracking-widest mt-0.5">Clique aqui para não perder novas vagas!</p>
 </div>
 </div>
 <div className="size-8 rounded-full bg-zinc-950/10 flex items-center justify-center">
 <Icon name="chevron_right" size={20} className="text-zinc-950" />
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
 <>
 <div key="app" className="flex flex-col h-full overflow-hidden bg-zinc-50">
 {/* Popup flutuante de nova chamada — sobrepõe tudo */}
 
 <AnimatePresence>{isSOSActive && renderSOS()}</AnimatePresence>
 <AnimatePresence>{showOrderModal && renderOrderDetailsModal()}</AnimatePresence>
 <AnimatePresence>
 {showBankDetails && (
 <BankDetailsModal 
 show={showBankDetails}
 onClose={() => {
 setShowBankDetails(false);
 setPixKey(localStorage.getItem('izi_driver_pix') || '');
 setBankName(localStorage.getItem('izi_driver_bank_name') || '');
 setIsEditingPix(false);
 }}
 bankName={bankName}
 onBankNameChange={(val) => {
 setBankName(val);
 setIsEditingPix(true);
 }}
 pixKey={pixKey}
 onPixKeyChange={(val) => {
 setPixKey(val);
 setIsEditingPix(true);
 }}
 onSave={async () => {
 await handleSavePix(pixKey, bankName);
 setShowBankDetails(false);
 }}
 isSaving={isSavingPix}
 />
 )}
 </AnimatePresence>
 <AnimatePresence>
 {showPersonalDataModal && (
 <PersonalDataModal 
 show={showPersonalDataModal}
 onClose={() => setShowPersonalDataModal(false)}
 editProfileData={editProfileData}
 onUpdateData={setEditProfileData}
 onSave={handleUpdateProfile}
 isSaving={isSavingProfile}
 />
 )}
 </AnimatePresence>
 <AnimatePresence>{showPlateModal && renderPlateEditView()}</AnimatePresence>
 <AnimatePresence>{showPreferences && renderPreferencesView()}</AnimatePresence>
 
 <AnimatePresence>
 {selectedSlot && renderSlotDetailsBottomSheet()}
 </AnimatePresence>

 {isProfileNotFound && renderProfileNotFoundView()}

 {showSlotAppliedSuccess && (
 <motion.div 
 initial={{ opacity: 0 }} 
 animate={{ opacity: 1 }} 
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[150] bg-zinc-900/60 flex flex-col items-center justify-center p-8 text-center"
 >
 <motion.div 
 initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
 animate={{ scale: 1, opacity: 1, rotate: 0 }}
 transition={{ type: "spring", damping: 12 }}
 className="size-32 rounded-xl bg-yellow-400 flex items-center justify-center mb-10 relative"
 className="size-36 rounded-full bg-emerald-500 flex items-center justify-center mb-10 relative"
 >
 <Icon name="verified" size={56} className="text-zinc-950" />
 <motion.div 
 animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
 transition={{ duration: 2, repeat: Infinity }}
 className="absolute inset-0 border-4 border-yellow-400/50 rounded-xl"
 />
 </motion.div>
 
 <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none mb-4 text-center">
 Candidatura <br />
 <span className="text-yellow-600">Enviada com Sucesso!</span>
 </h2>

 {selectedSlot && (
 <div className="bg-zinc-50 border border-zinc-100 rounded-3xl p-6 w-full max-w-xs mb-8 flex flex-col items-center">
 <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-2">Valor Garantido</p>
 <div className="flex items-baseline gap-1">
 <span className="text-lg font-bold text-emerald-600">R$</span>
 <span className="text-4xl font-black text-emerald-600 tracking-tighter">
 {Number(selectedSlot.fee_per_day || 0).toFixed(2).replace('.', ',')}
 </span>
 </div>
 <div className="mt-2 bg-emerald-100/50 px-4 py-1.5 rounded-full border border-emerald-200">
 <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">
 até {selectedSlot.metadata?.base_deliveries || 10} entregas
 </span>
 </div>
 </div>
 )}
 
 <p className="text-zinc-400 font-bold text-[10px] sm:text-xs tracking-[0.2em] mb-12 max-w-xs uppercase leading-relaxed">
 Seu perfil premium foi enviado para análise. Fique atento às suas notificações!
 </p>

 <button
 onClick={() => {
 setShowSlotAppliedSuccess(false);
 setSelectedSlot(null);
 }}
 className="w-full max-w-xs h-18 rounded-xl bg-zinc-900 text-white font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all"
 >
 Voltar para Vagas
 </button>
 
 <div className="absolute bottom-12 left-0 right-0 flex justify-center opacity-10">
 <div className="w-16 h-1.5 bg-zinc-900 rounded-full" />
 </div>
 </motion.div>
 )}

 {activeTab === 'dashboard' && (
 <header className="px-6 pt-12 pb-4 bg-white border-b border-zinc-100 flex items-center justify-between relative z-10 shrink-0">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setActiveTab('profile')}
 className="relative active:scale-95 transition-transform"
 >
 <div className="size-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center overflow-hidden">
 {driverAvatar ? (
 <img src={driverAvatar} alt="Perfil" className="w-full h-full object-cover" />
 ) : (
 <Icon name="person" className="text-zinc-400" />
 )}
 </div>
 <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-white flex items-center justify-center border border-zinc-100">
 <Icon name="settings" size={12} className="text-zinc-400" />
 </div>
 </button>
 <div>
 <h1 className="text-xl font-black text-zinc-900 tracking-tight leading-none mb-1">
 Olá, <span className="text-yellow-600 font-black">{driverName.split(' ')[0]}</span>
 </h1>
 <div className="flex items-center gap-1.5">
 <div className={`size-2 rounded-full ${isOnline ? 'bg-emerald-500 ' : 'bg-rose-500'}`} />
 <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
 {isOnline ? 'Online' : 'Offline'}
 </span>
 </div>
 </div>
 </div>
 <button 
 onClick={() => setActiveTab('notifications')}
 className="size-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center relative active:scale-95 transition-transform"
 >
 <Icon name="notifications" className="text-zinc-600" />
 {unreadNotifsCount > 0 && (
 <span className="absolute top-2 right-2 size-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
 )}
 </button>
 </header>
 )}

 <div className="flex-1 relative overflow-hidden flex flex-col bg-zinc-50">
 <main className="flex-1 overflow-y-auto no-scrollbar relative">
 <AnimatePresence mode="wait">
 {activeTab === 'dashboard' && <motion.div key="dash" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Painel Principal">{renderDashboard()}</LocalErrorBoundary></motion.div>}
 {activeTab === 'active_mission' && <motion.div key="active_miss" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Missão Ativa">{renderActiveMissionView()}</LocalErrorBoundary></motion.div>}
 {activeTab === 'history' && <motion.div key="hist" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Histórico"><HistoryView history={history} getNetEarnings={getNetEarnings} serviceTypeLabel={serviceTypeLabel} onSelectOrder={(order: any) => { setSelectedOrder(order); setShowOrderModal(true); }} /></LocalErrorBoundary></motion.div>}
 {activeTab === 'earnings' && <motion.div key="earn" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full flex flex-col flex-1"><LocalErrorBoundary featureName="Ganhos"><EarningsView stats={stats} onShowBankDetails={() => setShowBankDetails(true)} onShowWithdrawHistory={() => setShowWithdrawHistory(true)} onWithdrawRequest={handleWithdrawRequest} onNavigateToMissions={() => setActiveTab('missions')} /></LocalErrorBoundary></motion.div>}
 {activeTab === 'profile' && (
 <motion.div 
 key="prof" 
 initial={{ x: '-100%' }} 
 animate={{ x: 0 }} 
 exit={{ x: '-100%' }}
 transition={{ type: 'spring', damping: 25, stiffness: 200 }}
 className="fixed inset-0 z-[300] bg-white flex flex-col"
 >
 <LocalErrorBoundary featureName="Perfil">
 <ProfileView 
 driverName={driverName}
 driverAvatar={driverAvatar}
 driverPlate={driverPlate}
 driverVehicle={driverVehicle}
 authEmail={authEmail}
 stats={{ level: stats.level, count: stats.count }}
 isUploadingAvatar={isUploadingAvatar}
 driverId={driverId}
 onNavigateToDashboard={() => setActiveTab('dashboard')}
 onShowPersonalDataModal={() => setShowPersonalDataModal(true)}
 onShowBankDetails={() => setShowBankDetails(true)}
 onShowPlateModal={() => setShowPlateModal(true)}
 onShowPreferences={() => setShowPreferences(true)}
 onShowHelpModal={() => setShowHelpModal(true)}
 onLogout={handleLogout}
 onAvatarUpload={handleAvatarUpload}
 onOpenOverlaySettings={openOverlaySettings}
 onSyncMission={syncMissionWithDB}
 onResetMission={async () => {
 if (await showConfirm({ title: 'Resetar Missão', message: 'Isso irá limpar o cache local da sua missão atual.', confirmLabel: 'Resetar Agora', danger: true })) {
 setActiveMission(null);
 localStorage.removeItem('Izi_active_mission');
 setActiveTab('dashboard');
 showSystemPopup('Reset Concluído', 'O cache da missão foi limpo com sucesso.', 'info');
 }
 }}
 onSetEditProfileData={setEditProfileData}
 onLoadProfile={loadProfileAndEnforceOnboarding}
 />
 </LocalErrorBoundary>
 </motion.div>
 )}
 {activeTab === 'missions' && <motion.div key="miss" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 h-full flex flex-col"><LocalErrorBoundary featureName="Marketplace"><MissionsView driverId={driverId || ''} /></LocalErrorBoundary></motion.div>}
 {activeTab === 'dedicated' && <motion.div key="dedi" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><LocalErrorBoundary featureName="Vagas Dedicadas">{renderDedicatedView()}</LocalErrorBoundary></motion.div>}
 {activeTab === 'scheduled' && <motion.div key="sched" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="h-full"><LocalErrorBoundary featureName="Agenda">{renderScheduledView()}</LocalErrorBoundary></motion.div>}
 {activeTab === 'notifications' && (
 <motion.div key="notif" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="flex-1 h-full">
 {authInitLoading ? (
 <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 py-20 gap-4">
 <div className="size-12 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest animate-pulse">Autenticando...</span>
 </div>
 ) : (
 <NotificationsCenterView 
 driverId={driverId || ''} 
 onBack={() => setActiveTab('dashboard')} 
 getSecureToken={getSecureToken}
 />
 )}
 </motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {activeMission && activeTab !== 'active_mission' && (
 <motion.div 
 initial={{ y: 100, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: 100, opacity: 0 }}
 className="absolute bottom-28 left-4 right-4 z-[100]"
 >
 <button
 onClick={() => setActiveTab('active_mission')}
 className="w-full bg-emerald-500 text-white rounded-xl p-4 flex items-center gap-4 active:scale-95 transition-all"
 >
 <div className="size-12 bg-white/20 rounded-xl flex items-center justify-center">
 <Icon name="route" className="text-white" />
 </div>
 <div className="text-left flex-1">
 <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-0.5">Em Andamento</p>
 <p className="text-sm font-black leading-tight">Retornar à  Missão</p>
 </div>
 <Icon name="chevron_right" className="text-emerald-100" />
 </button>
 </motion.div>
 )}
 </AnimatePresence>
 </main>

 {!activeMission && (
 <motion.button 
 initial={{ scale: 0, y: 50 }} 
 animate={{ scale: 1, y: 0 }} 
 whileTap={{ scale: 0.9 }} 
 onClick={handleToggleOnline} 
 className={`fixed bottom-40 right-6 z-[200] size-16 rounded-full flex items-center justify-center transition-all duration-300 ${
 isOnline ? 'bg-emerald-500' : 'bg-zinc-900'
 }`}
 >
 <Icon 
 name="power_settings_new" 
 size={32} 
 className="text-white" 
 />
 </motion.button>
 )}

 <AnimatePresence>
 {!isNetworkConnected && (
 <motion.div 
 initial={{ y: 50, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 exit={{ y: 50, opacity: 0 }}
 className="fixed bottom-32 left-6 right-6 z-[600] pointer-events-none"
 >
 <div className="bg-zinc-950/90 text-white px-6 py-4 rounded-xl flex items-center gap-4 border border-white/10 ">
 <div className="size-10 rounded-full bg-rose-500 flex items-center justify-center animate-pulse">
 <Icon name="wifi_off" size={20} className="text-white" />
 </div>
 <div className="flex-1">
 <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1 text-white">Modo Offline</p>
 <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Verifique sua conexão de rede</p>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {renderBottomNavigation()}
 </div>
 </div>

 {showOnboarding && (
 <OnboardingView 
 userId={driverId || ''} 
 onApproved={() => {
 setShowOnboarding(false);
 setIsProfileLoaded(true);
 toastSuccess('Cadastro aprovado!');
 // Recarrega perfil para atualizar status
 if (driverId) {
 loadProfileAndEnforceOnboarding(driverId, authEmail || '', authName || '');
 }
 }} 
 onLogout={() => {
 setShowOnboarding(false);
 handleLogout();
 }}
 onClose={() => setShowOnboarding(false)}
 />
 )}

 {renderPendingApprovalModal()}
 </>
 )}
 </AnimatePresence>

 <AnimatePresence>
 {showWithdrawModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[150] bg-zinc-900/20 flex items-end justify-center"
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
 className="w-full max-w-lg bg-white rounded-t-[50px] p-8 pb-36 space-y-6 relative border-t border-zinc-100 "
 >
 {/* Drag Handle Improvements */}
 <div className="flex flex-col items-center gap-1.5 mb-2">
 <div className="w-12 h-1.5 bg-zinc-200 rounded-full " />
 <div className="w-8 h-1 bg-zinc-100 rounded-full" />
 </div>

 <div className="text-center space-y-1 py-2">
 <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.5em] mb-2 opacity-70">Resgate de Saldo</p>
 <div className="flex items-center justify-center gap-2">
 <span className="text-2xl font-black text-zinc-300">R$</span>
 <span className="text-6xl font-black text-zinc-900 tracking-tighter leading-none">
 {stats.balance.toFixed(2).replace('.', ',')}
 </span>
 </div>
 </div>

 <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-6 space-y-5 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-200/20 blur-3xl -mr-16 -mt-16 rounded-full pointer-events-none" />
 
 <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-zinc-100 ">
 <div className="flex flex-col gap-1">
 <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Chave PIX Ativa</span>
 <span className="text-xs font-black text-zinc-900 truncate max-w-[180px] tracking-tight">{pixKey}</span>
 </div>
 <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 ">
 <Icon name="qr_code_2" size={24} className="text-yellow-600" />
 </div>
 </div>

 <div className="space-y-4 px-2">
 {Number(appSettings?.withdrawal_fee_percent ?? 0) > 0 && (
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
 Taxa Admin
 <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-[8px] text-zinc-500 capitalize">{appSettings?.withdrawal_fee_percent}%</span>
 </span>
 <span className="text-xs font-black text-rose-500">- R$ {(stats.balance * (Number(appSettings?.withdrawal_fee_percent) / 100)).toFixed(2).replace('.', ',')}</span>
 </div>
 )}
 
 <div className="h-px bg-zinc-100 mx-2" />

 <div className="flex justify-between items-center py-2">
 <div className="flex flex-col">
 <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest">Valor Líquido</span>
 <span className="text-[8px] font-medium text-zinc-400 uppercase tracking-wider">Depósito imediato via PIX</span>
 </div>
 <span className="text-3xl font-black text-zinc-900">
 R$ {(stats.balance * (1 - (Number(appSettings?.withdrawal_fee_percent ?? 0) / 100))).toFixed(2).replace('.', ',')}
 </span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-4 p-5 rounded-[28px] border border-primary/10 overflow-hidden relative bg-primary/5">
 <div className="size-10 rounded-xl bg-primary flex items-center justify-center shrink-0 ">
 <Icon name="bolt" className="text-white" size={20} />
 </div>
 <p className="text-[9px] text-zinc-900/60 font-bold uppercase tracking-widest leading-relaxed relative z-10">
 Pagamentos processados em até <span className="text-zinc-900">{appSettings?.withdrawal_period_h ?? 24}h</span> úteis.
 </p>
 </div>

 <div className="flex gap-4 pt-4">
 <motion.button
 whileTap={{ scale: 0.95 }}
 onClick={() => setShowWithdrawModal(false)}
 disabled={isWithdrawLoading}
 className="flex-1 h-18 rounded-[30px] bg-zinc-50 border border-zinc-100 text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] active:bg-zinc-100 transition-all disabled:opacity-30"
 >
 Voltar
 </motion.button>
 <motion.button
 whileTap={{ scale: 0.95 }}
 onClick={confirmWithdraw}
 disabled={isWithdrawLoading}
 className="flex-[1.8] h-18 rounded-[30px] bg-yellow-400 text-zinc-950 font-black text-[10px] uppercase tracking-[0.2em] active:shadow-none transition-all disabled:opacity-50 flex items-center justify-center gap-3"
 >
 {isWithdrawLoading ? (
 <>
 <div className="size-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
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
 className="fixed inset-0 z-[200] bg-white/95 flex flex-col items-center justify-center p-8 text-center"
 >
 <motion.div 
 initial={{ scale: 0.5, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: "spring", damping: 12 }}
 className="size-32 rounded-xl bg-emerald-500 flex items-center justify-center mb-10"
 >
 <motion.span 
 initial={{ pathLength: 0 }}
 animate={{ pathLength: 1 }}
 className="material-symbols-outlined text-white text-6xl font-black"
 >
 check
 </motion.span>
 </motion.div>
 
 <motion.h2 
 initial={{ y: 20, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ delay: 0.2 }}
 className="text-3xl font-black text-zinc-900 uppercase tracking-tighter"
 >
 Saque Solicitado!
 </motion.h2>
 
 <motion.p 
 initial={{ y: 20, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ delay: 0.3 }}
 className="text-zinc-500 font-bold text-sm mt-4 max-w-xs leading-relaxed"
 >
 Sua solicitação de PIX foi enviada e já aparece no painel administrativo para aprovação.
 </motion.p>
 
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: "100%" }}
 transition={{ duration: 3, ease: "linear" }}
 className="h-1 bg-yellow-400/20 rounded-full mt-12 max-w-[200px] overflow-hidden"
 >
 <div className="h-full bg-yellow-400" />
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
 className="fixed inset-0 z-[300] bg-zinc-900/20 flex items-center justify-center p-6"
 >
 <motion.div 
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-sm bg-white border border-zinc-100 rounded-xl p-10 relative overflow-hidden "
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />

 <div className="size-20 rounded-xl bg-yellow-50 flex items-center justify-center mb-8 border border-zinc-100">
 <span className="material-symbols-outlined text-yellow-600 text-4xl animate-pulse">payments</span>
 </div>

 <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tighter mb-3">Atenção Piloto!</h3>
 <p className="text-zinc-500 font-bold text-sm leading-relaxed mb-10">
 Este pedido ainda <span className="text-rose-500 underline decoration-rose-500/30 underline-offset-4">não foi pago</span> via App. 
 <br />Confirme o recebimento de:
 <span className="block text-zinc-900 text-3xl font-black mt-2 tracking-tighter">
 R$ {Number(confirmPaymentState.mission.total_price || 0).toFixed(2).replace('.', ',')}
 </span>
 </p>

 <div className="space-y-4">
 {confirmPaymentState.isCashWarning ? (
 <motion.div 
 initial={{ opacity: 0, scale: 0.9 }}
 animate={{ opacity: 1, scale: 1 }}
 className="bg-rose-50 border border-rose-100 p-6 rounded-3xl"
 >
 <div className="flex items-start gap-4 mb-6">
 <div className="p-2 bg-rose-500/10 rounded-full border border-rose-500/20 shrink-0">
 <span className="material-symbols-outlined text-rose-500">warning</span>
 </div>
 <p className="text-rose-500 text-xs leading-relaxed font-bold">
 Ao confirmar o recebimento em <strong className="uppercase">Dinheiro</strong>, esse valor será descontado do seu saldo. Deseja confirmar?
 </p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => setConfirmPaymentState(prev => prev ? { ...prev, isCashWarning: false } : prev)}
 className="flex-1 py-4 rounded-2xl bg-white border border-zinc-100 text-zinc-400 font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
 >
 Voltar
 </button>
 <button 
 onClick={() => {
 confirmPaymentState.resolve('dinheiro');
 setConfirmPaymentState(null);
 }}
 className="flex-1 py-4 rounded-2xl bg-rose-500 text-white font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
 >
 Confirmar
 </button>
 </div>
 </motion.div>
 ) : (
 <>
 <button 
 onClick={() => setConfirmPaymentState(prev => prev ? { ...prev, isCashWarning: true } : prev)}
 className="w-full py-5 rounded-xl bg-yellow-400 text-zinc-950 font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
 >
 Recebi em Dinheiro
 </button>
 <button 
 onClick={() => {
 confirmPaymentState.resolve('pix_cartao');
 setConfirmPaymentState(null);
 }}
 className="w-full py-5 rounded-xl bg-zinc-50 border border-zinc-100 text-zinc-900 font-black text-sm uppercase tracking-widest hover:bg-zinc-100 transition-all active:scale-95 "
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
 className="fixed inset-0 z-[250] bg-white flex flex-col items-center justify-center p-8 text-center overflow-hidden"
 >
 <div className="absolute inset-0 pointer-events-none opacity-20">
 <div className="absolute top-1/4 left-1/4 size-64 bg-yellow-400/10 blur-[120px] rounded-full animate-pulse" />
 <div className="absolute bottom-1/4 right-1/4 size-64 bg-emerald-500/5 blur-[120px] rounded-full animate-pulse" />
 </div>

 <motion.div 
 initial={{ scale: 0.3, opacity: 0, rotate: -20 }}
 animate={{ scale: 1, opacity: 1, rotate: 0 }}
 transition={{ type: "spring", damping: 10, stiffness: 100 }}
 className="size-36 rounded-full bg-emerald-500 flex items-center justify-center mb-10 relative"
 >
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
 className="absolute inset-0 border-4 border-emerald-500 rounded-full"
 />
 </motion.div>
 
 <motion.div
 initial={{ y: 30, opacity: 0 }}
 animate={{ y: 0, opacity: 1 }}
 transition={{ delay: 0.2 }}
 className="space-y-4"
 >
 <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none text-center">
 Parabéns! <br />
 <span className="text-yellow-600">Missão Concluída</span>
 </h2>
 <p className="text-zinc-400 font-bold text-sm tracking-wide uppercase opacity-60">Você acaba de faturar:</p>
 </motion.div>

 <motion.div 
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ delay: 0.4 }}
 className="my-6 w-full max-w-sm px-6 py-8 bg-white border border-zinc-200 rounded-xl relative overflow-hidden"
 >
 <span className="block text-[10px] font-black text-yellow-600 uppercase tracking-[0.4em] mb-2 text-center">Ganho Líquido (Frete)</span>
 <div className="flex items-center justify-center gap-1">
 <span className="text-2xl font-black text-zinc-300 mt-3">R$</span>
 <span className="text-7xl font-black text-zinc-900 tracking-tighter leading-none">
 {(finishedMissionData.amount || 0).toFixed(2).replace('.', ',')}
 </span>
 </div>
 <div className="grid grid-cols-2 gap-3 pt-6 border-t border-zinc-200">
 <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex flex-col items-center justify-center ">
 <span className="block text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total do Pedido</span>
 <span className="text-lg font-black text-zinc-700">
 R$ {(finishedMissionData.grossAmount || 0).toFixed(2).replace('.', ',')}
 </span>
 </div>
 <div className="bg-zinc-800 p-3 rounded-xl border border-zinc-700 flex flex-col items-center justify-center ">
 <span className="block text-[8px] font-black text-yellow-600 uppercase tracking-widest mb-1">XP Ganhos</span>
 <div className="flex items-center gap-1">
 <span className="text-lg font-black text-yellow-600">+{finishedMissionData.xpGained || 15}</span>
 <span className="text-[10px] font-black text-yellow-600/50">XP</span>
 </div>
 </div>
 </div>
 {finishedMissionData.cashDiscount && finishedMissionData.cashDiscount > 0 && (
 <div className="mt-3 bg-rose-50 border border-rose-100 p-4 rounded-xl flex items-center justify-center gap-3">
 <div className="size-8 rounded-full bg-rose-500/10 flex items-center justify-center">
 <span className="material-symbols-outlined text-rose-500 text-sm font-black">payments</span>
 </div>
 <div className="text-left flex-1">
 <span className="block text-[9px] font-black text-rose-600 uppercase tracking-widest mb-0.5">Dinheiro Retido</span>
 <span className="text-sm font-black text-rose-500">
 - R$ {finishedMissionData.cashDiscount.toFixed(2).replace('.', ',')}
 </span>
 </div>
 </div>
 )}
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
 className="w-full h-16 rounded-xl bg-white text-zinc-950 font-black text-xs uppercase tracking-[0.3em] active:scale-95 transition-all hover:bg-primary"
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
 className="absolute inset-0 bg-zinc-900/20 "
 onClick={() => {
 setShowApprovedSlotModal(false);
 stopIziSounds();
 }}
 />
 <motion.div
 initial={{ scale: 0.8, y: 50, opacity: 0 }}
 animate={{ scale: 1, y: 0, opacity: 1 }}
 exit={{ scale: 0.8, y: 50, opacity: 0 }}
 className="relative w-full max-w-sm bg-white p-8 flex flex-col items-center gap-8 overflow-hidden border border-zinc-100 rounded-xl "
 >
 <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-3xl -mr-16 -mt-16 rounded-full" />
 
 <div className="size-24 rounded-xl bg-yellow-400 flex items-center justify-center ">
 <Icon name="verified" size={48} className="text-zinc-950" />
 </div>

 <div className="text-center space-y-3">
 <h2 className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.4em]">Parabéns!</h2>
 <h3 className="text-3xl font-black text-zinc-900 tracking-tighter leading-none">VAGA CONFIRMADA</h3>
 <p className="text-xs text-zinc-400 leading-relaxed font-bold px-4">
 Você foi selecionado para a vaga de <span className="text-zinc-900">{approvedSlotData.title}</span> em <span className="text-zinc-900">{approvedSlotData.admin_users?.store_name || 'um novo parceiro'}</span>.
 </p>
 </div>

 <div className="w-full h-px bg-gradient-to-r from-transparent via-zinc-100 to-transparent" />

 <div className="w-full flex flex-col gap-4">
 <div className="flex justify-between items-center px-4 py-3 bg-zinc-50 rounded-xl border border-zinc-100">
 <div className="flex flex-col">
 <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Garantido</p>
 <p className="text-xl font-black text-yellow-600 leading-none">R$ {parseFloat(approvedSlotData.fee_per_day || 0).toFixed(0)} <span className="text-[10px] not-italic text-zinc-300">/ dia</span></p>
 </div>
 <Icon name="payments" className="text-zinc-100" size={32} />
 </div>
 </div>

 <button 
 onClick={() => {
 setShowApprovedSlotModal(false);
 stopIziSounds();
 setActiveTab('dedicated');
 setSelectedSlot(approvedSlotData);
 }}
 className="w-full h-20 bg-yellow-400 text-zinc-950 rounded-xl font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all flex items-center justify-center gap-4 border-t border-white/40"
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
 {showHelpModal && renderHelpModal()}
 </AnimatePresence>

 {/* Popup de Notificação do Sistema Minimalista */}
 <AnimatePresence>
 {systemNotification && (
 <motion.div
 initial={{ opacity: 0, y: -50 }}
 animate={{ opacity: 1, y: 16 }}
 exit={{ opacity: 0, y: -50 }}
 className="fixed top-0 left-0 right-0 z-[9999] px-4 pointer-events-auto"
 >
 <div className="max-w-md mx-auto bg-white rounded-2xl p-4 flex items-center gap-4 shadow-2xl shadow-black/10 border border-zinc-100">
 <div className="bg-yellow-400/10 p-2.5 rounded-xl text-yellow-600 shrink-0">
 <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
 </div>
 
 <div className="flex-1 overflow-hidden">
 <h4 className="text-zinc-900 font-bold text-sm leading-tight truncate">
 {systemNotification.title}
 </h4>
 <p className="text-zinc-500 text-[11px] font-semibold mt-0.5 line-clamp-2">
 {systemNotification.message}
 </p>
 </div>
 
 <button 
 onClick={() => setSystemNotification(null)}
 className="bg-zinc-100 hover:bg-zinc-200 p-2 rounded-lg text-zinc-400 transition-colors flex-shrink-0"
 >
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* In-App Broadcast Popups */}
 <AnimatePresence>
 {renderBroadcastPopup()}
 </AnimatePresence>
 
 {renderSystemPopup()}


 </div>
 );
}

export default function App() {
 return (
 <ErrorBoundary>
 <MainApp />
 </ErrorBoundary>
 );
}




