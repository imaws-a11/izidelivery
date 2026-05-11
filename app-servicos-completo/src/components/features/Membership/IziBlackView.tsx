import { motion, AnimatePresence } from "framer-motion";
import { useState, Fragment } from "react";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const IziBlackView = () => {
  const {
    setSubView,
    navigateSubView,
    isIziBlackMembership,
    iziCoins,
    globalSettings,
    appSettings,
    orders,
    iziCashbackEarned,
    userXP
  } = useApp();

  const [activePerkDetail, setActivePerkDetail] = useState<string | null>(null);
  const userLevel = Math.max(1, Math.floor((userXP || 0) / 100));

  // Benefícios para quem JÁ É membro
  const activePerks = [
    { id: 'frete', label: 'Frete Grátis', icon: 'local_shipping', active: true, desc: `Frete grátis ilimitado em pedidos acima de R$ ${appSettings?.izi_black_min_order_free_shipping || '30,00'}.` },
    { id: 'cashback', label: 'Cashback ' + (appSettings?.izi_black_cashback || '1') + '%', icon: 'monetization_on', active: true, desc: `Receba ${appSettings?.izi_black_cashback || '1'}% de volta em saldo em cada compra.` },
    { id: 'priority', label: 'Prioridade', icon: 'bolt', active: true, desc: "Seus pedidos são priorizados na fila de preparo e entrega." },
    { id: 'surprise', label: 'Izi Surprise', icon: 'card_giftcard', active: true, desc: "Mimos e brindes exclusivos enviados aleatoriamente." },
  ];

  // Benefícios para quem AINDA NÃO É membro (Landing Page)
  const masterPerks = [
    { icon: "delivery_dining", title: "Taxa Zero Izi", desc: "Entrega gratuita em centenas de lojas da sua região." },
    { icon: "bolt", title: "Prioridade Máxima", desc: "Seus pedidos são processados primeiro, sempre." },
    { icon: "workspace_premium", title: "Suporte VIP 24/7", desc: "Atendimento exclusivo via canal prioritário no app." },
    { icon: "confirmation_number", title: "Cupons Exclusivos", desc: "Ofertas de alto valor liberadas apenas para membros." },
    { icon: "stars", title: "Cashback Turbinado", desc: `${appSettings?.izi_black_cashback || '1'}% de volta em todas as compras no ecossistema IZI.` },
    { icon: "qr_code_scanner", title: "Izi Surprise", desc: "Brindes e mimos surpresa enviados nos seus pedidos." },
  ];

  // RENDER: Landing Page (Não é membro)
  if (!isIziBlackMembership) {
    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-6 border-b border-white/5">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.history.back()} className="size-10 rounded-full border border-zinc-800 bg-black flex items-center justify-center">
            <Icon name="arrow_back" size={20} className="text-white" />
          </motion.button>
          <div className="flex items-center gap-2">
            <Icon name="diamond" size={16} className="text-yellow-500" />
            <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase mt-0.5">Izi Black</span>
          </div>
          <div className="size-10" />
        </header>

        <main className="flex-1">
          {/* Premium Hero */}
          <div className="pt-12 pb-16 px-6 flex flex-col items-center text-center relative">
             <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-yellow-500/10 rounded-full blur-[80px] pointer-events-none" />
             
             <h1 className="text-[44px] font-black text-white tracking-tighter leading-[0.9] mb-6 relative z-10">
                O ápice do <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">
                  ecossistema.
                </span>
             </h1>
             <p className="text-zinc-400 font-medium text-[13px] max-w-[280px] mx-auto leading-relaxed relative z-10">
                Acesso irrestrito a benefícios exclusivos, prioridade máxima e economia real todos os meses.
             </p>
          </div>

          {/* Economy Highlight */}
          <div className="mx-6 py-8 border-t border-b border-zinc-900 flex items-center justify-between">
             <div>
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Economia Média</p>
                <div className="flex items-baseline gap-1">
                   <span className="text-yellow-500 font-black text-xl">R$</span>
                   <span className="text-5xl font-black text-white tracking-tighter">120</span>
                   <span className="text-zinc-600 font-bold text-xs">/mês</span>
                </div>
             </div>
             <div className="w-px h-16 bg-zinc-900" />
             <div className="text-right">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-2">Assinatura</p>
                <div className="flex items-baseline justify-end gap-1">
                   <span className="text-zinc-500 font-black text-sm">R$</span>
                   <span className="text-3xl font-black text-zinc-300 tracking-tighter">{appSettings?.izi_black_fee || '9,90'}</span>
                </div>
             </div>
          </div>

          {/* Minimalist Benefits */}
          <div className="px-6 py-12 space-y-8">
             <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] text-center mb-8">
               Vantagens da Assinatura
             </p>
             
             {masterPerks.map((p, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-5 group"
                >
                   <div className="size-12 rounded-full border border-zinc-800 bg-zinc-900/30 flex items-center justify-center shrink-0 group-hover:border-yellow-500/50 group-hover:bg-yellow-500/10 transition-colors">
                      <Icon name={p.icon} size={20} className="text-zinc-400 group-hover:text-yellow-500 transition-colors" />
                   </div>
                   <div className="pt-1 border-b border-zinc-900 pb-8 flex-1">
                      <h3 className="text-base font-black text-white tracking-tight">{p.title}</h3>
                      <p className="text-[11px] text-zinc-500 font-bold leading-relaxed mt-1 pr-4">{p.desc}</p>
                   </div>
                </motion.div>
             ))}
          </div>
        </main>

        {/* Sticky Bottom CTA */}
        <div className="fixed bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black via-black/95 to-transparent z-50 pt-20">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubView("izi_black_purchase")}
            className="w-full py-5 rounded-2xl bg-yellow-500 text-black font-black text-[13px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(234,179,8,0.2)] relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10 flex items-center gap-2">
              Desbloquear IZI Black <Icon name="lock_open" size={18} />
            </span>
          </motion.button>
        </div>
      </div>
    );
  }

  // RENDER: Dashboard (É membro)
  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-6 border-b border-white/5">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.history.back()} className="size-10 rounded-full border border-zinc-800 bg-black flex items-center justify-center">
          <Icon name="arrow_back" size={20} className="text-white" />
        </motion.button>
        <div className="flex items-center gap-2">
          <Icon name="diamond" size={16} className="text-yellow-500" />
          <span className="text-[10px] font-black tracking-[0.3em] text-white uppercase mt-0.5">Membro Black</span>
        </div>
        <div className="size-10 flex items-center justify-center">
           <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
        </div>
      </header>

      <main className="px-6 py-10 space-y-12">
        {/* IziCoin Section - No Card */}
        <section className="text-center relative py-4">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />
           
           <div className="flex items-center justify-center gap-3 mb-4">
              <Icon name="monetization_on" size={20} className="text-yellow-500" />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Saldo IziCoins</p>
           </div>

           <h2 className="text-[64px] font-black text-white tabular-nums tracking-tighter leading-none mb-6">
             {iziCoins < 1 ? iziCoins.toFixed(8).replace(".", ",") : iziCoins.toLocaleString('pt-BR')}
           </h2>

           <div className="flex flex-col items-center gap-4">
              <div className="px-4 py-1.5 rounded-full border border-zinc-900 bg-zinc-950/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                1 coin vale R$ {Number(globalSettings?.izi_coin_value || 1).toFixed(2).replace('.', ',')}
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSubView("wallet")}
                className="text-[11px] font-black text-yellow-500 uppercase tracking-[0.2em] underline decoration-yellow-500/30 underline-offset-8"
              >
                Gerenciar Carteira
              </motion.button>
           </div>
        </section>

        {/* Member Stats - No Boxes */}
        <section className="py-8 border-t border-b border-zinc-900 grid grid-cols-3 divide-x divide-zinc-900">
          {[
            { value: orders?.length || 0, label: 'Pedidos', icon: 'shopping_bag' },
            { value: `R$${iziCashbackEarned?.toFixed(0) || '0'}`, label: 'Cashback', icon: 'history_edu' },
            { value: `R$${((orders?.length || 0) * 8.5).toFixed(0)}`, label: 'Economia', icon: 'savings' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center justify-center text-center px-2">
              <Icon name={stat.icon} size={18} className="text-zinc-600 mb-3" />
              <p className="text-2xl font-black text-white tracking-tighter leading-none">{stat.value}</p>
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-2">{stat.label}</p>
            </div>
          ))}
        </section>

        {/* Active Perks - List Style */}
        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Benefícios Ativos</h3>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Plano Mensal</span>
          </div>

          <div className="space-y-2">
            {activePerks.map((perk, i) => (
              <div key={i} className="border-b border-zinc-950 last:border-0">
                <motion.div
                  onClick={() => setActivePerkDetail(activePerkDetail === perk.id ? null : perk.id)}
                  className="flex items-center gap-5 py-6 cursor-pointer group"
                >
                  <div className={`size-12 rounded-full border flex items-center justify-center transition-all ${activePerkDetail === perk.id ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-zinc-900 bg-transparent text-zinc-500 group-hover:border-zinc-700'}`}>
                    <Icon name={perk.icon} size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-black text-white tracking-tight">{perk.label}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Acesso Ilimitado</p>
                  </div>
                  <Icon name={activePerkDetail === perk.id ? 'remove' : 'add'} size={20} className={activePerkDetail === perk.id ? 'text-yellow-500' : 'text-zinc-800'} />
                </motion.div>

                <AnimatePresence>
                  {activePerkDetail === perk.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pb-8 pl-[68px] pr-4">
                        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                          {perk.desc}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Premium Integration */}
        <div className="pt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSubView("quest_center")}
            className="w-full p-8 rounded-[32px] border border-zinc-900 bg-zinc-950/30 flex items-center justify-between group hover:border-yellow-500/20 transition-all"
          >
            <div className="flex items-center gap-6">
              <div className="size-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-500">
                <Icon name="military_tech" size={28} />
              </div>
              <div className="text-left">
                <p className="font-black text-lg text-white tracking-tight">Izi Battle Pass</p>
                <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em] mt-1">Nível {userLevel} • Missões Ativas</p>
              </div>
            </div>
            <Icon name="chevron_right" size={24} className="text-zinc-800 group-hover:text-yellow-500 transition-colors" />
          </motion.button>
        </div>

        <div className="text-center py-12">
          <p className="text-[8px] font-black text-zinc-800 uppercase tracking-[1em]">Exclusive Member • Izi Black</p>
        </div>
      </main>
    </div>
  );
};
