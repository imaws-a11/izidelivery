import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useApp } from "../../../contexts/AppContext";
import { supabase } from "../../../lib/supabase";
import { useGoogleMapsLoader } from "../../../hooks/useGoogleMapsLoader";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";



export const ExploreEnviosUberView: React.FC = () => {
  const { 
    calculateDistancePrices, 
    setIsCalculatingPrice, 
    setSubView, 
    setTransitData,
    transitData, 
    userLocation, 
    updateLocation, 
    setMobilityStep, 
    routePolyline, 
    routeDistance,
    driverLocation,
    distanceValueKm,
    distancePrices,
    paymentMethod,
    setPaymentMethod
  } = useApp();
  const { isLoaded } = useGoogleMapsLoader();
  const [view, setView] = useState<"explore" | "plan_trip" | "select_priority" | "izi_pay">("plan_trip");
  const [iziPaySubView, setIziPaySubView] = useState<"main" | "send" | "my_qr" | "scan" | "loan">("main");
  const [selectedType, setSelectedType] = useState<"moto" | "carro" | "frete">("moto");
  const [selectedFreteType, setSelectedFreteType] = useState<"fiorino" | "caminhonete" | "bau">("fiorino");
  
  const destInputRef = useRef<HTMLInputElement>(null);
  const [sheetPos, setSheetPos] = useState(42);

  const [dynamicVehicles, setDynamicVehicles] = useState<any[]>([]);
  
  const activeVehicle = useMemo(() => {
    if (selectedType === 'moto') return { title: 'Izi Moto', price: distancePrices.mototaxi || 8.5 };
    if (selectedType === 'carro') return { title: 'Izi Particular', price: distancePrices.carro || 14.9 };
    const freight = dynamicVehicles.find(v => v.id === selectedFreteType);
    return freight || { title: 'Izi Logistics', price: 0 };
  }, [selectedType, selectedFreteType, distancePrices, dynamicVehicles]);

  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<"origin" | "dest" | null>(null);

  // Sincroniza endereço de origem com a localização real do usuário ao carregar
  useEffect(() => {
    if (userLocation.address && !originQuery) {
      setOriginQuery(userLocation.address);
    }
  }, [userLocation.address]);

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
            { id: 'van', title: 'Van Carga', icon: '🚐', img: iconMap['van'] || 'https://cdn-icons-png.flaticon.com/512/2830/2830310.png', price: meta.van_min || 50, capacity: 'Até 1500kg' },
            { id: 'bau_p', title: 'Baú Pequeno', icon: '🚚', img: iconMap['bau_p'] || 'https://cdn-icons-png.flaticon.com/512/2766/2766258.png', price: meta.bau_p_min || 70, capacity: 'Até 2500kg' },
            { id: 'bau_m', title: 'Baú Médio', icon: '🚚', img: iconMap['bau_m'] || 'https://cdn-icons-png.flaticon.com/512/2316/2316972.png', price: meta.bau_m_min || 80, capacity: 'Até 3500kg' },
            { id: 'bau_g', title: 'Baú Grande', icon: '🚚', img: iconMap['bau_g'] || 'https://cdn-icons-png.flaticon.com/512/2766/2766144.png', price: meta.bau_g_min || 100, capacity: 'Até 5000kg' },
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
    const fullAddr = `${loc.title}, ${loc.subtitle}`;

    if (isSearching === "origin") {
      setOriginQuery(fullAddr);
      setSuggestions([]);
      setIsSearching("dest");
      // Pequeno timeout para garantir que o input de destino esteja pronto para foco
      setTimeout(() => destInputRef.current?.focus(), 100);
      return;
    }

    const originStr = originQuery === "Minha localização" || !originQuery ? (userLocation.address || "") : originQuery;
    const destStr = fullAddr;

    setDestQuery(loc.title); // Mostra apenas o principal no input

    setTransitData((prev: any) => ({
      ...prev,
      destination: destStr,
      origin: originStr,
      destinationCoords: { lat: center.lat, lng: center.lng }
    }));
    
    // Dispara o cálculo da rota imediatamente para o mapa mostrar a rota
    calculateDistancePrices(originStr, destStr);
    
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
          {/* Mapa com Rota */}
          <div className="absolute inset-0 z-0">
            {isLoaded && (
              <IziTrackingMap
                routePolyline={routePolyline}
                userLoc={{ lat: center.lat, lng: center.lng }}
                originLoc={transitData.originCoords}
                destLoc={transitData.destinationCoords}
                driverLoc={null}
                boxed={false}
              />
            )}
            
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setView("plan_trip")} 
              className="absolute top-12 left-5 size-12 bg-white/90 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-2xl z-50 border border-zinc-100 text-black"
            >
              <span className="material-symbols-rounded font-black text-2xl">arrow_back</span>
            </motion.button>

            {/* Overlay de Rota Premium */}
            <motion.div 
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              className="absolute top-12 left-20 right-6 z-50"
            >
               <div className="bg-white/90 backdrop-blur-xl p-4 rounded-2xl border border-zinc-100 flex justify-between items-center shadow-2xl">
                  <div className="flex flex-col">
                     <span className="text-[8px] text-yellow-600 font-black uppercase tracking-[0.3em] mb-1">Trajeto Identificado</span>
                     <span className="text-black font-black text-xs tracking-tighter truncate uppercase">{routeDistance || 'Calculando...'} • {transitData.destination?.split(',')[0]}</span>
                  </div>
               </div>
            </motion.div>
          </div>

          <IziBottomSheet snapPoints={["40vh", "65vh", "92vh"]} initialSnap={1}>
              <div className="px-6 pb-48 pt-2 h-full">
                {/* Resumo do Trajeto Clean */}
                <div className="bg-zinc-50/50 rounded-[32px] p-5 mb-8 border border-zinc-100">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      <div className="size-2.5 rounded-full border-2 border-zinc-300 shrink-0" />
                      <p className="text-[13px] font-black text-zinc-400 truncate uppercase">{originQuery || userLocation.address}</p>
                    </div>
                    <div className="h-4 w-px bg-zinc-200 ml-[4px]" />
                    <div className="flex items-center gap-4">
                      <div className="size-2.5 bg-black shrink-0 rounded-sm" />
                      <p className="text-[13px] font-black text-black truncate uppercase">{transitData.destination || "Destino não definido"}</p>
                    </div>
                  </div>
                </div>

                {/* Opções de Veículos Premium */}
                <div className="space-y-4">
                  <VehicleOption 
                    id="moto" 
                    title="Izi Moto" 
                    img="https://cdn-icons-png.flaticon.com/512/3721/3721619.png" 
                    time="Chegue mais rápido" 
                    price={distancePrices.mototaxi ? `R$ ${distancePrices.mototaxi.toFixed(2).replace('.', ',')}` : "R$ 8,50"}
                    badge="Flash" 
                    details="Ideal para fugir do trânsito com segurança."
                    selected={selectedType === "moto"} 
                    onClick={() => setSelectedType("moto")} 
                  />
                  
                  <VehicleOption 
                    id="carro" 
                    title="Izi Particular" 
                    img="https://cdn-icons-png.flaticon.com/512/3204/3204064.png" 
                    time="Conforto & Ar" 
                    price={distancePrices.carro ? `R$ ${distancePrices.carro.toFixed(2).replace('.', ',')}` : "R$ 14,90"}
                    details="Carros novos selecionados pela nossa equipe."
                    selected={selectedType === "carro"} 
                    onClick={() => setSelectedType("carro")} 
                  />

                  <VehicleOption 
                    id="frete" 
                    title="Izi Logistics" 
                    img="https://cdn-icons-png.flaticon.com/512/2830/2830305.png" 
                    time="Cargas & Mudanças" 
                    price={selectedType === 'frete' ? `R$ ${activeVehicle.price.toFixed(2).replace('.', ',')}` : "Ver Frotas"}
                    details="Vans e Caminhões para o que você precisar."
                    hasClock 
                    selected={selectedType === "frete"} 
                    onClick={() => setSelectedType("frete")} 
                  />
                  
                  <AnimatePresence>
                    {selectedType === "frete" && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }} 
                        className="pl-4 space-y-3 overflow-hidden border-l-4 border-yellow-400 ml-4 py-4"
                      >
                         {dynamicVehicles.length > 0 ? dynamicVehicles.map(v => (
                           <VehicleOption 
                             key={v.id}
                             id={v.id} 
                             title={v.title} 
                             img={v.img} 
                             time={v.capacity} 
                             price={`R$ ${v.price.toFixed(2).replace('.', ',')}`} 
                             details="Transporte logístico especializado."
                             selected={selectedFreteType === v.id} 
                             onClick={() => setSelectedFreteType(v.id as any)} 
                             isSubOption 
                           />
                         )) : (
                           <div className="p-6 bg-zinc-50 rounded-[28px] flex items-center gap-4 border border-zinc-100">
                             <div className="size-2 rounded-full bg-yellow-400 animate-ping" />
                             <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Localizando frotas disponíveis...</span>
                           </div>
                         )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Pagamento Premium */}
                <div className="mt-10 pt-8 border-t border-zinc-50">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400">Método de Pagamento</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/10 rounded-full">
                      <span className="material-symbols-rounded text-[14px] text-yellow-600 font-black">verified_user</span>
                      <span className="text-[9px] font-black text-yellow-700 uppercase tracking-widest">Seguro</span>
                    </div>
                  </div>

                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6">
                    {[
                      { id: 'cartao', label: 'Cartão', icon: 'credit_card' },
                      { id: 'pix', label: 'PIX', icon: 'qr_code' },
                      { id: 'dinheiro', label: 'Dinheiro', icon: 'payments' },
                      { id: 'saldo', label: 'Saldo Izi', icon: 'account_balance_wallet' }
                    ].map(method => (
                      <motion.button
                        key={method.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-center justify-center min-w-[100px] h-[100px] rounded-[32px] border transition-all gap-2 shadow-sm
                          ${paymentMethod === method.id 
                            ? 'border-black bg-black text-white shadow-xl shadow-black/10' 
                            : 'border-zinc-100 bg-white text-zinc-400 hover:border-zinc-200'}
                        `}
                      >
                        <span className="material-symbols-rounded text-[22px] font-black">{method.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest">{method.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rodapé de Ação Fixo */}
              <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-white/80 backdrop-blur-xl border-t border-zinc-50 z-[110]">
                <div className="flex items-center justify-between mb-6 px-2">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Total da Viagem</span>
                      <span className="text-3xl font-black text-black tracking-tighter">
                        {selectedType === 'moto' 
                          ? (distancePrices.mototaxi ? `R$ ${distancePrices.mototaxi.toFixed(2).replace('.', ',')}` : "R$ 8,50")
                          : selectedType === 'carro'
                            ? (distancePrices.carro ? `R$ ${distancePrices.carro.toFixed(2).replace('.', ',')}` : "R$ 14,90")
                            : `R$ ${activeVehicle.price.toFixed(2).replace('.', ',')}`
                        }
                      </span>
                   </div>
                   <div className="text-right">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Espera Média</span>
                      <span className="text-[13px] font-black text-black uppercase tracking-tighter block">~ 5-8 min</span>
                   </div>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.96 }} 
                  onClick={() => {
                    const origin = originQuery === "Minha localização" || !originQuery ? (userLocation.address || "") : originQuery;
                    const destination = transitData.destination;
                    
                    if (selectedType === 'frete') {
                      setTransitData((prev: any) => ({ ...prev, type: 'freight', vehicleCategory: selectedFreteType, origin, destination }));
                      setMobilityStep(2);
                      calculateDistancePrices(origin, destination);
                      setSubView("freight_wizard" as any);
                    } else {
                      const finalType = selectedType === 'moto' ? 'mototaxi' : 'taxi';
                      setTransitData((prev: any) => ({ ...prev, type: finalType, origin, destination }));
                      setMobilityStep(2);
                      calculateDistancePrices(origin, destination);
                      setSubView("taxi_wizard" as any);
                    }
                  }} 
                  className="w-full bg-black text-white h-[74px] rounded-[32px] font-black text-lg shadow-[0_20px_40px_rgba(0,0,0,0.15)] flex items-center justify-center gap-4 group overflow-hidden relative"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <span className="relative z-10 uppercase tracking-[0.1em] text-[14px]">Solicitar {activeVehicle.title}</span>
                  <div className="relative z-10 size-11 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
                    <span className="material-symbols-rounded text-white font-black text-2xl">bolt</span>
                  </div>
                </motion.button>
              </div>
          </IziBottomSheet>
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
          className="fixed inset-0 bg-white z-[200] font-sans text-black overflow-y-auto select-none no-scrollbar"
        >
          <header className="px-6 pt-14 pb-6 flex items-center gap-6 sticky top-0 bg-white z-50 border-b border-zinc-50">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={() => setView("explore")} 
              className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black"
            >
              <span className="material-symbols-rounded font-black text-2xl">arrow_back</span>
            </motion.button>
            <h1 className="text-xl font-black uppercase tracking-tighter">Planeje sua viagem</h1>
          </header>

          <main className="px-6 pt-8 space-y-8">
            <section className="flex flex-col gap-6">
              <div className="rounded-[40px] p-8 flex flex-col gap-8 relative bg-white border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                {/* Linha de Conexão Lateral Premium */}
                <div className="absolute left-[39px] top-[56px] bottom-[56px] w-0.5 bg-zinc-100" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="size-4 rounded-full border-[3px] border-zinc-200 bg-white shrink-0" />
                  <div className="flex-1 flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="De onde você vai sair?"
                      value={originQuery} 
                      onChange={(e) => { setOriginQuery(e.target.value); setIsSearching("origin"); }} 
                      onFocus={() => setIsSearching("origin")} 
                      className="flex-1 bg-transparent outline-none text-black font-black text-[16px] uppercase tracking-tighter placeholder:text-zinc-300" 
                    />
                    
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      disabled={userLocation.loading}
                      onClick={async () => {
                        setIsSearching("origin");
                        const newLoc = await updateLocation(true);
                        if (newLoc && newLoc.address) {
                          setOriginQuery(newLoc.address);
                          setSuggestions([]);
                          setIsSearching("dest");
                          setTimeout(() => destInputRef.current?.focus(), 100);
                        }
                      }}
                      className={`size-11 rounded-2xl flex items-center justify-center transition-all shrink-0 border
                        ${userLocation.loading ? 'bg-zinc-50 border-zinc-100' : 'bg-blue-50 border-blue-100'}
                      `}
                    >
                      <span className={`material-symbols-rounded ${userLocation.loading ? 'text-zinc-400 animate-spin' : 'text-blue-600'} text-xl font-black`}>
                        {userLocation.loading ? 'sync' : 'my_location'}
                      </span>
                    </motion.button>
                  </div>
                </div>

                <div className="h-px bg-zinc-50 ml-10" />

                <div className="flex items-center gap-5 relative z-10">
                  <div className="size-4 bg-black shrink-0 rounded-sm" />
                  <input 
                    ref={destInputRef}
                    placeholder="Para onde?" 
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
              
              {suggestions.length === 0 && !originQuery && !destQuery && (
                <div className="py-10 flex flex-col items-center text-center px-10">
                   <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center mb-6">
                      <span className="material-symbols-rounded text-zinc-200 text-4xl">travel_explore</span>
                   </div>
                   <h3 className="text-black font-black text-lg uppercase tracking-tighter mb-2">Explore sua cidade</h3>
                   <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Insira um endereço para ver as opções de viagem disponíveis agora.</p>
                </div>
              )}
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
              onClick={() => window.history.back()} 
              className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center"
            >
              <span className="material-symbols-rounded font-black text-black text-2xl">arrow_back</span>
            </motion.button>
            <h1 className="text-[32px] font-black tracking-tighter leading-none uppercase">Izi</h1>
          </div>
          
          <div className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
             <span className="material-symbols-rounded text-black font-black">person</span>
          </div>
        </header>

        <main className="px-6 space-y-10">
          <section 
            onClick={() => setView("plan_trip")} 
            className="group flex items-center bg-zinc-50 rounded-[32px] h-[84px] px-8 gap-5 cursor-pointer active:scale-[0.98] transition-all hover:bg-zinc-100 border border-zinc-100 shadow-[0_15px_30px_rgba(0,0,0,0.02)]"
          >
            <div className="flex flex-1 items-center gap-5 overflow-hidden">
              <div className="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-rounded font-black text-black text-2xl">search</span>
              </div>
              <div className="flex flex-col min-w-0">
                 <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1.5">Sua Localização</span>
                 <span className="text-black font-black text-sm uppercase tracking-tighter truncate">
                   {userLocation.address || "Para onde você vai?"}
                 </span>
              </div>
            </div>
            <div className="h-[50px] bg-black rounded-2xl flex items-center px-5 gap-3 shadow-xl shrink-0 group-hover:bg-zinc-800 transition-colors">
              <span className="material-symbols-rounded font-black text-white text-[20px]">calendar_month</span>
              <span className="text-white font-black text-[11px] uppercase tracking-widest">Agendar</span>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-lg font-black uppercase tracking-tighter">Serviços Izi</h2>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Ver Todos</span>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
              <UberServiceCard name="Viagem" img="https://cdn-icons-png.flaticon.com/512/3204/3204064.png" onClick={() => setView("plan_trip")} />
              <UberServiceCard name="Logística" img="https://cdn-icons-png.flaticon.com/512/2830/2830305.png" />
              <UberServiceCard name="Excursões" img="https://cdn-icons-png.flaticon.com/512/2316/2316972.png" badge="Novo" />
              <UberServiceCard name="Moto" img="https://cdn-icons-png.flaticon.com/512/3721/3721619.png" />
            </div>
          </section>

          <section className="bg-zinc-50 rounded-[40px] p-8 border border-zinc-100">
            <h3 className="text-lg font-black uppercase tracking-tighter mb-6">Histórico Recente</h3>
            <div className="space-y-6">
              {[
                { title: "Rua Presidente Vargas, 367", subtitle: "São Paulo, SP", icon: "history" },
                { title: "Shopping Ibirapuera", subtitle: "Av. Ibirapuera, 3103", icon: "history" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-5 cursor-pointer active:opacity-50">
                  <div className="size-11 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shrink-0">
                    <span className="material-symbols-rounded text-zinc-400 text-xl">{item.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[14px] leading-tight truncate uppercase tracking-tighter">{item.title}</p>
                    <p className="text-zinc-400 text-[10px] font-black truncate uppercase tracking-widest mt-1">{item.subtitle}</p>
                  </div>
                </div>
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

// Componentes Auxiliares
const QuickAction = ({ icon, label, onClick }: any) => (
  <div onClick={onClick} className="flex flex-col items-center gap-2 cursor-pointer active:scale-90 transition-transform">
     <div className="size-16 bg-white rounded-[24px] shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-zinc-100 flex items-center justify-center relative hover:border-zinc-200 transition-colors">
       <span className="material-symbols-rounded text-black text-2xl font-black">{icon}</span>
     </div>
     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center mt-1">{label}</span>
  </div>
);

const CreditCardItem = ({ brand, last, color, text }: any) => (
  <div className={`${color} w-48 h-32 shrink-0 rounded-[32px] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden active:scale-95 transition-transform cursor-pointer`}>
    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
    <div className={`text-[11px] font-black ${text === 'black' ? 'text-black' : 'text-white'} uppercase tracking-widest`}>{brand}</div>
    <div className="flex flex-col gap-1">
      <div className={`text-[14px] font-black ${text === 'black' ? 'text-black/40' : 'text-white/40'} tracking-widest`}>•••• •••• •••• {last}</div>
      <div className={`text-[10px] font-black ${text === 'black' ? 'text-black' : 'text-white'} uppercase tracking-tighter`}>Exp 12/28</div>
    </div>
  </div>
);

const TransactionItem = ({ title, date, amount, icon, color }: any) => (
  <div className="flex items-center gap-5 p-5 border-b border-zinc-50 last:border-none hover:bg-zinc-50/50 transition-colors cursor-pointer first:rounded-t-[32px] last:rounded-b-[32px]">
    <div className={`size-12 rounded-2xl ${color} flex items-center justify-center shrink-0 shadow-sm`}>
      <span className="material-symbols-rounded text-[22px] font-black">{icon}</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-black text-[15px] text-black uppercase tracking-tighter leading-tight">{title}</p>
      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">{date}</p>
    </div>
    <div className={`font-black text-[15px] tracking-tighter ${amount.startsWith('+') ? 'text-green-600' : 'text-black'}`}>{amount}</div>
  </div>
);

const VehicleOption = ({ title, img, time, price, badge, details, selected, hasClock, isSubOption, onClick }: any) => (
  <motion.div 
    onClick={onClick} 
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.98 }}
    className={`flex flex-col ${isSubOption ? 'p-5' : 'p-6'} rounded-[36px] cursor-pointer transition-all border-2 relative
      ${selected 
        ? "border-black bg-white shadow-[0_25px_50px_rgba(0,0,0,0.12)] z-10" 
        : "border-zinc-100 bg-zinc-50/40 hover:bg-white hover:border-zinc-200"
      }`}
  >
    <div className="flex items-center">
      <div className={`relative ${isSubOption ? 'w-18 h-18' : 'w-24 h-24'} shrink-0 flex items-center justify-center rounded-[28px] bg-white border border-zinc-50 shadow-sm overflow-hidden`}>
        <img src={img} className="w-full h-full object-contain transform hover:scale-110 transition-transform duration-500" />
        {hasClock && (
          <div className="absolute top-2 right-2 size-7 bg-black rounded-full flex items-center justify-center border-2 border-white shadow-lg">
            <span className="material-symbols-rounded text-white text-[14px] font-black">schedule</span>
          </div>
        )}
      </div>
      <div className="flex-1 ml-6">
        <div className="flex items-center justify-between mb-1">
            <h3 className={`font-black ${isSubOption ? 'text-[15px]' : 'text-[19px]'} tracking-tighter uppercase text-black`}>{title}</h3>
            <p className={`font-black ${isSubOption ? 'text-[16px]' : 'text-[21px]'} tracking-tighter text-black`}>{price}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">{time}</span>
          {badge && (
            <div className="bg-yellow-400 text-black px-2 py-0.5 rounded-lg shadow-sm">
              <span className="text-[9px] font-black uppercase tracking-widest">{badge}</span>
            </div>
          )}
        </div>
        
        <AnimatePresence>
          {selected && details && (
            <motion.p 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mt-3 leading-relaxed border-t border-zinc-50 pt-3"
            >
              {details}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
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
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-3 py-1 rounded-full font-black z-10 border-2 border-white shadow-lg uppercase tracking-widest">
          {badge}
        </span>
      )}
      <img src={img} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300" />
    </div>
    <span className="text-[12px] font-black text-black uppercase tracking-widest">{name}</span>
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

const NavItem = ({ icon, label, active, onClick }: any) => (
  <div onClick={onClick} className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${active ? "text-black scale-110" : "text-zinc-300 hover:text-zinc-400"}`}>
    <span className="material-symbols-rounded text-[30px] font-black" style={{ fontVariationSettings: active ? "'FILL' 1" : "" }}>{icon}</span>
    <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
  </div>
);
