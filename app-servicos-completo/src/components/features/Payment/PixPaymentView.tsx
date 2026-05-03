import React from "react";
import { motion } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { useOrder } from "../../../hooks/useOrder";
import { supabase } from "../../../lib/supabase";
export const PixPaymentView: React.FC = () => {
  const {
    selectedItem,
    setSelectedItem,
    paymentsOrigin,
    userId,
    userName,
    userLocation,
    setSubView,
    setTab,
    pixCpf,
    setPixCpf,
    pixConfirmed,
    setPixConfirmed,
    globalSettings,
    isIziBlackMembership,
    toastSuccess,
    toastError,
  } = useApp();

  const { getCartSubtotal, cart, appliedCoupon, useCoins, iziCoins, setIziCoins, selectedShop } = useOrder();

  const subtotal = getCartSubtotal();
  const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
  const cartTotal = Math.max(0, subtotal - discount);
  const total = (selectedItem?.total_price) ? Number(selectedItem.total_price) : cartTotal;

  const formatCpf = (v: string) => v.replace(/\D/g,"").slice(0,11)
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

  const handlePixConfirm = async () => {
    if (pixCpf.replace(/\D/g,"").length < 11) { toastError("CPF inválido."); return; }
    setPixConfirmed(true);
    try {
      let orderId = selectedItem?.id;
      let orderRef = selectedItem;

      const isSubscription = paymentsOrigin === "izi_black";

      if (!orderId || orderId === "temp") {
        const orderPayload = {
            user_id: userId,
            merchant_id: isSubscription ? null : (selectedShop?.id || selectedItem?.merchant_id),
            status: "pendente_pagamento",
            total_price: Number(total.toFixed(2)),
            pickup_address: isSubscription ? "Assinatura Izi Black" : (selectedShop?.name || selectedItem?.pickup_address || "Endereço do Estabelecimento"),
            delivery_address: isSubscription ? "Serviço Digital" : (selectedItem?.delivery_address || `${userLocation.address || "Endereço não informado"}`),
            items: selectedItem?.items || cart,
            payment_method: "pix",
            service_type: isSubscription ? "subscription" : (selectedItem?.service_type || selectedShop?.type || "restaurant"),
            delivery_fee: selectedItem?.delivery_fee || 0,
            notes: selectedItem?.notes || "",
          };

        const { data: order, error: orderErr } = await supabase
          .from("orders_delivery")
          .insert(orderPayload)
          .select()
          .single();

        if (orderErr || !order) {
          toastError("Não foi possível registrar o pedido.");
          setPixConfirmed(false);
          return;
        }

        if (useCoins && iziCoins > 0) {
          const coinValue = globalSettings?.izi_coin_value || 1.0;
          const discountApplied = (iziCoins * coinValue);
          const subtotalForCoins = subtotal + (selectedItem?.delivery_fee || 0) + (isIziBlackMembership ? 0 : (subtotal * (globalSettings?.service_fee_percent || 0) / 100)) - discount;
          const coinsUsedAsDiscountValue = Math.min(discountApplied, subtotalForCoins);
          const coinsToDeduct = coinsUsedAsDiscountValue / coinValue;
          const newIziCoins = Number((iziCoins - coinsToDeduct).toFixed(8));
          
          await supabase.from("users_delivery").update({ izi_coins: newIziCoins }).eq("id", userId);
          setIziCoins(newIziCoins);
        }
        orderId = order.id;
        orderRef = order;
      } else {
        const { error: updateErr } = await supabase.from("orders_delivery").update({ 
          status: "pendente_pagamento", 
          payment_method: "pix",
          user_id: userId // Reforça para o RLS
        }).eq("id", orderId);

        if (updateErr) {
          console.error("[PIX] Erro ao atualizar ordem:", updateErr);
          toastError("Erro ao preparar o pagamento. Tente novamente.");
          setPixConfirmed(false);
          return;
        }
      }

      const cleanCpf = pixCpf.replace(/\D/g, "");
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
        body: {
          amount: Number(total.toFixed(2)),
          orderId: orderId,
          payment_method_id: 'pix',
          email: user?.email || "cliente@izidelivery.com",
          customer: {
            cpf: cleanCpf,
            name: userName || "Cliente IziDelivery",
          },
          description: selectedItem?.service_type === 'coin_purchase' ? `Compra de IZI COINS - R$ ${total.toFixed(2)}` : undefined
        },
      });

      if (fnErr || !(fnData?.qrCode || fnData?.qr_code)) {
        let detail = "Erro ao gerar os dados do QR Code.";
        const source = fnData || fnErr;
        if (source?.details?.cause?.[0]?.description) detail = source.details.cause[0].description;
        else if (source?.error) detail = source.error;
        
        setSelectedItem({ ...orderRef, pixError: true, pixErrorMessage: detail });
        setPixConfirmed(true);
        return;
      }

      const qr = fnData?.qrCode || fnData?.qr_code || fnData?.emv;
      const qrBase64 = fnData?.qrCodeBase64 || fnData?.qr_code_base64 || fnData?.image;
      const copyPaste = fnData?.copyPaste || fnData?.copy_paste || fnData?.ticket_url;

      setSelectedItem((prev: any) => ({ 
        ...(prev || {}), 
        id: orderId,
        pixQrCode: qr, 
        pixQrBase64: qrBase64, 
        pixCopyPaste: copyPaste || qr,
        pixError: false 
      }));

    } catch (e: any) {
      setSelectedItem((prev: any) => ({ ...prev, pixError: true, pixErrorMessage: e.message }));
      setPixConfirmed(true);
    }
  };

  const pixReady = !!(selectedItem?.pixQrCode || selectedItem?.pixQrBase64 || selectedItem?.pixCopyPaste) && pixConfirmed;

  return (
    <div className="absolute inset-0 z-40 bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-10">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex items-center gap-4 px-5 py-4 border-b border-zinc-100">
        <button onClick={() => { 
            if (selectedItem?.service_type === 'coin_purchase' || paymentsOrigin === "profile") {
              setTab("home");
              setSubView("none");
            } else {
              setSubView("checkout"); 
            }
            setPixConfirmed(false); 
            setPixCpf(""); 
          }}
          className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
        </button>
        <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Pagamento PIX</h1>
      </header>

      <main className="px-5 pt-8 flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
        <div className="text-center">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total a pagar</p>
          <p className="text-4xl font-black text-zinc-900">
            R$ {total.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {!pixConfirmed && (
          <div className="w-full space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CPF do Pagador</label>
            <input
              type="text"
              inputMode="numeric"
              value={pixCpf}
              onChange={(e) => setPixCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl py-4 px-5 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium tracking-widest"
            />
          </div>
        )}

        {pixCpf.replace(/\D/g,"").length === 11 && !pixConfirmed && (
          <button onClick={handlePixConfirm}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Gerar QR Code PIX
          </button>
        )}

        {pixConfirmed && !pixReady && !selectedItem?.pixError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-8">
            <div className="size-12 border-2 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm font-black uppercase tracking-wider">Gerando PIX...</p>
          </motion.div>
        )}

        {pixReady && !selectedItem?.pixError && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-5">
            <div className="w-52 h-52 bg-white rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(255,215,9,0.2)] p-3">
              {selectedItem?.pixQrBase64 ? (
                <img src={`data:image/png;base64,${selectedItem.pixQrBase64}`} className="w-full h-full" alt="QR PIX" />
              ) : (
                <span className="material-symbols-outlined text-[120px] text-zinc-800">qr_code_2</span>
              )}
            </div>
            <div className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl p-4 flex items-center justify-between gap-3">
              <p className="text-zinc-500 text-xs font-mono truncate flex-1">{selectedItem?.pixCopyPaste?.slice(0, 40)}...</p>
              <button
                onClick={() => { navigator.clipboard.writeText(selectedItem?.pixCopyPaste || ""); toastSuccess("PIX copiado!"); }}
                className="text-yellow-400 active:scale-90 transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">content_copy</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-yellow-400 rounded-full animate-pulse" />
              <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Aguardando pagamento...</p>
            </div>
            <button
              onClick={() => { setTab("orders"); setSubView("none"); setPixConfirmed(false); setPixCpf(""); setSelectedItem(null); }}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-100 text-zinc-400 hover:border-yellow-400 transition-all active:scale-95 shadow-sm bg-white">
              Ver Meus Pedidos
            </button>
          </motion.div>
        )}

        {pixConfirmed && selectedItem?.pixError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col items-center gap-6 py-6 text-center">
             <div className="size-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-rose-500">error</span>
             </div>
             <div>
                <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter mb-2">Ops! Falha no QR Code</h3>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed px-4">
                   O pedido foi enviado ao lojista, mas não conseguimos gerar o QR Code Pix agora. 
                   {selectedItem.pixErrorMessage ? ` Detalhe: ${selectedItem.pixErrorMessage}` : " Você pode tentar pagar através de outro método ou falar com o suporte."}
                </p>
             </div>
             <div className="w-full space-y-3">
                <button onClick={() => { setTab("orders"); setSubView("none"); setSelectedItem(null); }}
                  className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-black text-sm uppercase tracking-widest">
                  Acompanhar Pedido
                </button>
                <button onClick={() => { setSubView("checkout"); setPixConfirmed(false); }}
                  className="w-full py-4 rounded-2xl text-zinc-500 font-black text-[10px] uppercase tracking-widest">
                  Tentar outro método
                </button>
             </div>
          </motion.div>
        )}

        {!pixConfirmed && (
          <button onClick={() => setSubView("checkout")} className="text-zinc-600 text-sm font-black uppercase tracking-widest hover:text-zinc-400 transition-colors">
            Cancelar
          </button>
        )}
      </main>
    </div>
  );
};
