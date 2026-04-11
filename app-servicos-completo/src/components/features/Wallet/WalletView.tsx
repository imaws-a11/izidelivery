import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Html5Qrcode } from "html5-qrcode";

// Componente para o Leitor de QR Code usando a câmera nativa (Html5Qrcode)
// Versão com Autofoco: Otimizada para leitura rápida e foco contínuo.
const ScannerWrapper = ({ onResult, onCancel }: { onResult: (text: string) => void; onCancel: () => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  
  const resultRef = useRef(onResult);
  const cancelRef = useRef(onCancel);
  
  useEffect(() => {
    resultRef.current = onResult;
    cancelRef.current = onCancel;
  }, [onResult, onCancel]);

  useEffect(() => {
    let isMounted = true;

    const startCamera = async () => {
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;

      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const config = {
          fps: 20,
          aspectRatio: 1.0,
          // Configurações avançadas de vídeo para Autofoco e Nitidez
          videoConstraints: { 
            facingMode: "environment",
            // @ts-ignore - focusMode é suportado em navegadores modernos mas pode não estar no Type padrão
            focusMode: "continuous",
            width: { min: 640, ideal: 1280 },
            height: { min: 640, ideal: 1280 }
          }
        };

        const cameras = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        const back = cameras.find(c => 
          c.label.toLowerCase().includes('back') || 
          c.label.toLowerCase().includes('traseira') ||
          c.label.toLowerCase().includes('rear')
        ) || cameras[cameras.length - 1];

        await scanner.start(
          back ? back.id : { facingMode: "environment" }, 
          config, 
          (text) => resultRef.current(text), 
          () => {}
        );

        // Tenta aplicar autofoco avançado se o hardware permitir após o início
        const videoTrack = scanner.getVideoTrack();
        if (videoTrack && videoTrack.applyConstraints) {
          const capabilities = videoTrack.getCapabilities() as any;
          if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
            await videoTrack.applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            } as any);
          }
        }

      } catch (err) {
        if (err instanceof Error && (err.name === 'AbortError' || err.message.includes('play()'))) {
          return;
        }
        console.warn("Sensor Izi Status:", err);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      const scanner = scannerRef.current;
      if (scanner) {
        if (scanner.isScanning) {
          scanner.stop().catch(() => {});
        }
        scannerRef.current = null;
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] bg-black overflow-hidden flex items-center justify-center">
      <div id="reader" className="fixed inset-0 w-full h-full bg-black" />

      {/* Botão de Fechar */}
      <div className="absolute top-10 right-10 z-[1001]">
        <button 
          onClick={onCancel}
          className="size-14 rounded-full bg-white/10 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform shadow-2xl"
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
          background: #000 !important;
        }
        #reader video {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          object-fit: cover !important;
          background: #000 !important;
        }
        #reader__scan_region, #reader__dashboard, #reader__camera_selection, #reader__header_message, #reader canvas, #reader img, #reader > *:not(video) {
          display: none !important;
          visibility: hidden !important;
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
  const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr" | "scan" | "add_card" | "loans">("main");
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
 
  // Estados para Empréstimos
  const [loans, setLoans] = useState<any[]>([]);
  const [isLoadingLoans, setIsLoadingLoans] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInstallments, setLoanInstallments] = useState(1);
  const [isTakingLoan, setIsTakingLoan] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [showLoanDetails, setShowLoanDetails] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);
  const [isPayingInstallments, setIsPayingInstallments] = useState(false);
  const [loanPaymentStep, setLoanPaymentStep] = useState<'details' | 'method' | 'pix' | 'card'>('details');
  const [selectedMethod, setSelectedMethod] = useState<'pix' | 'card' | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [preApprovedLimit, setPreApprovedLimit] = useState(1000); // Default fallback
  const [loanInterestRate, setLoanInterestRate] = useState(10); // Default 10%

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

  // Buscar Limite Pré-Aprovado e Configurações Econômicas
  useEffect(() => {
    if (!userId) return;
    const fetchLimit = async () => {
      try {
        // 1. Busca limite individual
        const { data: userData } = await supabase
          .from("users_delivery")
          .select("pre_approved_limit")
          .eq("id", userId)
          .single();
        
        // 2. Busca configurações globais (limite base e juros)
        const { data: globalData } = await supabase
          .from("admin_settings_delivery")
          .select("global_pre_approved_limit, loan_interest_rate")
          .single();

        const userLimit = Number(userData?.pre_approved_limit || 0);
        const globalLimit = Number(globalData?.global_pre_approved_limit || 0);
        const globalInterest = Number(globalData?.loan_interest_rate || 10);

        // Prioridade: Limite Individual (se definido e > 0), senão usa o Global
        setPreApprovedLimit(userLimit > 0 ? userLimit : globalLimit);
        setLoanInterestRate(globalInterest);
      } catch (err) {
        console.error("Erro ao carregar configurações econômicas:", err);
      }
    };
    fetchLimit();
  }, [userId, walletMode]);

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
    emprestimo: { icon: "account_balance", color: "text-yellow-400" },
    venda: { icon: "store", color: "text-emerald-400" },
  };

  const totalGasto = walletTransactions
    .filter((t: any) => t.type === "pagamento")
    .reduce((a: number, t: any) => a + Number(t.amount), 0);

  const fetchLoans = useCallback(async () => {
    if (!userId) return;
    setIsLoadingLoans(true);
    const { data } = await supabase
      .from("loans_delivery")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    
    if (data) setLoans(data);
    setIsLoadingLoans(false);
  }, [userId]);

  useEffect(() => {
    if (walletMode === 'loans') fetchLoans();
  }, [walletMode, fetchLoans]);

  const handleTakeLoan = async () => {
    const amountVal = Number(loanAmount);
    if (!amountVal || amountVal <= 0) return showToast?.("Valor inválido", "error");
    
    if (amountVal > preApprovedLimit) {
      return showToast?.(`O valor máximo permitido para você é Z ${preApprovedLimit.toLocaleString('pt-BR')}`, "warning");
    }
    
    setIsTakingLoan(true);
    try {
      const multiplier = 1 + (loanInterestRate / 100);
      const { error: loanErr } = await supabase
        .from("loans_delivery")
        .insert({
          user_id: userId,
          requested_amount: amountVal,
          requested_installments: loanInstallments,
          amount: amountVal,
          total_payable: amountVal * multiplier,
          installments_count: loanInstallments,
          status: 'pending'
        });
      
      if (loanErr) throw loanErr;

      showToast?.("Solicitação enviada para análise!", "success");
      setWalletMode("main");
      setLoanAmount("");
      setLoanInstallments(1);
      fetchLoans();
    } catch (err) {
      showToast?.("Erro ao solicitar empréstimo", "error");
    } finally {
      setIsTakingLoan(false);
    }
  };

  const handlePayLoan = async (loan: any) => {
    const { data: currentUser } = await supabase.from("users_delivery").select("izi_coins").eq("id", userId).single();
    const currentCoins = Number(currentUser?.izi_coins || 0);

    if (currentCoins < loan.total_payable) return showToast?.("Saldo insuficiente para quitar o empréstimo", "error");
    
    setIsTakingLoan(true);
    try {
      const newBalance = Number((currentCoins - loan.total_payable).toFixed(8));
      
      // 1. Marcar como pago
      const { error: updLoanErr } = await supabase
        .from("loans_delivery")
        .update({ status: 'paid' })
        .eq("id", loan.id);
      
      if (updLoanErr) throw updLoanErr;

      // 2. Debitar Usuário
      const { error: updUserErr } = await supabase
        .from("users_delivery")
        .update({ izi_coins: newBalance })
        .eq("id", userId);
      
      if (updUserErr) throw updUserErr;

      // 3. Registrar Transação
      await supabase.from("wallet_transactions").insert({
        user_id: userId,
        amount: loan.total_payable,
        type: "pagamento", // Debito
        description: `Pagamento de Empréstimo Izi Pay`,
        balance_after: newBalance
      });

      showToast?.("Empréstimo quitado com sucesso!", "success");
      fetchLoans();
    } catch (err) {
      showToast?.("Erro ao quitar empréstimo", "error");
    } finally {
      setIsTakingLoan(false);
    }
  };

  const handlePaySelectedInstallments = async (method: 'pix' | 'card') => {
    if (!selectedLoan || selectedInstallments.length === 0) return;
    
    setIsPayingInstallments(true);
    try {
      const installmentVal = Number(selectedLoan.installment_value || (selectedLoan.total_payable / selectedLoan.installments_count));
      const totalToPay = installmentVal * selectedInstallments.length;
      
      const { data, error } = await supabase.rpc('record_loan_payment_v1', {
        p_loan_id: selectedLoan.id,
        p_user_id: userId,
        p_installments_count: selectedInstallments.length,
        p_total_amount: totalToPay,
        p_payment_method: method
      });

      if (error) throw error;
      if (data && !data.success) throw new Error(data.error);

      showToast?.(`Pagamento via ${method.toUpperCase()} recebido com sucesso!`, "success");
      setShowLoanDetails(false);
      setLoanPaymentStep('details');
      fetchLoans();
    } catch (err: any) {
      showToast?.(err.message || "Erro ao processar pagamento", "error");
    } finally {
      setIsPayingInstallments(false);
    }
  };

  const generateLoanPix = async () => {
    if (!selectedLoan || selectedInstallments.length === 0) return;
    setIsGeneratingPix(true);
    try {
      const installmentVal = Number(selectedLoan.installment_value || (selectedLoan.total_payable / selectedLoan.installments_count));
      const totalToPay = installmentVal * selectedInstallments.length;

      const { data, error } = await supabase.functions.invoke('create-mp-pix', {
        body: {
          amount: totalToPay,
          orderId: selectedLoan.id,
          userId: userId,
          meta: {
            type: 'loan_payment',
            loan_id: selectedLoan.id,
            user_id: userId,
            installments_count: selectedInstallments.length
          }
        }
      });

      if (error) throw error;
      setPixData(data);
    } catch (err: any) {
      showToast?.("Erro ao gerar QR Code real. Tente novamente.", "error");
      setLoanPaymentStep('method');
    } finally {
      setIsGeneratingPix(false);
    }
  };






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

      // 3. Crédito no destinatário (Roteamento por tipo)
      if (recipient.type === 'merchant') {
        // Lojistas: Registram o saldo na wallet_transactions_delivery (somatório virtual)
        const { error: errDest } = await supabase.from("wallet_transactions_delivery").insert({
          user_id: recipient.id,
          amount: val,
          type: "venda",
          description: `Recebimento IZIPAY de ${userName}`,
          status: 'concluido'
        });
        if (errDest) throw errDest;
      } else {
        // Usuários comuns: Atualizam o campo izi_coins na users_delivery
        const { data: destUser } = await supabase.from("users_delivery").select("izi_coins").eq("id", recipient.id).single();
        const destCoins = Number(destUser?.izi_coins || 0);
        const newBalanceDest = Number((destCoins + val).toFixed(8));

        const { error: errDest } = await supabase.from("users_delivery").update({
          izi_coins: newBalanceDest
        }).eq("id", recipient.id);
        if (errDest) throw errDest;

        // Registro da transação para o destinatário usuário
        await supabase.from("wallet_transactions").insert({
          user_id: recipient.id,
          amount: val,
          type: "deposito",
          description: `Transferência IZI recebida de ${userName}`,
          balance_after: newBalanceDest
        });
      }

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
    // Remove possíveis prefixos para obter apenas o ID (UUID)
    const cleanId = text
      .replace("izipay:", "")
      .replace("merchant:", "")
      .replace("user:", "")
      .trim();
      
    setWalletMode("transfer");
    handleSearchRecipient(cleanId);
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

  if (walletMode === "loans") {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 gap-8 overflow-y-auto no-scrollbar pb-32">
        <header className="w-full flex items-center justify-between">
          <button onClick={() => setWalletMode("main")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base uppercase tracking-widest">Crédito Izi Pay</h1>
          <div className="size-10" />
        </header>

        <section className="space-y-6">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-[32px] text-black shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Seu Limite Pré-Aprovado</p>
              <h2 className="text-4xl font-black italic mt-1">Z {preApprovedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
              <div className="mt-6 flex items-center gap-2">
                 <span className="material-symbols-outlined text-sm">info</span>
                 <p className="text-[9px] font-bold uppercase tracking-tight">Taxa de {loanInterestRate}% / mês • Liberação na hora</p>
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 size-32 bg-black/5 rounded-full blur-2xl" />
          </div>

          <div className="bg-zinc-900 p-6 rounded-[32px] border border-white/5 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Quanto você precisa?</label>
                <div className="flex items-center gap-3">
                   <span className="text-2xl font-black text-yellow-500">Z</span>
                   <input 
                     type="number" 
                     placeholder="0.00"
                     value={loanAmount}
                     onChange={(e) => setLoanAmount(e.target.value)}
                     className="bg-transparent text-3xl font-black text-white outline-none flex-1"
                   />
                </div>
              </div>

              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest block">Número de Parcelas</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 6, 12].map((p) => (
                  <button 
                    key={p}
                    onClick={() => setLoanInstallments(p)}
                    className={`py-3 rounded-xl text-[10px] font-black transition-all border ${
                      loanInstallments === p 
                      ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20' 
                      : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {p}x
                  </button>
                ))}
              </div>
            </div>

            {loanAmount && Number(loanAmount) > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3 pt-4 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                  <span>Plano de Pagamento</span>
                  <span className="text-white">{loanInstallments}x de Z {((Number(loanAmount) * (1 + (loanInterestRate / 100))) / loanInstallments).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-xs font-black uppercase text-white pt-2 border-t border-white/5">
                   <span>Total c/ {loanInterestRate}% Juros</span>
                   <span className="text-yellow-400">Z {(Number(loanAmount) * (1 + (loanInterestRate / 100))).toLocaleString('pt-BR')}</span>
                </div>
              </motion.div>
            )}

            <button 
              onClick={handleTakeLoan}
              disabled={isTakingLoan || !loanAmount || Number(loanAmount) <= 0}
              className="w-full py-4 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all"
            >
              {isTakingLoan ? "Processando..." : "Solicitar Crédito"}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="font-extrabold text-white uppercase tracking-tight text-sm">Meus Empréstimos</h3>
          <div className="space-y-3">
            {isLoadingLoans ? (
              <div className="p-10 flex justify-center"><div className="size-6 border-2 border-yellow-400 border-t-transparent animate-spin rounded-full"/></div>
            ) : loans.length === 0 ? (
              <div className="p-8 bg-zinc-900/40 rounded-[24px] text-center border border-dashed border-white/5">
                <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhum empréstimo ativo</p>
              </div>
            ) : (
              loans.map((loan) => (
                <motion.div 
                  key={loan.id} 
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedLoan(loan); setShowLoanDetails(true); setSelectedInstallments([]); }}
                  className="bg-zinc-900 p-5 rounded-[24px] border border-white/5 flex flex-col gap-4 cursor-pointer active:bg-zinc-800 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Dívida Total</p>
                       <h4 className="text-xl font-black text-white">Z {Number(loan.total_payable).toLocaleString('pt-BR')}</h4>
                    </div>
                     <span className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500' : 
                        loan.status === 'pending' ? 'bg-indigo-500/10 text-indigo-400' :
                        loan.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-500'
                      }`}>
                      {loan.status === 'paid' ? 'Liquidado' : loan.status === 'pending' ? 'Sob Análise' : loan.status === 'rejected' ? 'Recusado' : 'A pagar'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                       <p className="text-zinc-600 uppercase font-black tracking-tight">Status de Pagamento</p>
                       <p className="text-white font-bold">{loan.paid_installments || 0} de {loan.installments_count} parcelas pagas</p>
                    </div>
                    <div>
                      <p className="text-zinc-600 uppercase font-black tracking-tight">Valor Original</p>
                      <p className="text-white font-bold">Z {Number(loan.amount).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[8px] font-black text-zinc-600 uppercase">Clique para ver detalhes</span>
                    <span className="material-symbols-outlined text-xs text-zinc-600">chevron_right</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <AnimatePresence>
          {showLoanDetails && selectedLoan && (
            <div className="fixed inset-0 z-[1100] flex items-end justify-center">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowLoanDetails(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-xl bg-zinc-900 rounded-t-[40px] p-8 pb-12 flex flex-col gap-8 h-[85vh] overflow-y-auto no-scrollbar"
              >
                <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto" onClick={() => { setShowLoanDetails(false); setLoanPaymentStep('details'); }} />
                
                <header className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                       {loanPaymentStep === 'details' ? 'Detalhes do Empréstimo' : 
                        loanPaymentStep === 'method' ? 'Forma de Pagamento' :
                        loanPaymentStep === 'pix' ? 'Pagamento via PIX' : 'Cartão de Crédito'}
                     </p>
                     <h2 className="text-3xl font-black text-white italic">Z {Number(selectedLoan.total_payable).toLocaleString('pt-BR')}</h2>
                   </div>
                   <button 
                    onClick={() => {
                      if (loanPaymentStep !== 'details') {
                        setLoanPaymentStep('details');
                      } else {
                        setShowLoanDetails(false);
                      }
                    }}
                    className="size-10 rounded-full bg-zinc-800/50 flex items-center justify-center text-white"
                   >
                     <span className="material-symbols-outlined">{loanPaymentStep === 'details' ? 'close' : 'arrow_back'}</span>
                   </button>
                </header>

                <AnimatePresence mode="wait">
                  {loanPaymentStep === 'details' && (
                    <motion.div 
                      key="details"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-bold text-zinc-500 uppercase">Juros</p>
                           <p className="font-black text-white">{selectedLoan.interest_rate}% ao mês</p>
                        </div>
                        <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                           <p className="text-[9px] font-bold text-zinc-500 uppercase">Parcelas Pagas</p>
                           <p className="font-black text-white">{selectedLoan.paid_installments || 0} de {selectedLoan.installments_count}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="font-black text-xs uppercase tracking-widest text-zinc-400">Plano de Parcelamento</h3>
                          <p className="text-[9px] font-bold text-zinc-600 uppercase">Selecione para pagar</p>
                        </div>

                        <div className="space-y-2">
                          {Array.from({ length: selectedLoan.installments_count }).map((_, i) => {
                            const installmentNumber = i + 1;
                            const isPaid = installmentNumber <= (selectedLoan.paid_installments || 0);
                            const isSelected = selectedInstallments.includes(installmentNumber);
                            const isSelectable = !isPaid && (installmentNumber === (selectedLoan.paid_installments || 0) + 1 || selectedInstallments.includes(installmentNumber - 1));

                            return (
                              <div 
                                key={i}
                                onClick={() => {
                                  if (isPaid) return;
                                  if (isSelected) {
                                    setSelectedInstallments(prev => prev.filter(n => n < installmentNumber));
                                  } else if (isSelectable) {
                                    setSelectedInstallments(prev => [...prev, installmentNumber]);
                                  }
                                }}
                                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                  isPaid ? 'bg-emerald-500/5 border-emerald-500/20 opacity-50' : 
                                  isSelected ? 'bg-yellow-400 border-yellow-400 text-black' : 
                                  isSelectable ? 'bg-white/5 border-white/10' : 'bg-black/20 border-white/5 opacity-30'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                   <div className={`size-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                                     isPaid ? 'bg-emerald-500 text-black' : isSelected ? 'bg-black text-yellow-400' : 'bg-zinc-800 text-zinc-500'
                                   }`}>
                                     {isPaid ? <span className="material-symbols-outlined text-xs">check</span> : installmentNumber}
                                   </div>
                                   <div>
                                     <p className="text-[10px] font-black uppercase">Parcela {installmentNumber}</p>
                                     <p className={`text-[9px] font-bold ${isSelected ? 'text-black/60' : 'text-zinc-500'}`}>
                                       {isPaid ? 'Paga com sucesso' : `Vencimento: ${new Date(new Date(selectedLoan.due_date || selectedLoan.created_at).setMonth(new Date(selectedLoan.due_date || selectedLoan.created_at).getMonth() + i)).toLocaleDateString('pt-BR')}`}
                                     </p>
                                   </div>
                                </div>
                                <p className="font-black text-xs">Z {(Number(selectedLoan.total_payable) / selectedLoan.installments_count).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {loanPaymentStep === 'method' && (
                    <motion.div 
                      key="method"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <p className="text-[10px] font-bold text-zinc-500 uppercase text-center">Selecione como deseja pagar as parcelas</p>
                      
                      <div className="grid grid-cols-1 gap-4">
                        <button 
                          onClick={() => { setLoanPaymentStep('pix'); generateLoanPix(); }}
                          className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="size-14 rounded-3xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                              <span className="material-symbols-outlined text-3xl font-black">pix</span>
                            </div>
                            <div>
                               <p className="font-black uppercase tracking-tight text-white">Pagamento via PIX</p>
                               <p className="text-[9px] font-bold text-zinc-500 uppercase">Liberação instantânea</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-zinc-700 group-hover:text-white transition-colors">chevron_right</span>
                        </button>

                        <button 
                          onClick={() => setLoanPaymentStep('card')}
                          className="p-6 bg-white/5 border border-white/5 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all"
                        >
                          <div className="flex items-center gap-4 text-left">
                            <div className="size-14 rounded-3xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                              <span className="material-symbols-outlined text-3xl font-black">credit_card</span>
                            </div>
                            <div>
                               <p className="font-black uppercase tracking-tight text-white">Cartão de Crédito</p>
                               <p className="text-[9px] font-bold text-zinc-500 uppercase">Até 12x c/ juros do cartão</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-zinc-700 group-hover:text-white transition-colors">chevron_right</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {loanPaymentStep === 'pix' && (
                    <motion.div 
                      key="pix"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex flex-col items-center gap-8 text-center"
                    >
                      {isGeneratingPix ? (
                        <div className="size-48 bg-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4">
                           <div className="size-8 border-2 border-emerald-500 border-t-transparent animate-spin rounded-full" />
                           <p className="text-[10px] font-black uppercase text-zinc-500">Gerando QR Real...</p>
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-[40px] shadow-2xl shadow-emerald-500/10">
                          <img 
                            src={pixData?.qrCodeBase64 ? `data:image/png;base64,${pixData.qrCodeBase64}` : `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=error`}
                            alt="PIX QR"
                            className="size-48"
                          />
                        </div>
                      )}
                      <div className="space-y-2 w-full">
                        <p className="font-black text-emerald-500 uppercase tracking-widest text-[10px]">Copia e Cola Oficial Mercado Pago</p>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                           <p className="text-[10px] text-zinc-500 font-mono truncate max-w-[200px]">
                             {pixData?.copyPaste || "Gerando código..."}
                           </p>
                           <button 
                             onClick={() => {
                               if (pixData?.copyPaste) {
                                  navigator.clipboard.writeText(pixData.copyPaste);
                                  showToast?.("Código PIX copiado!", "success");
                               }
                             }}
                             className="size-10 bg-zinc-800 rounded-xl flex items-center justify-center active:scale-95"
                           >
                             <span className="material-symbols-outlined text-sm">content_copy</span>
                           </button>
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                         <p className="text-[9px] font-bold text-emerald-500 uppercase leading-relaxed">
                           Após o pagamento, o sistema identificará automaticamente em até 30 segundos.
                         </p>
                      </div>
                      <button 
                        onClick={() => handlePaySelectedInstallments('pix')}
                        disabled={isPayingInstallments || isGeneratingPix}
                        className="w-full py-5 bg-emerald-500 rounded-2xl font-black text-black uppercase tracking-widest active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isPayingInstallments ? <div className="size-5 border-2 border-black border-t-transparent animate-spin rounded-full" /> : "Já paguei via PIX"}
                      </button>
                    </motion.div>
                  )}

                  {loanPaymentStep === 'card' && (
                    <motion.div 
                      key="card"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-6"
                    >
                      <p className="text-[10px] font-bold text-zinc-500 uppercase">Escolha um cartão salvo</p>
                      <div className="space-y-3">
                        {savedCards.length > 0 ? savedCards.map((card: any) => (
                          <button 
                            key={card.id}
                            onClick={() => setSelectedMethod('card')}
                            className={`w-full p-5 rounded-3xl border flex items-center justify-between transition-all ${
                              selectedMethod === 'card' ? 'bg-blue-500/20 border-blue-500' : 'bg-white/5 border-white/5'
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="size-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                                 <span className="material-symbols-outlined text-xl">credit_card</span>
                              </div>
                              <div className="text-left">
                                <p className="font-black text-xs uppercase">{card.brand} •••• {card.last_four}</p>
                                <p className="text-[9px] font-bold text-zinc-500">CARTÃO PRINCIPAL</p>
                              </div>
                            </div>
                            <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selectedMethod === 'card' ? 'border-blue-500 bg-blue-500' : 'border-zinc-700'}`}>
                              {selectedMethod === 'card' && <div className="size-2 bg-white rounded-full" />}
                            </div>
                          </button>
                        )) : (
                          <div className="p-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                             <p className="text-[10px] font-bold text-zinc-600 uppercase">Nenhum cartão cadastrado</p>
                          </div>
                        )}
                        <button 
                          onClick={() => setWalletMode('add_card')}
                          className="w-full py-4 border border-dashed border-zinc-800 rounded-2xl text-[10px] font-black uppercase text-zinc-500 flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">add_circle</span>
                          Novo Cartão
                        </button>
                      </div>

                      <button 
                        onClick={() => handlePaySelectedInstallments('card')}
                        disabled={isPayingInstallments || (savedCards.length === 0)}
                        className="w-full py-5 bg-blue-500 rounded-2xl font-black text-white uppercase tracking-widest active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPayingInstallments ? <div className="size-5 border-white border-t-transparent animate-spin rounded-full" /> : "Confirmar Pagamento"}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
                  <div className="flex justify-between items-center text-white">
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Selecionado</p>
                     <p className="text-xl font-black italic">Z {((Number(selectedLoan.total_payable) / selectedLoan.installments_count) * selectedInstallments.length).toLocaleString('pt-BR')}</p>
                  </div>
                  
                  {loanPaymentStep === 'details' && selectedLoan.status !== 'paid' && (
                    <button 
                      onClick={() => setLoanPaymentStep('method')}
                      disabled={selectedInstallments.length === 0 || isPayingInstallments}
                      className="w-full py-5 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      {isPayingInstallments ? (
                        <div className="size-5 border-2 border-black border-t-transparent animate-spin rounded-full" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined">payments</span>
                          Pagar {selectedInstallments.length} Parcela(s)
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
            </div>
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

        {/* AÇÕES RÁPIDAS - GRID DE 3 COLUNAS */}
        <div className="grid grid-cols-3 gap-1 w-full max-w-sm mx-auto">
          {[
            { icon: "add_circle", label: "Depositar", action: () => setShowDepositModal(true) },
            { icon: "arrow_outward", label: "Enviar", action: () => setWalletMode("transfer") },
            { icon: "qr_code_scanner", label: "Escanear", action: () => setWalletMode("scan") },
            { icon: "qr_code", label: "Meu QR", action: () => setWalletMode("my_qr") },
            { icon: "account_balance", label: "Crédito", action: () => setWalletMode("loans") },
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
