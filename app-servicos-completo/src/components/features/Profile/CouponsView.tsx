import React, { useState } from "react";
import { motion } from "framer-motion";

export const CouponsView = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<"available" | "used">("available");

  const coupons = [
    { code: "IZI10", discount: "R$ 10", desc: "Em pedidos acima de R$ 30", expiry: "Vence hoje", type: "available", color: "bg-yellow-400" },
    { code: "FRETE0", discount: "FRETE GRÁTIS", desc: "Para restaurantes parceiros", expiry: "Vence em 3 dias", type: "available", color: "bg-emerald-400" },
    { code: "BEMVINDO", discount: "20%", desc: "No seu primeiro pedido", expiry: "Usado", type: "used", color: "bg-zinc-200" }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 pb-20">
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
            className="flex-1 h-12 bg-transparent outline-none font-bold text-zinc-900 uppercase"
          />
          <button className="bg-zinc-900 text-white px-6 h-12 rounded-xl font-black text-sm">
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
          {coupons.filter(c => c.type === activeTab).map((coupon, idx) => (
            <motion.div 
              key={idx}
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
          {coupons.filter(c => c.type === activeTab).length === 0 && (
            <div className="text-center py-20">
              <span className="material-symbols-rounded text-6xl text-zinc-200">sentiment_dissatisfied</span>
              <p className="font-bold text-zinc-400 mt-4">Nenhum cupom por aqui.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
