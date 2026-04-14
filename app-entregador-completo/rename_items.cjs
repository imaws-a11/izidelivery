const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Bottom Nav Rename
c = c.replace(/label: 'Agenda'/, "label: 'Agendamentos'");

// 2. Screen Title Rename (Agenda Semanal -> Agendamentos Disponíveis)
c = c.replace(/Agenda Semanal/g, "Agendamentos Disponíveis");

// 3. App Title Rename (Izi pilot -> IZI Entregador)
c = c.replace(/Izi pilot/g, "IZI Entregador");
c = c.replace(/IZI Pilot/g, "IZI Entregador"); // check case variations

fs.writeFileSync('src/App.tsx', c, 'utf8');
console.log('Renaming completed successfully.');
