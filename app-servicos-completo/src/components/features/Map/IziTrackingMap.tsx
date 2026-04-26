import { GoogleMap, OverlayView, Polyline } from '@react-google-maps/api';
import { useGoogleMapsLoader } from '../../../hooks/useGoogleMapsLoader';
import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * IZI TRACKING MAP V6 - RECONSTRUÇÃO PASSO A PASSO
 * Etapa 1: Mapa Limpo + Você + Botão de Localização.
 */

interface IziTrackingMapProps {
  driverLoc?: { lat: number; lng: number } | null;
  userLoc?: { lat: number; lng: number } | null;
  originLoc?: { lat: number; lng: number } | null;
  destLoc?: { lat: number; lng: number } | null;
  routePolyline?: string | any[] | null;
  vehicleIcon?: string;
  originLabel?: string;
  onMyLocationClick?: () => void;
  boxed?: boolean;
  searching?: boolean;
}

export function IziTrackingMap({ 
  driverLoc, 
  userLoc, 
  originLoc,
  destLoc,
  routePolyline,
  vehicleIcon = "directions_car", 
  originLabel = "COLETA", 
  onMyLocationClick,
  boxed,
  searching
}: IziTrackingMapProps) {
  const { isLoaded } = useGoogleMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [centered, setCentered] = useState(false);
  const [isRelocating, setIsRelocating] = useState(false);

  const isValid = (c: any) => c && typeof c.lat === 'number' && c.lat !== 0;

  // Radar effect component
  const RadarOverlay = ({ pos }: { pos: { lat: number, lng: number } }) => (
    <OverlayView position={pos} mapPaneName={OverlayView.FLOAT_PANE}>
      <div className="relative -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="absolute inset-0 size-64 -translate-x-1/2 -translate-y-1/2">
           <div className="absolute inset-0 bg-yellow-400/20 rounded-full animate-[ping_3s_linear_infinite]" />
           <div className="absolute inset-0 bg-yellow-400/10 rounded-full animate-[ping_3s_linear_infinite_1.5s] scale-75" />
           <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
        <div className="size-4 bg-yellow-400 rounded-full border-2 border-white shadow-lg relative z-10" />
      </div>
    </OverlayView>
  );

  // Centralização automática e manual
  const centerMap = useCallback((loc: { lat: number, lng: number }, zoom = 17) => {
    if (mapRef.current && isValid(loc)) {
      mapRef.current.setCenter(loc);
      mapRef.current.setZoom(zoom);
    }
  }, []);

  const lastUserLoc = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (isLoaded && mapRef.current && isValid(userLoc)) {
      const loc = userLoc!;
      const isFirstCenter = !centered;
      
      // Verifica se a coordenada física realmente mudou
      const hasChanged = !lastUserLoc.current || 
                         lastUserLoc.current.lat !== loc.lat || 
                         lastUserLoc.current.lng !== loc.lng;

      if (isFirstCenter) {
        centerMap(loc, 17);
        setCentered(true);
        lastUserLoc.current = loc;
      } else if (hasChanged) {
        // Apenas acompanha se o GPS atualizou a posição real
        mapRef.current.panTo(loc);
        lastUserLoc.current = loc;
      }
    }
  }, [isLoaded, userLoc, centered, centerMap]);

  if (!isLoaded) return <div className="w-full h-full bg-zinc-900" />;

  return (
    <div className="relative w-full h-full bg-white">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        onLoad={(map) => { mapRef.current = map; }}
        onUnmount={() => { mapRef.current = null; }}
        options={{ 
          disableDefaultUI: true,
          gestureHandling: 'greedy', // Melhora interação em mobile
          clickableIcons: false
        }}
      >
        {/* RADAR DE BUSCA */}
        {searching && isValid(originLoc || userLoc) && (
          <RadarOverlay pos={(originLoc || userLoc)!} />
        )}

        {/* ROTA TRAÇADA (PRE-PREENCHIDA OU COMPRADA) */}
        {routePolyline && (
          <Polyline
            path={
              typeof routePolyline === 'string'
                ? google.maps.geometry.encoding.decodePath(routePolyline)
                : routePolyline
            }
            options={{
              strokeColor: '#facc15', // Tailwind yellow-400
              strokeOpacity: 0.9,
              strokeWeight: 4,
            }}
          />
        )}

        {/* MARCADOR DE ORIGEM (COLETA) */}
        {isValid(originLoc) && (
          <OverlayView position={originLoc!} mapPaneName={OverlayView.FLOAT_PANE}>
            <div className="relative -translate-x-1/2 -translate-y-full mb-1">
               <div className="bg-white px-3 py-1.5 rounded-full shadow-2xl border border-zinc-200 flex items-center gap-2">
                  <div className="size-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-black text-black uppercase italic">{originLabel}</span>
               </div>
               <div className="w-px h-3 bg-zinc-300 mx-auto" />
            </div>
          </OverlayView>
        )}

        {/* MARCADOR DE VOCÊ */}
        {isValid(userLoc) && (
          <OverlayView position={userLoc!} mapPaneName={OverlayView.FLOAT_PANE}>
            <div className="relative -translate-x-1/2 -translate-y-1/2">
               <div className="size-10 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <div className="size-5 bg-blue-600 rounded-full border-2 border-white shadow-lg" />
               </div>
            </div>
          </OverlayView>
        )}

        {/* MARCADOR DE DESTINO */}
        {isValid(destLoc) && (
          <OverlayView position={destLoc!} mapPaneName={OverlayView.FLOAT_PANE}>
            <div className="relative -translate-x-1/2 -translate-y-full mb-1">
               <div className="size-10 bg-black rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white">
                  <span className="material-symbols-rounded text-white text-xl">flag</span>
               </div>
               <div className="w-0.5 h-3 bg-black mx-auto" />
            </div>
          </OverlayView>
        )}

        {/* MARCADOR DO MOTORISTA */}
        {isValid(driverLoc) && (
          <OverlayView position={driverLoc!} mapPaneName={OverlayView.FLOAT_PANE}>
            <div className="relative -translate-x-1/2 -translate-y-1/2">
               <div className="size-14 bg-yellow-400 rounded-3xl flex items-center justify-center shadow-2xl border-2 border-white">
                  <span className="material-symbols-rounded text-black text-2xl font-black">{vehicleIcon}</span>
               </div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>

    </div>
  );
}
