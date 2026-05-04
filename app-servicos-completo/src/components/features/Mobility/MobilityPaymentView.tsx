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
    { id: 'cartao', icon: 'credit_card', label: 'Cartão via App', sub: selectedCard ? `${selectedCard.brand} •••• ${selectedCard.last4}` : 'Pague com segurança pelo App', color: '#3B82F6', disabled: false },
    { id: 'pix', icon: 'pix', label: 'PIX Instantâneo', sub: 'Aprovação imediata via QR Code', color: '#10B981', disabled: false, isImage: true },
    { id: 'bitcoin_lightning', icon: 'bolt', label: 'Bitcoin Lightning', sub: 'Pagamento instantâneo em Satoshis', color: '#F97316', disabled: false },
    { id: 'saldo', icon: 'account_balance_wallet', label: 'Saldo Izi Pay', sub: `R$ ${(walletBalance || 0).toFixed(2).replace('.', ',')} + ${iziCoins} coins`, color: '#06B6D4', disabled: totalBalance < price },
    { id: 'dinheiro', icon: 'payments', label: 'Dinheiro em Espécie', sub: 'Pagamento direto no local', color: '#6B7280', disabled: false },
  ];

  return (
    <div className="absolute inset-0 z-[115] bg-[#F8F9FA] flex flex-col font-sans overflow-hidden">

      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-100 px-5 pt-12 pb-4 flex items-center gap-4 shadow-sm">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (transitData.type === 'van') navigateSubView("van_wizard");
            else if (transitData.type === 'utilitario') navigateSubView("shipping_details");
            else if (transitData.type === 'frete' || transitData.type === 'logistica') navigateSubView("freight_wizard");
            else navigateSubView("taxi_wizard");
          }}
          className="size-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
        </motion.button>
        <div>
          <h2 className="text-lg font-black text-gray-900 tracking-tight leading-none">Finalizar Pedido</h2>
          <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mt-0.5">Checkout Seguro</p>
        </div>
      </header>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-6 space-y-5 pb-8">

          {/* Resumo do serviço */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-yellow-400 px-5 py-4 flex items-center gap-4">
              <div className="size-11 rounded-xl bg-black/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-black text-xl font-black">{serviceIcon()}</span>
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-black/50 uppercase tracking-widest leading-none mb-1">Serviço Selecionado</p>
                <h3 className="text-base font-black text-black tracking-tight leading-none">{serviceLabel()}</h3>
              </div>
            </div>

            <div className="px-5 py-4 space-y-3">
              {transitData.origin && (
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-green-600 text-xs">radio_button_checked</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Coleta</p>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {typeof transitData.origin === 'object' ? (transitData.origin.address || transitData.origin.formatted_address) : transitData.origin}
                    </p>
                  </div>
                </div>
              )}
              {transitData.destination && (
                <div className="flex items-start gap-3">
                  <div className="size-5 rounded-full bg-red-100 flex items-center justify-center mt-0.5 shrink-0">
                    <span className="material-symbols-outlined text-red-500 text-xs">location_on</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Entrega</p>
                    <p className="text-xs font-semibold text-gray-800 leading-tight">
                      {typeof transitData.destination === 'object' ? (transitData.destination.formatted_address || transitData.destination.address) : transitData.destination}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Valor */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold">Valor do serviço</span>
                <span className="text-sm font-black text-gray-900">R$ {rawBase.toFixed(2).replace('.', ',')}</span>
              </div>
              {serviceFeeAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 font-semibold">Taxa de serviço ({serviceFee}%)</span>
                  <span className="text-sm font-black text-gray-900">R$ {serviceFeeAmount.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              {isIziBlackMembership && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-yellow-600 font-bold">✦ Isenção Izi Black</span>
                  <span className="text-sm font-black text-yellow-600">- R$ {((rawBase * Number(serviceFee || 0)) / 100).toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm font-black text-gray-900">Total</span>
                <span className="text-xl font-black text-gray-900">R$ {price.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>

          {/* Formas de pagamento */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Forma de Pagamento</p>
            <div className="space-y-2">
              {methods.map((m) => {
                const isSelected = paymentMethod === m.id;
                return (
                  <motion.button
                    key={m.id}
                    whileTap={{ scale: m.disabled ? 1 : 0.98 }}
                    disabled={m.disabled}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 transition-all
                      ${m.disabled ? 'opacity-40 cursor-not-allowed bg-gray-100 border-gray-100' :
                        isSelected
                          ? 'bg-yellow-400 border-yellow-400 shadow-md'
                          : 'bg-white border-gray-100 shadow-sm hover:border-yellow-200'
                      }`}
                  >
                    <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-black/10' : 'bg-gray-100'}`}>
                      {(m as any).isImage ? (
                        <img src={pixLogo} alt="Pix" className="size-5 object-contain" />
                      ) : (
                        <span className={`material-symbols-outlined text-lg font-black ${isSelected ? 'text-black' : 'text-gray-600'}`}>{m.icon}</span>
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-black leading-none mb-0.5 ${isSelected ? 'text-black' : 'text-gray-800'}`}>{m.label}</p>
                      <p className={`text-[10px] font-semibold ${isSelected ? 'text-black/60' : 'text-gray-400'}`}>{m.sub}</p>
                    </div>
                    {isSelected && (
                      <div className="size-5 rounded-full bg-black/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-black text-xs font-black">check</span>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 py-2">
            <span className="material-symbols-outlined text-gray-300 text-base">enhanced_encryption</span>
            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Proteção Izi Security • RSA 4096</p>
          </div>

          {/* Botão — dentro do scroll, sempre após os cards */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleConfirmMobility(paymentMethod)}
            disabled={!paymentMethod}
            className="w-full bg-yellow-400 text-black font-black text-base py-5 rounded-2xl shadow-lg active:brightness-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 relative overflow-hidden"
          >
            <span className="uppercase tracking-widest text-sm">Confirmar Solicitação</span>
            <span className="material-symbols-outlined font-black text-xl">bolt</span>
          </motion.button>

        </div>
      </div>
    </div>
  );
};
