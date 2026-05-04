import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";

export const HelpCenterView = ({ onBack }: { onBack: () => void }) => {
  const { appSettings } = useApp();
  const [searchQuery, setSearchQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    { q: "Como funciona o Clube Izi?", a: "O Clube Izi é a nossa assinatura premium (Izi Black). Ao assinar, você garante benefícios exclusivos como frete grátis, cashback em dobro e acesso antecipado a promoções." },
    { q: "Meu pedido atrasou, o que fazer?", a: "Se o seu pedido passou do tempo estimado de entrega, você pode entrar em contato diretamente com o restaurante pelo chat do pedido, ou acionar nosso suporte abaixo." },
    { q: "Como alterar meu endereço?", a: "Vá até o seu Perfil, clique em 'Endereços' e você poderá adicionar, editar ou remover seus locais de entrega." },
    { q: "Quais são as formas de pagamento?", a: "Aceitamos Pix, Cartão de Crédito e Bitcoin Lightning Network. Tudo processado com a máxima segurança." },
    { q: "Como resgatar cupons?", a: "No menu do Perfil, acesse 'Cupons'. Lá você pode ver os cupons disponíveis para sua conta e ativá-los antes de finalizar uma compra." },
    { q: "Posso cancelar um pedido?", a: "Sim, desde que o restaurante ainda não tenha começado a prepará-lo. Você pode fazer isso diretamente na tela de acompanhamento do pedido." }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    faq.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSupport = () => {
    const phone = appSettings?.whatsapp_number || appSettings?.support_whatsapp || "5511999999999";
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=Olá! Preciso de ajuda com o IziDelivery.`, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen h-full bg-[#F7F7F7] pb-20 overflow-y-auto">
      <header className="bg-yellow-400 px-6 pt-20 pb-12 rounded-b-[40px] shadow-lg sticky top-0 z-50">
        <div className="flex items-center justify-between mb-6">
           <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-black/10 active:bg-black/20 transition-colors">
             <span className="material-symbols-rounded text-black">arrow_back</span>
           </button>
           <h1 className="text-xl font-black text-black">Central de Ajuda</h1>
           <div className="size-10" />
        </div>
        <div className="bg-white p-2 rounded-2xl flex items-center gap-2 shadow-sm transition-all focus-within:ring-2 focus-within:ring-black">
           <span className="material-symbols-rounded text-zinc-400 ml-2">search</span>
           <input 
             type="text" 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Como podemos ajudar?" 
             className="flex-1 h-10 outline-none font-bold text-zinc-900 bg-transparent" 
           />
           {searchQuery && (
             <button onClick={() => setSearchQuery("")} className="size-8 flex items-center justify-center rounded-full hover:bg-zinc-100">
               <span className="material-symbols-rounded text-zinc-400 text-sm">close</span>
             </button>
           )}
        </div>
      </header>

      <main className="px-6 py-6 space-y-6 -mt-6 relative z-10">
        {!searchQuery && (
          <div className="grid grid-cols-2 gap-4">
             <div onClick={handleSupport} className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100 cursor-pointer active:scale-95 transition-transform">
                <span className="material-symbols-rounded text-3xl text-zinc-800 mb-2">local_mall</span>
                <p className="font-bold text-zinc-900 text-sm">Problemas com pedido</p>
             </div>
             <div onClick={handleSupport} className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-100 cursor-pointer active:scale-95 transition-transform">
                <span className="material-symbols-rounded text-3xl text-zinc-800 mb-2">account_balance_wallet</span>
                <p className="font-bold text-zinc-900 text-sm">Pagamentos e estornos</p>
             </div>
          </div>
        )}

        <section className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100">
           <h3 className="font-black text-lg mb-4">{searchQuery ? "Resultados da Busca" : "Dúvidas Frequentes"}</h3>
           <div className="space-y-2">
              {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => (
                <div key={idx} className="border-b border-zinc-100 last:border-0 pb-2 last:pb-0">
                   <button 
                     onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                     className="w-full py-3 flex items-center justify-between text-left"
                   >
                     <p className="font-bold text-zinc-900 pr-4">{faq.q}</p>
                     <span className={`material-symbols-rounded text-zinc-400 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}>
                       expand_more
                     </span>
                   </button>
                   <AnimatePresence>
                     {openIndex === idx && (
                       <motion.div 
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: "auto", opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                       >
                         <p className="text-sm text-zinc-500 pb-4 leading-relaxed">{faq.a}</p>
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              )) : (
                <div className="text-center py-6">
                  <p className="text-zinc-500 font-medium">Nenhuma dúvida encontrada para "{searchQuery}"</p>
                </div>
              )}
           </div>
        </section>

        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleSupport}
          className="w-full bg-zinc-900 text-white h-16 rounded-3xl font-black flex items-center justify-center gap-2 shadow-xl"
        >
          <span className="material-symbols-rounded">support_agent</span>
          Falar com um atendente
        </motion.button>
      </main>
    </div>
  );
};
