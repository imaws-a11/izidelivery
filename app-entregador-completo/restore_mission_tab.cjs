const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

const target = `{ id: 'dashboard', label: 'Início', icon: 'grid_view' },`;
const replacement = `{ id: 'dashboard', label: 'Início', icon: 'grid_view' },
                    { id: 'active_mission', label: 'Missão', icon: 'local_shipping' },`;

if (c.includes(target)) {
    c = c.replace(target, replacement);
    fs.writeFileSync('src/App.tsx', c, 'utf8');
    console.log('Missão tab added back to navigation.');
} else {
    // Try with different spelling if encoding is weird
    const target2 = `{ id: 'dashboard', label: 'Início', icon: 'grid_view' },`;
    if (c.includes(target2)) {
         c = c.replace(target2, replacement);
         fs.writeFileSync('src/App.tsx', c, 'utf8');
         console.log('Missão tab added back to navigation (alternative match).');
    } else {
         console.log('Navigation target not found.');
    }
}
