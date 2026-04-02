import fs from 'fs';

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
const lines = raw.toString('latin1').split('\n');
console.log('Total linhas antes:', lines.length);

// Linha 4799 (indice 4798): "    // -- SUCESSO --"
// Linha 4800 (indice 4799): "            </motion.button>"
// 
// O que deveria existir aqui e o retorno JSX da funcao renderIziBlackPurchase
// com o iziBlackStep (select/payment/success) e o botao principal.
// O comentario substituiu a abertura de um <motion.button> (o botao "Comecar Experiencia Elite")
// que fazia parte do JSX de sucesso.
//
// Precisamos INSERIR o JSX completo entre a linha 4798 (fim de handleSubscribeReal)
// e a linha 4799 (o comentario falso) e manter o fechamento correto.
//
// O bloco a inserir (DEPOIS da linha 4797 "    };" e ANTES da linha 4799):

const insertAfterIdx = 4797; // logo apos "    };"  (linha 4798, indice 4797)

// O bloco correto do JSX da funcao renderIziBlackPurchase:
const jsxBlock = [
  '\r',
  '    // ── RENDERIZACAO ───────────────────────────────────────────────────────────\r',
  '\r',
  '    if (iziBlackStep === \'success\') {\r',
  '      return (\r',
  '        <motion.div\r',
  '          initial={{ opacity: 0 }}\r',
  '          animate={{ opacity: 1 }}\r',
  '          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center px-8"\r',
  '        >\r',
  '          <div className="text-center max-w-xs">\r',
  '            <motion.div\r',
  '              initial={{ scale: 0 }}\r',
  '              animate={{ scale: 1 }}\r',
  '              transition={{ type: "spring", delay: 0.3, bounce: 0.5 }}\r',
  '              className="size-24 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-[0_15px_40px_rgba(234,179,8,0.3)]"\r',
  '            >\r',
  '              <span className="material-symbols-outlined text-5xl text-black" style={{ fontVariationSettings: "\'FILL\' 1" }}>workspace_premium</span>\r',
  '            </motion.div>\r',
  '            <motion.h1\r',
  '              initial={{ opacity: 0, y: 20 }}\r',
  '              animate={{ opacity: 1, y: 0 }}\r',
  '              transition={{ delay: 0.6 }}\r',
  '              className="text-3xl font-black text-white mb-3 tracking-tight"\r',
  '            >\r',
  '              BEM-VINDO AO <span className="text-yellow-400">IZI BLACK</span>!\r',
  '            </motion.h1>\r',
  '            <motion.p\r',
  '              initial={{ opacity: 0 }}\r',
  '              animate={{ opacity: 1 }}\r',
  '              transition={{ delay: 0.8 }}\r',
  '              className="text-zinc-400 text-sm mb-10 leading-relaxed"\r',
  '            >\r',
  '              Seus privilégios exclusivos foram ativados com sucesso.\r',
  '            </motion.p>\r',
  '            <motion.button\r',
  '              initial={{ opacity: 0, y: 20 }}\r',
  '              animate={{ opacity: 1, y: 0 }}\r',
  '              transition={{ delay: 1.0 }}\r',
  '              whileTap={{ scale: 0.97 }}\r',
  '              onClick={() => handleClose()}\r',
  '              className="w-full bg-yellow-400 text-black font-black py-5 rounded-full text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"\r',
  '            >\r',
  '              Começar Experiência Elite\r',
];

// Substituir a linha do comentario falso (4798) e inserir o bloco
// Indice 4798 = "    // -- SUCESSO --" (deveria ser o inicio do retorno JSX)
lines.splice(4798, 1, ...jsxBlock);

console.log('Inseridas', jsxBlock.length, 'linhas no lugar do comentario falso');
console.log('Total apos insercao:', lines.length);

fs.writeFileSync(filePath, Buffer.from(lines.join('\n'), 'utf8'));
console.log('Salvo!');
