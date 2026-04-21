import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface TaxiWizardProps {
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

export const TaxiWizard: React.FC<TaxiWizardProps> = ({
  transitData,
  setTransitData,
  mobilityStep,
  setMobilityStep,
  userLocation,
  updateLocation,
  routePolyline,
  driverLocation,
  distancePrices,
  isCalculatingPrice,
  marketConditions,
  paymentMethod,
  userLevel,
  routeDistance,
  setPaymentsOrigin,
  setSubView,
  navigateSubView,
  showToast,
}) => {

  const totalValue = React.useMemo(() => {
    const base = distancePrices[transitData.type] || 0;
    const distanceMultiplier = parseFloat(routeDistance) || 0;
    return base + (distanceMultiplier * 3.5);
  }, [distancePrices, transitData.type, routeDistance]);

  return (
    <div
      className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >

      {/* ── MAPA TOPO ── */}
      <section className="relative h-[38vh] shrink-0 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <IziTrackingMap
            routePolyline={routePolyline}
            driverLoc={driverLocation}
            userLoc={(userLocation?.lat && userLocation?.lng)
              ? { lat: userLocation.lat as number, lng: userLocation.lng as number }
              : null}
            onMyLocationClick={updateLocation}
            boxed={true}
          />
        </div>

        {/* Gradiente sobre o mapa */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-black/50 pointer-events-none z-10" />

        {/* Header */}
        <header className="absolute top-10 left-0 right-0 z-20 flex items-center justify-between px-6">
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              if (mobilityStep > 1) setMobilityStep(mobilityStep - 1);
              else setSubView("none");
            }}
            style={{
              boxShadow: "10px 10px_25px rgba(0,0,0,0.7), inset 3px 3px 6px rgba(255,255,255,0.06), inset -3px -3px 6px rgba(0,0,0,0.6)".replace(/_/g, " "),
            }}
            className="size-12 rounded-[22px] bg-zinc-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400"
          >
            <Icon name="arrow_back" />
          </motion.button>

          <div
            className="text-right px-5 py-3 rounded-[22px]"
            style={{
              background: "rgba(9,9,11,0.75)",
              backdropFilter: "blur(20px)",
              boxShadow: "8px 8px 20px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.05), inset -2px -2px 5px rgba(0,0,0,0.5)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <h2 className="text-lg font-black text-white tracking-tighter leading-none uppercase italic">
              {transitData.type === 'mototaxi' ? "MotoTáxi Izi" : "Motorista Particular"}
            </h2>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-400 mt-0.5">Mobilidade Urbana</p>
          </div>
        </header>

        {/* Chip de distância + destino */}
        {routeDistance && (
          <div className="absolute bottom-8 left-6 right-6 z-20 flex justify-between items-end gap-3">
            <div
              className="flex-1 min-w-0 px-5 py-3.5 rounded-[26px]"
              style={{
                background: "rgba(9,9,11,0.85)",
                backdropFilter: "blur(20px)",
                boxShadow: "8px 8px 20px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest italic mb-0.5">Destino</p>
              <p className="text-white font-black text-[11px] leading-tight line-clamp-1 italic uppercase">
                {transitData.destination?.address || "Selecionando..."}
              </p>
            </div>
            <div
              className="shrink-0 px-5 py-3.5 rounded-[26px] flex items-center gap-2 font-black text-[11px] text-black italic"
              style={{
                background: "#facc15",
                boxShadow: "inset 3px 3px 6px rgba(255,255,255,0.6), inset -3px -3px 6px rgba(0,0,0,0.2), 0 8px 20px rgba(250,204,21,0.35)",
              }}
            >
              <Icon name="route" size={16} />
              {routeDistance}
            </div>
          </div>
        )}
      </section>

      {/* ── CONTEÚDO ── */}
      <main
        className="flex-1 -mt-6 relative z-30 overflow-y-auto no-scrollbar p-6 pt-10 pb-36 space-y-6"
        style={{
          background: "#09090b",
          borderRadius: "40px 40px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <AnimatePresence mode="wait">

          {/* STEP 1 — Endereços */}
          {mobilityStep === 1 ? (
            <motion.section
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <p className="text-zinc-500 font-black text-[9px] uppercase tracking-[0.35em] px-2 italic">Trajeto da Viagem</p>

              <div className="space-y-3 relative">
                {/* Linha vertical central */}
                <div className="absolute left-[26px] top-[52px] bottom-[52px] w-px bg-zinc-800 z-0" />

                {/* ORIGEM — ponto amarelo pulsante estilo Google */}
                <div
                  className="relative z-10 flex items-center gap-4 px-5 py-4 rounded-[32px]"
                  style={{
                    background: "linear-gradient(145deg, #141414, #0e0e0e)",
                    boxShadow: "12px 12px 28px rgba(0,0,0,0.6), inset 3px 3px 6px rgba(255,255,255,0.04), inset -3px -3px 6px rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="size-10 rounded-[18px] shrink-0 flex items-center justify-center"
                    style={{
                      background: "rgba(250,204,21,0.12)",
                      boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.04)",
                    }}
                  >
                    <Icon name="location_on" size={22} className="text-yellow-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-0.5">Origem</p>
                    <AddressSearchInput
                      placeholder="Onde te buscamos?"
                      onSelect={(addr) => setTransitData((p: any) => ({...p, origin: addr}))}
                      defaultValue={transitData.origin?.address}
                      className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-700 italic"
                    />
                  </div>
                </div>

                {/* DESTINO — ícone xis bandeira */}
                <div
                  className="relative z-10 flex items-center gap-4 px-5 py-4 rounded-[32px]"
                  style={{
                    background: "linear-gradient(145deg, #141414, #0e0e0e)",
                    boxShadow: "12px 12px 28px rgba(0,0,0,0.6), inset 3px 3px 6px rgba(255,255,255,0.04), inset -3px -3px 6px rgba(0,0,0,0.5)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="size-10 rounded-[18px] shrink-0 flex items-center justify-center"
                    style={{
                      background: "rgba(250,204,21,0.1)",
                      boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.04)",
                    }}
                  >
                    <Icon name="pin_drop" size={20} className="text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-600 text-[8px] font-black uppercase tracking-widest mb-0.5">Destino</p>
                    <AddressSearchInput
                      placeholder="Para onde vamos?"
                      onSelect={(addr) => setTransitData((p: any) => ({...p, destination: addr}))}
                      defaultValue={transitData.destination?.address}
                      className="bg-transparent text-white font-black text-xs w-full outline-none placeholder:text-zinc-700 italic"
                    />
                  </div>
                </div>
              </div>

              {/* Card de segurança */}
              <div
                className="flex items-center gap-5 px-6 py-5 rounded-[32px]"
                style={{
                  background: "linear-gradient(145deg, #141414, #0e0e0e)",
                  boxShadow: "12px 12px 28px rgba(0,0,0,0.6), inset 3px 3px 6px rgba(255,255,255,0.04), inset -3px -3px 6px rgba(0,0,0,0.5)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="size-14 rounded-[22px] flex items-center justify-center shrink-0 rotate-6"
                  style={{
                    background: "rgba(250,204,21,0.1)",
                    boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4), inset -1px -1px 3px rgba(255,255,255,0.04)",
                  }}
                >
                  <Icon name="shield" size={28} className="text-yellow-400" />
                </div>
                <div>
                  <p className="text-white font-black text-sm uppercase italic leading-none">Segurança Total</p>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic mt-1">Monitoramento 24h em tempo real</p>
                </div>
              </div>
            </motion.section>

          ) : (

          /* STEP 2 — Resumo e pagamento */
            <motion.section
              key="step2"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              {/* Card de valor */}
              <div
                className="rounded-[38px] p-8 space-y-6"
                style={{
                  background: "linear-gradient(145deg, #161616, #101010)",
                  boxShadow: "16px 16px 35px rgba(0,0,0,0.7), inset 4px 4px 8px rgba(255,255,255,0.04), inset -4px -4px 8px rgba(0,0,0,0.55)",
                  borderLeft: "4px solid #facc15",
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div
                      className="size-12 rounded-[18px] flex items-center justify-center"
                      style={{
                        background: "rgba(250,204,21,0.1)",
                        boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.4)",
                      }}
                    >
                      <Icon name="payments" size={24} className="text-yellow-400" />
                    </div>
                    <div>
                      <span className="text-white font-black text-[13px] uppercase italic block leading-none mb-1">Valor da Corrida</span>
                      <span className="text-zinc-500 text-[9px] font-black uppercase tracking-widest italic">Estimativa por km</span>
                    </div>
                  </div>
                  <span className="text-yellow-400 text-3xl font-black italic tracking-tighter">
                    R$ {totalValue.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Pagamento</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateSubView("mobility_payment")}
                      className="flex items-center gap-2 px-4 py-2 rounded-[16px] border border-white/8 transition-all"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        boxShadow: "4px 4px 10px rgba(0,0,0,0.4), inset 1px 1px 3px rgba(255,255,255,0.04)",
                      }}
                    >
                      <Icon name={paymentMethod === 'online' ? 'credit_card' : 'payments'} size={14} className="text-yellow-400" />
                      <span className="text-white font-black text-[10px] uppercase italic">
                        {paymentMethod === 'online' ? 'Cartão Online' : 'Pagar no Destino'}
                      </span>
                    </motion.button>
                  </div>

                  <div
                    className="p-5 rounded-[26px] space-y-3"
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex justify-between text-[11px] font-black text-zinc-500 italic">
                      <span>Distância Estimada:</span>
                      <span className="text-zinc-300">{routeDistance}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-black text-emerald-400 italic">
                      <span>Taxa Base Incluída:</span>
                      <span>Check!</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ── BOTÃO FIXO ── */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-transparent z-50">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (mobilityStep === 1) {
              if (!transitData.origin || !transitData.destination) {
                showToast("Escolha onde te buscar e para onde vamos", "warning");
                return;
              }
              setMobilityStep(2);
            } else {
              setTransitData((prev: any) => ({ ...prev, estPrice: totalValue }));
              setPaymentsOrigin("checkout");
              navigateSubView("mobility_payment");
            }
          }}
          className="w-full h-[68px] rounded-[28px] flex items-center justify-center gap-4 relative overflow-hidden group"
          style={{
            background: "#facc15",
            boxShadow: "inset 4px 4px 10px rgba(255,255,255,0.5), inset -4px -4px 10px rgba(0,0,0,0.2), 0 16px 40px rgba(250,204,21,0.35)",
          }}
        >
          <span className="relative z-10 text-black font-black text-lg tracking-tighter uppercase italic">
            {mobilityStep === 1 ? "Encontrar Motorista" : "Confirmar Viagem"}
          </span>
          <Icon
            name={mobilityStep === 1 ? "arrow_forward" : "two_wheeler"}
            className="relative z-10 text-black font-black group-hover:translate-x-1.5 transition-transform"
            size={26}
          />
        </motion.button>
      </div>

    </div>
  );
};
