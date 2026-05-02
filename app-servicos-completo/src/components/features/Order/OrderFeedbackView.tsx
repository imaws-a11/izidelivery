import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../../hooks/useApp";
import { Icon } from "../../common/Icon";

export const OrderFeedbackView = () => {
  const { 
    subView, 
    setSubView, 
    selectedItem,
    shopRating,
    setShopRating,
    driverRating,
    setDriverRating,
    fbComment,
    setFbComment,
    fbIsSubmitting,
    setFbIsSubmitting,
    setUserXP,
    showToast,
    activeOrderId
  } = useApp();

  const handleSubmit = async () => {
    if (shopRating === 0 || driverRating === 0) { 
      showToast("Por favor, avalie o estabelecimento e o entregador.", "warning");
      return; 
    }
    
    setFbIsSubmitting(true);
    try {
      // Simulação de salvamento (a lógica original usava supabase)
      // await supabase.from("orders_delivery").update({ rating: shopRating, feedback: fbComment, driver_rating: driverRating }).eq("id", selectedItem.id);
      
      setUserXP((prev: number) => prev + 50);
      showToast("Obrigado pelo seu feedback! +50 XP", "success");
      setSubView("none");
    } catch (e) { 
      showToast("Erro ao enviar avaliação.", "warning");
    } finally {
      setFbIsSubmitting(false);
    }
  };

  if (subView !== "order_feedback") return null;

  const orderId = selectedItem?.id || activeOrderId || "000000";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="fixed inset-0 z-[100] bg-zinc-50 flex flex-col pt-6"
    >
      {/* HEADER */}
      <div className="px-6 flex justify-between items-center mb-8">
        <button 
          onClick={() => setSubView("none")} 
          className="size-12 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm active:scale-95 transition-all"
        >
          <Icon name="close" />
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black text-yellow-600 uppercase tracking-[0.2em]">Feedback Izi</p>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Pedido #{String(orderId).slice(0,6).toUpperCase()}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-8 pb-10">
        <header className="text-center space-y-2">
          <h2 className="text-4xl font-black text-zinc-900 tracking-tighter uppercase leading-none">Sua Experiência</h2>
          <p className="text-zinc-400 text-sm font-black uppercase tracking-widest">Como foi o serviço hoje?</p>
        </header>

        {/* SHOP RATING */}
        <section className="bg-white border border-zinc-100 p-8 rounded-[40px] space-y-6 shadow-[0_10px_30px_rgba(0,0,0,0.03),inset_0_2px_10px_rgba(255,255,255,1)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-16 rounded-[24px] bg-yellow-400/10 flex items-center justify-center shadow-inner">
              <Icon name="storefront" className="text-yellow-600" size={32} />
            </div>
            <div>
              <h4 className="text-zinc-900 font-black text-lg uppercase tracking-tight leading-none mb-1">{selectedItem?.merchant_name || 'Estabelecimento'}</h4>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Produtos e preparo</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setShopRating(s)} className="p-1 group">
                <Icon 
                  name="star" 
                  className={`text-4xl transition-all duration-300 ${s <= shopRating ? 'text-yellow-500 scale-125 drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]' : 'text-zinc-200 group-hover:text-zinc-300'}`} 
                  style={{ fontVariationSettings: s <= shopRating ? "'FILL' 1" : "'FILL' 0" }} 
                />
              </button>
            ))}
          </div>
        </section>

        {/* DRIVER RATING */}
        <section className="bg-white border border-zinc-100 p-8 rounded-[40px] space-y-6 shadow-[0_10px_30_rgba(0,0,0,0.03),inset_0_2px_10px_rgba(255,255,255,1)]">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="size-16 rounded-[24px] bg-zinc-900/5 flex items-center justify-center shadow-inner">
              <Icon name="delivery_dining" className="text-zinc-900" size={32} />
            </div>
            <div>
              <h4 className="text-zinc-900 font-black text-lg uppercase tracking-tight leading-none mb-1">O Entregador</h4>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Agilidade e educação</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setDriverRating(s)} className="p-1 group">
                <Icon 
                  name="star" 
                  className={`text-4xl transition-all duration-300 ${s <= driverRating ? 'text-yellow-500 scale-125 drop-shadow-[0_4px_12px_rgba(234,179,8,0.3)]' : 'text-zinc-200 group-hover:text-zinc-300'}`} 
                  style={{ fontVariationSettings: s <= driverRating ? "'FILL' 1" : "'FILL' 0" }} 
                />
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-3 px-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Algo a dizer?</label>
          <textarea 
            value={fbComment}
            onChange={(e) => setFbComment(e.target.value)}
            placeholder="Sua opinião nos ajuda a crescer..."
            className="w-full bg-white border border-zinc-100 rounded-[32px] p-6 text-zinc-900 text-sm font-medium focus:border-yellow-400 outline-none transition-all min-h-[140px] resize-none shadow-inner"
          />
        </div>
      </div>

      {/* FOOTER ACTION */}
      <div className="p-6 pb-12 bg-zinc-50/80 backdrop-blur-md border-t border-zinc-200/50">
        <button 
          onClick={handleSubmit}
          disabled={fbIsSubmitting}
          className={`w-full h-20 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-lg ${
            fbIsSubmitting 
              ? 'bg-zinc-200 text-zinc-400' 
              : 'bg-zinc-900 text-white hover:bg-black active:scale-[0.98] shadow-zinc-900/10'
          }`}
        >
          {fbIsSubmitting ? 'Enviando...' : 'Finalizar Avaliação'}
          {!fbIsSubmitting && <Icon name="check_circle" className="text-yellow-400" size={18} />}
        </button>
      </div>
    </motion.div>
  );
};
