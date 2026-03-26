import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

interface IziTrackingMapProps {
  driverLoc: { lat: number, lng: number } | null;
  userLoc: { lat: number, lng: number } | null;
}

export function IziTrackingMap({ driverLoc, userLoc }: IziTrackingMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string ?? ''
  });

  if (!isLoaded || !driverLoc) return (
    <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center backdrop-blur-sm z-10">
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] animate-pulse">Buscando Sinal do Flash...</p>
      </div>
    </div>
  );

  const center = driverLoc ? { lat: driverLoc.lat, lng: driverLoc.lng } : { lat: -23.5505, lng: -46.6333 };

  return (
    <div className="w-full h-full relative z-0">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={center}
        zoom={16}
        options={{
            disableDefaultUI: true,
            zoomControl: false,
            styles: [
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
                { featureType: 'water', elementType: 'labels.text.stroke', stylers: [{ color: '#17263c' }] }
            ]
        }}
      >
        <Marker position={center} />
        {userLoc && <Marker position={{ lat: userLoc.lat, lng: userLoc.lng }} />}
      </GoogleMap>
    </div>
  );
}
