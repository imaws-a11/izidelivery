const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const startStr = '{/* Performance Chart - AREA CHART (Glassmorphism) */}';
const endStr = '{/* Info Message Claymorphic - PAGAMENTO SEGURO */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newChart = `{/* Performance Chart - SIMPLE BAR CHART */}
                <div className="rounded-[40px] p-8 space-y-8 bg-zinc-50/80 backdrop-blur-md border border-zinc-100">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-zinc-900 font-black text-[10px] uppercase tracking-[0.3em]">Performance Alpha</h3>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Ganhos da Semana</p>
                        </div>
                        <div className="size-10 rounded-[14px] bg-white flex items-center justify-center border border-zinc-100">
                            <Icon name="bar_chart" size={18} className="text-zinc-900" />
                        </div>
                    </div>
                    
                    <div className="h-44 flex items-end justify-between gap-3 px-2 pt-6 relative">
                        {/* Fundo de Grade sutil */}
                        <div className="absolute inset-x-0 top-6 bottom-6 flex flex-col justify-between pointer-events-none opacity-[0.05]">
                            <div className="h-px bg-zinc-400 w-full" />
                            <div className="h-px bg-zinc-400 w-full" />
                            <div className="h-px bg-zinc-400 w-full" />
                            <div className="h-px bg-zinc-400 w-full" />
                        </div>

                        {(() => {
                            const rawStats = stats.performance && stats.performance.length === 7 ? stats.performance : [0,0,0,0,0,0,0];
                            const maxVal = Math.max(...rawStats, 10);
                            
                            return rawStats.map((val, i) => {
                                const heightPercent = Math.max((val / maxVal) * 100, 4); // minimum 4% height
                                const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                                const isToday = i === currentDayIndex;
                                const barColor = isToday ? 'bg-zinc-900' : 'bg-zinc-300';
                                
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-4 relative h-full justify-end z-10 group">
                                        <div className="w-full flex flex-col items-center relative h-full justify-end pb-1">
                                            {/* Barra Fina e Simples */}
                                            <motion.div 
                                                initial={{ height: 0 }}
                                                animate={{ height: \`\${heightPercent}%\` }}
                                                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: i * 0.08 }}
                                                className={\`w-[6px] rounded-full \${barColor} transition-colors duration-300\`}
                                            />
                                        </div>
                                        {/* Label */}
                                        <span className={\`text-[8px] font-black uppercase tracking-widest transition-colors \${isToday ? 'text-zinc-900' : 'text-zinc-400 group-hover:text-zinc-600'}\`}>
                                            {['S','T','Q','Q','S','S','D'][i]}
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>

                `;
    
    code = code.substring(0, startIndex) + newChart + code.substring(endIndex);
    fs.writeFileSync(file, code);
    console.log('Replaced with simple bar chart');
} else {
    console.error('Could not find boundaries');
}
