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
      <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-6 border-b border-zinc-900/60 backdrop-blur-xl">
        <button onClick={() => setSubView(paymentsOrigin === "checkout" ? "checkout" : "profile")}
          className="size-11 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-zinc-300">arrow_back</span>
        </button>
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-tighter italic">Pagamentos</h1>
          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Cartões e Métodos</p>
        </div>
      </header>

      <main className="px-5 py-8 space-y-10">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Cartões de Crédito</h2>
            <button className="text-yellow-400 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity">Novo +</button>
          </div>
          <div className="flex flex-col gap-4">
            {savedCards.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-4 bg-zinc-900/20 border border-zinc-900/50 rounded-[40px]">
                <span className="material-symbols-outlined text-4xl text-zinc-800">credit_card_off</span>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest text-center px-10">Nenhum cartão cadastrado em sua conta IZI</p>
              </div>
            ) : savedCards.map((card: any, idx) => (
              <motion.div key={card.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                className="group p-5 rounded-[40px] border border-zinc-900/60 transition-all cursor-pointer bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-800 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none" />
                <div className="flex items-center gap-5">
                  <div className="size-14 rounded-2xl bg-zinc-900 flex items-center justify-center border border-white/5">
                    <span className="material-symbols-outlined text-zinc-300 text-2xl">{card.brand === 'Mastercard' ? 'credit_card' : 'credit_card'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-white text-base uppercase tracking-tight mb-1">{card.brand} •••• {card.last4}</h4>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Validade {card.expiry}</p>
                  </div>
                  <button className="size-8 rounded-full bg-zinc-900 text-zinc-700 flex items-center justify-center hover:bg-zinc-800 transition-all">
                    <span className="material-symbols-outlined text-sm">more_vert</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Outros Métodos</h2>
          <div className="flex flex-col gap-3">
            {[
              { id: 'pix', label: 'PIX Instantâneo', icon: 'pix', desc: 'Sua chave já está salva' },
              { id: 'btc', label: 'Bitcoin Lightning', icon: 'bolt', desc: 'Pagamento via WebLN' },
              { id: 'wallet', label: 'Saldo IZI Wallet', icon: 'wallet', desc: 'R$ 1.250,50 disponível' },
            ].map(m => (
              <div key={m.id} className="p-6 rounded-[32px] bg-zinc-900/10 border border-zinc-900/40 flex items-center gap-5 hover:bg-zinc-900 transition-all group cursor-pointer">
                <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-all text-xl">{m.icon}</span>
                <div className="flex-1">
                   <h4 className="text-zinc-400 font-black text-[11px] uppercase tracking-widest">{m.label}</h4>
                   <p className="text-[10px] text-zinc-700 font-bold uppercase tracking-tight">{m.desc}</p>
                </div>
                <span className="material-symbols-outlined text-zinc-900 text-lg">chevron_right</span>
              </div>
            ))}
          </div>
        </section>

        <div className="bg-yellow-400/5 border border-yellow-400/10 p-8 rounded-[40px] flex flex-col items-center text-center gap-6">
           <div className="size-16 rounded-full bg-yellow-400/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl text-yellow-500">lock</span>
           </div>
           <div className="space-y-2">
              <h3 className="text-white font-black text-sm uppercase tracking-widest">Pagamento 100% Seguro</h3>
              <p className="text-zinc-600 text-xs px-2">Suas informações de pagamento são criptografadas e nunca ficam salvas em nossos servidores de borda.</p>
           </div>
           <p className="text-[8px] text-zinc-800 font-black uppercase tracking-[0.3em]">PCI DSS COMPLIANT • SSL SECURED</p>
        </div>
      </main>
    </div>
  );
};
