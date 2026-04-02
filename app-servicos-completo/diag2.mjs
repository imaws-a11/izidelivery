import fs from 'fs';

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
const lines = raw.toString('latin1').split('\n');

// A linha 4799 (indice 4798) tem "// -- SUCESSO --" mas deveria ter
// a abertura de uma motion.button. Vamos ver o contexto maior (4750-4806)
console.log('--- Contexto linhas 4750-4806 ---');
for (let i = 4749; i <= 4805; i++) {
  console.log(`${i + 1}: ${lines[i] ? lines[i].substring(0, 120) : ''}`);
}
