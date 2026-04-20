import React, { useEffect, useRef } from 'react';
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    window.scrollTo(0, 0);
  }, []);

  return (
    <div 
      ref={scrollContainerRef}
      className="bg-black text-zinc-100 absolute inset-0 z-[120] flex flex-col hide-scrollbar overflow-y-auto pb-10"
    >
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
                className={`relative bg-zinc-900 border ${story.isRedeemed ? 'border-zinc-800 opacity-60' : story.isMaster ? 'border-yellow-400/30' : 'border-white/10'} rounded-[48px] p-8 flex items-center gap-6 cursor-pointer group hover:bg-zinc-850 transition-all shadow-[12px_12px_25px_rgba(0,0,0,0.5),inset_4px_4px_10px_rgba(255,255,255,0.03),inset_-4px_-4px_10px_rgba(0,0,0,0.6)] overflow-hidden mb-4`}
              >
                {/* Glossy Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                
                <div className="relative size-28 rounded-[32px] overflow-hidden shrink-0 border border-white/10 shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.1)] bg-black">
                   <img src={story.img} className={`size-full object-cover group-hover:scale-125 transition-transform duration-[1500ms] ${story.isRedeemed ? 'grayscale opacity-50' : ''}`} alt={story.name} />
                </div>
                
                <div className="flex-1 min-w-0 relative z-10">
                   <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest truncate max-w-[120px] italic">{story.merchant}</span>
                       <div className="size-1 rounded-full bg-zinc-700" />
                       <div className="bg-white/5 px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/5">
                          <span className="material-symbols-outlined text-[10px] text-zinc-500">schedule</span> 
                          <span className="text-[8px] font-bold text-zinc-500 uppercase">{story.timeLeft}</span>
                       </div>
                   </div>
                   
                   <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none truncate mb-4 group-hover:text-yellow-400 transition-colors uppercase">{story.name}</h3>
                   
                   <div className="flex items-center gap-3">
                       <div className="bg-yellow-400 px-4 py-1.5 rounded-2xl shadow-[4px_4px_8px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5)]">
                          <span className="text-xl font-black text-black italic tracking-tighter">R$ {story.finalPrice}</span>
                       </div>
                       {story.originalPrice && (
                         <span className="text-xs text-zinc-600 line-through font-bold">R$ {story.originalPrice}</span>
                       )}
                   </div>
                </div>

                <div className={`size-14 rounded-3xl ${story.isRedeemed ? 'bg-zinc-800 shadow-inner' : 'bg-yellow-400 shadow-[4px_4px_10px_rgba(0,0,0,0.3),inset_2px_2px_4px_rgba(255,255,255,0.5)]'} flex items-center justify-center group-hover:scale-110 transition-all duration-500`}>
                     <span className={`material-symbols-outlined font-black text-2xl ${story.isRedeemed ? 'text-zinc-600' : 'text-black'}`}>{story.isRedeemed ? 'check' : 'bolt'}</span>
                </div>

                {story.isMaster && !story.isRedeemed && (
                    <div className="absolute top-4 right-4 bg-yellow-400 text-black text-[8px] font-black px-3 py-1 rounded-xl uppercase tracking-widest shadow-xl border border-black/10">
                        MASTER
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
