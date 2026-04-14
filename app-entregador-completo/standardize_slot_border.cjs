const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const target = `onClick={() => { setSelectedSlot(slot); setActiveTab('dedicated'); }}\n                                className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-[0.98] transition-all"`;

const replacement = `onClick={() => { setSelectedSlot(slot); setActiveTab('dedicated'); }}\n                                className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-[0.98] transition-all border-l-4 border-yellow-400"`;

if (c.includes(target)) {
    c = c.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('Dedicated slot card border standardized.');
} else {
    // Try without the space after button
    const target2 = `onClick={() => { setSelectedSlot(slot); setActiveTab('dedicated'); }}\n                                className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-[0.98] transition-all"`;
    if (c.includes(target2)) {
         c = c.replace(target2, replacement);
         fs.writeFileSync('src/App.tsx', c, 'utf8');
         console.log('Dedicated slot card border standardized (alt).');
    } else {
         console.log('Target not found.');
    }
}
