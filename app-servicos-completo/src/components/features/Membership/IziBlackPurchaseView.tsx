import { motion } from "framer-motion";
import { useState } from "react";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const IziBlackPurchaseView = () => {
  const { 
    setSubView, 
    isIziBlackMembership, 
    userId,
    supabase,
    toastSuccess,
    toastError,
    fetchWalletBalance,
    fetchMyOrders
  } = useApp();

  const [iziBlackStep, setIziBlackStep] = useState<"info" | "payment">("info");
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => setSubView("none");

  const handleSubscribeReal = async () => {
    if (!userId) return;
    if (cpf.length < 11) {
      toastError("Por favor, informe um CPF válido.");
      return;
    }

    setIsLoading(true);
    try {
      // Simulação de assinatura - no App.tsx original parecia ser uma simulação ou chamada simples
      const { error } = await supabase
        .from("users_delivery")
        .update({ is_izi_black: true, cpf: cpf })
        .eq("id", userId);

      if (error) throw error;

      toastSuccess("Parabéns! Você agora é um membro Izi Black.");
      setSubView("izi_black_welcome");
    } catch (e: any) {
      toastError("Erro ao processar assinatura: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (iziBlackStep === "payment") {
    return (
      <div className="absolute inset-0 z-50 bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-24">
        <header className="sticky top-0 z-[100] px-5 py-4 bg-black border-b border-white/5 flex items-center gap-4">
          <button onClick={() => setIziBlackStep("info")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-sm font-black uppercase tracking-widest">Pagamento</h1>
        </header>

        <main className="px-6 pt-12 space-y-10">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white leading-tight tracking-tighter">Quase lá!</h2>
            <p className="text-zinc-500 text-sm">Confirme seus dados para ativar os benefícios.</p>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Plano Mensal</p>
            <div className="bg-zinc-900/50 p-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="font-black text-white">Izi Black Individual</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Renovação automática</p>
              </div>
              <p className="font-black text-yellow-400">R$ 19,90/mês</p>
            </div>
          </div>

          <div className="space-y-6">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Documento (CPF)</p>
            <input 
              type="text" 
              inputMode="numeric" 
              value={cpf} 
              onChange={(e) => setCpf(e.target.value)}
              placeholder="000.000.000-00"
              className="w-full bg-transparent border-b border-zinc-900 py-4 text-white placeholder:text-zinc-800 focus:outline-none focus:border-yellow-500 focus:border-b-2 text-sm font-black tracking-widest transition-all" 
            />
          </div>

          <button 
            onClick={handleSubscribeReal} 
            disabled={isLoading}
            className="w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all disabled:opacity-30 text-zinc-900"
            style={{ backgroundColor: "#FBBF24" }}
          >
            {isLoading ? "Processando..." : "Ativar Assinatura Elite"}
          </button>
        </main>
      </div>
    );
  }

  const perks = [
    { id: 1, icon: "delivery_dining", title: "Taxa Zero Izi", desc: "Entrega gratuita em estabelecimentos selecionados.", yellow: true },
    { id: 2, icon: "confirmation_number", title: "Cupons Black", desc: "Acesso a cupons exclusivos de alto valor.", yellow: false },
    { id: 3, icon: "stars", title: "Cashback 5%", desc: "Receba parte do valor de volta em todos os pedidos.", yellow: false },
    { id: 4, icon: "bolt", title: "Prioridade Izi", desc: "Seus pedidos são preparados e entregues primeiro.", yellow: true },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-black text-white flex flex-col overflow-y-auto no-scrollbar pb-24">
      <header className="sticky top-0 z-[100] px-5 py-4 bg-black/60 backdrop-blur-xl border-b border-white/5 flex items-center gap-4">
        <button onClick={handleClose} className="size-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center active:scale-95 transition-all">
          <span className="material-symbols-outlined text-white">arrow_back</span>
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest">Clube <span className="text-yellow-400">Izi Black</span></h1>
      </header>

      <main className="max-w-xl mx-auto px-6 pt-12 space-y-10 w-full mb-10">
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="bg-zinc-900/80 rounded-3xl p-8 text-center relative overflow-visible shadow-2xl">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl">
              <span className="material-symbols-outlined text-black text-4xl font-black fill-1">diamond</span>
            </div>
            
            <div className="mt-10 space-y-3">
              <p className="text-[10px] text-zinc-500 font-extrabold tracking-[0.2em] uppercase">Economia total com o Clube</p>
              <div className="flex items-center justify-center gap-1">
                 <span className="text-xl font-black text-yellow-400 mb-4">R$</span>
                 <h2 className="font-black text-yellow-400 text-6xl tracking-tighter">76,50</h2>
              </div>
              <p className="text-zinc-400 text-[11px] px-4 font-medium leading-relaxed">Usuários que assinam o Clube economizam em média R$ 120 por mês.</p>
            </div>

            {!isIziBlackMembership ? (
              <button 
                onClick={() => setIziBlackStep("payment")}
                className="w-full mt-8 py-5 rounded-3xl bg-yellow-400 text-black font-black tracking-widest uppercase text-[11px] flex items-center justify-center gap-3 hover:opacity-90 active:scale-95 transition-all"
              >
                Quero entrar pro Clube
                <span className="material-symbols-outlined text-sm font-black">arrow_forward</span>
              </button>
            ) : (
              <div className="mt-8 py-5 rounded-3xl bg-yellow-400/20 text-yellow-400 flex items-center justify-center gap-3 border border-yellow-400/20">
                 <span className="material-symbols-outlined font-black fill-1">verified</span>
                 <span className="text-[11px] font-black uppercase tracking-widest">Assinatura Ativa</span>
              </div>
            )}
          </div>
        </motion.section>

        <section className="space-y-6">
          <div className="flex justify-between items-end px-1">
            <h3 className="font-black text-2xl tracking-tighter text-white">Benefícios do Clube</h3>
            <span className="text-yellow-400 font-black text-xs uppercase tracking-widest cursor-pointer">Ver tudo</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {perks.map((perk, idx) => (
              <motion.div 
                key={perk.id || `perk-${idx}`}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className={`${perk.yellow ? 'bg-yellow-400 text-black' : 'bg-zinc-900 border border-white/5 text-white'} rounded-3xl p-6 flex flex-col items-start justify-between min-h-[170px] overflow-hidden group relative shadow-xl`}
              >
                <div className="relative w-full">
                  <span className={`material-symbols-outlined ${perk.yellow ? 'text-black/30' : 'text-yellow-400/20'} text-6xl absolute -right-2 -top-2 transition-transform group-hover:scale-110 fill-1`}>
                    {perk.icon}
                  </span>
                </div>
                <div className="space-y-1.5 relative z-10">
                  <p className={`font-black text-base leading-tight tracking-tight`}>{perk.title}</p>
                  <p className={`text-[10px] font-bold leading-relaxed opacity-70`}>{perk.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <h3 className="font-black text-2xl tracking-tighter text-white">Assinaturas e Parcerias</h3>
          <motion.div whileTap={{ scale: 0.98 }} className="relative rounded-3xl overflow-hidden min-h-[180px] flex items-center group cursor-pointer">
            <img alt="Uber Partnership" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80&w=800" />
            <div className="absolute inset-0 bg-black/70 backdrop-blur-[1px]"></div>
            <div className="relative z-10 w-full p-6 flex justify-between items-center bg-zinc-900/40 backdrop-blur-md border border-white/10 m-4 rounded-3xl shadow-2xl">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-400 text-black font-black text-[9px] px-2 py-0.5 rounded uppercase tracking-tighter">CLUBE</span>
                  <span className="text-white font-black text-2xl tracking-tighter">+</span>
                  <span className="text-white font-black text-2xl tracking-tighter">Uber</span>
                </div>
                <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest">Vantagens exclusivas para suas viagens.</p>
              </div>
              <div className="size-10 rounded-full bg-yellow-400 flex items-center justify-center text-black shadow-lg">
                <span className="material-symbols-outlined font-black">chevron_right</span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
};
