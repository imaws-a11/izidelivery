import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { Html5Qrcode } from "html5-qrcode";
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import pixLogo from "../../../assets/images/pix-logo.png";

// Componente para o Leitor de QR Code usando a câmera nativa ou Web
const ScannerWrapper = ({ onResult, onCancel }: { onResult: (text: string) => void; onCancel: () => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const resultRef = useRef(onResult);
  const cancelRef = useRef(onCancel);
  const [status, setStatus] = useState<"initializing" | "ready" | "error">("initializing");
  
  useEffect(() => {
    let isMounted = true;
    let scanner: Html5Qrcode | null = null;

    const startScan = async () => {
      console.log("[SCANNER] Iniciando scanner...", Capacitor.getPlatform());
      
      if (Capacitor.isNativePlatform()) {
        try {
          // 1. Checar/Pedir permissões
          const { camera } = await BarcodeScanner.checkPermissions();
          if (camera !== 'granted') {
            const { camera: newStatus } = await BarcodeScanner.requestPermissions();
            if (newStatus !== 'granted') {
              onCancel();
              return;
            }
          }

          // 2. O método .scan() abre uma ACTIVITY NATIVA (Google Barcode Scanner)
          // Ela tem UI própria, botão de fechar e lanterna. Não precisa de overlay web.
          const { barcodes } = await BarcodeScanner.scan();
          
          if (isMounted) {
            if (barcodes.length > 0) {
              onResult(barcodes[0].displayValue);
            } else {
              onCancel();
            }
          }
        } catch (err) {
          console.error("[SCANNER] Erro nativo:", err);
          onCancel();
        }
      } else {
        // Web Fallback
        try {
          scanner = new Html5Qrcode("reader");
          await scanner.start(
            { facingMode: "environment" },
            { fps: 20, qrbox: { width: 280, height: 280 } },
            (text) => {
              if (isMounted) {
                scanner?.stop().catch(() => {});
                onResult(text);
              }
            },
            () => {}
          );
          setStatus("ready");
        } catch (err) {
          console.error("[SCANNER] Erro web:", err);
          setStatus("error");
        }
      }
    };

    startScan();

    return () => {
      isMounted = false;
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {});
      }
    };
  }, []);

  // No Native, retornamos apenas um fundo preto/loading enquanto a activity abre
  // No Web, retornamos o container do leitor
  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center">
      <div id="reader" className="w-full h-full" />
      
      {/* Botão de Voltar Sempre Disponível (para caso a câmera demore) */}
      <button 
        onClick={onCancel}
        className="absolute z-[2001] right-6 size-14 rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
        style={{ top: 'max(24px, env(safe-area-inset-top, 24px))' }}
      >
         <span className="material-symbols-outlined text-3xl">close</span>
      </button>

      {status === "initializing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black z-[2005]">
           <div className="size-12 border-4 border-yellow-400 border-t-transparent animate-spin rounded-full" />
           <p className="text-zinc-500 font-black text-[10px] uppercase tracking-widest">Iniciando Câmera...</p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black z-[2006] p-10 text-center">
           <span className="material-symbols-outlined text-red-500 text-6xl">videocam_off</span>
           <div className="space-y-2">
             <h3 className="text-white font-black text-xl uppercase tracking-tighter">Erro na Câmera</h3>
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Não foi possível acessar sua câmera. Verifique as permissões.</p>
           </div>
           <button 
             onClick={onCancel}
             className="px-10 py-4 bg-white/10 rounded-full text-white font-black text-[10px] uppercase tracking-widest"
           >
             Voltar
           </button>
        </div>
      )}

      <style>{`
        #reader video { width: 100% !important; height: 100% !important; object-fit: cover !important; }
        #reader__scan_region, #reader__dashboard, #reader__camera_selection, #reader__header_message, #reader canvas, #reader img, #reader > *:not(video) { display: none !important; }
      `}</style>
    </div>
  );
};

interface IziPayViewProps {
  walletTransactions?: any[];
  iziCoins?: number;
  userName?: string;
  userId?: string | null;
  onBack?: () => void;
  walletBalance?: number;
  iziCoinValue?: number;
  onDeposit?: (amount: number, method: string) => void;
}

