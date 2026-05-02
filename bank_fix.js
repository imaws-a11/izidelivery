const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery_git/izidelivery/app-entregador-completo/src/App.tsx';
let code = fs.readFileSync(file, 'utf8');

const startStr = 'const renderBankDetailsView = () => {';
const endStr = 'const renderPreferencesView = () => {';
const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    let block = code.substring(startIndex, endIndex);

    // Fix character encodings in this block
    block = block.replace(/Dados Banc.*?rios/g, 'Dados Bancários');
    block = block.replace(/ser.*?o transferidos/g, 'serão transferidos');
    block = block.replace(/solicita.*?o de saque/g, 'solicitação de saque');
    block = block.replace(/Ita.*? Nubank/g, 'Itaú, Nubank');
    block = block.replace(/N.*?o Salvo/g, 'Não Salvo');
    block = block.replace(/fornecida ser.* vinculada/g, 'fornecida será vinculada');
    block = block.replace(/seguran.*?a/g, 'segurança');

    // Make all text colors black/dark for better contrast as requested
    // "todo texto que estiver em cor cinza precisa ir para o preto"
    block = block.replace(/text-zinc-400/g, 'text-zinc-900');
    block = block.replace(/text-zinc-200/g, 'text-zinc-900');
    block = block.replace(/text-zinc-300/g, 'text-zinc-600'); // Placeholders and icons should be at least highly visible.
    
    // Ensure the bg of inputs has better contrast too just in case
    // If the texts inside input are text-zinc-900 they are already fine.

    code = code.substring(0, startIndex) + block + code.substring(endIndex);
}

// Global failsafe for encoding issues related to 'Dados Bancários'
code = code.replace(/Dados Banc.*rios/g, 'Dados Bancários');

fs.writeFileSync(file, code);
console.log('Fixed Bank Details view text colors and encoding.');
