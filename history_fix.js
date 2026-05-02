const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const startHistory = code.indexOf('const renderWithdrawHistoryView = () => (');
const endHistoryStr = 'const renderWithdrawDetailView = () => {';
const endHistory = code.indexOf(endHistoryStr);

if (startHistory !== -1 && endHistory !== -1) {
  const newHistoryBlock = `const renderWithdrawHistoryView = () => (
        <motion.div 
            key="withdraw-history-modal"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="fixed inset-0 z-[100] bg-zinc-50/90 backdrop-blur-xl no-scrollbar overflow-y-auto"
        >
            <div className="min-h-screen px-5 pt-8 pb-32 space-y-8">
                <header className="flex items-center justify-between px-2">
                    <div className="flex flex-col gap-1">
                        <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.5em] opacity-70">Saques</p>
                        <h2 className="text-4xl font-black text-zinc-900 tracking-tighter drop-shadow-sm uppercase text-center">Histórico</h2>
                    </div>
                    <motion.button 
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setShowWithdrawHistory(false)}
                        className="size-12 rounded-2xl bg-white flex items-center justify-center border border-zinc-200 shadow-sm"
                    >
                        <Icon name="close" className="text-zinc-900" size={24} />
                    </motion.button>
                </header>

                <div className="space-y-4 pb-20">
                    {withdrawHistory.length === 0 ? (
                        <div className="bg-white/80 backdrop-blur-md rounded-[40px] p-12 flex flex-col items-center justify-center text-center gap-6 border border-zinc-100 mt-10 shadow-xl">
                            <div className="size-20 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100">
                                <Icon name="history_edu" size={40} className="text-zinc-200" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-zinc-900 font-black uppercase text-[10px] tracking-widest">Nada por aqui</p>
                                <p className="text-zinc-500 text-[9px] font-bold">Você ainda não realizou nenhum saque.</p>
                            </div>
                        </div>
                    ) : (
                        withdrawHistory.map((tx, i) => (
                            <motion.div 
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => { setSelectedWithdraw(tx); setShowWithdrawDetail(true); }}
                                className="bg-white/80 backdrop-blur-md rounded-[30px] p-6 border border-white flex items-center gap-5 relative overflow-hidden transition-all active:scale-95 cursor-pointer hover:border-yellow-400/30 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_10px_40px_rgba(234,179,8,0.1)]"
                            >
                                <div className={\`size-14 rounded-2xl flex items-center justify-center border shadow-sm \${
                                    tx.status === 'concluido' ? 'bg-emerald-50/50 border-emerald-100' : 
                                    tx.status === 'recusado' ? 'bg-rose-50/50 border-rose-100' :
                                    'bg-yellow-50/50 border-yellow-100'
                                }\`}>
                                    <Icon 
                                        name={tx.status === 'concluido' ? 'verified' : tx.status === 'recusado' ? 'close' : 'sync'} 
                                        size={24} 
                                        className={tx.status === 'concluido' ? 'text-emerald-500' : tx.status === 'recusado' ? 'text-rose-500' : 'text-yellow-600'} 
                                    />
                                </div>

                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-zinc-900 font-black text-xl tracking-tighter">R$ {Number(tx.amount).toFixed(2).replace('.', ',')}</p>
                                        <div className="flex items-center gap-2">
                                            {tx.receipt_url && (
                                                <div className="bg-emerald-50 text-emerald-600 text-[7px] font-black uppercase px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-100">
                                                    <Icon name="image" size={10} />
                                                    RECIBO
                                                </div>
                                            )}
                                            <span className={\`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border \${
                                                tx.status === 'concluido' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                tx.status === 'recusado' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                                            }\`}>
                                                {tx.status || 'Pendente'}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase truncate max-w-[150px]">
                                        {new Date(tx.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-[8px] text-zinc-400 font-medium line-clamp-1">{tx.description}</p>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>

                {/* Receipt Viewer Modal */}
                <AnimatePresence>
                    {showReceipt && (
                        <motion.div 
                            key="receipt-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-xl flex flex-col p-6 items-center justify-center gap-8"
                        >
                            <div className="w-full flex justify-between items-center px-2">
                                <div className="flex flex-col gap-1">
                                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.5em] opacity-70">Transação</p>
                                    <h2 className="text-2xl font-black text-zinc-900 tracking-tighter uppercase">Comprovante</h2>
                                </div>
                                <button 
                                    onClick={() => setShowReceipt(false)}
                                    className="size-12 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center shadow-sm active:scale-90 transition-all"
                                >
                                    <Icon name="close" className="text-zinc-900" size={24} />
                                </button>
                            </div>
                            <div className="flex-1 w-full relative flex items-center justify-center bg-zinc-50/50 rounded-[40px] border border-zinc-100 overflow-hidden shadow-inner p-2">
                                <img src={selectedWithdraw?.receipt_url} alt="Comprovante" className="max-w-full max-h-full object-contain rounded-[32px] shadow-lg" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );

    `;
  
  code = code.substring(0, startHistory) + newHistoryBlock + code.substring(endHistory);
}

code = code.replace(/ID Transaǜo/g, 'ID Transação');
code = code.replace(/Transaǜo/g, 'Transação');
code = code.replace(/Histrico/g, 'Histórico');
code = code.replace(/Saques \?T/g, 'Saques');
code = code.replace(/VocǦ ainda nǜo realizou nenhum saque/g, 'Você ainda não realizou nenhum saque');

fs.writeFileSync(file, code);
console.log('Fixed withdraw history rendering and encodings');
