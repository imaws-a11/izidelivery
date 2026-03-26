import React from 'react';
import { motion } from 'framer-motion';

interface CardPaymentViewProps {
  cart: any[];
  appliedCoupon: any;
  savedCards: any[];
  cardInput: any;
  setCardInput: (i: any) => void;
  confirmCard: boolean;
  setConfirmCard: (c: boolean) => void;
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  setTab: (tab: string) => void;
  setCart: (cart: any[]) => void;
  setAppliedCoupon: (c: any) => void;
}

export const CardPaymentView: React.FC<CardPaymentViewProps> = ({
  cart,
  appliedCoupon,
  savedCards,
  cardInput,
  setCardInput,
  confirmCard,
  setConfirmCard,
  setSubView,
  navigateSubView,
  setTab,
  setCart,
  setAppliedCoupon
}) => {
  const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
  const discount = appliedCoupon ? (appliedCoupon.discount_type === "fixed" ? appliedCoupon.discount_value : (subtotal * appliedCoupon.discount_value) / 100) : 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
      <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
        <button onClick={() => setSubView("checkout")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
        </button>
        <h1 className="text-lg font-black text-white uppercase tracking-tight">Cartão Salvo</h1>
      </header>
      <main className="px-5 pt-8 flex flex-col items-center gap-8 max-w-sm mx-auto w-full">
        <div className="text-center">
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total a pagar</p>
          <p className="text-4xl font-black text-white" style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}>
            R$ {total.toFixed(2).replace(".", ",")}
          </p>
        </div>

        {savedCards.length > 0 ? (
          <div className="w-full flex flex-col gap-4">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-1">Escolha um cartão</p>
            {savedCards.map((card) => (
              <button key={card.id} onClick={() => setCardInput({ ...card })}
                className={`w-full p-5 rounded-3xl border flex items-center gap-4 transition-all ${cardInput?.id === card.id ? "bg-zinc-900 border-yellow-400" : "bg-zinc-900/50 border-zinc-900 hover:border-zinc-800"}`}>
                <div className="size-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-500">credit_card</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-black text-white uppercase tracking-tighter">{card.brand} •••• {card.last4}</p>
                  <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">Vence em {card.expiry}</p>
                </div>
                {cardInput?.id === card.id && <div className="size-5 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="material-symbols-outlined text-black font-black text-xs">check</span>
                </div>}
              </button>
            ))}
          </div>
        ) : (
          <div className="w-full py-10 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-5xl text-zinc-900">no_accounts</span>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Nenhum cartão salvo</p>
            <button onClick={() => setSubView("payments")} className="text-yellow-400 text-xs font-black uppercase tracking-widest">Adicionar agora</button>
          </div>
        )}

        {cardInput?.id && !confirmCard && (
          <button onClick={() => setConfirmCard(true)}
            className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Confirmar Pagamento
          </button>
        )}

        {confirmCard && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-6 py-6 text-center">
            <div className="size-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-4xl text-emerald-400">task_alt</span>
            </div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Pedido Confirmado!</h3>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed px-4">Utilizando seu cartão {cardInput.brand} finalizado em {cardInput.last4}.</p>
            <button onClick={() => { setTab("orders"); setSubView("none"); setCart([]); setAppliedCoupon(null); setConfirmCard(false); setCardInput(null); }}
              className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest">
              Acompanhar Pedido
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
};
