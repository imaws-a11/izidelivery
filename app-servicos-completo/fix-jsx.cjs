const fs = require('fs');
const filePath = 'c:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');

  if (lines[4133] && lines[4133].includes('</motion.div>')) {
    lines[4133] = lines[4133].replace('</motion.div>', '</div>');
  }
  if (lines[4174] && lines[4174].includes('</motion.div>')) {
    lines[4174] = lines[4174].replace('</motion.div>', '</div>');
  }
  if (lines[4179] && lines[4179].includes('</motion.div>')) {
    lines[4179] = lines[4179].replace('</motion.div>', '</div>');
  }

  // Verificar outras ocorrências nos modais problemáticos
  for(let i=4000; i<4250; i++) {
     if (lines[i] && lines[i].includes('</motion.div>') && lines[i-1] && lines[i-1].includes('/>') && lines[i-2] && lines[i-2].includes('<div')) {
         lines[i] = lines[i].replace('</motion.div>', '</div>');
     }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Correções aplicadas com sucesso!');
} catch (error) {
  console.error('Erro na correção:', error);
}
