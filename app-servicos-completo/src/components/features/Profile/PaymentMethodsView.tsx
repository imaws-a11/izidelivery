import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PaymentCardProps {
  id: string;
  brand: "Visa" | "Mastercard" | "Amex" | string;
  last4: string;
  expiry: string;
  isDefault?: boolean;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  id,
  brand,
  last4,
  expiry,
  isDefault,
  onSetDefault,
  onDelete,
}) => {
  const getBrandIcon = () => {
    const b = brand.toLowerCase();
    if (b.includes("visa")) return "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";
    if (b.includes("master")) return "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg";
    if (b.includes("amex")) return "https://upload.wikimedia.org/wikipedia/commons/3/30/American_Express_logo.svg";
    return undefined;
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => onSetDefault?.(id)}
      className={`relative w-full aspect-[1.6/1] rounded-[40px] transition-all p-8 flex flex-col justify-between cursor-pointer italic overflow-hidden
        ${isDefault 
          ? "bg-yellow-400 text-black shadow-[15px_15px_30px_rgba(250,204,21,0.15),inset_6px_6px_12px_rgba(255,255,255,0.7),inset_-6px_-6px_10px_rgba(0,0,0,0.1)]" 
          : "bg-[#111111] border-2 border-white/5 text-white shadow-[15px_15px_30px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.5)]"
        }`}
    >
      <div className="flex justify-between items-start z-10">
        <div className={`h-8 ${isDefault ? "brightness-0 opacity-80" : "grayscale brightness-200"}`}>
          {getBrandIcon() ? (
            <img src={getBrandIcon() as string} alt={brand} className="h-full object-contain" />
          ) : (
            <span className={`material-symbols-outlined ${isDefault ? "text-black" : "text-zinc-500"}`}>payments</span>
          )}
        </div>
        {isDefault && (
          <div className="bg-black text-yellow-400 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg">
            <span className="material-symbols-outlined text-xs font-black">verified</span>
            PRINCIPAL
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 z-10">
        <p className={`${isDefault ? "text-black/40" : "text-zinc-600"} text-[9px] font-black uppercase tracking-[0.4em]`}>IZI DIGITAL CARD</p>
        <div className="flex items-center gap-5 mt-1">
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => <span key={i} className={`size-1.5 rounded-full ${isDefault ? "bg-black/20" : "bg-zinc-800"}`} />)}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => <span key={i} className={`size-1.5 rounded-full ${isDefault ? "bg-black/20" : "bg-zinc-800"}`} />)}
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3].map(i => <span key={i} className={`size-1.5 rounded-full ${isDefault ? "bg-black/20" : "bg-zinc-800"}`} />)}
          </div>
          <span className={`text-2xl font-black ${isDefault ? "text-black" : "text-white"} tracking-[0.2em]`}>{last4}</span>
        </div>
      </div>

      <div className="flex justify-between items-end z-10">
        <div className="flex flex-col gap-1">
          <p className={`${isDefault ? "text-black/30" : "text-zinc-700"} text-[8px] font-black uppercase tracking-[0.2em]`}>Validade</p>
          <p className={`${isDefault ? "text-black" : "text-zinc-300"} font-black text-sm tracking-widest`}>{expiry}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
          className={`size-12 rounded-[22px] flex items-center justify-center transition-all border
            ${isDefault 
              ? "bg-black/5 border-black/5 text-black/40 hover:bg-black/10" 
              : "bg-black/20 border-white/5 text-zinc-600 hover:text-rose-500"
            }`}
        >
          <span className="material-symbols-outlined text-xl">delete</span>
        </button>
      </div>
      
      {/* Decorative Glow */}
      <div className={`absolute -right-16 -top-16 size-48 rounded-full blur-[80px] pointer-events-none 
        ${isDefault ? "bg-white/40" : "bg-yellow-400/5"}`} />
    </motion.div>
  );
};

