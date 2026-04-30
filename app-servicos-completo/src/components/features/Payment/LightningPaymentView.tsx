import React from "react";
import { useApp } from "../../../hooks/useApp";
import { supabase } from "../../../lib/supabase";
import { toastSuccess, toastError } from "../../common/Toast";

export const LightningPaymentView: React.FC = () => {
  const {
    selectedItem,
    setSelectedItem,
    paymentsOrigin,
    setSubView,
    setTab,
    appSettings,
    lightningData, // Assumindo que estará no useApp
  } = useApp();

  const invoice = selectedItem?.lightningInvoice || selectedItem?.lightning_invoice || lightningData?.payment_request || "";
  
  const btcPrice = Number(
    selectedItem?.btcPrice || 
    selectedItem?.btc_price_brl || 
    lightningData?.btcPrice || 
    lightningData?.btc_price_brl || 
    appSettings?.lastBtcPrice || 
    500000 
  );
  
  const satoshisRaw = Number(selectedItem?.satoshis || selectedItem?.amount_sats || lightningData?.satoshis || 0);
  let amountBrl = Number(selectedItem?.total_price || selectedItem?.amount_brl || 0);
  
  let finalSatoshis = satoshisRaw;

  if (finalSatoshis <= 0 && amountBrl > 0 && btcPrice > 0) {
    finalSatoshis = Math.floor((amountBrl / btcPrice) * 100_000_000);
  }
  
  if (amountBrl <= 0 && finalSatoshis > 0 && btcPrice > 0) {
    amountBrl = (finalSatoshis * btcPrice) / 100_000_000;
  }

  const handleCancel = async () => {
    if (!selectedItem?.id) return;
    if (window.confirm("Deseja realmente cancelar esta solicitação de recarga?")) {
      try {
        const { data: orderData } = await supabase.from("orders_delivery").select("status").eq("id", selectedItem.id).single();
        if (orderData && ["novo", "pendente", "pendente_pagamento"].includes(orderData.status)) {
           await supabase.from("orders_delivery").delete().eq("id", selectedItem.id);
        } else {
           await supabase.from("orders_delivery").update({ status: "cancelado" }).eq("id", selectedItem.id);
        }
        toastSuccess("Pedido cancelado.");
        setSubView("none");
        setSelectedItem(null);
      } catch (e) {
        toastError("Erro ao cancelar.");
      }
    }
  };

  return (
    <div className="absolute inset-0 z-[200] bg-black text-zinc-100 flex flex-col overflow-hidden pb-10">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-lg flex items-center gap-4 px-5 py-6 border-b border-white/5">
        <button 
          onClick={() => {
            if (selectedItem?.service_type === 'coin_purchase' || paymentsOrigin === "profile") {
              setTab("home");
              setSubView("none");
            } else {
              setSubView("checkout");
            }
          }} 
          className="size-11 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
        </button>
        <div className="flex-1">
          <h2 className="text-xl font-black tracking-tight leading-none mb-1">Bitcoin Lightning</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">Pagamento Instantâneo</p>
        </div>
        <div className="size-11 rounded-2xl bg-yellow-400/5 border border-yellow-400/10 flex items-center justify-center">
           <span className="material-symbols-outlined text-yellow-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-4">
        <div className="mb-6 relative">
           <div className="absolute -inset-6 bg-yellow-400/10 blur-[40px] rounded-full animate-pulse" />
           <div className="relative group p-3 border-2 border-dashed border-yellow-400/30 rounded-[35px] bg-zinc-950/50">
             <div className="bg-white p-5 rounded-[28px] shadow-2xl transition-all duration-700">
              <img
                src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(invoice)}
                alt="Lightning QR"
                className="size-[200px] rounded-xl"
              />
             </div>
           </div>
        </div>

        <div className="space-y-1 mb-6 w-full max-w-xs">
          <h3 className="text-2xl font-black text-white tracking-tighter flex flex-col items-center justify-center gap-1">
            <span className="tabular-nums">{(finalSatoshis / 100_000_000).toFixed(8)}</span>
            <span className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em]">Bitcoin (BTC)</span>
          </h3>
          {amountBrl > 0 && (
            <p className="text-zinc-400 text-xs font-bold">
              ≈ R$ {amountBrl.toFixed(2).replace(".", ",")}
            </p>
          )}
        </div>

        <div className="w-full space-y-3 max-w-xs">
           <button 
             onClick={() => {
               navigator.clipboard.writeText(invoice);
               toastSuccess("Fatura copiada!");
             }}
             className="w-full h-14 rounded-[20px] bg-white text-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-white/5"
           >
             <span className="material-symbols-outlined text-lg">content_copy</span>
             Copiar Invoice
           </button>
           
           <button 
             onClick={() => {
               window.open(`lightning:${invoice}`);
             }}
             className="w-full h-14 rounded-[20px] bg-zinc-900 border border-white/10 text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
             <span className="material-symbols-outlined text-lg">open_in_new</span>
             Abrir na Carteira
           </button>

           <button 
             onClick={handleCancel}
             className="w-full h-14 rounded-[20px] bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all"
           >
             <span className="material-symbols-outlined text-lg">close</span>
             Cancelar Pagamento
           </button>
           
           <div className="pt-4 flex flex-col items-center gap-3">
              <div className="flex items-center gap-3">
                 <div className="size-1.5 bg-yellow-400 rounded-full animate-ping" />
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Aguardando pagamento...</p>
              </div>
              <p className="text-[9px] text-zinc-600 max-w-[180px] leading-relaxed font-medium">Não feche esta tela até que o pagamento seja detectado automaticamente.</p>
           </div>
        </div>
      </main>
    </div>
  );
};
