const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Weekly Stats State
c = c.replace(/const \[stats, setStats\] = useState\({\s*balance: 0, today: 0, totalEarnings: 0/, 
    "const [stats, setStats] = useState({ balance: 0, today: 0, weekly: 0, totalEarnings: 0");

// 2. RefreshFinanceData Logic
c = c.replace(/let todaySum = 0; let totalGanhos = 0; let missionCount = 0;/, 
    "let todaySum = 0; let weeklySum = 0; let totalGanhos = 0; let missionCount = 0;");

c = c.replace(/const startOfDay = new Date\(\); startOfDay\.setHours\(0,0,0,0\);/, 
    "const startOfDay = new Date(); startOfDay.setHours(0,0,0,0);\n                const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - (startOfWeek.getDay() || 7) + 1); startOfWeek.setHours(0,0,0,0);");

c = c.replace(/if \(new Date\(o\.created_at\) >= startOfDay\) todaySum \+= fee;/, 
    "if (new Date(o.created_at) >= startOfDay) todaySum += fee;\n                    if (new Date(o.created_at) >= startOfWeek) weeklySum += fee;");

c = c.replace(/setStats\(prev => \({\s*\.\.\.prev, balance, today: todaySum, totalEarnings: totalGanhos/, 
    "setStats(prev => ({ ...prev, balance, today: todaySum, weekly: weeklySum, totalEarnings: totalGanhos");

// 3. Navigation
c = c.replace(/{ id: 'dashboard', label: 'Início', icon: 'grid_view' },/, 
    "{ id: 'dashboard', label: 'Início', icon: 'grid_view' },\n                    { id: 'active_mission', label: 'Missão', icon: 'route' },");

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Step 1 applied.');
