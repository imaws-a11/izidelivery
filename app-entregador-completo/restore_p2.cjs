const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Global Naming
c = c.replace(/>Sua Agenda</g, ">Agendamentos<");
c = c.replace(/Agenda Semanal/g, "Agendamentos Disponíveis");
c = c.replace(/Izi pilot/g, "IZI Entregador");
c = c.replace(/IZI Pilot/g, "IZI Entregador");
c = c.replace(/label: 'Agenda'/g, "label: 'Agendamentos'");

// 2. Dashboards UI - Header Cards
// Find by index to be extremely safe
const dailyIdx = c.indexOf('Ganhos Hoje');
if (dailyIdx !== -1) {
    const start = c.lastIndexOf('<div', dailyIdx);
    const end = c.indexOf('</div>', dailyIdx) + 6;
    const block = c.substring(start, end);
    if (block.includes('stats.today')) {
        const replacement = `<div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Ganhos Hoje</p>
                            <p className="text-xl font-black text-stone-950 truncate italic leading-none">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-1 mt-1.5 opacity-60">
                                <span className="text-[7px] font-black uppercase text-stone-800 tracking-tighter">Na Semana:</span>
                                <span className="text-[9px] font-black text-stone-900">R$ {stats.weekly.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>`;
        c = c.substring(0, start) + replacement + c.substring(end);
    }
}

const statusIdx = c.indexOf('Status');
if (statusIdx !== -1 && statusIdx > dailyIdx) { // Ensure it's the right one
    const start = c.lastIndexOf('<div', statusIdx);
    const end = c.indexOf('</div>', statusIdx) + 6;
    const block = c.substring(start, end);
    if (block.includes('isOnline')) {
        const replacement = `<div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Saldo Izi</p>
                            <p className="text-xl font-black text-stone-950 truncate italic leading-none">R$ {stats.balance.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-1 mt-1.5 opacity-60">
                                <span className="text-[7px] font-black uppercase text-stone-800 tracking-tighter">Missões:</span>
                                <span className="text-[9px] font-black text-stone-900">{stats.count} Total</span>
                            </div>
                        </div>`;
        c = c.substring(0, start) + replacement + c.substring(end);
    }
}

// 3. Slot Card Border
c = c.replace(/className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-\[0\.98\] transition-all"/g, 
    'className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-[0.98] transition-all border-l-4 border-yellow-400"');

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Step 2 applied.');
