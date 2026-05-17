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
    <div 
      ref={scrollContainerRef}
      className="bg-white h-full flex flex-col hide-scrollbar overflow-y-auto pb-10"
    >
      {/* HEADER BOTTOM SHEET */}
      <header className="shrink-0 p-6 pt-10 flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-black text-black uppercase tracking-tighter leading-none italic">Izi Flash</h1>
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-[0.2em] mt-1">Ofertas Relâmpago Ativas</p>
         </div>
         <button 
          onClick={() => setSubView("none")}
          className="size-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 active:scale-90 transition-all"
        >
          <span className="material-symbols-rounded text-xl">close</span>
        </button>
      </header>

      <main className="flex-1 space-y-8 pt-4">

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
                className={`relative ${story.isRedeemed ? 'opacity-60 grayscale bg-zinc-100/40' : 'bg-zinc-50/70 hover:bg-white/80'} border border-zinc-200/50 backdrop-blur-md rounded-[20px] p-6 flex items-center gap-5 cursor-pointer group active:scale-[0.97] transition-all overflow-hidden`}
              >
                <div className="relative size-28 rounded-3xl overflow-hidden shrink-0 shadow-lg border border-white">
                   <img src={story.img} className="size-full object-cover group-hover:scale-110 transition-transform duration-700" alt={story.name} />
                </div>
                
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                   <div>
                      <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black text-yellow-600 uppercase tracking-widest truncate max-w-[120px]">{story.merchant}</span>
                      </div>
                      
                      <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tighter leading-tight truncate mb-2 group-hover:text-yellow-600 transition-colors">{story.name}</h3>
                   </div>
                   
                   <div className="flex items-center gap-3 mb-3">
                       <div className="bg-yellow-400 px-4 py-1.5 rounded-2xl shadow-sm">
                          <span className="text-xl font-black text-black tracking-tighter leading-none">R$ {story.finalPrice}</span>
                       </div>
                       {story.originalPrice && (
                         <span className="text-xs text-zinc-400 line-through font-bold">R$ {story.originalPrice}</span>
                       )}
                   </div>

                   {story.offer.expires_at && (
                     <div className="w-full mt-1">
                       <DigitalTimer targetDate={story.offer.expires_at} createdDate={story.offer.created_at} size="sm" variant="izi-flash" />
                     </div>
                   )}
                </div>

                <div className={`size-14 rounded-3xl ${story.isRedeemed ? 'bg-zinc-200' : 'bg-black'} flex items-center justify-center group-hover:scale-110 transition-all duration-500 shadow-lg shrink-0`}>
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
    </div>
  );
};
