import { motion } from "framer-motion";

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
    logistica: bv.logistica_min || 0
  };
  
  const isShippingService = ['utilitario', 'van', 'frete', 'logistica'].includes(transitData.type);
  
  // Lógica de cálculo idêntica ao handleConfirmMobility para precisão total
  const getPrecisePrice = () => {
    // PRIORIDADE ABSOLUTA: Usar o valor que o usuário viu no mapa/wizard
    if (Number(transitData.estPrice) > 0) return Number(transitData.estPrice);

    // Fallback apenas se o valor estiver zerado (não deveria acontecer na Logística)
    return calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min || 0) || 0;
  };

  const rawBase = Number(getPrecisePrice() || 0);
  const serviceFeeAmount = (rawBase * Number(serviceFee || 0)) / 100;
  const rawPriceWithFee = rawBase + serviceFeeAmount;
  
  const price = Number(rawPriceWithFee || 0);
  const totalBalance = Number(walletBalance || 0) + (Number(iziCoins || 0) * Number(iziCoinValue || 1.0));

  const PaymentMethodButton = ({ id, icon, label, sub, colorClass, disabled = false }: any) => {
    const isSelected = paymentMethod === id;
    return (
      <motion.button 
        whileTap={{ scale: disabled ? 1 : 0.98 }}
        disabled={disabled}
        onClick={() => setPaymentMethod(id)}
        className={`w-full group relative overflow-hidden flex items-center gap-5 p-6 rounded-[35px] transition-all duration-500 border italic
          ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : 'active:scale-[0.98]'}
          ${isSelected 
            ? 'bg-yellow-400 border-yellow-400 shadow-[0_20px_40px_rgba(250,204,21,0.2),inset_4px_4px_8px_rgba(255,255,255,0.4)]' 
            : 'bg-zinc-900/50 border-white/5 hover:border-white/10 shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.03)] backdrop-blur-xl'}
        `}
      >
        <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500
          ${isSelected ? 'bg-black/10' : `bg-zinc-800 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.5)] ${colorClass}`}
        `}>
           <span className={`material-symbols-outlined text-2xl font-black ${isSelected ? 'text-black' : ''}`}>{icon}</span>
        </div>
        <div className="flex-1 text-left">
           <p className={`text-[11px] font-black uppercase tracking-widest mb-1 leading-none ${isSelected ? 'text-black' : 'text-zinc-400'}`}>{label}</p>
           <p className={`text-[9px] font-black tracking-tight uppercase opacity-60 ${isSelected ? 'text-black' : 'text-zinc-600'}`}>{sub}</p>
        </div>
        {!disabled && <span className={`material-symbols-outlined text-xl ${isSelected ? 'text-black/40' : 'text-zinc-800'}`}>chevron_right</span>}
      </motion.button>
    );
  };

  return (
    <div className="absolute inset-0 z-[115] bg-black/95 backdrop-blur-3xl flex flex-col hide-scrollbar overflow-y-auto italic font-sans">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl px-8 py-10 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-6">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              if (transitData.type === 'van') navigateSubView("van_wizard");
              else if (transitData.type === 'utilitario') navigateSubView("shipping_details");
              else if (transitData.type === 'frete' || transitData.type === 'logistica') navigateSubView("freight_wizard");
              else navigateSubView("taxi_wizard");
            }} 
            className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white shadow-[10px_10px_20px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)] active:scale-90 transition-all"
          >
            <span className="material-symbols-outlined text-lg font-black">arrow_back_ios_new</span>
          </motion.button>
          <div className="flex flex-col text-left">
            <h2 className="text-2xl font-black text-white tracking-tighter leading-none uppercase italic">Finalizar</h2>
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 opacity-80 leading-none">Checkout Seguro</p>
          </div>
        </div>
      </header>

      <div className="flex-1 px-8 py-10 space-y-12 pb-32">
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Resumo do Valor</h3>
            <div className="px-4 py-1.5 rounded-full bg-zinc-900 border border-white/5 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.5)]">
              <span className="text-[10px] font-black text-zinc-500 italic uppercase">Logística IZI</span>
            </div>
          </div>
          
          <div className="bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[50px] p-8 shadow-[30px_30px_60px_rgba(0,0,0,0.7),inset_4px_4px_12px_rgba(255,255,255,0.05)] relative overflow-hidden group transition-all">
             <div className="absolute top-0 right-0 size-64 bg-yellow-400/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
             
             <div className="flex items-center gap-6">
                <div className="size-20 rounded-[30px] bg-zinc-800/80 flex items-center justify-center border border-white/5 shadow-[inset_4px_4px_10px_rgba(0,0,0,0.6)]">
                   <div className="size-14 rounded-2xl bg-yellow-400 flex items-center justify-center shadow-[0_10px_20px_rgba(250,204,21,0.2)]">
                      <span className="material-symbols-outlined text-black text-3xl font-black">
                        {transitData.type === 'mototaxi' ? 'motorcycle' : (transitData.type === 'carro' ? 'directions_car' : (transitData.type === 'van' ? 'airport_shuttle' : 'local_shipping'))}
                      </span>
                   </div>
                </div>
                <div className="flex-1">
                  <h4 className="text-2xl font-black text-white italic uppercase tracking-tighter leading-none mb-2">
                    {transitData.priority === 'turbo' ? 'Izi Turbo Flash' : 
                     transitData.priority === 'light' ? 'Izi Light Flash' :
                     transitData.priority === 'normal' ? 'Izi Express' :
                     transitData.priority === 'scheduled' ? 'Izi Agendado' :
                     transitData.subService === 'coleta' ? 'Click e Retire Izi' :
                     transitData.type === 'mototaxi' ? 'MotoTáxi IZI' : 
                     transitData.type === 'carro' ? 'Particular' : 
                     transitData.type === 'van' ? 'Van IZI Express' : 
                     transitData.type === 'utilitario' ? 'Izi Express' : 'Logística / Frete'}
                  </h4>
                  <div className="flex items-center gap-2">
                     <span className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-black text-zinc-500 uppercase tracking-widest border border-white/5">
                        {transitData.subService || transitData.vehicleCategory || 'Serviço Agendado'}
                     </span>
                  </div>
                </div>
             </div>
             
             <div className="mt-10 space-y-5">
                <div className="bg-black/20 rounded-[35px] p-6 space-y-4 shadow-[inset_4px_4px_15px_rgba(0,0,0,0.6)] border border-white/5">
                   <div className="flex justify-between items-center px-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Valor da Corrida</p>
                      <p className="text-sm font-black text-white italic tracking-tight shadow-sm">R$ {rawBase.toFixed(2).replace(".", ",")}</p>
                   </div>
                   
                   {serviceFeeAmount > 0 && (
                     <div className="flex justify-between items-center px-2 pt-2 border-t border-white/5">
                       <div className="flex flex-col">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">Taxa de Serviço</p>
                          <p className="text-[7px] text-yellow-400/50 font-black uppercase tracking-[0.2em] mt-1">Garantia & Suporte {serviceFee}%</p>
                       </div>
                       <p className="text-sm font-black text-white italic tracking-tight">R$ {serviceFeeAmount.toFixed(2).replace(".", ",")}</p>
                     </div>
                   )}
                </div>

                <div className="flex justify-between items-center bg-yellow-400 p-8 rounded-[40px] shadow-[0_25px_50px_rgba(250,204,21,0.25),inset_4px_4px_10px_rgba(255,255,255,0.5)] group-hover:scale-[1.03] transition-all relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                   <div className="flex flex-col relative z-10">
                      <p className="text-[11px] font-black text-black/40 uppercase tracking-[0.3em] leading-none mb-2">Total Final</p>
                      <div className="flex items-center gap-2">
                         <div className="size-1.5 rounded-full bg-black/20 animate-pulse" />
                         <p className="text-[8px] font-black text-black/60 uppercase tracking-widest leading-none">Pagamento via Izi Pay</p>
                      </div>
                   </div>
                   <p className="text-3xl font-black text-black italic tracking-tighter relative z-10">
                      R$ {price.toFixed(2).replace(".", ",")}
                   </p>
                </div>
             </div>
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] px-2 flex items-center gap-4">
            <span>Selecione a Forma</span>
            <div className="h-px flex-1 bg-white/5" />
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <PaymentMethodButton 
              id="cartao" 
              icon="credit_card" 
              label="Cartão via App" 
              sub={selectedCard ? `${selectedCard.brand} •••• ${selectedCard.last4}` : "Pague com segurança pelo App"}
              colorClass="text-blue-400"
            />

            <PaymentMethodButton 
              id="pix" 
              icon="pix" 
              label="PIX Instantâneo" 
              sub="Aprovação imediata via QR Code"
              colorClass="text-emerald-400"
            />

            <PaymentMethodButton 
              id="bitcoin_lightning" 
              icon="bolt" 
              label="Bitcoin Lightning" 
              sub="Pagamento instantâneo em Satoshis"
              colorClass="text-orange-400"
            />

            <PaymentMethodButton 
              id="saldo" 
              icon="account_balance_wallet" 
              label="Saldo Izi Pay" 
              sub={`R$ ${walletBalance.toFixed(2).replace(".", ",")} + ${iziCoins} coins`}
              colorClass="text-cyan-400"
              disabled={totalBalance < price}
            />

            <PaymentMethodButton 
              id="dinheiro" 
              icon="payments" 
              label="Dinheiro em Espécie" 
              sub="Pagamento direto no local"
              colorClass="text-zinc-600"
            />
          </div>
        </section>

        {/* Footer info */}
        <div className="flex flex-col items-center gap-6 pt-6 pb-20">
           <div className="flex items-center gap-4 group">
             <div className="size-10 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-700 shadow-inner group-hover:text-yellow-400 transition-all">
                <span className="material-symbols-outlined text-base">enhanced_encryption</span>
             </div>
             <p className="text-[9px] font-black text-zinc-700 uppercase tracking-[0.4em]">Proteção Izi Security • RSA 4096-bit</p>
           </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black to-transparent z-50">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleConfirmMobility(paymentMethod)}
          disabled={!paymentMethod}
          className="w-full bg-yellow-400 text-black font-black text-lg py-6 rounded-[35px] shadow-[0_20px_40px_rgba(250,204,21,0.3),inset_4px_4px_8px_rgba(255,255,255,0.4)] active:grayscale transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] pointer-events-none" />
          <span className="uppercase tracking-[0.3em] text-[13px] italic">Confirmar Solicitação</span>
          <span className="material-symbols-outlined font-black group-hover:translate-x-1 transition-transform text-2xl">bolt</span>
        </motion.button>
      </div>
    </div>
  );
};