const QuickAction = ({ icon, label, onClick, color = "bg-zinc-50", active = false }: any) => (
  <motion.button 
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className="flex flex-col items-center gap-3 group"
  >
    <div className={`size-16 ${active ? 'bg-zinc-900 shadow-xl scale-110' : color} rounded-[24px] flex items-center justify-center shadow-[10px_10px_20px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(255,255,255,0.5)] group-active:shadow-inner transition-all border ${active ? 'border-zinc-800' : 'border-white/40'}`}>
      <span className={`material-symbols-rounded text-2xl font-black ${active ? 'text-yellow-400' : 'text-zinc-900'}`}>{icon}</span>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${active ? 'text-zinc-900' : 'text-zinc-500'} group-hover:text-black transition-colors`}>{label}</span>
  </motion.button>
);

const TransactionItem = ({ title, date, amount, icon, color }: any) => {
  const displayTitle = (title?.toLowerCase().includes('adjustment') || title?.toLowerCase().includes('manual')) 
    ? "Crédito Izi" 
    : title;

  return (
    <div className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-all rounded-[28px] border border-transparent hover:border-zinc-100 group">
      <div className="flex items-center gap-5">
        <div className={`size-12 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
          <span className="material-symbols-rounded text-xl font-black">{icon}</span>
        </div>
        <div>
          <p className="font-black text-[15px] text-zinc-900 tracking-tight">{displayTitle}</p>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-black text-base tracking-tighter ${amount.startsWith('+') ? 'text-emerald-500' : 'text-zinc-900'}`}>
          {amount}
        </p>
        <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Confirmado</span>
      </div>
    </div>
  );
};

// ========== COMPONENTE: Tela de Detalhes do Empréstimo + Pagamento ==========
type PayStep = 'details' | 'select' | 'method' | 'confirm';
function LoanDetailScreen({ loan, amt, rate, inst, pmt, totalDue, totalInterest, cetAnual, isOverdue, daysOverdue, multa, mora, onClose, userId, onPaymentSuccess }: {
  loan: any; amt: number; rate: number; inst: number; pmt: number; totalDue: number; totalInterest: number; cetAnual: number;
  isOverdue: boolean; daysOverdue: number; multa: number; mora: number; onClose: () => void; userId: string; onPaymentSuccess: () => void;
}) {
  const [step, setStep] = React.useState<PayStep>('details');
  const [payQty, setPayQty] = React.useState(1); // quantas parcelas pagar
  const [payAll, setPayAll] = React.useState(false);
  const [payMethod, setPayMethod] = React.useState<'pix' | 'card' | 'lightning' | null>(null);
  const [processing, setProcessing] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const parcelaComEncargos = isOverdue ? pmt + multa + mora : pmt;
  const payValue = payAll ? totalDue : parcelaComEncargos * payQty;

  // Calcular desconto para quitação antecipada (abate juros futuros proporcionalmente)
  const quitacaoTotal = (() => {
    let saldo = amt;
    for (let i = 1; i <= inst; i++) {
      const j = saldo * rate;
      const a = pmt - j;
      saldo = Math.max(saldo - a, 0);
    }
    // desconto = juros remanescentes de parcelas futuras (~5% off)
    return totalDue * 0.95;
  })();

  const handlePay = async () => {
    setProcessing(true);
    try {
      // Simular pagamento — registrar transação
      await supabase.from('wallet_transactions_delivery').insert({
        user_id: userId,
        type: 'loan_payment',
        amount: -(payAll ? quitacaoTotal : payValue),
        status: 'completed',
        description: payAll
          ? `Quitação total - Empréstimo #${loan.id.slice(0,5)}`
          : `Pagamento ${payQty}x parcela(s) - #${loan.id.slice(0,5)} via ${payMethod?.toUpperCase()}`,
        balance_after: 0
      });

      // Se pagou tudo, marcar como liquidado
      if (payAll) {
        await supabase.from('loans_delivery').update({ status: 'paid' }).eq('id', loan.id);
      }

      setDone(true);
      setTimeout(() => onPaymentSuccess(), 2000);
    } catch (e) {
      console.error('[LOAN PAY]', e);
    } finally {
      setProcessing(false);
    }
  };

  const statusLabel = loan.status === 'paid' ? 'Liquidado' : loan.status === 'pending' ? 'Em Análise' : loan.status === 'rejected' ? 'Recusado' : 'Ativo';
  const statusColor = loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
    loan.status === 'pending' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
    loan.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
    'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';

  return (
    <motion.div key="loan-detail-fullscreen" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 280 }}
      className="fixed inset-0 bg-white z-[1050] overflow-y-auto"
    >
      {/* Header */}
      <header className="px-6 pt-14 pb-4 flex items-center gap-4 bg-white sticky top-0 z-20 border-b border-zinc-100">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => step === 'details' ? onClose() : setStep('details')} className="size-11 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
          <span className="material-symbols-rounded text-black">arrow_back</span>
        </motion.button>
        <div className="flex-1">
          <h2 className="text-lg font-black uppercase tracking-tight">{step === 'details' ? 'Meu Crédito' : step === 'select' ? 'Pagar Parcelas' : step === 'method' ? 'Pagamento' : 'Confirmação'}</h2>
          <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">#{loan.id.slice(0,8)}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>{statusLabel}</span>
      </header>

      <div className="p-6 pb-32 space-y-5">
        {done ? (
          /* === TELA: Sucesso === */
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-rounded text-emerald-500 text-5xl">check_circle</span>
            </div>
            <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Pagamento Registrado!</h3>
            <p className="text-zinc-500 text-sm font-bold max-w-xs">Seu pagamento foi processado com sucesso. O saldo será atualizado em instantes.</p>
          </motion.div>

        ) : step === 'confirm' ? (
          /* === TELA: Confirmação === */
          <div className="space-y-6">
            <div className="bg-zinc-900 text-white p-8 rounded-[32px] text-center space-y-4">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Valor a Pagar</p>
              <p className="text-4xl font-black tracking-tighter">R$ {(payAll ? quitacaoTotal : payValue).toFixed(2).replace('.', ',')}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="material-symbols-rounded text-yellow-400 text-lg">{payMethod === 'pix' ? 'qr_code_2' : payMethod === 'lightning' ? 'bolt' : 'credit_card'}</span>
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{payMethod === 'pix' ? 'PIX' : payMethod === 'lightning' ? 'Bitcoin Lightning' : 'Cartão de Crédito'}</span>
              </div>
              {payAll && <p className="text-[9px] font-bold text-emerald-400">Quitação com 5% de desconto nos juros futuros</p>}
            </div>
            <div className="bg-zinc-50 p-5 rounded-[24px] space-y-2">
              <div className="flex justify-between text-xs"><span className="text-zinc-400 font-bold">Parcelas</span><span className="font-black text-zinc-900">{payAll ? `Quitação Total (${inst}x)` : `${payQty}x parcela(s)`}</span></div>
              <div className="flex justify-between text-xs"><span className="text-zinc-400 font-bold">Método</span><span className="font-black text-zinc-900">{payMethod === 'pix' ? 'PIX' : payMethod === 'lightning' ? 'BTC Lightning' : 'Cartão'}</span></div>
              {isOverdue && <div className="flex justify-between text-xs"><span className="text-red-400 font-bold">Encargos inclusos</span><span className="font-black text-red-500">R$ {(multa + mora).toFixed(2)}</span></div>}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} onClick={handlePay} disabled={processing}
              className="w-full h-16 bg-emerald-400 text-black rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-emerald-400/30 disabled:opacity-50"
            >{processing ? 'Processando...' : 'Confirmar Pagamento'}</motion.button>
          </div>

        ) : step === 'method' ? (
          /* === TELA: Método de Pagamento === */
          <div className="space-y-5">
            <div className="bg-zinc-50 p-6 rounded-[28px] text-center">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Valor Total</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tighter">R$ {(payAll ? quitacaoTotal : payValue).toFixed(2).replace('.', ',')}</p>
            </div>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Escolha o Método</p>
            {([
              { id: 'pix' as const, icon: 'qr_code_2', name: 'PIX', desc: 'Instantâneo • Sem taxas', color: 'bg-teal-50 text-teal-600' },
              { id: 'card' as const, icon: 'credit_card', name: 'Cartão de Crédito', desc: 'Visa, Master, Elo', color: 'bg-indigo-50 text-indigo-600' },
              { id: 'lightning' as const, icon: 'bolt', name: 'Bitcoin Lightning', desc: 'Satoshis • Instantâneo', color: 'bg-amber-50 text-amber-600' },
            ]).map(m => (
              <motion.button key={m.id} whileTap={{ scale: 0.97 }}
                onClick={() => { setPayMethod(m.id); setStep('confirm'); }}
                className={`w-full p-5 rounded-[24px] border flex items-center gap-4 text-left transition-all ${payMethod === m.id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 bg-white'}`}
              >
                <div className={`size-12 rounded-2xl ${payMethod === m.id ? 'bg-white/10' : m.color} flex items-center justify-center`}>
                  <span className="material-symbols-rounded text-xl">{m.icon}</span>
                </div>
                <div>
                  <p className="font-black text-sm">{m.name}</p>
                  <p className={`text-[10px] font-bold ${payMethod === m.id ? 'text-white/60' : 'text-zinc-400'}`}>{m.desc}</p>
                </div>
                <span className="material-symbols-rounded ml-auto text-lg opacity-30">chevron_right</span>
              </motion.button>
            ))}
          </div>

        ) : step === 'select' ? (
          /* === TELA: Selecionar Parcelas === */
          <div className="space-y-5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-2">Quantas parcelas deseja pagar?</p>
            {/* Parcela única */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPayQty(1); setPayAll(false); setStep('method'); }}
              className="w-full p-6 rounded-[28px] bg-white border border-zinc-100 shadow-sm text-left flex items-center gap-4"
            >
              <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><span className="material-symbols-rounded text-xl">receipt</span></div>
              <div className="flex-1">
                <p className="font-black text-sm text-zinc-900">Próxima Parcela</p>
                <p className="text-[10px] font-bold text-zinc-400">{isOverdue ? 'Com multa e mora' : 'Parcela mensal'}</p>
              </div>
              <p className="text-lg font-black text-zinc-900">R$ {parcelaComEncargos.toFixed(2).replace('.', ',')}</p>
            </motion.button>
            {/* Antecipar múltiplas */}
            {inst > 1 && (
              <div className="bg-white p-6 rounded-[28px] border border-zinc-100 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><span className="material-symbols-rounded text-xl">fast_forward</span></div>
                  <div>
                    <p className="font-black text-sm text-zinc-900">Antecipar Parcelas</p>
                    <p className="text-[10px] font-bold text-zinc-400">Selecione a quantidade</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: Math.min(inst, 6) }, (_, i) => i + 1).map(q => (
                    <button key={q} onClick={() => setPayQty(q)}
                      className={`h-11 px-5 rounded-2xl font-black text-xs transition-all ${payQty === q && !payAll ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-500 border border-zinc-100'}`}
                    >{q}x</button>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-zinc-50">
                  <span className="text-[10px] font-bold text-zinc-400">Total:</span>
                  <span className="text-lg font-black text-zinc-900">R$ {(pmt * payQty).toFixed(2).replace('.', ',')}</span>
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPayAll(false); setStep('method'); }}
                  className="w-full h-12 bg-indigo-500 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                >Pagar {payQty} parcela{payQty > 1 ? 's' : ''}</motion.button>
              </div>
            )}
            {/* Quitar tudo */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setPayAll(true); setStep('method'); }}
              className="w-full p-6 rounded-[28px] bg-zinc-900 text-white text-left flex items-center gap-4"
            >
              <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center"><span className="material-symbols-rounded text-xl text-emerald-400">paid</span></div>
              <div className="flex-1">
                <p className="font-black text-sm">Quitar Tudo</p>
                <p className="text-[10px] font-bold text-zinc-500">5% de desconto nos juros futuros</p>
              </div>
              <p className="text-lg font-black text-emerald-400">R$ {quitacaoTotal.toFixed(2).replace('.', ',')}</p>
            </motion.button>
          </div>

        ) : (
          /* === TELA: Detalhes === */
          <>
            {/* Card principal */}
            <div className="bg-zinc-900 text-white p-6 rounded-[28px] grid grid-cols-3 gap-3">
              <div><p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest mb-1">Valor</p><p className="text-xl font-black">R$ {amt.toFixed(2).replace('.', ',')}</p></div>
              <div className="text-center"><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Parcela</p><p className="text-xl font-black text-emerald-400">{inst}x {pmt.toFixed(2)}</p></div>
              <div className="text-right"><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total</p><p className="text-xl font-black text-white">R$ {totalDue.toFixed(2).replace('.', ',')}</p></div>
            </div>
            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-zinc-50 p-4 rounded-[20px]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Solicitado em</p><p className="text-xs font-black text-zinc-900">{new Date(loan.created_at).toLocaleDateString('pt-BR')}</p></div>
              <div className={`p-4 rounded-[20px] ${isOverdue ? 'bg-red-50' : 'bg-zinc-50'}`}><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">1º Vencimento</p><p className={`text-xs font-black ${isOverdue ? 'text-red-500' : 'text-zinc-900'}`}>{new Date(loan.due_date).toLocaleDateString('pt-BR')}</p></div>
              <div className="bg-zinc-50 p-4 rounded-[20px]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Juros</p><p className="text-xs font-black text-red-500">R$ {totalInterest.toFixed(2).replace('.', ',')}</p></div>
              <div className="bg-zinc-50 p-4 rounded-[20px]"><p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">CET Anual</p><p className="text-xs font-black text-zinc-900">{cetAnual.toFixed(1).replace('.', ',')}%</p></div>
            </div>
            {/* Amortização */}
            {(loan.status === 'active' || loan.status === 'paid') && (
              <div className="bg-zinc-50 p-5 rounded-[24px] space-y-3">
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Amortização (Tabela Price)</p>
                <div className="grid grid-cols-5 gap-1 text-[9px] font-black text-zinc-400 uppercase border-b border-zinc-200 pb-2"><span>Nº</span><span>Venc.</span><span>Juros</span><span>Amort.</span><span className="text-right">Saldo</span></div>
                {(() => { let s = amt; const r: React.ReactNode[] = []; for (let i = 1; i <= inst; i++) { const j = s * rate; const a = pmt - j; s = Math.max(s - a, 0); const v = new Date(loan.due_date); v.setMonth(v.getMonth() + (i - 1)); r.push(<div key={i} className="grid grid-cols-5 gap-1 text-[10px] py-2 border-b border-zinc-100 last:border-0"><span className="font-black text-zinc-800">{i}ª</span><span className="text-zinc-500 font-bold">{v.toLocaleDateString('pt-BR', {day:'2-digit',month:'2-digit'})}</span><span className="text-red-400 font-bold">{j.toFixed(2)}</span><span className="text-emerald-500 font-bold">{a.toFixed(2)}</span><span className="font-black text-zinc-700 text-right">{s.toFixed(2)}</span></div>); } return r; })()}
              </div>
            )}
            {/* Atraso */}
            {isOverdue && (
              <div className="bg-red-50 p-5 rounded-[24px] border border-red-200 space-y-3">
                <div className="flex items-center gap-2"><span className="material-symbols-rounded text-red-500 text-xl">warning</span><p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Atraso: {daysOverdue} dias</p></div>
                <div className="grid grid-cols-2 gap-3"><div><p className="text-[9px] font-bold text-red-400 uppercase">Multa (2%)</p><p className="text-sm font-black text-red-600">R$ {multa.toFixed(2)}</p></div><div><p className="text-[9px] font-bold text-red-400 uppercase">Mora (1% a.m.)</p><p className="text-sm font-black text-red-600">R$ {mora.toFixed(2)}</p></div></div>
              </div>
            )}
            {/* Info legal */}
            <div className="p-4 space-y-1">
              <p className="text-[8px] font-bold text-zinc-500">• Taxa: {(rate*100).toFixed(1)}% a.m. (juros compostos - Tabela Price)</p>
              <p className="text-[8px] font-bold text-zinc-500">• Multa por atraso: 2% sobre parcela vencida (CDC Art. 52)</p>
              <p className="text-[8px] font-bold text-zinc-500">• Juros de mora: 1% a.m. pro-rata (CC Art. 406)</p>
            </div>
          </>
        )}
      </div>

      {/* Botão fixo de pagamento (só na tela de detalhes, se ativo) */}
      {step === 'details' && loan.status === 'active' && (
        <div className="fixed bottom-8 inset-x-0 px-6 z-[1100] pointer-events-none">
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep('select')}
            className="w-full h-16 bg-emerald-400 text-black rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-400/40 pointer-events-auto"
          >Pagar Parcelas</motion.button>
        </div>
      )}
    </motion.div>
  );
}

