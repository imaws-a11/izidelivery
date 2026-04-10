import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";

// Componente para o Leitor de QR Code usando a câmera nativa (Html5Qrcode)
// Versão Final: Tratamento silencioso de AbortError e foco em estabilidade.
const ScannerWrapper = ({ onResult, onCancel }: { onResult: (text: string) => void; onCancel: () => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    let active = true;

    const start = async () => {
      // Delay para estabilidade
      await new Promise(r => setTimeout(r, 500));
      if (!active) return;

      try {
        if (!scannerRef.current) {
          scannerRef.current = new Html5Qrcode("reader");
        }

        const config = {
          fps: 15, // FPS menor para estabilidade em dispositivos mais lentos
          aspectRatio: 1.0,
          videoConstraints: { facingMode: "environment" }
        };

        const cameras = await Html5Qrcode.getCameras();
        if (!active) return;

        const back = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('traseira') ||
          c.label.toLowerCase().includes('rear')
        ) || cameras[cameras.length - 1];

        if (back) {
          await scannerRef.current.start(back.id, config, onResult, () => {});
        } else {
          await scannerRef.current.start({ facingMode: "environment" }, config, onResult, () => {});
        }
      } catch (err) {
        // Silencia AbortError (comum em React 18 e navegação rápida)
        if (err instanceof Error && err.name === 'AbortError') return;
        console.warn("Scanner Status:", err);
      }
    };

    start();

    return () => {
      active = false;
      if (scannerRef.current) {
        if (scannerRef.current.isScanning) {
          scannerRef.current.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, [onResult]);

  return (
    <div className="fixed inset-0 z-[1000] bg-black overflow-hidden flex items-center justify-center">
      <div id="reader" className="fixed inset-0 w-full h-full bg-black" />

      {/* Botão de Fechar */}
      <div className="absolute top-10 right-10 z-[1001]">
        <button 
          onClick={onCancel}
          className="size-14 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white active:scale-90 shadow-2xl"
        >
           <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      <style>{`
        #reader {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
        }
        #reader video {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
        }
        #reader__scan_region, #reader__dashboard, #reader__camera_selection, #reader__header_message, #reader canvas, #reader img, #reader > *:not(video) {
          display: none !important;
        }
      `}</style>
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
  userName,
   iziCoinValue = 1.0,
   iziCoinRate = 1.0,
   paymentMethod,
   setShowDepositModal,
   showToast,
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

  // Estados de Animação Real-time
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<"sent" | "received">("sent");
  const [doneTransferAmount, setDoneTransferAmount] = useState(0);
  const lastCoinValue = useRef(iziCoins);

  // Monitorar recebimento de moedas em tempo real para disparar animação
  useEffect(() => {
    if (!userId) return;

    const channel = supabase.channel('realtime_coins')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'users_delivery', 
        filter: `id=eq.${userId}` 
      }, (payload) => {
        const newBalance = Number(payload.new.izi_coins || 0);
        const oldBalance = Number(lastCoinValue.current);

        if (newBalance > oldBalance && !showAnimation) {
          const diff = newBalance - oldBalance;
          setDoneTransferAmount(diff);
          setAnimationType("received");
          setShowAnimation(true);
        }
        lastCoinValue.current = newBalance;
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, showAnimation]);

  // Atualizar o ref quando a prop mudar via fluxo normal (ex: compra)
  useEffect(() => {
    lastCoinValue.current = iziCoins;
  }, [iziCoins]);

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



  const handleSearchRecipient = useCallback(async (query = searchTarget) => {
    if (!query.trim()) return;
    setIsSearching(true);
    setSearchTarget(query);
    try {
      // 1. Tenta buscar em usuários comuns
      const { data: userData } = await supabase
        .from("users_delivery")
        .select("id, name, email, phone")
        .or(`email.eq.${query},phone.eq.${query},id.eq.${query}`)
        .not("id", "eq", userId)
        .single();

      if (userData) {
        setRecipient({ ...userData, type: 'user' });
        return;
      }

      // 2. Se não achou, tenta buscar em estabelecimentos (admin_users com role merchant)
      const { data: merchantData } = await supabase
        .from("admin_users")
        .select("id, store_name, email, store_phone")
        .or(`email.eq.${query},store_phone.eq.${query},id.eq.${query}`)
        .eq("role", "merchant")
        .single();

      if (merchantData) {
        setRecipient({ 
          id: merchantData.id, 
          name: merchantData.store_name, 
          email: merchantData.email, 
          phone: merchantData.store_phone,
          type: 'merchant' 
        });
      } else {
        showToast?.("Destinatário não encontrado", "warning");
        setRecipient(null);
      }
    } catch (err) {
      showToast?.("Erro ao buscar destinatário", "error");
    } finally {
      setIsSearching(false);
    }
  }, [userId, searchTarget, showToast]);

  const handleTransfer = async () => {
    const val = Number(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) return showToast?.("Valor inválido", "error");
    if (val > iziCoins) return showToast?.("Saldo de coins insuficiente", "error");
    if (!recipient) return;

    setIsTransferring(true);
    try {
      const newBalanceSelf = Number((iziCoins - val).toFixed(8));
      
      // 1. Débito no remetente (Coins)
      const { error: err1 } = await supabase.from("users_delivery").update({
        izi_coins: newBalanceSelf
      }).eq("id", userId);

      if (err1) throw err1;

      // 2. Registro da transação remetente
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: val,
        type: "transferencia",
        description: `Transferência enviada para ${recipient.name}`,
        balance_after: newBalanceSelf
      });

      // 3. Crédito no destinatário (Buscar saldo atual do destinatário primeiro)
      const { data: destUser } = await supabase.from("users_delivery").select("izi_coins").eq("id", recipient.id).single();
      const destCoins = Number(destUser?.izi_coins || 0);
      const newBalanceDest = Number((destCoins + val).toFixed(8));

      await supabase.from("users_delivery").update({
        izi_coins: newBalanceDest
      }).eq("id", recipient.id);

      // 4. Registro da transação pro destinatário
      await supabase.from("wallet_transactions").insert({
        user_id: recipient.id,
        amount: val,
        type: "deposito",
        description: `Transferência IZI recebida de ${userName}`,
        balance_after: newBalanceDest
      });

      showToast?.("Transferência realizada com sucesso!", "success");
      
      // Trigger animation state
      setDoneTransferAmount(val);
      setAnimationType("sent");
      setShowAnimation(true);
      
      setWalletMode("main");
      setRecipient(null);
      setSearchTarget("");
      setAmount("");
    } catch (err) {
      showToast?.("Erro ao realizar transferência", "error");
    } finally {
      setIsTransferring(false);
    }
  };



  const handleScanResult = useCallback((text: string) => {
    const idText = text.replace("izipay:", "").trim();
    setWalletMode("transfer");
    handleSearchRecipient(idText);
  }, [handleSearchRecipient]);

  const handleCancelScan = useCallback(() => {
    setWalletMode("main");
  }, []);

  if (walletMode === "scan") {
    return (
      <ScannerWrapper 
        onCancel={handleCancelScan}
        onResult={handleScanResult} 
      />
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
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(",", ".");
                      if (/^\d*\.?\d{0,8}$/.test(val)) setAmount(val);
                    }}
                    className="bg-transparent text-5xl font-black text-white outline-none w-64 text-center placeholder:text-zinc-800"
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
            { icon: "add_circle", label: "Depositar", action: () => setShowDepositModal(true) },
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

      {/* ANIMAÇÃO PREMIUM DE MOEDAS VOANDO */}
      <AnimatePresence>
        {showAnimation && (
          <div className="fixed inset-0 z-[1000] pointer-events-none flex items-center justify-center overflow-hidden">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-sm"
             />

             {/* Partículas de Moedas */}
             {[...Array(20)].map((_, i) => (
               <motion.div
                 key={i}
                 initial={{ 
                   x: animationType === "sent" ? 0 : (Math.random() - 0.5) * window.innerWidth * 1.5,
                   y: animationType === "sent" ? 0 : window.innerHeight + 100,
                   scale: 0,
                   rotate: 0,
                   opacity: 0
                 }}
                 animate={{ 
                   x: animationType === "sent" ? (Math.random() - 0.5) * window.innerWidth * 1.5 : 0,
                   y: animationType === "sent" ? -window.innerHeight - 100 : 0,
                   scale: [0, 1, 1, 0.5],
                   rotate: 720,
                   opacity: [0, 1, 1, 0]
                 }}
                 transition={{ 
                   duration: 2.5, 
                   delay: i * 0.08,
                   ease: "easeOut"
                 }}
                 className="absolute size-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.6)] border-2 border-yellow-200"
               >
                 <span className="text-black font-black text-xl italic mt-0.5">Z</span>
               </motion.div>
             ))}

             {/* Banner Informativo */}
             <motion.div
               initial={{ scale: 0.5, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.8, opacity: 0 }}
               onAnimationComplete={() => setTimeout(() => setShowAnimation(false), 3500)}
               className="relative bg-zinc-900/90 border border-yellow-400/30 backdrop-blur-3xl p-8 rounded-[40px] flex flex-col items-center gap-4 shadow-2xl"
             >
                <div className="size-20 rounded-full bg-yellow-400 flex items-center justify-center mb-2 shadow-[0_0_40px_rgba(250,204,21,0.4)]">
                   <span className="material-symbols-outlined text-black text-4xl font-black">
                     {animationType === "sent" ? "rocket_launch" : "account_balance_wallet"}
                   </span>
                </div>
                <div className="text-center">
                   <p className="text-yellow-400 font-black text-[10px] uppercase tracking-[0.3em] mb-1">
                     {animationType === "sent" ? "Envio Concluído" : "Você Recebeu IZI"}
                   </p>
                   <h2 className="text-4xl font-black text-white italic tracking-tighter">
                     <span className="text-yellow-400">Z</span> {doneTransferAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 8 })}
                   </h2>
                </div>
                <p className="text-zinc-500 text-[9px] font-bold uppercase tracking-widest mt-2">{animationType === "sent" ? "Criptomoeda Izi Processada" : "Saldo Atualizado em Tempo Real"}</p>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
