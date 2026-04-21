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
        className="flex-1 -mt-10 relative z-30 overflow-y-auto no-scrollbar p-6 pt-12 pb-36 space-y-8"
        style={{
          background: "linear-gradient(180deg, #09090b 0%, #000000 100%)",
          borderRadius: "48px 48px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 -20px 40px rgba(0,0,0,0.4)",
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
              className="space-y-8"
            >
              <div className="flex flex-col gap-1 px-2">
                <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.4em] italic">Izi Mobility</p>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Trajeto da Viagem</h3>
              </div>

              <div className="space-y-4 relative">
                {/* Linha vertical central estilizada */}
                <div className="absolute left-[31px] top-[56px] bottom-[56px] w-[2px] bg-gradient-to-b from-yellow-400/50 via-zinc-800 to-zinc-800 z-0 opacity-50" />

                {/* ORIGEM — ponto amarelo pulsante estilo Google */}
                <div
                  className="relative z-10 flex items-center gap-5 px-6 py-5 rounded-[36px]"
                  style={{
                    background: "linear-gradient(145deg, #161618, #0e0e10)",
                    boxShadow: "15px 15px 35px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.03), inset -2px -2px 5px rgba(0,0,0,0.5)",
                    border: "1.5px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div className="relative size-12 shrink-0 flex items-center justify-center rounded-2xl bg-zinc-900/50">
                    {/* Ring pulsante Google Style */}
                    <div className="absolute size-4 rounded-full bg-yellow-400/40 animate-ping" />
                    {/* Ponto Central */}
                    <div className="relative size-3.5 rounded-full bg-yellow-400 border-2 border-white shadow-[0_0_12px_rgba(250,204,21,0.6)]" />
                  </div>

                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1 italic">Origem (Onde você está)</p>
                      <AddressSearchInput
                        placeholder="Local de partida..."
                        onSelect={(addr) => setTransitData((p: any) => ({...p, origin: addr}))}
                        defaultValue={transitData.origin?.address}
                        className="bg-transparent text-white font-black text-[13px] w-full outline-none placeholder:text-zinc-700 italic tracking-tight"
                      />
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => updateLocation()}
                      className="size-10 rounded-xl bg-zinc-800/80 border border-white/10 flex items-center justify-center text-yellow-400 shrink-0 shadow-lg"
                      title="Sua localização atual"
                    >
                      <span className="material-symbols-outlined text-xl">my_location</span>
                    </motion.button>
                  </div>
                </div>

                {/* DESTINO — ícone Bandeira */}
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
                    <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest mb-1 italic">Destino (Para onde vamos?)</p>
                    <AddressSearchInput
                      placeholder="Para onde vamos?"
                      onSelect={(addr) => setTransitData((p: any) => ({...p, destination: addr}))}
                      defaultValue={transitData.destination?.address}
                      className="bg-transparent text-white font-black text-[13px] w-full outline-none placeholder:text-zinc-700 italic tracking-tight"
                    />
                  </div>
                </div>
              </div>

              {/* Card de segurança Claymorphism */}
              <div
                className="flex items-center gap-5 px-7 py-6 rounded-[40px] relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #1a1a1c, #121214)",
                  boxShadow: "20px 20px 40px rgba(0,0,0,0.6), inset 3px 3px 8px rgba(255,255,255,0.03), inset -3px -3px 8px rgba(0,0,0,0.6)",
                  border: "1px solid rgba(250,204,21,0.1)",
                }}
              >
                <div className="absolute -right-4 -top-4 size-24 bg-yellow-400/5 blur-2xl rounded-full" />
                <div
                  className="size-16 rounded-[24px] flex items-center justify-center shrink-0 rotate-3 shadow-2xl"
                  style={{
                    background: "linear-gradient(145deg, #222, #111)",
                    boxShadow: "8px 8px 16px rgba(0,0,0,0.4), inset 2px 2px 4px rgba(255,255,255,0.05)",
                  }}
                >
                  <Icon name="shield" size={32} className="text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-white font-black text-base uppercase italic leading-none tracking-tighter">Segurança Total</h4>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.15em] italic mt-1.5 leading-relaxed">
                    Sua viagem é monitorada <br /> 24h em tempo real pela Central Izi.
                  </p>
                </div>
              </div>
            </motion.section>

          ) : (

          /* STEP 2 — Resumo e pagamento */
            <motion.section
              key="step2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              {/* Card de valor Ultra Clay */}
              <div
                className="rounded-[44px] p-8 space-y-8 relative overflow-hidden"
                style={{
                  background: "linear-gradient(145deg, #1c1c1e, #121214)",
                  boxShadow: "25px 25px 50px rgba(0,0,0,0.6), inset 4px 4px 10px rgba(255,255,255,0.05), inset -4px -4px 10px rgba(0,0,0,0.5)",
                }}
              >
                <div className="absolute top-0 right-0 w-1/2 h-full bg-yellow-400/[0.02] blur-3xl rounded-full -mr-16" />
                
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center"
                      style={{
                        background: "rgba(250,204,21,0.12)",
                        boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.4), 0 10px 20px rgba(250,204,21,0.2)",
                      }}
                    >
                      <Icon name="payments" size={28} className="text-yellow-400" />
                    </div>
                    <div>
                      <span className="text-white font-black text-sm uppercase italic block leading-none mb-1.5 tracking-tighter">Custo da Viagem</span>
                      <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Rota otimizada {transitData.type === 'mototaxi' ? 'Moto Izi' : 'Motorista Particular'}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-yellow-400 text-4xl font-black italic tracking-tighter drop-shadow-lg">
                      R$ {totalValue.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-white/5 relative z-10" />

                <div className="space-y-5 relative z-10">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Forma de Pagamento</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigateSubView("mobility_payment")}
                      className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10 transition-all"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        boxShadow: "6px 6px 15px rgba(0,0,0,0.4), inset 1px 1px 3px rgba(255,255,255,0.05)",
                      }}
                    >
                      <Icon name={paymentMethod === 'online' ? 'credit_card' : 'payments'} size={16} className="text-yellow-400" />
                      <span className="text-white font-black text-[11px] uppercase italic tracking-tighter">
                        {paymentMethod === 'online' ? 'Cartão Online' : 'Pagar no Destino'}
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
                      <span className="text-white bg-zinc-800 px-3 py-1 rounded-full border border-white/5">{routeDistance}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-black italic uppercase tracking-tight">
                      <span className="text-zinc-500">Tempo estimado:</span>
                      <span className="text-emerald-400">Rápido ⚡</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* ── BOTÃO FIXO — Ultra Premium ── */}
      <div className="fixed bottom-0 left-0 right-0 p-8 pt-4 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
        <motion.button
          whileHover={{ scale: 1.02, y: -2 }}
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
          className="w-full h-[74px] rounded-[32px] flex items-center justify-center gap-4 relative overflow-hidden group"
          style={{
            background: "linear-gradient(145deg, #facc15, #eab308)",
            boxShadow: "0 20px 50px rgba(250,204,21,0.25), inset 6px 6px 12px rgba(255,255,255,0.6), inset -6px -6px 12px rgba(0,0,0,0.15)",
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
          
          <span className="relative z-10 text-black font-black text-xl tracking-tighter uppercase italic drop-shadow-sm">
            {mobilityStep === 1 ? "Continuar" : "Confirmar Viagem"}
          </span>
          <div className="relative z-10 size-10 rounded-2xl bg-black/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300 shadow-inner">
            <Icon
              name={mobilityStep === 1 ? "arrow_forward" : "two_wheeler"}
              className="text-black font-black"
              size={24}
            />
          </div>
        </motion.button>
      </div>

    </div>
  );
};
