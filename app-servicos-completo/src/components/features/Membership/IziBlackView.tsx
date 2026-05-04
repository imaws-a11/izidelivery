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
    myOrders,
    iziCashbackEarned
  } = useApp();

  const [activePerkDetail, setActivePerkDetail] = useState<string | null>(null);

  // Benefícios para quem JÁ É membro
  const activePerks = [
    { id: 'frete', label: 'Frete Grátis', icon: 'local_shipping', active: true, desc: `Frete grátis ilimitado em pedidos acima de R$ ${appSettings?.izi_black_min_order_free_shipping || '30,00'}.` },
    { id: 'cashback', label: 'Cashback ' + (appSettings?.izi_black_cashback || '1') + '%', icon: 'monetization_on', active: true, desc: `Receba ${appSettings?.izi_black_cashback || '1'}% de volta em IZI Coins em cada compra.` },
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
          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.history.back()} className="size-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
              <Icon name="arrow_back" size={20} />
            </motion.button>
            <h1 className="text-lg font-black tracking-tighter text-white uppercase">Clube Izi Black</h1>
          </div>
          <div className="size-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 border border-yellow-400/20">
            <Icon name="military_tech" size={20} />
          </div>
        </header>

        <main className="px-6 py-10 space-y-12">
          {/* Hero Section */}
          <div className="space-y-4 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-block px-4 py-1.5 rounded-full bg-yellow-400/10 border border-yellow-400/20 text-[10px] font-black text-yellow-400 uppercase tracking-[0.3em] mb-2"
            >
              Privilégio Elite
            </motion.div>
            <h2 className="text-4xl font-black text-white leading-[0.9] tracking-tighter">
              Eleve sua <br />
              <span className="text-yellow-400 italic">experiência.</span>
            </h2>
            <p className="text-zinc-500 text-sm font-medium px-4">
              O ecossistema IZI completo com benefícios exclusivos por apenas R$ {appSettings?.izi_black_fee || '19,90'}/mês.
            </p>
          </div>

          {/* CTA Principal */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSubView("izi_black_purchase")}
            className="w-full py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden group"
            style={{
              background: "linear-gradient(135deg, #ffd709 0%, #efc900 100%)",
              color: "#000"
            }}
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <span className="relative z-10 flex items-center justify-center gap-3">
              Assinar IZI Black
              <Icon name="arrow_forward" size={18} />
            </span>
          </motion.button>

          {/* Benefits Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">Protocolos Premium</h3>
              <div className="size-2 rounded-full bg-yellow-400 animate-pulse shadow-[0_0_10px_#fbbf24]" />
            </div>

            <div className="grid grid-cols-1 gap-4">
              {masterPerks.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-zinc-900/40 border border-white/[0.03] rounded-[32px] p-6 flex items-center gap-5 group hover:bg-zinc-900/60 transition-all"
                >
                  <div className="size-14 rounded-2xl bg-white/[0.03] flex items-center justify-center text-yellow-400 group-hover:scale-110 transition-transform border border-white/[0.05]">
                    <Icon name={p.icon} size={28} />
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-sm text-white tracking-tight">{p.title}</p>
                    <p className="text-zinc-600 text-[11px] font-medium leading-tight mt-1">{p.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Savings Social Proof */}
          <div className="bg-white/[0.02] border border-white/[0.05] rounded-[40px] p-8 text-center space-y-4">
            <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-widest">Economia Média de Membros</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-yellow-400 font-black text-2xl">R$</span>
              <span className="text-6xl font-black text-white tracking-tighter">142</span>
              <span className="text-zinc-500 font-black text-lg">/mês</span>
            </div>
            <p className="text-[10px] text-zinc-600 font-medium">Baseado no uso médio de frete grátis e cashback.</p>
          </div>
        </main>
      </div>
    );
  }

  // RENDER: Dashboard (É membro)
  return (
    <div className="absolute inset-0 z-40 bg-black text-zinc-100 flex flex-col overflow-y-auto no-scrollbar pb-32">
      <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-between px-6 py-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.history.back()} className="size-10 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center">
            <Icon name="arrow_back" size={20} />
          </motion.button>
          <h1 className="text-lg font-black tracking-tighter text-white uppercase italic">Elite Black</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[8px] font-black text-yellow-400 uppercase tracking-widest leading-none">Membro Fundador</p>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-tighter mt-1">Status Ativo</p>
          </div>
          <div className="size-10 rounded-xl bg-yellow-400 flex items-center justify-center text-black border border-yellow-400/20 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
            <Icon name="military_tech" size={24} />
          </div>
        </div>
      </header>

      <main className="px-6 py-8 space-y-10">
        {/* IziCoin Card */}
        <motion.section
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative bg-zinc-950 rounded-[50px] p-10 overflow-hidden text-center shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/[0.03]"
        >
          <div className="absolute top-0 right-0 p-12 opacity-[0.03] rotate-12">
            <Icon name="monetization_on" size={150} />
          </div>

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="size-2 rounded-full bg-yellow-400 shadow-[0_0_15px_#fbbf24]" />
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.5em]">Saldo IziCoins</p>
            </div>

            <h2 className="text-7xl font-black text-white tabular-nums tracking-tighter leading-none mb-4">
              {iziCoins < 1 ? iziCoins.toFixed(8).replace(".", ",") : iziCoins.toLocaleString('pt-BR')}
            </h2>

            <div className="flex flex-col items-center gap-3 pt-4">
              <div className="px-6 py-2 rounded-full bg-white/5 border border-white/5 text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">
                {globalSettings?.izi_coin_rate || 5} coins a cada R$ 1,00 gasto
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setSubView("wallet")}
                className="text-[10px] font-black text-yellow-400 uppercase tracking-widest hover:underline"
              >
                Gerenciar Carteira
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* Member Stats Grid */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="grid grid-cols-3 gap-4">
          {[
            { value: myOrders?.length || 0, label: 'Pedidos', icon: 'shopping_bag' },
            { value: `R$${iziCashbackEarned?.toFixed(0) || '0'}`, label: 'Cashback', icon: 'history_edu' },
            { value: `R$${((myOrders?.length || 0) * 8.5).toFixed(0)}`, label: 'Economia', icon: 'savings' },
          ].map((stat, i) => (
            <div key={i} className="bg-zinc-900/50 border border-white/[0.03] rounded-[32px] p-6 text-center space-y-2 group hover:bg-zinc-900 transition-all">
              <div className="size-10 rounded-2xl bg-white/[0.03] flex items-center justify-center mx-auto text-yellow-400 group-hover:scale-110 transition-transform border border-white/[0.05]">
                <Icon name={stat.icon} size={18} />
              </div>
              <div>
                <p className="text-xl font-black text-white tracking-tight leading-none">{stat.value}</p>
                <p className="text-[8px] font-black text-white/20 uppercase tracking-widest mt-1.5">{stat.label}</p>
              </div>
            </div>
          ))}
        </motion.section>

        {/* Active Perks List */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-white/20 uppercase tracking-[0.4em]">Benefícios Ativos</h3>
            <span className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Protocolo Seguro</span>
            </span>
          </div>

          <div className="space-y-3">
            {activePerks.map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                onClick={() => setActivePerkDetail(activePerkDetail === perk.id ? null : perk.id)}
                className={`flex flex-col rounded-[32px] border transition-all cursor-pointer overflow-hidden ${activePerkDetail === perk.id
                    ? 'bg-yellow-400/5 border-yellow-400/20'
                    : 'bg-zinc-900/40 border-white/[0.03]'
                  }`}
              >
                <div className="flex items-center gap-5 p-6">
                  <div className={`size-12 rounded-2xl flex items-center justify-center ${activePerkDetail === perk.id ? 'bg-yellow-400 text-black' : 'bg-white/[0.03] text-yellow-400'}`}>
                    <Icon name={perk.icon} size={22} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-white uppercase tracking-tight">{perk.label}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Benefício Ilimitado</p>
                  </div>
                  <Icon name={activePerkDetail === perk.id ? 'expand_less' : 'expand_more'} size={20} className="text-white/20" />
                </div>

                <AnimatePresence>
                  {activePerkDetail === perk.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-6"
                    >
                      <div className="pt-2 border-t border-white/[0.03]">
                        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                          {perk.desc}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick Actions / Integration */}
        <div className="pt-4 space-y-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setSubView("quest_center")}
            className="w-full py-6 rounded-[35px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-between px-8 group hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-center gap-5">
              <div className="size-12 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <Icon name="military_tech" size={24} />
              </div>
              <div className="text-left">
                <p className="font-black text-sm text-white">Izi Battle Pass</p>
                <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Missões e Ranking Global</p>
              </div>
            </div>
            <Icon name="chevron_right" size={20} className="text-white/20" />
          </motion.button>
        </div>

        <div className="text-center pt-8 opacity-20">
          <p className="text-[8px] font-black text-white uppercase tracking-[0.8em]">Exclusive Elite Access • Izi Black</p>
        </div>
      </main>
    </div>
  );
};
