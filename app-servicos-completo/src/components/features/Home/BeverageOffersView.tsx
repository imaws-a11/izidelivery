import { motion } from "framer-motion";
import { Icon } from "../../common/Icon";

interface BeverageOffersViewProps {
  setSubView: (view: any) => void;
  cart: any[];
  navigateSubView: (view: any) => void;
  beverageOffers: any[];
  handleAddToCart: (item: any) => void;
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
                className="bg-zinc-900/40 border border-white/5 rounded-3xl p-3.5 flex items-center gap-4 group hover:bg-zinc-900/60 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="size-24 rounded-2xl overflow-hidden shrink-0 shadow-xl relative z-10">
                   <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" title={item.name} />
                   <div className="absolute top-2 left-2 bg-red-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg backdrop-blur-md">-{item.off}</div>
                </div>
                <div className="flex-1 min-w-0 relative z-10">
                   <p className="text-[8px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1">{item.cat}</p>
                   <h3 className="text-sm font-black tracking-tight mb-2 leading-tight truncate text-white">{item.name}</h3>
                   <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                         <span className="text-base font-black text-yellow-400 leading-none mb-1">R$ {item.price.toFixed(2).replace(".", ",")}</span>
                         <span className="text-[10px] text-zinc-500 line-through font-bold">R$ {item.oldPrice.toFixed(2).replace(".", ",")}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddToCart(item); }}
                          className="size-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
                        >
                          <span className="material-symbols-outlined font-black text-lg">
                            {getItemCount(item.id) > 0 ? 'add_shopping_cart' : 'add'}
                          </span>
                        </button>
                        {getItemCount(item.id) > 0 && (
                          <div className="bg-zinc-800 text-white size-7 rounded-lg flex items-center justify-center text-[10px] font-black border border-white/10 shadow-lg">
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
