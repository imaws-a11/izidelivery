const fs = require('fs');
const file = 'c:/Users/swami/.gemini/antigravity/scratch/izidelivery/app-servicos-completo/src/App.tsx';
let txt = fs.readFileSync(file, 'utf8');

const regex = /const statusMessages: Record<string, string> = \{\s*'novo'[\s\S]*?'cancelado'[\s\S]*?\n\s*\};/;
const replacement = `const statusMessages: Record<string, string> = {
              'novo': 'Pagamento aprovado! O lojista já recebeu seu pedido. ⚡',
              'pendente_pagamento': 'Aguardando confirmação do pagamento... 💳',
              'pendente': 'O lojista recebeu seu pedido! 🥳',
              'aceito': 'O estabelecimento aceitou seu pedido! 🥳',
              'confirmado': 'Pedido confirmado! O preparo começou. ✅',
              'preparando': 'Seu pedido está sendo preparado com carinho! 🥗',
              'no_preparo': 'Seu pedido já está no preparo! 🥗',
              'waiting_driver': 'Pedido aceito! Buscando o melhor entregador para você. 🛵',
              'pronto': 'Pedido pronto! Aguardando o motoboy para coleta. 📦',
              'saiu_para_coleta': 'O motoboy aceitou e está indo retirar seu pedido! 🛵',
              'picked_up': 'Pedido coletado! O motoboy iniciou a entrega para você. 🚀',
              'a_caminho': 'Motoboy a caminho! Sua entrega está em rota. 🛵',
              'saiu_para_entrega': 'Fique atento! Seu pedido saiu para entrega! 🛵',
              'em_rota': 'Motoboy a caminho! Prepare-se para receber seu Izi. 🛵',
              'no_local': 'O motoboy chegou ao seu endereço! 🔔',
              'concluido': 'Pedido entregue com sucesso! Bom apetite. ✨',
              'cancelado': 'Ah não! Seu pedido foi cancelado. ⚠️',
              'recusado': 'Desculpe, o estabelecimento não pôde aceitar o pedido agora. ⚠️'
            };`;

if (regex.test(txt)) {
    txt = txt.replace(regex, replacement);
    console.log("Substituiu statusMessages.");
} else {
    console.log("Não encontrou o regex.");
}

txt = txt.replace(/Confirmar Envio Instant.neo/g, 'Confirmar Envio Instantâneo');
txt = txt.replace(/Meus Cart.es/g, 'Meus Cartões');
txt = txt.replace(/VOC. EST. DENTRO/g, 'VOCÊ ESTÁ DENTRO');
fs.writeFileSync(file, txt, 'utf8');
console.log("Feito.");
