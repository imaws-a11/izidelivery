import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useWallet } from "../../../hooks/useWallet";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const WalletView = () => {
  const { 
    walletBalance, 
    walletTransactions, 
    isWalletLoading, 
    requestWithdrawal, 
    handlePixDeposit 
  } = useWallet();

  const { setSubView, showToast } = useApp();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");

  const handleDepositSubmit = async () => {
    const val = parseFloat(depositAmount.replace(",", "."));
    if (isNaN(val) || val <= 0) {
      showToast("Valor inválido", "error");
      return;
    }
    const success = await handlePixDeposit(val);
    if (success) setShowDepositModal(false);
  };

  return (
    <div className="absolute inset-0 z-40 bg-[#050505] text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-8 border-b border-white/5">
        <div className="flex items-center gap-5">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            onClick={() => setSubView("none")} 
            className="size-12 rounded-[22px] bg-zinc-900 border border-white/5 flex items-center justify-center shadow-xl"
          >
            <span className="material-symbols-outlined text-white text-2xl">arrow_back</span>
          </motion.button>
          <div>
            <h1 className="font-black text-2xl text-white tracking-tighter uppercase leading-none">Minha Carteira</h1>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Izi Pay • Saldo Seguro</p>
          </div>
        </div>
      </header>

      <main className="px-6 py-10 space-y-12">
        {/* Balance Card */}
        <section className="bg-zinc-900 rounded-[45px] p-10 relative overflow-hidden shadow-[25px_25px_50px_rgba(0,0,0,0.7),-5px_-5px_15px_rgba(255,255,255,0.01),inset_4px_4px_8px_rgba(255,255,255,0.02),inset_-4px_-4px_8px_rgba(0,0,0,0.4)]">
           <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/5 blur-[60px] rounded-full" />
           <div className="space-y-2 relative z-10">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Saldo Disponível</p>
              <h2 className="text-6xl font-black text-white tracking-tighter leading-none py-2">
                R$ {walletBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
           </div>
           
           <div className="flex gap-4 mt-10 relative z-10">
              <button 
                onClick={() => setShowDepositModal(true)}
                className="flex-1 bg-yellow-400 text-black py-4 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-yellow-400/10 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">add_circle</span> Depósito
              </button>
              <button 
                onClick={() => requestWithdrawal(walletBalance)}
                className="flex-1 bg-zinc-800 text-white py-4 rounded-3xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all border border-white/5 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">payments</span> Sacar
              </button>
           </div>
        </section>

        {/* Transactions */}
        <section className="space-y-8">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black text-white tracking-tighter uppercase">Histórico</h3>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Últimos 30 dias</span>
           </div>

           <div className="space-y-4">
              {isWalletLoading ? (
                <div className="flex flex-col items-center py-12 gap-3">
                   <div className="size-8 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                   <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sincronizando transações...</p>
                </div>
              ) : walletTransactions.length === 0 ? (
                <div className="text-center py-12">
                   <p className="text-zinc-600 text-xs font-black uppercase tracking-widest">Nenhuma movimentação</p>
                </div>
              ) : walletTransactions.map((tx: any, i: number) => (
                <motion.div 
                  key={tx.id || i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-zinc-900/40 p-5 rounded-[32px] border border-white/5 flex items-center justify-between group active:scale-[0.98] transition-all"
                >
                   <div className="flex items-center gap-4">
                      <div className={`size-12 rounded-2xl flex items-center justify-center ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'} border border-white/5 shadow-inner`}>
                         <span className="material-symbols-outlined text-xl">{tx.type === 'credit' ? 'south_west' : 'north_east'}</span>
                      </div>
                      <div>
                         <p className="font-black text-sm text-white tracking-tight">{tx.description || (tx.type === 'credit' ? 'Depósito Pix' : 'Pagamento Pedido')}</p>
                         <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">{new Date(tx.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className={`font-black text-base tracking-tighter ${tx.type === 'credit' ? 'text-emerald-400' : 'text-zinc-100'}`}>
                        {tx.type === 'credit' ? '+' : '-'} R$ {tx.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mt-0.5">{tx.status || 'Concluído'}</p>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>
      </main>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
               className="w-full max-w-[400px] bg-zinc-900 rounded-[50px] p-10 border border-white/10 shadow-3xl text-center space-y-8"
             >
                <div className="size-20 bg-yellow-400/10 rounded-[30px] flex items-center justify-center text-yellow-400 mx-auto border border-yellow-400/20 shadow-inner">
                   <span className="material-symbols-outlined text-4xl">payments</span>
                </div>
                
                <div className="space-y-2">
                   <h3 className="text-2xl font-black text-white tracking-tighter uppercase">Depósito Pix</h3>
                   <p className="text-xs text-zinc-500 font-bold">O saldo cai na hora na sua carteira Izi.</p>
                </div>

                <div className="bg-black/40 rounded-[35px] p-8 border border-white/5 shadow-inner">
                   <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-4">Valor para Recarga</p>
                   <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-black text-zinc-700">R$</span>
                      <input 
                        type="text" 
                        value={depositAmount} 
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0,00"
                        className="bg-transparent border-none outline-none text-5xl font-black text-white w-full max-w-[180px] text-center placeholder:text-zinc-800 tabular-nums"
                      />
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   {['20', '50', '100'].map(val => (
                     <button 
                        key={val}
                        onClick={() => setDepositAmount(val)}
                        className="py-3 rounded-2xl bg-zinc-800 border border-white/5 text-[11px] font-black text-zinc-400 active:scale-95 transition-all hover:border-yellow-400/30"
                     >
                        + R$ {val}
                     </button>
                   ))}
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={() => setShowDepositModal(false)}
                    className="flex-1 py-5 rounded-[28px] bg-zinc-800 text-zinc-500 font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                   >
                     Cancelar
                   </button>
                   <button 
                    onClick={handleDepositSubmit}
                    className="flex-1 py-5 rounded-[28px] bg-yellow-400 text-black font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-yellow-400/10"
                   >
                     Continuar
                   </button>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
