import React, { useMemo, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { IziTrackingMap } from "../Map/IziTrackingMap";

interface LogisticsTrackingViewProps {
  order: any;
  driverLocation: { lat: number; lng: number } | null;
  userLocation: { lat: number; lng: number } | null;
  onBack: () => void;
  onContactDriver: () => void;
  onCancel: () => void;
}

const STATUS_TIMELINE = [
  { key: "waiting_driver",    label: "Aguardando Motorista",  icon: "search",         color: "blue"    },
  { key: "aceito",            label: "Motorista Alocado",     icon: "check_circle",   color: "cyan"    },
  { key: "a_caminho",         label: "A Caminho da Coleta",   icon: "directions_car", color: "yellow"  },
  { key: "chegou",            label: "No Local de Coleta",    icon: "location_home",  color: "orange"  },
  { key: "in_transit",        label: "Em Trânsito",           icon: "route",          color: "purple"  },
  { key: "concluido",         label: "Entregue com Sucesso",  icon: "check_circle",   color: "emerald" },
];

const CANCELLED_STATUSES = ["cancelado", "recusado"];

const STATUS_ORDER_MAP: Record<string, number> = {
  novo: 0, searching_driver: 0, waiting_driver: 0, waiting_merchant: 0, pendente_pagamento: 0,
  aceito: 1, confirmante: 1, atribuido: 1,
  a_caminho_coleta: 2, saiu_para_coleta: 2,
  chegou_coleta: 3, chegou: 3, no_local_coleta: 3,
  picked_up: 4, in_transit: 4, a_caminho: 4, em_rota: 4, saiu_para_entrega: 4, no_local: 4,
  concluido: 5, entregue: 5, finalizado: 5, delivered: 5
};

const COLOR_MAP: Record<string, Record<"text" | "bg" | "border", string>> = {
  blue:    { text: "text-blue-400",    bg: "bg-blue-400",    border: "border-blue-400"    },
  cyan:    { text: "text-cyan-400",    bg: "bg-cyan-400",    border: "border-cyan-400"    },
  yellow:  { text: "text-yellow-400",  bg: "bg-yellow-400",  border: "border-yellow-400"  },
  orange:  { text: "text-orange-400",  bg: "bg-orange-400",  border: "border-orange-400"  },
  purple:  { text: "text-purple-400",  bg: "bg-purple-400",  border: "border-purple-400"  },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-500" },
};

/** Calcula rota via Google Maps Directions API e retorna array de LatLng para o mapa */
async function calcRoutePath(
  origin: string | google.maps.LatLng,
  destination: string | google.maps.LatLng
): Promise<google.maps.LatLng[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps) { resolve([]); return; }
    const svc = new window.google.maps.DirectionsService();
    svc.route(
      { origin, destination, travelMode: window.google.maps.TravelMode.DRIVING },
      (result, status) => {
        if (status === "OK" && result?.routes?.[0]?.overview_path?.length) {
          // overview_path é array de LatLng — sem encoding, sem decoding, sem bugs
          resolve(result.routes[0].overview_path);
        } else {
          resolve([]);
        }
      }
    );
  });
}

