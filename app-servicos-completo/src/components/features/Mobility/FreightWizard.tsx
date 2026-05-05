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
      className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden"
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
        {/* Gradiente no topo para visibilidade dos botões */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      </div>


      {/* ── HEADER FLUTUANTE (Dark Clay) ── */}
      <header className="fixed top-12 left-0 right-0 z-[150] flex items-center justify-between px-6 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl flex items-center justify-center text-yellow-500 pointer-events-auto"
          style={{
            background: "rgba(9, 9, 11, 0.85)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 10px 25px rgba(0,0,0,0.4), inset 1px 1px 1px rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <Icon name="arrow_back" />
        </motion.button>

        <div
          className="text-right px-6 py-4 rounded-[28px] pointer-events-auto"
          style={{
            background: "rgba(9, 9, 11, 0.85)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 15px 35px rgba(0,0,0,0.5), inset 1px 1px 1px rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <h2 className="text-xl font-black text-white tracking-tighter leading-none uppercase">
            Izi Logistics
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-yellow-500 mt-1">
            Frete & Mudanças
          </p>
        </div>
      </header>

      {/* ── BOTTOM SHEET (mesmo estilo do TaxiWizard) ── */}
      <IziBottomSheet snapPoints={["35vh", "60vh", "90vh"]} initialSnap={0}>
        <div className="p-6 pb-40 space-y-8">
          <AnimatePresence mode="wait">
            <motion.section
              key="step-summary"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-8"
            >
              {/* Grid de Info no Topo */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="p-4 rounded-[24px] flex flex-col gap-1 font-black relative overflow-hidden"
                    style={{
                      background: "linear-gradient(145deg, #facc15, #eab308)",
                      boxShadow: "5px 5px 15px rgba(250,204,21,0.2), inset 2px 2px 5px rgba(255,255,255,0.4)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                       <Icon name="route" size={14} className="text-black/70" />
                       <span className="text-[8px] text-black/70 uppercase not-italic tracking-widest leading-none">Distância</span>
                    </div>
                    <span className="text-sm tracking-tight text-black drop-shadow-sm">{distancePart || "-- km"}</span>
                  </div>

                  <div
                    className="p-4 rounded-[24px] flex flex-col gap-1 font-black relative overflow-hidden"
                    style={{
                      background: "linear-gradient(145deg, #facc15, #eab308)",
                      boxShadow: "5px 5px 15px rgba(250,204,21,0.2), inset 2px 2px 5px rgba(255,255,255,0.4)",
                    }}
                  >
                    <div className="flex items-center gap-2">
                       <Icon name="schedule" size={14} className="text-black/70" />
                       <span className="text-[8px] text-black/70 uppercase not-italic tracking-widest leading-none">Tempo</span>
                    </div>
                    <span className="text-sm tracking-tight text-black drop-shadow-sm">{timePart || "Rápido ⚡"}</span>
                  </div>
                </div>

                <div
                  className="p-5 rounded-[28px] flex items-center justify-between font-black relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #1c1c1e, #121214)",
                    boxShadow: "10px 10px 20px rgba(0,0,0,0.4), inset 2px 2px 5px rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="flex items-center gap-3">
                     <div className="size-10 rounded-xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20">
                        <Icon name="payments" size={20} className="text-yellow-500" />
                     </div>
                     <span className="text-[10px] text-zinc-500 uppercase not-italic tracking-widest leading-none">Valor Total</span>
                  </div>
                  <span className="text-2xl tracking-tighter text-yellow-500 drop-shadow-lg">
                     R$ {totalValue.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              {/* Opções de Logística (Extras) */}
              <div
                className="rounded-[40px] p-7 space-y-7 relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #1a1a1c, #121214)",
                  boxShadow: "20px 20px 40px rgba(0,0,0,0.6), inset 3px 3px 8px rgba(255,255,255,0.03), inset -3px -3px 8px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] relative z-10">Serviços Adicionais</p>

                {/* Toggle Escada */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="size-11 rounded-[18px] flex items-center justify-center"
                      style={{
                        background: freightData.hasStairs ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.04)",
                        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Icon name="stairs" size={20} className={freightData.hasStairs ? "text-yellow-400" : "text-zinc-600"} />
                    </div>
                    <div>
                      <span className="text-white font-black text-sm uppercase">Escada</span>
                      <p className="text-zinc-600 text-[9px] font-black uppercase tracking-wider mt-0.5">
                        + R$ {(parseFloat(marketConditions?.settings?.baseValues?.logistica_stairs) || 30).toFixed(0)}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    onClick={() => updateFreight({ hasStairs: !freightData.hasStairs })}
                    className="relative w-14 h-7 rounded-full p-0.5 transition-all duration-300"
                    style={{
                      background: freightData.hasStairs
                        ? "linear-gradient(145deg, #facc15, #eab308)"
                        : "linear-gradient(145deg, #27272a, #1c1c1f)",
                      boxShadow: freightData.hasStairs
                        ? "inset 2px 2px 4px rgba(255,255,255,0.4), inset -2px -2px 4px rgba(0,0,0,0.2), 0 4px 12px rgba(250,204,21,0.3)"
                        : "inset 2px 2px 4px rgba(0,0,0,0.5), inset -2px -2px 4px rgba(255,255,255,0.03)",
                    }}
                  >
                    <motion.div
                      animate={{ x: freightData.hasStairs ? 26 : 0 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="size-6 rounded-full bg-white shadow-md"
                    />
                  </motion.button>
                </div>

                <div className="h-px bg-white/5" />

                {/* Ajudantes */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="size-11 rounded-[18px] flex items-center justify-center"
                      style={{
                        background: freightData.helpers > 0 ? "rgba(250,204,21,0.15)" : "rgba(255,255,255,0.04)",
                        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Icon name="group" size={20} className={freightData.helpers > 0 ? "text-yellow-400" : "text-zinc-600"} />
                    </div>
                    <div>
                      <span className="text-white font-black text-sm uppercase">Ajudantes</span>
                      <p className="text-zinc-600 text-[9px] font-black uppercase tracking-wider mt-0.5">
                        + R$ {(parseFloat(marketConditions?.settings?.baseValues?.logistica_helper) || 35).toFixed(0)} / cada
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => updateFreight({ helpers: Math.max(0, freightData.helpers - 1) })}
                      className="size-9 rounded-2xl flex items-center justify-center font-black text-lg text-white"
                      style={{
                        background: "linear-gradient(145deg, #1a1a1c, #111113)",
                        boxShadow: "6px 6px 12px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      −
                    </motion.button>
                    <span className="text-white font-black text-lg w-5 text-center">{freightData.helpers}</span>
                    <motion.button
                      whileTap={{ scale: 0.88 }}
                      onClick={() => updateFreight({ helpers: Math.min(4, freightData.helpers + 1) })}
                      className="size-9 rounded-2xl flex items-center justify-center font-black text-lg text-black"
                      style={{
                        background: "linear-gradient(145deg, #facc15, #eab308)",
                        boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.5), inset -3px -3px 6px rgba(0,0,0,0.15), 0 6px 14px rgba(250,204,21,0.25)",
                      }}
                    >
                      +
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Forma de Pagamento */}
              <div className="flex justify-between items-center px-6 py-4 rounded-[32px] bg-white/5 border border-white/5">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pagamento</span>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigateSubView("mobility_payment")}
                  className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 bg-black/40"
                >
                  <Icon
                    name={paymentMethod === "online" ? "credit_card" : "payments"}
                    size={16}
                    className="text-yellow-400"
                  />
                  <span className="text-white font-black text-[11px] uppercase">
                    {paymentMethod === 'saldo' ? 'Izi Pay (Saldo)' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão via App' : 'Pagar na Coleta'}
                  </span>
                </motion.button>
              </div>
            </motion.section>
          </AnimatePresence>
        </div>

        {/* ── BOTÃO FIXO (mesmo estilo do TaxiWizard) ── */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-32 bg-gradient-to-t from-black via-black/95 to-transparent z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                setTransitData((prev: any) => ({ ...(prev || {}), estPrice: totalValue }));
                setPaymentsOrigin("checkout");
                navigateSubView("mobility_payment");
              }}
              className="w-full h-[74px] rounded-[32px] flex items-center justify-center gap-4 relative overflow-hidden group"
              style={{
                background: "linear-gradient(135deg, #FFD700, #FBBF24)",
                boxShadow: "0 15px 40px rgba(251, 191, 36, 0.4), inset 4px 4px 8px rgba(255,255,255,0.4)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />

              <span className="relative z-10 text-black font-black text-xl tracking-tighter uppercase drop-shadow-sm">
                Confirmar Izi Logistics
              </span>
              <div className="relative z-10 size-10 rounded-2xl bg-black/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300 shadow-inner">
                <Icon
                  name="local_shipping"
                  className="text-black font-black"
                  size={24}
                />
              </div>
            </motion.button>
          </div>
        </div>
      </IziBottomSheet>
    </div>
  );
};
