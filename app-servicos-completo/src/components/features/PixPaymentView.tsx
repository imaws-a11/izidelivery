import React from 'react';
import { motion } from 'framer-motion';

interface PixPaymentViewProps {
  cart: any[];
  appliedCoupon: any;
  pixCpf: string;
  setPixCpf: (cpf: string) => void;
  pixConfirmed: boolean;
  setPixConfirmed: (c: boolean) => void;
  selectedShop: any;
  userId: string | null;
  userLocation: any;
  userName: string;
  userEmail: string;
  email: string;
  auth: any;
  selectedItem: any;
  setSelectedItem: (item: any) => void;
  setCart: (cart: any[]) => void;
  setAppliedCoupon: (c: any) => void;
  setCouponInput: (i: string) => void;
  setUserXP: (xp: any) => void;
  setSubView: (view: any) => void;
  setTab: (tab: string) => void;
  navigateSubView: (view: any) => void;
  toastSuccess: (msg: string) => void;
  supabase: any;
}

export const PixPaymentView: React.FC<PixPaymentViewProps> = ({
  cart,
  appliedCoupon,
  pixCpf,
  setPixCpf,
  pixConfirmed,
  setPixConfirmed,
  selectedShop,
  userId,
  userLocation,
  userName,
  userEmail,
  email,
  auth,
  selectedItem,
  setSelectedItem,
  setCart,
  setAppliedCoupon,
  setCouponInput,
  setUserXP,
  setSubView,
  setTab,
  navigateSubView,
  toastSuccess,
  supabase
}) => {
  const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
  const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
  const cartTotal = Math.max(0, subtotal - discount);
  const total = (pixConfirmed && selectedItem?.total_price) ? Number(selectedItem.total_price) : cartTotal;

  const formatCpf = (v: string) => v.replace(/\D/g,"").slice(0,11)
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d)/,"$1.$2")
    .replace(/(\d{3})(\d{1,2})$/,"$1-$2");

  const handlePixConfirm = async () => {
    if (pixCpf.replace(/\D/g,"").length < 11) { alert("CPF inválido."); return; }
    setPixConfirmed(true);
    try {
      if (!selectedShop?.id) { alert("Erro: Estabelecimento não selecionado."); setPixConfirmed(false); return; }

      const { data: order, error: orderErr } = await supabase
        .from("orders_delivery")
        .insert({
          user_id: userId,
          merchant_id: selectedShop.id,
          status: "pendente_pagamento",
          total_price: Number(total.toFixed(2)),
          pickup_address: selectedShop.name || "Endereço do Estabelecimento",
          delivery_address: `${userLocation?.address || "Endereço não informado"} | ITENS: ${cart.map(i => `${i.name}`).join(', ')}`,
          payment_method: "pix",
          service_type: selectedShop.type || "restaurant",
        })
        .select()
        .single();

      if (orderErr || !order) {
        console.error("Erro ao criar pedido:", orderErr);
        alert("Não foi possível registrar o pedido no banco de dados. Verifique sua conexão. Detalhe: " + (orderErr?.message || "Erro desconhecido"));
        navigateSubView("payment_error");
        return;
      }

      const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
        body: {
          amount: Number(total.toFixed(2)),
          orderId: order.id,
          payment_method_id: 'pix',
          email: userEmail || auth.currentUser?.email || email || "cliente@izidelivery.com",
          customer: {
            cpf: pixCpf.replace(/\D/g,""),
            name: userName || "Cliente IziDelivery",
          },
        },
      });

      if (fnErr || !(fnData?.qrCode || fnData?.qr_code)) {
        console.error("Erro MP PIX:", fnErr, fnData);
        const detail = fnData?.details || fnData?.error || fnErr?.message || "Erro desconhecido na API do Mercado Pago.";
        alert("Erro ao gerar PIX: " + detail + "\n\nVerifique as chaves MP_ACCESS_TOKEN no Supabase.");
        
        setSelectedItem({ ...order, pixError: true, pixErrorMessage: detail });
        setPixConfirmed(true);
        return;
      }

      const qr = fnData.qrCode || fnData.qr_code;
      const qrBase64 = fnData.qrCodeBase64 || fnData.qr_code_base64;
      const copyPaste = fnData.copyPaste || fnData.copy_paste;

      setSelectedItem({ ...order, pixQrCode: qr, pixQrBase64: qrBase64, pixCopyPaste: copyPaste });
      setCart([]);
      setAppliedCoupon(null);
      setCouponInput("");
      setUserXP((prev: number) => prev + 50);

    } catch (e) {
      console.error("Erro PIX:", e);
      navigateSubView("payment_error");
    }
  };

  const pixReady = selectedItem?.pixQrCode && pixConfirmed;

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
      <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
        <button onClick={() => { setSubView("checkout"); setPixConfirmed(false); setPixCpf(""); }}
          className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
        </button>
        <h1 className="text-lg font-black text-white uppercase tracking-tight">Pagamento PIX</h1>
      </header>

      <main className="px-5 pt-8 flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
        <div className="text-center">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total a pagar</p>
          <p className="text-4xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}>
            R$ {total.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {!pixConfirmed && (
          <div className="w-full space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 block">CPF do Pagador</label>
            <input
              type="text"
              inputMode="numeric"
              value={pixCpf}
              onChange={(e) => setPixCpf(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl py-4 px-5 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-yellow-400/30 text-sm font-medium tracking-widest"
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

        {pixConfirmed && !pixReady && (
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
              ) : selectedItem?.pixQrCode ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedItem.pixQrCode)}`} 
                  className="w-full h-full" 
                  alt="QR PIX Fallback" 
                />
              ) : (
                <span className="material-symbols-outlined text-[120px] text-zinc-800">qr_code_2</span>
              )}
            </div>
            <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
              <p className="text-zinc-400 text-xs font-mono truncate flex-1">{selectedItem?.pixCopyPaste?.slice(0, 40)}...</p>
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
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:border-yellow-400/30 hover:text-yellow-400 transition-all active:scale-95">
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
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Ops! Falha no QR Code</h3>
                <p className="text-zinc-400 text-sm font-medium leading-relaxed px-4">
                   O pedido foi enviado ao lojista, mas não conseguimos gerar o QR Code Pix agora. 
                   {selectedItem.pixErrorMessage ? ` Detalhe: ${selectedItem.pixErrorMessage}` : " Você pode tentar pagar através de outro método ou falar com o suporte."}
                </p>
             </div>
             <div className="w-full space-y-3">
                <button onClick={() => { setTab("orders"); setSubView("none"); setSelectedItem(null); }}
                  className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest">
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
