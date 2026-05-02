import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { DigitalTimer } from '../common/DigitalTimer';

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
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      ref={scrollContainerRef}
      className="bg-white absolute inset-0 z-[120] flex flex-col hide-scrollbar overflow-y-auto pb-10"
    >
      {/* HEADER TRANSPARENTE SEM FUNDO */}
      <header className="absolute top-0 left-0 right-0 z-[130] p-6 flex items-center gap-6 pointer-events-none">
         <button 
          onClick={() => setSubView("none")}
          className="size-12 rounded-2xl bg-black/5 border border-black/5 flex items-center justify-center text-black active:scale-90 transition-all pointer-events-auto"
        >
          <span className="material-symbols-rounded text-xl">arrow_back_ios_new</span>
        </button>
      </header>

      <main className="flex-1 space-y-8">
        {/* HERO BANNER - DESIGN CLEAN */}
        <div className="relative h-64 overflow-hidden">
           <div className="absolute inset-0 bg-yellow-400">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 opacity-50" />
           </div>
           <div className="absolute bottom-10 left-8 right-8 z-10">
              <h1 className="text-4xl font-black text-black uppercase tracking-tighter leading-none mb-2">Izi Flash</h1>
              <p className="text-[10px] text-black/60 font-black uppercase tracking-[0.2em]">Ofertas Relâmpago Ativas Agora</p>
           </div>
           <span className="absolute -right-8 -bottom-8 material-symbols-rounded text-[180px] text-black/5 rotate-12">bolt</span>
        </div>

        {/* Grid de Ofertas */}
        <div className="px-6 grid grid-cols-1 gap-8">
          {activeStories.length > 0 ? (
            activeStories.map((story, i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                key={story.id || i}
                onClick={() => {
                  if (!story.isOpen) showToast(`Esta loja (${story.merchant}) está fechada no momento. 🕒`, "error");
                  else if (story.isRedeemed) showToast("Você já aproveitou esta oferta!", "info");
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
                className={`relative bg-zinc-50 border ${story.isRedeemed ? 'opacity-50 grayscale' : 'border-zinc-100'} rounded-[40px] p-8 flex items-center gap-6 cursor-pointer group active:scale-[0.97] transition-all shadow-sm hover:shadow-xl hover:shadow-zinc-100 overflow-hidden`}
              >
                <div className="relative size-28 rounded-3xl overflow-hidden shrink-0 shadow-lg border border-white">
                   <img src={story.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={story.name} />
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-2">
                       <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest truncate max-w-[120px]">{story.merchant}</span>
                       <div className="size-1 rounded-full bg-zinc-200" />
                       {/* Timer sem fundo extra */}
                       <DigitalTimer targetDate={story.offer.expires_at} size="sm" variant="light" />
                   </div>
                   
                   <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter leading-tight truncate mb-3 group-hover:text-yellow-600 transition-colors">{story.name}</h3>
                   
                   <div className="flex items-center gap-3">
                       <div className="bg-yellow-400 px-4 py-1.5 rounded-2xl shadow-sm">
                          <span className="text-xl font-black text-black tracking-tighter leading-none">R$ {story.finalPrice}</span>
                       </div>
                       {story.originalPrice && (
                         <span className="text-xs text-zinc-400 line-through font-bold">R$ {story.originalPrice}</span>
                       )}
                   </div>
                </div>

                <div className={`size-14 rounded-3xl ${story.isRedeemed ? 'bg-zinc-200' : 'bg-black'} flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-lg`}>
                     <span className={`material-symbols-rounded font-black text-2xl ${story.isRedeemed ? 'text-zinc-400' : 'text-yellow-400'}`}>{story.isRedeemed ? 'check' : 'bolt'}</span>
                </div>

                {story.isMaster && !story.isRedeemed && (
                    <div className="absolute top-6 right-6 bg-black text-yellow-400 text-[8px] font-black px-3 py-1 rounded-xl uppercase tracking-widest">
                        MASTER
                    </div>
                )}
              </motion.div>
            ))
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                <span className="material-symbols-rounded text-zinc-200 text-8xl">bolt_slash</span>
                <p className="text-zinc-400 font-black uppercase tracking-widest text-sm">Sem ofertas relâmpago no momento</p>
                <button 
                  onClick={() => setSubView("none")}
                  className="px-10 h-14 bg-zinc-100 rounded-2xl text-zinc-500 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                >
                  Voltar para Início
                </button>
            </div>
          )}
        </div>
      </main>
    </motion.div>
  );
};
