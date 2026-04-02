import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";

interface BeverageOffersViewProps {
  setSubView: (view: any) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  beverageOffers: any[];
  handleAddToCart: (item: any, e?: any) => void;
  getItemCount: (id: any) => number;
  beverageBanners: any[];
}

export const BeverageOffersView = ({
  setSubView,
  cart,
  navigateSubView,
  beverageOffers,
  handleAddToCart,
  getItemCount,
  beverageBanners,
}: BeverageOffersViewProps) => {
  const deals = beverageOffers;

  return (
    <div className="bg-black text-zinc-100 absolute inset-0 z-50 text-white flex flex-col hide-scrollbar overflow-y-auto pb-32">
      <header className="sticky top-0 z-[60] bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 p-6 flex items-center gap-6">
         <button 
          onClick={() => setSubView("beverages_list")}
          className="size-12 rounded-2xl bg-zinc-900/5 flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"
        >
          <Icon name="arrow_back" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-black tracking-tighter leading-none mb-1">Ofertas Geladas</h1>
          <p className="text-[10px] text-yellow-400 font-black uppercase tracking-[0.2em]">Seleção Premium de Ofertas</p>
        </div>
        <button onClick={() => cart.length > 0 && navigateSubView("cart")} className="relative size-12 rounded-2xl bg-zinc-900/5 border border-white/10 flex items-center justify-center group active:scale-95 transition-all">
          <Icon name="shopping_bag" />
          {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 size-6 bg-yellow-400 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-slate-950 shadow-xl">{cart.length}</span>}
        </button>
      </header>

      <main className="p-6 space-y-8">
          <div className="relative h-64 rounded-[50px] overflow-hidden group border border-white/10">
            <img 
              src={beverageBanners.length > 0 ? beverageBanners[0].image_url : "https://images.unsplash.com/photo-1470337458703-46ad1756a187?q=80&w=800"} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[3000ms]" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent flex flex-col justify-center px-10">
               <div className="flex items-center gap-2 mb-4">
                  <span className="bg-red-600 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Aproveite</span>
                  <span className="bg-yellow-400 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest w-fit">Limitado</span>
               </div>
               <h2 className="text-4xl font-black tracking-tighter leading-tight max-w-[250px] italic text-yellow-400">
                  {beverageBanners.length > 0 ? beverageBanners[0].title : "Liquidação de Verão"}
               </h2>
               <p className="text-[11px] font-bold text-white/60 mt-4 uppercase tracking-[0.2em]">
                  {beverageBanners.length > 0 ? beverageBanners[0].description : "Até 40% OFF em Packs Selecionados"}
               </p>
            </div>
          </div>

         <div className="grid grid-cols-1 gap-4 pt-2">
            {deals.map((item, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                key={item.id}
                className="bg-zinc-800 shadow-[10px_10px_24px_rgba(0,0,0,0.5),-5px_-5px_15px_rgba(255,255,255,0.02),inset_4px_4px_8px_rgba(255,255,255,0.03),inset_-4px_-4px_8px_rgba(0,0,0,0.4)] rounded-[32px] p-4 flex items-center gap-5 group transition-all duration-500 cursor-pointer relative overflow-hidden"
              >
                <div className="size-24 rounded-[22px] overflow-hidden shrink-0 shadow-[4px_4px_10px_rgba(0,0,0,0.5),inset_2px_2px_4px_rgba(255,255,255,0.1)] relative z-10">
                   <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" title={item.name} />
                   <div className="absolute top-2 left-2 bg-rose-600 text-white text-[9px] font-black px-2.5 py-1 rounded-xl shadow-lg border border-rose-500/30">-{item.off}</div>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                   <p className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1.5">{item.cat}</p>
                   <h3 className="text-[14px] font-black tracking-tight mb-2.5 leading-tight truncate text-white">{item.name}</h3>
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-[16px] font-black text-white leading-none mb-1">R$ {item.price.toFixed(2).replace(".", ",")}</span>
                         <span className="text-[11px] text-zinc-500 line-through font-bold">R$ {item.oldPrice.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            const btn = e.currentTarget;
                            btn.classList.add('scale-75', 'bg-yellow-500');
                            setTimeout(() => btn.classList.remove('scale-75', 'bg-yellow-500'), 200);
                            handleAddToCart(item, e);
                          }}
                          className="size-11 rounded-[16px] bg-yellow-400 text-black flex items-center justify-center transition-all shadow-[4px_4px_8px_rgba(0,0,0,0.4),inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(0,0,0,0.2)] active:scale-95 group/btn overflow-hidden"
                        >
                          <span className="material-symbols-outlined font-black text-xl z-10">
                            shopping_cart
                          </span>
                        </button>
                        {getItemCount(item.id) > 0 && (
                          <div className="bg-zinc-900 text-white size-8 rounded-xl flex items-center justify-center text-[11px] font-black shadow-[inset_1px_1px_4px_rgba(255,255,255,0.05),inset_-1px_-1px_4px_rgba(0,0,0,0.4)]">
                            {getItemCount(item.id)}
                          </div>
                        )}
                      </div>
                   </div>
                </div>
              </motion.div>
            ))}
         </div>
      </main>

      {/* MASTER CART CTA */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-8 pb-24 z-[70]">
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="max-w-[500px] mx-auto"
          >
            <button
              onClick={() => navigateSubView("cart")}
              className="w-full bg-yellow-400 h-[80px] rounded-[35px] px-2 flex items-center justify-between shadow-[0_30px_60px_-15px_rgba(255,193,7,0.4)] transition-all active:scale-[0.98] group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-zinc-900/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />
              
              <div className="flex items-center gap-4 ml-2">
                <div className="bg-black/10 text-white size-14 rounded-[24px] flex items-center justify-center font-black text-xl backdrop-blur-md">
                  {cart.length}
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-black text-white text-sm tracking-[0.2em] uppercase leading-none mb-1">CARRINHO</span>
                  <span className="text-[10px] font-bold text-black/50 uppercase tracking-widest">Finalizar Pedido</span>
                </div>
              </div>

              <div className="bg-black text-white h-14 px-8 rounded-[24px] flex items-center justify-center mr-2 shadow-2xl">
                <span className="font-black text-lg tracking-tight">
                  R$ {cart.reduce((a, b) => a + (b.price || 0), 0).toFixed(2).replace(".", ",")}
                </span>
              </div>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
