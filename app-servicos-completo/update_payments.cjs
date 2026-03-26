const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add 'Métodos de Pagamento' to Profile menu items
if (!content.includes('label: "Métodos de Pagamento"')) {
    content = content.replace(
        /{ icon: "location_on",\s+label: "Endereços",\s+desc: "Seus endereços salvos",\s+action: \(\) => setSubView\("addresses"\) },/,
        '{ icon: "location_on",            label: "Endereços",        desc: "Seus endereços salvos",          action: () => setSubView("addresses") },\n      { icon: "credit_card",            label: "Métodos de Pagamento", desc: "Gerencie seus cartões e PIX",     action: () => { setPaymentsOrigin("profile"); setSubView("payments"); } },'
    );
}

// 2. Add useEffect to fetch cards when entering payments subView
const fetchEffect = `  // Fetch payment methods when entering payments screen
  useEffect(() => {
    if (subView === "payments" && userId) {
      fetchSavedCards(userId);
    }
  }, [subView, userId]);\n\n`;

if (!content.includes('if (subView === "payments" && userId)')) {
    content = content.replace(
        /\/\/ Simular movimento do entregador/,
        fetchEffect + '// Simular movimento do entregador'
    );
}

// 3. Improve cards UI in renderPayments (Add background gradient)
content = content.replace(
    /className={`relative p-6 rounded-\[32px\] border-2 transition-all cursor-pointer \${card\.active \? "border-yellow-400 bg-zinc-900\/80" : "border-zinc-900 bg-zinc-900\/30"}`}/,
    'className={`relative p-6 rounded-[32px] border-2 transition-all cursor-pointer ${card.active ? "border-yellow-400" : "border-zinc-900"}`}\n                    style={{ background: card.color || "rgba(24,24,27,0.5)" }}'
);

fs.writeFileSync(path, content);
console.log('App.tsx updated for Payment Methods');