interface PaymentMethodsViewProps {
  savedCards: any[];
  onBack: () => void;
  onAddCard: () => void;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const PaymentMethodsView: React.FC<PaymentMethodsViewProps> = ({
  savedCards,
  onBack,
  onAddCard,
  onSetDefault,
  onDelete,
  isLoading,
}) => {
  return (
    <div className="fixed inset-0 z-[140] bg-black text-zinc-100 flex flex-col pt-safe overflow-hidden">
      {/* Header Premium Claymorphism */}
      <header className="sticky top-0 z-50 px-5 py-8 bg-black/80 backdrop-blur-2xl border-b border-zinc-900/40 flex items-center gap-6 italic">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-[22px] bg-[#161616] border-2 border-white/5 flex items-center justify-center active:scale-90 transition-all text-white shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]"
        >
          <span className="material-symbols-outlined font-black">arrow_back_ios_new</span>
        </button>
        <div>
          <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic leading-none">IZI <span className="text-yellow-400">PAY</span></h1>
          <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] mt-1">Smart Wallet</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-10 pb-40 italic">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="size-10 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin shadow-[0_0_20px_rgba(250,204,21,0.2)]" />
          </div>
        ) : (
          <div className="space-y-12">
            {/* Quick Actions / Pix */}
            <section className="space-y-6">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Fluxo de Caixa</p>
              <button className="w-full h-24 p-6 rounded-[35px] bg-[#0c0c0c] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_4px_4px_8px_rgba(255,255,255,0.02)]">
                <div className="flex items-center gap-5">
                  <div className="size-14 rounded-3xl bg-zinc-900 flex items-center justify-center border border-white/5 shadow-inner">
                    <span className="material-symbols-outlined text-yellow-400 text-2xl font-black">qr_code_2</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase tracking-tight">Recarregar via PIX</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">Crédito imediato</p>
                  </div>
                </div>
                <div className="size-10 rounded-full bg-zinc-950 flex items-center justify-center border border-white/5">
                   <span className="material-symbols-outlined text-zinc-800 text-lg group-hover:text-yellow-400 transition-colors">arrow_forward</span>
                </div>
              </button>
            </section>

            {/* Cards Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between ml-2">
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Carteira de Crédito</p>
                <span className="text-[9px] font-black text-yellow-400 bg-yellow-400/5 px-3 py-1 rounded-full border border-yellow-400/10 tracking-[0.2em]">{savedCards.length} SLOTS</span>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                <AnimatePresence>
                  {savedCards.map((card) => (
                    <PaymentCard 
                      key={card.id}
                      id={card.id}
                      brand={card.brand}
                      last4={card.last4}
                      expiry={card.expiry || "12/28"}
                      isDefault={card.is_default || card.active}
                      onSetDefault={onSetDefault}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>

                {savedCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-[#0a0a0a] border-2 border-zinc-900/50 rounded-[50px] gap-6 shadow-inner">
                    <div className="size-20 rounded-[35px] bg-zinc-950 border border-white/5 flex items-center justify-center">
                        <span className="material-symbols-outlined text-zinc-800 text-4xl">credit_card_off</span>
                    </div>
                    <p className="text-zinc-600 font-black text-[10px] uppercase tracking-[0.3em]">Vazio em sua rede</p>
                  </div>
                )}
              </div>
            </section>

            {/* Security Protocol */}
            <div className="bg-[#111111] border-2 border-white/5 p-10 rounded-[55px] flex flex-col items-center text-center gap-8 shadow-[20px_20px_40px_rgba(0,0,0,0.4),inset_5px_5px_10px_rgba(255,255,255,0.02)] relative overflow-hidden italic">
               <div className="absolute top-0 right-0 size-40 bg-yellow-400/5 blur-[80px] rounded-full" />
               <div className="size-20 rounded-[35px] bg-yellow-400 flex items-center justify-center shadow-[0_15px_30px_rgba(250,204,21,0.2),inset_4px_4px_10px_rgba(255,255,255,0.8)] relative z-10">
                  <span className="material-symbols-outlined text-4xl text-black font-black">security</span>
               </div>
               <div className="space-y-3 relative z-10">
                  <h3 className="text-white font-black text-lg uppercase tracking-widest leading-none">Smart Secured</h3>
                  <p className="text-zinc-600 text-xs font-medium px-4 leading-relaxed italic">Dados blindados por criptografia de ponta a ponta em hardware isolado.</p>
               </div>
               <div className="px-6 py-2 rounded-full bg-black/40 border border-white/5 shadow-inner">
                  <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.5em]">PCI COMPLIANT LEVEL 1</p>
               </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Addition Action */}
      <footer className="fixed bottom-0 left-0 w-full px-6 py-10 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col gap-4">
        <button 
          onClick={onAddCard}
          className="w-full bg-yellow-400 text-black font-black py-6 rounded-[28px] shadow-[0_15px_35px_rgba(250,204,21,0.2),inset_6px_6px_12px_rgba(255,255,255,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase text-sm tracking-[0.2em] italic"
        >
          <span className="material-symbols-outlined font-black text-2xl">add_card</span>
          Novo Cartão Digital
        </button>
      </footer>
    </div>
  );
};