export const LogisticsTrackingView: React.FC<LogisticsTrackingViewProps> = ({
  order,
  driverLocation,
  userLocation,
  onBack,
  onContactDriver,
  onCancel,
}) => {
  // Sempre calcula via DirectionsService (array LatLng) — evita problemas de encoding
  const [routePath, setRoutePath] = useState<any[]>([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const isCancelled = CANCELLED_STATUSES.includes(order?.status);
  const isFinished  = order?.status === "concluido";
  const isFreight   = ["frete", "logistica", "van"].includes(order?.service_type);
  const currentStepIndex = isCancelled ? -1 : (STATUS_ORDER_MAP[order?.status] ?? 0);
  const currentStatus    = STATUS_TIMELINE[currentStepIndex];

  /** Extrai origens/destinos limpas do pedido e calcula rota via DirectionsService */
  const calcRoute = useCallback(async () => {
    if (routePath.length > 0) return;

    // --- ORIGEM: pickup_address pode ser objeto JSON ou string ---
    let origin: google.maps.LatLng | string | null = null;
    const rawOrigin = order?.pickup_address;

    if (rawOrigin) {
      if (typeof rawOrigin === "object" && rawOrigin.lat && rawOrigin.lng) {
        // Objeto direto com lat/lng
        origin = new window.google.maps.LatLng(Number(rawOrigin.lat), Number(rawOrigin.lng));
      } else if (typeof rawOrigin === "string") {
        // Pode ser JSON serializado: {"formatted_address":"...","lat":...,"lng":...}
        try {
          const parsed = JSON.parse(rawOrigin);
          if (parsed.lat && parsed.lng) {
            origin = new window.google.maps.LatLng(Number(parsed.lat), Number(parsed.lng));
          } else if (parsed.formatted_address) {
            origin = parsed.formatted_address;
          } else if (parsed.address) {
            origin = parsed.address;
          }
        } catch {
          // String simples de endereço — remover sufixo | OBS se existir
          origin = rawOrigin.split(" | OBS:")[0].split(" | FRETE:")[0].trim();
        }
      }
    }

    // --- DESTINO: delivery_address geralmente tem sufixo "| OBS: ..." ---
    let destination: string | null = null;
    const rawDest = order?.delivery_address;

    if (rawDest) {
      if (typeof rawDest === "object") {
        destination = rawDest.formatted_address || rawDest.address || "";
      } else if (typeof rawDest === "string") {
        // Remove o sufixo de observações que não é parte do endereço
        destination = rawDest
          .split(" | OBS:")[0]
          .split(" | FRETE:")[0]
          .split(" | EXCURSÃO:")[0]
          .split(" | ENVIO:")[0]
          .split(" | VIAGEM:")[0]
          .trim();
        // Tenta parsear como JSON também
        try {
          const parsed = JSON.parse(rawDest);
          destination = parsed.formatted_address || parsed.address || destination;
        } catch { /* string simples — usar como está */ }
      }
    }

    if (!origin || !destination || destination.includes("[object Object]")) {
      console.warn("[LOGISTICS MAP] Endereços inválidos ou corrompidos:", { origin, destination });
      return;
    }

    console.log("[LOGISTICS MAP] Calculando rota:", { origin, destination });
    setRouteLoading(true);
    try {
      const path = await calcRoutePath(origin as any, destination);
      if (path.length > 0) setRoutePath(path);
      else console.warn("[LOGISTICS MAP] Directions retornou 0 pontos");
    } finally {
      setRouteLoading(false);
    }
  }, [order?.pickup_address, order?.delivery_address, routePath.length]);


  useEffect(() => {
    // Aguardar Google Maps carregado antes de calcular
    if (window.google?.maps) {
      calcRoute();
    } else {
      const interval = setInterval(() => {
        if (window.google?.maps) { clearInterval(interval); calcRoute(); }
      }, 500);
      return () => clearInterval(interval);
    }
  }, [calcRoute]);

  /** Ponto de origem do pedido: usa localizações do order se disponíveis */
  const originLoc = useMemo<{ lat: number; lng: number } | null>(() => {
    if (order?.pickup_lat && order?.pickup_lng)
      return { lat: Number(order.pickup_lat), lng: Number(order.pickup_lng) };
    // fallback: usa userLocation do device
    return userLocation;
  }, [order?.pickup_lat, order?.pickup_lng, userLocation]);

  const getColorClass = (color: string, type: "text" | "bg" | "border") =>
    COLOR_MAP[color]?.[type] ?? "";

  return (
    <div className="absolute inset-0 z-[150] bg-zinc-950 text-white flex flex-col overflow-hidden italic">

      {/* HEADER SOBRE O MAPA */}
      <header className="absolute top-10 left-0 right-0 z-20 px-6 pointer-events-none">
        <div className="flex items-center justify-between w-full pointer-events-auto">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onBack}
            className="size-12 rounded-full bg-black/70 backdrop-blur-2xl border border-white/10 flex items-center justify-center text-white shadow-2xl"
          >
            <Icon name="close" size={22} />
          </motion.button>

          <div className="clay-card-dark bg-black/70 backdrop-blur-2xl px-5 py-3 rounded-full border border-white/5 flex items-center gap-3 shadow-lg">
            {!isCancelled && !isFinished && (
              <span className="size-2 rounded-full bg-yellow-400 animate-pulse" />
            )}
            {isCancelled  && <Icon name="cancel"       size={14} className="text-rose-500"    />}
            {isFinished   && <Icon name="check_circle" size={14} className="text-emerald-500" />}
            <span className="text-[11px] font-black uppercase tracking-widest">
              {isCancelled  ? "Cancelado"
               : isFinished ? "Entregue!"
               : currentStatus?.label ?? "Processando..."}
            </span>
          </div>
        </div>
      </header>

      {/* MAPA — mostra rota mesmo sem motorista */}
      <section className="relative h-[50vh] shrink-0 overflow-hidden bg-zinc-900">
        {routeLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="size-10 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin" />
              <span className="text-[10px] font-black text-yellow-400/60 uppercase tracking-widest">
                Calculando Rota...
              </span>
            </div>
          </div>
        )}

        <IziTrackingMap
          routePolyline={routePath as any}
          driverLoc={driverLocation}
          userLoc={originLoc}
          vehicleIcon={order?.service_type === "van" ? "airport_shuttle" : "local_shipping"}
          originLabel="COLETA"
          boxed={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent pointer-events-none" />

        {/* Badge "Sem rota" se não carregou ainda */}
        {routePath.length === 0 && !routeLoading && (
          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-full border border-white/10 flex items-center gap-2 z-10">
            <Icon name="route" size={14} className="text-yellow-400/60" />
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              Aguardando GPS da rota
            </span>
          </div>
        )}
      </section>

      {/* PAINEL INFERIOR */}
      <main className="flex-1 bg-zinc-950 -mt-8 relative z-30 rounded-t-[40px] border-t border-white/5 overflow-y-auto no-scrollbar pt-8 px-6 pb-12">
        <div className="w-10 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

        <AnimatePresence mode="wait">

          {/* CANCELADO */}
          {isCancelled && (
            <motion.div
              key="cancelled"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center gap-6 py-8"
            >
              <div className="size-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Icon name="cancel" size={48} className="text-rose-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Serviço Cancelado</h3>
                <p className="text-sm text-zinc-400 font-bold max-w-xs">Este serviço foi cancelado. Se precisar, solicite um novo.</p>
              </div>
              <button
                onClick={onBack}
                className="w-full py-5 rounded-[28px] bg-zinc-900 border border-white/5 text-white font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
              >
                Voltar ao início
              </button>
            </motion.div>
          )}

          {/* ATIVO */}
          {!isCancelled && (
            <motion.div
              key="active"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* CARD DO MOTORISTA */}
              {order?.driver_name ? (
                <div className="clay-card-dark rounded-[30px] p-6 border border-white/5 flex items-center justify-between gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none" />
                  <div className="flex items-center gap-4">
                    <div className="size-16 rounded-full bg-zinc-800 border-2 border-yellow-400/20 overflow-hidden flex items-center justify-center shadow-inner shrink-0">
                      {order?.driver_avatar
                        ? <img src={order.driver_avatar} className="w-full h-full object-cover" alt="Driver" />
                        : <Icon name="person" size={30} className="text-zinc-500" />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-1">Motorista Parceiro</p>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">{order.driver_name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Icon name="star" size={12} className="text-yellow-400" />
                        <span className="text-[11px] font-bold text-zinc-400">4.9 • {order?.driver_vehicle_plate || "—"}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={onContactDriver}
                    className="size-14 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center active:scale-90 transition-all shrink-0"
                  >
                    <Icon name="chat_bubble" size={22} className="text-yellow-400" />
                  </button>
                </div>
              ) : (
                <div className="clay-card-dark rounded-[30px] p-7 border border-white/5 flex items-center gap-5">
                  <div className="size-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <div className="size-7 rounded-full border-2 border-blue-400/30 border-t-blue-400 animate-spin" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight mb-1">Buscando o Melhor Parceiro</p>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Seu pedido está na fila de atribuição — a rota já está traçada no mapa
                    </p>
                  </div>
                </div>
              )}

              {/* TIMELINE */}
              <div className="clay-card-dark rounded-[30px] p-6 border border-white/5 space-y-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-5 px-2">Progresso do Serviço</h4>
                {STATUS_TIMELINE.map((step, idx) => {
                  const done   = idx < currentStepIndex;
                  const active = idx === currentStepIndex;
                  const isLast = idx === STATUS_TIMELINE.length - 1;

                  return (
                    <div key={step.key} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <motion.div
                          animate={active ? { scale: [1, 1.15, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className={`size-9 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-500
                            ${done
                              ? "bg-emerald-500 border-emerald-500 shadow-[0_0_12px_rgba(34,197,94,0.4)]"
                              : active
                              ? `${getColorClass(step.color, "bg")} ${getColorClass(step.color, "border")}`
                              : "bg-zinc-900 border-zinc-800"}`}
                        >
                          <span className={`material-symbols-rounded text-base font-black ${done || active ? "text-black" : "text-zinc-700"}`}>
                            {done ? "check" : step.icon}
                          </span>
                        </motion.div>
                        {!isLast && (
                          <div className={`w-0.5 flex-1 min-h-[24px] my-1 rounded-full transition-all duration-700 ${done ? "bg-emerald-500/40" : "bg-zinc-800"}`} />
                        )}
                      </div>
                      <div className={`pb-5 flex-1 flex flex-col justify-center ${isLast ? "pb-0" : ""}`}>
                        <span className={`text-[12px] font-black uppercase tracking-tight transition-colors duration-500
                          ${done ? "text-emerald-500" : active ? "text-white" : "text-zinc-700"}`}>
                          {step.label}
                        </span>
                        {active && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className={`text-[9px] font-black uppercase tracking-widest mt-1 ${getColorClass(step.color, "text")}`}
                          >
                            Em andamento...
                          </motion.span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* RESUMO DO TRAJETO */}
              <div className="clay-card-dark rounded-[30px] p-6 border border-white/5 space-y-5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 px-1">Resumo da Logística</h4>

                <div className="space-y-4 relative">
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-white/5 rounded-full" />

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="size-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center shrink-0">
                      <Icon name="package_2" size={16} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">Coleta</p>
                      <p className="text-xs font-black text-white uppercase truncate">
                        {typeof order?.pickup_address === "string"
                          ? order.pickup_address
                          : order?.pickup_address?.address || "Não informado"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 relative z-10">
                    <div className="size-10 rounded-xl bg-zinc-900 border border-yellow-400/20 flex items-center justify-center shrink-0">
                      <Icon name="flag" size={16} className="text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-0.5">Entrega</p>
                      <p className="text-xs font-black text-white uppercase truncate">
                        {typeof order?.delivery_address === "string"
                          ? order.delivery_address
                          : order?.delivery_address?.address || "Não informado"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                <div className="flex items-center justify-between px-1">
                  <div>
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Serviço</p>
                    <p className="text-sm font-black text-white uppercase">
                      {order?.service_type === "van" ? "Van de Carga" : isFreight ? "Frete IZI" : "Logística"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest mb-1">Total</p>
                    <p className="text-xl font-black text-yellow-400">
                      R$ {Number(order?.total_price || 0).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              </div>

              {/* CANCELAR */}
              {["novo","searching_driver","waiting_driver","waiting_merchant","pendente_pagamento"].includes(order?.status) && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={onCancel}
                  className="w-full py-5 rounded-[28px] border border-rose-500/20 text-rose-400 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-500/5 active:scale-95 transition-all"
                >
                  Cancelar Solicitação
                </motion.button>
              )}

              {/* CONCLUÍDO */}
              {isFinished && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={onBack}
                  className="w-full py-5 rounded-[28px] bg-emerald-500 text-black font-black text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(34,197,94,0.25)] active:scale-95 transition-all"
                >
                  ✓ Serviço Concluído!
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
