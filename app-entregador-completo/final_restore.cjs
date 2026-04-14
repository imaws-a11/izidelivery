const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const search = 'dedicatedSlots.slice(0, 2).map((slot: any) => (';
const startIdx = c.indexOf(search);

if (startIdx !== -1) {
    const endIdx = c.indexOf('</motion.button>', startIdx) + 16;
    let block = c.substring(startIdx, endIdx);

    // Replace Icon
    block = block.replace(/<div className="size-16 rounded-2xl bg-yellow-400\/10 flex items-center justify-center shrink-0">\s*<Icon name="stars" className="text-yellow-400" size={32} \/>\s*<\/div>/, 
        `<div className="size-16 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                    {slot.admin_users?.store_logo ? (
                                        <img src={slot.admin_users.store_logo} alt="" className="size-full object-cover" />
                                    ) : (
                                        <Icon name="stars" className="text-yellow-400" size={32} />
                                    )}
                                </div>`);

    // Replace Name/Title
    block = block.replace(/<div className="flex-1 min-w-0">\s*<p className="text-\[9px\] font-black text-yellow-400 uppercase tracking-widest">{slot\.admin_users\?\.store_name || 'Parceiro Izi'}<\/p>\s*<h4 className="text-white font-black text-lg truncate italic leading-tight">{slot\.title}<\/h4>\s*<p className="text-\[10px\] text-white\/30 font-bold italic">{slot\.working_hours}<\/p>\s*<\/div>/,
        `<div className="flex-1 min-w-0">
                                    <h4 className="text-white font-black text-lg truncate italic leading-tight capitalize">{slot.admin_users?.store_name || 'Parceiro Izi'}</h4>
                                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">{slot.title}</p>
                                    <p className="text-[10px] text-white/30 font-bold italic mt-0.5">{slot.working_hours}</p>
                                </div>`);

    c = c.substring(0, startIdx) + block + c.substring(endIdx);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('Final replacement applied successfully.');
}
