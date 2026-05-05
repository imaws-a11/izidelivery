import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { supabase } from "../../../lib/supabase";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";

interface FreightWizardProps {
  transitData: any;
  setTransitData: React.Dispatch<React.SetStateAction<any>>;
  mobilityStep: number;
  setMobilityStep: (step: number) => void;
  userLocation: any;
  updateLocation: (force?: boolean, onSuccess?: (address: string, lat: number, lng: number) => void) => void;
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

  // Define valores padrão se transitData for null/undefined
  const safeTransitData = transitData || {};
  const freightData = safeTransitData.freightData || {
    vehicleType: "",
    hasStairs: false,
    helpers: 0,
    items: ""
  };

  const updateFreight = (updates: any) => {
    setTransitData((prev: any) => {
      const p = prev || {};
      return {
        ...p,
        freightData: { ...(p.freightData || freightData), ...updates }
      };
    });
  };

  const [vehicleTypes, setVehicleTypes] = React.useState<any[]>([
    { id: "fiorino", name: "Fiorino", icon: "local_shipping", priceKey: "fiorino" },
    { id: "van", name: "Van Carga", icon: "airport_shuttle", priceKey: "van" },
    { id: "truck_p", name: "Baú Pequeno", icon: "local_shipping", priceKey: "bau_p" },
    { id: "truck_m", name: "Baú Médio", icon: "local_shipping", priceKey: "bau_m" },
    { id: "truck_g", name: "Baú Grande", icon: "rv_hookup", priceKey: "bau_g" },
    { id: "truck_bau", name: "Aberto", icon: "local_shipping", priceKey: "aberto" },
  ]);

  React.useEffect(() => {
    const fetchDynamicRates = async () => {
      try {
        const { data } = await supabase
          .from('dynamic_rates_delivery')
          .select('metadata')
          .eq('type', 'base_values')
          .maybeSingle();
        
        if (data?.metadata) {
          const meta = data.metadata;
          const allVehicles = [
            { id: "fiorino", name: "Fiorino", icon: "local_shipping", priceKey: "fiorino" },
            { id: "van", name: "Van Carga", icon: "airport_shuttle", priceKey: "van" },
            { id: "caminhonete", name: "Caminhonete", icon: "local_shipping", priceKey: "caminhonete" },
            { id: "truck_p", name: "Baú Pequeno", icon: "local_shipping", priceKey: "bau_p" },
            { id: "truck_m", name: "Baú Médio", icon: "local_shipping", priceKey: "bau_m" },
            { id: "truck_g", name: "Baú Grande", icon: "rv_hookup", priceKey: "bau_g" },
            { id: "truck_bau", name: "Aberto", icon: "local_shipping", priceKey: "aberto" },
            { id: "utilitario", name: "Utilitário", icon: "local_shipping", priceKey: "utilitario" }
          ];
          // Filtra apenas os que tem preço configurado
          setVehicleTypes(allVehicles.filter(v => meta[`${v.priceKey}_min`]));
        }
      } catch (e) {
        console.error("Erro ao buscar taxas dinâmicas:", e);
      }
    };
    fetchDynamicRates();
    updateLocation(true);
  }, []);

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

  // Extrai distância e tempo do routeDistance (ex: "5.2 km • 12 min")
  const distancePart = routeDistance ? routeDistance.split(" • ")[0] : null;
  const timePart = routeDistance ? routeDistance.split(" • ")[1] : null;

