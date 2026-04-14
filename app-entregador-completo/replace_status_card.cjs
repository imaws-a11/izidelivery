const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="clay-profile-inner rounded-3xl p-4 border border-white\/20">\s*<p className="text-stone-800 text-\[9px\] font-bold uppercase tracking-\[0\.1em\] mb-1">Status<\/p>\s*<p className="text-xl font-black text-stone-950 truncate italic">\s*{isOnline \? 'On-line' : 'Off-line'}\s*<\/p>\s*<\/div>/;

const replacement = `<div className="clay-profile-inner rounded-3xl p-4 border border-white/20">
                            <p className="text-stone-800 text-[9px] font-bold uppercase tracking-[0.1em] mb-1">Saldo Izi</p>
                            <p className="text-xl font-black text-stone-950 truncate italic leading-none">R$ {stats.balance.toFixed(2).replace('.', ',')}</p>
                            <div className="flex items-center gap-1 mt-1.5 opacity-60">
                                <span className="text-[7px] font-black uppercase text-stone-800 tracking-tighter">Missões:</span>
                                <span className="text-[9px] font-black text-stone-900">{stats.count} Total</span>
                            </div>
                        </div>`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('Online status card replaced with Saldo Izi.');
} else {
    console.log('Online status card block not found with regex.');
}
