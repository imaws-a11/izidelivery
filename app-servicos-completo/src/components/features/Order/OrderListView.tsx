import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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

  const isMobility = (o: any) => ["mototaxi", "carro", "van", "utilitario"].includes(o.service_type);

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
                activeOrders.map((order) => (
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
                        {order.service_type === "coin_purchase"
                          ? "payments"
                          : isMobility(order)
                            ? order.service_type === "mototaxi"
                              ? "two_wheeler"
                              : "directions_car"
                            : "restaurant"}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black mb-1 block">
                            {statusLabel[order.status] || order.status}
                          </span>
                          <h3 className="font-extrabold text-xl text-white tracking-tight">
                            {order.service_type === "coin_purchase"
                              ? "Compra de IZI Coins"
                              : order.merchant_name ||
                                (isMobility(order)
                                  ? order.service_type === "mototaxi"
                                    ? "Izi Moto"
                                    : "Izi Car"
                                  : "Pedido")}
                          </h3>
                        </div>
                        <span className="text-yellow-400 text-[10px] font-black bg-yellow-400/10 px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                          {statusLabel[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm max-w-xs">
                        {order.service_type === "coin_purchase"
                          ? "Recarga Digital Instantânea"
                          : order.delivery_address || "Endereço de entrega"}
                      </p>
                      <div className="pt-3 flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedItem(order);
                            setSubView(order.service_type === "coin_purchase" ? "izi_coin_tracking" : "order_detail");
                          }}
                          className="bg-yellow-400 text-black font-black px-6 py-3 rounded-xl shadow-[0_0_20px_rgba(255,215,9,0.25)] hover:opacity-90 active:scale-95 transition-all text-xs uppercase tracking-wider"
                        >
                          Ver detalhes do pedido
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
                ))
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
                scheduledOrders.map((order) => (
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
                ))
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
                pastOrders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => {
                      setSelectedItem(order);
                      setSubView("order_detail");
                    }}
                    className="flex items-center gap-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 cursor-pointer active:scale-[0.98] transition-all hover:border-yellow-400/20 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0">
                      <span
                        className="material-symbols-outlined text-2xl text-zinc-500 group-hover:text-yellow-400 transition-colors"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {order.service_type === "coin_purchase"
                          ? "payments"
                          : isMobility(order)
                            ? order.service_type === "mototaxi"
                              ? "two_wheeler"
                              : "directions_car"
                            : "restaurant"}
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
                ))
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