  return (
    <div
      className="absolute inset-0 z-[120] bg-white text-black flex flex-col overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >

      {/* ── MAPA FUNDO ── */}
      <div className="absolute inset-0 z-0">
        <IziTrackingMap
          routePolyline={routePolyline}
          driverLoc={driverLocation}
          userLoc={(userLocation?.lat && userLocation?.lng)
            ? { lat: userLocation.lat as number, lng: userLocation.lng as number }
            : null}
          originLoc={(safeTransitData.origin?.lat && safeTransitData.origin?.lng)
            ? { lat: Number(safeTransitData.origin.lat), lng: Number(safeTransitData.origin.lng) }
            : null}
          destLoc={(safeTransitData.destination?.lat && safeTransitData.destination?.lng)
            ? { lat: Number(safeTransitData.destination.lat), lng: Number(safeTransitData.destination.lng) }
            : null}
          originLabel="MEU ENDEREÇO"
          onMyLocationClick={updateLocation}
          boxed={false}
        />
        {/* Gradiente sutil no topo */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
      </div>


      {/* ── HEADER FLUTUANTE PREMIUM ── */}
      <header className="fixed top-12 left-0 right-0 z-[150] flex items-center justify-between px-6 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl bg-white/90 backdrop-blur-xl border border-zinc-100 flex items-center justify-center text-black shadow-2xl pointer-events-auto"
        >
          <Icon name="arrow_back" />
        </motion.button>

        <div
          className="text-right px-6 py-3 rounded-[28px] bg-white/90 backdrop-blur-xl border border-zinc-100 shadow-2xl pointer-events-auto"
        >
          <h2 className="text-lg font-black text-black tracking-tighter leading-none uppercase">
            Izi Logistics
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500 mt-1">
            Frete & Mudanças
          </p>
        </div>
      </header>

      {/* ── BOTTOM SHEET PREMIUM ── */}
      <IziBottomSheet snapPoints={["40vh", "65vh", "90vh"]} initialSnap={0}>
          <div className="px-6 pb-48 pt-4 space-y-6">
            <AnimatePresence mode="wait">
              <motion.section
                key="step-summary"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Info Grid */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-5 rounded-[28px] bg-zinc-50/50 border border-zinc-100/50 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                         <span className="material-symbols-rounded text-zinc-400 text-sm">route</span>
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Distância</span>
                      </div>
                      <span className="text-[13px] font-black text-black uppercase tracking-tighter">{distancePart || "-- km"}</span>
                    </div>

                    <div className="p-5 rounded-[28px] bg-zinc-50/50 border border-zinc-100/50 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                         <span className="material-symbols-rounded text-zinc-400 text-sm">schedule</span>
                         <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Tempo</span>
                      </div>
                      <span className="text-[13px] font-black text-black uppercase tracking-tighter">{timePart || "Rápido ⚡"}</span>
                    </div>
                  </div>

                  <div className="p-6 rounded-[32px] bg-white border border-zinc-100 shadow-[0_15px_30px_rgba(0,0,0,0.03)] flex items-center justify-between">
                    <div className="flex items-center gap-4">
                       <div className="size-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                          <span className="material-symbols-rounded text-yellow-600 text-2xl">payments</span>
                       </div>
                       <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Valor Total</span>
                    </div>
                    <span className="text-3xl font-black text-black tracking-tighter">
                       R$ {totalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                {/* Serviços Adicionais */}
                <div className="rounded-[40px] p-7 space-y-6 border border-zinc-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]">
                  <p className="text-zinc-400 text-[9px] font-black uppercase tracking-[0.3em]">Serviços Adicionais</p>

                  {/* Toggle Escada */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${freightData.hasStairs ? 'bg-yellow-400/10' : 'bg-zinc-50'}`}>
                        <span className={`material-symbols-rounded ${freightData.hasStairs ? 'text-yellow-600' : 'text-zinc-400'} text-2xl`}>stairs</span>
                      </div>
                      <div>
                        <span className="text-black font-black text-sm uppercase">Escada</span>
                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-wider mt-0.5">
                          + R$ {(parseFloat(marketConditions?.settings?.baseValues?.logistica_stairs) || 30).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => updateFreight({ hasStairs: !freightData.hasStairs })}
                      className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 ${freightData.hasStairs ? 'bg-black' : 'bg-zinc-200'}`}
                    >
                      <motion.div
                        animate={{ x: freightData.hasStairs ? 28 : 0 }}
                        className="size-5 rounded-full bg-white shadow-sm"
                      />
                    </motion.button>
                  </div>

                  <div className="h-px bg-zinc-50" />

                  {/* Ajudantes */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-2xl flex items-center justify-center transition-colors ${freightData.helpers > 0 ? 'bg-yellow-400/10' : 'bg-zinc-50'}`}>
                        <span className={`material-symbols-rounded ${freightData.helpers > 0 ? 'text-yellow-600' : 'text-zinc-400'} text-2xl`}>group</span>
                      </div>
                      <div>
                        <span className="text-black font-black text-sm uppercase">Ajudantes</span>
                        <p className="text-zinc-400 text-[9px] font-black uppercase tracking-wider mt-0.5">
                          + R$ {(parseFloat(marketConditions?.settings?.baseValues?.logistica_helper) || 35).toFixed(0)} / cada
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => updateFreight({ helpers: Math.max(0, freightData.helpers - 1) })}
                        className="size-10 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-lg text-black"
                      >
                        −
                      </motion.button>
                      <span className="text-black font-black text-lg w-6 text-center">{freightData.helpers}</span>
                      <motion.button
                        whileTap={{ scale: 0.88 }}
                        onClick={() => updateFreight({ helpers: Math.min(4, freightData.helpers + 1) })}
                        className="size-10 rounded-2xl bg-black flex items-center justify-center font-black text-lg text-white"
                      >
                        +
                      </motion.button>
                    </div>
                  </div>
                </div>

                {/* Pagamento */}
                <div className="flex justify-between items-center px-6 py-5 rounded-[32px] bg-zinc-50 border border-zinc-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pagamento</span>
                    <span className="text-[12px] font-black text-black uppercase tracking-tight">
                      {paymentMethod === 'saldo' ? 'Izi Pay (Saldo)' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão via App' : 'Pagar na Coleta'}
                    </span>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigateSubView("mobility_payment")}
                    className="size-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center"
                  >
                    <span className="material-symbols-rounded text-zinc-400 text-xl">edit</span>
                  </motion.button>
                </div>
              </motion.section>
            </AnimatePresence>
          </div>

          {/* Botão de Ação Principal */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-white/80 backdrop-blur-xl border-t border-zinc-50 z-50">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setTransitData((prev: any) => ({ ...(prev || {}), estPrice: totalValue }));
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }}
              className="w-full h-[74px] rounded-[32px] bg-black text-white flex items-center justify-center gap-4 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.15)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              <span className="relative z-10 font-black text-lg tracking-[0.1em] uppercase">
                Confirmar Izi Logistics
              </span>
              <div className="relative z-10 size-11 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
                <span className="material-symbols-rounded text-white font-black text-2xl">local_shipping</span>
              </div>
            </motion.button>
          </div>
      </IziBottomSheet>
    </div>
  );
};
