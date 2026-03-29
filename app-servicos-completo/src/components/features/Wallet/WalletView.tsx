import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Html5QrcodeScanner } from "html5-qrcode";

// Wrapper Component para o Leitor de QR Code usando Html5QrcodeScanner
const ScannerWrapper = ({ onResult }: { onResult: (text: string) => void }) => {
  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    html5QrcodeScanner.render(
      (decodedText: string) => {
        onResult(decodedText);
        html5QrcodeScanner.clear().catch(() => {});
      },
      (error: any) => { /* ignore logs freq. */ }
    );

    return () => {
      html5QrcodeScanner.clear().catch(() => {}); // cleanup no unmount
    };
  }, [onResult]);

  return (
    <div className="w-full flex flex-col items-center">
      <div id="reader" className="w-full max-w-[300px] rounded-3xl overflow-hidden bg-black" style={{ border: "none" }} />
      <style>{`
        #reader__scan_region { background: #18181b; }
        #reader__dashboard_section_csr button { background: #facc15; color: #000; border-radius: 999px; font-weight: 900; padding: 10px 20px; text-transform: uppercase; font-size: 10px; margin-top: 10px; }
        #reader { border: none !important; }
      `}</style>
      <p className="text-zinc-500 text-xs font-bold w-3/4 max-w-sm mx-auto uppercase tracking-widest text-center mt-6">Aproxime a câmera do QR Code</p>
    </div>
  );
};


interface WalletViewProps {
  walletTransactions: any[];
  myOrders: any[];
  userXP: number;
  iziCoins: number;
  iziCashback: number;
  savedCards: any[];
  paymentMethod: string;
  setPaymentsOrigin: (origin: 'checkout' | 'profile' | 'izi_black') => void;
  setSubView: (view: string) => void;
  userId: string | null;
  userName: string;
  showToast?: (msg: string, type: 'success' | 'error' | 'warning') => void;
  setShowDepositModal: (show: boolean) => void;
  iziCoinValue?: number;
  iziCoinRate?: number;
}

