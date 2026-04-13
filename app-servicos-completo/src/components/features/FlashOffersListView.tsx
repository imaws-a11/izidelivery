import React from 'react';
import { motion } from 'framer-motion';

interface FlashOffersListViewProps {
  activeStories: any[];
  setSubView: (view: any) => void;
  navigateSubView: (view: any) => void;
  setSelectedItem: (item: any) => void;
  userLevel: number;
  showToast: (msg: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  setShowMasterPerks: (val: boolean) => void;
}

export const FlashOffersListView: React.FC<FlashOffersListViewProps> = ({
  activeStories,
  setSubView,
  navigateSubView,
  setSelectedItem,
  userLevel,
  showToast,
  setShowMasterPerks
}) => {
  return (
    <div className="bg-black text-zinc-100 absolute inset-0 z-[120] flex flex-col hide-scrollbar overflow-y-auto pb-32">
      {/* HEADER PREMIUM */}
      <header className="sticky top-0 z-[130] bg-black/80 backdrop-blur-2xl border-b border-white/5 p-6 flex items-center gap-6">
         <button 
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all shadow-2xl"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tighter leading-none mb-1 uppercase italic">Izi Flash</h1>
          <div className="flex items-center gap-2">
            <div className="size-1.5 rounded-full bg-yellow-400 animate-pulse" />
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">Ofertas Relâmpago Ativas</p>
          </div>
        </div>
        <div className="size-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
             <span className="material-symbols-outlined text-yellow-500 fill-1">bolt</span>
        </div>
      </header>

      <main className="p-6 space-y-6">
        {/* Banner Informativo */}
        <div className="bg-gradient-to-br from-yellow-400 to-amber-600 rounded-[40px] p-8 relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
                <h2 className="text-3xl font-black text-black leading-none uppercase italic tracking-tighter mb-2">Aproveite Agora</h2>
                <p className="text-black/70 text-xs font-bold uppercase tracking-wider">Estas ofertas desaparecem em pouco tempo!</p>
            </div>
            <span className="absolute -right-4 -bottom-4 material-symbols-outlined text-[120px] text-black/10 rotate-12 scale-150">bolt</span>
        </div>

        {/* Grid de Ofertas */}
        <div className="grid grid-cols-1 gap-6">
          {activeStories.length > 0 ? (
            activeStories.map((story, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                key={story.id}
                onClick={() => {
                  if (story.isRedeemed) showToast("Você já aproveitou esta oferta!", "info");
                  else if (story.isMaster && userLevel < 10) showToast("Esta oferta é exclusiva para membros Tier MASTER.", "info");
                  else if (story.isMaster) setShowMasterPerks(true);
                  else {
                    const fakeItem = {
                      id: story.offer.product_id || story.offer.id,
                      name: story.offer.product_name || "Oferta Izi Flash",
                      desc: (story.offer.description || "Oferta imperdível por tempo limitado!") + `\n\n📌 Vendido por: ${story.merchant}`,
                      price: Number(story.offer.discounted_price),
                      oldPrice: Number(story.offer.original_price),
                      img: story.img,
                      merchant_id: story.offer.merchant_id,
                      merchant_name: story.merchant,
                      is_flash_offer: true,
                      flash_offer_id: story.offer.id,
                      expires_at: story.offer.expires_at,
                      off: story.offer.original_price && story.offer.discounted_price
                        ? `- R$ ${(Number(story.offer.original_price) - Number(story.offer.discounted_price)).toFixed(2).replace('.', ',')} OFF`
                        : `- R$ ${(Number(story.offer.original_price) * (Number(story.offer.discount_percent) / 100)).toFixed(2).replace('.', ',')} OFF`
                    };
                    setSelectedItem(fakeItem);
                    navigateSubView("exclusive_offer");
                  }
                }}
                className={`relative bg-zinc-900 border ${story.isRedeemed ? 'border-zinc-800 opacity-60' : story.isMaster ? 'border-yellow-400' : 'border-white/5'} rounded-[48px] p-6 flex items-center gap-6 cursor-pointer group hover:bg-zinc-800 transition-all shadow-2xl overflow-hidden`}
              >
                <div className="size-28 rounded-[36px] overflow-hidden shrink-0 border border-white/10 shadow-xl bg-black">
                   <img src={story.img} className={`size-full object-cover group-hover:scale-110 transition-transform duration-700 ${story.isRedeemed ? 'grayscale opacity-50' : ''}`} alt={story.name} />
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[9px] font-black text-yellow-400 uppercase tracking-widest truncate max-w-[120px]">{story.merchant}</span>
                      <div className="size-1 rounded-full bg-zinc-700" />
                      <span className="text-[9px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">schedule</span> {story.timeLeft}
                      </span>
                   </div>
                   
                   <h3 className="text-lg font-black text-white italic tracking-tighter uppercase leading-tight truncate mb-3">{story.name}</h3>
                   
                   <div className="flex items-baseline gap-2">
                       <span className="text-2xl font-black text-white italic tracking-tighter">R$ {story.finalPrice}</span>
                       {story.originalPrice && (
                         <span className="text-[10px] text-zinc-600 line-through font-bold">R$ {story.originalPrice}</span>
                       )}
                   </div>
                </div>

                <div className={`size-12 rounded-[24px] ${story.isRedeemed ? 'bg-zinc-800' : 'bg-yellow-400'} flex items-center justify-center shadow-xl shadow-yellow-400/10 group-hover:scale-110 transition-transform`}>
                     <span className={`material-symbols-outlined font-black ${story.isRedeemed ? 'text-zinc-500' : 'text-black'}`}>{story.isRedeemed ? 'check' : 'bolt'}</span>
                </div>

                {story.isMaster && !story.isRedeemed && (
                    <div className="absolute -top-3 left-10 bg-yellow-400 text-black text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-xl">
                        Exclusivo Master
                    </div>
                )}

                {story.isRedeemed && (
                    <div className="absolute -top-3 left-10 bg-zinc-800 text-zinc-400 text-[9px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-xl border border-white/5">
                        Resgatado
                    </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <span className="material-symbols-outlined text-zinc-800 text-8xl">bolt_slash</span>
                <p className="text-zinc-500 font-black uppercase tracking-widest text-sm">Sem ofertas relâmpago no momento</p>
                <button 
                  onClick={() => setSubView("none")}
                  className="px-8 py-3 bg-white/5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest border border-white/10"
                >
                  Voltar para Início
                </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
