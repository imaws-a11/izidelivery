import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { AddressSearchInput } from "../Address/AddressSearchInput";
import { IziTrackingMap } from "../Map/IziTrackingMap";
import { IziBottomSheet } from "../../common/IziBottomSheet";

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

  const safeTransitData = transitData || {};

  const totalValue = React.useMemo(() => {
    if (!distancePrices || typeof distancePrices !== 'object' || !safeTransitData?.type) return 0;
    try {
      return distancePrices[safeTransitData.type] || 0;
    } catch (e) {
      console.warn("Erro ao acessar distancePrices:", e);
      return 0;
    }
  }, [distancePrices, safeTransitData?.type]);

  React.useEffect(() => {
    updateLocation();
  }, []);

  return (
    <div
      className="absolute inset-0 z-[120] bg-[#09090b] text-zinc-100 flex flex-col overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >

      {/* ── HEADER FLUTUANTE DE VERDADE (FIXED) ── */}
      <header className="fixed top-10 left-0 right-0 z-[150] flex items-center justify-between px-6 pointer-events-none">
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => setSubView("none")}
          className="size-12 rounded-[22px] bg-zinc-900/90 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-500 pointer-events-auto"
          style={{
            boxShadow: "10px 10px 25px rgba(0,0,0,0.7), inset 3px 3px 6px rgba(255,255,255,0.06), inset -3px -3px 6px rgba(0,0,0,0.6)",
          }}
        >
          <Icon name="arrow_back" />
        </motion.button>

        <div
          className="text-right px-5 py-3 rounded-[22px] pointer-events-auto"
          style={{
            background: "rgba(9,9,11,0.75)",
            backdropFilter: "blur(20px)",
            boxShadow: "8px 8px 20px rgba(0,0,0,0.6), inset 2px 2px 5px rgba(255,255,255,0.05), inset -2px -2px 5px rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <h2 className="text-lg font-black text-white tracking-tighter leading-none uppercase">
            Izi Mobilidade
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-yellow-500 mt-0.5">
            {safeTransitData.type === 'mototaxi' ? "MotoTáxi Izi" : "Motorista Particular"}
          </p>
        </div>
      </header>

      {/* ── MAPA FUNDO (Full Screen Oculto Atrás do Sheet) ── */}
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
      </div>


      {/* ── BOTTOM SHEET REAL (DRAGÁVEL) ── */}
      <IziBottomSheet snapPoints={["40vh", "65vh", "90vh"]} initialSnap={1}>
        <div className="w-full flex flex-col">
          <div className="p-6 pb-40 space-y-8 bg-[#09090b] rounded-t-3xl min-h-screen">
            <AnimatePresence mode="wait">

              {/* Resumo e pagamento (Passo Único) */}
              <motion.section
                key="step-summary"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div
                  className="rounded-[44px] p-8 space-y-8 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(145deg, #1c1c1e, #121214)",
                    boxShadow: "25px 25px 50px rgba(0,0,0,0.6), inset 4px 4px 10px rgba(255,255,255,0.05)",
                  }}
                >
                  <div className="absolute top-0 right-0 w-1/2 h-full bg-yellow-500/[0.02] blur-3xl rounded-full -mr-16" />
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-4">
                      <div
                        className="size-14 rounded-2xl flex items-center justify-center"
                        style={{
                          background: "rgba(250,204,21,0.12)",
                          boxShadow: "inset 2px 2px 6px rgba(0,0,0,0.4), 0 10px 20px rgba(250,204,21,0.2)",
                        }}
                      >
                        <Icon name="payments" size={28} className="text-yellow-500" />
                      </div>
                      <div>
                        <span className="text-white font-black text-sm uppercase block leading-none mb-1.5 tracking-tighter">Custo da Viagem</span>
                        <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Rota otimizada</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-yellow-500 text-4xl font-black tracking-tighter drop-shadow-lg">
                        R$ {totalValue.toFixed(2).replace('.', ',')}
                      </span>
                    </div>
                  </div>

                  <div className="h-px bg-white/5 relative z-10" />

                  <div className="space-y-5 relative z-10">
                    <div className="flex justify-between items-center px-2">
                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Forma de Pagamento</span>
                       <motion.button
                         whileTap={{ scale: 0.95 }}
                         onClick={() => navigateSubView("mobility_payment")}
                         className="flex items-center gap-3 px-5 py-2.5 rounded-2xl border border-white/10"
                         style={{
                           background: "rgba(0,0,0,0.4)",
                           boxShadow: "6px 6px 15px rgba(0,0,0,0.4), inset 1px 1px 3px rgba(255,255,255,0.05)",
                         }}
                       >
                         <Icon name={paymentMethod === 'saldo' ? 'account_balance_wallet' : paymentMethod === 'pix' ? 'pix' : paymentMethod === 'cartao' ? 'credit_card' : 'payments'} size={16} className="text-yellow-500" />
                         <span className="text-white font-black text-[11px] uppercase tracking-tighter">
                           {paymentMethod === 'saldo' ? 'Izi Pay (Saldo)' : paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão via App' : 'Pagar no Destino'}
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
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                        <span className="text-zinc-500">Distância Total:</span>
                        <span className="text-white bg-zinc-800 px-3 py-1 rounded-full border border-white/5">{routeDistance}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                        <span className="text-zinc-500">Tempo estimado:</span>
                        <span className="text-emerald-400">Rápido ⚡</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.section>
            </AnimatePresence>
          </div>

          {/* ── BOTÃO FIXO (Dentro do Sheet, mas ancorado no Bottom com Shadow) ── */}
          <div className="fixed bottom-0 left-0 right-0 p-8 pb-10 bg-gradient-to-t from-black via-black/95 to-transparent pointer-events-none z-[130]">
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
                  background: "linear-gradient(145deg, #facc15, #eab308)",
                  boxShadow: "0 20px 50px rgba(250,204,21,0.25), inset 6px 6px 12px rgba(255,255,255,0.6), inset -6px -6px 12px rgba(0,0,0,0.15)",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
                
                <span className="relative z-10 text-black font-black text-xl tracking-tighter uppercase drop-shadow-sm">
                  Confirmar Viagem
                </span>
                <div className="relative z-10 size-10 rounded-2xl bg-black/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300 shadow-inner">
                  <Icon
                    name="two_wheeler"
                    className="text-black font-black"
                    size={24}
                  />
                </div>
              </motion.button>
            </div>
          </div>
        </div>
      </IziBottomSheet>
    </div>
  );
};
