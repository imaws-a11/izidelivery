import React from 'react';
import { motion } from 'framer-motion';

interface PaymentsViewProps {
  paymentsOrigin: string;
  savedCards: any[];
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  toastSuccess: (msg: string) => void;
}

export const PaymentsView: React.FC<PaymentsViewProps> = ({
  paymentsOrigin,
  savedCards,
  setSubView,
  navigateSubView,
  toastSuccess
}) => {
  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-2xl flex items-center justify-between px-5 py-8 border-b border-zinc-900/40 italic">
        <div className="flex items-center gap-4">
          <button onClick={() => setSubView(paymentsOrigin === "checkout" ? "checkout" : "profile")}
            className="size-12 rounded-[22px] bg-[#1a1a1a] border-2 border-white/5 flex items-center justify-center active:scale-90 transition-all shadow-[8px_8px_16px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.05)]">
            <span className="material-symbols-outlined text-zinc-300 font-black">arrow_back</span>
          </button>
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">IZI <span className="text-yellow-400">PAY</span></h1>
            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.4em] mt-1">Sessão Segura</p>
          </div>
        </div>
        <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
           <span className="material-symbols-outlined text-emerald-500 text-xl font-black animate-pulse">check_circle</span>
        </div>
      </header>

      <main className="px-5 py-10 space-y-12">
        {/* CARTÕES DE CRÉDITO - CLAYMORPHISM */}
        <section>
          <div className="flex items-center justify-between mb-8 px-2">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic">Meus Cartões</h2>
            <button className="px-4 py-2 rounded-2xl bg-zinc-900 text-yellow-400 text-[10px] font-black uppercase tracking-widest border border-white/5 shadow-lg active:scale-95 transition-all">Adicionar +</button>
          </div>
          
          <div className="flex flex-col gap-6">
            {savedCards.length === 0 ? (
              <div className="py-24 flex flex-col items-center gap-6 bg-[#0a0a0a] border-2 border-zinc-900/50 rounded-[50px] shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
                <div className="size-20 rounded-[35px] bg-zinc-950 border border-white/5 flex items-center justify-center shadow-xl">
                    <span className="material-symbols-outlined text-5xl text-zinc-900">credit_card_off</span>
                </div>
                <div className="text-center space-y-2 relative z-10 px-10">
                    <p className="text-white font-black text-sm uppercase tracking-widest">Nenhum Cartão</p>
                    <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Conecte um método de pagamento para acelerar seus pedidos.</p>
                </div>
              </div>
            ) : savedCards.map((card: any, idx) => (
              <motion.div 
                key={card.id} 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: idx * 0.1 }}
                className={`group p-8 rounded-[45px] relative overflow-hidden flex flex-col justify-between h-56 transition-all cursor-pointer active:scale-[0.98] italic
                  ${idx === 0 
                    ? "bg-yellow-400 text-black shadow-[15px_15px_30px_rgba(250,204,21,0.15),inset_6px_6px_12px_rgba(255,255,255,0.7),inset_-6px_-6px_10px_rgba(0,0,0,0.1)]" 
                    : "bg-[#161616] border-2 border-white/5 text-white shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.5)]"
                  }`}
              >
                <div className="flex justify-between items-start z-10">
                  <div className="flex flex-col">
                    <span className={`font-black text-2xl tracking-tighter leading-none ${idx === 0 ? "text-black" : "text-white"}`}>{card.brand}</span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.4em] mt-2 ${idx === 0 ? "text-black/40" : "text-zinc-600"}`}>
                      {idx === 0 ? "Cartã³ de CrÃ©dito Destaque" : "Cartão Secundário"}
                    </span>
                  </div>
                  <div className={`size-12 rounded-[22px] flex items-center justify-center border transition-all
                    ${idx === 0 ? "bg-black/5 border-black/5 shadow-inner" : "bg-black/20 border-white/5 shadow-lg"}`}>
                    <span className={`material-symbols-outlined text-2xl ${idx === 0 ? "text-black/80" : "text-zinc-400"}`} style={{ fontVariationSettings: "'FILL' 1" }}>wifi_tethering</span>
                  </div>
                </div>

                <div className="z-10">
                   <p className={`font-black text-2xl tracking-[0.25em] mb-4 ${idx === 0 ? "text-black" : "text-white"}`}>•••• •••• •••• {card.last4}</p>
                   <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className={`text-[8px] font-black uppercase tracking-widest ${idx === 0 ? "text-black/30" : "text-zinc-600"}`}>Expiração</p>
                        <p className={`text-xs font-black uppercase leading-none ${idx === 0 ? "text-black" : "text-zinc-400"}`}>{card.expiry}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2 
                        ${idx === 0 ? "bg-black text-yellow-400" : "bg-white/5 border border-white/5 text-zinc-500"}`}>
                        <span className="material-symbols-outlined text-base">verified</span>
                        ATIVO
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* OUTROS MÉTODOS - CLAYMORPHISM */}
        <section className="space-y-8 italic">
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] px-2">Gateway Híbrido</h2>
          <div className="grid grid-cols-1 gap-4">
            {[
              { id: 'pix', label: 'PIX Instantâneo', icon: 'pix', desc: 'Transferência Imediata MP', color: 'text-emerald-400' },
              { id: 'btc', label: 'Bitcoin Lightning', icon: 'bolt', desc: 'Satoshi Stream v2.4', color: 'text-orange-400' },
              { id: 'wallet', label: 'Izi Wallet', icon: 'wallet', desc: 'Saldo Nativa Disponível', color: 'text-yellow-400' },
            ].map((m, i) => (
              <button key={m.id} className="p-6 rounded-[35px] bg-[#0c0c0c] border border-white/5 flex items-center gap-6 hover:bg-[#111111] active:scale-[0.98] transition-all group shadow-[10px_10px_20px_rgba(0,0,0,0.3),inset_4px_4px_8px_rgba(255,255,255,0.02)]">
                <div className="size-14 rounded-3xl bg-zinc-900 flex items-center justify-center border border-white/5 shadow-inner transition-transform group-hover:scale-110">
                  <span className={`material-symbols-outlined ${m.color} text-2xl font-black`}>{m.icon}</span>
                </div>
                <div className="flex-1 text-left">
                   <h4 className="text-white font-black text-sm uppercase tracking-tight">{m.label}</h4>
                   <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">{m.desc}</p>
                </div>
                <div className="size-10 rounded-full bg-zinc-950 flex items-center justify-center border border-white/5">
                   <span className="material-symbols-outlined text-zinc-800 text-lg group-hover:text-yellow-400 transition-colors">arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* SECURITY CLAY CARD */}
        <div className="bg-[#111111] border-2 border-white/5 p-10 rounded-[55px] flex flex-col items-center text-center gap-8 shadow-[20px_20px_40px_rgba(0,0,0,0.4),inset_5px_5px_10px_rgba(255,255,255,0.02)] relative overflow-hidden italic">
           <div className="absolute top-0 right-0 size-40 bg-yellow-400/5 blur-[80px] rounded-full" />
           <div className="size-20 rounded-[35px] bg-yellow-400 flex items-center justify-center shadow-[0_15px_30px_rgba(250,204,21,0.2),inset_4px_4px_10px_rgba(255,255,255,0.8)] relative z-10">
              <span className="material-symbols-outlined text-4xl text-black font-black">security</span>
           </div>
           <div className="space-y-3 relative z-10">
              <h3 className="text-white font-black text-lg uppercase tracking-widest leading-none">Security Protocol v4</h3>
              <p className="text-zinc-600 text-xs font-medium px-4 leading-relaxed">Sua segurança é nossa obsessão. Todos os dados são processados em hardware isolado e criptografados em repouso.</p>
           </div>
           <div className="px-6 py-2 rounded-full bg-black/40 border border-white/5 shadow-inner">
              <p className="text-[8px] text-zinc-700 font-black uppercase tracking-[0.5em]">PCI COMPLIANT LEVEL 1</p>
           </div>
        </div>
      </main>
    </div>
  );
};
