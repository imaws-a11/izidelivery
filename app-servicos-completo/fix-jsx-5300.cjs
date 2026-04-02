const fs = require('fs');
const filePath = 'c:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';

try {
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');

  if (lines[5313] && lines[5313].includes('</motion.div>')) {
    lines[5313] = lines[5313].replace('</motion.div>', '</div>');
  }
  if (lines[5371] && lines[5371].includes('</motion.div>')) {
    lines[5371] = lines[5371].replace('</motion.div>', '</div>');
  }

  // Verificar outras ocorrências num escopo maior (5200-5500)
  for(let i=5200; i<5500; i++) {
     if (lines[i] && lines[i].includes('</motion.div>') && lines[i-1] && lines[i-1].includes('/>') && lines[i-2] && lines[i-2].includes('<div className=')) {
         lines[i] = lines[i].replace('</motion.div>', '</div>');
     }
  }

  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('Correções secundárias no JSX do Izi Black aplicadas com sucesso!');
} catch (error) {
  console.error('Erro na correção:', error);
}
