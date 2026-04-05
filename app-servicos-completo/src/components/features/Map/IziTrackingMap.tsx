import { GoogleMap, Marker, Polyline } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../../../hooks/useGoogleMapsLoader';
import { useRef, useCallback, useState, useMemo, useEffect } from 'react';

interface IziTrackingMapProps {
  driverLoc?: { lat: number; lng: number } | null;
  userLoc?: { lat: number; lng: number } | null;
  routePolyline?: string;
  onMyLocationClick?: () => void;
}

/**
 * ESTILO WAZE CLEAN - SUAVE & FLUIDO
 * Remove excesso de labels e usa cores contrastantes suaves.
 */
const WAZE_CLEAN_STYLE: google.maps.MapTypeStyle[] = [
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#d3d3d3" }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road.highway", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road.arterial", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road.local", "elementType": "geometry.fill", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.local", "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "administrative", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c93a3" }] },
  { "featureType": "road", "elementType": "labels.text.stroke", "stylers": [{ "visibility": "on" }, { "color": "#ffffff" }, { "weight": 2 }] }
];

export function IziTrackingMap({ driverLoc, userLoc, routePolyline, onMyLocationClick }: IziTrackingMapProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Decodifica a polilinha para o formato legível pelo Google Maps
  const path = useMemo(() => {
    if (!routePolyline || !window.google?.maps?.geometry?.encoding) return [];
    try {
      return google.maps.geometry.encoding.decodePath(routePolyline);
    } catch (e) {
      console.error("Erro ao decodificar polilinha:", e);
      return [];
    }
  }, [routePolyline, isLoaded]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    if (path.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      map.fitBounds(bounds, 80);
    }
  }, [path]);

  const [isFollowing, setIsFollowing] = useState(true);

  // Auto-fit bounds quando o path muda dinamicamente
  useEffect(() => {
    if (mapRef.current && path.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      mapRef.current.fitBounds(bounds, { top: 120, bottom: 250, right: 50, left: 50 });
      setIsFollowing(false); // Quando ajustamos o zoom para a rota toda, paramos de seguir o ponto fixo
    }
  }, [path]);

  // Seguir o motorista ou usuário suavemente
  useEffect(() => {
    if (isFollowing && mapRef.current) {
        const target = driverLoc || userLoc;
        if (target) {
            mapRef.current.panTo(target);
        }
    }
  }, [driverLoc, userLoc, isFollowing]);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleCenterUser = () => {
    setIsLocating(true);
    setIsFollowing(true);
    
    if (onMyLocationClick) {
      onMyLocationClick();
    }
    
    if (userLoc && mapRef.current) {
      mapRef.current.panTo(userLoc);
      mapRef.current.setZoom(16);
    }
    
    setTimeout(() => setIsLocating(false), 1500);
  };

  // Fallback quando a API falha
  if (loadError) {
    const loc = driverLoc ?? userLoc;
    return (
      <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-4 z-10 p-8 border border-white/5">
        <div className="size-16 rounded-3xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-yellow-400">map_off</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-white mb-1 uppercase tracking-tighter">Izi Maps Indisponível</p>
          <p className="text-[10px] text-white/30 font-medium leading-relaxed">
            Houve um problema de carregamento. Verifique sua chave API.
          </p>
        </div>
        {loc && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-center">
            <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Backup Lat/Lng</p>
            <p className="text-[11px] font-bold text-white/60 font-mono">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-10">
        <div className="flex flex-col items-center gap-4">
          <div className="size-14 border-4 border-yellow-400/10 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-[9px] font-black text-yellow-400/50 uppercase tracking-[0.4em] animate-pulse">Sintonizando Satélite</p>
        </div>
      </div>
    );
  }

  const initialCenter = driverLoc ?? userLoc ?? { lat: -23.5505, lng: -46.6333 };

  return (
    <div className="w-full h-full relative z-0 overflow-hidden rounded-[inherit]">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={initialCenter}
        zoom={path.length > 0 ? 14 : 15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onDragStart={() => setIsFollowing(false)} // PARA DE SEGUIR QUANDO O USUÁRIO ARRASTA
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'greedy',
          styles: WAZE_CLEAN_STYLE,
          backgroundColor: '#f5f5f5',
          clickableIcons: false
        }}
      >
        {/* ROTA AMARELA ESTILO IZI/WAZE */}
        {path.length > 0 && (
          <Polyline
            path={path}
            options={{
              strokeColor: "#FFD700", // Gold/Amarelo Forte
              strokeOpacity: 0.9,
              strokeWeight: 6,
              zIndex: 10
            }}
          />
        )}

        {driverLoc && window.google?.maps?.marker?.AdvancedMarkerElement && (
          <Marker
            position={driverLoc}
            options={{
              icon: {
                 url: 'https://cdn-icons-png.flaticon.com/128/3448/3448339.png',
                 scaledSize: new window.google.maps.Size(42, 42),
                 anchor: new window.google.maps.Point(21, 21),
              }
            }}
            zIndex={100}
          />
        )}

        {userLoc && window.google?.maps?.marker?.AdvancedMarkerElement && (
           <Marker
            position={userLoc}
            options={{
              icon: {
                url: 'https://cdn-icons-png.flaticon.com/128/484/484167.png',
                scaledSize: new window.google.maps.Size(34, 34),
                anchor: new window.google.maps.Point(17, 34),
              }
            }}
            zIndex={90}
          />
        )}
      </GoogleMap>

      {/* Botão de Localização Atual - Posição adaptada */}
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
    </div>
  );
}
