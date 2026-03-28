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
  // Brand Icon Resolver
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
      className={`relative w-full aspect-[1.6/1] rounded-[24px] border-2 transition-all p-8 flex flex-col justify-between cursor-pointer ${
        isDefault ? "border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.1)]" : "border-zinc-800 hover:border-zinc-700"
      } bg-transparent`}
    >
      {/* Top Section: Brand & Default Indicator */}
      <div className="flex justify-between items-start">
        <div className="h-8 grayscale">
          {getBrandIcon() ? (
            <img src={getBrandIcon() as string} alt={brand} className="h-full object-contain brightness-200" />
          ) : (
            <span className="material-symbols-outlined text-zinc-500">payments</span>
          )}
        </div>
        {isDefault && (
          <div className="bg-[#FFD700] text-black px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
            <span className="material-symbols-outlined text-[10px] font-black">check_circle</span>
            Principal
          </div>
        )}
      </div>

      {/* Middle: Card Number */}
      <div className="flex flex-col gap-2">
        <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.3em]">Card Number</p>
        <div className="flex items-center gap-4">
          <span className="flex gap-1">
            {[1, 2, 3].map(i => <span key={i} className="size-1.5 rounded-full bg-zinc-700" />)}
          </span>
          <span className="flex gap-1">
            {[1, 2, 3].map(i => <span key={i} className="size-1.5 rounded-full bg-zinc-700" />)}
          </span>
          <span className="flex gap-1">
            {[1, 2, 3].map(i => <span key={i} className="size-1.5 rounded-full bg-zinc-700" />)}
          </span>
          <span className="text-xl font-mono font-black text-white tracking-widest">{last4}</span>
        </div>
      </div>

      {/* Bottom: Expiry & Delete */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.2em]">Expires</p>
          <p className="text-white font-mono font-black text-sm">{expiry}</p>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete?.(id); }}
          className="size-10 rounded-xl bg-zinc-900/50 hover:bg-rose-500/10 hover:text-rose-500 text-zinc-600 transition-all flex items-center justify-center border border-zinc-800"
        >
          <span className="material-symbols-outlined text-lg">delete</span>
        </button>
      </div>
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
    <div className="fixed inset-0 z-[140] bg-[#000000] text-zinc-100 flex flex-col pt-safe overflow-hidden font-sans">
      {/* Header Premium Stealth */}
      <header className="sticky top-0 z-50 px-5 py-6 bg-black/80 backdrop-blur-2xl border-b border-zinc-900 flex items-center gap-6">
        <button 
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all text-white"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div>
          <h1 className="text-xl font-black text-white tracking-tight uppercase italic">Métodos de Pagamento</h1>
          <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em]">Sua carteira Izi Elite</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar px-6 pt-8 pb-32">
        {isLoading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-[#FFD700]/20 border-t-[#FFD700] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Pix Section */}
            <section className="space-y-4">
              <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] ml-2">Pagamento Instantâneo</p>
              <button className="w-full h-20 bg-zinc-900/40 border border-zinc-900 rounded-[24px] px-6 flex items-center justify-between hover:bg-zinc-900/60 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="size-10 rounded-2xl bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-[#FFD700]">qr_code_2</span>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-black text-white uppercase italic">Pagar via PIX</p>
                    <p className="text-[10px] font-bold text-zinc-600">Confirmação automática no App</p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-zinc-700 text-sm">chevron_right</span>
              </button>
            </section>

            {/* Cards Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between ml-2">
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em]">Cartões Salvos</p>
                <span className="text-[9px] font-black text-[#FFD700] bg-[#FFD700]/5 px-2 py-0.5 rounded-md border border-[#FFD700]/10 tracking-widest">{savedCards.length} Cards</span>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                  {savedCards.map((card) => (
                    <PaymentCard 
                      key={card.id}
                      id={card.id}
                      brand={card.brand}
                      last4={card.last4}
                      expiry={card.expiry || "12/28"}
                      isDefault={card.active}
                      onSetDefault={onSetDefault}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>

                {savedCards.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-900 rounded-[32px] gap-4">
                    <span className="material-symbols-outlined text-zinc-800 text-5xl">credit_card_off</span>
                    <p className="text-zinc-600 font-black text-[10px] uppercase tracking-widest">Nenhum cartão cadastrado</p>
                  </div>
                )}
              </div>
            </section>

            {/* Benefits Banner */}
            <div className="bg-gradient-to-br from-[#FFD700]/10 to-transparent p-6 rounded-[28px] border border-[#FFD700]/5 relative overflow-hidden group">
              <div className="relative z-10">
                <h4 className="text-[#FFD700] text-xs font-black uppercase tracking-widest mb-1 italic">Segurança Izi Elite</h4>
                <p className="text-zinc-500 text-[10px] leading-relaxed max-w-[80%] font-medium">Seus dados são protegidos por criptografia de ponta a ponta e camadas de segurança IZI Mastercard.</p>
              </div>
              <span className="absolute -right-4 -bottom-4 material-symbols-outlined text-6xl text-[#FFD700]/10 rotate-12 group-hover:rotate-0 transition-transform duration-700">security</span>
            </div>
          </div>
        )}
      </main>

      {/* Footer Addition Action */}
      <footer className="fixed bottom-0 left-0 w-full px-6 py-8 bg-gradient-to-t from-black via-black/95 to-transparent flex flex-col gap-4">
        <button 
          onClick={onAddCard}
          className="w-full bg-[#FFD700] text-black font-black py-5 rounded-[22px] shadow-[0_10px_30px_rgba(255,215,0,0.2)] active:scale-[0.98] transition-all flex items-center justify-center gap-3 uppercase text-sm tracking-widest"
        >
          <span className="material-symbols-outlined font-black">add_card</span>
          Adicionar Novo Cartão
        </button>
      </footer>
    </div>
  );
};
