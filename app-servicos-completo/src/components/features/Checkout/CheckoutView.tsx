import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";

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
  walletTransactions,
  savedCards,
  userId,
  userName,
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
  iziCoinRate = 1,
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

  const getAddonDetails = (item: any) => {
    if (Array.isArray(item.options)) return item.options;
    if (Array.isArray(item.addonDetails)) return item.addonDetails;
    return [];
  };

  const getItemTotal = (item: any) => {
    const basePrice = Number(item.price) || 0;
    const addonsPrice = getAddonDetails(item).reduce((a: number, b: any) => a + (Number(b.total_price || b.price) || 0), 0);
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

  const cashbackRate = isIziBlack ? (iziBlackCashback * (iziBlackCashbackMultiplier || 1)) : iziCoinRate;
  const estimatedCashbackCoins = (total * (cashbackRate / 100));

  const paymentOptions = [
    {
      id: "cartao",
      icon: "credit_card",
      label: "Cartão App",
      sub: selectedCard ? `•• ${selectedCard.last4}` : (savedCards.length > 0 ? `•• ${savedCards[0].last4}` : "Pagar agora"),
      color: "text-blue-400",
      active: paymentMethodsActive.card !== false
    },
    { id: "pix", icon: "pix", label: "PIX", sub: "Instantâneo", color: "text-emerald-400", active: paymentMethodsActive.pix !== false },
    {
      id: "saldo",
      icon: "account_balance_wallet",
      label: "Saldo Izi Pay",
      sub: `R$ ${Number(walletBalance || 0).toFixed(2).replace(".", ",")} + ${Number(iziCoins || 0)} coins`,
      disabled: (Number(walletBalance || 0) + (Number(iziCoins || 0) * Number(iziCoinValue || 1.0))) < total,
      color: "text-emerald-400",
      active: paymentMethodsActive.wallet !== false
    },
    { id: "dinheiro", icon: "payments", label: "Dinheiro", sub: "Na entrega", color: "text-green-400", active: true },
    {
      id: "cartao_entrega",
      icon: "contactless",
      label: "Maquininha",
      sub: "Na entrega",
      color: "text-orange-400",
      active: true
    },
    {
      id: "bitcoin_lightning",
      icon: "bolt",
      label: "Bitcoin",
      sub: "Lightning",
      color: "text-yellow-500",
      active: paymentMethodsActive.lightning === true
    },
  ].filter(o => o.active);

  return (
    <div className="absolute inset-0 z-40 bg-zinc-950 text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-48">
      <header className="sticky top-0 z-50 bg-zinc-900/80 backdrop-blur-2xl flex items-center justify-between px-6 py-6 border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-5">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubView("cart")}
            className="size-11 rounded-2xl bg-zinc-800 flex items-center justify-center shadow-[4px_4px_10px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05),inset_-2px_-2px_4px_rgba(0,0,0,0.3)]"
          >
            <span className="material-symbols-outlined text-white text-xl">arrow_back</span>
          </motion.button>
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">Finalizar Pedido</h1>
            <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 italic flex items-center gap-1.5">
               <span className="size-1 rounded-full bg-yellow-400 animate-pulse" />
               Checkout Seguro
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-6 py-10 w-full space-y-12">
        <section className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-black text-[11px] tracking-[0.2em] text-zinc-500 uppercase italic">Local de Entrega</h2>
            <button
              onClick={() => setSubView("addresses")}
              className="text-yellow-400 text-[10px] font-black tracking-[0.2em] uppercase italic underline underline-offset-4 decoration-yellow-400/20"
            >
              Alterar
            </button>
          </div>
          <motion.div 
            whileHover={{ y: -2 }}
            className="flex items-center gap-5 p-5 rounded-[35px] bg-zinc-800 shadow-[10px_10px_20px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] transition-all group"
          >
            <div className="size-14 rounded-[22px] bg-zinc-900 flex items-center justify-center shrink-0 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.4)]">
              <span className="material-symbols-outlined text-yellow-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-[15px] leading-tight group-hover:text-yellow-400 transition-colors uppercase italic truncate">
                {userLocation.address || "Endereço não definido"}
              </p>
              <div className="flex items-center gap-2 mt-2">
                 <span className="text-emerald-400 text-[10px] font-black uppercase italic tracking-tighter">Chega em 25-40 MIN</span>
                 <span className="size-1 rounded-full bg-zinc-700" />
                 <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest leading-none">Izi Fast Driver</span>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="space-y-6">
          <h2 className="font-black text-[11px] tracking-[0.2em] text-zinc-500 uppercase italic">Como deseja pagar?</h2>
          <div className="grid grid-cols-2 gap-4">
            {paymentOptions.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                   if (!m.disabled) {
                      setPaymentMethod(m.id);
                      if (m.id === "cartao" && !selectedCard && savedCards.length > 0) {
                         setSelectedCard(savedCards[0]);
                      }
                   }
                }}
                disabled={m.disabled}
                className={`flex flex-col items-center justify-center p-5 rounded-[32px] transition-all duration-300 border relative group overflow-hidden
                  ${paymentMethod === m.id
                    ? "bg-yellow-400 border-yellow-400 shadow-[0_15px_35px_-5px_rgba(255,217,9,0.3)]"
                    : m.disabled
                      ? "opacity-20 cursor-not-allowed grayscale border-zinc-900"
                      : "bg-zinc-900/40 border-white/5 hover:border-white/10"
                  }`}
              >
                <span
                  className={`material-symbols-outlined text-3xl mb-3 ${paymentMethod === m.id ? "text-black" : m.color}`}
                  style={{ fontVariationSettings: paymentMethod === m.id ? "'FILL' 1" : "'FILL' 0" }}
                >
                  {m.icon}
                </span>
                <p className={`font-black text-[11px] uppercase tracking-wider ${paymentMethod === m.id ? "text-black" : "text-white"}`}>
                  {m.label}
                </p>
                <p className={`text-[8px] font-bold mt-1 uppercase tracking-widest ${paymentMethod === m.id ? "text-black/50" : "text-zinc-600"}`}>
                   {m.sub}
                </p>
                {paymentMethod === m.id && (
                  <motion.div layoutId="selection" className="absolute top-3 right-3">
                     <span className="material-symbols-outlined text-black text-base">verified</span>
                  </motion.div>
                )}
              </button>
            ))}
          </div>

          <AnimatePresence>
            {paymentMethod === "dinheiro" && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-zinc-900/60 rounded-3xl p-5 border border-white/5 space-y-4"
              >
                <div className="flex items-center justify-between">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Troco necessário?</p>
                   <span className="text-[9px] text-zinc-700 font-bold uppercase tracking-widest">Opcional</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={changeFor}
                    onChange={(e) => setChangeFor(e.target.value.replace(/\D/g, ""))}
                    placeholder="Ex: R$ 50,00"
                    className="bg-black/40 w-full h-14 rounded-2xl border border-white/5 px-5 text-white font-black text-sm focus:border-yellow-400/40 outline-none transition-all"
                  />
                  <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 material-symbols-outlined">payments</span>
                </div>
              </motion.div>
            )}
            
            {paymentMethod === "cartao" && savedCards.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                {savedCards.map((card: any) => (
                  <button
                    key={card.id}
                    onClick={() => setSelectedCard(card)}
                    className={`w-full h-16 rounded-2xl flex items-center justify-between px-6 transition-all border ${selectedCard?.id === card.id ? "bg-yellow-400 border-yellow-400 text-black" : "bg-zinc-900/40 border-white/5 text-white"}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined">credit_card</span>
                      <span className="text-sm font-black italic tracking-wider">
                        {card.brand.toUpperCase()} •••• {card.last4}
                      </span>
                    </div>
                    {selectedCard?.id === card.id && <span className="material-symbols-outlined">check_circle</span>}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <section className="space-y-8">
           <div className="flex items-center justify-between border-b border-white/5 pb-6">
             <h2 className="font-black text-[11px] tracking-[0.2em] text-zinc-500 uppercase italic">Pedido em {shopName}</h2>
             <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest bg-yellow-400/10 px-3 py-1.5 rounded-full border border-yellow-400/10 shadow-lg shadow-yellow-400/5">
                {cart.length} ITENS
             </span>
           </div>
           
           <div className="space-y-6">
              {cart.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-5 group">
                  <div className="size-16 rounded-2xl bg-zinc-900 border border-white/5 overflow-hidden shrink-0 shadow-2xl relative">
                    {item.img ? (
                      <img src={item.img} alt={item.name} className="size-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-700">fastfood</span>
                      </div>
                    )}
                    <div className="absolute -top-1 -right-1 size-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black shadow-lg">
                      <span className="text-[9px] font-black text-black leading-none">{item.quantity || 1}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-black text-sm truncate uppercase italic tracking-tight">{item.name}</p>
                    {getAddonDetails(item).length > 0 ? (
                      <div className="mt-1.5 space-y-1">
                        {getAddonDetails(item).map((addon: any) => (
                          <p key={`${item.cartId || item.id}-${addon.group_id}-${addon.id}`} className="text-zinc-600 text-[9px] font-bold tracking-widest leading-relaxed">
                            {addon.group_name}: {addon.name} x{addon.quantity} - R$ {Number(addon.total_price || 0).toFixed(2).replace(".", ",")}
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-widest mt-1">Premium Quality</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-white font-black text-xs">R$ {getItemTotal(item).toFixed(2).replace(".", ",")}</p>
                  </div>
                </div>
              ))}
           </div>

           <div className="pt-6">
             <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">Possui um cupom?</p>
                </div>
                <div className="relative flex items-center bg-zinc-900/60 rounded-3xl border border-white/5 focus-within:border-yellow-400/40 transition-all p-1.5 pr-2">
                   <span className="material-symbols-outlined text-zinc-600 pl-4">confirmation_number</span>
                   <input
                     className="flex-1 bg-transparent py-4 px-4 text-white placeholder:text-zinc-700 focus:outline-none text-xs font-black uppercase tracking-widest"
                     placeholder="INSIRA O CÓDIGO"
                     value={couponInput}
                     onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                   />
                   <button
                     onClick={() => handleApplyCoupon(couponInput)}
                     className="bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-[22px] shadow-lg shadow-yellow-400/10 active:scale-95 transition-all"
                   >
                     Aplicar
                   </button>
                </div>
             </div>

             {appliedCoupon && (
               <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-5 py-3 rounded-2xl">
                 <div className="flex items-center gap-3">
                   <span className="material-symbols-outlined text-emerald-400 text-lg">check_circle</span>
                   <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                     {appliedCoupon.coupon_code} — {appliedCoupon.discount_type === "fixed" ? `R$ ${appliedCoupon.discount_value.toFixed(2)} OFF` : `${appliedCoupon.discount_value}% OFF`}
                   </p>
                 </div>
                 <button onClick={() => { setAppliedCoupon(null); setCouponInput(""); }} className="text-emerald-400/40 hover:text-red-400 transition-all">
                   <span className="material-symbols-outlined text-base">cancel</span>
                 </button>
               </motion.div>
             )}
           </div>
        </section>

        <section className="pt-10 border-t border-white/10 space-y-8">
           {iziCoins >= 100 && (
             <div className="bg-gradient-to-br from-zinc-900/40 to-black p-6 rounded-[32px] border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="size-12 rounded-2xl bg-yellow-400/10 flex items-center justify-center border border-yellow-400/10">
                      <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>monetization_on</span>
                   </div>
                   <div>
                      <p className="text-white font-black text-xs uppercase tracking-tight italic">Utilizar meus Izi Coins</p>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Saldo: {iziCoins} Coins</p>
                   </div>
                </div>
                <div 
                  onClick={() => setUseCoins(!useCoins)}
                  className={`w-14 h-7 rounded-full p-1.5 transition-all cursor-pointer relative ${useCoins ? 'bg-yellow-400' : 'bg-zinc-800'}`}
                >
                  <motion.div animate={{ x: useCoins ? 28 : 0 }} className="size-4 bg-black rounded-full shadow-2xl" />
                </div>
             </div>
           )}

           <div className="bg-zinc-900/50 rounded-[32px] p-6 space-y-4 border border-white/5">
             {!isShopOpen && (
               <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 mb-2">
                 <span className="material-symbols-outlined text-red-500">error</span>
                 <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Loja Fechada - Não é possível finalizar</p>
               </div>
             )}
             <div className="flex justify-between items-center text-zinc-400">
                <span className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] italic">Subtotal</span>
                <span className="text-white font-black text-sm">R$ {subtotal.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 text-[11px] font-black uppercase tracking-[0.2em] italic">Taxa Izi</span>
                <div className="flex flex-col items-end">
                  <span className={deliveryFee > 0 ? "text-white font-black text-sm" : "text-emerald-400 font-black text-xs uppercase tracking-tighter"}>
                    {deliveryFee > 0 ? `R$ ${deliveryFee.toFixed(2).replace(".", ",")}` : "Grátis"}
                  </span>
                  {deliveryFee === 0 && isIziBlack && (
                    <span className="text-[8px] text-zinc-600 font-bold tracking-[0.2em] uppercase mt-1 italic">Benefício Izi Black</span>
                  )}
                </div>
              </div>
              {Number(serviceFee) > 0 && (
                <div className="flex justify-between items-center py-1">
                  <div className="flex flex-col">
                    <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Taxa de Serviço ({serviceFee.toString().replace(".", ",")}%):</span>
                    {isIziBlack && (
                      <span className="text-[7px] text-yellow-400 font-bold uppercase tracking-[0.2em] mt-1">Isento via Izi Black</span>
                    )}
                  </div>
                  <span className={isIziBlack ? "text-zinc-600 line-through text-xs" : "text-amber-400 font-bold text-sm"}>
                    R$ {rawServiceFee.toFixed(2).replace(".", ",")}
                  </span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Desconto Cupom</span>
                  <span className="font-black text-sm">- R$ {couponDiscount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              {useCoins && (
                <div className="flex justify-between items-center text-emerald-400">
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] italic">Desconto Coins</span>
                  <span className="font-black text-sm">- R$ {coinDiscount.toFixed(2).replace(".", ",")}</span>
                </div>
              )}
              <div className="pt-8 flex justify-between items-end border-t border-white/5">
                <div className="flex flex-col h-full justify-end">
                   <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em] mb-2 font-black italic underline underline-offset-4 decoration-yellow-400/20">Valor Final</p>
                   <p className="text-4xl font-black text-white leading-none tracking-tighter" style={{ textShadow: "0 0 40px rgba(255,255,255,0.05)" }}>
                     R$ {total.toFixed(2).replace(".", ",")}
                   </p>
                </div>
                {estimatedCashbackCoins > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                       <span className="material-symbols-outlined text-yellow-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                       <span className="text-[9px] font-black uppercase tracking-widest text-yellow-400/80 italic">Você receberá</span>
                    </div>
                    <span className="text-white font-black text-xs italic">
                      +{estimatedCashbackCoins.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} IZI COINS
                    </span>
                  </motion.div>
                )}
              </div>
           </div>
        </section>

        <p className="text-zinc-800 text-[9px] text-center font-bold leading-relaxed max-w-[280px] mx-auto opacity-40">
           Tudo pronto para decolar? Ao confirmar, você concorda com nossos Termos de Experiência.
        </p>
      </div>

      <div className="fixed bottom-0 left-0 w-full px-6 pb-12 pt-6 bg-gradient-to-t from-black via-black/95 to-transparent z-50">
        <button
          onClick={() => isShopOpen && handlePlaceOrder(useCoins)}
          disabled={!paymentMethod || !isShopOpen}
          className={"w-full h-18 rounded-[30px] flex items-center justify-between px-8 transition-all active:scale-[0.98] relative overflow-hidden group shadow-2xl " + 
            (!isShopOpen ? "bg-zinc-800 text-zinc-500 shadow-none cursor-not-allowed grayscale" : "shadow-yellow-400/10")}
          style={isShopOpen ? {
            background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)",
          } : {}}
        >
          <div className="flex flex-col items-start">
             <span className={"text-[8px] font-black uppercase tracking-[0.3em] leading-none mb-1.5 " + (isShopOpen ? "text-black/40" : "text-zinc-600")}>
               {isShopOpen ? "Confirmar meu" : "Estabelecimento"}
             </span>
             <span className={"font-black text-base uppercase tracking-widest italic leading-none " + (isShopOpen ? "text-black" : "text-zinc-500")}>
               {isShopOpen ? "Concluir Pedido" : "Fechado agora"}
             </span>
          </div>
          <div className="flex items-center gap-4">
             <div className={"h-6 w-px " + (isShopOpen ? "bg-black/10" : "bg-white/5")} />
             <div className="flex flex-col items-end">
                <span className={"font-black text-xl italic tracking-tighter leading-none " + (isShopOpen ? "text-black" : "text-zinc-400")}>
                  R$ {total.toFixed(2).replace(".", ",")}
                </span>
             </div>
             <span className={"material-symbols-outlined text-2xl group-hover:translate-x-1 transition-transform " + (isShopOpen ? "text-black" : "text-zinc-600")}>
               {isShopOpen ? "arrow_forward" : "block"}
             </span>
          </div>
          <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </button>
      </div>
    </div>
  );
};
