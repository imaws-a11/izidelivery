const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(`                            </div>
                        </div>
                        </div>
                        <div className="clay-profile-inner rounded-3xl p-4 border border-white/20">`,
`                            </div>
                        </div>
                        <div className="clay-profile-inner rounded-3xl p-4 border border-white/20">`);

c = c.replace(`                    <div className="grid gap-4">
                        {<div className="flex-1 min-w-0">
                                    <h4 className="text-white font-black text-lg truncate italic leading-tight capitalize">{slot.admin_users?.store_name || 'Parceiro Izi'}</h4>
                                    <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mt-0.5">{slot.title}</p>
                                    <p className="text-[10px] text-white/30 font-bold italic mt-0.5">{slot.working_hours}</p>
                                </div>dedicatedSlots.slice(0, 2).map((slot: any) => (`,
`                    <div className="grid gap-4">
                        {dedicatedSlots.slice(0, 2).map((slot: any) => (`);

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log("Syntax manually fixed in two spots.");
