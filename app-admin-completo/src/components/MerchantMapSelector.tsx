import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toastError } from '../lib/useToast';
import { useAdmin } from '../context/AdminContext';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '24px'
};

const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "elementType": "geometry.stroke", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#475569" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.neighborhood", "stylers": [{ "visibility": "off" }] },
  { "featureType": "landscape.man_made", "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#334155" }, { "weight": 0.5 }] },
  { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] }
];

interface MerchantMapSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { address: string; lat: number; lng: number; placeId?: string }) => void;
  initialCoords?: { lat: number; lng: number };
  initialAddress?: string;
}

export default function MerchantMapSelector({ isOpen, onClose, onConfirm, initialCoords, initialAddress }: MerchantMapSelectorProps) {
  const { isLoaded } = useAdmin();
  const [markerPos, setMarkerPos] = useState<{ lat: number; lng: number } | null>(initialCoords || null);
  const [address, setAddress] = useState(initialAddress || '');
  const [loading, setLoading] = useState(false);
  const [placeId, setPlaceId] = useState('');
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const getCurrentLocation = useCallback(() => {
    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const newPos = { lat, lng };
          setMarkerPos(newPos);
          map?.panTo(newPos);
          reverseGeocode(lat, lng);
        },
        () => {
          toastError('Não foi possível obter sua localização');
          setLoading(false);
        }
      );
    }
  }, [map]);

  useEffect(() => {
    if (isOpen && isLoaded && !markerPos) {
      getCurrentLocation();
    }
  }, [isOpen, isLoaded, getCurrentLocation, markerPos]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!isLoaded || !window.google) return;
    
    setLoading(true);
    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === window.google.maps.GeocoderStatus.OK && results && results[0]) {
          setAddress(results[0].formatted_address);
          setPlaceId(results[0].place_id);
        } else {
          setAddress('Endereço não encontrado');
          setPlaceId('');
        }
        setLoading(false);
      });
    } catch (error) {
      console.error('Erro na geocoficação reversa:', error);
      toastError('Erro ao buscar endereço');
      setLoading(false);
    }
  };

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, []);

  const onMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPos({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, []);

  const handleConfirm = () => {
    if (markerPos && address) {
      onConfirm({
        address,
        lat: markerPos.lat,
        lng: markerPos.lng,
        placeId
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl overflow-hidden flex flex-col h-[80vh]"
      >
        {/* Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined font-bold">map</span>
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Selecionar Localização</h3>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Clique no mapa para definir o ponto exato da sua loja</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="size-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-500 transition-all flex items-center justify-center"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 p-8 pt-4 relative">
          <div className="w-full h-full rounded-[32px] overflow-hidden border border-slate-100 dark:border-slate-800 shadow-inner bg-slate-50 dark:bg-slate-950">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={markerPos || initialCoords || { lat: -23.55052, lng: -46.633309 }}
                zoom={15}
                onClick={onMapClick}
                onLoad={setMap}
                options={{
                  styles: darkMapStyle,
                  disableDefaultUI: false,
                  mapTypeControl: false,
                  streetViewControl: false,
                  fullscreenControl: false,
                }}
              >
                {markerPos && (
                  <Marker 
                    position={markerPos}
                    draggable={true}
                    onDragEnd={onMarkerDragEnd}
                    animation={window.google?.maps?.Animation?.DROP}
                  />
                )}
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Carregando Google Maps...</p>
              </div>
            )}
          </div>

          {/* Current Location Button */}
          {isLoaded && (
            <button 
              onClick={getCurrentLocation}
              className="absolute top-12 right-12 size-12 rounded-2xl bg-white dark:bg-slate-950 shadow-2xl flex items-center justify-center text-slate-400 hover:text-primary transition-all group z-10 border border-slate-100 dark:border-slate-800"
              title="Minha Localização"
            >
              <span className="material-symbols-outlined group-active:scale-90 transition-transform">my_location</span>
            </button>
          )}

          {/* Floating Address Card */}
          <AnimatePresence>
            {address && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-12 left-12 right-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl p-6 rounded-[28px] border border-white/20 shadow-2xl z-10"
              >
                <div className="flex items-start gap-4">
                  <div className="size-10 rounded-xl bg-primary flex items-center justify-center text-slate-900 shrink-0">
                    <span className="material-symbols-outlined text-xl">location_on</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Endereço Detectado</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {loading ? 'Buscando endereço...' : address}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-8 pt-0 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black text-[12px] uppercase tracking-widest rounded-3xl hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleConfirm}
            disabled={!markerPos || loading}
            className="flex-[2] py-5 bg-primary text-slate-900 font-black text-[12px] uppercase tracking-widest rounded-3xl shadow-xl shadow-primary/20 hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Confirmar Localização
          </button>
        </div>
      </motion.div>
    </div>
  );
}
