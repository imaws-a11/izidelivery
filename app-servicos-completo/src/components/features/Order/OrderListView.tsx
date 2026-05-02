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
    return parsed.formatted_address || parsed.address || cleanStr;
  } catch {
    return cleanStr;
  }
};

interface OrderListViewProps {
  myOrders: any[];
  setSelectedItem: (item: any) => void;
  setSubView: (view: string) => void;
  navigateSubView: (view: string) => void;
  userId: string | null;
  fetchMyOrders: (uid: string) => void;
  onOpenCoinTracking?: (order: any) => void;
}

export const OrderListView: React.FC<OrderListViewProps> = ({
  myOrders,
  setSelectedItem,
  navigateSubView,
  userId,
  fetchMyOrders,
  onOpenCoinTracking,
}) => {
  const [filterTab, setFilterTab] = useState("ativos");

  const safeOrders = Array.isArray(myOrders) ? myOrders : [];
  const activeOrders = safeOrders.filter((o) => o?.status && !["concluido", "cancelado"].includes(o.status));
  const scheduledOrders = safeOrders.filter((o) => o?.scheduled_at && o?.status && !["concluido", "cancelado"].includes(o.status));
  const pastOrders = safeOrders.filter((o) => o?.status && ["concluido", "cancelado"].includes(o.status));

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
    waiting_merchant: "Aguardando Loja",
    concluido: "Concluído",
    cancelado: "Cancelado",
  };

  const isMobility = (o: any) => ["mototaxi", "carro", "van", "utilitario", "frete", "logistica", "package"].includes(o.service_type);

  const getServicePresentation = (o: any) => {
    const type = o.service_type;
    if (['mototaxi', 'carro', 'van'].includes(type)) {
      return { 
        label: type === 'mototaxi' ? 'Mobilidade' : 'Carro',
        icon: type === 'mototaxi' ? 'two_wheeler' : 'directions_car',
        color: 'text-blue-500',
        name: o.merchant_name || (type === 'mototaxi' ? 'Izi Moto' : 'Izi Car'),
      };
    }
    if (type === 'utilitario' || type === 'package' || type === 'frete' || type === 'logistica') {
      return { 
        label: 'Izi Envios',
        icon: 'local_shipping',
        color: 'text-purple-500',
        name: o.merchant_name || 'Entrega de Objeto',
      };
    }
    if (type === 'coin_purchase') {
      return {
        label: 'Financeiro',
        icon: 'payments',
        color: 'text-emerald-500',
        name: 'Compra de IZI Coins',
      };
    }
    const categoryLabels: Record<string, string> = {
      restaurant: 'Alimentação',
      market: 'Mercado',
      pharmacy: 'Farmácia',
      beverages: 'Bebidas',
      petshop: 'Pet Shop',
      bakery: 'Padaria',
      gas: 'Gás & Água',
    };

    return { 
      label: categoryLabels[type] || 'Alimentação',
      icon: 'restaurant',
      color: 'text-yellow-600',
      name: o.merchant_name || categoryLabels[type] || 'Pedido',
    };
  };

  const renderOrderCard = (order: any) => {
    const presentation = getServicePresentation(order);
    const isCoin = order.service_type === "coin_purchase";
    const isMobilityOrder = isMobility(order);

    return (
      <motion.div
        key={order.id}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          setSelectedItem(order);
          const isHistory = ["concluido", "cancelado"].includes(order.status);
          if (isCoin) {
            if (onOpenCoinTracking) onOpenCoinTracking(order);
            else navigateSubView("izi_coin_tracking");
          } else if (isHistory) {
            navigateSubView("order_detail");
          } else if (isMobilityOrder || !!order.scheduled_at) {
            navigateSubView("logistics_tracking");
          } else {
            navigateSubView("active_order");
          }
        }}
        className="bg-white rounded-2xl border border-zinc-100 p-5 space-y-4 shadow-sm"
      >
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                 <span className={`material-symbols-rounded text-xl ${presentation.color}`}>{presentation.icon}</span>
              </div>
              <div>
                 <h4 className="font-black text-zinc-900 text-sm leading-none truncate uppercase">{presentation.name}</h4>
                 <p className="text-[10px] font-bold text-zinc-400 mt-1 uppercase">{statusLabel[order.status] || order.status}</p>
              </div>
           </div>
           <span className="material-symbols-rounded text-zinc-300">chevron_right</span>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-zinc-50">
           <div className="size-1.5 rounded-full bg-zinc-200" />
           <p className="text-[11px] font-medium text-zinc-500 truncate">
              {isMobilityOrder ? parseAddressText(order.pickup_address) : order.items ? `${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}` : 'Detalhes do pedido'}
           </p>
        </div>

        {(['pendente_pagamento', 'pendente', 'novo'].includes(order.status) && order.payment_status !== 'paid') && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedItem(order);
              const method = order.payment_method;
              if (method === 'pix') navigateSubView('pix_payment');
              else if (method === 'lightning') navigateSubView('lightning_payment');
              else navigateSubView('checkout');
            }}
            className="w-full py-4 bg-yellow-400 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-200 flex items-center justify-center gap-2 mt-3 active:scale-95 transition-all"
          >
            <span className="material-symbols-rounded text-base">payments</span>
            Voltar ao Pagamento
          </button>
        )}
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F7F7] text-zinc-900 pb-32 overflow-y-auto no-scrollbar">
      <header className="bg-white px-6 pt-12 pb-6 border-b border-zinc-100 sticky top-0 z-50">
         <h1 className="text-xl font-black tracking-tight">Pedidos</h1>
      </header>

      <main className="px-5 pt-6 pb-10 space-y-6">
        {/* TABS */}
        <nav className="flex items-center gap-6 bg-white p-2 rounded-2xl border border-zinc-100">
          {[
            { id: "ativos", label: "Ativos" },
            { id: "historico", label: "Anteriores" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilterTab(t.id)}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterTab === t.id ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-100' : 'text-zinc-400'}`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="space-y-4">
           {filterTab === "ativos" ? (
             activeOrders.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <span className="material-symbols-rounded text-6xl text-zinc-200 mb-4">shopping_bag</span>
                  <p className="text-zinc-400 font-bold text-sm">Nenhum pedido ativo</p>
               </div>
             ) : (
               activeOrders.map(order => renderOrderCard(order))
             )
           ) : (
             pastOrders.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <span className="material-symbols-rounded text-6xl text-zinc-200 mb-4">history</span>
                  <p className="text-zinc-400 font-bold text-sm">Histórico vazio</p>
               </div>
             ) : (
               pastOrders.map(order => renderOrderCard(order))
             )
           )}
        </div>

        {/* BOTTOM HINT */}
        <div className="pt-8 flex flex-col items-center text-center">
          <p className="text-zinc-400 text-[11px] font-bold">
            Não vê um pedido?{" "}
            <button
              onClick={() => userId && fetchMyOrders(userId)}
              className="text-yellow-600"
            >
              Atualizar lista
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};
