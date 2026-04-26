import React, { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import iziCoinImg from "../../../assets/images/izi-coin-premium.png";
import { Html5Qrcode } from "html5-qrcode";
import { MercadoPagoCardForm } from "../../MercadoPagoCardForm";

import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

// Componente para o Leitor de QR Code usando a câmera nativa ou Web
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

    const startNativeScan = async () => {
      try {
        // Verifica/Solicita permissão
        const { camera } = await BarcodeScanner.checkPermissions();
        if (camera !== 'granted') {
          const { camera: newStatus } = await BarcodeScanner.requestPermissions();
          if (newStatus !== 'granted') {
            console.warn("Permissão de câmera negada");
            cancelRef.current();
            return;
          }
        }

        // Abre o scanner nativo (isso abre uma nova View/Activity nativa em cima do app)
        const { barcodes } = await BarcodeScanner.scan();
        
        if (barcodes.length > 0 && isMounted) {
          resultRef.current(barcodes[0].displayValue);
        } else {
          cancelRef.current();
        }
      } catch (err) {
        console.error("Erro no scanner nativo:", err);
        cancelRef.current();
      }
    };

    const startWebCamera = async () => {
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;

      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        const config = {
          fps: 20,
          aspectRatio: 1.0,
          videoConstraints: { 
            facingMode: "environment",
            // @ts-ignore
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

    if (Capacitor.isNativePlatform()) {
      startNativeScan();
    } else {
      startWebCamera();
    }

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

  // Na versão nativa, o scanner ocupa a tela inteira por conta própria.
  // Renderizamos apenas se não for nativo ou se for um fallback visual.
  if (Capacitor.isNativePlatform()) {
    return (
      <div className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center p-6 text-center">
         <div className="size-20 border-2 border-yellow-400 border-t-transparent animate-spin rounded-full mb-6" />
         <p className="font-black text-white uppercase tracking-widest text-xs">Iniciando Scanner Nativo...</p>
      </div>
    );
  }

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
  iziBlackRate?: number;
  setIziCoins?: React.Dispatch<React.SetStateAction<number>>;
  isIziBlack?: boolean;
}

export const WalletView: React.FC<WalletViewProps> = ({
  walletTransactions = [],
  myOrders = [],
  iziCoins = 0,
  setIziCoins,
  iziCashback = 0,
  userXP = 0,
  savedCards = [],
  userId,
  userName,
    iziCoinValue = 1.0,
    iziCoinRate = 1.0,
    iziBlackRate = 5.0,
    paymentMethod,
    setShowDepositModal,
    showToast,
    setPaymentsOrigin,
    setSubView,
    mercadopagoPublicKey,
    isIziBlack: initialIsIziBlack = false,
  }) => {
  const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr" | "scan" | "add_card" | "loans">("main");
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<"all" | "cashback">("all");
  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "" });
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
  const [isIziBlack, setIsIziBlack] = useState(initialIsIziBlack);
  const [blackCashbackRate, setBlackCashbackRate] = useState(iziBlackRate || 5);

  // Estados de Animação Real-time
  const [showAnimation, setShowAnimation] = useState(false);
  const [animationType, setAnimationType] = useState<"sent" | "received">("sent");
  const [doneTransferAmount, setDoneTransferAmount] = useState(0);
  const lastCoinValue = useRef(iziCoins);

  // Estados para Detalhes da Transação (Novo)
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [selectedTransactionOrder, setSelectedTransactionOrder] = useState<any>(null);
  const [isFetchingOrder, setIsFetchingOrder] = useState(false);

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
        const { data: globalRaw } = await supabase
          .from("admin_settings_delivery")
          .select("value")
          .eq("key", "global")
          .maybeSingle();
        const globalData = globalRaw?.value || null;

        const { data: userDataExtended } = await supabase
          .from("users_delivery")
          .select("is_izi_black")
          .eq("id", userId)
          .single();

        const userLimit = Number(userData?.pre_approved_limit || 0);
        const globalLimit = Number(globalData?.global_pre_approved_limit || 0);
        const globalInterest = Number(globalData?.loan_interest_rate || 10);
        const globalBlackCashback = Number(globalData?.izi_black_cashback || 5);

        // Prioridade: Limite Individual (se definido e > 0), senão usa o Global
        setPreApprovedLimit(userLimit > 0 ? userLimit : globalLimit);
        setLoanInterestRate(globalInterest);
        setBlackCashbackRate(globalBlackCashback);
        if (userDataExtended) setIsIziBlack(userDataExtended.is_izi_black);
      } catch (err) {
        console.error("Erro ao carregar configurações econômicas:", err);
      }
    };
    fetchLimit();
  }, [userId, walletMode]);

  const handleTransactionClick = async (transaction: any) => {
    setSelectedTransaction(transaction);
    if (transaction.order_id) {
      setIsFetchingOrder(true);
      try {
        const { data, error } = await supabase
          .from("orders_delivery")
          .select("*")
          .eq("id", transaction.order_id)
          .single();
        
        if (error) throw error;
        setSelectedTransactionOrder(data);
      } catch (err) {
        console.error("Erro ao buscar pedido:", err);
        showToast?.("Não foi possível carregar detalhes do pedido", "error");
      } finally {
        setIsFetchingOrder(false);
      }
    }
  };


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
      await supabase.from("wallet_transactions_delivery").insert({
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

    const cleanQuery = query.trim();
    const cleanEmail = cleanQuery.toLowerCase();
    const onlyDigits = cleanQuery.replace(/\D/g, "");

    try {
      // 1. Tenta buscar em usuários comuns
      // Filtros: id exato OR email ilike (case insensitive) OR telefone exato (com ou sem formatação)
      let userOrFilters = `email.ilike.${cleanEmail},id.eq.${cleanQuery},phone.eq.${cleanQuery}`;
      if (onlyDigits && onlyDigits.length >= 8) {
        userOrFilters += `,phone.eq.${onlyDigits}`;
      }

      const { data: users, error: userErr } = await supabase
        .from("users_delivery")
        .select("id, name, email, phone")
        .or(userOrFilters)
        .not("id", "eq", userId)
        .limit(1);

      if (users && users.length > 0) {
        setRecipient({ ...users[0], type: 'user' });
        return;
      }

      // 2. Se não achou, tenta buscar em estabelecimentos (admin_users com role merchant)
      let merchantOrFilters = `email.ilike.${cleanEmail},id.eq.${cleanQuery},store_phone.eq.${cleanQuery}`;
      if (onlyDigits && onlyDigits.length >= 8) {
        merchantOrFilters += `,store_phone.eq.${onlyDigits}`;
      }

      const { data: merchants, error: merchantErr } = await supabase
        .from("admin_users")
        .select("id, store_name, email, store_phone")
        .or(merchantOrFilters)
        .eq("role", "merchant")
        .limit(1);

      if (merchants && merchants.length > 0) {
        setRecipient({ 
          id: merchants[0].id, 
          name: merchants[0].store_name, 
          email: merchants[0].email, 
          phone: merchants[0].store_phone,
          type: 'merchant' 
        });
      } else {
        showToast?.("Destinatário não encontrado", "warning");
        setRecipient(null);
      }
    } catch (err) {
      console.error("Izi Pay Search Error:", err);
      showToast?.("Erro ao buscar destinatário", "error");
    } finally {
      setIsSearching(false);
    }
  }, [userId, searchTarget, showToast]);

  const handleTransfer = async () => {
    const val = Number(amount.replace(",", "."));
    if (isNaN(val) || val <= 0) return showToast?.("Valor inválido", "error");
    if (val > iziCoins) return showToast?.("Saldo de IZI COINS insuficiente", "error");
    if (!recipient) return;

    setIsTransferring(true);
    try {
      const newBalanceSelf = Number((iziCoins - val).toFixed(8));
      
      // 1. Débito Otimista no State (Feedback Instantâneo)
      if (setIziCoins) {
        setIziCoins(newBalanceSelf);
      }

      // 1. Débito no remetente (Banco)
      const { error: err1 } = await supabase.from("users_delivery").update({
        izi_coins: newBalanceSelf
      }).eq("id", userId);

      if (err1) {
        // Reverter em caso de erro no banco
        if (setIziCoins) setIziCoins(prev => prev + val);
        throw err1;
      }

      // 2. Registro da transação remetente
      await supabase.from("wallet_transactions_delivery").insert({
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
        await supabase.from("wallet_transactions_delivery").insert({
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
                    className="flex-1 bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal text-white"
                    style={{ WebkitUserSelect: "text", userSelect: "text", WebkitTapHighlightColor: "transparent" }}
                  />
                  <button 
                    onClick={() => handleSearchRecipient(searchTarget)}
                    disabled={isSearching}
                    className="size-14 bg-yellow-400 rounded-2xl flex items-center justify-center active:scale-95 disabled:opacity-50 shadow-lg"
                  >
                    {isSearching ? <div className="size-5 border-2 border-black border-t-transparent animate-spin rounded-full"/> : <span className="material-symbols-outlined text-black font-black">search</span>}
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-10">
              <div className="flex items-center gap-4 bg-zinc-900/40 p-5 rounded-3xl border border-white/5">
                <div className="size-14 rounded-full bg-yellow-400 flex items-center justify-center font-black text-black text-xl shadow-lg">
                  {recipient.name[0]}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="font-black uppercase truncate text-sm">{recipient.name}</p>
                  <p className="text-zinc-600 text-[10px] uppercase font-bold truncate tracking-widest mt-0.5">{recipient.email || recipient.phone || "ID Izi Black Integrado"}</p>
                </div>
                <button 
                  onClick={() => { setRecipient(null); setAmount(""); }} 
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-[9px] uppercase font-black tracking-widest text-zinc-500 hover:text-white transition-colors"
                >
                  Trocar
                </button>
              </div>

              <div className="space-y-6 pt-6 flex flex-col items-center">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center block">Quanto deseja enviar?</label>
                <div className="flex items-center justify-center gap-3 w-full max-w-[280px]">
                  <span className="text-3xl font-black text-yellow-400">Z</span>
                  <input 
                    type="text" 
                    inputMode="decimal"
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(",", ".");
                      if (/^\d*\.?\d{0,8}$/.test(val)) setAmount(val);
                    }}
                    className="bg-transparent text-5xl font-black text-white outline-none w-full text-center placeholder:text-zinc-800"
                    style={{ WebkitUserSelect: "text", userSelect: "text", WebkitTapHighlightColor: "transparent" }}
                  />
                </div>
                <div className="bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
                  <p className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    Saldo disponível: <span className="text-white">Z {iziCoins < 1 ? iziCoins.toFixed(8).replace(".", ",") : iziCoins.toLocaleString("pt-BR")}</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={handleTransfer}
                disabled={isTransferring || !amount || parseFloat(amount || "0") <= 0}
                className="w-full py-6 bg-yellow-400 rounded-3xl font-black text-black uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(250,204,21,0.2)] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all mt-8"
              >
                {isTransferring ? (
                   <span className="flex items-center justify-center gap-3">
                      <div className="size-4 border-2 border-black border-t-transparent animate-spin rounded-full"/>
                      Enviando...
                   </span>
                ) : "Confirmar Envio"}
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
          {/* Lógica de Bloqueio para Empréstimo Ativo */}
          {(() => {
            const hasActiveLoan = loans.some(l => l.status === 'pending' || l.status === 'approved' || l.status === 'active');
            
            return (
              <div className="relative space-y-6">
                {hasActiveLoan && (
                  <div className="absolute inset-x-0 inset-y-0 z-50 flex items-center justify-center p-6 text-center">
                    <div className="bg-black/80 backdrop-blur-md border border-white/10 p-8 rounded-[40px] shadow-2xl scale-90 md:scale-100">
                      <span className="material-symbols-outlined text-yellow-400 text-5xl mb-4">lock</span>
                      <h4 className="font-black text-xl uppercase tracking-tighter">Acesso Bloqueado</h4>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2 px-4 leading-relaxed">
                        Você já possui um empréstimo em andamento. <br/>
                        Quite o atual para liberar novo crédito.
                      </p>
                    </div>
                  </div>
                )}

                <div className={`space-y-6 transition-all duration-500 ${hasActiveLoan ? 'opacity-30 grayscale pointer-events-none scale-[0.98]' : ''}`}>
                  <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 p-6 rounded-[32px] text-black shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Seu Limite Pré-Aprovado</p>
                      <h2 className="text-3xl font-black mt-1">Z {preApprovedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
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
                      className="w-full py-4 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest active:scale-95 disabled:opacity-50 transition-all font-display"
                    >
                      {isTakingLoan ? "Processando..." : "Solicitar Crédito"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}
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
                  className="bg-yellow-400 p-6 rounded-[32px] border-2 border-yellow-300 flex flex-col gap-4 cursor-pointer shadow-[inset_4px_4px_8px_rgba(255,255,255,0.7)] active:scale-95 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                       <p className="text-[10px] font-black text-black/40 uppercase tracking-widest">Dívida Total</p>
                       <h4 className="text-2xl font-black text-black">Z {Number(loan.total_payable).toLocaleString('pt-BR')}</h4>
                    </div>
                     <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-black/10 text-black`}>
                      {loan.status === 'paid' ? 'Liquidado' : loan.status === 'pending' ? 'Sob Análise' : loan.status === 'rejected' ? 'Recusado' : 'A pagar'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-[10px]">
                    <div>
                       <p className="text-black/40 uppercase font-black tracking-tight">Status Pagamento</p>
                       <p className="text-black font-bold">{loan.paid_installments || 0} de {loan.installments_count} pagas</p>
                    </div>
                    <div>
                       <p className="text-black/40 uppercase font-black tracking-tight">Valor Original</p>
                       <p className="text-black font-bold">Z {Number(loan.amount).toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="mt-2 pt-3 border-t border-black/10 flex items-center justify-between">
                    <span className="text-[9px] font-black text-black/50 uppercase tracking-widest">Detalhes do Empréstimo</span>
                    <div className="size-6 rounded-full bg-black/5 flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm text-black">arrow_forward</span>
                    </div>
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
                     <h2 className="text-3xl font-black text-white">Z {Number(selectedLoan.total_payable).toLocaleString('pt-BR')}</h2>
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
                        {isPayingInstallments ? <div className="size-5 border-2 border-black border-t-transparent animate-spin rounded-full" /> : "Já paguei"}
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
                        {savedCards.length > 0 ? savedCards.slice(0, 1).map((card: any) => (
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
                     <p className="text-xl font-black">Z {((Number(selectedLoan.total_payable) / selectedLoan.installments_count) * selectedInstallments.length).toLocaleString('pt-BR')}</p>
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

        <div className="bg-zinc-900/40 p-6 rounded-[32px] border border-white/5 space-y-6">
          <div className="flex items-center gap-3 text-yellow-400 mb-2">
            <span className="material-symbols-outlined text-xl">verified_user</span>
            <p className="text-[10px] font-black uppercase tracking-wider">Checkout Seguro Mercado Pago</p>
          </div>
          
          <MercadoPagoCardForm 
            publicKey={mercadopagoPublicKey}
            onConfirm={async (token, issuer, _installments, brand, last4) => {
             setIsSavingCard(true);
             try {
               const { error } = await supabase.from("payment_methods").insert({
                 user_id: userId,
                 brand: brand,
                 last_four: last4,
                 token: token,
                 is_default: savedCards.length === 0
               });
               
               if (error) throw error;
               
               showToast?.("Cartão salvo com sucesso!", "success");
               setWalletMode("main");
               // Recarregar os cartões salvos no contexto do WalletView
               if (userId) {
                 setTimeout(() => window.location.reload(), 1000);
               }
             } catch (err: any) {
               showToast?.("Erro ao salvar: " + err.message, "error");
             } finally {
               setIsSavingCard(false);
             }
          }} />
        </div>
      </div>
    );
  }

    return (
    <div className="flex flex-col h-full bg-black text-zinc-100 overflow-y-auto no-scrollbar pb-32">
      {/* HERO SALDO - REDESIGN CLAYMORPHISM PREMIUM */}
      <div className="px-5 pt-14 pb-12 flex flex-col items-center relative overflow-hidden">
        
        <div className="flex items-center gap-3 mb-10 w-full justify-center opacity-80">
          <div className="size-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]" />
          <span className="text-white font-black tracking-[0.5em] text-[10px] uppercase">IZI PAY NETWORK</span>
          <div className="size-2 rounded-full bg-yellow-400 shadow-[0_0_10px_#facc15]" />
        </div>
        
        <div className="flex flex-col items-center justify-center w-full relative">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative flex flex-col items-center p-12 rounded-[60px] bg-[#0d0d0d] border-2 border-white/5 shadow-[20px_20px_40px_rgba(0,0,0,0.6),inset_6px_6px_12px_rgba(255,255,255,0.02),inset_-6px_-6px_12px_rgba(0,0,0,0.5)]"
          >
            <p className="text-zinc-600 text-[9px] font-black tracking-[0.5em] uppercase mb-10 opacity-40">Liquidez Disponível</p>
            
            <div className="flex items-center justify-center gap-5">
              <motion.div 
                className="size-20 drop-shadow-[0_10px_20px_rgba(250,204,21,0.3)]"
              >
                <img 
                  src={iziCoinImg} 
                  alt="Izi Coin" 
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <div className="flex items-baseline">
                <h3 className="text-5xl font-black tracking-tighter text-white tabular-nums drop-shadow-2xl">
                  {(iziCoins || 0).toLocaleString('pt-BR', { minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                </h3>
              </div>
            </div>
            
            <motion.div 
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDepositModal(true)}
              className="mt-12 px-10 py-4 bg-yellow-400 rounded-full flex items-center gap-3 shadow-[0_10_25px_rgba(250,204,21,0.15),inset_4px_4px_8px_rgba(255,255,255,0.7),inset_-4px_-4px_8px_rgba(0,0,0,0.1)] cursor-pointer group"
            >
              <span className="text-black font-black text-[11px] tracking-[0.2em] uppercase">Recarregar Saldo</span>
              <span className="material-symbols-outlined text-black text-lg font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </motion.div>
          </motion.div>

          {/* Card de Reserva Claymorphism */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 w-full max-w-[320px] bg-[#111111] rounded-[45px] p-8 border-2 border-white/5 flex flex-col gap-6 shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02)]"
          >
            <div className="flex flex-col">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                RESERVA EM REAIS
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-400 font-black text-2xl drop-shadow-[0_0_10px_rgba(52,211,153,0.3)]">R$</span>
                <span className="text-3xl font-black text-white tracking-tight">
                  {(iziCoins * iziCoinValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            
            <div className="h-[1px] w-full bg-white/5" />
            
            <div className="flex justify-between items-center opacity-60">
              <p className="text-[8px] text-zinc-600 uppercase font-black tracking-widest leading-none">Transação Criptográfica Segura</p>
              <span className="material-symbols-outlined text-xs text-emerald-500">verified</span>
            </div>
          </motion.div>
        </div>

        {/* AÇÕES RÁPIDAS - PREMIUM CLAY BUTTONS */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-sm mx-auto mt-12 px-2">
          {[
            { icon: "add", label: "Depositar", action: () => setShowDepositModal(true) },
            { icon: "send", label: "Enviar", action: () => setWalletMode("transfer") },
            { icon: "qr_code_scanner", label: "Escanear", action: () => setWalletMode("scan") },
            { icon: "qr_code", label: "Meu QR", action: () => setWalletMode("my_qr") },
            { icon: "account_balance", label: "Crédito", action: () => setWalletMode("loans") },
            { icon: "history", label: "Extrato", action: () => historyRef.current?.scrollIntoView({ behavior: 'smooth' }) },
          ].map((a) => (
            <button
              key={a.label}
              onClick={a.action}
              className="flex flex-col items-center gap-3 active:scale-90 transition-all group"
            >
              <div className="size-16 rounded-[28px] flex items-center justify-center transition-all bg-yellow-400 border-2 border-yellow-300 shadow-[inset_4px_4px_8px_rgba(255,255,255,0.7)]">
                <span className="material-symbols-outlined text-2xl font-black text-black">
                  {a.icon}
                </span>
              </div>
              <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-yellow-400 transition-colors">
                {a.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="px-6 py-10 space-y-12">
        {/* STATS - LUXURY MINIMALIST */}
        <div className="flex gap-4">
          {[
            { label: "Gastos", value: `${totalGasto.toFixed(0)}`, icon: "shopping_bag", color: "text-zinc-500" },
            { label: "Cashback", value: `${iziCashback.toFixed(0)}`, icon: "add_circle", color: "text-yellow-400" },
            { label: "Nível", value: `${Math.floor(userXP/1000) + 1}`, icon: "verified", color: "text-blue-400" },
          ].map((s, i) => (
            <div
              key={i}
              className="flex-1 flex flex-col items-center py-8 px-2 gap-3 bg-[#0d0d0d] rounded-[40px] border-2 border-white/5 shadow-[15px_15px_30px_rgba(0,0,0,0.4),inset_4px_4px_8px_rgba(255,255,255,0.02)] relative overflow-hidden group"
            >
              <span className={`material-symbols-outlined ${s.color} text-2xl font-black`}>{s.icon}</span>
              <div className="flex flex-col items-center">
                <p className="font-black text-xl text-white tracking-tighter">{s.value}</p>
                <p className="text-[8px] text-zinc-600 uppercase font-black tracking-[0.2em] mt-1">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* HISTÓRICO - CLAYMOL DESIGN */}
        <section ref={historyRef} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black text-lg text-white uppercase tracking-tighter">Histórico</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHistoryFilter(historyFilter === "all" ? "cashback" : "all")}
                className={`px-4 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all ${historyFilter === "cashback" ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 border-white/5 text-zinc-500 hover:text-zinc-300'}`}
              >
                {historyFilter === "cashback" ? "✓ Cashback" : "Cashback"}
              </button>
              <button
                onClick={() => setShowAllHistory((prev) => !prev)}
                className="px-5 py-2.5 rounded-full bg-yellow-400 border border-yellow-300 text-[10px] font-black text-black uppercase tracking-widest shadow-[inset_2px_2px_4px_rgba(255,255,255,0.7),inset_-2px_-2px_4px_rgba(0,0,0,0.1)] active:scale-95 transition-all"
              >
                {showAllHistory ? "Recolher" : "Ver Todos"}
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {walletTransactions.length === 0 ? (
              <div className="py-20 flex flex-col items-center gap-6 bg-[#0a0a0a] border-2 border-white/5 rounded-[45px] shadow-inner">
                <div className="size-16 rounded-[28px] bg-zinc-950 flex items-center justify-center border border-white/5">
                  <span className="material-symbols-outlined text-3xl text-zinc-800">receipt_long</span>
                </div>
                <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Rede Vazia</p>
              </div>
            ) : (
              <div className="space-y-4">
              {(showAllHistory 
                  ? (historyFilter === "cashback" ? walletTransactions.filter(t => t.type === 'venda' || t.description?.toLowerCase().includes('cashback')) : walletTransactions)
                  : (historyFilter === "cashback" ? walletTransactions.filter(t => t.type === 'venda' || t.description?.toLowerCase().includes('cashback')) : walletTransactions).slice(0, 20)
                ).map((t: any, i: number) => {
                const tx = txIcon[t.type] || { icon: "payments", color: "text-zinc-400" };
                const isPositive = ["deposito", "reembolso", "venda"].includes(t.type);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={t.id || i} 
                    onClick={() => handleTransactionClick(t)}
                    className="flex items-center gap-5 p-5 bg-[#0e0e0e] border-2 border-white/5 rounded-[30px] hover:border-yellow-400/20 active:scale-[0.98] transition-all cursor-pointer group shadow-[10px_10px_20px_rgba(0,0,0,0.2),inset_2px_2px_4px_rgba(255,255,255,0.02)]"
                  >
                    <div className={`size-14 rounded-[22px] flex items-center justify-center shrink-0 shadow-inner bg-zinc-950 border border-white/5 shadow-[inset_3px_3px_6px_rgba(0,0,0,0.4)]`}>
                      <span className={`material-symbols-outlined text-2xl font-black ${tx.color} group-hover:scale-110 transition-transform`}>
                        {tx.icon}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-white truncate uppercase tracking-tight">{t.description || t.type}</p>
                      <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1 opacity-60">
                        {new Date(t.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} •{" "}
                        {new Date(t.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-black text-sm ${isPositive ? "text-emerald-400" : "text-white"}`}>
                        {isPositive ? "+" : "-"} {Number(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                      </p>
                      <p className="text-[8px] text-zinc-800 font-black uppercase tracking-[0.2em] mt-1">IZI COIN</p>
                    </div>
                  </motion.div>
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

      {/* MODAL DE DETALHES DA TRANSAÇÃO - DESIGN CLAYMORPHIC PREMIUM */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setSelectedTransaction(null); setSelectedTransactionOrder(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] rounded-[50px] border-2 border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                {/* Header do Modal */}
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="size-20 rounded-[30px] bg-yellow-400 flex items-center justify-center shadow-[inset_4px_4px_8px_rgba(255,255,255,0.7),0_10px_20px_rgba(250,204,21,0.2)]">
                    <span className="material-symbols-outlined text-4xl text-black font-black">
                      {txIcon[selectedTransaction.type]?.icon || "payments"}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter">
                      {selectedTransaction.description || selectedTransaction.type}
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-1">
                      {new Date(selectedTransaction.created_at).toLocaleString("pt-BR", { dateStyle: 'long', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>

                {/* Valor Central */}
                <div className="bg-[#0e0e0e] rounded-[40px] p-8 border border-white/5 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.5),inset_-4px_-4px_8px_rgba(255,255,255,0.02)] flex flex-col items-center gap-1">
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest opacity-60">Valor da Transação</p>
                   <h4 className={`text-4xl font-black tracking-tighter ${['deposito', 'reembolso', 'venda', 'cashback'].includes(selectedTransaction.type) ? "text-emerald-400" : "text-white"}`}>
                     {['deposito', 'reembolso', 'venda', 'cashback'].includes(selectedTransaction.type) ? "+" : "-"} {Number(selectedTransaction.amount).toLocaleString("pt-BR", { minimumFractionDigits: 8, maximumFractionDigits: 8 })}
                   </h4>
                   <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">IZI COINS (Z)</p>
                </div>

                {/* Detalhes Adicionais / Pedido */}
                <div className="space-y-6">
                  {isFetchingOrder ? (
                    <div className="flex flex-col items-center py-10 gap-4">
                      <div className="size-10 border-2 border-yellow-400 border-t-transparent animate-spin rounded-full" />
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sincronizando Pedido...</p>
                    </div>
                  ) : selectedTransactionOrder ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between px-2">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Itens do Pedido</p>
                        <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">#{selectedTransactionOrder.id.slice(-6).toUpperCase()}</p>
                      </div>
                      
                      <div className="bg-white/5 rounded-[32px] p-6 space-y-4 border border-white/5">
                        {selectedTransactionOrder.items?.map((item: any, idx: number) => {
                          const quantity = item.quantity || item.qty || 1;
                          const options = item.addonDetails || item.options || [];
                          const itemPrice = Number(item.price || 0);
                          
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <p className="text-xs font-black text-white uppercase tracking-tight">
                                    {quantity}x {item.name}
                                  </p>
                                  {options.map((opt: any, oidx: number) => (
                                    <p key={oidx} className="text-[9px] text-zinc-500 font-bold uppercase ml-3">
                                      • {opt.quantity || 1}x {opt.name} {opt.price > 0 ? `(+ R$ ${Number(opt.price).toFixed(2)})` : ''}
                                    </p>
                                  ))}
                                </div>
                                <p className="text-xs font-black text-zinc-400">
                                  R$ {(itemPrice * quantity + options.reduce((acc: number, o: any) => acc + (Number(o.price || 0) * (o.quantity || 1)), 0)).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        
                        <div className="pt-4 border-t border-white/5 flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total do Pedido</p>
                            <p className="text-sm font-black text-white">R$ {Number(selectedTransactionOrder.total_price || 0).toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Estabelecimento</p>
                            <p className="text-[10px] font-black text-zinc-400 uppercase">{selectedTransactionOrder.merchant_name}</p>
                          </div>
                        </div>

                        {/* Cashback Info */}
                        {isIziBlack && (
                          <div className="pt-4 flex justify-between items-center text-emerald-400 bg-emerald-500/5 -mx-6 px-6 py-4 rounded-b-[32px]">
                            <div className="flex items-center gap-2">
                               <span className="material-symbols-outlined text-sm">redeem</span>
                               <p className="text-[10px] font-black uppercase tracking-widest">Cashback Ganho</p>
                            </div>
                            <p className="text-sm font-black">
                              + {selectedTransaction.type === 'cashback' 
                                 ? Number(selectedTransaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 8 })
                                 : ((Number(selectedTransactionOrder.total_price) * (blackCashbackRate / 100)) / (iziCoinValue || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                              } Z
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-[32px] p-6 flex flex-col items-center gap-3 text-center">
                       <span className="material-symbols-outlined text-zinc-700 text-3xl">info</span>
                       <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest leading-relaxed">Esta transação não possui vínculo direto com um pedido rastreável no momento.</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => { setSelectedTransaction(null); setSelectedTransactionOrder(null); }}
                  className="w-full py-6 bg-zinc-900 rounded-[30px] font-black text-white uppercase tracking-widest active:scale-95 transition-all shadow-[inset_4px_4px_8px_rgba(255,255,255,0.02)]"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
