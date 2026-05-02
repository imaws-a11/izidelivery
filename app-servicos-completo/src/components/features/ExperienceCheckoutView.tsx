import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from "../../hooks/useApp";
import { supabase } from "../../lib/supabase";

interface ExperienceCheckoutViewProps {
  reservation: any;
  walletBalance: number;
  onBack: () => void;
  onPay: (method: string) => void;
}

export const ExperienceCheckoutView: React.FC<ExperienceCheckoutViewProps> = ({
  reservation,
  onBack,
}) => {
  const { 
    userId, 
    userName, 
    userLocation, 
    setSubView, 
    setSelectedItem, 
    navigateSubView, 
    toastError, 
    toastSuccess,
    iziCoins,
    globalSettings,
    walletBalance: actualWalletBalance
  } = useApp();

  const [selectedMethod, setSelectedMethod] = useState('izipay');
  const [isLoading, setIsLoading] = useState(false);

  const handlePay = async () => {
    if (!userId) return;
    setIsLoading(true);

    try {
      const total = reservation.totalPrice || 0;
      
      const orderBase = {
        user_id: userId,
        user_name: userName,
        status: "pendente_pagamento",
        payment_status: "pending",
        total_price: Number(total.toFixed(2)),
        delivery_fee: 0,
        service_fee: 0,
        items: [{
          id: reservation.id,
          name: reservation.title,
          price: reservation.price,
          quantity: 1,
          adults: reservation.adults,
          date: reservation.date,
          image: reservation.image
        }],
        pickup_address: reservation.location,
        delivery_address: userLocation?.address || "Reserva Online",
        payment_method: selectedMethod === 'izipay' ? 'saldo' : selectedMethod,
        service_type: reservation.category || "experience",
      };

      // 1. Criar o pedido no banco
      const { data: order, error: insertError } = await supabase
        .from("orders_delivery")
        .insert(orderBase)
        .select()
        .single();

      if (insertError) throw insertError;

      setSelectedItem(order);

      // 2. Redirecionar para o fluxo de pagamento real baseado no método
      if (selectedMethod === 'pix') {
        navigateSubView("pix_payment");
      } else if (selectedMethod === 'lightning') {
        // Para Lightning, precisamos gerar a invoice (similar ao handlePlaceOrder do App.tsx)
        const { data: lnData, error: lnErr } = await supabase.functions.invoke("create-lightning-invoice", {
          body: { amount: total, orderId: order.id, customerName: userName, memo: `Reserva #${order.id.slice(0,8).toUpperCase()}` }
        });

        if (lnErr || !lnData?.payment_request) throw new Error("Erro ao gerar fatura Bitcoin.");

        setSelectedItem({ ...order, lightningInvoice: lnData.payment_request, satoshis: lnData.satoshis });
        navigateSubView("lightning_payment");
      } else if (selectedMethod === 'izipay') {
        // Lógica de débito de saldo (simplificada aqui, mas seguindo o padrão)
        if (actualWalletBalance < total) {
           toastError("Saldo insuficiente na carteira IZI Pay.");
           setIsLoading(false);
           return;
        }

        const newBalance = actualWalletBalance - total;
        const { error: updateErr } = await supabase.from("users_delivery").update({ wallet_balance: newBalance }).eq("id", userId);
        if (updateErr) throw updateErr;

        await supabase.from("orders_delivery").update({ status: "confirmado", payment_status: "paid" }).eq("id", order.id);
        
        toastSuccess("Reserva confirmada com sucesso!");
        setSubView("none");
      } else {
        // Outros métodos (cartão, etc)
        navigateSubView("card_payment");
      }

    } catch (err: any) {
      console.error("Erro no checkout de experiência:", err);
      toastError("Falha ao processar reserva. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const paymentMethods = [
    { id: 'izipay', label: 'Saldo Izi Pay', icon: 'account_balance_wallet', detail: `Saldo: R$ ${actualWalletBalance.toFixed(2).replace('.', ',')}`, active: actualWalletBalance >= (reservation.totalPrice || 0) },
    { id: 'card', label: 'Cartão de Crédito', icon: 'credit_card', detail: 'Final **** 4590', active: true },
    { id: 'pix', label: 'PIX Imediato', icon: 'qr_code_2', detail: 'Aprovação instantânea', active: true },
    { id: 'lightning', label: 'Bitcoin Lightning', icon: 'bolt', detail: 'Pague com Satoshis', active: true },
  ];

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[190] bg-white flex flex-col overflow-hidden"
    >
      {/* HEADER PREMIUM CLEAN */}
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center gap-4 z-[200]">
        <button 
          onClick={onBack}
          className="size-12 rounded-2xl bg-white/80 backdrop-blur-md border border-zinc-100 flex items-center justify-center text-zinc-900 shadow-sm active:scale-90 transition-all"
        >
          <span className="material-symbols-rounded font-black">arrow_back_ios_new</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-24 pb-40">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-zinc-900 uppercase tracking-tighter">Pagamento</h1>
          <p className="text-[10px] text-yellow-600 font-bold uppercase tracking-widest mt-2">Finalize sua reserva online</p>
        </div>

        {/* RESUMO PREMIUM */}
        <section className="bg-zinc-50 border border-zinc-100 rounded-[48px] p-8 mb-10 shadow-sm">
          <div className="flex gap-6 mb-8">
            <img src={reservation.image} className="size-28 rounded-[32px] object-cover shadow-xl" alt="Thumb" />
            <div className="flex flex-col justify-center">
              <h3 className="text-2xl font-black text-zinc-900 uppercase tracking-tight leading-none mb-2">{reservation.title}</h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{reservation.location}</p>
              <div className="flex items-center gap-2 mt-4">
                <span className="text-[10px] font-black text-yellow-600 bg-white border border-yellow-200 px-4 py-1.5 rounded-xl uppercase tracking-widest">{reservation.adults} Pessoas</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4 pt-8 border-t border-zinc-200/50">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Total da Reserva</span>
              <span className="text-4xl font-black text-zinc-900 tracking-tighter">
                <span className="text-yellow-500 text-lg mr-1">R$</span>
                {(reservation.totalPrice || 0).toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>
        </section>

        {/* MÉTODOS */}
        <section className="space-y-4">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-4 mb-2">Selecione o método</p>
          {paymentMethods.map((m) => (
            <div 
              key={m.id}
              onClick={() => m.active && setSelectedMethod(m.id)}
              className={`flex items-center justify-between p-6 rounded-[32px] border transition-all cursor-pointer ${
                selectedMethod === m.id ? 'bg-zinc-900 border-transparent shadow-2xl' : 'bg-white border-zinc-100'
              } ${!m.active ? 'opacity-30 grayscale pointer-events-none' : ''}`}
            >
              <div className="flex items-center gap-5">
                <div className={`size-14 rounded-2xl flex items-center justify-center ${selectedMethod === m.id ? 'bg-white/10' : 'bg-zinc-50'}`}>
                  <span className={`material-symbols-rounded text-2xl ${selectedMethod === m.id ? 'text-yellow-400' : 'text-zinc-400'}`}>{m.icon}</span>
                </div>
                <div>
                  <p className={`text-base font-black uppercase tracking-tight ${selectedMethod === m.id ? 'text-white' : 'text-zinc-900'}`}>{m.label}</p>
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${selectedMethod === m.id ? 'text-zinc-400' : 'text-zinc-400'}`}>{m.detail}</p>
                </div>
              </div>
              {selectedMethod === m.id && (
                <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="material-symbols-rounded text-black text-lg">check</span>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>

      <footer className="p-8 bg-white border-t border-zinc-100 shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
        <button 
          onClick={handlePay}
          disabled={isLoading}
          className="w-full h-20 bg-yellow-400 text-black rounded-[32px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-yellow-400/20 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50"
        >
          {isLoading ? (
            <div className="size-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              Pagar e Confirmar
              <span className="material-symbols-rounded text-2xl">verified_user</span>
            </>
          )}
        </button>
      </footer>
    </motion.div>
  );
};
