import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../../../hooks/useGoogleMapsLoader';
import { useRef, useCallback, useState } from 'react';

interface IziTrackingMapProps {
  driverLoc?: { lat: number; lng: number } | null;
  userLoc?: { lat: number; lng: number } | null;
  onMyLocationClick?: () => void;
}

const WAZE_NIGHT: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#263c3f' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#6b9a76' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#1f2835' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#f3d19c' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#515c6d' }] },
  { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] },
];

export function IziTrackingMap({ driverLoc, userLoc, onMyLocationClick }: IziTrackingMapProps) {
  const { isLoaded, loadError } = useGoogleMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleCenterUser = () => {
    if (onMyLocationClick) {
      setIsLocating(true);
      onMyLocationClick();
      // Reset locating state after a delay
      setTimeout(() => setIsLocating(false), 2000);
    }
    
    if (userLoc && mapRef.current) {
      mapRef.current.panTo(userLoc);
      mapRef.current.setZoom(16);
    }
  };

  // Fallback quando a API falha
  if (loadError) {
    const loc = driverLoc ?? userLoc;
    return (
      <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center gap-4 z-10 p-8">
        <div className="size-16 rounded-3xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-3xl text-yellow-400">map</span>
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-white mb-1">Mapa indisponível</p>
          <p className="text-[10px] text-white/30 font-medium text-balance">
            A API do Google Maps encontrou um problema. Verifique as restrições da chave no console.
          </p>
        </div>
        {loc && (
          <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-center">
            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Localização</p>
            <p className="text-xs font-bold text-white/70">{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}</p>
          </div>
        )}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center backdrop-blur-sm z-10">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] animate-pulse">Carregando Mapa...</p>
        </div>
      </div>
    );
  }

  const center = driverLoc ?? userLoc ?? { lat: -23.5505, lng: -46.6333 };

  return (
    <div className="w-full h-full relative z-0">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={15}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          disableDefaultUI: true,
          zoomControl: false,
          gestureHandling: 'greedy',
          styles: WAZE_NIGHT,
        }}
      >
        {driverLoc && (
          <Marker
            position={driverLoc}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/128/3448/3448339.png',
              scaledSize: new google.maps.Size(40, 40),
              anchor: new google.maps.Point(20, 20),
            }}
            zIndex={100}
          />
        )}
        {userLoc && (
          <Marker
            position={userLoc}
            icon={{
              url: 'https://cdn-icons-png.flaticon.com/128/484/484167.png',
              scaledSize: new google.maps.Size(32, 32),
              anchor: new google.maps.Point(16, 32),
            }}
            zIndex={90}
          />
        )}
      </GoogleMap>

      {/* Botão de Localização Atual */}
      <div className="absolute top-6 right-6 flex flex-col gap-3 z-10">
        <button
          onClick={handleCenterUser}
          disabled={isLocating}
          className={`size-12 rounded-2xl flex items-center justify-center shadow-2xl transition-all active:scale-90
            ${isLocating ? 'bg-yellow-400' : 'bg-white/10 hover:bg-white/20'} 
            backdrop-blur-xl border border-white/20`}
        >
          <span className={`material-symbols-rounded text-2xl 
            ${isLocating ? 'text-black animate-spin' : 'text-white'}`}>
            {isLocating ? 'progress_activity' : 'my_location'}
          </span>
        </button>
      </div>
    </div>
  );
}
