const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

c = c.replace(/{ id: 'active_mission', label: '.*?', icon: 'local_shipping' }/, "{ id: 'active_mission', label: 'Missão', icon: 'route' }");

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Active mission icon updated to route.');
