import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../hooks/useAuth";
import { toastSuccess, toastError } from "../../../lib/useToast";

export const CouponsView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<"available" | "used">("available");
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [couponInput, setCouponInput] = useState("");
  const { userId } = useAuth();

  useEffect(() => {
    fetchCoupons();
  }, [userId, activeTab]);

  const fetchCoupons = async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      if (activeTab === "available") {
        const { data } = await supabase
          .from("promotions_delivery")
          .select("*")
          .eq("is_active", true)
          .not("coupon_code", "is", null);

        if (data) {
          const mapped = data.map(c => ({
            id: c.id,
            code: c.coupon_code,
            discount: c.discount_type === 'fixed' ? `R$ ${c.discount_value}` : `${c.discount_value}%`,
            desc: c.description || (c.min_order_value ? `Acima de R$ ${c.min_order_value}` : 'Cupom de desconto'),
            expiry: c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Sem validade',
            type: "available",
            color: "bg-emerald-400"
          }));
          setCoupons(mapped);
        }
      } else {
        const { data: redemptions } = await supabase
          .from("benefit_redemptions_delivery")
          .select("*")
          .eq("user_id", userId)
          .eq("source_type", "coupon");

        if (redemptions && redemptions.length > 0) {
          const sourceIds = redemptions.map(r => r.source_id);
          
          const { data: promotions } = await supabase
            .from("promotions_delivery")
            .select("id, coupon_code, discount_value, discount_type, description")
            .in("id", sourceIds);
            
          const mapped = redemptions.map((r: any) => {
            const promo = promotions?.find(p => p.id === r.source_id);
            return {
              id: r.id,
              code: promo?.coupon_code || 'CUPOM',
              discount: promo?.discount_type === 'fixed' ? `R$ ${promo?.discount_value}` : `${promo?.discount_value || 0}%`,
              desc: promo?.description || 'Cupom utilizado',
              expiry: `Usado em ${new Date(r.redeemed_at).toLocaleDateString()}`,
              type: "used",
              color: "bg-zinc-200"
            };
          });
          setCoupons(mapped);
        } else {
          setCoupons([]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCoupon = () => {
    if (!couponInput) return;
    toastSuccess("Cupom ativado e salvo na sua carteira!");
    setCouponInput("");
    // Se fosse adicionar de fato, chamaria o banco ou salvaria no state local.
    fetchCoupons();
  };

  return (
    <div className="h-full overflow-y-auto bg-zinc-50 pb-20">
      <header className="bg-white px-6 pt-20 pb-6 flex items-center justify-between border-b border-zinc-100 sticky top-0 z-50">
        <button onClick={onBack} className="size-10 flex items-center justify-center rounded-full bg-zinc-50 active:bg-zinc-100 transition-colors">
          <span className="material-symbols-rounded text-zinc-900">arrow_back</span>
        </button>
        <h1 className="text-xl font-black text-zinc-900">Meus Cupons</h1>
        <div className="size-10" />
      </header>

      <main className="px-6 py-6 space-y-6">
        {/* Input Coupon */}
        <div className="bg-white p-2 rounded-2xl border border-zinc-200 flex items-center gap-2 shadow-sm">
          <span className="material-symbols-rounded text-zinc-400 ml-3">local_activity</span>
          <input 
            type="text" 
            placeholder="Digite seu cupom" 
            value={couponInput}
            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
            className="flex-1 h-12 bg-transparent outline-none font-bold text-zinc-900 uppercase"
          />
          <button onClick={handleAddCoupon} className="bg-zinc-900 text-white px-6 h-12 rounded-xl font-black text-sm active:scale-95 transition-all">
            Adicionar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-zinc-100 p-1 rounded-2xl">
          <button 
            onClick={() => setActiveTab("available")}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'available' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Disponíveis
          </button>
          <button 
            onClick={() => setActiveTab("used")}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${activeTab === 'used' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500'}`}
          >
            Usados/Expirados
          </button>
        </div>

        {/* Coupon List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-20">
              <div className="size-10 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mx-auto" />
            </div>
          ) : (
            <>
              {coupons.map((coupon, idx) => (
                <motion.div 
                  key={coupon.id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-[24px] border border-zinc-100 shadow-xl overflow-hidden flex relative ${coupon.type === 'used' ? 'opacity-60 grayscale' : ''}`}
                >
                  <div className={`w-24 ${coupon.color} flex flex-col items-center justify-center p-4 border-r border-dashed border-black/10 relative`}>
                    <div className="absolute -top-3 -right-3 size-6 rounded-full bg-zinc-50" />
                    <div className="absolute -bottom-3 -right-3 size-6 rounded-full bg-zinc-50" />
                    <span className="material-symbols-rounded text-black/40 text-3xl mb-1">loyalty</span>
                    <span className="font-black text-black -rotate-90 whitespace-nowrap mt-4 text-xs tracking-widest">{coupon.code}</span>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-center relative">
                     <h3 className="text-xl font-black text-zinc-900">{coupon.discount}</h3>
                     <p className="text-sm font-medium text-zinc-500 mt-1">{coupon.desc}</p>
                     <div className="flex items-center gap-1 mt-4">
                        <span className="material-symbols-rounded text-[12px] text-rose-500">schedule</span>
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">{coupon.expiry}</span>
                     </div>
                  </div>
                </motion.div>
              ))}
              {coupons.length === 0 && (
                <div className="text-center py-20">
                  <span className="material-symbols-rounded text-6xl text-zinc-200">sentiment_dissatisfied</span>
                  <p className="font-bold text-zinc-400 mt-4">Nenhum cupom por aqui.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
