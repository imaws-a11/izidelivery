import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";

// Componente para o Leitor de QR Code usando a câmera nativa (Html5Qrcode)
const ScannerWrapper = ({ onResult }: { onResult: (text: string) => void }) => {
  const qrRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    qrRef.current = new Html5Qrcode("reader");
    
    qrRef.current.start(
      { facingMode: "environment" }, // Usa a câmera traseira
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
      },
      (decodedText: string) => {
        onResult(decodedText);
        qrRef.current?.stop().catch(() => {});
      },
      () => { /* logs freq - ignorar */ }
    ).catch(err => {
      console.error("Erro ao iniciar câmera:", err);
    });

    return () => {
      if (qrRef.current?.isScanning) {
        qrRef.current.stop().catch(() => {});
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center">
      {/* Camada da Câmera */}
      <div id="reader" className="absolute inset-0 w-full h-full object-cover" />
      
      {/* Overlay de Target */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        <div className="w-64 h-64 border-2 border-yellow-400 rounded-[40px] relative">
          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-yellow-400 rounded-tl-2xl animate-pulse" />
          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-yellow-400 rounded-tr-2xl animate-pulse" />
          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-yellow-400 rounded-bl-2xl animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-yellow-400 rounded-br-2xl animate-pulse" />
        </div>
        
        <div className="mt-12 text-center space-y-4 px-10">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-yellow-400 rounded-full shadow-lg">
            <span className="material-symbols-outlined text-black text-lg animate-pulse">qr_code_scanner</span>
            <span className="text-[10px] font-black text-black uppercase tracking-widest">Escaneando IZI Pay</span>
          </div>
          <p className="text-white/60 text-xs font-bold uppercase tracking-widest leading-relaxed">
            Centralize o QR Code no quadro acima para autenticação instantânea
          </p>
        </div>
      </div>
      
      {/* Botão de Fechar no Overlay */}
      <button 
        onClick={() => window.location.reload()} // Forçar reset do fluxo se necessário ou usar state
        className="absolute top-12 right-6 size-12 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white z-20"
      >
        <span className="material-symbols-outlined">close</span>
      </button>
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
  userXP = 0,
  savedCards = [],
  userId,
  iziCoinValue = 1.0,
  iziCoinRate = 1.0,
  paymentMethod,
  setShowDepositModal,
  setPaymentsOrigin,
  setSubView,
}) => {
  const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr" | "scan" | "add_card">("main");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [isSavingCard, setIsSavingCard] = useState(false);
  const historyRef = useRef<HTMLElement>(null);

  // Estados para Transferência
  const [amount, setAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [searchTarget, setSearchTarget] = useState("");
  const [recipient, setRecipient] = useState<any>(null);

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
    const val = parseInt(amount);
    if (isNaN(val) || val <= 0) return showToast?.("Valor inválido", "error");
    if (val > iziCoins) return showToast?.("Saldo de coins insuficiente", "error");
    if (!recipient) return;

    setIsTransferring(true);
    try {
      // 1. Débito no remetente (Coins)
      const { error: err1 } = await supabase.from("users_delivery").update({
        izi_coins: iziCoins - val
      }).eq("id", userId);

      if (err1) throw err1;

      // 2. Registro da transação
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: val,
        type: "transferencia",
        description: `Transferência enviada para ${recipient.name}`
      });

      // 3. Crédito no destinatário (Buscar saldo atual do destinatário primeiro)
      const { data: destUser } = await supabase.from("users_delivery").select("izi_coins").eq("id", recipient.id).single();
      const destCoins = destUser?.izi_coins || 0;

      await supabase.from("users_delivery").update({
        izi_coins: Number(destCoins) + val
      }).eq("id", recipient.id);

      // 4. Registro da transação pro destinatário
      await supabase.from("wallet_transactions").insert({
        user_id: recipient.id,
        amount: val,
        type: "deposito",
        description: `Transferência IZI recebida de ${userName}`
      });



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
                  <span className="text-2xl font-black text-yellow-400">IZI</span>
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                    className="bg-transparent text-5xl font-black text-white outline-none w-40 text-center placeholder:text-zinc-800"
                  />
                </div>
                <p className="text-center text-xs text-zinc-700 flex items-center justify-center gap-1">
                  Saldo disponível: <span className="izi-coin-symbol">Z</span> {iziCoins.toLocaleString("pt-BR")}
                  {((iziCoins || 0) % 1 > 0) && <span className="opacity-40 text-[10px]">,{(iziCoins % 1).toFixed(8).split('.')[1]}</span>}
                </p>
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
        
        <div className="flex flex-col items-center justify-center mt-2 mb-10 w-full relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 bg-yellow-400/5 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative flex flex-col items-center">
            <p className="text-zinc-600 text-[9px] font-black tracking-[0.4em] uppercase mb-8 opacity-60">Sua Carteira Digital Oficial</p>
            
            <div className="flex items-center justify-center gap-4">
              <span className="izi-coin-symbol text-4xl text-yellow-400 opacity-90">Z</span>
              <div className="flex items-baseline">
                <h3 className="text-7xl font-black tracking-tighter text-white tabular-nums drop-shadow-2xl">
                  {(iziCoins || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </h3>
                {((iziCoins || 0) % 1 > 0) && (
                  <span className="text-2xl font-black text-yellow-400/60 ml-1 tabular-nums">
                    ,{(iziCoins % 1).toFixed(8).split('.')[1]}
                  </span>
                )}
              </div>
            </div>
            
            <div className="mt-5 flex items-center gap-3">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-yellow-400/30" />
              <span className="text-yellow-400 font-extrabold text-[11px] tracking-[0.2em] uppercase italic">Izicoins</span>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-yellow-400/30" />
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 w-full max-w-[300px] bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 backdrop-blur-xl rounded-[32px] p-6 border border-white/5 relative group shadow-2xl"
          >
            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-40 transition-opacity">
              <span className="text-[8px] font-black uppercase text-white">Garantia Izi</span>
              <span className="material-symbols-outlined text-[10px] text-yellow-400">verified_user</span>
            </div>
            
            <div className="flex flex-col gap-4">
              <div className="flex flex-col">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                  Reserva em Reais
                  <span className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-emerald-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">R$</span>
                  <span className="text-3xl font-black text-white tracking-tight">
                    {(iziCoins * iziCoinValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div className="h-[1px] w-full bg-white/5" />
              
              <div className="flex justify-between items-center">
                <p className="text-[8px] text-zinc-600 uppercase font-bold tracking-wider italic">Liquidez imediata para pagamentos</p>
                <div className="size-6 rounded-full bg-zinc-900 flex items-center justify-center">
                   <span className="text-[10px] font-black text-emerald-500">1:1</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AÇÕES RÁPIDAS - GRID DE 5 COLUNAS */}
        <div className="grid grid-cols-5 gap-1 w-full max-w-sm mx-auto">
          {[
            { icon: "add_circle", label: "Comprar", action: () => setShowDepositModal(true) },
            { icon: "arrow_outward", label: "Enviar", action: () => setWalletMode("transfer") },
            { icon: "qr_code_scanner", label: "Escanear", action: () => setWalletMode("scan") },
            { icon: "qr_code", label: "Meu QR", action: () => setWalletMode("my_qr") },
            { icon: "history", label: "Extrato", action: () => historyRef.current?.scrollIntoView({ behavior: 'smooth' }) },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex flex-col items-center gap-2.5 py-4 active:scale-95 transition-all group"
            >
              <div className="size-12 rounded-full bg-zinc-900/60 flex items-center justify-center group-hover:bg-yellow-400/10 transition-all">
                <span className="material-symbols-outlined text-zinc-400 group-hover:text-yellow-400 transition-colors text-lg">
                  {a.icon}
                </span>
              </div>
              <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-zinc-300 transition-colors text-center">
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
            { label: "Moedas Gastas", value: `${totalGasto.toFixed(0)}`, icon: "shopping_bag" },
            { label: "Cashback Ganho", value: `${iziCashback.toFixed(0)}`, icon: "add_circle" },
            { label: "Nível Izi", value: `Nível ${Math.floor(userXP/1000) + 1}`, icon: "verified" },
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


        {/* CARTÕES REMOVIDOS CONFORME SOLICITADO A FAVOR DO MODAL DE COMPRA */}

        {/* HISTÓRICO */}
        <section ref={historyRef}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-extrabold text-base text-white uppercase tracking-tight">Histórico</h2>
            <button
              onClick={() => setShowAllHistory((prev) => !prev)}
              className="text-[10px] font-black text-yellow-400 uppercase tracking-widest"
            >
              {showAllHistory ? "Ver menos" : "Ver tudo"}
            </button>
          </div>
          <div className="flex flex-col">
            {walletTransactions.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-3 bg-zinc-900/20 rounded-[24px]">
                <span className="material-symbols-outlined text-4xl text-zinc-800">receipt_long</span>
                <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">Nenhuma transação</p>
              </div>
            ) : (
              <div className="bg-zinc-900/20 rounded-[24px] p-2">
              {(showAllHistory ? walletTransactions : walletTransactions.slice(0, 20)).map((t: any, i: number) => {
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
                        {["deposito", "reembolso"].includes(t.type) ? "+" : "-"} {Number(t.amount).toLocaleString("pt-BR")} IZI
                      </p>
                      <p className="text-[9px] text-zinc-600 uppercase mt-1">Moeda Digital</p>
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
