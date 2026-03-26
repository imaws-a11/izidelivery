import React, { useState, useRef } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";

interface WalletViewProps {
  walletTransactions: any[];
  myOrders: any[];
  userXP: number;
  savedCards: any[];
  paymentMethod: string;
  setPaymentsOrigin: (origin: string) => void;
  setSubView: (view: string) => void;
  userId: string | null;
  userName: string;
  showToast?: (msg: string, type: 'success' | 'error' | 'warning') => void;
  setShowDepositModal: (show: boolean) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  walletTransactions = [],
  myOrders = [],
  userXP = 0,
  savedCards = [],
  paymentMethod = "cartao",
  setPaymentsOrigin,
  setSubView,
  userId,
  userName,
  showToast,
  setShowDepositModal,
}) => {
  const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr">("main");
  const historyRef = useRef<HTMLElement>(null);

  // Estados para Transferência
  const [searchTarget, setSearchTarget] = useState("");
  const [recipient, setRecipient] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

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
    transferencia: { icon: "swap_horiz", color: "text-blue-400" },
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

  const handleSearchRecipient = async () => {
    if (!searchTarget.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("id, name, email, phone")
        .or(`email.eq.${searchTarget},phone.eq.${searchTarget}`)
        .not("id", "eq", userId)
        .single();

      if (error || !data) {
        showToast?.("Usuário não encontrado", "error");
        setRecipient(null);
      } else {
        setRecipient(data);
      }
    } catch (err) {
      showToast?.("Erro ao buscar usuário", "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfer = async () => {
    const val = Number(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) return showToast?.("Valor inválido", "error");
    if (val > walletBalance) return showToast?.("Saldo insuficiente", "error");
    if (!recipient) return;

    setIsTransferring(true);
    try {
      // 1. Débito no remetente
      const { error: err1 } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          amount: val,
          type: "pagamento",
          description: `Transferência enviada para ${recipient.name}`
        });

      if (err1) throw err1;

      // 2. Crédito no destinatário
      const { error: err2 } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: recipient.id,
          amount: val,
          type: "deposito",
          description: `Transferência recebida de ${userName}`
        });

      if (err2) throw err2;

      showToast?.("Transferência realizada com sucesso!", "success");
      setWalletMode("main");
      // Limpar estados
      setRecipient(null);
      setSearchTarget("");
      setAmount("");
    } catch (err) {
      showToast?.("Erro ao realizar transferência", "error");
    } finally {
      setIsTransferring(false);
    }
  };

  if (walletMode === "my_qr") {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 items-center text-center gap-10">
        <header className="w-full flex items-center justify-between mb-4">
          <button onClick={() => setWalletMode("main")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base uppercase tracking-widest">Meu QR</h1>
          <div className="size-10" />
        </header>
        <div className="bg-white p-6 rounded-3xl mt-10">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=izipay:${userId}`}
            alt="Izi Pay QR"
            className="size-56"
          />
        </div>
        <div className="space-y-1">
          <p className="font-black text-2xl uppercase">{userName || "USUARIO IZI"}</p>
          <p className="text-zinc-600 text-xs tracking-wider">Escaneie para transferir saldo interno</p>
        </div>
        <button onClick={() => setWalletMode("main")} className="w-full py-4 bg-zinc-900 rounded-2xl font-black uppercase text-sm mt-10">Fechar</button>
      </div>
    );
  }

  if (walletMode === "transfer") {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 gap-8">
        <header className="w-full flex items-center justify-between">
          <button onClick={() => { setWalletMode("main"); setRecipient(null); }} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base uppercase tracking-widest">Enviar Saldo</h1>
          <div className="size-10" />
        </header>

        <AnimatePresence mode="wait">
          {!recipient ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Destinatário</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="E-mail ou Telefone"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:border-yellow-400/50 outline-none transition-all font-bold"
                  />
                  <button 
                    onClick={handleSearchRecipient}
                    disabled={isSearching}
                    className="size-14 bg-yellow-400 rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-50"
                  >
                    {isSearching ? <div className="size-5 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <span className="material-symbols-outlined text-black">search</span>}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="flex items-center gap-4 bg-zinc-900/50 p-5 rounded-3xl border border-zinc-800">
                <div className="size-14 rounded-full bg-yellow-400 flex items-center justify-center font-black text-black text-xl">
                  {recipient.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-black uppercase">{recipient.name}</p>
                  <p className="text-zinc-600 text-xs">{recipient.email || recipient.phone}</p>
                </div>
                <button onClick={() => setRecipient(null)} className="text-xs font-bold text-zinc-500 underline">Trocar</button>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center block">Quanto deseja enviar?</label>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-yellow-400">R$</span>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-5xl font-black text-white outline-none w-40 text-center"
                  />
                </div>
                <p className="text-center text-xs text-zinc-700">Saldo disponível: R$ {walletBalance.toFixed(2).replace(".", ",")}</p>
              </div>

              <button 
                onClick={handleTransfer}
                disabled={isTransferring || !amount}
                className="w-full py-5 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest shadow-[0_10px_30px_rgba(255,215,9,0.2)] active:scale-95 disabled:opacity-50 transition-all"
              >
                {isTransferring ? "Processando..." : "Confirmar Envio"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">
      {/* HERO SALDO */}
      <div className="px-5 pt-14 pb-8 border-b border-zinc-900">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-yellow-400 font-extrabold italic tracking-[0.3em] text-[10px] uppercase">Izi Pay</span>
          <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
        </div>
        <div className="flex justify-between items-start">
          <div>
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
          </div>
          <button onClick={() => setShowDepositModal(true)} className="px-4 py-2 bg-zinc-900 rounded-full text-[10px] font-black uppercase tracking-widest border border-zinc-800 active:scale-95">Recarregar</button>
        </div>

        {/* AÇÕES RÁPIDAS */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { icon: "qr_code_scanner", label: "Escanear", action: () => showToast?.("Leitor em desenvolvimento", "warning") },
            { icon: "arrow_outward", label: "Enviar", action: () => setWalletMode("transfer") },
            { icon: "history", label: "Extrato", action: () => historyRef.current?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: "qr_code_2", label: "Meu QR", action: () => setWalletMode("my_qr") },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
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
        <section ref={historyRef}>
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


