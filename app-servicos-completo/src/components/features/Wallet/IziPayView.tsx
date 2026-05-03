import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { Html5Qrcode } from "html5-qrcode";
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

// Componente para o Leitor de QR Code usando a câmera nativa ou Web
const ScannerWrapper = ({ onResult, onCancel }: { onResult: (text: string) => void; onCancel: () => void }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const resultRef = useRef(onResult);
  const cancelRef = useRef(onCancel);
  const [status, setStatus] = useState<"initializing" | "ready" | "error">("initializing");
  
  useEffect(() => {
    console.log("[SCANNER] Iniciando componente...", Capacitor.getPlatform());
    resultRef.current = onResult;
    cancelRef.current = onCancel;
  }, [onResult, onCancel]);

  useEffect(() => {
    let isMounted = true;

    const startNativeScan = async () => {
      try {
        console.log("[SCANNER] Checando permissões nativas...");
        const { camera } = await BarcodeScanner.checkPermissions();
        if (camera !== 'granted') {
          const { camera: newStatus } = await BarcodeScanner.requestPermissions();
          if (newStatus !== 'granted') {
            cancelRef.current();
            return;
          }
        }

        setStatus("ready");
        await BarcodeScanner.hideBackground();
        document.body.classList.add('scanner-active');
        document.documentElement.classList.add('scanner-active');

        const { barcodes } = await BarcodeScanner.scan();
        
        await BarcodeScanner.showBackground();
        document.body.classList.remove('scanner-active');
        document.documentElement.classList.remove('scanner-active');

        if (barcodes.length > 0 && isMounted) {
          resultRef.current(barcodes[0].displayValue);
        } else {
          cancelRef.current();
        }
      } catch (err) {
        console.error("[SCANNER] Erro no scanner nativo:", err);
        await BarcodeScanner.showBackground();
        document.body.classList.remove('scanner-active');
        cancelRef.current();
      }
    };

    const startWebCamera = async () => {
      console.log("[SCANNER] Iniciando câmera Web...");
      await new Promise(r => setTimeout(r, 600));
      if (!isMounted) return;

      try {
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" }, 
          { fps: 20, aspectRatio: 1.0, qrbox: { width: 250, height: 250 } }, 
          (text) => resultRef.current(text), 
          () => {}
        );
        setStatus("ready");
      } catch (err) {
        console.error("[SCANNER] Erro ao iniciar Html5Qrcode:", err);
        setStatus("error");
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
      if (Capacitor.isNativePlatform()) {
        BarcodeScanner.showBackground().catch(() => {});
        document.body.classList.remove('scanner-active');
      }
    };
  }, []);

  if (Capacitor.isNativePlatform()) {
    return (
      <div className="fixed inset-0 z-[2000] bg-transparent flex flex-col items-center justify-between p-12 pb-32 pointer-events-none">
         <div className="w-full flex justify-end pointer-events-auto">
            <button 
              onClick={onCancel}
              className="size-14 rounded-2xl bg-black/60 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
            >
              <span className="material-symbols-outlined text-3xl">close</span>
            </button>
         </div>
         
         <div className="w-64 h-64 border-2 border-yellow-400 rounded-[40px] relative">
            <div className="absolute inset-0 border-4 border-yellow-400/20 rounded-[38px] animate-pulse" />
            <div className="absolute top-1/2 left-0 w-full h-1 bg-yellow-400/50 blur-sm animate-scan" />
         </div>

         <div className="bg-black/60 backdrop-blur-xl px-8 py-5 rounded-[30px] border border-white/10 pointer-events-auto text-center space-y-2">
            <p className="font-black text-white uppercase tracking-widest text-[10px]">Escanear QR Code</p>
            <p className="text-zinc-400 text-[8px] font-bold uppercase tracking-tight">Posicione o código no centro do quadro</p>
         </div>

         <style>{`
            @keyframes scan { 0% { top: 0%; opacity: 0; } 50% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
            .animate-scan { animation: scan 2s linear infinite; }
            
            body.scanner-active { 
              background: transparent !important; 
            }
            
            html.scanner-active, 
            body.scanner-active #root, 
            body.scanner-active .app-container { 
              background: transparent !important; 
              background-color: transparent !important;
              opacity: 0 !important; 
              visibility: hidden !important; 
            }

            body.scanner-active *:not(.pointer-events-auto):not(.fixed.inset-0.z-\\[2000\\]) {
              background-color: transparent !important;
              background: transparent !important;
              border-color: transparent !important;
              box-shadow: none !important;
            }
         `}</style>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[2000] bg-black flex flex-col items-center justify-center">
      <div id="reader" className="w-full h-full bg-black" />
      
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
             <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Não foi possível acessar sua câmera. Verifique as permissões do navegador.</p>
           </div>
           <button 
             onClick={onCancel}
             className="px-10 py-4 bg-white/10 rounded-full text-white font-black text-[10px] uppercase tracking-widest"
           >
             Voltar para Carteira
           </button>
        </div>
      )}

      <div className="absolute top-10 right-10 z-[2001]">
        <button 
          onClick={onCancel}
          className="size-14 rounded-full bg-black/60 backdrop-blur-3xl border border-white/20 flex items-center justify-center text-white active:scale-90 transition-transform"
        >
           <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      <style>{`
        #reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
        }
        #reader__scan_region, #reader__dashboard, #reader__camera_selection, #reader__header_message, #reader canvas, #reader img, #reader > *:not(video) {
          display: none !important;
        }
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
}

const QuickAction = ({ icon, label, onClick, color = "bg-white", active = false }: any) => (
  <motion.button 
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    className="flex flex-col items-center gap-3 group"
  >
    <div className={`size-16 ${active ? 'bg-zinc-900 shadow-xl scale-110' : color} rounded-[24px] flex items-center justify-center shadow-[10px_10px_20px_rgba(0,0,0,0.05),-5px_-5px_15px_rgba(255,255,255,0.8),inset_2px_2px_4px_rgba(255,255,255,0.5)] group-active:shadow-inner transition-all border ${active ? 'border-zinc-800' : 'border-white/40'}`}>
      <span className={`material-symbols-rounded text-2xl font-black ${active ? 'text-yellow-400' : 'text-zinc-900'}`}>{icon}</span>
    </div>
    <span className={`text-[10px] font-black uppercase tracking-[0.1em] ${active ? 'text-zinc-900' : 'text-zinc-400'} group-hover:text-black transition-colors`}>{label}</span>
  </motion.button>
);

const TransactionItem = ({ title, date, amount, icon, color }: any) => (
  <div className="flex items-center justify-between p-5 hover:bg-zinc-50 transition-all rounded-[28px] border border-transparent hover:border-zinc-100 group">
    <div className="flex items-center gap-5">
      <div className={`size-12 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
        <span className="material-symbols-rounded text-xl font-black">{icon}</span>
      </div>
      <div>
        <p className="font-black text-[15px] text-zinc-900 tracking-tight">{title}</p>
        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mt-0.5">{date}</p>
      </div>
    </div>
    <div className="text-right">
      <p className={`font-black text-base tracking-tighter ${amount.startsWith('+') ? 'text-emerald-500' : 'text-zinc-900'}`}>
        {amount}
      </p>
      <span className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Confirmado</span>
    </div>
  </div>
);

export const IziPayView: React.FC<IziPayViewProps> = ({ 
  walletTransactions = [], 
  iziCoins = 0, 
  userName = "Usuário",
  userId,
  onBack,
  walletBalance = 0
}) => {
  const [subView, setSubView] = useState<"main" | "send" | "my_qr" | "loan" | "deposit" | "scan">("main");
  const [balance, setBalance] = useState(walletBalance);
  const [coins, setCoins] = useState(iziCoins);
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);

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
          <div className="flex justify-between items-start mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2 ml-1">
                <p className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em]">Saldo Disponível</p>
                <button onClick={() => setIsBalanceVisible(!isBalanceVisible)} className="text-zinc-300">
                  <span className="material-symbols-rounded text-sm">{isBalanceVisible ? 'visibility' : 'visibility_off'}</span>
                </button>
              </div>
              <h2 className="text-4xl font-black text-zinc-900 tracking-tighter">
                {isBalanceVisible ? `R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "••••••"}
              </h2>
            </div>
            <div className="bg-zinc-900 px-5 py-3 rounded-[24px] flex items-center gap-3 border border-zinc-800 shadow-xl">
              <div className="size-8 rounded-full bg-yellow-400 flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                <span className="material-symbols-rounded text-black text-base font-black fill-1">stars</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-black text-white leading-none">{coins.toLocaleString('pt-BR')}</span>
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">Izi Coins</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
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
          <QuickAction icon="qr_code_scanner" label="Escanear" onClick={() => setSubView("scan")} active />
          <QuickAction icon="send" label="Enviar" onClick={() => setSubView("send")} />
          <QuickAction icon="qr_code_2" label="Meu QR" onClick={() => setSubView("my_qr")} />
          <QuickAction icon="receipt_long" label="Extrato" onClick={() => {}} />
        </section>

        <section>
          <div className="flex items-center justify-between mb-6 px-4">
            <h3 className="text-xl font-black text-zinc-900 tracking-tight uppercase">Atividades</h3>
            <button className="text-zinc-400 font-black text-[10px] uppercase tracking-widest hover:text-black transition-colors">Ver histórico completo</button>
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
                <p className="text-[13px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed">Você ainda não possui <br/> transações registradas</p>
              </div>
            )}
          </div>
        </section>

        {/* Banner promocional Izi Pay */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[48px] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-200">
           <div className="absolute top-0 right-0 size-40 bg-white/10 blur-[50px] -mr-20 -mt-20" />
           <div className="relative z-10 flex flex-col gap-2">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest self-start">Benefício Exclusivo</span>
              <h4 className="text-2xl font-black tracking-tight leading-tight max-w-[200px]">Pague com Izi Pay e ganhe 5% Cashback</h4>
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
      className="fixed inset-0 bg-white z-[100] flex flex-col"
    >
      <header className="px-6 pt-20 pb-6 flex items-center gap-6 sticky top-0 bg-white z-50">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("main")} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
          <span className="material-symbols-rounded text-black font-black">arrow_back</span>
        </motion.button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Enviar Izi Pay</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 space-y-10 pt-6 pb-40">
        <div className="p-8 bg-zinc-50 rounded-[40px] border border-zinc-100 shadow-inner">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 ml-1">Destinatário</p>
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
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 ml-1">Valor da Transferência</p>
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
             <span className="text-zinc-400">Saldo em Carteira</span>
             <span className="text-zinc-900">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           {[10, 50, 100, 200].map(val => (
             <button key={val} className="h-16 rounded-3xl bg-white border border-zinc-100 font-black text-zinc-600 text-sm shadow-sm active:scale-95 transition-all">
               + R$ {val}
             </button>
           ))}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 p-8 bg-white/80 backdrop-blur-xl border-t border-zinc-50">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          className="w-full h-20 bg-zinc-900 text-white rounded-[32px] font-black uppercase tracking-widest shadow-2xl shadow-zinc-900/20"
        >
          Confirmar Envio
        </motion.button>
      </div>
    </motion.div>
  );

  const renderMyQR = () => (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-zinc-900 z-[100] flex flex-col p-8"
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

  const renderLoan = () => (
    <motion.div 
      initial={{ y: "100%" }} 
      animate={{ y: 0 }} 
      exit={{ y: "100%" }}
      className="fixed inset-0 bg-zinc-50 z-[100] overflow-y-auto"
    >
      <header className="px-6 pt-20 pb-6 flex items-center gap-6 bg-white border-b border-zinc-100 sticky top-0 z-20">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("main")} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
          <span className="material-symbols-rounded text-black font-black">arrow_back</span>
        </motion.button>
        <h2 className="text-xl font-black uppercase tracking-tighter">Izi Crédito</h2>
      </header>

      <div className="p-6 space-y-12 pt-8 pb-32">
        <div className="bg-zinc-900 text-white p-10 rounded-[60px] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 size-64 bg-blue-500/20 blur-[100px] rounded-full" />
          <div className="relative z-10">
            <p className="text-zinc-500 font-black text-[10px] uppercase tracking-[0.3em] mb-4">Crédito Pré-Aprovado</p>
            <h3 className="text-5xl font-black tracking-tighter mb-10">R$ 2.500,00</h3>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-3 rounded-2xl border border-white/10 w-fit">
               <span className="material-symbols-rounded text-yellow-400 text-xl fill-1">verified_user</span>
               <span className="text-[10px] font-black text-white uppercase tracking-widest">Aprovação 100% Digital</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <h4 className="text-xl font-black tracking-tight uppercase ml-2">Configurar Empréstimo</h4>
          <div className="space-y-4">
            <div className="p-8 bg-white rounded-[40px] shadow-xl border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4 ml-1">Valor do Empréstimo</p>
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-black text-zinc-300">R$</span>
                <input type="number" defaultValue="1000" className="w-full bg-transparent text-4xl font-black outline-none tracking-tighter text-zinc-900" />
              </div>
            </div>
            
            <div className="p-8 bg-white rounded-[40px] shadow-xl border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6 ml-1">Plano de Pagamento</p>
              <div className="grid grid-cols-4 gap-3">
                {['3x', '6x', '12x', '24x'].map(p => (
                  <button 
                    key={p} 
                    className={`h-16 rounded-[22px] font-black uppercase tracking-widest transition-all ${p === '6x' ? 'bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 scale-105' : 'bg-zinc-50 text-zinc-400 border border-zinc-100'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-emerald-50 p-8 rounded-[40px] border border-emerald-100 flex items-center justify-between">
           <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Mensalidade Estimada</p>
              <p className="text-3xl font-black text-zinc-900 tracking-tighter">6x R$ 184,80</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Custo Total</p>
              <p className="font-black text-zinc-900 tracking-tight">R$ 1.108,80</p>
           </div>
        </div>

        <div className="fixed bottom-0 inset-x-0 p-8 bg-white/80 backdrop-blur-xl border-t border-zinc-100 z-30">
           <motion.button 
             whileTap={{ scale: 0.98 }}
             className="w-full h-20 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-[32px] shadow-2xl shadow-emerald-200"
           >
             Contratar Agora
           </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const [recipientData, setRecipientData] = useState<{ id: string, name: string } | null>(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);

  const handleScanResult = useCallback(async (text: string) => {
    const cleanId = text
      .replace("izipay:", "")
      .replace("merchant:", "")
      .replace("user:", "")
      .trim();
      
    setIsSearchingRecipient(true);
    setShowScanModal(true);
    setRecipientData({ id: cleanId, name: "Buscando..." });

    try {
      const { data, error } = await supabase
        .from('users_delivery')
        .select('name, email')
        .eq('id', cleanId)
        .single();

      if (data) {
        setRecipientData({ id: cleanId, name: data.name || data.email || "Usuário Izi" });
      } else {
        setRecipientData({ id: cleanId, name: "Usuário Não Encontrado" });
      }
    } catch (err) {
      setRecipientData({ id: cleanId, name: "Erro ao buscar" });
    } finally {
      setIsSearchingRecipient(false);
    }
  }, []);

  const proceedToTransfer = () => {
    setShowScanModal(false);
    setSubView("send");
  };

  // Atualizando o renderSend para usar recipientData
  const [sendAmount, setSendAmount] = useState("");
  const [manualRecipient, setManualRecipient] = useState("");

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
        {subView === "deposit" && (
           <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} className="fixed inset-0 bg-white z-[120] flex flex-col">
              <header className="px-6 pt-20 pb-6 flex items-center gap-6 border-b border-zinc-100">
                 <button onClick={() => setSubView("main")} className="size-12 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-black font-black">
                    <span className="material-symbols-rounded">arrow_back</span>
                 </button>
                 <h2 className="text-xl font-black uppercase tracking-tighter">Recarregar Carteira</h2>
              </header>
              <div className="p-10 flex-1 flex flex-col items-center justify-center gap-10">
                 <div className="size-32 rounded-[48px] bg-zinc-900 flex items-center justify-center shadow-2xl">
                    <span className="material-symbols-rounded text-white text-5xl font-black">account_balance_wallet</span>
                 </div>
                 <div className="text-center">
                    <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">Escolha como recarregar</h3>
                    <p className="text-zinc-400 font-bold text-xs uppercase tracking-widest">O saldo cai instantaneamente na conta</p>
                 </div>
                 <div className="w-full grid grid-cols-1 gap-4">
                    <button className="h-20 bg-zinc-50 rounded-[28px] border border-zinc-100 flex items-center px-8 gap-6 active:scale-95 transition-all">
                       <div className="size-12 rounded-2xl bg-emerald-100 flex items-center justify-center shrink-0">
                          <span className="material-symbols-rounded text-emerald-600 font-black">pix</span>
                       </div>
                       <div className="text-left">
                          <p className="font-black text-base leading-none">PIX Copia e Cola</p>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1.5">Liberação Imediata</p>
                       </div>
                    </button>
                    <button className="h-20 bg-zinc-50 rounded-[28px] border border-zinc-100 flex items-center px-8 gap-6 active:scale-95 transition-all">
                       <div className="size-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="material-symbols-rounded text-blue-600 font-black">credit_card</span>
                       </div>
                       <div className="text-left">
                          <p className="font-black text-base leading-none">Cartão de Crédito</p>
                          <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1.5">Em até 12x</p>
                       </div>
                    </button>
                 </div>
              </div>
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 inset-x-0 bg-white rounded-t-[50px] z-[2101] p-8 pb-12 shadow-[0_-20px_40px_rgba(0,0,0,0.1)]"
            >
              <div className="w-12 h-1.5 bg-zinc-100 rounded-full mx-auto mb-10" />
              
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="size-24 rounded-[40px] bg-yellow-400 flex items-center justify-center shadow-2xl shadow-yellow-200">
                   <span className="material-symbols-rounded text-4xl text-black font-black">person_check</span>
                </div>
                
                <div className="space-y-2">
                   <h3 className="text-2xl font-black tracking-tighter uppercase">
                     {isSearchingRecipient ? "Buscando Perfil..." : "Destinatário Identificado"}
                   </h3>
                   <p className="text-zinc-500 text-sm font-medium px-4">
                     {isSearchingRecipient 
                       ? "Aguarde enquanto validamos as informações no servidor..." 
                       : `Você está prestes a enviar saldo para ${recipientData?.name}.`}
                   </p>
                </div>

                <div className="w-full bg-zinc-50 p-6 rounded-[32px] border border-zinc-100 flex items-center gap-4">
                   <div className="size-12 rounded-2xl bg-zinc-900 flex items-center justify-center">
                      <span className="material-symbols-rounded text-yellow-400">
                        {isSearchingRecipient ? "sync" : "verified"}
                      </span>
                   </div>
                   <div className="text-left">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                        {isSearchingRecipient ? "ID Detectado" : "Confirmar Destinatário"}
                      </p>
                      <p className="text-base font-black text-zinc-900 tracking-tight">
                        {recipientData?.name}
                      </p>
                   </div>
                </div>

                <div className="w-full grid grid-cols-1 gap-4 pt-4">
                  <motion.button 
                    whileTap={{ scale: 0.96 }}
                    disabled={isSearchingRecipient}
                    onClick={proceedToTransfer}
                    className={`w-full h-20 rounded-[32px] font-black uppercase tracking-widest shadow-2xl transition-all ${isSearchingRecipient ? 'bg-zinc-200 text-zinc-400 shadow-none' : 'bg-zinc-900 text-white shadow-zinc-900/20'}`}
                  >
                    {isSearchingRecipient ? "Aguarde..." : "Confirmar e Enviar"}
                  </motion.button>
                  <button 
                    onClick={() => setShowScanModal(false)}
                    className="text-zinc-400 font-black text-[10px] uppercase tracking-[0.2em] pt-2"
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