export const IziPayView: React.FC<IziPayViewProps> = ({ 
  walletTransactions = [], 
  iziCoins = 0, 
  userName = "Usuário",
  userId,
  onBack,
  walletBalance = 0,
  iziCoinValue = 1.0,
  onDeposit
}) => {
  const [subView, setSubView] = useState<"main" | "send" | "my_qr" | "loan" | "deposit" | "scan" | "statement">("main");
  const [depositAmount, setDepositAmount] = useState("50");
  const [depositMethod, setDepositMethod] = useState("lightning");
  const [isProcessing, setIsProcessing] = useState(false);
  const [balance, setBalance] = useState(walletBalance);
  const [coins, setCoins] = useState(iziCoins);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [sendAmount, setSendAmount] = useState("");
  const [manualRecipient, setManualRecipient] = useState("");

  // --- Estados do Izi Crédito ---
  const [loanAmount, setLoanAmount] = useState("");
  const [loanInstallments, setLoanInstallments] = useState(6);
  const [loanInterestRate, setLoanInterestRate] = useState(12);
  const [preApprovedLimit, setPreApprovedLimit] = useState(0);
  const [existingLoans, setExistingLoans] = useState<any[]>([]);
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanSubmitting, setLoanSubmitting] = useState(false);
  const [loanSuccess, setLoanSuccess] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<any | null>(null);

  // Fetch dados de crédito ao abrir a tela de empréstimo
  useEffect(() => {
    if (subView !== 'loan' || !userId) return;
    const fetchLoanData = async () => {
      setLoanLoading(true);
      setLoanSuccess(false);
      try {
        // 1. Buscar limite individual do usuário
        const { data: userData } = await supabase
          .from('users_delivery')
          .select('pre_approved_limit')
          .eq('id', userId)
          .single();

        // 2. Buscar configurações globais (limite base + taxa de juros)
        const { data: settings } = await supabase
          .from('app_settings_delivery')
          .select('global_pre_approved_limit, loan_interest_rate')
          .single();

        // Limite: individual se existir, senão global
        const individualLimit = userData?.pre_approved_limit;
        const globalLimit = settings?.global_pre_approved_limit || 0;
        setPreApprovedLimit(individualLimit && individualLimit > 0 ? individualLimit : globalLimit);
        setLoanInterestRate(settings?.loan_interest_rate || 12);

        // 3. Buscar empréstimos existentes do usuário
        const { data: loans } = await supabase
          .from('loans_delivery')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        setExistingLoans(loans || []);
      } catch (err) {
        console.error('[LOAN] Erro ao buscar dados:', err);
      } finally {
        setLoanLoading(false);
      }
    };
    fetchLoanData();
  }, [subView, userId]);

  useEffect(() => {
    if (userId) {
      const fetchBalance = async () => {
        const { data } = await supabase
          .from('users_delivery')
          .select('wallet_balance, izi_coins')
          .eq('id', userId)
          .single();
        if (data) {
          setBalance(data.wallet_balance || 0);
          setCoins(data.izi_coins || 0);
        }
      };
      fetchBalance();
    }
  }, [userId, walletBalance, iziCoins]);

  const renderMain = () => (
    <motion.div 
      key="main" 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="pb-32"
    >
      <header className="bg-zinc-900 px-6 pt-32 pb-32 rounded-b-[60px] relative shadow-2xl overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/20 blur-[100px] rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400/10 blur-[80px] rounded-full -ml-24 -mb-24" />
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <motion.button 
              whileTap={{ scale: 0.9 }} 
              onClick={onBack}
              className="size-12 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center text-white"
            >
              <span className="material-symbols-rounded text-2xl font-black">arrow_back</span>
            </motion.button>
            <div>
               <h1 className="text-2xl font-black text-white tracking-tighter uppercase leading-none">Izi Pay</h1>
               <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mt-1">Digital Wallet</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[48px] shadow-[0_30px_60px_rgba(0,0,0,0.3)] relative z-20 border border-white/20">
            {/* Design Consolidado com Duas Carteiras */}
            <div className="space-y-6">
               <div className="space-y-1">
                  <div className="flex items-center gap-2 ml-1">
                      <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em]">Patrimônio Total (BRL)</p>
                      <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="text-zinc-400">
                         <span className="material-symbols-rounded text-sm">{isBalanceVisible ? 'visibility' : 'visibility_off'}</span>
                      </button>
                  </div>
                  <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">
                     {isBalanceVisible ? `R$ ${(balance + (coins * iziCoinValue)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "••••••"}
                  </h2>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  {/* Card Dinheiro (Consolidado) */}
                  <div className="bg-zinc-50 p-5 rounded-[32px] border border-zinc-100 flex flex-col gap-2">
                     <div className="flex items-center gap-2">
                        <div className="size-6 rounded-lg bg-emerald-500 flex items-center justify-center">
                           <span className="material-symbols-rounded text-white text-[14px]">payments</span>
                        </div>
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Saldo em R$</span>
                     </div>
                     <p className="text-xl font-black text-zinc-900 tracking-tighter">
                        {isBalanceVisible ? `R$ ${(balance + (coins * iziCoinValue)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "••••"}
                     </p>
                     <span className="text-[7px] font-black text-zinc-400 uppercase tracking-tighter">Valor Total Disponível</span>
                  </div>

                  {/* Card Izi Coins */}
                  <div className="bg-zinc-900 p-5 rounded-[32px] border border-zinc-800 flex flex-col gap-2 shadow-xl">
                     <div className="flex items-center gap-2">
                        <div className="size-6 rounded-lg bg-yellow-400 flex items-center justify-center">
                           <span className="material-symbols-rounded text-black text-[14px] fill-1">stars</span>
                        </div>
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Moedas</span>
                     </div>
                     <div className="flex flex-col">
                        <p className="text-xl font-black text-white tracking-tighter leading-none">
                           {isBalanceVisible ? coins.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : "••••"}
                        </p>
                        <span className="text-[8px] font-black text-yellow-400/50 uppercase tracking-widest mt-1">Izi Coins</span>
                     </div>
                  </div>
               </div>

               {/* Cotação Informativa Destaque - Compacto */}
               <div className="bg-yellow-400 rounded-[24px] p-3 flex items-center justify-between shadow-lg shadow-yellow-400/10 border border-yellow-300">
                  <div className="flex items-center gap-3">
                     <div className="size-8 rounded-xl bg-black flex items-center justify-center">
                        <span className="material-symbols-rounded text-yellow-400 text-base font-black">currency_exchange</span>
                     </div>
                     <div>
                        <p className="text-[8px] font-black text-black/40 uppercase tracking-widest leading-none mb-0.5">Cotação Garantida</p>
                        <p className="text-xs font-black text-black uppercase tracking-tighter">1 IZI = R$ {iziCoinValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} BRL</p>
                     </div>
                  </div>
                  <div className="bg-black/5 px-2 py-1 rounded-lg flex items-center gap-1.5">
                     <span className="material-symbols-rounded text-black text-[14px]">trending_up</span>
                     <span className="text-[9px] font-black text-black uppercase">Estável</span>
                  </div>
               </div>
            </div>
          
          <div className="flex gap-4 mt-10">
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setSubView("deposit")}
              className="flex-1 bg-yellow-400 text-black h-16 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-yellow-400/20 border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all"
            >
              Depositar
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.96 }}
              onClick={() => setSubView("loan")}
              className="flex-1 bg-zinc-900 text-white h-16 rounded-[24px] font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-zinc-900/20"
            >
              Izi Crédito
            </motion.button>
          </div>
        </div>
      </header>

      <main className="px-6 -mt-12 space-y-12 relative z-30">
        <section className="bg-white rounded-[48px] p-8 shadow-xl border border-zinc-100 flex items-center justify-between gap-2">
          <QuickAction icon="qr_code_scanner" label="Escanear" onClick={() => setSubView("scan")} />
          <QuickAction icon="send" label="Enviar" onClick={() => setSubView("send")} />
          <QuickAction icon="qr_code_2" label="Meu QR" onClick={() => setSubView("my_qr")} />
          <QuickAction icon="receipt_long" label="Extrato" onClick={() => setSubView("statement")} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 px-4">
            <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Atividades</h3>
            <button className="text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:text-black transition-colors">Ver histórico completo</button>
          </div>
          <div className="bg-white rounded-[48px] p-3 shadow-xl border border-zinc-100 space-y-1">
            {walletTransactions.length > 0 ? (
              walletTransactions.slice(0, 5).map((tx, idx) => (
                <TransactionItem 
                   key={tx.id || idx}
                   title={tx.description || tx.type}
                   date={new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                   amount={`${tx.type === 'credit' ? '+' : '-'} R$ ${tx.amount.toFixed(2)}`}
                   icon={tx.type === 'credit' ? 'add' : 'remove'}
                   color={tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}
                />
              ))
            ) : (
              <div className="py-20 flex flex-col items-center text-center px-10">
                <div className="size-20 rounded-[32px] bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100">
                  <span className="material-symbols-rounded text-4xl text-zinc-300">history</span>
                </div>
                <p className="text-[13px] font-black text-zinc-500 uppercase tracking-widest leading-relaxed">Você ainda não possui <br/> transações registradas</p>
              </div>
            )}
          </div>
        </section>

        {/* Banner promocional Izi Pay */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
           <div className="absolute top-0 right-0 size-40 bg-white/10 blur-[50px] -mr-20 -mt-20" />
           <div className="relative z-10 flex flex-col gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest self-start">Benefício Exclusivo</span>
              <h4 className="text-2xl font-black tracking-tight leading-tight max-w-[200px]">Pague com Izi Pay e ganhe 1% de Cashback</h4>
              <p className="text-white/60 text-xs font-bold mt-2">Em todos os estabelecimentos parceiros</p>
           </div>
           <span className="material-symbols-rounded text-[100px] text-white/5 absolute -right-4 -bottom-6 rotate-12">account_balance_wallet</span>
        </section>
      </main>
      <div className="h-40" /> {/* Extra spacing for bottom navigation overlap */}
    </motion.div>
  );

  const renderSend = () => (
    <motion.div 
      initial={{ x: "100%" }} 
      animate={{ x: 0 }} 
      exit={{ x: "100%" }}
      className="fixed inset-0 bg-white z-[1050] flex flex-col"
    >
      <header className="px-6 pt-20 pb-6 flex items-center gap-6 sticky top-0 bg-white z-50">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("main")} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
          <span className="material-symbols-rounded text-black font-black">arrow_back</span>
        </motion.button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Enviar Izi Pay</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-10 pt-6 pb-40">
        <div className="p-8 bg-zinc-50 rounded-[40px] border border-zinc-100 shadow-inner">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 ml-1">Destinatário</p>
          <div className="flex items-center gap-4">
             <div className="size-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0">
                <span className="material-symbols-rounded text-yellow-400">person</span>
             </div>
             <input 
               autoFocus={!recipientData}
               placeholder="E-mail, CPF ou @usuário" 
               value={recipientData ? recipientData.name : manualRecipient}
               onChange={(e) => setManualRecipient(e.target.value)}
               className="flex-1 bg-transparent text-xl font-black outline-none placeholder:text-zinc-300" 
             />
             {recipientData && (
                <button onClick={() => setRecipientData(null)} className="size-8 rounded-full bg-zinc-200 flex items-center justify-center">
                   <span className="material-symbols-rounded text-xs">close</span>
                </button>
             )}
          </div>
        </div>

        <div className="p-8 bg-zinc-50 rounded-[40px] border border-zinc-100 shadow-inner">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 ml-1">Valor da Transferência</p>
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-black text-zinc-400">R$</span>
            <input 
              autoFocus={!!recipientData}
              type="number" 
              placeholder="0,00" 
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              className="flex-1 bg-transparent text-6xl font-black outline-none text-zinc-900 tracking-tighter" 
            />
          </div>
          <div className="mt-6 flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
             <span className="text-zinc-500">Saldo em Carteira</span>
             <span className="text-zinc-900">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {[10, 50, 100, 200].map(val => (
             <button 
               key={val} 
               onClick={() => setSendAmount(val.toString())}
               className={`h-16 rounded-3xl border font-black text-sm shadow-sm active:scale-95 transition-all ${sendAmount === val.toString() ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-white border-zinc-100 text-zinc-600'}`}
             >
               + R$ {val}
             </button>
           ))}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-8 bg-white/80 backdrop-blur-xl border-t border-zinc-50">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          disabled={isProcessing || !recipientData || !sendAmount || parseFloat(sendAmount) <= 0}
          onClick={handleTransfer}
          className={`w-full h-20 rounded-[32px] font-black uppercase tracking-widest shadow-2xl transition-all ${isProcessing || !recipientData || !sendAmount ? 'bg-zinc-200 text-zinc-400' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}
        >
          {isProcessing ? "Processando..." : "Confirmar Envio"}
        </motion.button>
      </div>
    </motion.div>
  );

  const renderMyQR = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-zinc-900 z-[1050] flex flex-col p-8"
    >
      <motion.button 
        whileTap={{ scale: 0.9 }} 
        onClick={() => setSubView("main")} 
        className="size-14 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center text-white absolute top-16 left-6"
      >
        <span className="material-symbols-rounded font-black">close</span>
      </motion.button>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black tracking-tight text-white uppercase mb-3">Seu Izi QR</h2>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em]">Apresente para receber pagamentos</p>
        </div>

        <div className="bg-white p-12 rounded-[64px] shadow-[0_40px_80px_rgba(0,0,0,0.5)] relative overflow-hidden group mb-12">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none" />
          <div className="size-72 bg-white rounded-[48px] flex items-center justify-center border-2 border-zinc-100 shadow-inner overflow-hidden p-8 relative">
            {userId ? (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=izipay:${userId}&margin=10`}
                className="w-full h-full object-contain transition-opacity duration-500"
                alt="Meu QR Code Izi Pay"
                onLoad={(e) => (e.currentTarget.style.opacity = '1')}
                style={{ opacity: 0 }}
              />
            ) : (
              <div className="flex flex-col items-center gap-4 text-zinc-300">
                 <div className="size-12 border-4 border-zinc-100 border-t-yellow-400 rounded-full animate-spin" />
                 <p className="text-[9px] font-black uppercase tracking-[0.2em]">Sincronizando ID...</p>
              </div>
            )}
          </div>
          <div className="absolute bottom-6 inset-x-0 flex justify-center">
             <div className="bg-zinc-900 px-4 py-1.5 rounded-full flex items-center gap-2">
                <div className="size-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Código Dinâmico</span>
             </div>
          </div>
        </div>

        <div className="text-center space-y-12">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">ID da Carteira</p>
            <p className="text-2xl font-black text-white uppercase tracking-tighter">@{userName.toLowerCase().replace(/\s+/g, '_')}</p>
          </div>
          
          <div className="flex gap-4">
             <motion.button 
               whileTap={{ scale: 0.95 }}
               className="bg-white text-zinc-900 px-10 h-16 rounded-[24px] font-black uppercase text-[11px] tracking-widest shadow-xl flex items-center gap-3"
             >
               <span className="material-symbols-rounded text-lg">share</span>
               Compartilhar
             </motion.button>
             <motion.button 
               whileTap={{ scale: 0.95 }}
               className="bg-white/5 border border-white/10 text-white px-8 h-16 rounded-[24px] font-black uppercase text-[11px] tracking-widest backdrop-blur-xl flex items-center justify-center"
             >
               <span className="material-symbols-rounded text-lg">download</span>
             </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const handleSubmitLoan = async () => {
    const amount = parseFloat(loanAmount);
    if (!amount || amount <= 0) return;
    if (amount > preApprovedLimit) return;
    if (!userId) return;

    // Verificar se já tem empréstimo pendente ou ativo
    const hasActive = existingLoans.some(l => l.status === 'pending' || l.status === 'active');
    if (hasActive) return;

    setLoanSubmitting(true);
    try {
      const mRate = loanInterestRate / 100;
      const pmtN = loanInstallments;
      const pmt = amount * (mRate * Math.pow(1 + mRate, pmtN)) / (Math.pow(1 + mRate, pmtN) - 1);
      const totalPay = pmt * pmtN;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 1ª parcela em 30 dias

      const { error } = await supabase.from('loans_delivery').insert({
        user_id: userId,
        amount: amount,
        installments: loanInstallments,
        installment_value: parseFloat(pmt.toFixed(2)),
        interest_rate: loanInterestRate,
        status: 'pending',
        reason: `Tabela Price - ${loanInstallments}x R$ ${pmt.toFixed(2)} | Total: R$ ${totalPay.toFixed(2)} | CET: ${((Math.pow(1 + mRate, 12) - 1) * 100).toFixed(1)}% a.a.`,
        due_date: dueDate.toISOString()
      });

      if (error) throw error;
      setLoanSuccess(true);
      // Refresh lista
      const { data: loans } = await supabase
        .from('loans_delivery')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setExistingLoans(loans || []);
    } catch (err: any) {
      console.error('[LOAN] Erro ao solicitar:', err);
      alert('Erro ao solicitar crédito: ' + (err.message || 'Tente novamente'));
    } finally {
      setLoanSubmitting(false);
    }
  };

  const renderLoan = () => {
    const amount = parseFloat(loanAmount) || 0;
    // Juros compostos - Tabela Price: PMT = PV * [i(1+i)^n / ((1+i)^n - 1)]
    const monthlyRate = (loanInterestRate || 12) / 100; // taxa mensal
    const n = loanInstallments || 1;
    const installmentValue = amount > 0 && monthlyRate > 0
      ? amount * (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1)
      : amount / n;
    const totalPayable = installmentValue * n;
    const totalInterest = totalPayable - amount;
    const cetAnual = amount > 0 ? ((Math.pow(1 + monthlyRate, 12) - 1) * 100) : 0;
    // Data do 1º vencimento (30 dias)
    const firstDueDate = new Date();
    firstDueDate.setDate(firstDueDate.getDate() + 30);
    const lastDueDate = new Date();
    lastDueDate.setMonth(lastDueDate.getMonth() + n);
    const hasActiveLoan = existingLoans.some(l => l.status === 'pending' || l.status === 'active');
    const canSubmit = amount > 0 && amount <= preApprovedLimit && !hasActiveLoan && !loanSubmitting;

    return (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      className="fixed inset-0 bg-zinc-50 z-[1050] overflow-y-auto"
    >
      <header className="px-6 pt-20 pb-6 flex items-center gap-6 bg-white border-b border-zinc-100 sticky top-0 z-20">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => { setSubView("main"); setLoanSuccess(false); setLoanAmount(""); }} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
          <span className="material-symbols-rounded text-black font-black">arrow_back</span>
        </motion.button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Izi Crédito</h2>
      </header>

      <div className="p-6 space-y-8 pt-8 pb-40">
        {loanLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="size-12 border-4 border-yellow-400 border-t-transparent animate-spin rounded-full" />
            <p className="text-zinc-400 font-black text-[10px] uppercase tracking-widest">Carregando dados de crédito...</p>
          </div>
        ) : loanSuccess ? (
          <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
            <div className="size-24 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <span className="material-symbols-rounded text-emerald-500 text-5xl">check_circle</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">Solicitação Enviada!</h3>
              <p className="text-zinc-500 text-sm font-bold max-w-xs">Sua solicitação de crédito está em análise. Você receberá uma notificação quando for aprovada.</p>
            </div>
            <button onClick={() => { setSubView("main"); setLoanSuccess(false); setLoanAmount(""); }} className="px-10 py-4 bg-zinc-900 text-white rounded-full font-black text-[10px] uppercase tracking-widest mt-4">
              Voltar para Carteira
            </button>
          </div>
        ) : (
          <>
            {/* Card do Limite Pré-Aprovado */}
            <div className="bg-zinc-900 text-white p-10 rounded-[60px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 size-64 bg-blue-500/20 blur-[100px] rounded-full" />
              <div className="relative z-10">
                <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Crédito Pré-Aprovado</p>
                <h3 className="text-5xl font-black tracking-tighter mb-4">
                  R$ {preApprovedLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </h3>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 px-0 py-2">
                    <span className="material-symbols-rounded text-yellow-400 text-lg fill-1">verified_user</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Aprovação Digital</span>
                  </div>
                  <div className="flex items-center gap-2 px-0 py-2">
                    <span className="material-symbols-rounded text-emerald-400 text-lg">percent</span>
                    <span className="text-[9px] font-black text-white uppercase tracking-widest">Taxa: {loanInterestRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Empréstimos existentes */}
            {existingLoans.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest ml-2">Seus Empréstimos</h4>
                {existingLoans.map((loan) => (
                  <motion.div 
                    key={loan.id} 
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedLoan(loan)}
                    className="bg-white p-6 rounded-[32px] border border-zinc-100 shadow-sm cursor-pointer active:bg-zinc-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-2xl flex items-center justify-center ${
                          loan.status === 'paid' ? 'bg-emerald-50 text-emerald-500' :
                          loan.status === 'pending' ? 'bg-indigo-50 text-indigo-500' :
                          loan.status === 'rejected' ? 'bg-red-50 text-red-500' :
                          'bg-yellow-50 text-yellow-600'
                        }`}>
                          <span className="material-symbols-rounded text-lg">
                            {loan.status === 'paid' ? 'check_circle' : loan.status === 'pending' ? 'hourglass_top' : loan.status === 'rejected' ? 'cancel' : 'account_balance'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-black text-zinc-900">R$ {parseFloat(loan.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(loan.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          loan.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                          loan.status === 'pending' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                          loan.status === 'rejected' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                          'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                        }`}>
                          {loan.status === 'paid' ? 'Liquidado' : loan.status === 'pending' ? 'Em Análise' : loan.status === 'rejected' ? 'Recusado' : 'Ativo'}
                        </span>
                        <span className="material-symbols-rounded text-zinc-300 text-lg">chevron_right</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Tela Fullscreen - Detalhes do Empréstimo + Pagamento */}
            <AnimatePresence>
              {selectedLoan && (() => {
                const sl = selectedLoan;
                const amt = parseFloat(sl.amount || 0);
                const rate = (parseFloat(sl.interest_rate) || 12) / 100;
                const inst = sl.installments || 1;
                const pmt = rate > 0 ? amt * (rate * Math.pow(1+rate, inst)) / (Math.pow(1+rate, inst) - 1) : amt / inst;
                const totalDue = pmt * inst;
                const totalInterest = totalDue - amt;
                const cetAnual = ((Math.pow(1 + rate, 12) - 1) * 100);
                const isOverdue = sl.status === 'active' && new Date(sl.due_date) < new Date();
                const daysOverdue = isOverdue ? Math.floor((Date.now() - new Date(sl.due_date).getTime()) / 86400000) : 0;
                const multa = isOverdue ? pmt * 0.02 : 0;
                const mora = isOverdue ? pmt * (0.01 / 30) * daysOverdue : 0;

                return (
                  <LoanDetailScreen
                    loan={sl}
                    amt={amt} rate={rate} inst={inst} pmt={pmt}
                    totalDue={totalDue} totalInterest={totalInterest} cetAnual={cetAnual}
                    isOverdue={isOverdue} daysOverdue={daysOverdue} multa={multa} mora={mora}
                    onClose={() => setSelectedLoan(null)}
                    userId={userId}
                    onPaymentSuccess={async () => {
                      const { data: loans } = await supabase
                        .from('loans_delivery')
                        .select('*')
                        .eq('user_id', userId)
                        .order('created_at', { ascending: false });
                      setExistingLoans(loans || []);
                      setSelectedLoan(null);
                    }}
                  />
                );
              })()}
            </AnimatePresence>

            {/* Formulário de Solicitação */}
            {hasActiveLoan ? (
              <div className="bg-amber-50/10 p-6 rounded-[32px] border-none flex items-center gap-4">
                <span className="material-symbols-rounded text-amber-500 text-2xl">info</span>
                <p className="text-amber-600 text-sm font-bold">Você já possui uma solicitação {existingLoans.find(l => l.status === 'pending') ? 'em análise' : 'ativa'}. Aguarde a conclusão antes de solicitar um novo crédito.</p>
              </div>
            ) : preApprovedLimit <= 0 ? (
              <div className="bg-zinc-100 p-8 rounded-[32px] flex flex-col items-center text-center gap-4">
                <span className="material-symbols-rounded text-zinc-300 text-5xl">lock</span>
                <p className="text-zinc-500 font-black text-sm uppercase tracking-tight">Crédito não disponível</p>
                <p className="text-zinc-400 text-xs font-bold">Você ainda não possui um limite pré-aprovado. Continue usando a plataforma para liberar esta funcionalidade.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <h4 className="text-xl font-black tracking-tight uppercase ml-2">Solicitar Crédito</h4>
                
                {/* Valor */}
                <div className="p-8 bg-transparent rounded-[40px] border-none">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 ml-1">Valor do Empréstimo</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-zinc-300">R$</span>
                    <input 
                      type="number" 
                      value={loanAmount}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!e.target.value) { setLoanAmount(""); return; }
                        if (val <= preApprovedLimit) setLoanAmount(e.target.value);
                      }}
                      placeholder="0"
                      max={preApprovedLimit}
                      className="w-full bg-transparent text-4xl font-black outline-none tracking-tighter text-zinc-900 placeholder:text-zinc-200" 
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex gap-2">
                      {[50, 100, 200].filter(v => v <= preApprovedLimit).map(val => (
                        <button key={val} onClick={() => setLoanAmount(String(val))} className="px-4 py-2 rounded-xl bg-zinc-50 border border-zinc-100 text-xs font-black text-zinc-600 active:scale-95 transition-all">
                          R$ {val}
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] font-black text-zinc-400 uppercase">Máx: R$ {preApprovedLimit.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                {/* Parcelas */}
                <div className="p-8 bg-transparent rounded-[40px] border-none">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 ml-1">Plano de Pagamento</p>
                  <div className="grid grid-cols-4 gap-3">
                    {[3, 6, 12, 24].map(p => (
                      <button 
                        key={p}
                        onClick={() => setLoanInstallments(p)}
                        className={`h-16 rounded-[22px] font-black uppercase tracking-widest transition-all ${loanInstallments === p ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 scale-105' : 'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}
                      >
                        {p}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resumo dinâmico detalhado */}
                {amount > 0 && (
                  <div className="space-y-4">
                    {/* Card principal */}
                    <div className="bg-emerald-50/10 p-7 rounded-[32px] border-none space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Parcela Mensal</p>
                          <p className="text-3xl font-black text-zinc-900 tracking-tighter">{n}x R$ {installmentValue.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Montante Total</p>
                          <p className="text-xl font-black text-zinc-900 tracking-tight">R$ {totalPayable.toFixed(2).replace('.', ',')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Grid de detalhes */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-transparent p-5 rounded-[24px] border-none">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">1º Vencimento</p>
                        <p className="text-sm font-black text-zinc-900">{firstDueDate.toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="bg-transparent p-5 rounded-[24px] border-none">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Último Vencimento</p>
                        <p className="text-sm font-black text-zinc-900">{lastDueDate.toLocaleDateString('pt-BR')}</p>
                      </div>
                      <div className="bg-transparent p-5 rounded-[24px] border-none">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total de Juros</p>
                        <p className="text-sm font-black text-red-500">R$ {totalInterest.toFixed(2).replace('.', ',')}</p>
                      </div>
                      <div className="bg-white p-5 rounded-[24px] border border-zinc-100">
                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">CET Anual</p>
                        <p className="text-sm font-black text-zinc-900">{cetAnual.toFixed(1).replace('.', ',')}%</p>
                      </div>
                    </div>

                    {/* Mini tabela de amortização */}
                    <div className="bg-transparent p-5 rounded-[24px] border-none space-y-3">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Prévia da Amortização (Price)</p>
                      {(() => {
                        let saldo = amount;
                        const rows: {parc: number, juros: number, amort: number, saldoF: number, venc: string}[] = [];
                        for (let i = 1; i <= Math.min(n, 3); i++) {
                          const jurosMes = saldo * monthlyRate;
                          const amortMes = installmentValue - jurosMes;
                          saldo -= amortMes;
                          const venc = new Date();
                          venc.setDate(venc.getDate() + 30 * i);
                          rows.push({ parc: i, juros: jurosMes, amort: amortMes, saldoF: Math.max(saldo, 0), venc: venc.toLocaleDateString('pt-BR') });
                        }
                        return rows.map(r => (
                          <div key={r.parc} className="flex items-center justify-between text-[10px] py-2 border-b border-zinc-50 last:border-0">
                            <span className="font-black text-zinc-900 w-8">{r.parc}ª</span>
                            <span className="text-zinc-400 font-bold">{r.venc}</span>
                            <span className="text-red-400 font-bold">J: {r.juros.toFixed(2)}</span>
                            <span className="text-emerald-500 font-bold">A: {r.amort.toFixed(2)}</span>
                            <span className="font-black text-zinc-600">Saldo: {r.saldoF.toFixed(2)}</span>
                          </div>
                        ));
                      })()}
                      {n > 3 && <p className="text-[9px] text-zinc-300 font-bold text-center">+ {n - 3} parcelas restantes</p>}
                    </div>

                    {/* Informações legais */}
                    <div className="p-4 space-y-1">
                      <p className="text-[9px] font-bold text-zinc-500">• Taxa mensal: <span className="text-zinc-700">{loanInterestRate}% a.m.</span> (juros compostos)</p>
                      <p className="text-[9px] font-bold text-zinc-500">• Multa por atraso: <span className="text-zinc-700">2% sobre parcela vencida</span></p>
                      <p className="text-[9px] font-bold text-zinc-500">• Juros de mora: <span className="text-zinc-700">1% a.m. pro-rata</span></p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Botão de envio fixo flutuante */}
        {!loanLoading && !loanSuccess && !hasActiveLoan && preApprovedLimit > 0 && (
          <div className="fixed bottom-10 inset-x-0 px-6 z-[1100] pointer-events-none">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmitLoan}
              disabled={!canSubmit}
              className={`w-full h-16 font-black text-sm uppercase tracking-widest rounded-full shadow-2xl transition-all pointer-events-auto ${
                canSubmit 
                  ? 'bg-emerald-400 text-black shadow-emerald-400/40 active:scale-[0.98]' 
                  : 'bg-zinc-900 text-zinc-500 shadow-xl shadow-zinc-900/20'
              }`}
            >
              {loanSubmitting ? 'Enviando...' : amount > 0 ? `Solicitar R$ ${amount.toFixed(2).replace('.', ',')}` : 'Informe um valor'}
            </motion.button>
          </div>
        )}
      </div>
    </motion.div>
  );
  };

  const [recipientData, setRecipientData] = useState<{ 
    id: string, 
    name: string, 
    isMerchant?: boolean, 
    avatar?: string,
    category?: string,
    disabled?: boolean
  } | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);

  const handleSearchRecipient = useCallback(async (term: string) => {
    if (!term || term.length < 3) return;
    setIsSearchingRecipient(true);
    
    try {
      // 1. Tenta buscar em users_delivery (Cliente)
      const { data: userData } = await supabase
        .from('users_delivery')
        .select('id, name, email, avatar_url')
        .or(`id.eq.${term},email.eq.${term},phone.eq.${term}`)
        .maybeSingle();

      if (userData) {
        setRecipientData({ 
          id: userData.id, 
          name: userData.name || userData.email || "Usuário Izi",
          avatar: userData.avatar_url,
          category: "Usuário Izi Pay"
        });
        return;
      }

      // 2. Se não encontrou, tenta em admin_users (Lojista)
      const { data: merchantData } = await supabase
        .from('admin_users')
        .select('id, store_name, email, payment_enabled, store_logo, store_type')
        .eq('id', term)
        .eq('role', 'merchant')
        .maybeSingle();

      if (merchantData) {
        if (merchantData.payment_enabled === false) {
          setRecipientData({ 
            id: merchantData.id, 
            name: "Lojista com Pagamentos Desativados", 
            isMerchant: true, 
            disabled: true,
            avatar: merchantData.store_logo,
            category: merchantData.store_type || "Lojista"
          });
        } else {
          setRecipientData({ 
            id: merchantData.id, 
            name: merchantData.store_name || "Lojista Izi", 
            isMerchant: true,
            avatar: merchantData.store_logo,
            category: merchantData.store_type || "Lojista"
          });
        }
        return;
      }

      // 3. Busca genérica por store_name ou name se não for UUID
      if (term.length > 5 && !term.includes('-')) {
         const { data: searchUser } = await supabase
           .from('users_delivery')
           .select('id, name')
           .ilike('name', `%${term}%`)
           .limit(1)
           .maybeSingle();
           
         if (searchUser) {
            setRecipientData({ id: searchUser.id, name: searchUser.name });
            return;
         }
      }

      setRecipientData(null);
    } catch (err) {
      console.error("Erro ao buscar destinatário:", err);
    } finally {
      setIsSearchingRecipient(false);
    }
  }, []);

  const handleScanResult = useCallback(async (text: string) => {
    const cleanId = text
      .replace("izipay:", "")
      .replace("merchant:", "")
      .replace("user:", "")
      .trim();
      
    setShowScanModal(true);
    await handleSearchRecipient(cleanId);
  }, [handleSearchRecipient]);

  // Debounce para busca manual
  useEffect(() => {
    if (subView === 'send' && manualRecipient.length >= 3 && !recipientData) {
      const timer = setTimeout(() => handleSearchRecipient(manualRecipient), 800);
      return () => clearTimeout(timer);
    }
  }, [manualRecipient, subView, recipientData, handleSearchRecipient]);

  const handleTransfer = async () => {
    const amount = parseFloat(sendAmount);
    if (!amount || amount <= 0 || !recipientData || !userId) return;
    
    // No ecossistema IZI, transferências usam prioritariamente Izi Coins
    if (amount > coins) {
      alert("Saldo de Izi Coins insuficiente para esta transferência.");
      return;
    }

    setIsProcessing(true);
    try {
      let finalRecipientAmount = amount;
      let merchantPushToken = null;

      // 0. Buscar configurações globais de taxas
      const { data: globalSettings } = await supabase
        .from('app_settings_delivery')
        .select('izi_pay_merchant_commission, p2p_transfer_fee, maintenance_mode')
        .single();

      if (globalSettings?.maintenance_mode) {
        alert("O ecossistema IZI Pay está em manutenção. Tente novamente mais tarde.");
        setIsProcessing(false);
        return;
      }

      const globalP2PFee = globalSettings?.p2p_transfer_fee || 0;
      const globalMerchantCommission = globalSettings?.izi_pay_merchant_commission || 10;

      // 1. Se for lojista, calcular comissão e buscar token de push
      if (recipientData.isMerchant) {
        const { data: merchantInfo } = await supabase
          .from('admin_users')
          .select('commission_percent, push_token')
          .eq('id', recipientData.id)
          .single();

        const commissionPercent = merchantInfo?.commission_percent || globalMerchantCommission;
        finalRecipientAmount = amount * (1 - commissionPercent / 100);
        merchantPushToken = merchantInfo?.push_token;
      } else {
        // Se for usuário comum, aplicar taxa P2P se houver
        if (globalP2PFee > 0) {
          if (amount < globalP2PFee) {
            alert(`O valor da transferência deve ser maior que a taxa de R$ ${globalP2PFee.toFixed(2)}.`);
            setIsProcessing(false);
            return;
          }
          finalRecipientAmount = amount - globalP2PFee;
        }
      }

      // 2. Debitar do remetente (valor BRUTO)
      const { error: debitTxError } = await supabase.from('wallet_transactions_delivery').insert({
        user_id: userId,
        amount: amount,
        type: 'transferencia_envio',
        description: `Envio para ${recipientData.name}`,
        status: 'completed'
      });

      if (debitTxError) throw debitTxError;

      // 3. Atualizar saldo do remetente
      await supabase.from('users_delivery')
        .update({ izi_coins: coins - amount })
        .eq('id', userId);

      // 4. Creditar no destinatário (valor LÍQUIDO se for lojista)
      if (recipientData.isMerchant) {
         await supabase.from('wallet_transactions_delivery').insert({
           user_id: recipientData.id,
           amount: finalRecipientAmount,
           type: 'venda',
           description: `Recebimento IziPay de ${userName} (Bruto: R$ ${amount.toFixed(2)})`,
           status: 'completed'
         });

         // Disparar Notificação Push para o Lojista
         if (merchantPushToken) {
           supabase.functions.invoke('send-push-notification', {
             body: { 
               merchant_id: recipientData.id, 
               title: 'Pagamento Recebido! 💰', 
               body: `Você recebeu R$ ${finalRecipientAmount.toFixed(2)} de ${userName}.`,
               data: { type: 'payment_received', amount: finalRecipientAmount } 
             }
           }).catch(e => console.error("Erro ao enviar push:", e));
         }
      } else {
         await supabase.from('wallet_transactions_delivery').insert({
           user_id: recipientData.id,
           amount: finalRecipientAmount,
           type: 'transferencia_recebimento',
           description: `Recebimento de ${userName}${globalP2PFee > 0 ? ` (Taxa de R$ ${globalP2PFee.toFixed(2)} deduzida)` : ''}`,
           status: 'completed'
         });
         
         const { data: destUser } = await supabase
           .from('users_delivery')
           .select('izi_coins, push_token')
           .eq('id', recipientData.id)
           .single();
           
         await supabase.from('users_delivery')
           .update({ izi_coins: (destUser?.izi_coins || 0) + finalRecipientAmount })
           .eq('id', recipientData.id);

         // Notificação para Usuário
         if (destUser?.push_token) {
           supabase.functions.invoke('send-push-notification', {
             body: { 
               user_id: recipientData.id, 
               title: 'Saldo Recebido! ⚡', 
               body: `${userName} te enviou R$ ${finalRecipientAmount.toFixed(2)} Izi Coins.`,
               data: { type: 'transfer_received', amount: finalRecipientAmount } 
             }
           }).catch(e => console.error("Erro ao enviar push:", e));
         }
      }

      alert("Transferência realizada com sucesso!");
      setSubView("main");
      setSendAmount("");
      setRecipientData(null);
      setManualRecipient("");
      
      setCoins(prev => prev - amount);
    } catch (err) {
      console.error("Erro na transferência:", err);
      alert("Erro ao realizar transferência. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  const proceedToTransfer = () => {
    setShowScanModal(false);
    setSubView("send");
  };


  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-yellow-200 overflow-x-hidden">
      <AnimatePresence mode="wait">
        {subView === "main" && renderMain()}
        {subView === "send" && renderSend()}
        {subView === "my_qr" && renderMyQR()}
        {subView === "loan" && renderLoan()}
        {subView === "scan" && (
          <ScannerWrapper 
            onCancel={() => setSubView("main")}
            onResult={handleScanResult} 
          />
        )}
        {subView === "statement" && (
           <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 bg-white z-[1050] flex flex-col">
              <header className="px-6 pt-20 pb-6 flex items-center gap-6 border-b border-zinc-100 sticky top-0 bg-white z-20">
                 <button onClick={() => setSubView("main")} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black font-black">
                    <span className="material-symbols-rounded">arrow_back</span>
                 </button>
                 <h2 className="text-xl font-black uppercase tracking-tighter">Extrato Completo</h2>
              </header>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 <div className="bg-zinc-900 p-8 rounded-[40px] text-white mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 size-32 bg-yellow-400/20 blur-[50px] rounded-full" />
                    <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Balanço do Mês</p>
                    <h3 className="text-3xl font-black tracking-tighter">
                       R$ {walletTransactions.reduce((acc, tx) => acc + (tx.type === 'credit' ? tx.amount : -tx.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                 </div>

                 {walletTransactions.length > 0 ? (
                    walletTransactions.map((tx, idx) => (
                      <TransactionItem 
                         key={tx.id || idx}
                         title={tx.description || tx.type}
                         date={new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                         amount={`${tx.type === 'credit' ? '+' : '-'} R$ ${tx.amount.toFixed(2)}`}
                         icon={tx.type === 'credit' ? 'add' : 'remove'}
                         color={tx.type === 'credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}
                      />
                    ))
                 ) : (
                    <div className="py-20 flex flex-col items-center text-center px-10">
                       <div className="size-20 rounded-[32px] bg-zinc-50 flex items-center justify-center mb-6 border border-zinc-100">
                          <span className="material-symbols-rounded text-4xl text-zinc-300">history</span>
                       </div>
                       <p className="text-[13px] font-black text-zinc-400 uppercase tracking-widest">Nenhuma transação encontrada</p>
                    </div>
                 )}
              </div>
           </motion.div>
        )}
        {subView === "deposit" && (
           <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed inset-0 bg-[#F7F7F7] z-[1050] flex flex-col">
              <header className="px-6 pt-20 pb-6 flex items-center gap-6 bg-white border-b border-zinc-100 relative z-10">
                 <button onClick={() => setSubView("main")} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-900 font-black">
                    <span className="material-symbols-rounded">arrow_back</span>
                 </button>
                 <div className="flex flex-col">
                    <h2 className="text-xl font-black text-zinc-900 uppercase tracking-tighter">Recarregar Carteira</h2>
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Depósito Instantâneo</p>
                 </div>
              </header>

              <div className="flex-1 overflow-y-auto no-scrollbar p-8 space-y-12">
                 {/* Valor Display */}
                 <section className="flex flex-col items-center justify-center py-10 bg-white rounded-[40px] shadow-sm border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.5em] mb-6">Valor do Depósito</p>
                    <div className="flex items-baseline gap-2">
                       <span className="text-3xl font-black text-zinc-300">R$</span>
                       <input 
                         type="number"
                         value={depositAmount}
                         onChange={(e) => setDepositAmount(e.target.value)}
                         className="bg-transparent text-7xl font-black text-zinc-900 outline-none w-48 text-center tracking-tighter tabular-nums"
                       />
                    </div>
                 </section>

                 {/* Chips de Valor */}
                 <section className="grid grid-cols-4 gap-3">
                    {[25, 50, 100, 200].map(val => (
                       <button 
                         key={val}
                         onClick={() => setDepositAmount(val.toString())}
                         className={`h-16 rounded-2xl border-2 font-black transition-all ${depositAmount === val.toString() ? 'bg-yellow-400 border-yellow-400 text-black shadow-lg shadow-yellow-400/20' : 'bg-white border-zinc-100 text-zinc-500'}`}
                       >
                         {val}
                       </button>
                    ))}
                 </section>

                 {/* Meios de Pagamento */}
                 <section className="space-y-6">
                    <h3 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.4em] ml-2">Escolha o Método</h3>
                    <div className="space-y-4">
                       {[
                         { id: 'lightning', label: 'Bitcoin Lightning', desc: 'Aprovação Instantânea • Cashback 1%', icon: 'bolt', color: 'text-yellow-600', bg: 'bg-yellow-50' },
                         { id: 'pix', label: 'PIX Copia e Cola', desc: 'Liberação em poucos segundos', icon: 'pix', color: 'text-emerald-600', bg: 'bg-emerald-50', isImage: true },
                         { id: 'cartao', label: 'Cartão', desc: 'Em até 12x no App', icon: 'credit_card', color: 'text-blue-600', bg: 'bg-blue-50' }
                       ].map((m) => (
                         <button 
                           key={m.id}
                           onClick={() => setDepositMethod(m.id)}
                           className={`w-full p-6 rounded-[32px] border-2 flex items-center gap-6 transition-all active:scale-[0.98] ${depositMethod === m.id ? 'bg-white border-yellow-400 shadow-xl shadow-yellow-400/5' : 'bg-white border-zinc-100'}`}
                         >
                            <div className={`size-14 rounded-2xl ${m.bg} flex items-center justify-center shrink-0`}>
                               {(m as any).isImage ? (
                                 <img src={pixLogo} alt="Pix" className="size-8 object-contain" />
                               ) : (
                                 <span className={`material-symbols-rounded text-3xl font-black ${m.color}`}>{m.icon}</span>
                               )}
                            </div>
                            <div className="text-left flex-1">
                               <p className="font-black text-zinc-900 text-lg leading-none">{m.label}</p>
                               <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-2">{m.desc}</p>
                            </div>
                            {depositMethod === m.id && (
                               <div className="size-6 rounded-full bg-yellow-400 flex items-center justify-center">
                                  <span className="material-symbols-rounded text-black text-sm font-black">check</span>
                               </div>
                            )}
                         </button>
                       ))}
                    </div>
                 </section>
              </div>

               <footer className="p-8 pb-12 bg-white border-t border-zinc-100 relative z-20">
                  <motion.button 
                    whileTap={{ scale: 0.98 }}
                    disabled={isProcessing || !depositAmount || Number(depositAmount) < 1}
                    onClick={async () => {
                       if (onDeposit) {
                          try {
                             setIsProcessing(true);
                             await onDeposit(parseFloat(depositAmount.toString().replace(",", ".")), depositMethod);
                             setSubView("main");
                          } catch (err: any) {
                             console.error("[DEPOSIT] Erro ao iniciar:", err);
                             toastError("Não foi possível iniciar o depósito.");
                          } finally {
                             setIsProcessing(false);
                          }
                       }
                    }}
                    className="w-full h-20 bg-zinc-900 text-white rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-zinc-900/20 flex items-center justify-center gap-4 group"
                  >
                     {isProcessing ? (
                        <div className="size-6 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                     ) : (
                        <>
                           <span>Confirmar Recarga</span>
                           <span className="material-symbols-rounded font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </>
                     )}
                  </motion.button>
               </footer>
           </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Scan Customizado */}
      <AnimatePresence>
        {showScanModal && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowScanModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2100]"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[56px] z-[2101] overflow-hidden shadow-[0_-30px_60px_rgba(0,0,0,0.25)]"
            >
              {/* Header do Modal com Gradiente */}
              <div className="h-32 bg-gradient-to-br from-zinc-900 to-zinc-800 relative flex items-end justify-center pb-8">
                 <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/20 rounded-full" />
                 <h3 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-60">Confirmação de Pagamento</h3>
              </div>

              <div className="px-8 pb-12 -mt-10 relative z-10">
                 {/* Avatar Centralizado */}
                 <div className="flex justify-center mb-6">
                    <div className="size-24 rounded-[40px] bg-white p-1.5 shadow-2xl relative">
                       <div className="size-full rounded-[34px] bg-zinc-100 overflow-hidden flex items-center justify-center border-2 border-zinc-50">
                          {isSearchingRecipient ? (
                             <div className="size-8 border-4 border-zinc-200 border-t-yellow-400 rounded-full animate-spin" />
                          ) : recipientData?.avatar ? (
                             <img src={recipientData.avatar} className="size-full object-cover" alt="Recipient" />
                          ) : (
                             <span className="material-symbols-rounded text-4xl text-zinc-300">
                                {recipientData?.isMerchant ? "storefront" : "person"}
                             </span>
                          )}
                       </div>
                       {!isSearchingRecipient && !recipientData?.disabled && (
                          <div className="absolute -bottom-1 -right-1 size-8 bg-yellow-400 rounded-2xl flex items-center justify-center border-4 border-white text-black shadow-lg">
                             <span className="material-symbols-rounded text-sm font-black">verified</span>
                          </div>
                       )}
                    </div>
                 </div>

                 <div className="text-center space-y-2 mb-10">
                    <h4 className="text-2xl font-black tracking-tighter text-zinc-900 leading-none">
                       {isSearchingRecipient ? "Identificando..." : recipientData?.name}
                    </h4>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                       {isSearchingRecipient ? "Aguarde um momento" : recipientData?.category}
                    </p>
                 </div>

                 {/* Card de Detalhes da Transação */}
                 <div className="bg-zinc-50 rounded-[40px] border border-zinc-100 p-8 space-y-6 mb-10">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-zinc-900 flex items-center justify-center">
                             <span className="material-symbols-rounded text-yellow-400 text-xl">payments</span>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Transação</p>
                             <p className="text-xs font-bold text-zinc-900">{recipientData?.isMerchant ? "Pagamento em Loja" : "Transferência P2P"}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Método</p>
                          <p className="text-xs font-bold text-zinc-900">Izi Coins</p>
                       </div>
                    </div>

                    <div className="h-px bg-zinc-200/60 w-full" />

                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="size-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                             <span className="material-symbols-rounded text-emerald-600 text-xl">verified_user</span>
                          </div>
                          <div>
                             <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Segurança</p>
                             <p className="text-xs font-bold text-emerald-600">Conexão Criptografada</p>
                          </div>
                       </div>
                       <span className="material-symbols-rounded text-emerald-400">shield</span>
                    </div>
                 </div>

                 {/* Ações */}
                 <div className="space-y-4">
                    <motion.button 
                      whileTap={{ scale: 0.96 }}
                      disabled={isSearchingRecipient || recipientData?.disabled}
                      onClick={proceedToTransfer}
                      className={`w-full h-20 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 ${isSearchingRecipient || recipientData?.disabled ? 'bg-zinc-200 text-zinc-400 shadow-none' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}
                    >
                      {isSearchingRecipient ? (
                         <div className="size-6 border-4 border-zinc-400/20 border-t-zinc-400 rounded-full animate-spin" />
                      ) : recipientData?.disabled ? (
                         "Indisponível"
                      ) : (
                         <>
                            <span>Prosseguir</span>
                            <span className="material-symbols-rounded">arrow_forward</span>
                         </>
                      )}
                    </motion.button>
                    
                    <button 
                      onClick={() => setShowScanModal(false)}
                      className="w-full h-14 text-zinc-400 font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center"
                    >
                      Cancelar e Voltar
                    </button>
                 </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
