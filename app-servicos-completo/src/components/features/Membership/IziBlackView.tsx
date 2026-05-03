import { motion, AnimatePresence } from "framer-motion";
import { useState, Fragment } from "react";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const IziBlackView = () => {
  const { 
    setSubView, 
    isIziBlackMembership, 
    iziCoins, 
    globalSettings, 
    myOrders, 
    iziCashbackEarned 
  } = useApp();

  const [activePerkDetail, setActivePerkDetail] = useState<string | null>(null);
  const [showMasterPerks, setShowMasterPerks] = useState(false);

  const perks = [
    { id: 'frete',    label: 'Frete Grátis', icon: 'local_shipping', active: true },
    { id: 'cashback', label: 'Cashback 5%',  icon: 'monetization_on', active: true },
    { id: 'priority', label: 'Prioridade',    icon: 'bolt',           active: isIziBlackMembership },
    { id: 'surprise', label: 'Izi Surprise', icon: 'card_giftcard',   active: isIziBlackMembership },
  ];

  if (showMasterPerks) {
    const masterPerks = [
      { icon: "delivery_dining",    title: "Taxa Zero",          desc: "Entrega grátis em toda a cidade, sem limite de pedidos" },
      { icon: "bolt",              title: "Prioridade Máxima",  desc: "Seus pedidos são processados primeiro, sempre" },
      { icon: "workspace_premium", title: "Suporte VIP 24/7",   desc: "Atendimento exclusivo via canal prioritário" },
      { icon: "confirmation_number", title: "Cupons Exclusivos", desc: "Ofertas e descontos só para membros Black" },
      { icon: "stars",             title: "Cashback Duplo",     desc: "2x mais pontos em todos os pedidos" },
      { icon: "qr_code_scanner",   title: "Acesso Antecipado",  desc: "Novidades e lançamentos antes de todos" },
    ];

    return (
      <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
        <header className="sticky top-0 z-50 bg-black flex items-center justify-between px-5 py-4 border-b border-zinc-900">
          <button onClick={() => setShowMasterPerks(false)} className="size-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center active:scale-90 transition-all">
            <span className="material-symbols-outlined text-zinc-100">arrow_back</span>
          </button>
          <h1 className="font-extrabold text-base text-white uppercase tracking-tight">IZI Black</h1>
          <div className="size-10" />
        </header>

        <main className="px-5 py-8 space-y-10">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em]">Privilégio Elite</p>
            <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tighter">O melhor do<br/>ecossistema IZI.</h2>
            <p className="text-zinc-600 text-sm">Acesso completo a todos os benefícios premium da plataforma.</p>
          </div>

          <button 
            onClick={() => setSubView("izi_black_purchase")}
            className="w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all"
            style={{ background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)", color: "#000", boxShadow: "0 0 30px rgba(255,215,9,0.15)" }}>
            Assinar IZI Black
          </button>

          <div>
            <h3 className="font-extrabold text-base text-white uppercase tracking-tight mb-2">O que está incluso</h3>
            <div className="flex flex-col">
              {masterPerks.map((p, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-4 py-4 border-b border-zinc-900/60 last:border-0">
                  <span className="material-symbols-outlined text-yellow-400 text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  <div>
                    <p className="font-black text-sm text-white">{p.title}</p>
                    <p className="text-zinc-600 text-xs mt-0.5">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSubView("none")} className="size-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" size={20} />
          </motion.button>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase">Sua Área Black</h1>
        </div>
        <div className="size-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20">
           <Icon name="military_tech" size={20} />
        </div>
      </header>

      <main className="px-6 py-8 space-y-10">
        {/* IziCoin Card */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="relative bg-zinc-900 rounded-[45px] p-10 overflow-hidden text-center shadow-2xl border border-white/5"
        >
          <div className="absolute top-0 left-0 p-8 opacity-5">
            <Icon name="monetization_on" size={100} />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="size-1.5 rounded-full bg-yellow-400 shadow-[0_0_8px_white]" />
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.4em]">IziCoin Balance</p>
            </div>
            <h2 className="text-7xl font-black text-white tabular-nums tracking-tighter leading-none mb-4">
              {iziCoins < 1 ? iziCoins.toFixed(8).replace(".", ",") : iziCoins.toLocaleString('pt-BR')}
            </h2>
            <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
              Acumule {globalSettings?.izi_coin_rate || 1} coins a cada R$ 1,00 gasto
            </div>
          </div>
        </motion.section>

        {/* Global Stats */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="grid grid-cols-3 gap-6 bg-white/5 rounded-[40px] p-8 border border-white/5 shadow-2xl">
          {[
            { value: myOrders?.length || 0, label: 'Pedidos', icon: 'package' },
            { value: `R$${iziCashbackEarned?.toFixed(0) || '0'}`, label: 'Cashback', icon: 'monetization_on' },
            { value: `R$${((myOrders?.length || 0) * 5).toFixed(0)}`, label: 'Economia', icon: 'shield' },
          ].map((stat, i) => (
            <div key={i} className="text-center space-y-2 group">
              <div className="size-10 rounded-2xl bg-white/5 flex items-center justify-center mx-auto text-yellow-400 group-hover:scale-110 transition-all border border-white/5">
                 <Icon name={stat.icon} size={18} />
              </div>
              <div>
                 <p className="text-lg font-black text-white tracking-tight leading-none">{stat.value}</p>
                 <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.section>

        {/* Perks Section */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-8">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em] leading-none">Vantagens de Membro</h3>
             <span className="text-[9px] font-black text-yellow-400/40 uppercase tracking-widest">Protocolo Ativado</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 pr-10">
            {perks.map((perk, i) => (
              <motion.div 
                 key={i} 
                 initial={{ opacity: 0, x: 20 }} 
                 animate={{ opacity: perk.active ? 1 : 0.2, x: 0 }} 
                 transition={{ delay: 0.9 + i * 0.05 }} 
                 whileTap={{ scale: 0.95 }} 
                 onClick={() => perk.active && perk.id ? setActivePerkDetail(activePerkDetail === perk.id ? null : perk.id) : null}
                 className={`shrink-0 flex items-center gap-4 py-4 px-8 rounded-[30px] border transition-all cursor-pointer ${
                   activePerkDetail === perk.id 
                     ? 'bg-yellow-400/10 border-yellow-400/30 shadow-lg shadow-primary/10' 
                     : perk.active ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5'
                 }`}
              >
                 <div className={`${perk.active ? 'text-yellow-400' : 'text-white/10'}`}>
                    <Icon name={perk.icon} size={22} />
                 </div>
                 <div className="text-left">
                    <p className={`text-[11px] font-black uppercase tracking-tight whitespace-nowrap ${perk.active ? 'text-white' : 'text-white/10'}`}>{perk.label}</p>
                    {perk.active && perk.id && (
                      <div className="flex items-center gap-1 mt-0.5 opacity-20 group-hover:opacity-100 transition-opacity">
                         <p className="text-[8px] font-black uppercase tracking-widest text-white/80">Detalhes</p>
                         <Icon name={activePerkDetail === perk.id ? 'expand_less' : 'expand_more'} size={10} />
                      </div>
                    )}
                 </div>
                 {!perk.active && <Icon name="shield" size={14} className="text-white/10" />}
              </motion.div>
            ))}
          </div>

          {/* Expandable Details */}
          <AnimatePresence mode="wait">
            {activePerkDetail && (
              <motion.div
                key={activePerkDetail}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden bg-white/5 rounded-[40px] border border-white/10 mx-2"
              >
                <div className="p-8">
                  {activePerkDetail === 'frete' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                         <div className="size-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                           <Icon name="local_shipping" size={20} />
                         </div>
                         <h4 className="text-[13px] font-black text-white uppercase tracking-tighter">Frete Grátis Ativado</h4>
                      </div>
                      <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">Você possui frete grátis ilimitado em todos os pedidos acima de R$ 50,00. O benefício é aplicado automaticamente no seu checkout.</p>
                    </div>
                  )}

                  {activePerkDetail === 'cashback' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                         <div className="size-10 rounded-2xl bg-yellow-400/10 flex items-center justify-center text-yellow-400">
                           <Icon name="monetization_on" size={20} />
                         </div>
                         <h4 className="text-[13px] font-black text-white uppercase tracking-tighter">Cashback Elite</h4>
                      </div>
                      <div className="bg-black/40 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
                         <div>
                            <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mb-1">Acumulado</p>
                            <p className="text-3xl font-black text-white tracking-tighter">R$ {iziCashbackEarned.toFixed(2)}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] text-yellow-400 font-black uppercase tracking-widest leading-none">5% OFF</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isIziBlackMembership ? 'text-yellow-400' : 'text-white/10'}`}>
                              {isIziBlackMembership ? 'Sempre ativo' : 'Disponível no Izi Black'}
                            </p>
                         </div>
                      </div>
                    </div>
                  )}

                  {activePerkDetail === 'surprise' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 mb-2">
                         <div className="size-10 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400">
                           <Icon name="card_giftcard" size={20} />
                         </div>
                         <h4 className="text-[13px] font-black text-white uppercase tracking-tighter">Izi Surprise</h4>
                      </div>
                      <p className="text-[11px] text-white/40 font-bold leading-relaxed px-2">Como membro nível 3, você recebe mimos exclusivos todos os meses. Fique atento às suas notificações!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        <div className="mx-7 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Integration Links */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="py-10 px-7 space-y-2">
          {[
            { icon: 'military_tech', title: 'Izi Battle Pass', sub: 'Missões e Ranking Global', action: () => setSubView("quest_center"), active: true },
            { icon: 'workspace_premium', title: 'Próximas Recompensas', sub: 'O que vem por aí', action: () => setShowMasterPerks(true), active: true },
          ].map((item, i) => (
            <Fragment key={i}>
              <motion.div whileTap={{ scale: 0.98 }} onClick={item.action} className="flex items-center justify-between py-6 px-6 rounded-[32px] bg-white/[0.03] border border-white/5 cursor-pointer group hover:bg-white/[0.05] transition-all">
                <div className="flex items-center gap-5">
                  <div className="size-12 rounded-2xl bg-yellow-400/[0.08] flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-all shadow-lg border border-primary/10">
                    <Icon name={item.icon} size={24} />
                  </div>
                  <div>
                    <h4 className="text-[14px] font-black text-white tracking-tight leading-none mb-1.5">{item.title}</h4>
                    <p className="text-[9px] text-white/20 font-black uppercase tracking-[0.2em]">{item.sub}</p>
                  </div>
                </div>
                <div className="size-10 rounded-full flex items-center justify-center text-white/20 group-hover:text-yellow-400 transition-colors">
                   <Icon name="arrow_forward" size={16} />
                </div>
              </motion.div>
            </Fragment>
          ))}
        </motion.section>

        <div className="text-center pt-8 pb-4">
          <p className="text-[8px] font-black text-white/[0.06] uppercase tracking-[0.5em]">Izi Black • Membro Fundador desde 2024</p>
        </div>
      </main>
    </div>
  );
};
