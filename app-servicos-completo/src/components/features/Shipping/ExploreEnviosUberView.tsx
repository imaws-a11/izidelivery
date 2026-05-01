import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useApp } from "../../../contexts/AppContext";
import { supabase } from "../../../lib/supabase";
import { useGoogleMapsLoader } from "../../../hooks/useGoogleMapsLoader";

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

export const ExploreEnviosUberView: React.FC = () => {
  const { setSubView, setTransitData, transitData, userLocation } = useApp();
  const { isLoaded } = useGoogleMapsLoader();
  const [view, setView] = useState<"explore" | "plan_trip" | "select_priority" | "izi_pay">("plan_trip");
  const [iziPaySubView, setIziPaySubView] = useState<"main" | "send" | "my_qr" | "scan" | "loan">("main");
  const [selectedType, setSelectedType] = useState<"moto" | "carro" | "frete">("moto");
  const [selectedFreteType, setSelectedFreteType] = useState<"fiorino" | "caminhonete" | "bau">("fiorino");
  
  const [sheetPos, setSheetPos] = useState(42);

  const [originQuery, setOriginQuery] = useState("Minha localização");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<"origin" | "dest" | null>(null);
  const [dynamicVehicles, setDynamicVehicles] = useState<any[]>([]);

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const distanceMatrixService = useRef<google.maps.DistanceMatrixService | null>(null);

  const center = useMemo(() => ({
    lat: userLocation.lat || -20.1438,
    lng: userLocation.lng || -44.1989
  }), [userLocation.lat, userLocation.lng]);

  useEffect(() => {
    const fetchDynamicRates = async () => {
      try {
        const { data: iconData } = await supabase.from('izi_service_categories').select('category_key, icon_url');
        const iconMap = (iconData || []).reduce((acc: any, item: any) => {
          acc[item.category_key] = item.icon_url;
          return acc;
        }, {});

        const { data } = await supabase
          .from('dynamic_rates_delivery')
          .select('metadata')
          .eq('type', 'base_values')
          .maybeSingle();
        
        if (data?.metadata) {
          const meta = data.metadata;
          const vehicles = [
            { id: 'fiorino', title: 'Fiorino', icon: '🚐', img: iconMap['fiorino'] || 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', price: meta.fiorino_min || 40, capacity: 'Até 500kg' },
            { id: 'caminhonete', title: 'Caminhonete', icon: '🛻', img: iconMap['caminhonete'] || 'https://cdn-icons-png.flaticon.com/512/3204/3204064.png', price: meta.caminhonete_min || 50, capacity: 'Até 1200kg' },
            { id: 'van', title: 'Van Carga', icon: '🚐', img: iconMap['van'] || 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', price: meta.van_min || 50, capacity: 'Até 1500kg' },
            { id: 'bau_p', title: 'Baú Pequeno', icon: '🚚', img: iconMap['bau_p'] || 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png', price: meta.bau_p_min || 70, capacity: 'Até 2500kg' },
            { id: 'bau_m', title: 'Baú Médio', icon: '🚚', img: iconMap['bau_m'] || 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png', price: meta.bau_m_min || 80, capacity: 'Até 3500kg' },
            { id: 'bau_g', title: 'Baú Grande', icon: '🚚', img: iconMap['bau_g'] || 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png', price: meta.bau_g_min || 100, capacity: 'Até 5000kg' },
            { id: 'utilitario', title: 'Utilitário', icon: '🚐', img: iconMap['utilitario'] || 'https://cdn-icons-png.flaticon.com/512/2830/2830305.png', price: meta.utilitario_min || 12, capacity: 'Até 300kg' },
            { id: 'aberto', title: 'Caminhão Aberto', icon: '🚚', img: iconMap['aberto'] || 'https://cdn-icons-png.flaticon.com/512/3204/3204064.png', price: meta.aberto_min || 80, capacity: 'Médio porte' }
          ];
          setDynamicVehicles(vehicles.filter(v => meta[`${v.id}_min`]));
        }
      } catch (e) {
        console.error("Erro ao buscar taxas dinâmicas:", e);
      }
    };
    fetchDynamicRates();
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

  // --- RENDEREIZAÇÃO CONDICIONAL DE CONTEÚDO ---
  const renderContent = () => {
    if (view === "izi_pay") {
      return (
        <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 bg-[#F8F9FA] z-[200] font-sans text-black overflow-y-auto pb-24">
          <AnimatePresence mode="wait">
            {iziPaySubView === "main" && (
              <motion.div key="main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <header className="bg-[#FFC107] px-6 pt-12 pb-28 rounded-b-[48px] relative shadow-xl">
                   <div className="flex items-center gap-6 mb-8">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => setView("select_priority")} className="w-11 h-11 rounded-full bg-black/10 flex items-center justify-center"><span className="material-symbols-rounded text-black font-bold">arrow_back</span></motion.button>
                      <h1 className="text-2xl font-black text-black">Izi Pay</h1>
                   </div>
                   <div className="bg-white p-7 rounded-[32px] shadow-2xl relative z-10 border border-white/50">
                      <div className="flex justify-between items-start mb-6">
                         <div><p className="text-zinc-400 font-bold text-[10px] uppercase tracking-widest mb-1">Meu Saldo</p><h2 className="text-4xl font-black text-black">R$ 482,90</h2></div>
                         <div className="bg-[#FFC107]/10 px-3 py-1.5 rounded-full flex items-center gap-2"><span className="material-symbols-rounded text-[#FFC107] text-lg fill-1">stars</span><span className="text-sm font-black text-[#FFB300]">1.240 <span className="font-bold text-[10px]">COINS</span></span></div>
                      </div>
                      <div className="flex gap-3"><button className="flex-1 bg-black text-white h-12 rounded-2xl font-bold text-sm shadow-lg active:scale-95 transition-transform">Adicionar Saldo</button><button onClick={() => setIziPaySubView("loan")} className="flex-1 bg-[#F5F5F5] text-black h-12 rounded-2xl font-bold text-sm active:scale-95 transition-transform">Pegar Crédito</button></div>
                   </div>
                </header>
                <main className="px-6 -mt-10 pb-12 space-y-8 relative z-20">
                   <section className="grid grid-cols-4 gap-4 pt-4">
                      <QuickAction icon="qr_code_scanner" label="Pagar" onClick={() => document.getElementById('native-camera')?.click()} />
                      <QuickAction icon="send" label="Enviar" onClick={() => setIziPaySubView("send")} />
                      <QuickAction icon="qr_code_2" label="Meu QR" onClick={() => setIziPaySubView("my_qr")} />
                      <QuickAction icon="account_balance_wallet" label="Crédito" onClick={() => setIziPaySubView("loan")} />
                      <input type="file" id="native-camera" accept="image/*" capture="environment" className="hidden" />
                   </section>
                   <section>
                      <div className="flex justify-between items-center mb-5"><h3 className="text-lg font-black text-black tracking-tight">Meus Cartões</h3><button className="text-[#FFC107] font-black text-xs uppercase">Ver Todos</button></div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2"><CreditCardItem brand="Visa" last="8291" color="bg-zinc-900" text="white" /><CreditCardItem brand="Master" last="4402" color="bg-[#FFC107]" text="black" /></div>
                   </section>
                   <section>
                      <h3 className="text-lg font-black text-black tracking-tight mb-5">Atividade Recente</h3>
                      <div className="bg-white rounded-[32px] p-2 shadow-sm border border-neutral-100"><TransactionItem title="Uber Trip" date="Hoje, 14:20" amount="- R$ 12,86" icon="directions_car" color="bg-blue-100 text-blue-600" /><TransactionItem title="Depósito Pix" date="Ontem, 18:05" amount="+ R$ 200,00" icon="add" color="bg-green-100 text-green-600" /></div>
                   </section>
                </main>
              </motion.div>
            )}
            {iziPaySubView === "send" && (
              <motion.div key="send" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="min-h-screen bg-white p-6">
                <header className="flex items-center gap-6 mb-10"><button onClick={() => setIziPaySubView("main")} className="material-symbols-rounded text-black font-bold">arrow_back</button><h2 className="text-2xl font-black">Enviar Izi Coins</h2></header>
                <div className="space-y-6">
                  <div className="p-4 bg-neutral-50 rounded-2xl border-2 border-black/5"><p className="text-xs font-bold text-zinc-400 uppercase mb-2">Destinatário</p><input autoFocus placeholder="E-mail ou CPF" className="w-full bg-transparent text-lg font-bold outline-none" /></div>
                  <div className="p-4 bg-neutral-50 rounded-2xl border-2 border-black/5"><p className="text-xs font-bold text-zinc-400 uppercase mb-2">Valor em Coins</p><input type="number" placeholder="0" className="w-full bg-transparent text-4xl font-black outline-none text-[#FFC107]" /></div>
                  <button className="w-full bg-black text-white h-16 rounded-2xl font-bold text-lg shadow-xl shadow-black/10">Continuar</button>
                </div>
              </motion.div>
            )}
            {iziPaySubView === "my_qr" && (
              <motion.div key="qr" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="min-h-screen bg-[#FFC107] p-8 flex flex-col items-center justify-center text-black">
                 <button onClick={() => setIziPaySubView("main")} className="absolute top-10 left-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl"><span className="material-symbols-rounded font-bold">close</span></button>
                 <h2 className="text-3xl font-black mb-2">Receber Coins</h2>
                 <p className="text-black/60 font-medium mb-12">Mostre este código para receber Izi Coins</p>
                 <div className="bg-white p-10 rounded-[48px] shadow-2xl mb-10"><div className="w-64 h-64 bg-neutral-100 rounded-2xl flex items-center justify-center"><span className="material-symbols-rounded text-[140px] text-black">qr_code_2</span></div></div>
                 <p className="text-xl font-bold mb-8">@seu_usuario_izi</p>
                 <button className="bg-black text-white px-10 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3"><span className="material-symbols-rounded">share</span> Compartilhar</button>
              </motion.div>
            )}
            {iziPaySubView === "loan" && (
              <motion.div key="loan" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="min-h-screen bg-white p-6">
                <header className="flex items-center gap-6 mb-10"><button onClick={() => setIziPaySubView("main")} className="material-symbols-rounded text-black font-bold">arrow_back</button><h2 className="text-2xl font-black">Izi Crédito</h2></header>
                <div className="space-y-8">
                   <div className="bg-black text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC107]/20 blur-[60px]" />
                      <p className="text-zinc-500 font-bold text-xs uppercase mb-2">Crédito Disponível</p>
                      <h3 className="text-4xl font-black mb-6">R$ 5.000,00</h3>
                      <div className="flex items-center gap-2 text-[#FFC107] font-bold text-sm"><span className="material-symbols-rounded text-lg">check_circle</span> Aprovação Instantânea</div>
                   </div>
                   <div>
                      <h4 className="text-lg font-black mb-4">Simular Empréstimo</h4>
                      <div className="space-y-4">
                         <div className="p-5 bg-neutral-50 rounded-2xl"><p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Quanto você precisa?</p><input type="number" defaultValue="1000" className="w-full bg-transparent text-2xl font-black outline-none" /></div>
                         <div className="p-5 bg-neutral-50 rounded-2xl"><p className="text-[10px] font-bold text-zinc-400 uppercase mb-3">Em quantas parcelas?</p>
                            <div className="flex gap-2">
                               {['3x', '6x', '12x', '24x'].map(p => <button key={p} className={`flex-1 h-12 rounded-xl font-bold transition-all ${p === '12x' ? 'bg-[#FFC107] text-black' : 'bg-white border border-neutral-200'}`}>{p}</button>)}
                            </div>
                         </div>
                      </div>
                   </div>
                   <div className="bg-yellow-50 p-6 rounded-3xl border border-yellow-200"><div className="flex justify-between items-center mb-2"><span className="font-bold text-zinc-500">Valor da Parcela</span><span className="font-black text-lg">12x R$ 98,50</span></div><p className="text-[10px] text-zinc-400 font-bold">Taxa de juros: 1.9% a.m.</p></div>
                   <button className="w-full bg-black text-white h-16 rounded-2xl font-bold text-lg shadow-xl mt-4">Contratar Empréstimo</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      );
    }

    if (view === "select_priority") {
      return (
        <div className="relative h-screen w-full bg-white overflow-hidden font-sans">
          <div className="absolute inset-0 z-0">{isLoaded && (<GoogleMap mapContainerStyle={{ width: '100%', height: '100%', position: 'absolute' }} center={center} zoom={17} options={MAP_OPTIONS}><Marker position={center} /></GoogleMap>)}<motion.button whileTap={{ scale: 0.9 }} onClick={() => setView("plan_trip")} className="absolute top-12 left-5 w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-2xl z-50"><span className="material-symbols-rounded text-black font-bold text-[28px]">arrow_back</span></motion.button></div>
          <motion.div drag="y" dragConstraints={{ top: 0, bottom: 650 }} dragElastic={0.02} onDragEnd={(e, info) => { const v = info.velocity.y; const o = info.offset.y; if (o < -100 || v < -500) setSheetPos(0); else if (o > 150 || v > 500) setSheetPos(84); else setSheetPos(42); }} initial={{ y: "100%" }} animate={{ y: `${sheetPos}%` }} transition={{ type: "spring", damping: 35, stiffness: 350 }} className="absolute bottom-0 left-0 w-full bg-white rounded-t-[40px] shadow-[0_-30px_100px_rgba(0,0,0,0.3)] z-[100]" style={{ height: '95vh', touchAction: 'none' }}>
            <div className="pt-4 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing"><div className="w-14 h-1.5 bg-neutral-200 rounded-full mb-3" /><h2 className="text-[19px] font-bold text-neutral-800">Escolher uma viagem</h2></div>
            <div className="px-6 pb-20 overflow-y-auto no-scrollbar h-full space-y-7 pt-4">
              <div className="space-y-3">
                <VehicleOption id="moto" title="Moto-táxi" icon="🏍️" img="https://mobile-content.uber.com/launch-experience/moto.png" time="02:40 · 10 min" price="R$ 8,50" badge="Econômico" passengers={1} selected={selectedType === "moto"} onClick={() => setSelectedType("moto")} />
                <VehicleOption id="carro" title="Motorista Particular" icon="🚗" img="https://mobile-content.uber.com/launch-experience/ride.png" time="02:41 · 11 min" price="R$ 14,90" passengers={4} selected={selectedType === "carro"} onClick={() => setSelectedType("carro")} />
                <VehicleOption id="frete" title="Logística (Fretes e Mudanças)" icon="📦" img="https://mobile-content.uber.com/launch-experience/teens.png" time="A Combinar" price="Sob Consulta" hasClock selected={selectedType === "frete"} onClick={() => setSelectedType("frete")} />
                
                <AnimatePresence>
                  {selectedType === "frete" && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pl-4 space-y-2 overflow-hidden border-l-2 border-[#FFC107] ml-2">
                       {dynamicVehicles.length > 0 ? dynamicVehicles.map(v => (
                         <VehicleOption 
                           key={v.id}
                           id={v.id} 
                           title={`${v.title} (${v.capacity})`} 
                           icon={v.icon} 
                           img={v.img} 
                           time={v.capacity} 
                           price={`R$ ${v.price.toFixed(2).replace('.', ',')}`} 
                           selected={selectedFreteType === v.id} 
                           onClick={() => setSelectedFreteType(v.id as any)} 
                           isSubOption 
                         />
                       )) : (
                         <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center gap-3">
                           <div className="size-2 rounded-full bg-zinc-200 animate-pulse" />
                           <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Carregando frotas...</span>
                         </div>
                       )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="border-t border-neutral-100 pt-5">
                <div onClick={() => { setView("izi_pay"); setIziPaySubView("main"); }} className="flex items-center justify-between py-3 mb-4 cursor-pointer active:opacity-60 bg-neutral-50 px-4 rounded-2xl">
                  <div className="flex items-center gap-3"><div className="w-8 h-6 bg-[#FFC107] rounded-sm flex items-center justify-center"><span className="material-symbols-rounded text-black text-lg">payments</span></div><span className="font-bold text-[15px]">Izi Pay</span></div>
                  <div className="flex items-center gap-1 text-zinc-400"><span className="text-[10px] font-black uppercase tracking-widest text-[#FFC107]">R$ 482,90</span><span className="material-symbols-rounded">chevron_right</span></div>
                </div>
                <motion.button 
                  whileTap={{ scale: 0.98 }} 
                  onClick={() => {
                    if (selectedType === 'frete') {
                      setTransitData((prev: any) => ({ ...prev, type: 'freight', vehicleCategory: selectedFreteType }));
                      setSubView("freight_wizard" as any);
                    } else {
                      setTransitData((prev: any) => ({ ...prev, type: selectedType === 'moto' ? 'mototaxi' : 'taxi' }));
                      setSubView("taxi_wizard" as any);
                    }
                  }} 
                  className="w-full bg-black text-white h-[64px] rounded-2xl font-bold text-lg shadow-2xl"
                >
                  Escolher {selectedType === 'moto' ? 'Moto-táxi' : selectedType === 'carro' ? 'Motorista Particular' : selectedType === 'frete' ? (dynamicVehicles.find(v => v.id === selectedFreteType)?.title || 'Frete') : ''}
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
          <header className="px-5 pt-12 pb-4 flex items-center gap-6 sticky top-0 bg-white z-50"><motion.button whileTap={{ scale: 0.9 }} onClick={() => window.history.back()} className="material-symbols-rounded font-bold text-2xl">arrow_back</motion.button><h1 className="text-[20px] font-bold">Planeje sua viagem</h1></header>
          <main className="px-5 space-y-6">
            <section className="flex items-center gap-3"><div className="flex-1 border-[2.5px] border-black rounded-xl p-3 flex flex-col gap-4 relative bg-white"><div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full border-[2.5px] border-black shrink-0" /><input type="text" value={originQuery} onChange={(e) => { setOriginQuery(e.target.value); setIsSearching("origin"); }} onFocus={() => setIsSearching("origin")} className="w-full bg-transparent outline-none text-zinc-900 font-medium text-[15px]" /></div><div className="h-[1px] bg-neutral-100 ml-6" /><div className="flex items-center gap-4"><div className="w-2.5 h-2.5 bg-black shrink-0" /><input autoFocus placeholder="Para onde?" value={destQuery} onChange={(e) => { setDestQuery(e.target.value); setIsSearching("dest"); }} onFocus={() => setIsSearching("dest")} className="w-full bg-transparent outline-none text-zinc-900 font-medium text-[15px] placeholder:text-zinc-400" /></div><div className="absolute left-[16px] top-[25px] bottom-[25px] w-[2px] bg-black" /></div></section>
            <section className="space-y-6 pt-2 pb-20"><AnimatePresence mode="popLayout">{suggestions.map((loc, i) => (<motion.div key={loc.placeId || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ delay: i * 0.02 }}><DestinationItem {...loc} onClick={() => handleSelectLocation(loc)} /></motion.div>))}</AnimatePresence></section>
          </main>
        </motion.div>
      );
    }

    return (
      <div className="min-h-screen bg-white font-sans text-black pb-32 overflow-y-auto select-none overflow-x-hidden">
        <header className="px-5 pt-12 pb-6 bg-white sticky top-0 z-50 flex items-center gap-6"><motion.button whileTap={{ scale: 0.8 }} onClick={() => window.history.back()} className="material-symbols-rounded font-bold text-[28px]">arrow_back</motion.button><h1 className="text-[36px] font-bold tracking-tight leading-none">Izi</h1></header>
        <main className="px-5 space-y-7">
          <section onClick={() => setView("plan_trip")} className="flex items-center bg-[#EEEEEE] rounded-full h-[54px] px-4 gap-2 cursor-pointer active:scale-[0.98] transition-transform"><div className="flex flex-1 items-center gap-3"><span className="material-symbols-rounded font-bold text-[24px]">search</span><span className="text-black font-semibold text-lg opacity-90">Para onde?</span></div><div className="h-[38px] bg-white rounded-full flex items-center px-4 gap-2 shadow-sm"><span className="material-symbols-rounded font-bold text-[18px]">calendar_month</span><span className="text-black font-bold text-[13px]">Mais tarde</span></div></section>
          <section className="flex items-center gap-4 py-1"><div className="w-9 h-9 rounded-lg bg-[#EEEEEE] flex items-center justify-center shrink-0"><span className="material-symbols-rounded text-xl opacity-80">schedule</span></div><div className="flex-1 min-w-0 border-b border-neutral-100/50 pb-4"><p className="font-semibold text-[16px] leading-tight truncate">Rua Presidente Vargas, 367</p><p className="text-zinc-500 text-[14px] font-medium truncate">Brumadinho - MG</p></div></section>
          <section><div className="flex justify-between items-center mb-5"><h2 className="text-xl font-bold">Mobilidade e transporte</h2></div><div className="flex gap-3 overflow-x-auto no-scrollbar pb-2"><UberServiceCard name="Viagem" img="https://mobile-content.uber.com/launch-experience/ride.png" onClick={() => setView("plan_trip")} /><UberServiceCard name="Logística" img="https://mobile-content.uber.com/launch-experience/teens.png" /><UberServiceCard name="Excursões" img="https://mobile-content.uber.com/launch-experience/eats.png" badge="Novo" /><UberServiceCard name="Moto" img="https://mobile-content.uber.com/launch-experience/moto.png" /></div></section>
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

// Componentes Auxiliares
const QuickAction = ({ icon, label, onClick }: any) => (
  <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform">
     <div className="w-14 h-14 bg-white rounded-2xl shadow-md border border-neutral-100 flex items-center justify-center relative"><span className="material-symbols-rounded text-black text-2xl">{icon}</span></div>
     <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-tight text-center">{label}</span>
  </div>
);

const CreditCardItem = ({ brand, last, color, text }: any) => (
  <div className={`${color} w-44 h-28 shrink-0 rounded-[24px] p-5 flex flex-col justify-between shadow-lg relative overflow-hidden`}><div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" /><div className={`text-[12px] font-black ${text === 'black' ? 'text-black' : 'text-white'} uppercase`}>{brand}</div><div className={`text-[15px] font-bold ${text === 'black' ? 'text-black/60' : 'text-white/60'}`}>•••• {last}</div></div>
);

const TransactionItem = ({ title, date, amount, icon, color }: any) => (
  <div className="flex items-center gap-4 p-4 border-b border-neutral-50 last:border-none"><div className={`w-11 h-11 rounded-full ${color} flex items-center justify-center shrink-0`}><span className="material-symbols-rounded text-[22px]">{icon}</span></div><div className="flex-1 min-w-0"><p className="font-bold text-[15px] text-black">{title}</p><p className="text-[12px] text-zinc-400 font-medium">{date}</p></div><div className={`font-black text-[15px] ${amount.startsWith('+') ? 'text-green-600' : 'text-black'}`}>{amount}</div></div>
);

const VehicleOption = ({ title, icon, img, time, price, badge, passengers, selected, hasClock, isSubOption, onClick }: any) => (
  <motion.div onClick={onClick} className={`flex items-center ${isSubOption ? 'p-2' : 'p-3'} rounded-2xl cursor-pointer transition-all border-[3px] ${selected ? "border-black bg-white shadow-md" : "border-transparent bg-transparent hover:bg-neutral-50"}`}><div className={`relative ${isSubOption ? 'w-12 h-12' : 'w-16 h-16'} shrink-0 flex items-center justify-center`}><img src={img} className="w-full h-full object-contain" />{hasClock && <div className="absolute top-0 right-0 w-5 h-5 bg-black rounded-full flex items-center justify-center border-2 border-white"><span className="material-symbols-rounded text-white text-[10px]">schedule</span></div>}</div><div className="flex-1 ml-4"><div className="flex items-center gap-1">{icon && <span className="text-[12px]">{icon}</span>}<h3 className={`font-bold ${isSubOption ? 'text-[14px]' : 'text-[16px]'}`}>{title}</h3>{passengers && <div className="flex items-center gap-0.5 opacity-60"><span className="material-symbols-rounded text-[14px]">person</span><span className="text-[12px] font-bold">{passengers}</span></div>}</div><p className="text-zinc-500 text-[13px] font-medium mt-1">{time}</p>{badge && <div className="mt-2 inline-flex items-center gap-1 bg-[#285A98] text-white px-2 py-0.5 rounded-full"><span className="material-symbols-rounded text-[12px] fill-1">bolt</span><span className="text-[10px] font-bold uppercase">{badge}</span></div>}</div><div className="text-right"><p className={`font-bold ${isSubOption ? 'text-[14px]' : 'text-[16px]'}`}>{price}</p></div></motion.div>
);

const UberServiceCard = ({ name, img, badge, onClick }: any) => (
  <motion.div whileTap={{ scale: 0.94 }} onClick={onClick} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer"><div className="w-[88px] h-[88px] bg-[#EEEEEE] rounded-xl flex items-center justify-center relative p-3 border border-neutral-100 shadow-sm">{badge && <span className="absolute -top-1 right-1 bg-[#E9202E] text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-10 border-2 border-white">{badge}</span>}<img src={img} className="w-full h-full object-contain" /></div><span className="text-[13px] font-semibold text-zinc-900">{name}</span></motion.div>
);

const DestinationItem = ({ title, subtitle, dist, isPlace, onClick }: any) => (
  <div onClick={onClick} className="flex items-center gap-4 cursor-pointer active:opacity-60 group"><div className="w-9 h-9 rounded-full bg-[#EEEEEE] flex items-center justify-center shrink-0 group-hover:bg-neutral-200 transition-colors"><span className="material-symbols-rounded text-black text-[20px]">{isPlace ? "location_on" : "schedule"}</span></div><div className="flex-1 min-w-0 border-b border-neutral-50 pb-4"><div className="flex items-center justify-between"><p className="font-bold text-[15px] truncate">{title}</p><span className="text-[12px] text-zinc-400 font-bold whitespace-nowrap ml-2">{dist}</span></div><p className="text-zinc-500 text-[13px] truncate">{subtitle}</p></div></div>
);

const NavItem = ({ icon, label, active, onClick }: any) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1 cursor-pointer ${active ? "text-black" : "text-zinc-400"}`}><span className="material-symbols-rounded text-[28px]" style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}>{icon}</span><span className="text-[11px] font-semibold">{label}</span></div>
);
