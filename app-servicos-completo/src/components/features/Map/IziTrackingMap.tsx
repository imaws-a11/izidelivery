import { GoogleMap, OverlayView, Polyline } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useGoogleMapsLoader } from '../../../hooks/useGoogleMapsLoader';
import { useRef, useCallback, useState, useEffect } from 'react';

/**
 * IZI TRACKING MAP V7 - ESTABILIDADE TOTAL
 * Implementa mapa não controlado para evitar jitter e sobreposição.
 */

interface IziTrackingMapProps {
  driverLoc?: { lat: number; lng: number } | null;
  userLoc?: { lat: number; lng: number } | null;
  originLoc?: { lat: number; lng: number } | null;
  destLoc?: { lat: number; lng: number } | null;
  routePolyline?: string | any[] | null;
  vehicleIcon?: string;
  originLabel?: string;
  onMyLocationClick?: (force?: boolean) => void;
  boxed?: boolean;
  searching?: boolean;
  bottomPadding?: number; // Permite deslocar o centro ótico do mapa para cima
}

// Opções de Estilo (Dark Mode Premium)
const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  gestureHandling: 'greedy',
  clickableIcons: false,
  maxZoom: 20,
  minZoom: 3,
};

const isValid = (c: any) => c && typeof c.lat === 'number' && c.lat !== 0 && !isNaN(c.lat);

