import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";

interface FreightWizardProps {
  transitData: any;
  setTransitData: React.Dispatch<React.SetStateAction<any>>;
  mobilityStep: number;
  setMobilityStep: (step: number) => void;
  userLocation: any;
  updateLocation: (onSuccess?: (address: string) => void) => void;
  routePolyline: string;
  driverLocation: any;
  distancePrices: Record<string, number>;
  isCalculatingPrice: boolean;
  marketConditions: any;
  paymentMethod: string;
  userLevel: number;
  routeDistance: string;
  setPaymentsOrigin: (origin: any) => void;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  showToast: (msg: string, type?: any) => void;
}

export const FreightWizard: React.FC<FreightWizardProps> = ({
  transitData,
  setTransitData,
  mobilityStep,
  setMobilityStep,
  userLocation,
  updateLocation,
  routePolyline,
  driverLocation,
  distancePrices,
  marketConditions,
  paymentMethod,
  routeDistance,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {

  const freightData = transitData.freightData || {
    vehicleType: "",
    hasStairs: false,
    helpers: 0,
    items: ""
  };

  const updateFreight = (updates: any) => {
    setTransitData((prev: any) => ({
      ...prev,
      freightData: { ...(prev.freightData || freightData), ...updates }
    }));
  };

  const vehicleTypes = [
    { id: "fiorino", name: "Fiorino", icon: "local_shipping", priceKey: "fiorino" },
    { id: "van", name: "Van Carga", icon: "airport_shuttle", priceKey: "van_carga" },
    { id: "truck_p", name: "Caminhão Baú Pequeno", icon: "local_shipping", priceKey: "bau_p" },
    { id: "truck_m", name: "Caminhão Baú Médio", icon: "local_shipping", priceKey: "bau_m" },
    { id: "truck_g", name: "Caminhão Baú Grande", icon: "rv_hookup", priceKey: "bau_g" },
    { id: "truck_bau", name: "Caminhão Aberto", icon: "local_shipping", priceKey: "aberto" },
  ];

  const totalValue = React.useMemo(() => {
    if (!routeDistance || !freightData.vehicleType) return 0;

    const vehicle = vehicleTypes.find(v => v.name === freightData.vehicleType);
    const priceKey = vehicle?.priceKey || "logistica";
    const base = distancePrices[priceKey] || distancePrices.logistica || 0;
    
    const baseValues = marketConditions?.settings?.baseValues || {};
    const stairTaxValue = parseFloat(baseValues.logistica_stairs) || 30.0;
    const helperTaxValue = parseFloat(baseValues.logistica_helper) || 35.0;

    const stairTax = freightData.hasStairs ? stairTaxValue : 0;
    const helperTax = freightData.helpers * helperTaxValue;
    
    return base + stairTax + helperTax;
  }, [distancePrices, freightData, vehicleTypes, marketConditions, routeDistance]);

  return (
    <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden"
         style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* ── MAPA FUNDO ── */}
      <div className="absolute inset-0 z-0">
        <IziTrackingMap 
          routePolyline={routePolyline} 
          driverLoc={driverLocation} 
          userLoc={(userLocation?.lat && userLocation?.lng) ? { lat: userLocation.lat as number, lng: userLocation.lng as number } : null} 
          onMyLocationClick={updateLocation} 
          boxed={false}
        />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      </div>
      
      {/* ── HEADER FLUTUANTE ── */}
      <header className="absolute top-10 left-0 right-0 z-20 flex items-center justify-between px-8">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (mobilityStep > 1) setMobilityStep(mobilityStep - 1);
            else setSubView("none");
          }} 
          className="size-12 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400 shadow-2xl clay-card-dark"
        >
          <Icon name="arrow_back" />
        </motion.button>
        <div className="text-right">
          <h2 className="text-xl font-black text-white tracking-tighter leading-none mb-1 uppercase text-shadow-sm">
            Izi Logistics
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Frete & Mudanças</p>
        </div>
      </header>

      {/* ── CHIPS FLUTUANTES ── */}
      <div className="absolute top-32 left-8 right-8 z-20 flex flex-wrap gap-2">
         <div className={`clay-card-yellow px-4 py-2 rounded-[20px] font-black text-[10px] text-black flex items-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] italic border border-white/20 transition-all duration-500
           ${!routeDistance ? 'opacity-50 grayscale' : 'opacity-100'}`}>
           <span className="material-symbols-rounded text-sm">route</span>
           {routeDistance ? routeDistance.split(' • ')[0] : "-- KM"}
         </div>
         <div className="clay-card-yellow px-4 py-2 rounded-[20px] font-black text-[10px] text-black flex items-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] italic border border-white/20 animate-in fade-in slide-in-from-bottom-2">
           <span className="material-symbols-rounded text-sm">payments</span>
           <span>R$ {totalValue.toFixed(2).replace('.', ',')}</span>
         </div>
      </div>

      {/* ── BOTTOM SHEET ── */}
      <IziBottomSheet snapPoints={["35vh", "70vh", "92vh"]} initialSnap={0}>
        <div className="p-8 pb-40 space-y-10">
          <AnimatePresence mode="wait">
            {mobilityStep === 1 ? (
              <motion.section 
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                <div className="space-y-6">
                  <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] px-2 italic text-shadow-sm">Endereços</h3>
                  <div className="space-y-4 relative">
                    <div className="absolute left-9 top-1/2 -translate-y-1/2 w-[1.5px] h-10 bg-zinc-800" />
                    <div className="clay-card-dark rounded-[30px] p-4 pl-5 flex items-center gap-4 border border-white/5">
                      <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Icon name="package_2" size={18} className="text-emerald-400" />
                      </div>
                      <AddressSearchInput
                        placeholder="Local de Coleta"
                        onSelect={(addr) => setTransitData((p: any) => ({...p, origin: addr}))}
                        initialValue={transitData.origin?.address}
                        className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-800 italic"
                      />
                    </div>
                    <div className="clay-card-dark rounded-[30px] p-4 pl-5 flex items-center gap-4 border border-white/5">
                      <div className="size-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center shrink-0">
                        <Icon name="location_on" size={18} className="text-yellow-400" />
                      </div>
                      <AddressSearchInput
                        placeholder="Local de Entrega"
                        onSelect={(addr) => setTransitData((p: any) => ({...p, destination: addr}))}
                        initialValue={transitData.destination?.address}
                        className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-800 italic"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                   <div className="flex justify-between items-end px-2">
                      <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] italic">Tipo de Veículo</h3>
                   </div>
                   <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-10">
                      {vehicleTypes.map((v) => (
                        <button
                          key={v.id}
                          onClick={() => {
                            updateFreight({vehicleType: v.name});
                            setTransitData((prev: any) => ({ ...prev, vehicleCategory: v.name }));
                          }}
                          className={`min-w-[140px] p-6 rounded-[40px] flex flex-col items-center gap-5 transition-all duration-300
                            ${freightData.vehicleType === v.name ? 'clay-card-yellow border-2 border-yellow-200/50 scale-105 z-10' : 'clay-card-dark border border-white/5 opacity-40'}`}
                        >
                           <Icon name={v.icon} size={32} className={freightData.vehicleType === v.name ? 'text-black' : 'text-zinc-500'} />
                           <span className={`text-[10px] font-black uppercase text-center ${freightData.vehicleType === v.name ? 'text-black' : 'text-zinc-500'}`}>{v.name}</span>
                        </button>
                      ))}
                   </div>
                </div>

                <div className="space-y-6">
                   <h3 className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.3em] px-2 italic">Logística</h3>
                   <div className="clay-card-dark rounded-[40px] p-8 border border-white/5 space-y-8">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <Icon name="stairs" size={20} className="text-yellow-400" />
                            <span className="text-white font-black text-xs uppercase italic">Escada?</span>
                         </div>
                         <button onClick={() => updateFreight({hasStairs: !freightData.hasStairs})} className={`w-14 h-8 rounded-full p-1 ${freightData.hasStairs ? 'bg-yellow-400' : 'bg-zinc-800'}`}>
                           <div className={`size-6 rounded-full bg-black transition-all transform ${freightData.hasStairs ? 'translate-x-6' : 'translate-x-0'}`} />
                         </button>
                      </div>
                   </div>
                </div>
              </motion.section>
            ) : (
              <motion.section 
                key="step2"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-10"
              >
                 <div className="clay-card-dark rounded-[40px] p-8 border-l-4 border-yellow-400 space-y-8">
                    <div className="flex justify-between items-center text-white">
                       <div>
                          <h4 className="text-xl font-black italic">{freightData.vehicleType}</h4>
                          <p className="text-yellow-400 text-[10px] font-black uppercase italic mt-1">Orçamento Izi</p>
                       </div>
                       <p className="text-3xl font-black italic">R$ {totalValue.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex justify-between items-center px-2">
                       <span className="text-[10px] font-black text-zinc-500 uppercase italic">Pagamento</span>
                       <button onClick={() => navigateSubView("mobility_payment")} className="bg-white/5 px-4 py-2 rounded-2xl border border-white/5 text-[10px] font-black text-white italic">
                         {paymentMethod === 'online' ? 'Cartão Online' : 'Pagar na Coleta'}
                       </button>
                    </div>
                 </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* ── BOTÃO FIXO ── */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-50">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (mobilityStep === 1) {
                if (!transitData.origin || !transitData.destination) {
                  showToast("Escolha a rota", "warning");
                  return;
                }
                setMobilityStep(2);
              } else {
                setTransitData((prev: any) => ({ ...prev, estPrice: totalValue }));
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }
            }}
            className="w-full h-20 bg-yellow-400 clay-card-dark py-6 rounded-full flex items-center justify-center gap-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-yellow-400 opacity-90 shadow-[inset_4px_4px_10px_rgba(255,255,255,0.4)]" />
            <span className="relative z-10 text-black font-black text-xl tracking-tighter uppercase italic">
              {mobilityStep === 1 ? "Prosseguir" : "Confirmar Izi Logistics"}
            </span>
            <Icon name={mobilityStep === 1 ? "arrow_forward" : "local_shipping"} className="relative z-10 text-black font-black" size={28} />
          </motion.button>
        </div>
      </IziBottomSheet>

    </div>
  );
};
