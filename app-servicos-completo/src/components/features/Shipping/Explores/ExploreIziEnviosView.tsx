import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useApp } from "../../../../hooks/useApp";
import { supabase } from "../../../../lib/supabase";
import { useGoogleMapsLoader } from "../../../../hooks/useGoogleMapsLoader";

// Estilo de Mapa Premium (Clean Silver/White)
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { "elementType": "geometry", "stylers": [{ "color": "#f8f9fa" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca3af" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e5e7eb" }] }
];

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: true,
  styles: MAP_STYLES,
  gestureHandling: 'greedy'
};

interface ExploreIziEnviosViewProps {
  onBack: () => void;
}

export const ExploreIziEnviosView: React.FC<ExploreIziEnviosViewProps> = ({ onBack }) => {
  const { setSubView, setTransitData, transitData, userLocation, calculateDistancePrices, updateLocation } = useApp();
  const { isLoaded } = useGoogleMapsLoader();
  const [view, setView] = useState<"explore" | "plan_trip" | "select_priority">("plan_trip");
  const [selectedPriority, setSelectedPriority] = useState<string>("normal");
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<"origin" | "dest" | null>(null);
  const [sheetPos, setSheetPos] = useState(42);
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);

  const center = useMemo(() => ({
    lat: userLocation.lat || -20.1438,
    lng: userLocation.lng || -44.1989
  }), [userLocation.lat, userLocation.lng]);

  useEffect(() => {
    if (userLocation.address && !originQuery) {
      setOriginQuery(userLocation.address);
    }
  }, [userLocation.address]);

  const fetchServices = async () => {
    try {
      const { data: categories } = await supabase
        .from('izi_service_categories')
        .select('*')
        .eq('category_type', 'shipping_priority');

      const { data: rates } = await supabase
        .from('dynamic_rates_delivery')
        .select('*')
        .eq('type', 'shipping_priorities')
        .maybeSingle();

      if (categories) {
        const iconMapping: Record<string, string> = {
          'turbo': 'https://cdn-icons-png.flaticon.com/512/4300/4300059.png',
          'light': 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png',
          'normal': 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png',
          'scheduled': 'https://cdn-icons-png.flaticon.com/512/2766/2766144.png'
        };

        const timeMapping: Record<string, string> = {
          'turbo': 'Em até 15 min',
          'light': 'Em até 30 min',
          'normal': 'Em até 60 min',
          'scheduled': 'Hora Marcada'
        };

        const formatted = categories.map(cat => ({
          id: cat.category_key,
          name: cat.label,
          img: cat.icon_url || iconMapping[cat.category_key] || 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png',
          price: rates?.metadata?.[cat.category_key]?.min_fee || 15,
          badge: cat.category_key === 'turbo' ? 'Flash' : (cat.category_key === 'scheduled' ? 'Agendado' : null),
          time: timeMapping[cat.category_key] || 'Entrega Imediata'
        }));
        setDynamicServices(formatted);
        if (formatted.length > 0) setSelectedPriority(formatted[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const distanceMatrixService = useRef<google.maps.DistanceMatrixService | null>(null);

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
        const userLatLng = new window.google.maps.LatLng(center.lat, center.lng);
        distanceMatrixService.current?.getDistanceMatrix({
          origins: [userLatLng],
          destinations: predictions.map(p => ({ placeId: p.place_id })),
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
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
      } else {
        setSuggestions([]);
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
    const destStr = `${loc.title}, ${loc.subtitle}`;
    const originStr = originQuery === "Minha localização" || !originQuery ? (userLocation.address || "") : originQuery;
    
    setTransitData((prev: any) => ({
      ...prev,
      destination: destStr,
      origin: originStr,
      destinationCoords: { lat: center.lat, lng: center.lng }
    }));
    
    calculateDistancePrices(originStr, destStr);
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
              className="absolute top-12 left-5 size-12 bg-white/90 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl z-50 border border-zinc-100 text-black"
            >
              <span className="material-symbols-rounded font-black text-2xl">arrow_back</span>
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
            className="absolute bottom-0 left-0 w-full bg-white rounded-t-[40px] shadow-[0_-30px_100px_rgba(0,0,0,0.15)] z-[100]" 
            style={{ height: '95vh', touchAction: 'none' }}
          >
            <div className="pt-4 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing">
              <div className="w-14 h-1.5 bg-zinc-100 rounded-full mb-3" />
              <h2 className="text-[14px] font-black text-zinc-400 tracking-widest uppercase">Escolher Prioridade</h2>
            </div>
            
            <div className="px-6 pb-20 overflow-y-auto no-scrollbar h-full space-y-7 pt-4">
              <div className="space-y-4">
                {dynamicServices.map(s => (
                  <VehicleOption 
                    key={s.id}
                    id={s.id} 
                    title={s.name} 
                    img={s.img} 
                    time={s.time} 
                    price={`~ R$ ${s.price.toFixed(2).replace('.', ',')}`} 
                    badge={s.badge}
                    selected={selectedPriority === s.id} 
                    onClick={() => setSelectedPriority(s.id)} 
                  />
                ))}
              </div>

              <div className="border-t border-zinc-50 pt-8 pb-12">
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
                  className="w-full bg-black text-white h-[74px] rounded-[32px] font-black text-lg shadow-[0_20px_40px_rgba(0,0,0,0.15)] uppercase tracking-widest"
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
          className="fixed inset-0 bg-white z-[200] font-sans text-black pb-32 overflow-y-auto select-none no-scrollbar"
        >
          <header className="px-6 pt-14 pb-6 flex items-center gap-6 sticky top-0 bg-white z-50 border-b border-zinc-50">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => onBack()} 
              className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black"
            >
              <span className="material-symbols-rounded font-black text-2xl">arrow_back</span>
            </motion.button>
            <h1 className="text-xl font-black uppercase tracking-tighter">Planeje seu envio</h1>
          </header>

          <main className="px-6 pt-8 space-y-8">
            <section className="flex flex-col gap-6">
              <div className="rounded-[40px] p-8 flex flex-col gap-8 relative bg-white border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                <div className="absolute left-[39px] top-[56px] bottom-[56px] w-0.5 bg-zinc-100" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="size-4 rounded-full border-[3px] border-zinc-200 bg-white shrink-0" />
                  <div className="flex-1 flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="De onde enviar?"
                      value={originQuery} 
                      onChange={(e) => { setOriginQuery(e.target.value); setIsSearching("origin"); }} 
                      onFocus={() => setIsSearching("origin")} 
                      className="flex-1 bg-transparent outline-none text-black font-black text-[16px] uppercase tracking-tighter placeholder:text-zinc-300" 
                    />
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={async () => {
                        const newLoc = await updateLocation(true);
                        if (newLoc && newLoc.address) {
                          setOriginQuery(newLoc.address);
                          setIsSearching("dest");
                        }
                      }}
                      className="size-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600"
                    >
                      <span className="material-symbols-rounded text-xl font-black">my_location</span>
                    </motion.button>
                  </div>
                </div>

                <div className="h-px bg-zinc-50 ml-10" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="size-4 bg-black shrink-0 rounded-sm" />
                  <input 
                    autoFocus
                    placeholder="Para onde enviar?" 
                    value={destQuery} 
                    onChange={(e) => { setDestQuery(e.target.value); setIsSearching("dest"); }} 
                    onFocus={() => setIsSearching("dest")} 
                    className="w-full bg-transparent outline-none text-black font-black text-[16px] uppercase tracking-tighter placeholder:text-zinc-300" 
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6 pt-4 pb-32">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2">Sugestões de Destino</p>
              <AnimatePresence mode="popLayout">
                {suggestions.map((loc, i) => (
                  <motion.div key={loc.placeId || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ delay: i * 0.03 }}>
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
      <div className="min-h-screen bg-white font-sans text-black pb-32 overflow-y-auto select-none overflow-x-hidden no-scrollbar">
        <header className="px-6 pt-14 pb-8 bg-white sticky top-0 z-50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button 
              whileTap={{ scale: 0.8 }} 
              onClick={onBack} 
              className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center"
            >
              <span className="material-symbols-rounded font-black text-black text-2xl">arrow_back</span>
            </motion.button>
            <h1 className="text-[32px] font-black tracking-tighter leading-none uppercase">Izi Envios</h1>
          </div>
          
          <div className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
             <span className="material-symbols-rounded text-black font-black">package_2</span>
          </div>
        </header>
        
        <main className="px-6 space-y-10">
          <section 
            onClick={() => setView("plan_trip")} 
            className="group flex items-center bg-zinc-50 rounded-[32px] h-[84px] px-8 gap-5 cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-100 border border-zinc-100 shadow-[0_15px_30px_rgba(0,0,0,0.02)]"
          >
            <div className="flex flex-1 items-center gap-5 overflow-hidden">
              <div className="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm shrink-0">
                <span className="material-symbols-rounded font-black text-black text-2xl">search</span>
              </div>
              <div className="flex flex-col min-w-0">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Enviar para</span>
                 <span className="text-black font-black text-sm uppercase tracking-tighter truncate">
                   {userLocation.address || "Para onde enviar?"}
                 </span>
              </div>
            </div>
            <div className="h-[50px] bg-black rounded-2xl flex items-center px-5 gap-3 shadow-xl shrink-0">
              <span className="material-symbols-rounded font-black text-white text-[20px]">calendar_month</span>
              <span className="text-white font-black text-[11px] uppercase tracking-widest">Agendar</span>
            </div>
          </section>

          <section className="space-y-6">
            <h2 className="text-lg font-black uppercase tracking-tighter px-2">Categorias de Envio</h2>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
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

          <section className="bg-zinc-50 rounded-[40px] p-8 border border-zinc-100">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6">Últimos Envios</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-5 cursor-pointer active:opacity-50">
                <div className="size-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                  <span className="material-symbols-rounded text-zinc-400 text-xl">history</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-[14px] leading-tight truncate uppercase tracking-tighter">Rua Presidente Vargas, 367</p>
                  <p className="text-zinc-400 text-[10px] font-black truncate uppercase tracking-widest mt-1">Entregue hoje</p>
                </div>
              </div>
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

const VehicleOption = ({ title, img, time, price, badge, selected, onClick }: any) => (
  <motion.div 
    onClick={onClick} 
    whileTap={{ scale: 0.98 }}
    className={`flex items-center p-6 rounded-[32px] cursor-pointer transition-all border-2
      ${selected ? "border-black bg-white shadow-xl" : "border-zinc-50 bg-zinc-50/50 hover:bg-white hover:border-zinc-100"}`}
  >
    <div className="size-16 shrink-0 flex items-center justify-center rounded-2xl bg-white shadow-sm border border-zinc-50">
      <img src={img} className="w-10 h-10 object-contain" />
    </div>
    <div className="flex-1 ml-5">
      <h3 className="font-black text-[16px] text-black uppercase tracking-tighter">{title}</h3>
      <p className="text-zinc-400 text-[11px] font-black uppercase tracking-widest mt-1">{time}</p>
      {badge && (
        <div className="mt-2 inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-xl">
          <span className="material-symbols-rounded text-[14px] font-black">bolt</span>
          <span className="text-[9px] font-black uppercase tracking-widest">{badge}</span>
        </div>
      )}
    </div>
    <div className="text-right">
      <p className="font-black text-[16px] text-black tracking-tighter">{price}</p>
    </div>
  </motion.div>
);

const UberServiceCard = ({ name, img, badge, onClick }: any) => (
  <motion.div 
    whileTap={{ scale: 0.94 }} 
    onClick={onClick} 
    className="flex flex-col items-center gap-3 shrink-0 cursor-pointer group"
  >
    <div className="w-[100px] h-[100px] bg-white rounded-[28px] flex items-center justify-center relative p-4 border border-zinc-100 shadow-[0_15px_35px_rgba(0,0,0,0.03)] group-hover:border-zinc-300 group-hover:shadow-lg transition-all">
      {badge && (
        <span className="absolute -top-2 -right-2 bg-yellow-400 text-black text-[9px] px-2.5 py-1 rounded-full font-black z-10 border-2 border-white shadow-lg uppercase tracking-widest">
          {badge}
        </span>
      )}
      <img src={img} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
    </div>
    <span className="text-[11px] font-black text-black uppercase tracking-widest text-center">{name}</span>
  </motion.div>
);

const DestinationItem = ({ title, subtitle, dist, isPlace, onClick }: any) => (
  <div 
    onClick={onClick} 
    className="flex items-center gap-5 cursor-pointer active:opacity-60 group p-2 hover:bg-zinc-50 rounded-[24px] transition-colors"
  >
    <div className="size-11 rounded-full bg-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-black group-hover:text-white transition-all">
      <span className="material-symbols-rounded text-[22px] font-black">{isPlace ? "location_on" : "schedule"}</span>
    </div>
    <div className="flex-1 min-w-0 border-b border-zinc-50 group-last:border-none pb-4 pt-2">
      <div className="flex items-center justify-between gap-4">
        <p className="font-black text-[16px] truncate uppercase tracking-tighter text-black">{title}</p>
        <span className="text-[11px] text-zinc-400 font-black uppercase tracking-widest whitespace-nowrap ml-2">{dist}</span>
      </div>
      <p className="text-zinc-400 text-[11px] font-black uppercase tracking-widest truncate mt-1">{subtitle}</p>
    </div>
  </div>
);
