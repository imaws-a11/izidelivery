import fs from 'fs';

// Restaura o retorno JSX da funcao renderIziBlackPurchase
// que foi perdido pela corrupcao de encoding

const filePath = 'src/App.tsx';
const raw = fs.readFileSync(filePath);
const lines = raw.toString('latin1').split('\n');
console.log('Total linhas antes:', lines.length);

// Indice 4798 = "    // -- SUCESSO --" (placeholder do comentario falso)
// Indices 4799-4803 = fechamentos JSX orfaos: </motion.button></div></motion.div></div> );
// Indice 4804 = "  };"  (fechamento da funcao renderIziBlackPurchase)
//
// O que deveria estar nos indices 4798..4803 e o return() com o JSX completo da tela.
// Vamos substituir OS INDICES 4798 (comentario) e remover os fechamentos orfaos (4799-4803)
// e inserir o JSX completo correto.

// Verificar o que temos nesses indices
for (let i = 4795; i <= 4808; i++) {
  console.log(`${i+1}: "${lines[i] ? lines[i].replace(/\r/g,'').substring(0,100) : 'undefined'}"`);
}

// O JSX correto de retorno da funcao renderIziBlackPurchase
// Baseado no padrao da aplicacao: tela de compra Izi Black com steps
const returnJSX = [
'\r',
'    return (\r',
'      <div className="fixed inset-0 z-[150] bg-black text-white flex flex-col overflow-y-auto no-scrollbar">\r',
'        {/* Header */}\r',
'        <header className="px-6 py-5 flex items-center gap-4 sticky top-0 bg-black/90 backdrop-blur-xl z-10 border-b border-zinc-900">\r',
'          <motion.button whileTap={{ scale: 0.9 }} onClick={handleClose}\r',
'            className="size-11 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white">\r',
'            <span className="material-symbols-outlined">close</span>\r',
'          </motion.button>\r',
'          <div>\r',
'            <h1 className="font-extrabold text-base text-white uppercase tracking-tight">Izi Black</h1>\r',
'            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Assinatura Premium</p>\r',
'          </div>\r',
'        </header>\r',
'\r',
'        <main className="flex-1 px-6 py-8 space-y-6">\r',
'          {/* Preco */}\r',
'          <div className="text-center py-6">\r',
'            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">Investimento Mensal</p>\r',
'            <p className="text-5xl font-black text-white tracking-tighter">\r',
'              R$ <span className="text-yellow-400">{iziBlackPrice.toFixed(2).replace(".", ",")}</span>\r',
'            </p>\r',
'            <p className="text-zinc-600 text-xs font-semibold mt-1">Cancele quando quiser</p>\r',
'          </div>\r',
'\r',
'          {/* Metodo de pagamento */}\r',
'          <div className="space-y-3">\r',
'            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Forma de Pagamento</p>\r',
'            {[\r',
'              { id: "pix",    label: "PIX",           icon: "pix" },\r',
'              { id: "saldo",  label: "Saldo Izi",      icon: "account_balance_wallet" },\r',
'              { id: "cartao", label: "Cartão de Crédito", icon: "credit_card" },\r',
'            ].map(m => (\r',
'              <button key={m.id} onClick={() => setPaymentMethod(m.id as any)}\r',
'                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all ${\r',
'                  paymentMethod === m.id\r',
'                    ? "border-yellow-400 bg-yellow-400/5"\r',
'                    : "border-zinc-800 bg-zinc-900/30"\r',
'                }`}>\r',
'                <span className="material-symbols-outlined text-yellow-400">{m.icon}</span>\r',
'                <span className="font-bold text-sm text-white">{m.label}</span>\r',
'                {paymentMethod === m.id && (\r',
'                  <span className="material-symbols-outlined text-yellow-400 ml-auto text-lg" style={{ fontVariationSettings: "\'FILL\' 1" }}>check_circle</span>\r',
'                )}\r',
'              </button>\r',
'            ))}\r',
'          </div>\r',
'        </main>\r',
'\r',
'        {/* Botao de assinar */}\r',
'        <div className="p-6 pb-10 border-t border-zinc-900">\r',
'          <motion.button\r',
'            whileTap={{ scale: 0.97 }}\r',
'            onClick={handleSubscribeReal}\r',
'            disabled={isLoading}\r',
'            className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${\r',
'              isLoading ? "bg-zinc-800 text-zinc-500" : "bg-yellow-400 text-black hover:shadow-[0_0_30px_rgba(234,179,8,0.3)]"\r',
'            }`}\r',
'          >\r',
'            {isLoading ? (\r',
'              <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>\r',
'            ) : (\r',
'              <>\r',
'                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "\'FILL\' 1" }}>workspace_premium</span>\r',
'                Assinar Izi Black\r',
'              </>\r',
'            )}\r',
'          </motion.button>\r',
'          <p className="text-center text-[9px] text-zinc-700 font-bold uppercase tracking-widest mt-4">\r',
'            Ao assinar, você concorda com os Termos de Uso do Izi Black\r',
'          </p>\r',
'        </div>\r',
'      </div>\r',
'    );\r',
];

// Substituir indices 4798..4803 (6 linhas: o comentario falso + os fechamentos orfaos)
// pelo bloco JSX correto
lines.splice(4798, 6, ...returnJSX);

console.log('\nInseridas', returnJSX.length, 'linhas, removidas 6 orfas');
console.log('Total apos fix:', lines.length);

fs.writeFileSync(filePath, Buffer.from(lines.join('\n'), 'utf8'));
console.log('Salvo!');
