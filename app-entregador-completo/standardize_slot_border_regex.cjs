const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-\[0\.98\] transition-all"/;
const replacement = 'className="w-full clay-card-dark p-6 flex items-center gap-6 text-left active:scale-[0.98] transition-all border-l-4 border-yellow-400"';

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('Dedicated slot card border standardized with regex.');
} else {
    console.log('Target not found with regex.');
}
