import React, { useMemo, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { mapContainerStyle, cleanLightStyle } from '../constants/mapStyles';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { isDriverOnline } from '../lib/driverPresence';

// Rastreamento em Tempo Real - Full Screen Uber Style
export default function TrackingTab() {
  const {
    driversList, selectedTrackingItem, setSelectedTrackingItem, 
    trackingListTab, setTrackingListTab, isLoaded, mapsLoadError, mapCenterView,
    allOrders, setActiveTab, setSelectedDriverStudio, setEditType
  } = useAdmin();

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [showList, setShowList] = useState(true);
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserCoords(pos);
          if (mapRef) {
             mapRef.panTo(pos);
          }
        },
        null,
        { enableHighAccuracy: true }
      );
    }
  }, [mapRef]);

  const onlineDrivers = useMemo(
    () => driversList.filter(driver => driver.is_online && !driver.is_deleted),
    [driversList]
  );

  const onlineDriversWithCoords = useMemo(
    () => onlineDrivers.filter(driver => {
      const lat = Number(driver.lat || driver.current_lat);
      const lng = Number(driver.lng || driver.current_lng);
      return lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
    }),
    [onlineDrivers]
  );

  const getDriverActivity = (driverId: string) => {
    const activeOrder = allOrders.find(o => 
      o.driver_id === driverId && 
      ['aceito', 'preparando', 'picked_up', 'pendente', 'em_rota', 'a_caminho', 'no_local', 'waiting_merchant', 'waiting_driver', 'agendado', 'scheduled'].includes(o.status)
    );
    return activeOrder ? 'busy' : 'available';
  };

  const handleCenterOnMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapRef?.panTo(pos);
          mapRef?.setZoom(15);
        },
        () => {
          alert("Não foi possível obter sua localização precisa.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden">
      {/* Integrated Google Map - Full Screen */}
      <div className="absolute inset-0 w-full h-full">
        {mapsLoadError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4 p-8 text-center">
             <span className="material-symbols-outlined text-5xl text-red-400">map_off</span>
             <p className="text-sm font-black text-white uppercase tracking-widest">Google Maps não autorizado</p>
          </div>
        ) : isLoaded ? (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={mapCenterView}
            zoom={13}
            onLoad={(map) => setMapRef(map)}
            options={{
              styles: cleanLightStyle,
              disableDefaultUI: true,
              zoomControl: false,
              backgroundColor: '#ffffff'
            }}
          >
            {userCoords && (
              <Marker
                position={userCoords}
                options={{
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: '#3b82f6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 2,
                  }
                }}
              />
            )}
            {onlineDriversWithCoords.map((driver) => (
              <Marker
                key={driver.id}
                position={{
                  lat: Number(driver.lat || driver.current_lat),
                  lng: Number(driver.lng || driver.current_lng)
                }}
                onClick={() => setSelectedTrackingItem({ type: 'driver', ...driver })}
                options={{
                  icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 12,
                    fillColor: getDriverActivity(driver.id) === 'busy' ? '#f59e0b' : '#10b981',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                  },
                  label: {
                    text: driver.name.charAt(0).toUpperCase(),
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '900'
                  }
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-white animate-pulse flex items-center justify-center">
            <span className="text-slate-400 font-black uppercase tracking-[0.5em] italic text-xs">Sincronizando GIS...</span>
          </div>
        )}
      </div>

      {/* Floating Command Center Overlay */}
      <div className="absolute top-28 right-8 z-50 flex flex-col items-end gap-4 pointer-events-none">
        <motion.div 
          layout
          className={`pointer-events-auto bg-slate-900/90 backdrop-blur-3xl rounded-[40px] border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden ${showList ? 'w-[400px]' : 'w-20 h-20 rounded-full'}`}
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              {showList ? (
                <>
                  <div>
                    <h3 className="font-black text-2xl tracking-tighter text-white uppercase italic">Central Operações</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{onlineDrivers.length} Pilotos Ativos</p>
                    </div>
                  </div>
                  <button onClick={() => setShowList(false)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-sm">close_fullscreen</span>
                  </button>
                </>
              ) : (
                <button onClick={() => setShowList(true)} className="size-10 rounded-full bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-sm font-black">list</span>
                </button>
              )}
            </div>

            {showList && (
              <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                {onlineDrivers.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center opacity-30">
                    <span className="material-symbols-outlined text-5xl mb-4 text-slate-500">person_off</span>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nenhum piloto online</p>
                  </div>
                ) : (
                  onlineDrivers.map((d, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={d.id}
                      onClick={() => {
                        setSelectedTrackingItem({ type: 'driver', ...d });
                        if (d.lat && d.lng) {
                          mapRef?.panTo({ lat: Number(d.lat), lng: Number(d.lng) });
                          mapRef?.setZoom(16);
                        }
                      }}
                      className={`p-5 rounded-[28px] border transition-all cursor-pointer flex items-center justify-between group ${selectedTrackingItem?.id === d.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="size-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 overflow-hidden shrink-0">
                          {d.avatar_url ? <img src={d.avatar_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-xl text-slate-500">person</span>}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-white uppercase truncate tracking-tight">{d.name}</h4>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{d.vehicle_type || 'Moto'}</p>
                        </div>
                      </div>
                      <div className="size-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary group-hover:text-slate-900 transition-all text-slate-500">
                        <span className="material-symbols-outlined text-xs">arrow_forward_ios</span>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Selected Driver Action Card - Floating Left */}
      <AnimatePresence>
        {selectedTrackingItem && (
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            className="absolute top-28 left-8 z-[60] w-96 bg-slate-900/95 backdrop-blur-3xl p-10 rounded-[48px] border border-white/10 shadow-2xl"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="px-4 py-1.5 bg-primary text-slate-900 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                Piloto Monitorado
              </div>
              <button onClick={() => setSelectedTrackingItem(null)} className="size-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="flex items-center gap-6 mb-10">
              <div className="size-24 rounded-[32px] bg-white/5 border-4 border-white/5 flex items-center justify-center overflow-hidden shadow-inner">
                {selectedTrackingItem.avatar_url ? <img src={selectedTrackingItem.avatar_url} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-slate-500">person</span>}
              </div>
              <div>
                <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic">{selectedTrackingItem.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedTrackingItem.vehicle_model || 'Veículo IZI'}</p>
                   <div className="size-1 rounded-full bg-slate-700"></div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">{selectedTrackingItem.license_plate || 'SEM PLACA'}</p>
                </div>
              </div>
            </div>

            {(() => {
               const activeOrder = allOrders.find(o => 
                 o.driver_id === selectedTrackingItem.id && 
                 ['aceito', 'preparando', 'picked_up', 'pendente', 'em_rota', 'a_caminho', 'no_local', 'waiting_merchant', 'waiting_driver', 'agendado', 'scheduled'].includes(o.status)
               );
               const statusLabel = activeOrder ? 'Em Rota' : 'Disponível';
               const statusColor = activeOrder ? 'text-emerald-500' : 'text-primary';

               return (
                 <div className="grid grid-cols-2 gap-4 mb-10">
                    <div className="bg-white/5 p-5 rounded-[28px] border border-white/5 text-center">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status</p>
                       <p className={`text-xs font-black ${statusColor} uppercase`}>{statusLabel}</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-[28px] border border-white/5 text-center">
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Rating</p>
                       <div className="flex items-center justify-center gap-1">
                         <span className="material-symbols-outlined text-xs text-amber-500 fill-amber-500">star</span>
                         <p className="text-xs font-black text-white">{selectedTrackingItem.rating || '5.0'}</p>
                       </div>
                    </div>
                 </div>
               );
            })()}

            <div className="flex flex-col gap-3">
              <div className="flex gap-3">
                <a href={`tel:${selectedTrackingItem.phone}`} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[24px] flex items-center justify-center gap-3 transition-all border border-white/10">
                   <span className="material-symbols-outlined text-sm">phone</span>
                   <span className="text-[10px] font-black uppercase tracking-widest">Ligar</span>
                </a>
                <a href={`https://wa.me/55${selectedTrackingItem.phone?.replace(/\D/g, '')}`} target="_blank" className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[24px] flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20">
                   <span className="material-symbols-outlined text-sm font-bold">message</span>
                   <span className="text-[10px] font-black uppercase tracking-widest">Zap</span>
                </a>
              </div>
              <button 
                onClick={() => {
                  setSelectedDriverStudio(selectedTrackingItem);
                  setEditType('driver');
                  setActiveTab('drivers');
                }}
                className="w-full py-5 bg-primary text-slate-900 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm font-bold">visibility</span>
                Ver Detalhes do Piloto
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Precise Geolocation & Controls */}
      <div className="absolute bottom-12 right-12 z-50 flex flex-col gap-4">
        <button 
          onClick={handleCenterOnMe}
          className="size-16 rounded-[24px] bg-slate-900/90 backdrop-blur-2xl text-white shadow-2xl flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all border border-white/10 group relative"
          title="Minha Localização Precisa"
        >
          <span className="material-symbols-outlined font-black group-active:scale-90 transition-transform">my_location</span>
          <div className="absolute inset-0 rounded-[24px] bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity -z-10"></div>
        </button>
        
        <div className="flex flex-col bg-slate-900/90 backdrop-blur-2xl rounded-[24px] border border-white/10 shadow-2xl overflow-hidden">
          <button onClick={() => mapRef?.setZoom((mapRef.getZoom() || 13) + 1)} className="size-14 text-white hover:bg-white/10 flex items-center justify-center border-b border-white/5">
            <span className="material-symbols-outlined font-black">add</span>
          </button>
          <button onClick={() => mapRef?.setZoom((mapRef.getZoom() || 13) - 1)} className="size-14 text-white hover:bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined font-black">remove</span>
          </button>
        </div>
      </div>
    </div>
  );
}
