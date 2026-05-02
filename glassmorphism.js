const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Rebuild the Top Earnings Card to use Glassmorphism
const startEarnings = code.indexOf('{/* Claymorphic Balance Card Premium */}');
const endEarnings = code.indexOf('{/* Premium Stats Grid */}');

if (startEarnings !== -1 && endEarnings !== -1) {
    const newEarningsCard = `{/* Glassmorphic Balance Card Premium */}
                <div 
                    onClick={handleWithdrawRequest}
                    className="rounded-[40px] p-7 relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all duration-500 shadow-[0_20px_40px_rgba(234,179,8,0.3)] border border-white/50"
                    style={{
                        background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.85) 0%, rgba(234, 179, 8, 0.95) 100%)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)'
                    }}
                >
                    {/* Reflexos e luzes do vidro */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-white/10 opacity-70 pointer-events-none" />
                    
                    <div className="absolute -right-20 -top-20 size-60 bg-white/40 rounded-full blur-[40px] pointer-events-none" />
                    <div className="absolute -left-20 -bottom-20 size-60 bg-yellow-600/30 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div className="absolute -right-4 top-2 opacity-20 rotate-12 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 pointer-events-none z-0">
                        <Icon name="account_balance_wallet" size={160} className="text-yellow-900 drop-shadow-2xl" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-1">
                                <p className="text-yellow-950/80 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-1.5 drop-shadow-sm">
                                    <Icon name="account_balance" size={14} className="opacity-80" />
                                    Saldo Disponível
                                </p>
                                <div className="flex items-baseline gap-1.5 mt-1">
                                    <span className="text-xl font-bold text-yellow-900/70 drop-shadow-sm">R$</span>
                                    <span className="text-[3.5rem] font-black text-yellow-950 tracking-tighter leading-none drop-shadow-md">
                                        {stats.balance.toFixed(2).replace('.', ',')}
                                    </span>
                                </div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); setShowWithdrawHistory(true); }}
                                    className="size-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm hover:bg-white/30 transition-all hover:shadow-md"
                                >
                                    <Icon name="history" className="text-yellow-950" size={20} />
                                </motion.button>
                                <motion.button 
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => { e.stopPropagation(); setShowBankDetails(true); }}
                                    className="size-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40 shadow-sm hover:bg-white/30 transition-all hover:shadow-md"
                                >
                                    <Icon name="settings" className="text-yellow-950" size={20} />
                                </motion.button>
                            </div>
                        </div>

                        <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); setShowWithdrawModal(true); }}
                            className="w-full h-16 bg-white/25 backdrop-blur-xl border border-white/50 text-yellow-950 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] shadow-lg hover:shadow-xl hover:bg-white/40 active:scale-95 transition-all flex items-center justify-center gap-3 group overflow-hidden relative"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                            <div className="size-8 rounded-[10px] bg-yellow-950/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Icon name="payments" size={18} className="text-yellow-950 drop-shadow-sm" />
                            </div>
                            Sacar Ganhos
                        </motion.button>
                    </div>
                </div>

                `;
    code = code.substring(0, startEarnings) + newEarningsCard + code.substring(endEarnings);
}

// 2. Bottom Navigation Glassmorphism
// Find: <nav className="fixed bottom-0 inset-x-0 z-50 px-4 pb-6 pt-4 bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent pointer-events-none">
// Replace the inner menu wrapper
const navStart = code.indexOf('<nav className="fixed bottom-0 inset-x-0 z-50');
if (navStart !== -1) {
    const glassNav = `className="mx-auto max-w-md bg-white/70 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.08)] rounded-3xl p-2 flex justify-between items-center relative pointer-events-auto overflow-hidden"`;
    // We search for `className="mx-auto max-w-md bg-white rounded-3xl p-2`
    code = code.replace(/className="mx-auto max-w-md bg-white border border-zinc-100 rounded-3xl p-2 flex justify-between items-center relative pointer-events-auto shadow-2xl"/, glassNav);
    code = code.replace(/className="mx-auto max-w-md bg-white rounded-3xl p-2 flex justify-between items-center relative pointer-events-auto shadow-2xl"/, glassNav);
    
    // Also change the nav gradient background
    code = code.replace(/bg-gradient-to-t from-zinc-50 via-zinc-50 to-transparent/, 'bg-gradient-to-t from-white/80 via-white/40 to-transparent backdrop-blur-[2px]');
}

// 3. Improve some modal backgrounds to be Glassmorphic
code = code.replace(/bg-black\/40 backdrop-blur-sm/g, 'bg-zinc-900/40 backdrop-blur-md');
code = code.replace(/bg-black\/60 backdrop-blur-sm/g, 'bg-zinc-900/50 backdrop-blur-lg');

// Fix text color in the Sacar button from previous replacement issue (if any)
code = code.replace(/bg-zinc-900 text-zinc-900/g, 'bg-zinc-900 text-white');

fs.writeFileSync(file, code);
console.log('Glassmorphism applied!');
