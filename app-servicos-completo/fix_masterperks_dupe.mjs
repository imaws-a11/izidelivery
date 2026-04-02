import fs from 'fs';

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
const lines = raw.toString('latin1').split('\n');
console.log('Total linhas antes:', lines.length);

// Encontrar TODAS as declaracoes de const renderMasterPerks
const occurrences = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s{2,4}const renderMasterPerks\s*=/)) {
    occurrences.push(i);
    console.log(`renderMasterPerks no indice ${i} (linha ${i+1}): ${lines[i].substring(0,80)}`);
  }
}

if (occurrences.length < 2) {
  console.log('Menos de 2 ocorrencias encontradas. Nada a fazer.');
  process.exit(0);
}

// Segunda ocorrencia
const startIdx = occurrences[1];
console.log(`\nSegunda ocorrencia em ${startIdx + 1}`);

// Encontrar o fim desta segunda funcao (proximo "  const render..." ou fim do componente)
let endIdx = -1;
for (let i = startIdx + 10; i < lines.length; i++) {
  if (lines[i].match(/^\s{2,4}const render[A-Z]/) ||
      lines[i].match(/^\s{2}\/\/ ─+/) ||
      lines[i].match(/^\s{2}return\s*\(/) ) {
    endIdx = i - 1;
    console.log(`Fim antes da linha ${i+1}: ${lines[i].substring(0,80)}`);
    break;
  }
}

if (endIdx === -1) {
  // fallback: mostrar as proximas 30 linhas para debug
  console.log('Nao encontrou fim automaticamente. Proximas 30 linhas:');
  for (let i = startIdx; i < Math.min(startIdx + 30, lines.length); i++) {
    console.log(`  ${i+1}: ${lines[i].substring(0,100)}`);
  }
  process.exit(1);
}

const count = endIdx - startIdx + 1;
console.log(`\nRemovendo ${count} linhas (${startIdx+1} a ${endIdx+1})`);
lines.splice(startIdx, count);
console.log('Total apos remocao:', lines.length);

fs.writeFileSync(filePath, Buffer.from(lines.join('\n'), 'utf8'));
console.log('Salvo!');