export const WalletView: React.FC<WalletViewProps> = ({
  walletTransactions = [],
  myOrders = [],
  iziCoins = 0,
  iziCashback = 0,
  savedCards = [],
  paymentMethod = "cartao",
  setPaymentsOrigin,
  setSubView,
  userId,
  userName,
  showToast,
  setShowDepositModal,
  iziCoinValue = 0.01,
}) => {
  const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr" | "scan" | "add_card">("main");
  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [isSavingCard, setIsSavingCard] = useState(false);
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

  const handleSearchRecipient = async (query = searchTarget) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchTarget(query);
    try {
      const { data, error } = await supabase
        .from("users_delivery")
        .select("id, name, email, phone")
        .or(`email.eq.${query},phone.eq.${query},id.eq.${query}`)
        .not("id", "eq", userId)
        .single();

      if (error || !data) {
        showToast?.("Usuário não encontrado, Tente usar o código identificador", "warning");
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
          description: `Transferência IZI de ${userName}`
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

  if (walletMode === "scan") {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 items-center text-center gap-10">
        <header className="w-full flex items-center justify-between mb-4">
          <button onClick={() => setWalletMode("main")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base uppercase tracking-widest">Escanear QR</h1>
          <div className="size-10" />
        </header>

        <ScannerWrapper 
          onResult={(text) => {
             // O QR Code pode vir "izipay:ID_DO_USUARIO_OU_LOJISTA" ou o id puro
             const idText = text.replace("izipay:", "").trim();
             // Pula pro transfer com busca ativada
             setWalletMode("transfer");
             handleSearchRecipient(idText); // Automaticamente processa a string recebida via camera
          }} 
        />
        
        <button onClick={() => setWalletMode("main")} className="w-full py-4 bg-zinc-900 rounded-2xl font-black uppercase text-sm mt-auto max-w-xs">Cancelar Leitura</button>
      </div>
    );
  }

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
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 gap-8 overflow-y-auto no-scrollbar pb-32">
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
                    placeholder="E-mail, Telefone, ou Cód. ID"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    className="flex-1 bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal"
                  />
                  <button 
                    onClick={() => handleSearchRecipient(searchTarget)}
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
              <div className="flex items-center gap-4 bg-zinc-900/40 p-5 rounded-3xl">
                <div className="size-14 rounded-full bg-yellow-400 flex items-center justify-center font-black text-black text-xl">
                  {recipient.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black uppercase truncate">{recipient.name}</p>
                  <p className="text-zinc-600 text-xs truncate">{recipient.email || recipient.phone || "ID Izi Black Integrado"}</p>
                </div>
                <button onClick={() => setRecipient(null)} className="text-[10px] uppercase font-black tracking-widest text-zinc-500 shrink-0">Voltar</button>
              </div>

              <div className="space-y-4 pt-10">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center block">Quanto deseja enviar?</label>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-2xl font-black text-yellow-400">R$</span>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-transparent text-5xl font-black text-white outline-none w-40 text-center placeholder:text-zinc-800"
                  />
                </div>
                <p className="text-center text-xs text-zinc-700">Saldo disponível: R$ {walletBalance.toFixed(2).replace(".", ",")}</p>
              </div>

              <button 
                onClick={handleTransfer}
                disabled={isTransferring || !amount}
                className="w-full py-5 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest shadow-[0_10px_30px_rgba(255,215,9,0.2)] active:scale-95 disabled:opacity-50 transition-all mt-4"
              >
                {isTransferring ? "Processando..." : "Confirmar Envio"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }


  const handleSaveCard = async () => {
    if(!newCard.number || newCard.number.length < 14) return showToast?.("Número do cartão inválido", "error");
    setIsSavingCard(true);
    
    const brand = newCard.number.startsWith("4") ? "Visa" : newCard.number.startsWith("5") ? "Mastercard" : "Amex";
    const last_four = newCard.number.replace(/\s/g, "").slice(-4);
    
    const { error } = await supabase.from("payment_methods").insert({
      user_id: userId,
      brand,
      last_four,
      token: "tok_" + Math.random().toString(36).substr(2, 9),
      is_default: savedCards.length === 0
    });
    
    if (error) {
      showToast?.("Erro ao salvar cartão", "error");
    } else {
      showToast?.("Cartão salvo com sucesso!", "success");
      setWalletMode("main");
      setNewCard({ number: "", holder: "", expiry: "", cvv: "" });
      setTimeout(() => window.location.reload(), 1500);
    }
    setIsSavingCard(false);
  };

  if (walletMode === "add_card") {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 gap-8 overflow-y-auto no-scrollbar pb-32">
        <header className="w-full flex items-center justify-between">
          <button onClick={() => setWalletMode("main")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base uppercase tracking-widest">Adicionar Cartão</h1>
          <div className="size-10" />
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Número do Cartão</label>
            <input 
              type="text" 
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={newCard.number}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                setNewCard({ ...newCard, number: formatted || "" });
              }}
              className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nome Impresso</label>
            <input 
              type="text" 
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={newCard.holder}
              onChange={(e) => setNewCard({ ...newCard, holder: e.target.value.toUpperCase() })}
              className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
            />
          </div>

          <div className="flex gap-4">
             <div className="space-y-2 flex-1">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Validade</label>
                <input 
                  type="text" 
                  placeholder="MM/AA"
                  maxLength={5}
                  value={newCard.expiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\D/g, "");
                    if(val.length > 2) val = val.slice(0,2) + "/" + val.slice(2,4);
                    setNewCard({ ...newCard, expiry: val });
                  }}
                  className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
                />
             </div>
             <div className="space-y-2 flex-1">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">CVV</label>
                <input 
                  type="password" 
                  placeholder="123"
                  maxLength={4}
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\D/g, "") })}
                  className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
                />
             </div>
          </div>
        </div>

        <button 
          onClick={handleSaveCard}
          disabled={isSavingCard || !newCard.number || !newCard.expiry || !newCard.cvv || newCard.number.length < 14}
          className="w-full py-5 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest shadow-[0_10px_30px_rgba(255,215,9,0.2)] active:scale-95 disabled:opacity-50 transition-all mt-6"
        >
          {isSavingCard ? "Processando..." : "Salvar Cartão Seguro"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">
      {/* HERO SALDO - REDESIGN CENTRALIZADO */}
      <div className="px-5 pt-14 pb-8 border-b border-zinc-900/50 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6 w-full justify-center">
          <span className="text-yellow-400 font-extrabold italic tracking-[0.3em] text-[10px] uppercase">Izi Pay</span>
          <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
        </div>
        
        <div className="flex flex-col items-center justify-center mt-2 mb-10 w-full">
          <p className="text-zinc-600 text-[10px] tracking-[0.3em] uppercase mb-2">Seu Saldo IZI</p>
          <div className="flex items-baseline gap-2">
            <span className="font-extrabold text-2xl text-yellow-400 opacity-60">R$</span>
            <span
              className="font-extrabold text-6xl tracking-tighter text-white"
              style={{ textShadow: "0 0 20px rgba(255,215,9,0.3)" }}
            >
              {Math.abs(walletBalance).toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>

        {/* AÇÕES RÁPIDAS - SEM GRID SQUARE, NOVO FORMATO MODERNO E CLEAN */}
        <div className="grid grid-cols-4 gap-2 w-full max-w-sm mx-auto">
          {[
            { icon: "qr_code_scanner", label: "Escanear", action: () => setWalletMode("scan") },
            { icon: "arrow_outward", label: "Enviar", action: () => setWalletMode("transfer") },
            { icon: "history", label: "Extrato", action: () => historyRef.current?.scrollIntoView({ behavior: 'smooth' }) },
            { icon: "qr_code_2", label: "Meu QR", action: () => setWalletMode("my_qr") },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex flex-col items-center gap-2.5 py-4 active:scale-95 transition-all group"
            >
              <div className="size-14 rounded-full bg-zinc-900/60 flex items-center justify-center group-hover:bg-yellow-400/10 transition-all">
                <span className="material-symbols-outlined text-zinc-400 group-hover:text-yellow-400 transition-colors text-xl">
                  {a.icon}
                </span>
              </div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="px-5 py-8 space-y-10">
        {/* STATS - BORDERLESS */}
        <div className="flex gap-2">
          {[
            { label: "Gasto", value: `R$ ${totalGasto.toFixed(0)}`, icon: "shopping_bag" },
            { label: "Recebido", value: `R$ ${totalRecebido.toFixed(0)}`, icon: "add_circle" },
            { label: "Pedidos/mês", value: `${pedidosMes}`, icon: "receipt_long" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center py-5 gap-1.5 bg-zinc-900/30 rounded-2xl"
            >
              <span className="material-symbols-outlined text-zinc-700 text-lg mb-1">{s.icon}</span>
              <p className="font-extrabold text-sm text-white">{s.value}</p>
              <p className="text-[8px] text-zinc-600 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* PONTOS E CASHBACK - BORDERLESS */}
        <div className="flex flex-col gap-1 p-5 bg-zinc-900/40 rounded-[24px]">
          <div className="flex items-center gap-1.5 mb-2">
            <span
              className="material-symbols-outlined text-yellow-400 text-base"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              monetization_on
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">IZI Coins (Cashback Integrado)</span>
          </div>
          <p className="text-3xl font-extrabold text-white">{iziCoins.toLocaleString("pt-BR")}</p>
          <p className="text-[10px] text-yellow-400/50 mt-1 uppercase font-bold tracking-widest">
            ≈ R$ {(iziCoins * iziCoinValue).toFixed(2).replace(".", ",")} em Poder de Compra
          </p>
        </div>

        {/* CARTÕES - BORDERLESS */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Meus Cartões</h2>
            <button
              onClick={() => {
                setWalletMode("add_card");
              }}
              className="text-yellow-400 text-[10px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
            >
              Gerenciar
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-5 px-5 pb-2">
            {/* Card IZI Digital */}
            <div
              className="min-w-[260px] h-40 rounded-[24px] p-5 relative overflow-hidden flex flex-col justify-between shrink-0 bg-[#0a0a0a]"
            >
              <div className="absolute top-0 right-0 bottom-0 left-0" style={{ background: "linear-gradient(135deg, rgba(255,215,9,0.06) 0%, rgba(0,0,0,0) 100%)" }}/>
              <div className="absolute -top-8 -right-8 w-28 h-28 bg-yellow-400/10 rounded-full blur-2xl" />
              <div className="flex justify-between items-start z-10">
                <span className="font-extrabold italic text-yellow-400/40 tracking-tighter">IZI</span>
                <span className="material-symbols-outlined text-zinc-700 text-base">contactless</span>
              </div>
              <div className="z-10">
                <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-600 mb-1">Cartão Digital</p>
                <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2 shadow-black drop-shadow-md">•••• •••• •••• 8820</p>
                <div className="flex justify-between items-center">
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest">Val. 12/28</p>
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
                className="min-w-[260px] h-40 bg-zinc-900/30 rounded-[24px] p-5 flex flex-col justify-between shrink-0"
              >
                <div className="flex justify-between items-start">
                  <span className="font-extrabold italic text-zinc-600 tracking-tighter">{card.brand}</span>
                  <span className="material-symbols-outlined text-zinc-700 text-base">contactless</span>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-zinc-600 mb-1">Cartão Físico</p>
                  <p className="font-extrabold text-base tracking-[0.2em] text-white mb-2">
                    •••• •••• •••• {card.last4}
                  </p>
                  <div className="flex justify-between items-center">
                    <p className="text-[8px] text-zinc-600 uppercase">{card.brand}</p>
                    <p className="text-[9px] text-zinc-600">Val. {card.expiry}</p>
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                setWalletMode("add_card");
              }}
              className="min-w-[120px] h-40 bg-zinc-900/10 rounded-[24px] flex flex-col items-center justify-center gap-2 shrink-0 active:scale-95 transition-all hover:bg-zinc-900/30 group"
            >
              <div className="size-10 rounded-full bg-zinc-900/50 flex align-center justify-center pt-2 group-hover:bg-yellow-400/10 transition-colors">
                 <span className="material-symbols-outlined text-zinc-600 group-hover:text-yellow-400 transition-colors">add</span>
              </div>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-wider group-hover:text-zinc-400 mt-2">
                Novo
              </span>
            </button>
          </div>
        </section>

        {/* HISTÓRICO */}
        <section ref={historyRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Histórico</h2>
            <button className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Ver Tudo</button>
          </div>
          <div className="flex flex-col">
            {walletTransactions.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 bg-zinc-900/20 rounded-[24px]">
                <span className="material-symbols-outlined text-4xl text-zinc-800">receipt_long</span>
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">Nenhuma transação</p>
              </div>
            ) : (
              <div className="bg-zinc-900/20 rounded-[24px] p-2">
              {walletTransactions.slice(0, 20).map((t: any, i: number) => {
                const tx = txIcon[t.type] || { icon: "payments", color: "text-zinc-400" };
                return (
                  <div key={t.id || i} className="flex items-center gap-4 py-3 px-3 hover:bg-zinc-900/40 rounded-xl transition-all border-b border-zinc-900/30 last:border-0 cursor-pointer">
                    <div className="size-12 rounded-2xl bg-zinc-900 flex align-center justify-center shrink-0">
                      <span
                        className={`material-symbols-outlined mt-3 text-xl ${tx.color}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {tx.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate capitalize">{t.description || t.type}</p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
                        {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} •{" "}
                        {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-extrabold text-sm ${["deposito", "reembolso"].includes(t.type) ? "text-emerald-400" : "text-white"}`}
                      >
                        {["deposito", "reembolso"].includes(t.type) ? "+" : "-"} R${" "}
                        {Number(t.amount).toFixed(2).replace(".", ",")}
                      </p>
                      <p className="text-[9px] text-zinc-600 capitalize mt-1">{t.type}</p>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};
