import { GoogleMap, Polyline, OverlayView } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../../../hooks/useGoogleMapsLoader';
import { GMAPS_KEY } from '../../../config';
import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Icon } from '../../common/Icon';
import { motion } from 'framer-motion';

interface IziTrackingMapProps {
  driverLoc?: { lat: number; lng: number } | null;
  userLoc?: { lat: number; lng: number } | null;
  routePolyline?: string;
  onMyLocationClick?: () => void;
  boxed?: boolean;
  vehicleIcon?: string; // Nome do ícone Material Symbols para o motorista
  originLabel?: string; // Label do ponto de origem
}


/**
 * ESTILO DARK SIMULATION - MINIMALISTA & PREMIUM
 * Focado totalmente no trajeto, removendo distrações e usando tons de cinza profundos com preto.
 */
const RADAR_CLEAN_STYLE: google.maps.MapTypeStyle[] = [
  { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#444444" }] },
  { "featureType": "all", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
  { "featureType": "all", "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative", "elementType": "geometry.fill", "stylers": [{ "color": "#000000" }] },
  { "featureType": "landscape", "elementType": "geometry", "stylers": [{ "color": "#080808" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#111111" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#111111" }, { "lightness": -20 }] },
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#1a1a1a" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#050505" }] }
];


export function IziTrackingMap({ driverLoc, userLoc, routePolyline, onMyLocationClick, boxed = false, vehicleIcon = "two_wheeler", originLabel = "ORIGEM" }: IziTrackingMapProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isFollowing, setIsFollowing] = useState(!routePolyline);

  const isValidCoord = (coord: any) => coord && coord.lat !== 0 && coord.lng !== 0;

  // Decodifica a polilinha para o formato legível pelo Google Maps
  // Mapear o path da rota
  const path = useMemo(() => {
    if (!routePolyline) return [];
    
    // Se já for um array de objetos {lat, lng} ou LatLng
    if (Array.isArray(routePolyline)) {
      return routePolyline;
    }

    // Se for string, decodificar
    if (typeof routePolyline === 'string' && window.google?.maps?.geometry?.encoding) {
      try {
        return google.maps.geometry.encoding.decodePath(routePolyline);
      } catch (e) {
        console.error("Erro decodificando polyline:", e);
        return [];
      }
    }

    return [];
  }, [routePolyline, isLoaded]);

  const initialCenter = useMemo(() => {
     if (isValidCoord(driverLoc)) return driverLoc!;
     if (isValidCoord(userLoc)) return userLoc!;
     return { lat: -23.5505, lng: -46.6333 };
  }, [driverLoc, userLoc]);
  
  const [mapCenter, setMapCenter] = useState(initialCenter);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, 80);
      setIsFollowing(false);
    } else if (isValidCoord(userLoc)) {
      // Mapa abre IMEDIATAMENTE na localizacao do usuario
      map.setCenter(new google.maps.LatLng(userLoc!.lat, userLoc!.lng));
      map.setZoom(16);
      setInitialLoaded(true);
    } else if (isValidCoord(driverLoc)) {
      map.setCenter(new google.maps.LatLng(driverLoc!.lat, driverLoc!.lng));
      map.setZoom(16);
      setInitialLoaded(true);
    } else {
      setInitialLoaded(true);
    }
  }, [path, userLoc, driverLoc]);

  // Auto-fit bounds quando path chega (mount assíncrono após cálculo de rota)
  useEffect(() => {
    if (!mapRef.current || path.length < 2) return;
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    mapRef.current.fitBounds(bounds, { top: 60, bottom: 80, right: 40, left: 40 });
    setInitialLoaded(true);
    setIsFollowing(false);
  }, [path]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Centralização e Seguimento: reage a mudanças na localização do usuário
  useEffect(() => {
    if (!mapRef.current || !isValidCoord(userLoc)) return;
    
    if (!initialLoaded) {
      // Primeira vez com coordenadas válidas: jump imediato
      console.log("[MAP] Primeira localização detectada, centralizando...");
      mapRef.current.setCenter(new google.maps.LatLng(userLoc!.lat, userLoc!.lng));
      mapRef.current.setZoom(16);
      setMapCenter(userLoc!);
      setInitialLoaded(true);
    } else if (isFollowing) {
      // Modo seguindo ou botão clicado: pan suave
      console.log("[MAP] Atualizando centralização (seguindo):", userLoc);
      mapRef.current.panTo(new google.maps.LatLng(userLoc!.lat, userLoc!.lng));
      
      // Se estávamos "localizando" (esperando GPS), agora que chegou podemos parar o spinner
      if (isLocating) {
        setIsLocating(false);
      }
    }
  }, [userLoc, isFollowing, routePolyline, initialLoaded, isLocating]);

  const handleCenterUser = () => {
    if (isLocating) return;
    setIsLocating(true);
    setIsFollowing(true);
    
    const moveMap = (lat: number, lng: number) => {
      if (mapRef.current) {
        console.log("[MAP] Centralização DIRETA disparada:", lat, lng);
        const newPos = new google.maps.LatLng(lat, lng);
        mapRef.current.setCenter(newPos);
        mapRef.current.setZoom(16);
        setIsLocating(false);
      }
    };

    // 1. TENTA NATIVO (Capacitor)
    if (Capacitor.isNativePlatform()) {
      Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 })
        .then(pos => {
          moveMap(pos.coords.latitude, pos.coords.longitude);
        })
        .catch(() => setIsLocating(false));
    } 
    // 2. TENTA WEB (Browser)
    else if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          moveMap(pos.coords.latitude, pos.coords.longitude);
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }

    // 3. SEMPRE CHAMA O GLOBAL (para atualizar endereço e outros componentes)
    if (onMyLocationClick) {
      onMyLocationClick();
    }

    // Backup para desligar o spinner
    setTimeout(() => setIsLocating(false), 5000);
  };

  // RENDERIZAÇÃO CONDICIONAL APÓS TODOS OS HOOKS
  if (loadError) {
    const loc = driverLoc ?? userLoc;
    return (
      <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-4 z-10 p-8 border border-white/5 font-italic">
        <div className="size-16 rounded-3xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-yellow-400">map_off</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter italic">Izi Maps Indisponível</p>
          <p className="text-[10px] text-white/30 font-medium leading-relaxed italic">
            Houve um problema de carregamento. {!GMAPS_KEY ? 'Chave de API do Google Maps não encontrada no sistema.' : 'Verifique se sua chave API é válida.'}
          </p>
        </div>
        {isValidCoord(loc) && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-center">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1 italic">Backup Lat/Lng</p>
            <p className="text-[11px] font-bold text-white/60 font-mono italic">{loc!.lat.toFixed(5)}, {loc!.lng.toFixed(5)}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-10 italic">
        <div className="flex flex-col items-center gap-4">
          <div className="size-14 border-4 border-yellow-400/10 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-[9px] font-black text-yellow-400/50 uppercase tracking-[0.4em] animate-pulse">Sintonizando Satélite</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative z-0 overflow-hidden rounded-[inherit] italic">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        defaultCenter={initialCenter}
        zoom={path.length > 0 ? 15 : 16}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onDragStart={() => setIsFollowing(false)}
        options={{
          disableDefaultUI: true,
          styles: RADAR_CLEAN_STYLE,
          backgroundColor: '#000000',
          gestureHandling: 'greedy',
          zoomControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          clickableIcons: false
        }}
      >
        {path.length > 0 && (
          <>
            <Polyline
              path={path}
              options={{
                strokeColor: "#FACD05",
                strokeOpacity: 0.4,
                strokeWeight: 12,
                zIndex: 100
              }}
            />
            <Polyline
              path={path}
              options={{
                strokeColor: "#FACD05",
                strokeOpacity: 1,
                strokeWeight: 6,
                zIndex: 101
              }}
            />
            {/* Marcadores de Início e Fim da Rota */}
            <OverlayView position={path[0]} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
               <div className="relative flex items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
                  <div className="absolute size-6 rounded-full bg-yellow-400/30 animate-pulse" />
                  <div className="size-3 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
               </div>
            </OverlayView>
            <OverlayView position={path[path.length - 1]} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
               <div className="relative flex items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
                  <div className="absolute size-8 rounded-full bg-yellow-400/20 animate-ping" />
                  <div className="size-3.5 rounded-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,1)]" />
               </div>
            </OverlayView>
          </>
        )}

        {/* Marcador do Motorista - Minimalista Amarelo Pulsante */}
        {isValidCoord(driverLoc) && (
          <OverlayView position={driverLoc!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative flex items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
              <div className="absolute size-10 rounded-full bg-yellow-400/20 animate-ping" />
              <div className="absolute size-6 rounded-full bg-yellow-400/40 animate-pulse" />
              <div className="size-4 rounded-full bg-yellow-400 shadow-[0_0_20px_rgba(250,204,21,1)] border-2 border-black" />
            </div>
          </OverlayView>
        )}

        {/* Marcador do Usuário — Pin Izi Amarelo com Círculo Preto */}
        {isValidCoord(userLoc) && (
          <OverlayView position={userLoc!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative flex items-center justify-center" style={{ transform: 'translate(-50%, -100%)' }}>
              
              {/* Pulso de localização na base do PIN */}
              <div
                className="absolute rounded-full animate-ping"
                style={{
                  width: 32,
                  height: 32,
                  background: 'rgba(250,204,21,0.25)',
                  animationDuration: '2s',
                  bottom: -16
                }}
              />

              {/* Corpo do PIN (SVG para precisão total do shape da imagem) */}
              <motion.div 
                initial={{ scale: 0, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                className="relative z-10 flex flex-col items-center"
              >
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                  {/* Forma da Gota/Pin */}
                  <path 
                    d="M12 22C12 22 19 15.5 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 15.5 12 22 12 22Z" 
                    fill="#facc15" 
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  {/* Círculo Preto Central */}
                  <circle cx="12" cy="10" r="3.5" fill="#000000" />
                </svg>

                {/* Sombra pequena no pé do pin */}
                <div className="size-1.5 rounded-full bg-black/40 blur-[1px] -mt-1" />
              </motion.div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Botão de Localização — FORÇADO FIXED z-[1000] para garantir visibilidade */}
      {!boxed && (
        <div className="fixed z-[1000]" style={{ bottom: 'calc(35vh + 30px)', left: '24px' }}>
          <button
            onClick={handleCenterUser}
            disabled={isLocating}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative
              ${isLocating ? 'scale-90' : 'active:scale-90'}`}
            style={{
              background: 'linear-gradient(145deg, #facc15, #eab308)',
              boxShadow: 'inset 4px 4px 8px rgba(255,255,255,0.7), inset -4px -4px 8px rgba(0,0,0,0.12)',
              border: '2px solid rgba(255,255,255,0.3)',
            }}
          >
            <span className={`material-symbols-outlined text-[26px] font-black text-black leading-none
              ${isLocating ? 'animate-spin' : ''}`}>
              {isLocating ? 'progress_activity' : 'my_location'}
            </span>
            {isFollowing && !isLocating && (
              <div className="absolute inset-0 rounded-2xl border-[3px] border-yellow-300/40 animate-ping pointer-events-none" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}
