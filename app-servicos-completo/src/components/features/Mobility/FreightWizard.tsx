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

  React.useEffect(() => {
    updateLocation();
  }, []);

  const vehicleTypes = [
    { id: "fiorino", name: "Fiorino", icon: "local_shipping", priceKey: "fiorino" },
    { id: "van", name: "Van Carga", icon: "airport_shuttle", priceKey: "van_carga" },
    { id: "truck_p", name: "Baú Pequeno", icon: "local_shipping", priceKey: "bau_p" },
    { id: "truck_m", name: "Baú Médio", icon: "local_shipping", priceKey: "bau_m" },
    { id: "truck_g", name: "Baú Grande", icon: "rv_hookup", priceKey: "bau_g" },
    { id: "truck_bau", name: "Aberto", icon: "local_shipping", priceKey: "aberto" },
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
          onMyLocationClick={updateLocation}
          boxed={false}
        />
        {/* Gradiente no topo para visibilidade dos botões */}
        <div className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-black/70 to-transparent pointer-events-none" />
      </div>

      {/* ── HEADER FLUTUANTE (estilo TaxiWizard) ── */}
      <header className="absolute top-10 left-0 right-0 z-20 flex items-center justify-between px-6">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            if (mobilityStep > 1) setMobilityStep(mobilityStep - 1);
            else setSubView("none");
          }}
          style={{
            boxShadow: "10px 10px 25px rgba(0,0,0,0.7), inset 3px 3px 6px rgba(255,255,255,0.06), inset -3px -3px 6px rgba(0,0,0,0.6)",
          }}
          className="size-12 rounded-[22px] bg-zinc-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400"
        >
          <Icon name="arrow_back" />
        </motion.button>

        <div
          className="text-right px-5 py-3 rounded-[22px]"
          style={{
            background: "rgba(9,9,11,0.80)",
            backdropFilter: "blur(20px)",
            boxShadow: "8px 8px 20px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.05), inset -2px -2px 5px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="text-lg font-black text-white tracking-tighter leading-none uppercase italic">
            Izi Logistics
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">
            Frete & Mudanças
          </p>
        </div>
      </header>

      {/* ── CHIPS FLUTUANTES no mapa — km, tempo e valor em tempo real ── */}
      <div className="absolute top-32 right-6 z-20 flex flex-col gap-2 items-end">
        {/* Card de distância */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: routeDistance ? 1 : 0.45, x: 0 }}
          className="px-5 py-3.5 rounded-[26px] flex items-center gap-2 font-black text-[11px] text-black italic"
          style={{
            background: "#facc15",
            boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.6), inset -3px -3px 6px rgba(0,0,0,0.2)",
            filter: routeDistance ? "none" : "grayscale(0.4)",
          }}
        >
          <Icon name="route" size={16} />
          {distancePart ?? "-- km"}
        </motion.div>

        {/* Card de tempo do trajeto */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: timePart ? 1 : 0.45, x: 0 }}
          transition={{ delay: 0.1 }}
          className="px-5 py-3.5 rounded-[26px] flex items-center gap-2 font-black text-[11px] text-black italic"
          style={{
            background: "#facc15",
            boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.6), inset -3px -3px 6px rgba(0,0,0,0.2), 0 8px 20px rgba(250,204,21,0.35)",
            filter: timePart ? "none" : "grayscale(0.4)",
          }}
        >
          <Icon name="schedule" size={16} />
          {timePart ?? "-- min"}
        </motion.div>

        {/* Card de valor da corrida em tempo real */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: totalValue > 0 ? 1 : 0.45, x: 0 }}
          transition={{ delay: 0.2 }}
          className="px-5 py-3.5 rounded-[26px] flex items-center gap-2 font-black text-[11px] text-black italic"
          style={{
            background: "#facc15",
            boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.6), inset -3px -3px 6px rgba(0,0,0,0.2), 0 8px 20px rgba(250,204,21,0.35)",
            filter: totalValue > 0 ? "none" : "grayscale(0.4)",
          }}
        >
          <Icon name="payments" size={16} />
          {totalValue > 0 ? `R$ ${totalValue.toFixed(2).replace(".", ",")}` : "R$ --,--"}
        </motion.div>
      </div>

      {/* ── BOTTOM SHEET (mesmo estilo do TaxiWizard) ── */}
      <IziBottomSheet snapPoints={["35vh", "60vh", "90vh"]} initialSnap={0}>
        <div className="p-6 pb-40 space-y-8">
          <AnimatePresence mode="wait">

            {/* STEP 1 — Endereços + Veículo + Logística */}
            {mobilityStep === 1 ? (
              <motion.section
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {/* Cabeçalho da seção */}
                <div className="flex flex-col gap-1 px-2">
                  <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.4em] italic">Izi Logistics</p>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Configurar Frete</h3>
                </div>

                {/* Endereços */}
                <div className="space-y-4 relative">
                  <div className="absolute left-[31px] top-[56px] bottom-[56px] w-[2px] bg-gradient-to-b from-yellow-400/50 via-zinc-800 to-zinc-800 z-0 opacity-50" />

                  {/* ORIGEM */}
                  <div
                    className="relative z-10 flex items-center gap-5 px-6 py-5 rounded-[36px]"
                    style={{
                      background: "linear-gradient(145deg, #161618, #0e0e10)",
                      boxShadow: "15px 15px 35px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.03), inset -2px -2px 5px rgba(0,0,0,0.5)",
                      border: "1.5px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div className="relative size-12 shrink-0 flex items-center justify-center rounded-2xl bg-zinc-900/50">
                      <div className="absolute size-4 rounded-full bg-emerald-400/40 animate-ping" />
                      <div className="relative size-3.5 rounded-full bg-emerald-400 border-2 border-white shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1 italic">Coleta</p>
                        <AddressSearchInput
                          placeholder="Local de coleta..."
                          onSelect={(addr) => setTransitData((p: any) => ({ ...p, origin: addr }))}
                          initialValue={transitData.origin?.address}
                          className="bg-transparent text-white font-black text-[13px] w-full outline-none placeholder:text-zinc-700 italic tracking-tight"
                        />
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateLocation((addr) => {
                          setTransitData((p: any) => ({
                            ...p,
                            origin: {
                              address: addr,
                              lat: userLocation.lat,
                              lng: userLocation.lng
                            }
                          }));
                          showToast("Localização capturada!", "success");
                        })}
                        className="size-10 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-yellow-400 shrink-0 shadow-lg"
                      >
                        <span className="material-symbols-outlined text-xl">my_location</span>
                      </motion.button>
                    </div>
                  </div>

                  {/* DESTINO */}
                  <div
                    className="relative z-10 flex items-center gap-5 px-6 py-5 rounded-[36px]"
                    style={{
                      background: "linear-gradient(145deg, #161618, #0e0e10)",
                      boxShadow: "15px 15px 35px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.03), inset -2px -2px 5px rgba(0,0,0,0.5)",
                      border: "1.5px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div
                      className="size-12 rounded-2xl shrink-0 flex items-center justify-center"
                      style={{
                        background: "rgba(250,204,21,0.08)",
                        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Icon name="flag" size={24} className="text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1 italic">Entrega</p>
                      <AddressSearchInput
                        placeholder="Local de entrega..."
                        onSelect={(addr) => setTransitData((p: any) => ({ ...p, destination: addr }))}
                        initialValue={transitData.destination?.address}
                        className="bg-transparent text-white font-black text-[13px] w-full outline-none placeholder:text-zinc-700 italic tracking-tight"
                      />
                    </div>
                  </div>
                </div>

                {/* Tipo de Veículo */}
                <div className="space-y-4">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] px-2 italic">Tipo de Veículo</p>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
                    {vehicleTypes.map((v) => {
                      const selected = freightData.vehicleType === v.name;
                      return (
                        <motion.button
                          key={v.id}
                          whileTap={{ scale: 0.93 }}
                          animate={{ scale: selected ? 1.06 : 1 }}
                          onClick={() => {
                            updateFreight({ vehicleType: v.name });
                            setTransitData((prev: any) => ({ ...prev, vehicleCategory: v.name }));
                          }}
                          className="min-w-[110px] p-5 rounded-[32px] flex flex-col items-center gap-4 transition-all duration-300 shrink-0"
                          style={
                            selected
                              ? {
                                  background: "linear-gradient(145deg, #facc15, #eab308)",
                                  boxShadow: "inset 5px 5px 10px rgba(255,255,255,0.6), inset -5px -5px 10px rgba(0,0,0,0.18)",
                                  border: "2px solid rgba(255,255,255,0.5)",
                                  zIndex: 10,
                                }
                              : {
                                  background: "linear-gradient(145deg, #facc15, #d9a906)",
                                  boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.45), inset -3px -3px 6px rgba(0,0,0,0.15)",
                                  border: "1px solid rgba(255,255,255,0.3)",
                                  opacity: 0.75,
                                }
                          }
                        >
                          <div
                            className="size-12 rounded-2xl flex items-center justify-center"
                            style={{
                              background: "rgba(0,0,0,0.10)",
                              boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.15)",
                            }}
                          >
                            <Icon
                              name={v.icon}
                              size={24}
                              className="text-black"
                            />
                          </div>
                          <span
                            className="text-[9px] font-black uppercase text-center leading-tight text-black"
                          >
                            {v.name}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Opções de Logística */}
                <div
                  className="rounded-[40px] p-7 space-y-7 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #1a1a1c, #121214)",
                    boxShadow: "20px 20px 40px rgba(0,0,0,0.6), inset 3px 3px 8px rgba(255,255,255,0.03), inset -3px -3px 8px rgba(0,0,0,0.6)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] italic relative z-10">Extras</p>

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
                        <span className="text-white font-black text-sm uppercase italic">Escada</span>
                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-wider italic mt-0.5">
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
                        <span className="text-white font-black text-sm uppercase italic">Ajudantes</span>
                        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-wider italic mt-0.5">
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
              </motion.section>
            ) : (
              /* STEP 2 — Resumo e Pagamento */
              <motion.section
                key="step2"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="flex flex-col gap-1 px-2">
                  <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.4em] italic">Confirmação</p>
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Resumo do Frete</h3>
                </div>

                <div
                  className="rounded-[44px] p-8 space-y-8 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #1c1c1e, #121214)",
                    boxShadow: "25px 25px 50px rgba(0,0,0,0.6), inset 4px 4px 10px rgba(255,255,255,0.05), inset -4px -4px 10px rgba(0,0,0,0.5)",
                  }}
                >
                  {/* Veículo + Valor */}
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                      <div
                        className="size-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: "rgba(250,204,21,0.12)",
                          boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.4), 0 10px 20px rgba(250,204,21,0.2)",
                        }}
                      >
                        <Icon name="local_shipping" size={28} className="text-yellow-400" />
                      </div>
                      <div>
                        <span className="text-white font-black text-sm uppercase italic block leading-none mb-1.5 tracking-tighter">
                          {freightData.vehicleType || "Veículo"}
                        </span>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">
                          Orçamento Izi
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-yellow-400 text-4xl font-black italic tracking-tighter drop-shadow-lg">
                        R$ {totalValue.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 relative z-10" />

                  {/* Detalhes */}
                  <div className="space-y-5 relative z-10">
                    <div className="flex justify-between items-center px-2">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Forma de Pagamento</span>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigateSubView("mobility_payment")}
                        className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10"
                        style={{
                          background: "rgba(0,0,0,0.4)",
                          boxShadow: "6px 6px 15px rgba(0,0,0,0.4), inset 1px 1px 3px rgba(255,255,255,0.05)",
                        }}
                      >
                        <Icon
                          name={paymentMethod === "online" ? "credit_card" : "payments"}
                          size={16}
                          className="text-yellow-400"
                        />
                        <span className="text-white font-black text-[11px] uppercase italic tracking-tighter">
                          {paymentMethod === "online" ? "Cartão Online" : "Pagar na Coleta"}
                        </span>
                      </motion.button>
                    </div>

                    <div
                      className="p-6 rounded-[32px] space-y-4"
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        boxShadow: "inset 4px 4px 10px rgba(0,0,0,0.6), inset -2px -2px 5px rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="flex justify-between items-center text-[11px] font-black italic uppercase tracking-tight">
                        <span className="text-zinc-500">Distância Total:</span>
                        <span className="text-white bg-zinc-800 px-3 py-1 rounded-full border border-white/5">
                          {distancePart || "--"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-black italic uppercase tracking-tight">
                        <span className="text-zinc-500">Tempo estimado:</span>
                        <span className="text-emerald-400">{timePart || "Rápido ⚡"}</span>
                      </div>
                      {freightData.hasStairs && (
                        <div className="flex justify-between items-center text-[11px] font-black italic uppercase tracking-tight">
                          <span className="text-zinc-500">Taxa Escada:</span>
                          <span className="text-yellow-400">
                            + R$ {(parseFloat(marketConditions?.settings?.baseValues?.logistica_stairs) || 30).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      )}
                      {freightData.helpers > 0 && (
                        <div className="flex justify-between items-center text-[11px] font-black italic uppercase tracking-tight">
                          <span className="text-zinc-500">Ajudantes ({freightData.helpers}x):</span>
                          <span className="text-yellow-400">
                            + R$ {(freightData.helpers * (parseFloat(marketConditions?.settings?.baseValues?.logistica_helper) || 35)).toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
        </div>

        {/* ── BOTÃO FIXO (mesmo estilo do TaxiWizard) ── */}
        <div className="absolute bottom-0 left-0 right-0 p-8 pb-32 bg-gradient-to-t from-black via-black/95 to-transparent z-50 pointer-events-none">
          <div className="pointer-events-auto">
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (mobilityStep === 1) {
                  if (!transitData.origin || !transitData.destination) {
                    showToast("Escolha os locais de coleta e entrega", "warning");
                    return;
                  }
                  if (!freightData.vehicleType) {
                    showToast("Selecione o tipo de veículo", "warning");
                    return;
                  }
                  setMobilityStep(2);
                } else {
                  setTransitData((prev: any) => ({ ...prev, estPrice: totalValue }));
                  setPaymentsOrigin("checkout");
                  navigateSubView("mobility_payment");
                }
              }}
              className="w-full h-[74px] rounded-[32px] flex items-center justify-center gap-4 relative overflow-hidden group"
              style={{
                background: "linear-gradient(145deg, #facc15, #eab308)",
                boxShadow: "inset 6px 6px 12px rgba(255,255,255,0.6), inset -6px -6px 12px rgba(0,0,0,0.15)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />

              <span className="relative z-10 text-black font-black text-xl tracking-tighter uppercase italic drop-shadow-sm">
                {mobilityStep === 1 ? "Continuar" : "Confirmar Izi Logistics"}
              </span>
              <div className="relative z-10 size-10 rounded-2xl bg-black/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300 shadow-inner">
                <Icon
                  name={mobilityStep === 1 ? "arrow_forward" : "local_shipping"}
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
