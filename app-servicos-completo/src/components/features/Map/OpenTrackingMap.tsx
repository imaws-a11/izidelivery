import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';

interface OpenTrackingMapProps {
  driverLoc?: { lat: number; lng: number } | null;
  pickupLoc?: { lat: number; lng: number } | null;
  userLoc?: { lat: number; lng: number } | null;
  onMyLocationClick?: () => void;
  orderStatus?: string;
}

// Fix Leaflet icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons - Ponto Amarelo Pulsante Minimalista
const driverIcon = new L.DivIcon({
  className: 'custom-driver',
  html: `<div class="relative flex items-center justify-center">
           <div class="absolute w-8 h-8 bg-yellow-400 opacity-20 rounded-full animate-ping"></div>
           <div class="absolute w-5 h-5 bg-yellow-400 opacity-30 rounded-full animate-pulse"></div>
           <div class="w-2.5 h-2.5 bg-yellow-400 rounded-full border border-black/40 shadow-[0_0_15px_rgba(250,204,21,1)]"></div>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const pickupIcon = new L.DivIcon({
  className: 'custom-pickup',
  html: `<div class="relative flex items-center justify-center">
           <div class="absolute w-6 h-6 bg-yellow-400 opacity-20 rounded-full animate-pulse"></div>
           <div class="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

const userIcon = new L.DivIcon({
  className: 'custom-user',
  html: `<div class="relative flex items-center justify-center">
           <div class="absolute w-6 h-6 bg-yellow-400 opacity-20 rounded-full animate-pulse"></div>
           <div class="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
         </div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

// Component to handle auto bounds
function FitBounds({ pathPositions, locs }: any) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const bounds = L.latLngBounds([]);
    
    if (pathPositions && pathPositions.length > 0) {
      pathPositions.forEach((pos: any) => bounds.extend(pos));
    }
    
    locs.forEach((loc: any) => {
      if (loc) bounds.extend([loc.lat, loc.lng]);
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [map, pathPositions, locs]);
  return null;
}

export function OpenTrackingMap({ driverLoc, pickupLoc, userLoc, onMyLocationClick, orderStatus }: OpenTrackingMapProps) {
  const [routePrimary, setRoutePrimary] = useState<[number, number][]>([]);
  // const [routeSecondary, setRouteSecondary] = useState<[number, number][]>([]);

  useEffect(() => {
    // Determine the route to fetch based on what's available
    const fetchRoute = async () => {
      try {
        let waypoints = [];
        if (driverLoc) waypoints.push(`${driverLoc.lng},${driverLoc.lat}`);
        
        const isCollected = ['picked_up', 'a_caminho', 'saiu_para_entrega', 'em_rota', 'chegou_cliente', 'concluido'].includes(orderStatus || '');

        if (!isCollected && pickupLoc) {
          // Se não coletou, mostra caminho até a loja
          waypoints.push(`${pickupLoc.lng},${pickupLoc.lat}`);
        } else if (userLoc) {
          // Se já coletou (ou não tem pickup), mostra caminho até o usuário
          waypoints.push(`${userLoc.lng},${userLoc.lat}`);
        }

        // Need at least 2 points to route
        if (waypoints.length < 2) return;

        // Using completely free OSRM demo server for the route
        const url = `https://router.project-osrm.org/route/v1/driving/${waypoints.join(';')}?overview=full&geometries=geojson`;
        const res = await axios.get(url);

        if (res.data?.routes?.[0]?.geometry?.coordinates) {
          const coords = res.data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]] as [number, number]);
          setRoutePrimary(coords);
        }
      } catch (err) {
        console.error("OSRM Route fetching error:", err);
      }
    };
    
    fetchRoute();
  }, [driverLoc, pickupLoc, userLoc, orderStatus]);

  // Determine initial center
  const initialCenter = driverLoc ?? pickupLoc ?? userLoc ?? { lat: -23.5505, lng: -46.6333 };

  return (
    <div className="w-full h-full relative z-0 overflow-hidden rounded-[inherit]">
      <MapContainer 
        center={[initialCenter.lat, initialCenter.lng]} 
        zoom={14} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Usando um mapa escuro/minimalista do CartoDB, que foca na rota */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <FitBounds pathPositions={routePrimary} locs={[driverLoc, pickupLoc, userLoc]} />

        {/* Caminho principal */}
        {routePrimary.length > 0 && (
          <Polyline positions={routePrimary} color="#facc15" weight={6} opacity={0.9} />
        )}

        {pickupLoc && (
          <Marker position={[pickupLoc.lat, pickupLoc.lng]} icon={pickupIcon} />
        )}

        {userLoc && (
          <Marker position={[userLoc.lat, userLoc.lng]} icon={userIcon} />
        )}

        {/* Renderiza o entregador por último para ficar sempre por cima */}
        {driverLoc && (
          <Marker position={[driverLoc.lat, driverLoc.lng]} icon={driverIcon} zIndexOffset={100} />
        )}
      </MapContainer>

      {/* Botão de Localização */}
      <button
        onClick={onMyLocationClick}
        className="absolute bottom-32 right-4 z-[400] w-12 h-12 bg-zinc-900 text-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.2)] flex items-center justify-center border border-white/10 active:scale-95 transition-transform"
      >
        <span className="material-symbols-outlined">my_location</span>
      </button>
    </div>
  );
}
