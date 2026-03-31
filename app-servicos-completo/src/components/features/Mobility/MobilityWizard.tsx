import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AddressSearchInput } from "../Address/AddressSearchInput";

interface MobilityWizardProps {
  transitData: any;
  setTransitData: React.Dispatch<React.SetStateAction<any>>;
  mobilityStep: number;
  setMobilityStep: (step: number) => void;
  routePolyline: string;
  driverLocation: any;
  userLocation: any;
  updateLocation: () => void;
  setSubView: (view: any) => void;
  distancePrices: any;
  activeCard: any;
  walletBalance: number;
  handleConfirmMobility: (paymentMethod: string) => Promise<void>;
  Icon: React.FC<{ name: string; className?: string }>;
  IziTrackingMap: React.FC<any>;
}

export const MobilityWizard: React.FC<MobilityWizardProps> = ({
  transitData,
  setTransitData,
  mobilityStep,
  setMobilityStep,
  routePolyline,
  driverLocation,
  userLocation,
  updateLocation,
  setSubView,
  distancePrices,
  activeCard,
  walletBalance,
  handleConfirmMobility,
  Icon,
  IziTrackingMap,
}) => {
  const isTaxiOrMoto = transitData.type === "mototaxi" || transitData.type === "carro";
  const isFreightOrVan = transitData.type === "frete" || transitData.type === "van" || transitData.type === "utilitario";

  // Step 1: Destination Selection
  const renderStep1 = () => (
    <motion.section initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white tracking-tight">Qual o seu destino?</h3>
        <p className="text-zinc-500 text-xs font-medium">Confirme os pontos de partida e chegada.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest ml-1">Origem</p>
            <button
              onClick={() => updateLocation()}
              disabled={userLocation.loading}
              className="text-[8px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/5 px-2 py-1 rounded-lg disabled:opacity-50"
            >
              {userLocation.loading ? "Buscando..." : "Meu Local"}
            </button>
          </div>
          <AddressSearchInput
            initialValue={transitData.origin}
            placeholder="De onde você está saindo?"
            className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
            userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
            onSelect={(p: any) => {
              const ori = p.formatted_address || "";
              setTransitData((prev: any) => ({ ...prev, origin: ori }));
            }}
          />
        </div>

        <div className="bg-zinc-900/60 p-5 rounded-[30px] border border-white/5">
          <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-2 ml-1">Destino</p>
          <AddressSearchInput
            initialValue={transitData.destination}
            placeholder="Para onde vamos?"
            className="w-full bg-transparent border-none p-0 text-base font-bold text-white focus:ring-0"
            userCoords={userLocation.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
            onSelect={(p: any) => {
              const dest = p.formatted_address || "";
              setTransitData((prev: any) => ({ ...prev, destination: dest }));
            }}
          />
        </div>

        {/* TRANSIT TYPE SELECTION */}
        <AnimatePresence>
          {transitData.destination && transitData.origin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2 overflow-hidden"
            >
              <div className="flex items-center gap-3 px-2">
                <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em]">Tipo de Transporte</h4>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <div className="grid grid-cols-2 gap-3 pb-2">
                {[
                  { id: "mototaxi", label: "MotoTáxi", icon: "motorcycle", color: "text-yellow-400", sub: "Rápido & Ágil" },
                  { id: "carro", label: "Carro", icon: "directions_car", color: "text-white", sub: "Executivo Premium" },
                ].map((v) => {
                  const isSelected = transitData.type === v.id;
                  const price = distancePrices[v.id] || 0;

                  return (
                    <button
                      key={v.id}
                      onClick={() => setTransitData((prev: any) => ({ ...prev, type: v.id as any, estPrice: price }))}
                      className={`p-5 rounded-[35px] transition-all duration-300 flex flex-col items-center gap-2 border relative group overflow-hidden ${isSelected ? "bg-yellow-400 border-yellow-400 shadow-[0_20px_40px_rgba(255,217,9,0.15)]" : "bg-zinc-900 border-white/5 hover:border-white/10"}`}
                    >
                      <div
                        className={`size-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? "bg-black/10 scale-110" : "bg-white/5 group-hover:bg-white/10"}`}
                      >
                        <span className={`material-symbols-outlined text-2xl ${isSelected ? "text-black" : v.color}`}>{v.icon}</span>
                      </div>
                      <div className="text-center z-10">
                        <p className={`text-[11px] font-black uppercase tracking-tighter ${isSelected ? "text-black" : "text-white"}`}>
                          {v.label}
                        </p>
                        <p className={`text-[8px] font-bold ${isSelected ? "text-black/60" : "text-zinc-500"}`}>R$ {price.toFixed(2)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ACTION BUTTON */}
      <div className="fixed bottom-10 left-0 w-full px-8 z-50">
        <button
          onClick={() => setSubView("mobility_payment")}
          disabled={!transitData.origin || !transitData.destination}
          className="w-full bg-yellow-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-black h-16 rounded-[24px] font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(255,217,9,0.2)] active:scale-95 transition-all flex items-center justify-center gap-3 group"
        >
          <span>Escolher Pagamento</span>
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
        </button>
      </div>
    </motion.section>
  );

  // Step 2: Payment & Confirmation
  const renderPaymentStep = () => {
    const price = transitData.estPrice || 0;

    const PaymentMethodButton = ({ id, icon, label, sub, colorClass, disabled = false }: any) => {
      const isSelected = transitData.paymentMethod === id;
      return (
        <button
          onClick={() => !disabled && setTransitData((prev: any) => ({ ...prev, paymentMethod: id }))}
          disabled={disabled}
          className={`w-full p-5 rounded-[30px] border transition-all flex items-center gap-5 group ${isSelected ? "bg-white border-white shadow-2xl" : "bg-zinc-900/40 border-white/5 hover:border-white/10"} ${disabled ? "opacity-30 grayscale cursor-not-allowed" : "active:scale-[0.98]"}`}
        >
          <div
            className={`size-12 rounded-2xl flex items-center justify-center transition-all ${isSelected ? "bg-black/5" : "bg-zinc-900 border border-white/5 group-hover:border-white/10"}`}
          >
            <span className={`material-symbols-outlined text-2xl ${isSelected ? "text-black" : colorClass}`}>{icon}</span>
          </div>
          <div className="flex-1 text-left">
            <h4 className={`text-sm font-black uppercase tracking-tight leading-none mb-1 ${isSelected ? "text-black" : "text-white"}`}>
              {label}
            </h4>
            <p className={`text-[10px] font-bold ${isSelected ? "text-black/50" : "text-zinc-500"}`}>{sub}</p>
          </div>
          {isSelected && (
            <div className="size-6 rounded-full bg-black flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-sm font-bold">check</span>
            </div>
          )}
        </button>
      );
    };

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full bg-zinc-950 overflow-y-auto no-scrollbar">
        <header className="relative z-50 flex items-center gap-6 px-6 pt-12 mb-10">
          <button
            onClick={() => setSubView("taxi_wizard")}
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white active:scale-90 transition-all shadow-xl"
          >
            <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
          </button>
          <div className="flex flex-col text-left">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none italic uppercase">Confirmar</h2>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-1.5 opacity-80">Check-out Premium</p>
          </div>
        </header>

        <div className="flex-1 px-5 py-6 space-y-10 pb-48">
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">Resumo do Serviço</h3>
              <div className="px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/20">
                <span className="text-xs font-black text-yellow-400 italic">R$ {price.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>

            <div className="bg-zinc-900/30 backdrop-blur-xl rounded-[40px] p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 size-32 bg-yellow-400/5 blur-[60px] rounded-full -mr-16 -mt-16 pointer-events-none" />
              <div className="flex items-center gap-4 mb-8">
                <div className="size-14 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/20">
                  <span className="material-symbols-outlined text-yellow-400 text-2xl">
                    {transitData.type === "mototaxi"
                      ? "motorcycle"
                      : transitData.type === "carro"
                        ? "directions_car"
                        : transitData.type === "van"
                          ? "airport_shuttle"
                          : "local_shipping"}
                  </span>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none">
                    {transitData.type === "mototaxi"
                      ? "MotoTáxi"
                      : transitData.type === "carro"
                        ? "Particular"
                        : transitData.type === "van"
                          ? "Van & Grupos"
                          : "Frete & Mudança"}
                  </h4>
                  <p className="text-[9px] font-black text-yellow-400/60 uppercase tracking-[0.2em] mt-1">
                    {transitData.vehicleCategory || "Serviço sob demanda"}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-5 text-left">
                  <div className="size-2 rounded-full bg-yellow-400 shrink-0 mt-1.5 shadow-[0_0_10px_rgba(255,217,9,1)]" />
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Origem</p>
                    <p className="text-sm font-bold text-zinc-300 leading-relaxed line-clamp-2">{transitData.origin}</p>
                  </div>
                </div>
                <div className="h-4 w-px bg-zinc-800 ml-1" />
                <div className="flex items-start gap-5 text-left">
                  <div className="size-2 rounded-full bg-zinc-700 shrink-0 mt-1.5" />
                  <div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 leading-none">Destino</p>
                    <p className="text-sm font-bold text-zinc-400 leading-relaxed line-clamp-2">
                      {transitData.destination || "Aguardando destino..."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
              <span>Selecione o Pagamento</span>
              <div className="h-px flex-1 bg-white/5" />
            </h3>

            <div className="grid grid-cols-1 gap-3">
              <PaymentMethodButton
                id="cartao"
                icon="credit_card"
                label="Cartão via App"
                sub={activeCard ? `${activeCard.brand} \u2022\u2022\u2022\u2022 ${activeCard.last4}` : "Pague com segurança pelo App"}
                colorClass="text-blue-400"
              />
              <PaymentMethodButton id="pix" icon="pix" label="PIX Instantâneo" sub="Aprovação imediata via QR Code" colorClass="text-emerald-400" />
              <PaymentMethodButton
                id="bitcoin_lightning"
                icon="bolt"
                label="Bitcoin Lightning"
                sub="Pagamento instantâneo em Satoshis"
                colorClass="text-orange-400"
              />
              <PaymentMethodButton
                id="saldo"
                icon="account_balance_wallet"
                label="Saldo IZI Wallet"
                sub={`R$ ${walletBalance.toFixed(2).replace(".", ",")} disponível`}
                colorClass="text-cyan-400"
                disabled={walletBalance < price}
              />
              <PaymentMethodButton
                id="cartao_entrega"
                icon="contactless"
                label="Cartão na Entrega"
                sub="Pague com maquininha ao motorista"
                colorClass="text-zinc-500"
              />
              <PaymentMethodButton
                id="dinheiro"
                icon="payments"
                label="Dinheiro em Espécie"
                sub="Pague diretamente ao prestador"
                colorClass="text-zinc-600"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="fixed bottom-0 left-0 w-full p-8 pt-10 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent z-[100]">
          <button
            onClick={() => handleConfirmMobility(transitData.paymentMethod)}
            disabled={!transitData.paymentMethod}
            className="w-full h-20 bg-yellow-400 text-black rounded-[30px] font-black uppercase tracking-[0.3em] text-sm shadow-[0_20px_50px_rgba(255,217,9,0.3)] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-4 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-20deg]" />
            <span className="relative z-10">Confirmar Solicitação</span>
            <span className="material-symbols-outlined relative z-10 group-hover:translate-x-1 transition-transform">bolt</span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="absolute inset-0 z-[120] bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* MAPA NO FUNDO (apenas no Step 1) */}
      {mobilityStep === 1 && (
        <div className="absolute inset-0 z-0 h-[45vh]">
          <IziTrackingMap
            routePolyline={routePolyline}
            driverLoc={driverLocation}
            userLoc={userLocation?.lat ? { lat: userLocation.lat, lng: userLocation.lng } : null}
            onMyLocationClick={updateLocation}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-zinc-950 pointer-events-none" />
        </div>
      )}

      {mobilityStep === 1 ? (
        <>
          <header className="relative z-50 flex items-center justify-between px-6 pt-10">
            <button
              onClick={() => setSubView("none")}
              className="size-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-yellow-400"
            >
              <Icon name="arrow_back" />
            </button>
            <div className="text-right">
              <h2 className="text-2xl font-black text-white tracking-tighter leading-none mb-1">
                {transitData.type === "mototaxi" ? "MotoTáxi" : "Motorista Particular"}
              </h2>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Viagem Rápida & Segura</p>
            </div>
          </header>

          <main className="relative z-40 mt-auto bg-zinc-950 border-t border-white/5 flex flex-col h-[60vh] rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.8)]">
            <div className="p-8 pb-32 overflow-y-auto no-scrollbar flex-1 space-y-10">{renderStep1()}</div>
          </main>
        </>
      ) : (
        renderPaymentStep()
      )}
    </div>
  );
};
