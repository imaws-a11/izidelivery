const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const target = `<div className="size-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0">
                                    <Icon name="stars" className="text-yellow-400" size={32} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>
                                    <h4 className="text-white font-black text-lg truncate italic leading-tight">{slot.title}</h4>
                                    <p className="text-[10px] text-white/30 font-bold italic">{slot.working_hours}</p>
                                </div>`;

// The script in P2 added the border to the PARENT button, not this inner div.
// So why didn't it match?
// Maybe because of the newline or indentation.

// I'll use a more surgical replace.
const iconSearch = '<div className="size-16 rounded-2xl bg-yellow-400/10 flex items-center justify-center shrink-0">\n                                    <Icon name="stars" className="text-yellow-400" size={32} />\n                                </div>';
const iconReplace = `<div className="size-16 rounded-2xl bg-white/5 overflow-hidden flex items-center justify-center shrink-0 border border-white/10">
                                    {slot.admin_users?.store_logo ? (
                                        <img src={slot.admin_users.store_logo} alt="" className="size-full object-cover" />
                                    ) : (
                                        <Icon name="stars" className="text-yellow-400" size={32} />
                                    )}
                                </div>`;

const textSearch = `<p className="text-[9px] font-black text-yellow-400 uppercase tracking-widest">{slot.admin_users?.store_name || 'Parceiro Izi'}</p>\n                                    <h4 className="text-white font-black text-lg truncate italic leading-tight">{slot.title}</h4>\n                                    <p className="text-[10px] text-white/30 font-bold italic">{slot.working_hours}</p>`;
const textReplace = `<h4 className="text-white font-black text-lg truncate italic leading-tight capitalize">{slot.admin_users?.store_name || 'Parceiro Izi'}</h4>
                                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">{slot.title}</p>
                                    <p className="text-[10px] text-white/30 font-bold italic mt-0.5">{slot.working_hours}</p>`;

if (c.includes(iconSearch)) {
    c = c.replace(iconSearch, iconReplace);
    console.log('Icon replaced.');
}
if (c.includes(textSearch)) {
    c = c.replace(textSearch, textReplace);
    console.log('Text blocks replaced.');
}

fs.writeFileSync('src/App.tsx', c, 'utf8');
