import React from "react";
import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";

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
}) => {
  const bv = marketConditions.settings.baseValues;
  const basePrices: Record<string, number> = { 
    mototaxi: bv.mototaxi_min, 
    carro: bv.carro_min, 
    van: bv.van_min, 
    utilitario: bv.utilitario_min 
  };
  
  const isShippingService = ['utilitario', 'van', 'frete'].includes(transitData.type);
  const rawPrice = (transitData.estPrice > 0 ? transitData.estPrice : calculateDynamicPrice(basePrices[transitData.type] || bv.mototaxi_min)) ?? 0;
  const price = (isIziBlackMembership && isShippingService) ? 0 : rawPrice;

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
            : 'bg-zinc-900 border-white/5 hover:border-white/10 shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.03)]'}
        `}
      >
        <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-500
          ${isSelected ? 'bg-black/10' : `bg-zinc-800 shadow-inner ${colorClass}`}
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
    <div className="absolute inset-0 z-[115] bg-black/95 backdrop-blur-3xl flex flex-col hide-scrollbar overflow-y-auto italic">
      <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-md px-8 py-10 flex items-center gap-6 border-b border-white/5">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (transitData.type === 'van') navigateSubView("van_wizard");
            else if (transitData.type === 'utilitario') navigateSubView("shipping_details");
            else if (transitData.type === 'frete') navigateSubView("freight_wizard");
            else navigateSubView("taxi_wizard");
          }} 
          className="size-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-white shadow-xl active:scale-90 transition-all"
        >
          <span className="material-symbols-outlined text-lg font-black">arrow_back_ios_new</span>
        </motion.button>
        <div className="flex flex-col text-left">
          <h2 className="text-2xl font-black text-white tracking-tighter leading-none uppercase italic">Finalizar</h2>
          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-2 opacity-80">Método de Pagamento</p>
        </div>
      </header>

      <div className="flex-1 px-8 py-10 space-y-12 pb-8">
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em]">Resumo do Valor</h3>
            <div className="px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 shadow-inner">
              <span className="text-xs font-black text-yellow-400 italic">R$ {price.toFixed(2).replace(".", ",")}</span>
            </div>
          </div>
          
          <div className="bg-zinc-900 border border-white/5 rounded-[45px] p-8 shadow-[25px_25px_50px_rgba(0,0,0,0.6),inset_4px_4px_10px_rgba(255,255,255,0.05)] relative overflow-hidden group transition-all">
             <div className="absolute top-0 right-0 size-48 bg-yellow-400/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
             <div className="flex items-center gap-5">
                <div className="size-16 rounded-3xl bg-zinc-800 flex items-center justify-center border border-white/5 shadow-inner">
                  <span className="material-symbols-outlined text-yellow-400 text-3xl font-black">
                    {transitData.type === 'mototaxi' ? 'motorcycle' : transitData.type === 'carro' ? 'directions_car' : transitData.type === 'van' ? 'airport_shuttle' : 'local_shipping'}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-black text-white italic uppercase tracking-tighter leading-none">
                    {transitData.type === 'mototaxi' ? 'MotoTáxi IZI' : transitData.type === 'carro' ? 'Particular' : transitData.type === 'van' ? 'Van IZI Express' : 'Caminhão Frete'}
                  </h4>
                  <p className="text-[9px] font-black text-yellow-400/60 uppercase tracking-[0.3em] mt-2">{transitData.vehicleCategory || 'Serviço sob demanda'}</p>
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
              label="Saldo IZI Wallet" 
              sub={`R$ ${walletBalance.toFixed(2).replace(".", ",")} disponível`}
              colorClass="text-cyan-400"
              disabled={walletBalance < price}
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
        <div className="flex flex-col items-center gap-6 pt-6 pb-28">
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
