import React from "react";


interface WalletViewProps {
  walletTransactions: any[];
  myOrders: any[];
  userXP: number;
  savedCards: any[];
  paymentMethod: string;
  setPaymentsOrigin: (origin: string) => void;
  setSubView: (view: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  walletTransactions,
  myOrders,
  userXP,
  savedCards,
  paymentMethod,
  setPaymentsOrigin,
  setSubView,
}) => {
  const walletBalance = walletTransactions.reduce(
    (acc: number, t: any) =>
      ["deposito", "reembolso"].includes(t.type) ? acc + Number(t.amount) : acc - Number(t.amount),
    0
  );

  const txIcon: Record<string, { icon: string; color: string }> = {
    deposito: { icon: "add_circle", color: "text-emerald-400" },
    reembolso: { icon: "refresh", color: "text-blue-400" },
    pagamento: { icon: "shopping_bag", color: "text-zinc-400" },
    saque: { icon: "arrow_outward", color: "text-red-400" },
  };

  const totalGasto = walletTransactions
    .filter((t: any) => t.type === "pagamento")
    .reduce((a: number, t: any) => a + Number(t.amount), 0);

  const totalRecebido = walletTransactions
    .filter((t: any) => ["deposito", "reembolso"].includes(t.type))
    .reduce((a: number, t: any) => a + Number(t.amount), 0);

  const pedidosMes = myOrders.filter((o: any) => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">
      {/* HERO SALDO */}
      <div className="px-5 pt-14 pb-8 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400 font-extrabold italic tracking-widest text-xs">IZI BLACK VIP</span>
          <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
        </div>
        <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase mb-1">Saldo Disponível</p>
        <div className="flex items-baseline gap-2 mb-6">
          <span className="font-extrabold text-2xl text-yellow-400 opacity-60">R$</span>
          <span
            className="font-extrabold text-5xl tracking-tighter text-white"
            style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}
          >
            {Math.abs(walletBalance).toFixed(2).replace(".", ",")}
          </span>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "add", label: "Adicionar" },
            { icon: "arrow_outward", label: "Transferir" },
            { icon: "history", label: "Extrato" },
            { icon: "qr_code_2", label: "Meu QR" },
          ].map((a) => (
            <button
              key={a.icon}
              className="flex flex-col items-center gap-2 py-4 active:scale-95 transition-all group"
            >
              <div className="size-12 rounded-2xl bg-zinc-900/60 border border-zinc-900 flex items-center justify-center group-hover:border-yellow-400/20 transition-all">
                <span className="material-symbols-outlined text-zinc-500 group-hover:text-yellow-400 transition-colors text-xl">
                  {a.icon}
                </span>
              </div>
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wider group-hover:text-zinc-400 transition-colors">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="px-5 py-8 space-y-10">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-0 border border-zinc-900 rounded-2xl overflow-hidden">
          {[
            { label: "Gasto total", value: `R$ ${totalGasto.toFixed(0)}`, icon: "shopping_bag" },
            { label: "Recebido", value: `R$ ${totalRecebido.toFixed(0)}`, icon: "add_circle" },
            { label: "Pedidos/mês", value: `${pedidosMes}`, icon: "receipt_long" },
          ].map((s, i) => (
            <div
              key={i}
              className={`flex flex-col items-center py-5 gap-1 ${i < 2 ? "border-r border-zinc-900" : ""}`}
            >
              <span className="material-symbols-outlined text-zinc-700 text-lg">{s.icon}</span>
              <p className="font-extrabold text-sm text-white">{s.value}</p>
              <p className="text-[9px] text-zinc-700 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* CARTÕES */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Meus Cartões</h2>
            <button
              onClick={() => {
                setPaymentsOrigin("profile");
                setSubView("payments");
              }}
              className="text-yellow-400 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              Gerenciar
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {/* Card IZI Digital */}
            <div
              className="min-w-[260px] h-40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between border border-zinc-900/80 shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(255,215,9,0.04) 0%, rgba(0,0,0,0) 100%)" }}
            >
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-yellow-400/5 rounded-full blur-2xl" />
              <div className="flex justify-between items-start">
                <span className="font-extrabold italic text-yellow-400/40 tracking-tighter">IZI</span>
                <span className="material-symbols-outlined text-zinc-800 text-base">contactless</span>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 mb-1">Cartão Digital</p>
                <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">•••• •••• •••• 8820</p>
                <div className="flex justify-between items-center">
                  <p className="text-[8px] text-zinc-700 uppercase tracking-widest">Val. 12/28</p>
                  <div className="size-7 rounded-full bg-yellow-400/10 flex items-center justify-center">
                    <span
                      className="material-symbols-outlined text-yellow-400 text-xs"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      bolt
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {savedCards.map((card: any) => (
              <div
                key={card.id}
                className="min-w-[260px] h-40 border border-zinc-900/80 rounded-2xl p-5 flex flex-col justify-between shrink-0"
              >
                <div className="flex justify-between items-start">
                  <span className="font-extrabold italic text-zinc-700 tracking-tighter">{card.brand}</span>
                  <span className="material-symbols-outlined text-zinc-800 text-base">contactless</span>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-700 mb-1">Cartão Físico</p>
                  <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">
                    •••• •••• •••• {card.last4}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] text-zinc-700 uppercase">{card.brand}</p>
                    <p className="text-[9px] text-zinc-600">Val. {card.expiry}</p>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setPaymentsOrigin("profile");
                setSubView("payments");
              }}
              className="min-w-[120px] h-40 border border-dashed border-zinc-900 rounded-2xl flex flex-col items-center justify-center gap-2 shrink-0 active:scale-95 transition-all hover:border-yellow-400/20 group"
            >
              <span className="material-symbols-outlined text-zinc-700 group-hover:text-yellow-400 transition-colors text-2xl">
                add
              </span>
              <span className="text-[9px] font-black text-zinc-700 uppercase tracking-wider group-hover:text-zinc-500 transition-colors">
                Novo Cartão
              </span>
            </button>
          </div>
        </section>

        {/* PONTOS E CASHBACK */}
        <div className="grid grid-cols-2 gap-0 border border-zinc-900 rounded-2xl overflow-hidden">
          <div className="flex flex-col gap-1 p-5 border-r border-zinc-900">
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="material-symbols-outlined text-yellow-400 text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                stars
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">IZI Points</span>
            </div>
            <p className="text-2xl font-extrabold text-white">{(userXP * 10).toLocaleString("pt-BR")}</p>
            <p className="text-[9px] text-yellow-400/50">
              ≈ R$ {(userXP * 0.1).toFixed(2).replace(".", ",")} em descontos
            </p>
          </div>
          <div className="flex flex-col gap-1 p-5">
            <div className="flex items-center gap-1.5 mb-2">
              <span
                className="material-symbols-outlined text-emerald-400 text-base"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance_wallet
              </span>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Cashback</span>
            </div>
            <p className="text-2xl font-extrabold text-white">R$ 42,10</p>
            <p className="text-[9px] text-zinc-700">Disponível para usar</p>
          </div>
        </div>

        {/* MÉTODOS DE PAGAMENTO */}
        <section>
          <h2 className="font-extrabold text-base text-white uppercase tracking-tight mb-2">Formas de Pagamento</h2>
          <div className="flex flex-col">
            {[
              { icon: "pix", label: "PIX", desc: "Mercado Pago • Instantâneo", id: "pix" },
              { icon: "bolt", label: "Bitcoin Lightning", desc: "LNbits • Satoshis", id: "bitcoin_lightning" },
              { icon: "payments", label: "Dinheiro", desc: "Pague na entrega", id: "dinheiro" },
              {
                icon: "account_balance_wallet",
                label: "Saldo IZI",
                desc: `R$ ${Math.abs(walletBalance).toFixed(2).replace(".", ",")} disponível`,
                id: "saldo",
              },
            ].map((m) => (
              <div key={m.id} className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0">
                <span className="material-symbols-outlined text-zinc-600 text-xl">{m.icon}</span>
                <div className="flex-1">
                  <p className="font-black text-sm text-white">{m.label}</p>
                  <p className="text-zinc-600 text-xs mt-0.5">{m.desc}</p>
                </div>
                <div
                  className={`size-2 rounded-full ${paymentMethod === m.id ? "bg-yellow-400" : "bg-zinc-800"}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* HISTÓRICO */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Histórico</h2>
            <button className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Ver Tudo</button>
          </div>
          <div className="flex flex-col">
            {walletTransactions.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3">
                <span className="material-symbols-outlined text-4xl text-zinc-900">receipt_long</span>
                <p className="text-zinc-700 text-sm">Nenhuma transação ainda</p>
              </div>
            ) : (
              walletTransactions.slice(0, 20).map((t: any, i: number) => {
                const tx = txIcon[t.type] || { icon: "payments", color: "text-zinc-400" };
                return (
                  <div key={t.id || i} className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0">
                    <span
                      className={`material-symbols-outlined text-xl ${tx.color}`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {tx.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate">{t.description || t.type}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest mt-0.5">
                        {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} •{" "}
                        {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-extrabold text-sm ${["deposito", "reembolso"].includes(t.type) ? "text-emerald-400" : "text-zinc-300"}`}
                      >
                        {["deposito", "reembolso"].includes(t.type) ? "+" : "-"} R${" "}
                        {Number(t.amount).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[9px] text-zinc-700 capitalize">{t.type}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};


