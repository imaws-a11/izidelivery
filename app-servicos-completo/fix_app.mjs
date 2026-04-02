import fs from 'fs';

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
let content = raw.toString('latin1');
const lines = content.split('\n');
console.log('Total linhas:', lines.length);

let fixes = 0;

// FIX 1: linha 4799 (indice 4798) - comentario com bytes corrompidos
if (lines[4798] && lines[4798].includes('SUCESSO')) {
  lines[4798] = '    // -- SUCESSO --\r';
  fixes++;
  console.log('OK Fix 1: linha 4799 corrigida');
} else {
  console.log('AVISO Fix 1: linha 4799 sem SUCESSO:', lines[4798] ? lines[4798].substring(0, 60) : 'undefined');
}

// FIX 2: linha 5028 (indice 5027) - "};" + lixo JSX na mesma linha
if (lines[5027] && lines[5027].trimStart().startsWith('};')) {
  lines[5027] = '  };\r';
  fixes++;
  console.log('OK Fix 2: linha 5028 corrigida');
} else {
  console.log('AVISO Fix 2: linha 5028:', lines[5027] ? lines[5027].substring(0, 60) : 'undefined');
}

// FIX 3: remover linhas 5029-5086 (indices 5028-5085) - JSX orfao
if (lines[5087] && lines[5087].includes('renderIziBlackCard')) {
  const removed = 5086 - 5028;
  lines.splice(5028, removed);
  fixes++;
  console.log('OK Fix 3: ' + removed + ' linhas JSX orfas removidas (5029-5086)');
} else {
  console.log('AVISO Fix 3: indice 5087:', lines[5087] ? lines[5087].substring(0, 100) : 'undefined');
}

fs.writeFileSync(filePath, Buffer.from(lines.join('\n'), 'utf8'));
console.log('Salvo! ' + fixes + '/3 fixes aplicados. Linhas finais: ' + lines.length);
