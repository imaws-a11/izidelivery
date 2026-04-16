import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../context/AdminContext';
import { mapContainerStyle, darkMapStyle, wazeMapStyle } from '../constants/mapStyles';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { isDriverOnline } from '../lib/driverPresence';

// Rastreamento em Tempo Real
export default function TrackingTab() {
  const {
    allOrders, driversList, selectedTrackingItem, setSelectedTrackingItem, 
    trackingListTab, setTrackingListTab, isLoaded, mapsLoadError, mapCenterView
  } = useAdmin();

  const onlineDrivers = useMemo(
    () => driversList.filter(driver => isDriverOnline(driver)),
    [driversList]
  );

  const onlineDriversWithCoords = useMemo(
    () => onlineDrivers.filter(driver => driver.lat && driver.lng),
    [onlineDrivers]
  );

  return (
    <>
      {/* Map View Section */}
      <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 overflow-hidden border-r border-slate-200 dark:border-slate-800">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <span className="text-slate-300 dark:text-slate-800 font-black text-6xl uppercase tracking-[1em] rotate-12 opacity-20">Mapa de Operações</span>
    </div>

    {/* Driver Markers */}
    {onlineDriversWithCoords.map((d) => (
      <motion.div
        key={d.id}
        onClick={() => setSelectedTrackingItem({ type: 'driver', ...d })}
        initial={{ scale: 0 }}
        animate={{
          scale: selectedTrackingItem?.id === d.id ? 1.2 : 1,
          zIndex: selectedTrackingItem?.id === d.id ? 50 : 30
        }}
        style={(d.lat && d.lng) ? {
          top: `${((d.lat + 23.5) * 500) % 80 + 10}%`,
          left: `${((d.lng + 46.6) * 500) % 80 + 10}%`
        } : { display: 'none' }}
        className="absolute group cursor-pointer"
      >
        <div className="relative flex flex-col items-center">
          <div className={`absolute bottom-full mb-3 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all shadow-2xl border border-white/10 uppercase tracking-widest flex items-center gap-2 ${selectedTrackingItem?.id === d.id ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
            <div className="size-2 rounded-full bg-green-500 animate-pulse"></div>
            {d.name} • {d.vehicle_type || 'Moto'}
          </div>
          <div className={`size-12 rounded-[20px] flex items-center justify-center shadow-2xl border-4 transition-all duration-500 ${selectedTrackingItem?.id === d.id ? 'bg-primary text-slate-900 border-primary shadow-primary/40 scale-110' : 'bg-slate-900 text-primary border-slate-800 group-hover:border-primary/50'}`}>
            <span className="material-symbols-outlined text-2xl font-bold">sports_motorsports</span>
          </div>
          <div className="absolute -inset-2 bg-primary/20 rounded-full blur-xl animate-pulse -z-10"></div>
        </div>
      </motion.div>
    ))}

    {/* Integrated Google Map */}
    {mapsLoadError ? (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 gap-4 p-8 text-center">
         <span className="material-symbols-outlined text-5xl text-red-400">map_off</span>
         <p className="text-sm font-black text-white uppercase tracking-widest">Google Maps não autorizado</p>
         <p className="text-xs text-slate-400 max-w-xs">Verifique se a Maps JavaScript API e Places API estão ativadas no Google Cloud Console e se localhost está na lista de origens permitidas.</p>
      </div>
    ) : isLoaded ? (
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenterView}
        zoom={13}
        options={{
          styles: darkMapStyle,
          disableDefaultUI: true,
          zoomControl: false,
        }}
      >
        {onlineDrivers.map((driver, i) => (
          <Marker
            key={driver.id}
            position={{
              lat: mapCenterView.lat + (i * 0.005) * Math.sin(i),
              lng: mapCenterView.lng + (i * 0.005) * Math.cos(i)
            }}
            onClick={() => setSelectedTrackingItem({ type: 'driver', ...driver })}
            options={{
              icon: {
                url: 'https://cdn-icons-png.flaticon.com/512/3253/3253113.png',
                scaledSize: new window.google.maps.Size(40, 40)
              }
            }}
          />
        ))}

        {/* Order Markers */}
        {allOrders.filter(o => ['pending', 'picked_up', 'a_caminho'].includes(o.status)).map((order, i) => (
          <Marker
            key={order.id}
            position={{
              lat: mapCenterView.lat - (i * 0.008) * Math.cos(i),
              lng: mapCenterView.lng + (i * 0.008) * Math.sin(i)
            }}
            onClick={() => setSelectedTrackingItem({ type: 'order', ...order })}
            options={{
              icon: {
                url: 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
                scaledSize: new window.google.maps.Size(35, 35)
              }
            }}
          />
        ))}
      </GoogleMap>
    ) : (
      <div className="w-full h-full bg-slate-900 animate-pulse flex items-center justify-center">
        <span className="text-slate-400 font-black uppercase tracking-widest italic text-xs">Iniciando GIS Google...</span>
      </div>
    )}

    {/* Info Overlay for Selected Item */}
    {selectedTrackingItem && (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-6 left-6 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-6 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl z-50"
      >
        <div className="flex justify-between items-start mb-4">
          <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${selectedTrackingItem.type === 'driver' ? 'bg-primary/10 text-primary' : 'bg-blue-500/10 text-blue-500'}`}>
            {selectedTrackingItem.type === 'driver' ? 'Entregador' : 'Pedido'}
          </div>
          <button onClick={() => setSelectedTrackingItem(null)} className="text-slate-400 hover:text-slate-900"><span className="material-symbols-outlined text-sm">close</span></button>
        </div>
        <h4 className="font-black text-lg dark:text-white mb-1">{selectedTrackingItem.name || `Pedido #${selectedTrackingItem.id?.slice(0, 5).toUpperCase()}`}</h4>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          {selectedTrackingItem.type === 'driver' ? `${selectedTrackingItem.vehicle_type || 'Moto'} • ${selectedTrackingItem.license_plate || 'Sem Placa'}` : selectedTrackingItem.delivery_address}
        </p>

        <div className="flex flex-col gap-2">
          <button className="w-full py-3 bg-primary text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-105 transition-all">Ver Detalhes Full</button>
          <button className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-slate-200 transition-all text-center">Notificar</button>
        </div>
      </motion.div>
    )}

    {/* Map Controls */}
    <div className="absolute bottom-6 right-6 flex flex-col gap-3">
      <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all border border-slate-200 dark:border-slate-700">
        <span className="material-symbols-outlined font-bold">add</span>
      </button>
      <button className="size-12 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center hover:bg-primary hover:text-slate-900 transition-all border border-slate-200 dark:border-slate-700">
        <span className="material-symbols-outlined font-bold">remove</span>
      </button>
    </div>
  </div>

  {/* List Section */}
  <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-slate-950 flex flex-col h-full shrink-0">
    <div className="p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-black text-xl tracking-tight">Monitor de Operações</h3>
        <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary/20">
          {allOrders.filter(o => !['concluido', 'cancelado'].includes(o.status)).length} Ativos
        </span>
      </div>
      <div className="flex gap-2">
        {[
          { id: 'orders', label: 'Pedidos', icon: 'shopping_bag' },
          { id: 'drivers', label: 'Entregadores', icon: 'sports_motorsports' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setTrackingListTab(tab.id as any)}
            className={`flex-1 py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${trackingListTab === tab.id
              ? 'bg-slate-900 text-white border-slate-900 shadow-lg'
              : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-100 dark:border-slate-800 hover:bg-slate-50'
              }`}
          >
            <span className="material-symbols-outlined text-xs">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>
    </div>

    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
      {trackingListTab === 'orders' ? (
        allOrders.filter(o => !['concluido', 'cancelado'].includes(o.status)).map((o, i) => {
          const isPending = o.status === 'pending';
          const isTransit = o.status === 'picked_up' || o.status === 'a_caminho';
          const isSelected = selectedTrackingItem?.id === o.id;

          return (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              key={o.id}
              onClick={() => setSelectedTrackingItem({ type: 'order', ...o })}
              className={`p-5 rounded-[28px] border transition-all cursor-pointer group hover:scale-[1.02] ${isSelected
                ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30'
                }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-xl flex items-center justify-center ${isPending ? 'bg-amber-100 text-amber-600' : 'bg-primary/20 text-primary'} group-hover:scale-110 transition-transform`}>
                    <span className="material-symbols-outlined text-xl">{o.service_type === 'mototaxi' ? 'hail' : 'package_2'}</span>
                  </div>
                  <div>
                    <h4 className="font-black text-sm tracking-tight dark:text-white">#{o.id.slice(0, 5).toUpperCase()}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{o.service_type || 'Delivery'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black tracking-tighter dark:text-white">R$ {o.total_price?.toFixed(2)}</p>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Valor</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-xs text-slate-400">location_on</span>
                  <span className="text-[10px] font-bold text-slate-500 truncate">{o.delivery_address}</span>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${isPending ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></span>
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {isPending ? 'Aguardando Piloto' : isTransit ? 'Em Rota de Entrega' : o.status}
                    </span>
                  </div>
                  <button className="text-primary group-hover:translate-x-1 transition-transform">
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })
      ) : (
        onlineDrivers.map((d, i) => (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            key={d.id}
            onClick={() => setSelectedTrackingItem({ type: 'driver', ...d })}
            className={`p-5 rounded-[28px] border transition-all cursor-pointer group hover:scale-[1.02] ${selectedTrackingItem?.id === d.id
              ? 'bg-primary/5 border-primary shadow-lg shadow-primary/10'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-primary/30'
              }`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-slate-800">
                  <span className="material-symbols-outlined text-2xl text-slate-400">person</span>
                </div>
                <div>
                  <h4 className="font-black text-sm tracking-tight dark:text-white">{d.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="size-1.5 rounded-full bg-green-500"></div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d.vehicle_type || 'Moto'}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="material-symbols-outlined text-xs">star</span>
                  <span className="text-xs font-black">4.9</span>
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase">Avaliação</p>
              </div>
            </div>
          </motion.div>
        ))
      )}
      </div>
    </div>
  </>
);
}
