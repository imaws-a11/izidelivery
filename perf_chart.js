const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const startStr = '{/* Performance Chart - CANDLESTICKS */}';
const endStr = '{/* Info Message Claymorphic - PAGAMENTO SEGURO */}';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    const newPerformanceBlock = `{/* Performance Chart - AREA CHART (Glassmorphism) */}
                <div className="rounded-[40px] p-8 space-y-6 border border-white/50 relative overflow-hidden bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/10 blur-[40px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-yellow-400/10 blur-[40px] rounded-full pointer-events-none" />

                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex flex-col gap-1">
                            <h3 className="text-zinc-900 font-black text-[10px] uppercase tracking-[0.3em]">Performance Alpha</h3>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Ganhos da Semana</p>
                        </div>
                        <div className="size-11 rounded-[16px] bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                            <Icon name="monitoring" size={20} className="text-emerald-500" />
                        </div>
                    </div>
                    
                    <div className="h-40 relative w-full mt-4 z-10">
                        {/* Fundo de Grade */}
                        <div className="absolute inset-x-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-[0.05]">
                            <div className="h-px bg-zinc-400 w-full" />
                            <div className="h-px bg-zinc-400 w-full" />
                            <div className="h-px bg-zinc-400 w-full" />
                            <div className="h-px bg-zinc-400 w-full" />
                        </div>

                        {/* Area Chart SVG */}
                        <div className="absolute inset-x-0 top-0 bottom-6">
                            <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                                    </linearGradient>
                                </defs>
                                {(() => {
                                    // Use raw numbers for visualization
                                    const rawStats = stats.performance && stats.performance.length === 7 ? stats.performance : [0,0,0,0,0,0,0];
                                    const maxVal = Math.max(...rawStats, 10);
                                    
                                    // Smooth bezier path approximation or straight lines. We'll use straight lines for a sharp "tech" feel.
                                    const points = rawStats.map((val, i) => {
                                        const x = (i / 6) * 100;
                                        // Adding a small padding so it doesn't hit the absolute top
                                        const y = 100 - ((val / maxVal) * 90); 
                                        return \`\${x},\${y}\`;
                                    });
                                    
                                    const linePath = \`M \${points.join(' L ')}\`;
                                    const areaPath = \`\${linePath} L 100,100 L 0,100 Z\`;

                                    return (
                                        <>
                                            <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-1000 ease-out" />
                                            <path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-all duration-1000 ease-out drop-shadow-md" />
                                            
                                            {/* Data Points */}
                                            {rawStats.map((val, i) => {
                                                const x = (i / 6) * 100;
                                                const y = 100 - ((val / maxVal) * 90);
                                                const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
                                                const isToday = i === currentDayIndex;
                                                
                                                return isToday ? (
                                                    <g key={i} className="transition-all duration-500">
                                                        <circle cx={x} cy={y} r="4" fill="#fff" stroke="#10b981" strokeWidth="2" className="animate-pulse shadow-xl" />
                                                        <circle cx={x} cy={y} r="8" fill="#10b981" opacity="0.2" className="animate-ping" />
                                                    </g>
                                                ) : (
                                                    <circle key={i} cx={x} cy={y} r="2.5" fill="#fff" stroke="#10b981" strokeWidth="1.5" />
                                                );
                                            })}
                                        </>
                                    );
                                })()}
                            </svg>
                        </div>

                        {/* Rótulos dos Dias da Semana */}
                        <div className="absolute inset-x-0 bottom-0 flex justify-between px-1">
                            {['S','T','Q','Q','S','S','D'].map((day, i) => {
                                const isToday = i === (new Date().getDay() === 0 ? 6 : new Date().getDay() - 1);
                                return (
                                    <div key={i} className="flex flex-col items-center">
                                        <span className={\`text-[9px] font-black uppercase tracking-widest \${isToday ? 'text-emerald-600 drop-shadow-sm' : 'text-zinc-400'}\`}>
                                            {day}
                                        </span>
                                        {isToday && <div className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                `;
    code = code.substring(0, startIndex) + newPerformanceBlock + code.substring(endIndex);
    fs.writeFileSync(file, code);
    console.log('Replaced Performance chart with SVG Area Chart');
} else {
    console.error('Could not find boundaries');
}
