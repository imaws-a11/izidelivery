import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CheckoutViewProps {
  cart: any[];
  appliedCoupon: any;
  walletTransactions: any[];
  savedCards: any[];
  userId: string | null;
  userName: string;
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
  handlePlaceOrder: (useCoins?: boolean) => void;
  setPaymentsOrigin: (origin: string) => void;
  setSubView: (view: string) => void;
  iziCoins?: number;
  iziCoinValue?: number;
  iziCoinRate?: number;
  deliveryFee: number;
  serviceFee?: number;
  isIziBlack?: boolean;
  iziBlackCashback?: number;
  iziBlackCashbackMultiplier?: number;
  paymentMethodsActive?: { pix?: boolean; card?: boolean; lightning?: boolean; wallet?: boolean };
  walletBalance?: number;
  isShopOpen?: boolean;
  shopName?: string;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  appliedCoupon,
  savedCards,
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
  setSubView,
  iziCoins = 0,
  iziCoinValue = 1.0,
  deliveryFee = 0,
  serviceFee = 0,
  isIziBlack = false,
  iziBlackCashback = 1,
  iziBlackCashbackMultiplier = 1,
  paymentMethodsActive = { pix: true, card: true, lightning: true, wallet: true },
  walletBalance = 0,
  isShopOpen = true,
  shopName = "Estabelecimento"
}) => {
  const [useCoins, setUseCoins] = React.useState(false);
  const subtotal = cart.reduce((sum, item) => {
    const basePrice = Number(item.price) || 0;
    const addons = Array.isArray(item.options) ? item.options : (Array.isArray(item.addonDetails) ? item.addonDetails : []);
    const addonsPrice = addons.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0);
    return sum + (basePrice + addonsPrice) * (item.quantity || 1);
  }, 0);

  const getItemTotal = (item: any) => {
    const basePrice = Number(item.price) || 0;
    const addons = Array.isArray(item.options) ? item.options : (Array.isArray(item.addonDetails) ? item.addonDetails : []);
    const addonsPrice = addons.reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0);
    return basePrice + addonsPrice;
  };
  
  const couponDiscount = appliedCoupon
    ? appliedCoupon.discount_type === "fixed"
      ? appliedCoupon.discount_value
      : (subtotal * appliedCoupon.discount_value) / 100
    : 0;
  
  const coinDiscount = useCoins ? (iziCoins || 0) * (iziCoinValue || 1.0) : 0;
  
  const rawServiceFee = (subtotal * (Number(serviceFee) || 0)) / 100;
  const serviceFeeAmount = isIziBlack ? 0 : rawServiceFee;
  
  const total = Math.max(0, subtotal + (Number(deliveryFee) || 0) + serviceFeeAmount - (Number(couponDiscount) || 0) - (Number(coinDiscount) || 0));

  const paymentOptions = [
    {
      id: "cartao",
      icon: "credit_card",
      label: "Cartão App",
      sub: selectedCard ? `•• ${selectedCard.last4}` : (savedCards.length > 0 ? `•• ${savedCards[0].last4}` : "Pagar agora"),
      color: "text-blue-500",
      active: paymentMethodsActive.card !== false
    },
    { id: "pix", icon: "pix", label: "PIX", sub: "Instantâneo", color: "text-emerald-500", active: paymentMethodsActive.pix !== false },
    {
      id: "saldo",
      icon: "account_balance_wallet",
      label: "Saldo Izi Pay",
      sub: `R$ ${Number(walletBalance || 0).toFixed(2).replace(".", ",")}`,
      disabled: (Number(walletBalance || 0) + (Number(iziCoins || 0) * Number(iziCoinValue || 1.0))) < total,
      color: "text-emerald-500",
      active: paymentMethodsActive.wallet !== false
    },
    { id: "dinheiro", icon: "payments", label: "Dinheiro", sub: "Na entrega", color: "text-green-500", active: true },
    { id: "cartao_entrega", icon: "contactless", label: "Maquininha", sub: "Na entrega", color: "text-orange-500", active: true },
    { id: "bitcoin_lightning", icon: "bolt", label: "Bitcoin", sub: "Lightning", color: "text-yellow-600", active: paymentMethodsActive.lightning === true },
  ].filter(o => o.active);

  return (
    <div className="absolute inset-0 z-40 bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar">
      {/* HEADER */}
      <header className="bg-white px-6 pt-12 pb-6 flex items-center gap-4 border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={() => setSubView("cart")} className="size-10 rounded-full bg-zinc-50 flex items-center justify-center">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="font-black text-xl tracking-tight leading-none uppercase">Checkout</h1>
      </header>

      <div className="px-5 py-6 space-y-8">
        {/* ENDEREÇO */}
        <section className="space-y-3">
           <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Endereço de entrega</h3>
           <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-3 min-w-0">
                 <span className="material-symbols-rounded text-zinc-400">location_on</span>
                 <p className="text-sm font-bold text-zinc-900 truncate">{userLocation.address || "Defina um endereço"}</p>
              </div>
              <button onClick={() => setSubView("addresses")} className="text-yellow-600 text-xs font-black uppercase">Alterar</button>
           </div>
        </section>

        {/* PAGAMENTO */}
        <section className="space-y-3">
           <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Forma de pagamento</h3>
           <div className="grid grid-cols-2 gap-3">
              {paymentOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => !m.disabled && setPaymentMethod(m.id)}
                  className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all ${paymentMethod === m.id ? 'border-yellow-400 bg-yellow-50' : 'border-zinc-100 bg-white'}`}
                >
                  <span className={`material-symbols-rounded mb-2 ${paymentMethod === m.id ? 'text-yellow-600' : m.color}`}>{m.icon}</span>
                  <p className="text-[13px] font-black text-zinc-900 leading-tight">{m.label}</p>
                  <p className="text-[10px] font-medium text-zinc-400 mt-0.5">{m.sub}</p>
                </button>
              ))}
           </div>

           {paymentMethod === "dinheiro" && (
             <div className="mt-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-500 mb-2">Troco para quanto?</p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 50,00"
                  className="w-full bg-white h-12 rounded-xl border border-zinc-200 px-4 text-zinc-900 font-bold outline-none focus:border-yellow-400"
                />
             </div>
           )}
        </section>

        {/* CUPOM */}
        <section className="space-y-3">
           <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest">Cupom de desconto</h3>
           <div className="flex gap-2">
              <input
                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm font-bold uppercase placeholder:text-zinc-300 outline-none focus:border-yellow-400"
                placeholder="CÓDIGO"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <button
                onClick={() => handleApplyCoupon(couponInput)}
                className="bg-zinc-900 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest"
              >
                Aplicar
              </button>
           </div>
           {appliedCoupon && (
             <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
                <p className="text-[11px] font-bold text-emerald-700 uppercase">{appliedCoupon.coupon_code} aplicado</p>
                <button onClick={() => setAppliedCoupon(null)} className="text-emerald-700 material-symbols-rounded text-sm">close</button>
             </div>
           )}
        </section>

        {/* IZI COINS */}
        {iziCoins >= 100 && (
          <section className="p-4 bg-zinc-900 rounded-2xl flex items-center justify-between">
             <div className="flex items-center gap-3">
                <span className="material-symbols-rounded text-yellow-400">monetization_on</span>
                <div>
                   <p className="text-white font-black text-sm uppercase">Usar Izi Coins</p>
                   <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Saldo: {iziCoins} coins</p>
                </div>
             </div>
             <button 
               onClick={() => setUseCoins(!useCoins)}
               className={`w-12 h-6 rounded-full p-1 transition-all ${useCoins ? 'bg-yellow-400' : 'bg-zinc-700'}`}
             >
                <div className={`size-4 bg-white rounded-full transition-all ${useCoins ? 'translate-x-6' : 'translate-x-0'}`} />
             </button>
          </section>
        )}

        {/* RESUMO */}
        <section className="space-y-3 pt-8 border-t border-zinc-100">
           <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Subtotal</span>
              <span className="text-zinc-900 font-bold">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
           </div>
           <div className="flex justify-between text-sm">
              <span className="text-zinc-500 font-medium">Taxa de entrega</span>
              <span className={deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-zinc-900 font-bold"}>
                 {deliveryFee === 0 ? "Grátis" : `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`}
              </span>
           </div>
           {couponDiscount > 0 && (
             <div className="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Cupom</span>
                <span>- R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
             </div>
           )}
           {coinDiscount > 0 && (
             <div className="flex justify-between text-sm text-emerald-600 font-bold">
                <span>Izi Coins</span>
                <span>- R$ {coinDiscount.toFixed(2).replace(".", ",")}</span>
             </div>
           )}
           <div className="flex justify-between items-end pt-4 border-t border-zinc-100">
              <span className="text-zinc-900 font-black text-xl uppercase">Total</span>
              <span className="text-zinc-900 font-black text-2xl tracking-tight">R$ {total.toFixed(2).replace(".", ",")}</span>
           </div>
        </section>

        <p className="text-center text-[10px] font-bold text-zinc-400 pb-32">
           Ao finalizar você concorda com nossos termos de uso.
        </p>
      </div>

      {/* FOOTER FIXO */}
      <div className="fixed bottom-0 left-0 w-full p-5 bg-white border-t border-zinc-100 z-50">
        <button
          onClick={() => isShopOpen && handlePlaceOrder(useCoins)}
          disabled={!paymentMethod || !isShopOpen}
          className={`w-full h-16 rounded-2xl flex items-center justify-center gap-4 shadow-xl transition-all active:scale-95 ${isShopOpen ? 'bg-yellow-400 shadow-yellow-100' : 'bg-zinc-100 text-zinc-400 shadow-none'}`}
        >
           <span className="text-black font-black text-lg">
              {isShopOpen ? 'Fazer pedido' : 'Loja fechada'}
           </span>
        </button>
      </div>
    </div>
  );
};
