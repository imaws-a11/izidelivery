import React from "react";
import { motion } from "framer-motion";
import pixLogo from "../../../assets/images/pix-logo.png";

interface MobilityPaymentViewProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  transitData: any;
  isIziBlackMembership: boolean;
  walletBalance: number;
  selectedCard: any;
  handleConfirmMobility: (method: string) => void;
  navigateSubView: (view: any) => void;
  marketConditions: any;
  calculateDynamicPrice: (base: number) => number;
  iziCoins?: number;
  iziCoinValue?: number;
  serviceFee?: number;
}

export const MobilityPaymentView: React.FC<MobilityPaymentViewProps> = ({
  paymentMethod,
  setPaymentMethod,
  transitData,
  isIziBlackMembership,
  walletBalance,
  selectedCard,
  handleConfirmMobility,
  navigateSubView,
  marketConditions,
  calculateDynamicPrice,
  serviceFee = 0,
  iziCoins = 0,
  iziCoinValue = 1.0,
}) => {
  const bv = marketConditions?.settings?.baseValues || {};
  const basePrices: Record<string, number> = {
    mototaxi: bv.mototaxi_min || 0,
    carro: bv.carro_min || 0,
    van: bv.van_min || 0,
    utilitario: bv.utilitario_min || 0,
    logistica: bv.logistica_min || 0,
  };

  const getPrecisePrice = () => {
    if (Number(transitData.estPrice) > 0) return Number(transitData.estPrice);
    return calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min || 0) || 0;
  };

  const rawBase = Number(getPrecisePrice() || 0);
  const serviceFeeAmount = isIziBlackMembership ? 0 : (rawBase * Number(serviceFee || 0)) / 100;
  const price = Number(rawBase + serviceFeeAmount);
  const totalBalance = Number(walletBalance || 0) + (Number(iziCoins || 0) * Number(iziCoinValue || 1.0));

  const serviceLabel = () => {
    if (transitData.priority === 'turbo') return 'Izi Turbo Flash';
    if (transitData.priority === 'light') return 'Izi Light Flash';
    if (transitData.type === 'mototaxi') return 'MotoTáxi IZI';
    if (transitData.type === 'carro') return 'Particular IZI';
    if (transitData.type === 'van') return 'Van IZI Express';
    if (transitData.type === 'utilitario') return 'Utilitário IZI';
    return 'Frete / Logística';
  };

  const serviceIcon = () => {
    if (transitData.type === 'mototaxi') return 'motorcycle';
    if (transitData.type === 'carro') return 'directions_car';
    if (transitData.type === 'van') return 'airport_shuttle';
    return 'local_shipping';
  };

  const methods = [
    { id: 'cartao', icon: 'credit_card', label: 'Cartão via App', sub: selectedCard ? `${selectedCard.brand} •••• ${selectedCard.last4}` : 'Pague com segurança pelo App', disabled: false },
    { id: 'pix', icon: 'pix', label: 'PIX Instantâneo', sub: 'Aprovação imediata via QR Code', disabled: false, isImage: true },
    { id: 'bitcoin_lightning', icon: 'bolt', label: 'Bitcoin Lightning', sub: 'Pagamento via Satoshis', disabled: false },
    { id: 'saldo', icon: 'account_balance_wallet', label: 'Saldo Izi Pay', sub: `Saldo: R$ ${totalBalance.toFixed(2).replace('.', ',')}`, disabled: totalBalance < price },
    { id: 'dinheiro', icon: 'payments', label: 'Pagar no Local', sub: 'Pagamento direto na coleta/entrega', disabled: false },
  ];

  return (
    <div className="absolute inset-0 z-[115] bg-white flex flex-col font-sans overflow-hidden">

      {/* Header Premium */}
      <header className="shrink-0 bg-white/80 backdrop-blur-xl border-b border-zinc-50 px-6 pt-14 pb-6 flex items-center gap-4 relative z-20">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (transitData.type === 'van') navigateSubView("van_wizard");
            else if (transitData.type === 'utilitario') navigateSubView("shipping_details");
            else if (transitData.type === 'frete' || transitData.type === 'logistica') navigateSubView("freight_wizard");
            else navigateSubView("taxi_wizard");
          }}
          className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black"
        >
          <span className="material-symbols-rounded text-xl font-black">arrow_back_ios_new</span>
        </motion.button>
        <div>
          <h2 className="text-xl font-black text-black tracking-tighter leading-none">Checkout</h2>
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mt-1.5">Pagamento Seguro</p>
        </div>
      </header>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-6 py-8 space-y-8 pb-40">

          {/* Card de Resumo do Serviço */}
          <div className="rounded-[40px] border border-zinc-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white overflow-hidden">
            <div className="bg-yellow-400 px-6 py-5 flex items-center gap-4">
              <div className="size-14 rounded-[22px] bg-black/10 flex items-center justify-center border border-black/5">
                <span className="material-symbols-rounded text-black text-2xl font-black">{serviceIcon()}</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mb-1">Serviço</p>
                <h3 className="text-lg font-black text-black tracking-tight leading-none">{serviceLabel()}</h3>
              </div>
            </div>

            <div className="px-6 py-6 space-y-4">
              {transitData.origin && (
                <div className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mt-1 shrink-0">
                    <div className="size-2 rounded-full bg-black" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Origem</p>
                    <p className="text-[13px] font-black text-black leading-tight uppercase">
                      {typeof transitData.origin === 'object' ? (transitData.origin.address || transitData.origin.formatted_address) : transitData.origin}
                    </p>
                  </div>
                </div>
              )}
              {transitData.destination && (
                <div className="flex items-start gap-4">
                  <div className="size-6 rounded-full bg-black flex items-center justify-center mt-1 shrink-0">
                    <span className="material-symbols-rounded text-white text-[10px] font-black">location_on</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Destino</p>
                    <p className="text-[13px] font-black text-black leading-tight uppercase">
                      {typeof transitData.destination === 'object' ? (transitData.destination.formatted_address || transitData.destination.address) : transitData.destination}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Valores Detalhados */}
            <div className="bg-zinc-50/50 px-6 py-6 space-y-3">
              <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                <span className="text-zinc-400">Tarifa Base</span>
                <span className="text-black">R$ {rawBase.toFixed(2).replace('.', ',')}</span>
              </div>
              {serviceFeeAmount > 0 && (
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                  <span className="text-zinc-400">Taxa IZI ({serviceFee}%)</span>
                  <span className="text-black">R$ {serviceFeeAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {isIziBlackMembership && (
                <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-tight">
                  <span className="text-yellow-600">Benefício Izi Black</span>
                  <span className="text-yellow-600">- R$ {((rawBase * Number(serviceFee || 0)) / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="h-px bg-zinc-100 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-black uppercase tracking-widest">Total</span>
                <span className="text-3xl font-black text-black tracking-tighter">R$ {price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Formas de Pagamento */}
          <div className="space-y-4">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] px-2">Escolha como pagar</p>
            <div className="space-y-3">
              {methods.map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: m.disabled ? 1 : 0.98 }}
                    disabled={m.disabled}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-5 px-6 py-5 rounded-[32px] border transition-all relative overflow-hidden
                      ${m.disabled ? 'opacity-30 grayscale' :
                        isSelected
                          ? 'bg-yellow-400 border-yellow-400 shadow-xl shadow-yellow-400/20'
                          : 'bg-white border-zinc-100 hover:border-zinc-300'
                      }`}
                  >
                    <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-black/10' : 'bg-zinc-50'}`}>
                      {(m as any).isImage ? (
                        <img src={pixLogo} alt="Pix" className="size-6 object-contain" />
                      ) : (
                        <span className={`material-symbols-rounded text-2xl font-black ${isSelected ? 'text-black' : 'text-zinc-400'}`}>{m.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-[13px] font-black uppercase tracking-tight ${isSelected ? 'text-black' : 'text-zinc-900'}`}>{m.label}</p>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-black/50' : 'text-zinc-400'}`}>{m.sub}</p>
                    </div>
                    {isSelected && (
                      <div className="size-6 rounded-full bg-black/10 flex items-center justify-center">
                        <span className="material-symbols-rounded text-black text-sm font-black">check</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Segurança */}
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-rounded text-zinc-300 text-lg">verified_user</span>
              <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.5em]">Izi Security Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botão de Ação Fixo */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-white/80 backdrop-blur-xl border-t border-zinc-50 z-30">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleConfirmMobility(paymentMethod)}
          disabled={!paymentMethod}
          className="w-full h-[74px] rounded-[32px] bg-black text-white flex items-center justify-center gap-4 relative overflow-hidden group shadow-[0_20px_40px_rgba(0,0,0,0.15)] disabled:opacity-50"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
          
          <span className="relative z-10 font-black text-lg tracking-[0.1em] uppercase">
            Confirmar Pedido
          </span>
          <div className="relative z-10 size-11 rounded-2xl bg-white/10 flex items-center justify-center group-hover:translate-x-1.5 transition-transform duration-300">
            <span className="material-symbols-rounded text-white font-black text-2xl">bolt</span>
          </div>
        </motion.button>
      </div>
    </div>
  );
};
