import fs from 'fs';

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
const lines = raw.toString('latin1').split('\n');
console.log('Total linhas antes:', lines.length);

// Localizando as duas declaracoes de renderIziBlackCard
const occurrences = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].match(/^\s+const renderIziBlackCard\s*=/)) {
    occurrences.push(i);
    console.log(`renderIziBlackCard na linha ${i + 1}: ${lines[i].substring(0, 80)}`);
  }
}

if (occurrences.length < 2) {
  console.log('Nao encontrou 2 ocorrencias de renderIziBlackCard - abortando');
  process.exit(1);
}

// A segunda ocorrencia comeca em occurrences[1] (linha 5030, indice 5029)
// Precisamos encontrar onde ela termina (o "  };" correspondente)
// Que e logo antes da proxima funcao "const render..." ou do final do componente

const startIdx = occurrences[1]; // indice da segunda renderIziBlackCard
console.log(`\nSegunda renderIziBlackCard no indice ${startIdx} (linha ${startIdx + 1})`);

// Procurar o final desta funcao (o proximo "  };" no nivel de indentacao top)
let endIdx = -1;
// A funcao seguinte a segunda renderIziBlackCard (a segunda renderMasterPerks)
for (let i = startIdx + 1; i < lines.length; i++) {
  // Procurar a terceira ocorrencia de uma funcao render no nivel raiz
  if (lines[i].match(/^\s{2}const render[A-Z]/) && i > startIdx + 10) {
    endIdx = i - 1; // termina antes desta nova funcao
    console.log(`Fim do bloco duplicado antes da linha ${i + 1}: ${lines[i].substring(0, 60)}`);
    break;
  }
}

if (endIdx === -1) {
  // Tentar encontrar pelo padrao de fechamento
  // As duas renderIziBlackCard + renderMasterPerks sao ~700 linhas
  // Vamos usar a segunda renderMasterPerks como referencia
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].match(/^\s{2}const renderMasterPerks\s*=/) && i > startIdx + 50) {
      // Esta e a segunda renderMasterPerks
      // O bloco duplicado vai da segunda renderIziBlackCard ate o fim da segunda renderMasterPerks
      // Precisamos encontrar o fechamento da segunda renderMasterPerks
      let mperksEnd = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].match(/^\s{2}const render[A-Z]/) && j > i + 10) {
          mperksEnd = j - 1;
          console.log(`Fim de renderMasterPerks duplicada antes da linha ${j + 1}`);
          break;
        }
      }
      if (mperksEnd > -1) {
        endIdx = mperksEnd;
      }
      break;
    }
  }
}

if (endIdx === -1) {
  console.log('Nao encontrou o fim do bloco duplicado - exibindo linhas para diagnostico:');
  for (let i = startIdx; i < Math.min(startIdx + 20, lines.length); i++) {
    console.log(`  ${i + 1}: ${lines[i].substring(0, 80)}`);
  }
  process.exit(1);
}

console.log(`\nRemovendo linhas ${startIdx + 1} a ${endIdx + 1} (${endIdx - startIdx + 1} linhas)`);

// Remover o bloco duplicado (da segunda renderIziBlackCard ate o fim dela)
lines.splice(startIdx, endIdx - startIdx + 1);
console.log('Linhas removidas:', endIdx - startIdx + 1);

fs.writeFileSync(filePath, Buffer.from(lines.join('\n'), 'utf8'));
console.log('Salvo! Total final:', lines.length, 'linhas');
