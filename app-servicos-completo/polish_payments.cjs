const fs = require('fs');
const path = 'C:\\Users\\swami\\.gemini\\antigravity\\scratch\\izidelivery\\app-servicos-completo\\src\\App.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix encoding in Card dots
content = content.replace(
    /â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ â€¢â€¢â€¢â€¢ {card\.last4}/g,
    '•••• •••• •••• {card.last4}'
);

// 2. Add Wallet to 'Outros Métodos'
content = content.replace(
    /\[\s+{ id: "pix", icon: "pix", label: "PIX Instantâneo", color: "text-emerald-400" },/,
    '[\n                  { id: "wallet", icon: "account_balance_wallet", label: "Saldo Carteira Izi", color: "text-yellow-400" },\n                  { id: "pix", icon: "pix", label: "PIX Instantâneo", color: "text-emerald-400" },'
);

// 3. Add Premium look to Payment Buttons (Hover effects/Animations)
content = content.replace(
    /className={`w-full flex items-center gap-4 p-5 hover:bg-zinc-900\/50 transition-all \${i > 0 \? "border-t border-zinc-900" : ""}`}/,
    'className={`w-full flex items-center gap-4 p-4 hover:bg-zinc-900 transition-all active:scale-[0.98] ${i > 0 ? "border-t border-zinc-900/50" : ""}`}'
);

fs.writeFileSync(path, content);
console.log('App.tsx polished for Payment Methods');
