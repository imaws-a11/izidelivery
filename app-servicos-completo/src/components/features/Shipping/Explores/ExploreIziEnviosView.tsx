import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useApp } from "../../../../contexts/AppContext";
import { supabase } from "../../../../lib/supabase";
import { useGoogleMapsLoader } from "../../../../hooks/useGoogleMapsLoader";

// Estilos de Mapa Silver Otimizados
const MAP_STYLES = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c9c9c9" }] }
];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  styles: MAP_STYLES,
  gestureHandling: 'greedy',
  tilt: 45,
  zoomControl: false,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  backgroundColor: '#f5f5f5'
};

interface ExploreIziEnviosViewProps {
  onBack: () => void;
}

export const ExploreIziEnviosView: React.FC<ExploreIziEnviosViewProps> = ({ onBack }) => {
  const { setSubView, setTransitData, transitData, userLocation } = useApp();
  const { isLoaded } = useGoogleMapsLoader();
  const [view, setView] = useState<"explore" | "plan_trip" | "select_priority">("plan_trip");
  const [selectedPriority, setSelectedPriority] = useState<string>("normal");
  const [sheetPos, setSheetPos] = useState(42);

  const [originQuery, setOriginQuery] = useState("Minha localização");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<"origin" | "dest" | null>(null);
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const distanceMatrixService = useRef<google.maps.DistanceMatrixService | null>(null);

  const center = useMemo(() => ({
    lat: userLocation.lat || -20.1438,
    lng: userLocation.lng || -44.1989
  }), [userLocation.lat, userLocation.lng]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data: categories } = await supabase
          .from('izi_service_categories')
          .select('*')
          .eq('category_type', 'shipping_priority')
          .eq('is_active', true);

        const { data: rates } = await supabase
          .from('dynamic_rates_delivery')
          .select('metadata')
          .eq('type', 'shipping_priorities')
          .maybeSingle();

        if (categories) {
          const formatted = categories.map(cat => ({
            id: cat.category_key,
            name: cat.label,
            img: cat.icon_url || 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png',
            price: rates?.metadata?.[cat.category_key]?.min_fee || 15,
            badge: cat.category_key === 'turbo' ? 'Flash' : (cat.category_key === 'scheduled' ? 'Agendado' : null)
          }));
          setDynamicServices(formatted);
          if (formatted.length > 0) setSelectedPriority(formatted[0].id);
        }
      } catch (e) {
        console.error("Erro ao buscar serviços de envio:", e);
      }
    };
    fetchServices();
  }, []);

  useEffect(() => {
    if (isLoaded && window.google) {
      if (!autocompleteService.current) autocompleteService.current = new window.google.maps.places.AutocompleteService();
      if (!distanceMatrixService.current) distanceMatrixService.current = new window.google.maps.DistanceMatrixService();
    }
  }, [isLoaded]);

  const fetchSuggestions = useCallback((input: string) => {
    if (!input || !autocompleteService.current || !distanceMatrixService.current) return;
    const request = {
      input,
      locationBias: { radius: 10000, center: center },
      componentRestrictions: { country: "br" },
      types: ["address"] 
    };
    autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        const userLatLng = new google.maps.LatLng(center.lat, center.lng);
        distanceMatrixService.current?.getDistanceMatrix({
          origins: [userLatLng],
          destinations: predictions.map(p => ({ placeId: p.place_id })),
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        }, (response, distStatus) => {
          if (distStatus === "OK" && response) {
            setSuggestions(predictions.map((p, index) => ({
              title: p.structured_formatting.main_text,
              subtitle: p.structured_formatting.secondary_text,
              placeId: p.place_id,
              dist: response.rows[0].elements[index].status === "OK" ? response.rows[0].elements[index].distance.text : "---"
            })));
          }
        });
      }
    });
  }, [center]);

  useEffect(() => {
    const query = isSearching === "dest" ? destQuery : (isSearching === "origin" ? originQuery : "");
    const timer = setTimeout(() => {
      if (query && isSearching && query !== "Minha localização") fetchSuggestions(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [destQuery, originQuery, isSearching, fetchSuggestions]);

  const handleSelectLocation = (loc: any) => {
    setTransitData((prev: any) => ({
      ...prev,
      destination: `${loc.title}, ${loc.subtitle}`,
      origin: originQuery === "Minha localização" ? (userLocation.address || "Rua Henry Karan, 660") : originQuery,
      destinationCoords: { lat: center.lat, lng: center.lng }
    }));
    setView("select_priority");
    setSheetPos(42);
  };

  const renderContent = () => {
    if (view === "select_priority") {
      return (
        <div className="relative h-screen w-full bg-white overflow-hidden font-sans">
          <div className="absolute inset-0 z-0">
            {isLoaded && (
              <GoogleMap 
                mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute' }} 
                center={center} 
                zoom={17} 
                options={MAP_OPTIONS}
              >
                <Marker position={center} />
              </GoogleMap>
            )}
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setView("plan_trip")} 
              className="absolute top-12 left-5 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-2xl z-50"
            >
              <span className="material-symbols-rounded text-black font-bold text-[28px]">arrow_back</span>
            </motion.button>
          </div>

          <motion.div 
            drag="y" 
            dragConstraints={{ top: 0, bottom: 650 }} 
            dragElastic={0.02} 
            onDragEnd={(e, info) => { 
              const v = info.velocity.y; 
              const o = info.offset.y; 
              if (o < -100 || v < -500) setSheetPos(0); 
              else if (o > 150 || v > 500) setSheetPos(84); 
              else setSheetPos(42); 
            }} 
            initial={{ y: "100%" }} 
            animate={{ y: `${sheetPos}%` }} 
            transition={{ type: "spring", damping: 35, stiffness: 350 }} 
            className="absolute bottom-0 left-0 w-full bg-white rounded-t-[40px] shadow-[0_-30px_100px_rgba(0,0,0,0.3)] z-[100]" 
            style={{ height: '95vh', touchAction: 'none' }}
          >
            <div className="pt-4 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing">
              <div className="w-14 h-1.5 bg-neutral-200 rounded-full mb-3" />
              <h2 className="text-[19px] font-bold text-neutral-800 tracking-tight uppercase">Escolher Prioridade</h2>
            </div>
            
            <div className="px-6 pb-20 overflow-y-auto no-scrollbar h-full space-y-7 pt-4">
              <div className="space-y-3">
                {dynamicServices.map(s => (
                  <VehicleOption 
                    key={s.id}
                    id={s.id} 
                    title={s.name} 
                    img={s.img} 
                    time={s.id === 'scheduled' ? 'Hora Marcada' : 'Entrega Imediata'} 
                    price={`R$ ${s.price.toFixed(2).replace('.', ',')}`} 
                    badge={s.badge}
                    selected={selectedPriority === s.id} 
                    onClick={() => setSelectedPriority(s.id)} 
                  />
                ))}
              </div>

              <div className="border-t border-neutral-100 pt-5">
                <motion.button 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => {
                    const routeMap: Record<string, string> = {
                      'turbo': 'explore_turbo_flash',
                      'light': 'explore_light_flash',
                      'normal': 'explore_express',
                      'scheduled': 'scheduled_checkout'
                    };
                    setTransitData((prev: any) => ({ ...prev, priority: selectedPriority, subService: selectedPriority === 'scheduled' ? 'agendado' : 'express' }));
                    setSubView(routeMap[selectedPriority] as any || "explore_express");
                  }} 
                  className="w-full bg-black text-white h-[64px] rounded-2xl font-bold text-lg shadow-2xl uppercase tracking-tighter"
                >
                  Confirmar {dynamicServices.find(s => s.id === selectedPriority)?.name || 'Envio'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    if (view === "plan_trip") {
      return (
        <motion.div 
          initial={{ x: "100%" }} 
          animate={{ x: 0 }} 
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed inset-0 bg-white z-[200] font-sans text-black pb-32 overflow-y-auto select-none"
        >
          <header className="px-5 pt-12 pb-4 flex items-center gap-6 sticky top-0 bg-white z-50">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => onBack()} className="material-symbols-rounded font-bold text-2xl">arrow_back</motion.button>
            <h1 className="text-[20px] font-bold">Planeje seu envio</h1>
          </header>
          <main className="px-5 space-y-6">
            <section className="flex items-center gap-3">
              <div className="flex-1 border-[2.5px] border-black rounded-xl p-3 flex flex-col gap-4 relative bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full border-[2.5px] border-black shrink-0" />
                  <input type="text" value={originQuery} onChange={(e) => { setOriginQuery(e.target.value); setIsSearching("origin"); }} onFocus={() => setIsSearching("origin")} className="w-full bg-transparent outline-none text-zinc-900 font-medium text-[15px]" />
                </div>
                <div className="h-[1px] bg-neutral-100 ml-6" />
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 bg-black shrink-0" />
                  <input autoFocus placeholder="Para onde enviar?" value={destQuery} onChange={(e) => { setDestQuery(e.target.value); setIsSearching("dest"); }} onFocus={() => setIsSearching("dest")} className="w-full bg-transparent outline-none text-zinc-900 font-medium text-[15px] placeholder:text-zinc-400" />
                </div>
                <div className="absolute left-[16px] top-[25px] bottom-[25px] w-[2px] bg-black" />
              </div>
            </section>
            <section className="space-y-6 pt-2 pb-20">
              <AnimatePresence mode="popLayout">
                {suggestions.map((loc, i) => (
                  <motion.div key={loc.placeId || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ delay: i * 0.02 }}>
                    <DestinationItem {...loc} onClick={() => handleSelectLocation(loc)} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>
          </main>
        </motion.div>
      );
    }

    return (
      <div className="min-h-screen bg-white font-sans text-black pb-32 overflow-y-auto select-none overflow-x-hidden relative">
        <header className="px-5 pt-12 pb-6 bg-white sticky top-0 z-50 flex items-center gap-6">
          <motion.button whileTap={{ scale: 0.8 }} onClick={onBack} className="material-symbols-rounded font-bold text-[28px]">arrow_back</motion.button>
          <h1 className="text-[36px] font-bold tracking-tight leading-none uppercase">Izi Envios</h1>
        </header>
        
        <main className="px-5 space-y-7">
          <section onClick={() => setView("plan_trip")} className="flex items-center bg-[#EEEEEE] rounded-full h-[54px] px-4 gap-2 cursor-pointer active:scale-[0.98] transition-transform">
            <div className="flex flex-1 items-center gap-3">
              <span className="material-symbols-rounded font-bold text-[24px]">search</span>
              <span className="text-black font-semibold text-lg opacity-90">Para onde enviar?</span>
            </div>
            <div className="h-[38px] bg-white rounded-full flex items-center px-4 gap-2 shadow-sm">
              <span className="material-symbols-rounded font-bold text-[18px]">calendar_month</span>
              <span className="text-black font-bold text-[13px]">Agendar</span>
            </div>
          </section>

          <section className="flex items-center gap-4 py-1">
            <div className="w-9 h-9 rounded-lg bg-[#EEEEEE] flex items-center justify-center shrink-0">
              <span className="material-symbols-rounded text-xl opacity-80">schedule</span>
            </div>
            <div className="flex-1 min-w-0 border-b border-neutral-100/50 pb-4">
              <p className="font-semibold text-[16px] leading-tight truncate">Último envio para:</p>
              <p className="text-zinc-500 text-[14px] font-medium truncate">Rua Presidente Vargas, 367</p>
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold uppercase tracking-tighter">Categorias de Envio</h2>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
              {dynamicServices.map(s => (
                <UberServiceCard 
                  key={s.id} 
                  name={s.name} 
                  img={s.img} 
                  badge={s.badge}
                  onClick={() => {
                    setSelectedPriority(s.id);
                    setView("plan_trip");
                  }} 
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen">
      {renderContent()}
    </div>
  );
};

// Componentes Auxiliares (Mesmo design do ExploreEnviosUberView)
const VehicleOption = ({ title, icon, img, time, price, badge, selected, onClick }: any) => (
  <motion.div 
    onClick={onClick} 
    className={`flex items-center p-4 rounded-2xl cursor-pointer transition-all border-[3px] ${selected ? "border-black bg-white shadow-md" : "border-transparent bg-transparent hover:bg-neutral-50"}`}
  >
    <div className="size-16 shrink-0 flex items-center justify-center">
      <img src={img} className="w-full h-full object-contain" />
    </div>
    <div className="flex-1 ml-4">
      <div className="flex items-center gap-1">
        <h3 className="font-bold text-[16px]">{title}</h3>
      </div>
      <p className="text-zinc-500 text-[13px] font-medium mt-1">{time}</p>
      {badge && (
        <div className="mt-2 inline-flex items-center gap-1 bg-[#285A98] text-white px-2 py-0.5 rounded-full">
          <span className="material-symbols-rounded text-[12px] fill-1">bolt</span>
          <span className="text-[10px] font-bold uppercase">{badge}</span>
        </div>
      )}
    </div>
    <div className="text-right">
      <p className="font-bold text-[16px]">{price}</p>
    </div>
  </motion.div>
);

const UberServiceCard = ({ name, img, badge, onClick }: any) => (
  <motion.div whileTap={{ scale: 0.94 }} onClick={onClick} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer">
    <div className="w-[100px] h-[100px] bg-[#EEEEEE] rounded-xl flex items-center justify-center relative p-3 border border-neutral-100 shadow-sm">
      {badge && (
        <span className="absolute -top-1 right-1 bg-yellow-400 text-black text-[10px] px-2 py-0.5 rounded-full font-bold z-10 border-2 border-white uppercase">
          {badge}
        </span>
      )}
      <img src={img} className="w-full h-full object-contain" />
    </div>
    <span className="text-[12px] font-bold text-zinc-900 uppercase tracking-tighter text-center max-w-[100px] leading-tight">
      {name}
    </span>
  </motion.div>
);

const DestinationItem = ({ title, subtitle, dist, isPlace, onClick }: any) => (
  <div onClick={onClick} className="flex items-center gap-4 cursor-pointer active:opacity-60 group">
    <div className="w-9 h-9 rounded-full bg-[#EEEEEE] flex items-center justify-center shrink-0 group-hover:bg-neutral-200 transition-colors">
      <span className="material-symbols-rounded text-black text-[20px]">{isPlace ? "location_on" : "schedule"}</span>
    </div>
    <div className="flex-1 min-w-0 border-b border-neutral-50 pb-4">
      <div className="flex items-center justify-between">
        <p className="font-bold text-[15px] truncate">{title}</p>
        <span className="text-[12px] text-zinc-400 font-bold whitespace-nowrap ml-2">{dist}</span>
      </div>
      <p className="text-zinc-500 text-[13px] truncate">{subtitle}</p>
    </div>
  </div>
);
