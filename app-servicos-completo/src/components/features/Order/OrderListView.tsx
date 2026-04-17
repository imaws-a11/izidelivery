import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/** Extrai a parte em texto limpo de endereços salvos de forma corrompida ou serializada no DB */
const parseAddressText = (rawStr: any): string => {
  if (!rawStr) return "Endereço não disponível";
  if (typeof rawStr !== "string") {
    return rawStr.formatted_address || rawStr.address || "Localidade";
  }
  let cleanStr = rawStr.split(" | OBS:")[0].split(" | FRETE:")[0].split(" | ENVIO:")[0].split(" | EXCURSÃO:")[0].split(" | VIAGEM:")[0].trim();
  if (cleanStr.includes("[object Object]")) {
    return "Endereço processando...";
  }
  try {
    const parsed = JSON.parse(cleanStr);
    return (parsed.formatted_address || parsed.address || "Localidade").split(',')[0];
  } catch {
    return cleanStr.split(',')[0];
  }
};

interface OrderListViewProps {
  myOrders: any[];
  setSelectedItem: (item: any) => void;
  setSubView: (view: string) => void;
  userId: string | null;
  fetchMyOrders: (uid: string) => void;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  myOrders,
  setSelectedItem,
  setSubView,
  userId,
  fetchMyOrders,
}) => {
  const [filterTab, setFilterTab] = useState("ativos");

  const activeOrders = myOrders.filter((o) => o && !["concluido", "cancelado"].includes(o.status));
  const scheduledOrders = myOrders.filter((o) => o && o.scheduled_at && !["concluido", "cancelado"].includes(o.status));
  const pastOrders = myOrders.filter((o) => o && ["concluido", "cancelado"].includes(o.status));

  const statusLabel: Record<string, string> = {
    pending: "Aguardando",
    pendente: "Aguardando",
    pendente_pagamento: "Aguardando Pagamento",
    novo: "Processando",
    waiting_driver: "Aguardando Entregador",
    aceito: "Confirmado",
    confirmado: "Confirmado",
    preparando: "Em Preparação",
    no_preparo: "Em Preparação",
    pronto: "Pronto para Coleta",
    a_caminho: "Em Rota de Coleta",
    at_pickup: "No Local",
    picked_up: "Coletado / Em Viagem",
    em_rota: "A Caminho do Destino",
    saiu_para_entrega: "Saindo para Entrega",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const isMobility = (o: any) => ["mototaxi", "carro", "van", "utilitario", "frete", "logistica"].includes(o.service_type);

  const renderMobilityClayCard = (order: any, isHistory: boolean = false) => {
    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedItem(order);
          setSubView(["frete", "logistica", "van", "mototaxi", "carro"].includes(order.service_type) ? "logistics_tracking" : "order_detail");
        }}
        className={`relative overflow-hidden rounded-[36px] cursor-pointer group ${isHistory ? 'mb-4 scale-95 origin-left opacity-90' : 'mb-6'}`}
        style={{
          background: "linear-gradient(145deg, #1c1c1f, #141416)",
          boxShadow: isHistory ? "10px 10px 20px rgba(0,0,0,0.5)" : "18px 18px 40px rgba(0,0,0,0.6), -6px -6px 20px rgba(255,255,255,0.03), inset 1px 1px 0px rgba(255,255,255,0.06)",
          border: `1.5px solid rgba(250,204,21,${isHistory ? '0.05' : '0.18'})`
        }}
      >
        {/* Glow Blob */}
        {!isHistory && <div className="absolute -top-10 -right-10 w-48 h-48 bg-yellow-400/8 rounded-full blur-[60px] pointer-events-none group-hover:bg-yellow-400/14 transition-all duration-700" />}
        {!isHistory && <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-orange-500/6 rounded-full blur-[50px] pointer-events-none" />}

        <div className="relative z-10 px-6 pt-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`size-14 md:size-16 rounded-[20px] flex items-center justify-center shrink-0 relative`}
              style={{
                background: "linear-gradient(145deg, #2a2a2e, #202024)",
                boxShadow: "8px 8px 20px rgba(0,0,0,0.5), -3px -3px 10px rgba(255,255,255,0.04), inset 1px 1px 0px rgba(255,255,255,0.07)"
              }}
            >
              <span className={`material-symbols-rounded text-2xl md:text-3xl font-black ${isHistory ? 'text-zinc-500 group-hover:text-yellow-400 transition-colors' : 'text-yellow-400'}`}>
                {order.service_type === "van" ? "airport_shuttle" : order.service_type === "mototaxi" ? "two_wheeler" : order.service_type === "carro" ? "directions_car" : "local_shipping"}
              </span>
            </div>

            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-1">
                {isHistory ? "Fechado" : order.scheduled_at ? "Agendado" : "Serviço Ativo"}
              </p>
              <h4 className={`text-sm md:text-base font-black uppercase tracking-tight italic leading-tight ${isHistory ? 'text-zinc-300' : 'text-white'}`}>
                {order.service_type === "van" ? "Van de Carga" : order.service_type === "mototaxi" ? "Moto" : order.service_type === "carro" ? "Carro Particular" : "Izi Logistics"}
              </h4>
              <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isHistory ? 'text-zinc-600' : 'text-yellow-400'}`}>
                {order.service_type === "frete" || order.service_type === "logistica" ? "Frete & Mudanças" : "Transporte"}
              </p>
            </div>
          </div>

          <div
            className="px-3 py-1.5 md:py-2 rounded-2xl flex items-center gap-2"
            style={{
              background: isHistory ? "rgba(255,255,255,0.02)" : "linear-gradient(145deg, rgba(250,204,21,0.12), rgba(250,204,21,0.06))",
              boxShadow: isHistory ? "none" : "4px 4px 12px rgba(0,0,0,0.4), -2px -2px 6px rgba(255,255,255,0.03), inset 1px 1px 0 rgba(250,204,21,0.1)",
              border: isHistory ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(250,204,21,0.2)"
            }}
          >
            {!isHistory && <span className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />}
            <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === "cancelado" ? 'text-red-400' : order.status === "concluido" ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {statusLabel[order.status] || order.status}
            </span>
          </div>
        </div>

        <div className="relative z-10 px-6 py-4 flex gap-3">
          <div className="flex flex-col items-center pt-1 shrink-0">
            <div className={`size-1.5 md:size-2 rounded-full ${isHistory ? 'bg-zinc-700' : 'bg-white/40'}`} />
            <div className={`w-px flex-1 my-1.5 ${isHistory ? 'bg-zinc-800' : 'bg-white/10'}`} />
            <div className={`size-1.5 md:size-2 rounded-full ${isHistory ? 'bg-zinc-600' : 'bg-yellow-400'}`} />
          </div>
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <p className={`text-[10px] md:text-[11px] font-black uppercase truncate ${isHistory ? 'text-zinc-500' : 'text-zinc-300'}`}>
              {parseAddressText(order.pickup_address) || "Origem"}
            </p>
            <p className={`text-[10px] md:text-[11px] font-black uppercase truncate ${isHistory ? 'text-zinc-400' : 'text-yellow-400'}`}>
              {parseAddressText(order.delivery_address) || "Destino"}
            </p>
          </div>
          <div className="text-right shrink-0 flex flex-col justify-center">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-0.5">Total</p>
            <p className={`text-base md:text-lg font-black italic ${isHistory ? 'text-zinc-300' : 'text-white'}`}>R$ {Number(order.total_price || 0).toFixed(2).replace(".",",")}</p>
          </div>
        </div>

        <div className="relative z-10 px-6 pb-5 flex items-center justify-between">
          <p className="text-[9px] md:text-[10px] font-black uppercase text-zinc-600 tracking-widest">
             {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString("pt-BR") : new Date(order.created_at).toLocaleString("pt-BR")}
          </p>
          <div className={`${isHistory ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-yellow-400'} text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all`}>
             VER DETALHES <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 pb-32 overflow-y-auto no-scrollbar">
      <main className="px-5 pt-8 pb-10 max-w-2xl mx-auto w-full">
        {/* TABS */}
        <nav className="flex items-center gap-8 mb-10 overflow-x-auto no-scrollbar">
          {[
            { id: "ativos", label: "Ativos", count: activeOrders.length },
            { id: "agendados", label: "Agendados", count: scheduledOrders.length },
            { id: "historico", label: "Histórico", count: pastOrders.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              className="relative pb-2 group shrink-0"
            >
              <span
                className={`font-extrabold text-lg transition-colors ${
                  filterTab === t.id ? "text-white" : "text-zinc-500 group-hover:text-zinc-300"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className="ml-2 text-[10px] bg-yellow-400 text-black font-black px-1.5 py-0.5 rounded-full">
                    {t.count}
                  </span>
                )}
              </span>
              <div
                className={`absolute bottom-0 left-0 h-[2px] rounded-full transition-all duration-300 ${
                  filterTab === t.id ? "w-full bg-yellow-400" : "w-0 bg-zinc-700"
                }`}
              />
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          {/* ATIVOS */}
          {filterTab === "ativos" && (
            <motion.div
              key="ativos"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-14"
            >
              {activeOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-800">shopping_bag</span>
                  <p className="text-zinc-600 text-sm font-medium">Nenhum pedido ativo no momento</p>
                </div>
              ) : (
                activeOrders.map((order) => {
                  if (isMobility(order)) return renderMobilityClayCard(order, false);
                  
                  return (
                    <motion.article
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative flex flex-col md:flex-row items-start md:items-center gap-5"
                    >
                      <div className="relative w-28 h-28 shrink-0 bg-zinc-900/50 rounded-3xl flex items-center justify-center border border-zinc-800 overflow-hidden">
                        <div className="absolute inset-0 bg-zinc-900/60" />
                        <span
                          className="material-symbols-outlined absolute text-5xl text-yellow-400"
                          style={{
                            filter: "drop-shadow(0 0 15px rgba(255,215,9,0.5))",
                            fontVariationSettings: "'FILL' 1",
                          }}
                        >
                          {order.service_type === "coin_purchase" ? "payments" : "restaurant"}
                        </span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-1 block">
                              {statusLabel[order.status] || order.status}
                            </span>
                            <h3 className="font-extrabold text-xl text-white tracking-tight">
                              {order.service_type === "coin_purchase" ? "Compra de IZI Coins" : order.merchant_name || "Pedido"}
                            </h3>
                          </div>
                          <span className="text-yellow-400 text-[10px] font-black bg-yellow-400/10 px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                            {statusLabel[order.status] || order.status}
                          </span>
                        </div>
                        <p className="text-zinc-400 text-sm max-w-xs">
                          {order.service_type === "coin_purchase"
                            ? "Recarga Digital Instantânea"
                            : parseAddressText(order.delivery_address || order.pickup_address)}
                        </p>
                        <div className="pt-3 flex items-center gap-3">
                          <button
                            onClick={() => {
                              setSelectedItem(order);
                              setSubView(order.service_type === "coin_purchase" ? "izi_coin_tracking" : "order_detail");
                            }}
                            className="bg-yellow-400 text-black font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(255,215,9,0.25)] hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider"
                          >
                            Ver detalhes
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(order);
                              setSubView("order_chat");
                            }}
                            className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors active:scale-95"
                          >
                            <span className="material-symbols-outlined">chat_bubble</span>
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  )
                })
              )}
            </motion.div>
          )}

          {/* AGENDADOS */}
          {filterTab === "agendados" && (
            <motion.div
              key="agendados"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-14"
            >
              {scheduledOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-800">event</span>
                  <p className="text-zinc-600 text-sm font-medium">Nenhum pedido agendado</p>
                </div>
              ) : (
                scheduledOrders.map((order) => {
                  if (isMobility(order)) return renderMobilityClayCard(order, false);
                  return (
                    <motion.article
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative flex flex-col md:flex-row items-start md:items-center gap-5"
                    >
                      <div className="relative w-28 h-28 shrink-0 bg-zinc-900/50 rounded-3xl flex items-center justify-center border border-zinc-800">
                        <span
                          className="material-symbols-outlined text-5xl text-yellow-400"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          event
                        </span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black block">
                          Agendado
                        </span>
                        <h3 className="font-extrabold text-xl text-white">{order.merchant_name || "Pedido Agendado"}</h3>
                        <p className="text-zinc-400 text-sm">
                          {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString("pt-BR") : ""}
                        </p>
                      </div>
                    </motion.article>
                  )
                })
              )}
            </motion.div>
          )}

          {/* HISTÓRICO */}
          {filterTab === "historico" && (
            <motion.div
              key="historico"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {pastOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <span className="material-symbols-outlined text-5xl text-zinc-800">history</span>
                  <p className="text-zinc-600 text-sm font-medium">Nenhum pedido no histórico</p>
                </div>
              ) : (
                pastOrders.map((order) => {
                  if (isMobility(order)) return renderMobilityClayCard(order, true);
                  
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => {
                        setSelectedItem(order);
                        setSubView("order_detail");
                      }}
                      className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-yellow-400/20 group mb-3"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0">
                        <span
                          className="material-symbols-outlined text-2xl text-zinc-500 group-hover:text-yellow-400 transition-colors"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {order.service_type === "coin_purchase" ? "payments" : "restaurant"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-sm text-white truncate">
                          {order.service_type === "coin_purchase" ? "Recarga IZI Coins" : order.merchant_name || "Pedido"}
                        </h4>
                        <p className="text-zinc-500 text-xs mt-0.5">
                          {new Date(order.created_at).toLocaleDateString("pt-BR")} • R$ {Number(order.total_price || 0).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${order.status === "concluido" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}
                      >
                        {statusLabel[order.status] || order.status}
                      </span>
                    </motion.div>
                  )
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM HINT */}
        <div className="mt-20 pt-8 border-t border-zinc-900 flex flex-col items-center text-center">
          <span className="material-symbols-outlined text-zinc-800 text-4xl mb-3">shopping_bag</span>
          <p className="text-zinc-600 text-sm font-medium">
            Não vê um pedido?{" "}
            <button
              onClick={() => userId && fetchMyOrders(userId)}
              className="text-yellow-400/60 hover:text-yellow-400 transition-colors"
            >
              Atualizar lista
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};


