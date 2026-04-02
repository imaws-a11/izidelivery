const fs = require('fs');
const filePath = 'c:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');

  // Ajustando de acordo com as linhas do view_file (que são 1-indexed pro humano, 0-indexed aqui)
  // linha 4134 => index 4133
  // linha 4175 => index 4174
  // linha 4180 => index 4179

  if (lines[4133].includes('</motion.div>')) {
    lines[4133] = lines[4133].replace('</motion.div>', '</div>');
  }
  if (lines[4174].includes('</motion.div>')) {
    lines[4174] = lines[4174].replace('</motion.div>', '</div>');
  }
  if (lines[4179].includes('</motion.div>')) {
    lines[4179] = lines[4179].replace('</motion.div>', '</div>');
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Correções aplicadas com sucesso!');
} catch (error) {
  console.error('Erro na correção:', error);
}
