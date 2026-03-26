import React from 'react';
import { motion } from 'framer-motion';

interface LightningPaymentViewProps {
  selectedItem: any;
  setSubView: (view: any) => void;
  setTab: (tab: string) => void;
  toastSuccess: (msg: string) => void;
}

export const LightningPaymentView: React.FC<LightningPaymentViewProps> = ({
  selectedItem,
  setSubView,
  setTab,
  toastSuccess
}) => {
  const invoice = selectedItem?.lightningInvoice || "";
  const satoshis = selectedItem?.satoshis || 0;
  const btcPrice = selectedItem?.btcPrice || 0;

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-10">
      <header className="sticky top-0 z-50 bg-black flex items-center gap-4 px-5 py-4 border-b border-zinc-900">
        <button onClick={() => setSubView("checkout")} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
          <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
        </button>
        <h1 className="text-lg font-black text-white uppercase tracking-tight">Bitcoin Lightning</h1>
      </header>
      <main className="px-5 pt-8 flex flex-col items-center gap-6 max-w-sm mx-auto w-full">
        <div className="text-center space-y-1">
          <div className="size-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-3">
            <span className="material-symbols-outlined text-3xl text-orange-400" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Total em Satoshis</p>
          <p className="text-3xl font-black text-white">{satoshis.toLocaleString("pt-BR")} sats</p>
          {btcPrice > 0 && <p className="text-zinc-500 text-xs">1 BTC = R$ {btcPrice.toLocaleString("pt-BR")}</p>}
        </div>

        {invoice && !selectedItem?.lightningError ? (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center gap-4">
            <div className="w-52 h-52 bg-white rounded-3xl flex items-center justify-center p-3 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
              <img
                src={"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodeURIComponent(invoice)}
                alt="Lightning QR"
                className="w-full h-full rounded-2xl"
              />
            </div>
            <div className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-3">
              <p className="text-zinc-400 text-xs font-mono truncate flex-1">{invoice.slice(0, 40)}...</p>
              <button onClick={() => { navigator.clipboard.writeText(invoice); toastSuccess("Invoice copiada!"); }}
                className="text-orange-400 active:scale-90 transition-all shrink-0">
                <span className="material-symbols-outlined text-lg">content_copy</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2 bg-orange-400 rounded-full animate-pulse" />
              <p className="text-zinc-500 text-xs font-black uppercase tracking-wider">Aguardando pagamento Lightning...</p>
            </div>
            <button onClick={() => { setTab("orders"); setSubView("none"); }}
              className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-800 text-zinc-400 hover:border-orange-400/30 hover:text-orange-400 transition-all active:scale-95">
              Ver Meus Pedidos
            </button>
          </motion.div>
        ) : selectedItem?.lightningError ? (
          <div className="w-full flex flex-col items-center gap-6 text-center py-6">
             <div className="size-20 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-2">
                <span className="material-symbols-outlined text-4xl text-orange-500">bolt_slash</span>
             </div>
             <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Falha na Conexão Lightning</h3>
             <p className="text-zinc-500 text-sm px-4">Não foi possível gerar sua fatura agora. O pedido foi registrado mas o pagamento via Bitcoin está indisponível.</p>
             <button onClick={() => { setTab("orders"); setSubView("none"); }}
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest">
                Ver Meus Pedidos
             </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-8">
            <div className="size-10 border-2 border-orange-400/20 border-t-orange-400 rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">Gerando invoice Lightning...</p>
          </div>
        )}
      </main>
    </div>
  );
};
