const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Ganhos Hoje</p>
                            <p className="text-xl font-black text-stone-950 truncate italic">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                        </div>`;

const replacement = `<div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Ganhos Hoje</p>
                            <p className="text-xl font-black text-stone-950 truncate italic leading-none">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-1 mt-1.5 opacity-60">
                                <span className="text-[7px] font-black uppercase text-stone-800 tracking-tighter">Na Semana:</span>
                                <span className="text-[9px] font-black text-stone-900">R$ {stats.weekly.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>`;

if (c.includes(target)) {
    c = c.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('UI updated successfully.');
} else {
    console.log('Target UI code block not found.');
}
