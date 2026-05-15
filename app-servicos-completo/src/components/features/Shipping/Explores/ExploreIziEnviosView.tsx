import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
import { Bike, Car, Package } from "lucide-react";
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
  const [view, setView] = useState<"explore" | "select_priority">("explore");
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
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
    const locStr = `${loc.title}, ${loc.subtitle}`;
    
    let finalOrigin = originQuery || userLocation.address || "";
    let finalDest = destQuery || "";

    if (isSearching === "origin") {
      finalOrigin = locStr;
      setOriginQuery(locStr);
      setIsSearching("dest");
      setSuggestions([]);
      return; 
    } else {
      finalDest = locStr;
      setDestQuery(locStr);
      setIsSearching(null);
      setSuggestions([]);
    }
    
    if (finalOrigin && finalDest) {
      setTransitData((prev: any) => ({
        ...prev,
        destination: finalDest,
        origin: finalOrigin,
        destinationCoords: { lat: center.lat, lng: center.lng }
      }));
      
      calculateDistancePrices(finalOrigin, finalDest);
      setView("select_priority");
      setSheetPos(42);

      if (window.google) {
        const directionsService = new window.google.maps.DirectionsService();
        directionsService.route(
          {
            origin: finalOrigin,
            destination: finalDest,
            travelMode: window.google.maps.TravelMode.DRIVING,
          },
          (result, status) => {
            if (status === window.google.maps.DirectionsStatus.OK) {
              setDirectionsResponse(result);
            } else {
              console.error("Erro ao buscar rota:", status);
            }
          }
        );
      }
    }
  };

  const renderContent = () => {
    if (view === "type_selection") {
      return (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white z-[200] font-sans text-black pb-32 flex flex-col"
        >
          <header className="px-6 pt-14 pb-6 flex items-center gap-6 bg-white z-50">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => onBack()} 
              className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black shadow-sm active:scale-95 transition-all"
            >
              <span className="material-symbols-rounded font-black text-2xl">arrow_back</span>
            </motion.button>
            <h1 className="text-xl font-black uppercase tracking-tighter">O que deseja fazer?</h1>
          </header>
          
          <main className="flex-1 px-6 pt-6 flex flex-col gap-6 justify-center pb-20">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setTransitData((prev: any) => ({ ...prev, serviceType: "send" }));
                setView("plan_trip");
              }}
              className="w-full bg-white border border-zinc-100 rounded-[40px] p-8 flex flex-col items-center justify-center gap-5 hover:bg-zinc-50 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.06)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="size-24 bg-black rounded-[32px] flex items-center justify-center text-white mb-2 shadow-2xl relative z-10 rotate-[-5deg] group-hover:rotate-0 transition-all duration-300">
                <span className="material-symbols-rounded text-[40px]">local_shipping</span>
              </div>
              <div className="relative z-10 text-center">
                <h2 className="text-[22px] font-black uppercase tracking-tighter leading-none mb-3">Enviar Algo</h2>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center leading-relaxed max-w-[240px] mx-auto">
                  Preciso que o entregador colete algo comigo e leve a um destino.
                </p>
              </div>
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setTransitData((prev: any) => ({ ...prev, serviceType: "receive" }));
                setView("plan_trip");
              }}
              className="w-full bg-white border border-zinc-100 rounded-[40px] p-8 flex flex-col items-center justify-center gap-5 hover:bg-zinc-50 transition-all shadow-[0_15px_40px_rgba(0,0,0,0.06)] relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="size-24 bg-yellow-400 rounded-[32px] flex items-center justify-center text-black mb-2 shadow-2xl relative z-10 rotate-[5deg] group-hover:rotate-0 transition-all duration-300">
                <span className="material-symbols-rounded text-[40px]">inventory_2</span>
              </div>
              <div className="relative z-10 text-center">
                <h2 className="text-[22px] font-black uppercase tracking-tighter leading-none mb-3">Receber Algo</h2>
                <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest text-center leading-relaxed max-w-[240px] mx-auto">
                  Preciso que o entregador busque algo em um local e traga para mim.
                </p>
              </div>
            </motion.button>
          </main>
        </motion.div>
      );
    }

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
                {!directionsResponse && <Marker position={center} />}
                {directionsResponse && (
                  <DirectionsRenderer 
                    directions={directionsResponse}
                    options={{
                      polylineOptions: {
                        strokeColor: "#000000",
                        strokeWeight: 4,
                        strokeOpacity: 0.8
                      },
                      suppressMarkers: false
                    }}
                  />
                )}
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
            <div className="pt-4 pb-6 flex flex-col items-center cursor-grab active:cursor-grabbing border-b border-zinc-50">
              <div className="w-14 h-1.5 bg-zinc-100 rounded-full mb-6" />
              <div className="text-center">
                 <h2 className="text-[14px] font-medium uppercase tracking-widest text-zinc-500 mb-2">Você Escolhe,</h2>
                 <div className="flex items-center justify-center gap-3">
                   <div className="size-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white shadow-sm">
                     <span className="material-symbols-rounded font-black text-xl">arrow_forward</span>
                   </div>
                   <h1 className="text-[28px] font-black tracking-tighter leading-none text-black">A Prioridade</h1>
                 </div>
              </div>
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
                    setTransitData((prev: any) => ({ 
                      ...prev, 
                      priority: selectedPriority, 
                      subService: selectedPriority === 'scheduled' ? 'agendado' : 'express',
                      price: dynamicServices.find(s => s.id === selectedPriority)?.price || prev.estPrice || 0
                    }));
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

    // View: explore (Nova Tela Unificada)
    return (
      <div className="min-h-screen bg-white font-sans text-black pb-32 overflow-y-auto select-none overflow-x-hidden no-scrollbar">
        {/* Header */}
        <header className="px-6 pt-14 pb-4 bg-white z-50 flex items-center justify-between">
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={onBack} 
            className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black"
          >
            <span className="material-symbols-rounded font-black text-2xl">arrow_back</span>
          </motion.button>
        </header>
        
        <main className="px-6 space-y-6">
          {/* Title */}
          <div className="text-center mt-2">
             <h2 className="text-[14px] font-medium uppercase tracking-widest text-zinc-500 mb-2">Você Precisa,</h2>
             <div className="flex items-center justify-center gap-3">
               <div className="size-8 bg-yellow-400 rounded-lg flex items-center justify-center text-white shadow-sm">
                 <span className="material-symbols-rounded font-black text-xl">arrow_forward</span>
               </div>
               <h1 className="text-[28px] font-black tracking-tighter leading-none text-black">Izi Envios</h1>
             </div>
          </div>

          {/* SVG Icons */}
          <div className="flex justify-center gap-8 mt-10">
             <div className="relative">
                <div className="size-28 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                  <Bike strokeWidth={1.5} className="w-14 h-14 text-zinc-800" />
                </div>
                <div className="absolute -bottom-2 -left-2 size-12 bg-yellow-400 rounded-full flex items-center justify-center border-[3px] border-white shadow-lg">
                  <Package strokeWidth={2.5} className="w-5 h-5 text-black" />
                </div>
             </div>
             <div className="relative">
                <div className="size-28 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-inner">
                  <Car strokeWidth={1.5} className="w-14 h-14 text-zinc-800" />
                </div>
                <div className="absolute -bottom-2 -left-2 size-12 bg-yellow-400 rounded-full flex items-center justify-center border-[3px] border-white shadow-lg">
                  <Package strokeWidth={2.5} className="w-5 h-5 text-black" />
                </div>
             </div>
          </div>

          {/* Address Card */}
          <div className="bg-[#F8F9FA] rounded-[32px] p-6 mt-10 shadow-sm border border-zinc-100">
             {/* Tabs */}
             <div className="flex items-center gap-6 mb-8 px-2">
               <button 
                 onClick={() => setTransitData((prev: any) => ({ ...prev, serviceType: "send" }))}
                 className={`text-[17px] font-black tracking-tighter transition-all relative ${
                   transitData?.serviceType !== "receive" ? "text-black" : "text-zinc-400"
                 }`}
               >
                 Enviar
                 {transitData?.serviceType !== "receive" && (
                   <motion.div layoutId="tab-indicator" className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-orange-500 rounded-full" />
                 )}
               </button>
               <button 
                 onClick={() => setTransitData((prev: any) => ({ ...prev, serviceType: "receive" }))}
                 className={`text-[17px] font-black tracking-tighter transition-all relative ${
                   transitData?.serviceType === "receive" ? "text-black" : "text-zinc-400"
                 }`}
               >
                 Receber
                 {transitData?.serviceType === "receive" && (
                   <motion.div layoutId="tab-indicator" className="absolute -bottom-1.5 left-0 right-0 h-[3px] bg-orange-500 rounded-full" />
                 )}
               </button>
             </div>

             <div className="relative">
               {/* Connection line */}
               <div className="absolute left-[7px] top-[24px] bottom-[34px] w-[2px] bg-zinc-200 z-0" />

               {/* Origin */}
               <div className="flex items-center gap-4 mb-6 relative z-10">
                 <div className="size-4 rounded-full border-2 border-teal-500 flex items-center justify-center shrink-0">
                   <div className="size-1.5 bg-teal-500 rounded-full" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Endereço de origem"
                      value={originQuery}
                      onChange={(e) => { setOriginQuery(e.target.value); setIsSearching("origin"); }}
                      onFocus={() => setIsSearching("origin")}
                      className="w-full bg-transparent outline-none font-medium text-black text-[15px] truncate placeholder:text-zinc-400"
                    />
                    <p className="text-zinc-400 text-xs font-normal truncate mt-0.5">Remetente</p>
                 </div>
                 <span className="material-symbols-rounded text-zinc-300">chevron_right</span>
               </div>

               {/* Destination */}
               <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-[0_5px_15px_rgba(0,0,0,0.03)] border border-zinc-100 relative z-10">
                 <div className="size-4 rounded-full border-2 border-orange-500 flex items-center justify-center shrink-0">
                   <div className="size-1.5 bg-orange-500 rounded-full" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      placeholder="Entregar para"
                      value={destQuery}
                      onChange={(e) => { setDestQuery(e.target.value); setIsSearching("dest"); }}
                      onFocus={() => setIsSearching("dest")}
                      className="w-full bg-transparent outline-none font-bold text-black text-[16px] truncate placeholder:text-black"
                    />
                 </div>
               </div>
             </div>
          </div>

          {/* Suggestions */}
          <AnimatePresence mode="popLayout">
            {suggestions.length > 0 && (
              <motion.section 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4 pt-4 pb-32"
              >
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2">Sugestões de Endereço</p>
                <div className="bg-white rounded-[24px] border border-zinc-100 shadow-sm overflow-hidden">
                  {suggestions.map((loc, i) => (
                    <DestinationItem key={loc.placeId || i} {...loc} isPlace={true} onClick={() => handleSelectLocation(loc)} />
                  ))}
                </div>
              </motion.section>
            )}
          </AnimatePresence>
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
