import React from "react";
import { useApp } from "../../../hooks/useApp";
import { useOrder } from "../../../hooks/useOrder";
import { supabase } from "../../../lib/supabase";
import { MercadoPagoCardForm } from "../../MercadoPagoCardForm";

export const CardPaymentView: React.FC = () => {
  const {
    selectedItem,
    setSelectedItem,
    paymentsOrigin,
    userId,
    userLocation,
    setSubView,
    setTab,
    setIsLoading,
    appSettings,
    setIsIziBlackMembership,
    toastSuccess,
    toastError,
    user,
  } = useApp();

  const { getCartSubtotal, cart, clearCart, selectedShop } = useOrder();

  const isCoinPurchase = selectedItem?.service_type === 'coin_purchase';
  const isSubscription = paymentsOrigin === "izi_black";
  
  let total = 0;
  if (isCoinPurchase || isSubscription) {
    total = selectedItem?.total_price || 0;
  } else {
    const subtotal = getCartSubtotal();
    total = subtotal; // Simples por enquanto, CheckoutView lida com descontos
  }

  const handleConfirmCard = async (token: string, issuer: string, installments: number, brand: string, _last4: string, cpf: string) => {
      setIsLoading(true);
      try {
          let orderId = selectedItem?.id;
          const userEmail = user?.email || "cliente@izidelivery.com";

          if (!isCoinPurchase) {
            const orderBase = {
                user_id: userId,
                merchant_id: isSubscription ? null : (selectedShop?.id || null),
                total_price: total,
                status: "pendente_pagamento",
                pickup_address: isSubscription ? "Assinatura Izi Black" : (selectedShop?.store_address || selectedShop?.address || selectedShop?.name || "Estabelecimento"),
                delivery_address: isSubscription ? "Serviço Digital" : (userLocation.address || "Endereço não informado"),
                items: cart,
                payment_method: "cartao",
                service_type: isSubscription ? "subscription" : "restaurant",
            };

            const { data: order, error: insertError } = await supabase.from("orders_delivery").insert(orderBase).select().single();
            if (insertError || !order) { 
              toastError("Erro ao criar pedido."); 
              return; 
            }
            orderId = order.id;
          } else {
            await supabase.from("orders_delivery").update({ status: "pendente_pagamento" }).eq("id", orderId);
          }

          console.log("[CARD] Processando pagamento MP para pedido:", orderId);
          const { data: fnData, error: fnErr } = await supabase.functions.invoke("process-mp-payment", {
              body: {
                  amount: Number(total.toFixed(2)),
                  orderId: orderId,
                  payment_method_id: brand.toLowerCase().includes('master') ? 'master' : brand.toLowerCase().replace(/\s/g, ''),
                  token: token,
                  email: userEmail,
                  installments: installments || 1,
                  issuer_id: issuer,
                  customer: {
                    cpf: cpf
                  },
                  metadata: {
                    type: isSubscription ? 'subscription' : (isCoinPurchase ? 'wallet_recharge' : 'order'),
                    user_id: userId
                  }
              },
          });

          if (fnErr) {
            console.error("[CARD ERROR] Supabase invoke error:", fnErr);
            throw fnErr;
          }

          console.log("[CARD] Resposta MP:", fnData);

          const isSuccess = fnData && (fnData.status === 'approved' || fnData.status === 'authorized');

          if (!isSuccess) {
              const mpMsg = fnData?.details || fnData?.error || "Pagamento recusado pela operadora.";
              toastError(`Pagamento não aprovado: ${mpMsg}`);
              return;
          }

          if (isSubscription) {
              await supabase.from('users_delivery').update({ is_izi_black: true }).eq('id', userId);
              setIsIziBlackMembership(true);
              setSubView("izi_black_purchase");
          } else if (isCoinPurchase) {
              setSubView("izi_coin_tracking");
          } else {
              const { data: updatedOrder } = await supabase.from("orders_delivery").select().eq("id", orderId).single();
              setSelectedItem(updatedOrder || { id: orderId });
              await clearCart(orderId);
              setTab("orders");
              setSubView("none");
          }
          toastSuccess(isSubscription ? "Assinatura IZI Black ativada!" : "Pedido aprovado!");

      } catch (err: any) {
          console.error("[CARD] Erro crítico:", err);
          toastError("Falha ao processar pagamento. Verifique sua conexão ou dados do cartão.");
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#F7F7F7] text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md flex items-center gap-4 px-5 py-6 border-b border-zinc-100">
        <button onClick={() => {
            if (isCoinPurchase) {
              setTab("home");
              setSubView("none");
            } else if (isSubscription) {
              setSubView("izi_black_purchase");
            } else {
              setSubView("checkout");
            }
          }}
          className="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center active:scale-90 transition-all shadow-sm">
          <span className="material-symbols-outlined text-zinc-900">arrow_back_ios_new</span>
        </button>
        <div className="flex flex-col text-left">
            <h1 className="text-lg font-black text-zinc-900 uppercase tracking-tighter leading-none">Pagamento</h1>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-1">{selectedShop?.name || 'Venda Digital'}</p>
        </div>
      </header>

      <main className="px-5 pt-10 max-w-sm mx-auto w-full space-y-10">
        <div className="text-center">
          <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest mb-1">Total a Pagar</p>
          <p className="text-5xl font-black text-zinc-900 tracking-tighter">R$ {total.toFixed(2).replace(".", ",")}</p>
        </div>

        <div className="bg-white border border-zinc-100 p-6 rounded-[40px] shadow-2xl shadow-zinc-200">
            <MercadoPagoCardForm onConfirm={handleConfirmCard} publicKey={appSettings?.mercadopago_public_key} total={total} />
        </div>
        
        <div className="flex flex-col items-center gap-4 py-4">
           <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-zinc-400 text-sm">enhanced_encryption</span>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Certificado pela PCI DSS</p>
           </div>
           <p className="text-[10px] text-center text-zinc-300 uppercase tracking-widest font-bold max-w-[200px] leading-relaxed">
             Seus dados são encriptados de ponta a ponta e nunca armazenados em nossos servidores.
           </p>
        </div>
      </main>
    </div>
  );
};
