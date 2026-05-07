import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "../../common/Icon";
import { supabase } from "../../../lib/supabase";
import { toastSuccess, toastError } from "../../../lib/useToast";

interface Cause {
  id: string;
  name: string;
  org: string;
  img: string;
  matched: boolean;
  desc: string;
}

export const DonationsView = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<"list" | "amount" | "payment" | "processing" | "success">("list");
  const [selectedCause, setSelectedCause] = useState<Cause | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "lightning" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const causes: Cause[] = [
    { id: "1", name: "S.O.S RS - Abrigos", org: "Cruz Vermelha", img: "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=800&q=80", matched: true, desc: "Apoio direto às famílias desabrigadas pelas enchentes no Rio Grande do Sul." },
    { id: "2", name: "Alimentando Vidas", org: "ONG Prato Fundo", img: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&q=80", matched: false, desc: "Distribuição diária de marmitas para pessoas em situação de rua em grandes centros." },
    { id: "3", name: "Animais Resgatados", org: "Patinhas do Bem", img: "https://images.unsplash.com/photo-1541364983171-a8ba01e95cfc?w=800&q=80", matched: true, desc: "Resgate, castração e encaminhamento para adoção de cães e gatos abandonados." }
  ];

  const handleDonate = async () => {
    setIsProcessing(true);
    setStep("processing");
    
    // Simulação de processamento
    setTimeout(() => {
      setIsProcessing(false);
      setStep("success");
      toastSuccess("Sua doação foi processada com sucesso!");
    }, 3000);
  };

  const renderList = () => (
    <div className="space-y-10">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between sticky top-0 z-50 bg-black/90 backdrop-blur-md">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full border border-zinc-800 bg-black">
          <Icon name="arrow_back" size={20} className="text-white" />
        </button>
        <div className="flex flex-col items-center">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Social</p>
          <h1 className="text-xl font-black text-white tracking-tighter italic">Izi Doações</h1>
        </div>
        <div className="size-10" />
      </header>

      <main className="px-6 pb-32 space-y-12">
        {/* Banner Impacto */}
        <section className="relative h-64 rounded-[40px] overflow-hidden border border-zinc-900 group">
           <img 
             src="https://images.unsplash.com/photo-1593113598332-cd288d649433?w=1000&q=80" 
             className="size-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000" 
             alt="Impact"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-8 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-3">
                 <div className="h-1 w-6 bg-yellow-500 rounded-full" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500">Izi Matching</span>
              </div>
              <h2 className="text-3xl font-black text-white leading-tight tracking-tighter">O Izi dobra a sua doação.</h2>
              <p className="text-zinc-400 text-xs font-bold mt-2">Para cada R$ 1 que você doa nas causas seladas, nós doamos outro.</p>
           </div>
        </section>

        {/* Causas */}
        <section className="space-y-8">
           <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Causas Prioritárias</h3>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">3 Disponíveis</span>
           </div>

           <div className="space-y-4">
              {causes.map((cause) => (
                <motion.div 
                  key={cause.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedCause(cause); setStep("amount"); }}
                  className="bg-zinc-950 border border-zinc-900 rounded-[35px] overflow-hidden group cursor-pointer"
                >
                   <div className="h-48 relative">
                      <img src={cause.img} className="size-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" alt={cause.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                      {cause.matched && (
                        <div className="absolute top-6 left-6 px-3 py-1 bg-yellow-500 rounded-full text-[8px] font-black text-black uppercase tracking-widest shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                           X2 Ativo
                        </div>
                      )}
                   </div>
                   <div className="p-8 flex items-center justify-between">
                      <div>
                         <h4 className="text-xl font-black text-white tracking-tighter uppercase">{cause.name}</h4>
                         <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{cause.org}</p>
                      </div>
                      <div className="size-12 rounded-2xl border border-zinc-800 flex items-center justify-center text-white group-hover:border-yellow-500 transition-colors">
                         <Icon name="arrow_forward" size={20} />
                      </div>
                   </div>
                </motion.div>
              ))}
           </div>
        </section>
      </main>
    </div>
  );

  const renderAmount = () => (
    <div className="flex flex-col min-h-screen h-full bg-black">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between">
        <button onClick={() => setStep("list")} className="size-10 flex items-center justify-center rounded-full border border-zinc-800">
          <Icon name="arrow_back" size={20} className="text-white" />
        </button>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Passo 01/02</span>
        <div className="size-10" />
      </header>

      <main className="flex-1 px-8 flex flex-col justify-center space-y-12 pb-20">
         <div className="text-center space-y-4">
            <p className="text-sm font-black text-zinc-500 uppercase tracking-[0.4em]">Quanto deseja doar?</p>
            <div className="flex items-center justify-center gap-2">
               <span className="text-3xl font-black text-zinc-700">R$</span>
               <input 
                 autoFocus
                 type="number" 
                 value={amount}
                 onChange={(e) => setAmount(e.target.value)}
                 placeholder="0,00"
                 className="bg-transparent text-7xl font-black text-white text-center w-full focus:outline-none placeholder:text-zinc-900 tabular-nums tracking-tighter"
               />
            </div>
         </div>

         <div className="grid grid-cols-3 gap-3">
            {["10", "20", "50", "100", "200", "500"].map((v) => (
              <motion.button
                key={v}
                whileTap={{ scale: 0.95 }}
                onClick={() => setAmount(v)}
                className={`py-4 rounded-2xl border font-black text-sm transition-all ${amount === v ? 'bg-white border-white text-black' : 'bg-transparent border-zinc-900 text-zinc-400'}`}
              >
                R$ {v}
              </motion.button>
            ))}
         </div>
      </main>

      <footer className="p-8">
         <motion.button
           whileTap={{ scale: 0.98 }}
           disabled={!amount || Number(amount) <= 0}
           onClick={() => setStep("payment")}
           className="w-full h-18 rounded-[30px] bg-white text-black font-black uppercase tracking-widest disabled:opacity-20 transition-all flex items-center justify-center gap-3"
         >
            Escolher Pagamento
            <Icon name="chevron_right" size={20} />
         </motion.button>
      </footer>
    </div>
  );

  const renderPayment = () => (
    <div className="flex flex-col min-h-screen h-full bg-black">
      <header className="px-6 pt-20 pb-6 flex items-center justify-between">
        <button onClick={() => setStep("amount")} className="size-10 flex items-center justify-center rounded-full border border-zinc-800">
          <Icon name="arrow_back" size={20} className="text-white" />
        </button>
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Passo 02/02</span>
        <div className="size-10" />
      </header>

      <main className="px-8 space-y-10 py-10">
         <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">Forma de Doação</h2>
            <p className="text-zinc-500 text-sm font-bold">O valor de R$ {amount} será repassado integralmente para {selectedCause?.org}.</p>
         </div>

         <div className="space-y-3">
            {[
              { id: "pix", label: "Pix Instantâneo", desc: "Aprovação imediata", icon: "qr_code_2", color: "text-emerald-400" },
              { id: "card", label: "Cartão de Crédito", desc: "Visa, Master, Amex, Elo", icon: "credit_card", color: "text-blue-400" },
              { id: "lightning", label: "Bitcoin Lightning", desc: "Rede descentralizada e ultra rápida", icon: "bolt", color: "text-orange-400" },
            ].map((method) => (
              <motion.button
                key={method.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`w-full p-8 rounded-[35px] border flex items-center justify-between transition-all ${paymentMethod === method.id ? 'bg-zinc-900 border-yellow-500/50' : 'bg-transparent border-zinc-900 hover:border-zinc-700'}`}
              >
                <div className="flex items-center gap-6">
                  <div className={`size-14 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center ${method.color}`}>
                    <Icon name={method.icon} size={28} />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-lg text-white tracking-tight">{method.label}</p>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1">{method.desc}</p>
                  </div>
                </div>
                <div className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-yellow-500' : 'border-zinc-800'}`}>
                   {paymentMethod === method.id && <div className="size-3 bg-yellow-500 rounded-full" />}
                </div>
              </motion.button>
            ))}
         </div>
      </main>

      <footer className="p-8 mt-auto">
         <motion.button
           whileTap={{ scale: 0.98 }}
           disabled={!paymentMethod}
           onClick={handleDonate}
           className="w-full h-20 rounded-[35px] bg-yellow-400 text-black font-black uppercase tracking-[0.2em] shadow-[0_20px_40px_rgba(234,179,8,0.2)] disabled:opacity-20 flex items-center justify-center gap-3"
         >
            Confirmar Doação
            <div className="px-3 py-1 bg-black/10 rounded-full text-[10px]">R$ {amount}</div>
         </motion.button>
      </footer>
    </div>
  );

  const renderProcessing = () => (
    <div className="flex flex-col items-center justify-center min-h-screen h-full bg-black px-10 text-center space-y-8">
       <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="size-32 rounded-full border-4 border-zinc-900 border-t-yellow-500"
          />
          <div className="absolute inset-0 flex items-center justify-center">
             <Icon name="volunteer_activism" size={40} className="text-yellow-500" />
          </div>
       </div>
       <div className="space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Processando...</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Validando protocolo de transferência segura</p>
       </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="flex flex-col min-h-screen h-full bg-black p-8 text-center">
       <div className="flex-1 flex flex-col items-center justify-center space-y-10">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="size-32 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.3)]"
          >
             <Icon name="check" size={60} className="text-black" />
          </motion.div>
          
          <div className="space-y-4">
             <h2 className="text-4xl font-black text-white tracking-tighter">OBRIGADO!</h2>
             <p className="text-zinc-400 font-medium leading-relaxed">Sua contribuição para <b>{selectedCause?.name}</b> foi confirmada. Juntos, estamos mudando realidades.</p>
          </div>

          <div className="w-full p-8 rounded-[40px] bg-zinc-950 border border-zinc-900 space-y-4">
             <div className="flex justify-between items-center pb-4 border-b border-zinc-900">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Valor doado</span>
                <span className="text-xl font-black text-white">R$ {amount}</span>
             </div>
             {selectedCause?.matched && (
               <div className="flex justify-between items-center text-yellow-500">
                  <span className="text-[10px] font-black uppercase tracking-widest">Izi Matching</span>
                  <span className="text-xl font-black">+ R$ {amount}</span>
               </div>
             )}
          </div>
       </div>

       <motion.button
         whileTap={{ scale: 0.98 }}
         onClick={onBack}
         className="w-full h-18 rounded-[30px] border border-zinc-800 text-white font-black uppercase tracking-widest"
       >
          Voltar ao Início
       </motion.button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-y-auto no-scrollbar">
       <AnimatePresence mode="wait">
          {step === "list" && <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>{renderList()}</motion.div>}
          {step === "amount" && <motion.div key="amount" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>{renderAmount()}</motion.div>}
          {step === "payment" && <motion.div key="payment" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>{renderPayment()}</motion.div>}
          {step === "processing" && <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{renderProcessing()}</motion.div>}
          {step === "success" && <motion.div key="success" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>{renderSuccess()}</motion.div>}
       </AnimatePresence>
    </div>
  );
};

