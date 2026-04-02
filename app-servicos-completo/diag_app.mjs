import fs from 'fs';

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
const lines = raw.toString('latin1').split('\n');
console.log('Total linhas:', lines.length);

// Procurar a segunda ocorrencia de "renderIziBlackCard"
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('renderIziBlackCard')) {
    count++;
    console.log(`Ocorrencia ${count} em linha ${i + 1}: ${lines[i].substring(0, 80)}`);
    if (count >= 3) break;
  }
}

// Procurar JSX orfao - linhas sem contexto de funcao apos o fechamento de renderMasterPerks
// Mostrar contexto ao redor de "renderMasterPerks"
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('renderMasterPerks')) {
    console.log(`\nrenderMasterPerks em linha ${i + 1}: ${lines[i].substring(0, 80)}`);
  }
}

// Mostrar linhas 5025-5095 para diagnostico
console.log('\n--- Linhas 5025-5095 ---');
for (let i = 5024; i < Math.min(5094, lines.length); i++) {
  console.log(`${i + 1}: ${lines[i].substring(0, 100)}`);
}
