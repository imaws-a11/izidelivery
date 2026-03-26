import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutViewProps {
  cart: any[];
  appliedCoupon: any;
  walletTransactions: any[];
  savedCards: any[];
  userId: string | null;
  userLocation: { address: string };
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  changeFor: string;
  setChangeFor: (val: string) => void;
  selectedCard: any;
  setSelectedCard: (card: any) => void;
  couponInput: string;
  setCouponInput: (val: string) => void;
  handleApplyCoupon: (code: string) => void;
  setAppliedCoupon: (coupon: any) => void;
  handlePlaceOrder: () => void;
  setPaymentsOrigin: (origin: string) => void;
  setSubView: (view: string) => void;
}

const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  appliedCoupon,
  walletTransactions,
  savedCards,
  userId,
  userLocation,
  paymentMethod,
  setPaymentMethod,
  changeFor,
  setChangeFor,
  selectedCard,
  setSelectedCard,
  couponInput,
  setCouponInput,
  handleApplyCoupon,
  setAppliedCoupon,
  handlePlaceOrder,
  setPaymentsOrigin,
  setSubView,
}) => {
  const subtotal = cart.reduce((a: number, b: any) => a + (b.price || 0), 0);
  const discount = appliedCoupon
    ? appliedCoupon.discount_type === "fixed"
      ? appliedCoupon.discount_value
      : (subtotal * appliedCoupon.discount_value) / 100
    : 0;
  const total = Math.max(0, subtotal + 0 - discount);
  const walletBal = walletTransactions.reduce(
    (acc: number, t: any) =>
      ["deposito", "reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount),
    0
  );

  const paymentOptions = [
    {
      id: "cartao",
      icon: "credit_card",
      label: "Cartão via App",
      sub:
        savedCards.length > 0
          ? `${savedCards[0].brand} •••• ${savedCards[0].last4}`
          : "Pagar agora pelo app",
    },
    { id: "pix", icon: "pix", label: "PIX", sub: "Mercado Pago • Aprovação imediata" },
    {
      id: "saldo",
      icon: "account_balance_wallet",
      label: "Saldo IZI",
      sub: `R$ ${walletBal.toFixed(2).replace(".", ",")} disponível`,
      disabled: walletBal < total,
    },
    { id: "dinheiro", icon: "payments", label: "Dinheiro na Entrega", sub: "Pague ao receber" },
    {
      id: "cartao_entrega",
      icon: "contactless",
      label: "Cartão na Entrega",
      sub: "Maquininha com o entregador",
    },
    {
      id: "bitcoin_lightning",
      icon: "bolt",
      label: "Bitcoin Lightning",
      sub: "Pagamento instantâneo em BTC",
    },
  ];

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-40">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSubView("cart")}
            className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="text-lg font-black text-white uppercase tracking-tight">Checkout</h1>
        </div>
        <div className="size-10 rounded-full overflow-hidden border border-zinc-800">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userId || "default"}`}
            alt="User"
            className="size-full"
          />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-8 w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-7 space-y-10">
          {/* ENDEREÇO */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base tracking-tight text-white uppercase">Entregar em</h2>
              <button
                onClick={() => setSubView("addresses")}
                className="text-yellow-400 text-[10px] font-black tracking-widest uppercase hover:opacity-80"
              >
                Alterar
              </button>
            </div>
            <div className="flex items-start gap-4">
              <div className="size-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0 mt-0.5">
                <span
                  className="material-symbols-outlined text-yellow-400 text-lg"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  location_on
                </span>
              </div>
              <div>
                <p className="text-white font-bold text-sm leading-tight">
                  {userLocation.address || "Endereço não definido"}
                </p>
                <p className="text-zinc-500 text-xs mt-1">Estimativa: 25-40 min</p>
              </div>
            </div>
          </section>

          {/* PAGAMENTO */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base tracking-tight text-white uppercase">Pagamento</h2>
            </div>

            {paymentOptions.map((m) => (
              <div key={m.id} className="space-y-3">
                <button
                  onClick={() => !m.disabled && setPaymentMethod(m.id)}
                  disabled={m.disabled}
                  className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all active:scale-[0.98] ${
                    paymentMethod === m.id
                      ? "bg-yellow-400/5 shadow-[inset_0_0_0_1.5px_rgba(255,215,9,0.4)]"
                      : m.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-zinc-900/50"
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-xl ${paymentMethod === m.id ? "text-yellow-400" : "text-zinc-500"}`}
                    style={{ fontVariationSettings: paymentMethod === m.id ? "'FILL' 1" : "'FILL' 0" }}
                  >
                    {m.icon}
                  </span>
                  <div className="flex-1 text-left">
                    <p className={`font-black text-sm ${paymentMethod === m.id ? "text-white" : "text-zinc-400"}`}>
                      {m.label}
                    </p>
                    <p className="text-zinc-600 text-xs mt-0.5">{m.sub}</p>
                  </div>
                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${paymentMethod === m.id ? "border-yellow-400" : "border-zinc-700"}`}
                  >
                    {paymentMethod === m.id && <div className="size-2.5 rounded-full bg-yellow-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {paymentMethod === "dinheiro" && m.id === "dinheiro" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden pl-14 pr-5 pb-2"
                    >
                      <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800 focus-within:border-yellow-400/30 transition-all flex items-center gap-3">
                        <span className="text-[10px] font-black text-zinc-500 uppercase shrink-0">Troco para:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={changeFor}
                          onChange={(e) => setChangeFor(e.target.value.replace(/\D/g, ""))}
                          placeholder="Ex: 50,00"
                          className="bg-transparent border-none outline-none text-white text-sm font-black w-full"
                        />
                      </div>
                      <p className="text-[9px] text-zinc-600 mt-2 italic px-1">
                        Deixe em branco se não precisar de troco.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}

            {/* Cartões salvos expandidos quando cartao selecionado */}
            {paymentMethod === "cartao" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="overflow-hidden space-y-2 pl-14">
                {savedCards.map((card: any) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${selectedCard?.id === card.id ? "bg-yellow-400/10 shadow-[inset_0_0_0_1px_rgba(255,215,9,0.3)]" : "bg-zinc-900/50"}`}
                  >
                    <span
                      className="material-symbols-outlined text-base text-zinc-400"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      credit_card
                    </span>
                    <span className="text-zinc-300 text-sm font-bold flex-1 text-left">
                      {card.brand} •••• {card.last4}
                    </span>
                    {selectedCard?.id === card.id && (
                      <span
                        className="material-symbols-outlined text-yellow-400 text-base"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        check_circle
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </section>

          {/* RESUMO DOS ITENS */}
          <section className="space-y-4">
            <h2 className="font-extrabold text-base tracking-tight text-white uppercase">Resumo do Pedido</h2>
            <div className="space-y-3">
              {cart.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-zinc-900">
                    {item.img ? (
                      <img
                        src={item.img}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-700">fastfood</span>
                      </div>
                    )}
                    <div className="absolute top-1 left-1 size-5 bg-yellow-400 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-black text-black">1x</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate">{item.name}</p>
                    {item.desc && <p className="text-zinc-600 text-[10px] mt-0.5 truncate">{item.desc}</p>}
                    {item.options && <p className="text-zinc-500 text-[10px] mt-0.5">{item.options}</p>}
                  </div>
                  <p className="text-yellow-400 font-black text-sm shrink-0">
                    R$ {Number(item.price || 0).toFixed(2).replace(".", ",")}
                  </p>
                </div>
              ))}
            </div>

            {/* Cupom */}
            <div className="pt-2">
              <div className="flex items-center gap-2 bg-zinc-900/50 rounded-2xl overflow-hidden border border-zinc-800 focus-within:border-yellow-400/30 transition-all">
                <span className="material-symbols-outlined text-zinc-500 text-lg pl-4">confirmation_number</span>
                <input
                  className="flex-1 bg-transparent py-3.5 px-2 text-white placeholder:text-zinc-600 focus:outline-none text-sm font-medium"
                  placeholder="Código de cupom"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                />
                <button
                  onClick={() => handleApplyCoupon(couponInput)}
                  className="bg-yellow-400 text-black text-[10px] font-black uppercase tracking-wider px-4 py-3.5 shrink-0 hover:bg-yellow-300 transition-colors"
                >
                  Aplicar
                </button>
              </div>
              {appliedCoupon && (
                <div className="flex items-center gap-2 mt-2 px-1">
                  <span
                    className="material-symbols-outlined text-emerald-400 text-sm"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check_circle
                  </span>
                  <p className="text-emerald-400 text-xs font-black">
                    {appliedCoupon.coupon_code} —{" "}
                    {appliedCoupon.discount_type === "fixed"
                      ? `R$ ${appliedCoupon.discount_value.toFixed(2)} OFF`
                      : `${appliedCoupon.discount_value}% OFF`}
                  </p>
                  <button
                    onClick={() => {
                      setAppliedCoupon(null);
                      setCouponInput("");
                    }}
                    className="text-zinc-600 hover:text-red-400 transition-colors ml-auto"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN — Resumo financeiro + botão */}
        <div className="lg:col-span-5">
          <div className="sticky top-20 space-y-4">
            {/* Totais */}
            <div className="space-y-3">
              <div className="h-px bg-zinc-900" />
              {[
                { label: "Subtotal", value: `R$ ${subtotal.toFixed(2).replace(".", ",")}`, muted: true },
                { label: "Entrega", value: "Grátis", green: true },
                ...(discount > 0
                  ? [
                      {
                        label: `Desconto (${appliedCoupon?.coupon_code})`,
                        value: `-R$ ${discount.toFixed(2).replace(".", ",")}`,
                        green: true,
                      },
                    ]
                  : []),
              ].map((row: any) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-zinc-500 text-sm">{row.label}</span>
                  <span className={`text-sm font-bold ${row.green ? "text-emerald-400" : "text-zinc-300"}`}>
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="h-px bg-zinc-900" />
              <div className="flex justify-between items-center">
                <span className="text-white font-black text-base uppercase tracking-wider">Total</span>
                <span
                  className="text-yellow-400 font-black text-2xl"
                  style={{ textShadow: "0 0 20px rgba(255,215,9,0.4)" }}
                >
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>

            {/* Botão confirmar */}
            <button
              onClick={() => handlePlaceOrder()}
              disabled={!paymentMethod}
              className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)",
                color: "#000",
                boxShadow: "0 0 30px rgba(255,215,9,0.2)",
              }}
            >
              {paymentMethod === "pix"
                ? "Gerar QR PIX"
                : paymentMethod === "bitcoin_lightning"
                  ? "Gerar Invoice Lightning"
                  : paymentMethod === "google_pay"
                    ? "Pagar com Google Pay"
                    : paymentMethod === "dinheiro" || paymentMethod === "cartao_entrega"
                      ? "Confirmar — Pagar na Entrega"
                      : `Confirmar Pedido — R$ ${total.toFixed(2).replace(".", ",")}`}
            </button>

            {/* Adicionar cartão — só aparece aqui quando cartao selecionado */}
            {paymentMethod === "cartao" && (
              <button
                onClick={() => {
                  setPaymentsOrigin("checkout");
                  setSubView("payments");
                }}
                className="w-full py-3 rounded-2xl border border-dashed border-zinc-800 text-zinc-500 hover:border-yellow-400/30 hover:text-yellow-400 transition-all text-xs font-black uppercase tracking-wider active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Adicionar novo cartão
              </button>
            )}

            <p className="text-zinc-700 text-[10px] text-center leading-relaxed">
              Ao confirmar você concorda com os <span className="text-yellow-400/40">Termos de Uso</span> e{" "}
              <span className="text-yellow-400/40">Política de Privacidade</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutView;
