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
    <div className="absolute inset-0 z-40 bg-white text-zinc-900 flex flex-col overflow-y-auto no-scrollbar pb-32">
      {/* HEADER PREMIUM - SEM FUNDO */}
      <header className="fixed top-0 inset-x-0 z-[100] px-6 py-6 flex items-center justify-between">
        <button 
          onClick={() => setSubView("cart")} 
          className="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center active:scale-90 transition-all shadow-xl"
        >
          <span className="material-symbols-rounded text-zinc-900 text-xl">arrow_back_ios_new</span>
        </button>
        <h1 className="font-black text-base tracking-tighter uppercase leading-none">Checkout</h1>
        <div className="size-12" /> {/* Spacer */}
      </header>

      <div className="pt-24 px-6 py-6 space-y-10">
        {/* ENDEREÇO */}
        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Endereço de entrega</h3>
           <div className="flex items-center justify-between p-5 bg-zinc-50 rounded-[32px] border border-zinc-100 shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                 <div className="size-10 rounded-2xl bg-white flex items-center justify-center shadow-inner">
                    <span className="material-symbols-rounded text-zinc-400">location_on</span>
                 </div>
                 <p className="text-sm font-black text-zinc-900 uppercase tracking-tighter truncate">{userLocation.address || "Defina um endereço"}</p>
              </div>
              <button onClick={() => setSubView("addresses")} className="text-yellow-600 text-[10px] font-black uppercase tracking-widest px-4 py-2 bg-white rounded-xl border border-zinc-100 shadow-sm active:scale-95 transition-all">Alterar</button>
           </div>
        </section>

        {/* PAGAMENTO */}
        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Forma de pagamento</h3>
           <div className="grid grid-cols-2 gap-4">
              {paymentOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => !m.disabled && setPaymentMethod(m.id)}
                  className={`flex flex-col items-start p-5 rounded-[32px] border-4 transition-all duration-300 ${paymentMethod === m.id ? 'border-yellow-400 bg-white shadow-2xl shadow-yellow-100' : 'border-zinc-50 bg-zinc-50 opacity-60'}`}
                >
                  <div className={`size-10 rounded-2xl bg-white flex items-center justify-center shadow-sm mb-4`}>
                    <span className={`material-symbols-rounded ${paymentMethod === m.id ? 'text-yellow-600' : m.color}`}>{m.icon}</span>
                  </div>
                  <p className="text-[12px] font-black text-zinc-900 uppercase tracking-tighter leading-tight">{m.label}</p>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">{m.sub}</p>
                </button>
              ))}
           </div>

           {paymentMethod === "dinheiro" && (
             <div className="mt-6 p-6 bg-zinc-50 rounded-[32px] border border-zinc-100 shadow-inner">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Troco para quanto?</p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={changeFor}
                  onChange={(e) => setChangeFor(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 50,00"
                  className="w-full bg-white h-14 rounded-2xl border border-zinc-100 px-6 text-zinc-900 font-black uppercase tracking-tighter outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                />
             </div>
           )}
        </section>

        {/* CUPOM */}
        <section className="space-y-4">
           <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cupom de desconto</h3>
           <div className="flex gap-3">
              <input
                className="flex-1 bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-tighter placeholder:text-zinc-300 outline-none focus:ring-2 focus:ring-yellow-400 transition-all"
                placeholder="CÓDIGO DO CUPOM"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <button
                onClick={() => handleApplyCoupon(couponInput)}
                className="bg-zinc-900 text-yellow-400 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
              >
                Aplicar
              </button>
           </div>
           {appliedCoupon && (
             <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">{appliedCoupon.coupon_code} ATIVADO</p>
                <button onClick={() => setAppliedCoupon(null)} className="text-emerald-700 material-symbols-rounded text-sm">close</button>
             </div>
           )}
        </section>

        {/* IZI COINS */}
        {iziCoins >= 100 && (
          <section className="p-6 bg-zinc-900 rounded-[32px] flex items-center justify-between shadow-2xl shadow-zinc-200">
             <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                   <span className="material-symbols-rounded text-yellow-400">monetization_on</span>
                </div>
                <div>
                   <p className="text-white font-black text-sm uppercase tracking-tighter">Usar Izi Coins</p>
                   <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Disponível: {iziCoins} coins</p>
                </div>
             </div>
             <button 
               onClick={() => setUseCoins(!useCoins)}
               className={`w-14 h-7 rounded-full p-1.5 transition-all ${useCoins ? 'bg-yellow-400' : 'bg-zinc-800'}`}
             >
                <div className={`size-4 bg-white rounded-full shadow-sm transition-all ${useCoins ? 'translate-x-7' : 'translate-x-0'}`} />
             </button>
          </section>
        )}

        {/* RESUMO */}
        <section className="space-y-4 pt-10 border-t border-zinc-100">
           <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-black uppercase tracking-widest">Subtotal</span>
              <span className="text-zinc-900 font-black tracking-tighter">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
           </div>
           <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-500 font-black uppercase tracking-widest">Taxa de entrega</span>
              <span className={deliveryFee === 0 ? "text-emerald-600 font-black tracking-widest" : "text-zinc-900 font-black tracking-tighter"}>
                 {deliveryFee === 0 ? "GRÁTIS" : `R$ ${deliveryFee.toFixed(2).replace(".", ",")}`}
              </span>
           </div>
           {couponDiscount > 0 && (
             <div className="flex justify-between items-center text-xs text-emerald-600 font-black uppercase tracking-widest">
                <span>Cupom</span>
                <span>- R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
             </div>
           )}
           {coinDiscount > 0 && (
             <div className="flex justify-between items-center text-xs text-emerald-600 font-black uppercase tracking-widest">
                <span>Izi Coins</span>
                <span>- R$ {coinDiscount.toFixed(2).replace(".", ",")}</span>
             </div>
           )}
           <div className="flex justify-between items-end pt-6 border-t border-zinc-100 mt-6">
              <span className="text-zinc-900 font-black text-2xl uppercase tracking-tighter">Total</span>
              <span className="text-zinc-900 font-black text-3xl tracking-tighter">R$ {total.toFixed(2).replace(".", ",")}</span>
           </div>
        </section>

        <p className="text-center text-[9px] font-black text-zinc-400 uppercase tracking-widest pb-40">
           Ao finalizar você concorda com nossos termos de uso.
        </p>
      </div>

      {/* FOOTER FIXO PREMIUM */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-zinc-50 z-[200]">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => isShopOpen && handlePlaceOrder(useCoins)}
          disabled={!paymentMethod || !isShopOpen}
          className={`w-full h-18 rounded-[28px] flex items-center justify-center gap-4 shadow-2xl transition-all ${isShopOpen ? 'bg-zinc-900 text-yellow-400 shadow-zinc-200' : 'bg-zinc-100 text-zinc-400 shadow-none'}`}
        >
           <span className="font-black text-lg uppercase tracking-tighter">
              {isShopOpen ? 'Confirmar Pedido' : 'Loja Fechada'}
           </span>
           {isShopOpen && <span className="material-symbols-rounded">arrow_forward_ios</span>}
        </motion.button>
      </div>
    </div>
  );
};
