const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

// The Area Chart SVG line
// `<path d={linePath} fill="none" stroke="#10b981" strokeWidth="2.5"`
code = code.replace(/strokeWidth="2\.5"/g, 'strokeWidth="1.5"');

// And the points
// `<circle cx={x} cy={y} r="4" fill="#fff" stroke="#10b981" strokeWidth="2" className="animate-pulse shadow-xl" />`
code = code.replace(/r="4" fill="#fff" stroke="#10b981" strokeWidth="2"/g, 'r="3" fill="#fff" stroke="#10b981" strokeWidth="1"');
code = code.replace(/r="2\.5" fill="#fff" stroke="#10b981" strokeWidth="1\.5"/g, 'r="2" fill="#fff" stroke="#10b981" strokeWidth="1"');

// The ping effect for today
// `<circle cx={x} cy={y} r="8" fill="#10b981" opacity="0.2" className="animate-ping" />`
code = code.replace(/r="8" fill="#10b981" opacity="0\.2"/g, 'r="6" fill="#10b981" opacity="0.3"');

fs.writeFileSync(file, code);
console.log('Thinned lines and points');
