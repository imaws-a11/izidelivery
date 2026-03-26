const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add Balance Card at the top of main in renderPayments
const balanceCard = `        <main className="px-5 py-8 space-y-10">
          {/* RESUMO DE SALDO */}
          <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 p-6 rounded-[35px] flex items-center justify-between shadow-2xl">
            <div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Seu Saldo IZI</p>
              <h2 className="text-3xl font-black text-white">R$ {(userBalance || 0).toFixed(2).replace(".", ",")}</h2>
            </div>
            <button onClick={() => setTab("wallet")} className="size-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-yellow-400/20">
              <span className="material-symbols-outlined font-bold">add</span>
            </button>
          </div>`;

if (!content.includes('RESUMO DE SALDO')) {
    content = content.replace(
        /<main className="px-5 py-8 space-y-10">/,
        balanceCard
    );
}

fs.writeFileSync(path, content);
console.log('App.tsx finalized with Balance in Payments');
