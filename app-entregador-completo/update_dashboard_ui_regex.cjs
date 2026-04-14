const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<p className="text-stone-800 text-\[9px\] font-bold uppercase tracking-\[0\.1em\] mb-1">Ganhos Hoje<\/p>\s*<p className="text-xl font-black text-stone-950 truncate italic">R\$ {stats\.today\.toFixed\(2\)\.replace\('\.', ','\)}<\/p>/;

const replacement = `<p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Ganhos Hoje</p>
                            <p className="text-xl font-black text-stone-950 truncate italic leading-none">R$ {stats.today.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-1 mt-1.5 opacity-60">
                                <span className="text-[7px] font-black uppercase text-stone-800 tracking-tighter">Na Semana:</span>
                                <span className="text-[10px] font-black text-stone-900">R$ {stats.weekly.toFixed(2).replace('.', ',')}</span>
                            </div>`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('UI updated successfully.');
} else {
    console.log('Target UI code block not found with regex.');
}
