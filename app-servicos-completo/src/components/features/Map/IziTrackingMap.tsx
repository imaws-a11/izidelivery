import { GoogleMap, Polyline, OverlayView } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../../../hooks/useGoogleMapsLoader';
import { GMAPS_KEY } from '../../../config';
import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { Icon } from '../../common/Icon';

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
  const [isFollowing, setIsFollowing] = useState(true);

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
    } else {
      setInitialLoaded(true);
    }
  }, [path]);

  // Auto-fit bounds quando path chega (mount assíncrono após cálculo de rota)
  useEffect(() => {
    if (!mapRef.current || path.length < 2) return;
    const bounds = new google.maps.LatLngBounds();
    path.forEach(p => bounds.extend(p));
    mapRef.current.fitBounds(bounds, { top: 60, bottom: 80, right: 40, left: 40 });
    setIsFollowing(false);
  }, [path]); // reage a qualquer mudança no array (referência ou tamanho)

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Centralização dinâmica baseada em mudanças de localização
  useEffect(() => {
    if (isValidCoord(userLoc) && isFollowing && !routePolyline && mapRef.current) {
      mapRef.current.panTo(userLoc!);
    }
  }, [userLoc, isFollowing, routePolyline]);

  const handleCenterUser = () => {
    setIsLocating(true);
    setIsFollowing(true);
    
    if (onMyLocationClick) {
      onMyLocationClick();
    }
    
    if (isValidCoord(userLoc) && mapRef.current) {
      mapRef.current.panTo(userLoc!);
      mapRef.current.setZoom(16);
    }
    
    setTimeout(() => setIsLocating(false), 1500);
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
        center={mapCenter}
        zoom={path.length > 0 ? 15 : 14}
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

        {/* Marcador do Usuário/Lojista - Minimalista Amarelo Pulsante */}
        {isValidCoord(userLoc) && (
          <OverlayView position={userLoc!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative flex items-center justify-center" style={{ transform: 'translate(-50%, -50%)' }}>
              <div className="absolute size-8 rounded-full bg-yellow-400/20 animate-pulse" />
              <div className="size-3 rounded-full bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] border border-black/20" />
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Botão de Localização Atual - Apenas se não for boxed */}
      {!boxed && (
        <div className="absolute bottom-32 right-6 flex flex-col gap-3 z-10">
          <button
            onClick={handleCenterUser}
            disabled={isLocating}
            className={`size-14 rounded-[22px] flex items-center justify-center shadow-[0_20px_40px_rgba(0,0,0,0.3)] transition-all active:scale-[0.85]
              ${isLocating ? 'bg-yellow-400' : 'bg-white/95 hover:bg-white'} 
              backdrop-blur-xl border border-white`}
          >
            <span className={`material-symbols-rounded text-2xl 
              ${isLocating ? 'text-black animate-spin' : 'text-zinc-800'}`}>
              {isLocating ? 'progress_activity' : 'my_location'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
