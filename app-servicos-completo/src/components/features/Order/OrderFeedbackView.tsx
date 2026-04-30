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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[100] bg-black flex flex-col pt-12">
      <div className="px-6 flex justify-between items-center mb-8">
        <button onClick={() => setSubView("none")} className="size-10 rounded-full bg-zinc-900 flex items-center justify-center text-white">
          <Icon name="close" />
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.2em]">Feedback Izi</p>
          <p className="text-xs text-zinc-500 font-bold">Pedido #DT-{String(orderId).slice(0,6).toUpperCase()}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 space-y-10 pb-10">
        <header className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none">Sua Experiência</h2>
          <p className="text-zinc-500 text-sm font-medium">Como foi o serviço hoje?</p>
        </header>

        <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px] space-y-5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
              <Icon name="storefront" className="text-yellow-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">{selectedItem?.merchant_name || 'Estabelecimento'}</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Avalie os produtos e preparo</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setShopRating(s)} className="p-1">
                <Icon name="star" className={`text-4xl transition-all duration-300 ${s <= shopRating ? 'text-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-zinc-800'}`} style={{ fontVariationSettings: s <= shopRating ? "'FILL' 1" : "'FILL' 0" }} />
              </button>
            ))}
          </div>
        </section>

        <section className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[32px] space-y-5">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
              <Icon name="delivery_dining" className="text-yellow-500" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-black text-sm uppercase tracking-wider">O Entregador</h4>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Avalie a agilidade e educação</p>
            </div>
          </div>
          <div className="flex justify-center gap-2">
            {[1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setDriverRating(s)} className="p-1">
                <Icon name="star" className={`text-4xl transition-all duration-300 ${s <= driverRating ? 'text-yellow-500 scale-110 drop-shadow-[0_0_8px_rgba(234,179,8,0.5)]' : 'text-zinc-800'}`} style={{ fontVariationSettings: s <= driverRating ? "'FILL' 1" : "'FILL' 0" }} />
              </button>
            ))}
          </div>
        </section>

        <div className="space-y-3">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Observações adicionais</label>
          <textarea 
            value={fbComment}
            onChange={(e) => setFbComment(e.target.value)}
            placeholder="Escreva algo sobre sua experiência..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-[24px] p-5 text-zinc-100 text-sm focus:border-yellow-500 outline-none transition-all min-h-[120px] resize-none"
          />
        </div>
      </div>

      <div className="p-6 bg-black border-t border-zinc-900">
        <button 
          onClick={handleSubmit}
          disabled={fbIsSubmitting}
          className={`w-full py-5 rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${fbIsSubmitting ? 'bg-zinc-800 text-zinc-500' : 'bg-yellow-500 text-black hover:shadow-[0_0_30px_rgba(234,179,8,0.3)] active:scale-95'}`}
        >
          {fbIsSubmitting ? 'Enviando...' : 'Confirmar Avaliação'}
          {!fbIsSubmitting && <Icon name="arrow_forward" className="text-sm" />}
        </button>
      </div>
    </motion.div>
  );
};