export function IziTrackingMap({ 
  driverLoc, 
  userLoc, 
  originLoc,
  destLoc,
  routePolyline,
  vehicleIcon = "directions_car", 
  originLabel = "COLETA", 
  onMyLocationClick,
  boxed = false,
  searching = false,
  bottomPadding = 400 // Padrão de 400px de folga na base para BottomSheets
}: IziTrackingMapProps) {
  const { isLoaded } = useGoogleMapsLoader();
  const mapRef = useRef<google.maps.Map | null>(null);
  const [centered, setCentered] = useState(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const isInteracting = useRef(false);
  const lastPanPos = useRef<{ lat: number, lng: number } | null>(null);

  // Centro padrão de fallback alterado de BH para Suzano (Rua Henry Karam 660)
  const defaultCenter = { lat: -23.540134, lng: -46.311746 };

  // Função centralizadora com threshold (limiar) de 5 metros aprox.
  const smoothPan = useCallback((loc: { lat: number, lng: number }) => {
    if (mapRef.current && isValid(loc)) {
      if (lastPanPos.current) {
        const dLat = Math.abs(lastPanPos.current.lat - loc.lat);
        const dLng = Math.abs(lastPanPos.current.lng - loc.lng);
        // Se a mudança for menor que ~1 metro (0.00001), ignora para evitar trepidação
        if (dLat < 0.00001 && dLng < 0.00001) return;
      }
      mapRef.current.panTo(loc);
      // Fuga do BottomSheet em tempo real
      mapRef.current.panBy(0, bottomPadding / 2.5);
      lastPanPos.current = loc;
    }
  }, []);

  // Se o endereço de origem mudar (usuário digitou/selecionou), força a retomada do foco
  useEffect(() => {
    if (isValid(originLoc)) {
      setIsFollowing(true);
    }
  }, [originLoc]);

  // Efeito principal de seguimento
  useEffect(() => {
    if (isLoaded && mapRef.current && isFollowing && !isInteracting.current) {
      // Prioridade: Entregador > Origem Digitada > Usuário Real
      const target = driverLoc && isValid(driverLoc) ? driverLoc : (isValid(originLoc) ? originLoc : userLoc);
      
      if (isValid(target)) {
        if (!centered) {
          mapRef.current.setCenter(target!);
          mapRef.current.setZoom(17);
          setCentered(true);
        } else {
          smoothPan(target!);
        }
      }
    }
  }, [isLoaded, userLoc, originLoc, driverLoc, isFollowing, centered, smoothPan]);

  // Ajuste de Bounds quando tem Rota
  useEffect(() => {
    if (isLoaded && mapRef.current && isValid(originLoc) && isValid(destLoc)) {
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(originLoc!);
      bounds.extend(destLoc!);
      mapRef.current.fitBounds(bounds, { top: 120, bottom: 350, left: 60, right: 60 });
      setIsFollowing(false); // Quando vê a rota, para de seguir automaticamente
    }
  }, [isLoaded, originLoc, destLoc]);

  const handleRecenter = () => {
    if (isValid(driverLoc)) {
      // Se há entregador, o botão foca nele e ativa o seguimento
      setIsFollowing(true);
      mapRef.current?.panTo(driverLoc!);
    } else {
      // Se não há entregador, o botão vai para o GPS do usuário e para de focar no Card de Origem
      setIsFollowing(false);
      const target = isValid(userLoc) ? userLoc : originLoc;
      if (isValid(target)) mapRef.current?.panTo(target!);
    }
    mapRef.current?.setZoom(17);
    if (onMyLocationClick) onMyLocationClick(true);
  };

  if (!isLoaded) return (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <div className="size-10 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className={`relative w-full h-full bg-zinc-50 ${boxed ? "rounded-[40px] overflow-hidden" : ""}`}>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={MAP_OPTIONS}
        onLoad={(map) => {
          mapRef.current = map;
          const initial = isValid(originLoc) ? originLoc! : isValid(userLoc) ? userLoc! : defaultCenter;
          map.setCenter(initial);
          map.setZoom(15);
          
          // Deslocamento forçado na largada para salvar o pino do soterramento
          map.panBy(0, bottomPadding / 2.5);
        }}
        onDragStart={() => {
          isInteracting.current = true;
          setIsFollowing(false);
        }}
        onDragEnd={() => {
          isInteracting.current = false;
        }}
        onZoomChanged={() => {
          // Se o zoom mudar manualmente, paramos de seguir o GPS para não dar trancos
          setIsFollowing(false);
        }}
      >
        {/* Rota */}
        {routePolyline && (
          <Polyline
            path={typeof routePolyline === 'string' ? google.maps.geometry.encoding.decodePath(routePolyline) : routePolyline}
            options={{ strokeColor: '#facc15', strokeOpacity: 0.9, strokeWeight: 5 }}
          />
        )}

        {/* Marcador de Usuário (Blue Dot) */}
        {isValid(userLoc) && (
          <OverlayView position={userLoc!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div className="size-6 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse">
                <div className="size-4 bg-blue-600 rounded-full border-2 border-white shadow-xl" />
              </div>
            </div>
          </OverlayView>
        )}



        {/* Marcador de Entrega */}
        {isValid(destLoc) && (
          <OverlayView position={destLoc!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative -translate-x-1/2 -translate-y-full mb-2">
              <div className="size-12 bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white">
                <span className="material-symbols-rounded text-yellow-400 text-2xl font-black">flag</span>
              </div>
              <div className="w-0.5 h-3 bg-white mx-auto -mt-0.5" />
            </div>
          </OverlayView>
        )}

        {/* Marcador do Motorista */}
        {isValid(driverLoc) && (
          <OverlayView position={driverLoc!} mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}>
            <div className="relative -translate-x-1/2 -translate-y-1/2">
              <div className="size-14 bg-yellow-400 rounded-[28px] flex items-center justify-center shadow-2xl border-2 border-white ring-8 ring-yellow-400/10">
                <span className="material-symbols-rounded text-black text-3xl font-black">{vehicleIcon}</span>
              </div>
            </div>
          </OverlayView>
        )}
      </GoogleMap>

      {/* Botão de Localização */}
      <div className="absolute top-44 right-6 z-[200]">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={handleRecenter}
          className="size-14 rounded-2xl bg-white/95 backdrop-blur-2xl border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-[0_15px_35px_rgba(0,0,0,0.2)] active:bg-zinc-100 transition-colors"
        >
          <span className={`material-symbols-rounded text-2xl ${isFollowing ? 'text-blue-500 animate-pulse' : 'text-zinc-600'}`}>
            {isFollowing ? 'gps_fixed' : 'my_location'}
          </span>
        </motion.button>
      </div>

      {/* Radar de Busca */}
      <AnimatePresence>
        {searching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center pointer-events-none z-[210]"
          >
             <div className="flex flex-col items-center gap-6">
                <div className="relative size-24">
                  <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <div className="absolute inset-4 bg-yellow-400/10 rounded-full animate-pulse" />
                </div>
                <div className="px-8 py-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-2xl">
                   <p className="text-white font-black text-[11px] uppercase tracking-[0.4em]">Buscando Entregadores</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
