const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-servicos-completo/src/components/features/Wallet/WalletView.tsx';
let data = fs.readFileSync(file, 'utf8');

data = data.replace(
  'const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr" | "scan">("main");',
  `const [walletMode, setWalletMode] = useState<"main" | "transfer" | "my_qr" | "scan" | "add_card">("main");
  const [newCard, setNewCard] = useState({ number: "", holder: "", expiry: "", cvv: "" });
  const [isSavingCard, setIsSavingCard] = useState(false);`
);

data = data.replace(
  /setPaymentsOrigin\("profile"\);\s*setSubView\("payments"\);/g,
  'setWalletMode("add_card");'
);

const addCardLayout = `
  const handleSaveCard = async () => {
    if(!newCard.number || newCard.number.length < 14) return showToast?.("Número do cartão inválido", "error");
    setIsSavingCard(true);
    
    const brand = newCard.number.startsWith("4") ? "Visa" : newCard.number.startsWith("5") ? "Mastercard" : "Amex";
    const last_four = newCard.number.replace(/\\s/g, "").slice(-4);
    
    const { error } = await supabase.from("payment_methods").insert({
      user_id: userId,
      brand,
      last_four,
      token: "tok_" + Math.random().toString(36).substr(2, 9),
      is_default: savedCards.length === 0
    });
    
    if (error) {
      showToast?.("Erro ao salvar cartão", "error");
    } else {
      showToast?.("Cartão salvo com sucesso!", "success");
      setWalletMode("main");
      setNewCard({ number: "", holder: "", expiry: "", cvv: "" });
      setTimeout(() => window.location.reload(), 1500);
    }
    setIsSavingCard(false);
  };

  if (walletMode === "add_card") {
    return (
      <div className="flex flex-col h-full bg-black text-white p-6 pt-12 gap-8 overflow-y-auto no-scrollbar pb-32">
        <header className="w-full flex items-center justify-between">
          <button onClick={() => setWalletMode("main")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base uppercase tracking-widest">Adicionar Cartão</h1>
          <div className="size-10" />
        </header>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Número do Cartão</label>
            <input 
              type="text" 
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              value={newCard.number}
              onChange={(e) => {
                const val = e.target.value.replace(/\\D/g, "");
                const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                setNewCard({ ...newCard, number: formatted || "" });
              }}
              className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nome Impresso</label>
            <input 
              type="text" 
              placeholder="NOME COMO ESTÁ NO CARTÃO"
              value={newCard.holder}
              onChange={(e) => setNewCard({ ...newCard, holder: e.target.value.toUpperCase() })}
              className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
            />
          </div>

          <div className="flex gap-4">
             <div className="space-y-2 flex-1">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Validade</label>
                <input 
                  type="text" 
                  placeholder="MM/AA"
                  maxLength={5}
                  value={newCard.expiry}
                  onChange={(e) => {
                    let val = e.target.value.replace(/\\D/g, "");
                    if(val.length > 2) val = val.slice(0,2) + "/" + val.slice(2,4);
                    setNewCard({ ...newCard, expiry: val });
                  }}
                  className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
                />
             </div>
             <div className="space-y-2 flex-1">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">CVV</label>
                <input 
                  type="password" 
                  placeholder="123"
                  maxLength={4}
                  value={newCard.cvv}
                  onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/\\D/g, "") })}
                  className="w-full bg-zinc-900/50 rounded-2xl px-5 py-4 focus:bg-zinc-900 outline-none transition-all font-bold placeholder:font-normal placeholder:text-zinc-700"
                />
             </div>
          </div>
        </div>

        <button 
          onClick={handleSaveCard}
          disabled={isSavingCard || !newCard.number || !newCard.expiry || !newCard.cvv || newCard.number.length < 14}
          className="w-full py-5 bg-yellow-400 rounded-2xl font-black text-black uppercase tracking-widest shadow-[0_10px_30px_rgba(255,215,9,0.2)] active:scale-95 disabled:opacity-50 transition-all mt-6"
        >
          {isSavingCard ? "Processando..." : "Salvar Cartão Seguro"}
        </button>
      </div>
    );
  }

  return (`;

data = data.replace('  return (\n    <div className="flex flex-col h-full bg-black', addCardLayout + '\n    <div className="flex flex-col h-full bg-black');

data = data.replace(/\{\/\* MÉTODOS DE PAGAMENTO \*\/\}[\s\S]*?\{\/\* HISTÓRICO \*\/\}/, '{/* HISTÓRICO */}');

fs.writeFileSync(file, data);
